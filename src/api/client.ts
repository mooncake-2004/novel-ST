import { getContext } from '@/st/context';
import { novelSettings, type ApiChannel } from './settings';

const GENERATE_URL = '/api/backends/chat-completions/generate';
const STATUS_URL = '/api/backends/chat-completions/status';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ApiCallResult {
  text: string;
  source: string;
  latencyMs: number;
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 规范化 OpenAI 兼容 base url:
 * - 纯域名自动补 /v1;
 * - 已带路径的地址原样保留;
 * - 移除末尾斜杠和多余的 /chat/completions
 */
export function normalizeBaseUrl(url: string): string {
  const u = (url || '').trim().replace(/\/+$/, '');
  if (!u) return 'https://api.openai.com/v1';
  if (/\/chat\/completions$/i.test(u)) return u.replace(/\/chat\/completions$/i, '');
  if (/^https?:\/\/[^/?#]+$/i.test(u)) return `${u}/v1`;
  return u;
}

function alternateUrl(url: string): string {
  return /\/v1$/i.test(url) ? url.replace(/\/v1$/i, '') : `${url}/v1`;
}

function extractContent(data: any): string {
  return (
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.content ??
    ''
  ).trim();
}

/**
 * 通过 ST 服务端代理请求 OpenAI 兼容端点
 */
export async function callSubApi(
  channel: ApiChannel,
  messages: ChatMessage[],
  customUrl?: string
): Promise<string> {
  const ctx = getContext();
  if (!ctx) throw new ApiError('SillyTavern 上下文不可用');
  if (!channel.url) throw new ApiError('请先填写 Base URL 地址');

  const reverseProxy = customUrl || normalizeBaseUrl(channel.url);
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Math.max(1000, (channel.timeoutSec || 120) * 1000)
  );

  const body: Record<string, unknown> = {
    chat_completion_source: 'openai',
    reverse_proxy: reverseProxy,
    proxy_password: channel.key || '',
    model: channel.model || '',
    messages: messages,
    temperature: channel.temperature ?? 0.7,
    max_tokens: channel.maxTokens ?? 4096,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 0,
  };

  try {
    // 关键：必须携带 ctx.getRequestHeaders() 以通过 ST 后端安全/CSRF 认证
    const headers = {
      'Content-Type': 'application/json',
      ...(ctx.getRequestHeaders ? ctx.getRequestHeaders() : {}),
    };

    const resp = await fetch(GENERATE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new ApiError(`副 API 请求失败 (${resp.status}): ${text.slice(0, 300)}`, resp.status);
    }

    const data = await resp.json();
    if (data?.error) {
      const errMsg = typeof data.error === 'string' ? data.error : data.error.message;
      throw new ApiError(errMsg || '副 API 返回错误');
    }

    const content = extractContent(data);
    if (!content) throw new ApiError('副 API 返回空内容');
    return content;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError(`请求超时 (超过 ${channel.timeoutSec || 120} 秒)`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 拉取渠道模型列表 (走 ST 的 /status 代理端点)
 */
export async function fetchModels(channel: ApiChannel): Promise<string[]> {
  const ctx = getContext();
  if (!ctx) throw new ApiError('SillyTavern 上下文不可用');
  if (!channel.url) throw new ApiError('请先填写 Base URL 地址');

  const reverseProxy = normalizeBaseUrl(channel.url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const body = {
    chat_completion_source: 'openai',
    reverse_proxy: reverseProxy,
    proxy_password: channel.key || '',
  };

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(ctx.getRequestHeaders ? ctx.getRequestHeaders() : {}),
    };

    const resp = await fetch(STATUS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new ApiError(`拉取模型失败 (${resp.status}): ${text.slice(0, 200)}`, resp.status);
    }

    const data = await resp.json();
    if (data?.error && !Array.isArray(data?.data)) {
      throw new ApiError(data?.message || '拉取模型失败');
    }

    const list: unknown = data?.data ?? data?.models ?? [];
    if (!Array.isArray(list)) return [];
    return list
      .map((m: any) => (typeof m === 'string' ? m : m?.id || m?.name))
      .filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      .sort();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('获取模型列表超时');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 测试渠道连通性 (自动尝试规范化地址及备用 /v1 地址)
 */
export async function testChannel(
  channel: ApiChannel
): Promise<{ ok: boolean; latencyMs: number; error?: string; reply?: string }> {
  const start = performance.now();
  const primaryUrl = normalizeBaseUrl(channel.url);

  try {
    const reply = await callSubApi(
      channel,
      [{ role: 'user', content: '回复"OK"两个字符即可。' }],
      primaryUrl
    );
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs, reply: reply.slice(0, 50) };
  } catch (e: any) {
    // 遇到 404/405 时尝试备用 /v1 或去 /v1 地址
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
      const altUrl = alternateUrl(primaryUrl);
      if (altUrl && altUrl !== primaryUrl) {
        try {
          const reply = await callSubApi(
            channel,
            [{ role: 'user', content: '回复"OK"两个字符即可。' }],
            altUrl
          );
          channel.url = altUrl; // 自动修正为有效地址
          const latencyMs = Math.round(performance.now() - start);
          return { ok: true, latencyMs, reply: reply.slice(0, 50) };
        } catch {
          // 备用地址也失败，返回首个错误
        }
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, error: e.message || '连接失败' };
  }
}

/**
 * 调用主 API (跟随主会话模型)
 */
export async function callMainApi(prompt: string): Promise<string> {
  const ctx = getContext();
  if (!ctx) throw new ApiError('SillyTavern 上下文不可用');

  // 1. 优先使用 generateRaw (发送独立消息数组，不污染历史)
  if (typeof ctx.generateRaw === 'function') {
    const res = await ctx.generateRaw({
      prompt: [{ role: 'user', content: prompt }],
      responseLength: 4096,
    });
    if (res && res.trim()) return res.trim();
  }

  // 2. 备选使用 generateQuietPrompt
  if (typeof ctx.generateQuietPrompt === 'function') {
    const result = await ctx.generateQuietPrompt(prompt, true, false);
    return String(result || '').trim();
  }

  throw new ApiError('当前 ST 环境不支持后台静默调用主 API');
}

/**
 * 任务调度中心：根据配置指派给副渠道或回落到主 API
 */
export async function executeNovelTask(
  taskType: 'director' | 'parser' | 'summary' | 'sequel',
  systemPrompt: string,
  userPrompt: string
): Promise<ApiCallResult> {
  const channelKey = (taskType + 'Channel') as keyof Pick<
    typeof novelSettings,
    'directorChannel' | 'parserChannel' | 'summaryChannel' | 'sequelChannel'
  >;
  const assignedChannelId = novelSettings[channelKey];
  const channel = novelSettings.channels.find((c) => c.id === assignedChannelId);

  const start = performance.now();

  if (channel && channel.url && channel.model) {
    const text = await callSubApi(channel, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return {
      text,
      source: `副渠道 [${channel.name} (${channel.model})]`,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  // Fallback to Main API
  const combinedPrompt = `${systemPrompt}\n\n---\n${userPrompt}`;
  const text = await callMainApi(combinedPrompt);
  return {
    text,
    source: '主 API (当前会话模型)',
    latencyMs: Math.round(performance.now() - start),
  };
}
