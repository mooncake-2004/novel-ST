import { getContext } from '@/st/context';
import { novelSettings, type ApiChannel } from './settings';

const ST_PROXY_URL = '/api/backends/chat-completions/generate';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ApiCallResult {
  text: string;
  source: string;
  latencyMs: number;
}

/**
 * Normalize OpenAI-compatible base URL
 */
export function normalizeBaseUrl(url: string): string {
  let u = (url || '').trim().replace(/\/+$/, '');
  if (!u) return 'https://api.openai.com/v1';
  if (u.endsWith('/chat/completions')) {
    u = u.slice(0, -'/chat/completions'.length);
  }
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  return u;
}

/**
 * Fetch available models from an OpenAI-compatible endpoint
 */
export async function fetchModels(channel: ApiChannel): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(channel.url);
  const modelsUrl = `${baseUrl}/models`;

  try {
    const res = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        Authorization: channel.key ? `Bearer ${channel.key}` : '',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((m: any) => m.id || m.name).filter(Boolean);
    }
    if (Array.isArray(data)) {
      return data.map((m: any) => m.id || m.name || m).filter(Boolean);
    }
    return [];
  } catch (err: any) {
    // If browser direct call fails due to CORS, return error message
    console.warn('[Novel-ST] Direct /models fetch failed:', err.message);
    throw err;
  }
}

/**
 * Test connectivity and response latency of an API channel
 */
export async function testChannel(
  channel: ApiChannel
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const res = await callSubApi(channel, [
      { role: 'system', content: 'You are a test helper. Reply with single word: OK' },
      { role: 'user', content: 'Ping' },
    ]);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, error: err.message || '连接失败' };
  }
}

/**
 * Call Sub-API using SillyTavern server-side proxy
 */
export async function callSubApi(
  channel: ApiChannel,
  messages: ChatMessage[]
): Promise<string> {
  const baseUrl = normalizeBaseUrl(channel.url);
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    (channel.timeoutSec || 120) * 1000
  );

  try {
    const payload = {
      chat_completion_source: 'openai',
      reverse_proxy: baseUrl,
      proxy_password: channel.key,
      model: channel.model,
      messages: messages,
      temperature: channel.temperature ?? 0.7,
      max_tokens: channel.maxTokens ?? 2048,
      stream: false,
    };

    const res = await fetch(ST_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`副 API 请求失败 (${res.status}): ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      data.content ||
      data.text ||
      '';
    return String(reply).trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Main API using SillyTavern's native generateQuietPrompt
 */
export async function callMainApi(prompt: string): Promise<string> {
  const ctx = getContext();
  if (!ctx || typeof ctx.generateQuietPrompt !== 'function') {
    throw new Error('SillyTavern 主 API 尚未就绪或不支持 generateQuietPrompt');
  }

  const result = await ctx.generateQuietPrompt(prompt, true, false);
  return String(result || '').trim();
}

/**
 * Dispatch task to either designated Sub-API channel or fallback to Main API
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
    // Execute with assigned sub-channel
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
