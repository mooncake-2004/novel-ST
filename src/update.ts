import { reactive } from 'vue';
import { getContext } from '@/st/context';
import { PLUGIN_VERSION } from '@/version';
import { toast } from '@/st/toast';

const MANIFEST_MIRRORS = [
  'https://raw.githubusercontent.com/mooncake-2004/novel-ST/main/manifest.json',
  'https://gh-proxy.org/https://raw.githubusercontent.com/mooncake-2004/novel-ST/main/manifest.json',
  'https://cdn.jsdelivr.net/gh/mooncake-2004/novel-ST@main/manifest.json',
  'https://fastly.jsdelivr.net/gh/mooncake-2004/novel-ST@main/manifest.json',
];

export const updateState = reactive<{
  current: string;
  latest: string;
  available: boolean;
  checking: boolean;
  updating: boolean;
}>({
  current: PLUGIN_VERSION,
  latest: '',
  available: false,
  checking: false,
  updating: false,
});

function isNewer(a: string, b: string): boolean {
  if (!a || !b) return false;
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

async function fetchFromUrl(url: string, timeoutMs = 5000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!resp.ok) return '';
    const json = (await resp.json()) as { version?: string };
    return String(json?.version ?? '').trim();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function readRemoteVersion(): Promise<string> {
  // 逐个镜像快速尝试
  for (const mirror of MANIFEST_MIRRORS) {
    const v = await fetchFromUrl(mirror, 4000);
    if (v) return v;
  }

  // 兜底尝试 GitHub API
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const resp = await fetch('https://api.github.com/repos/mooncake-2004/novel-ST/contents/manifest.json', {
        method: 'GET',
        headers: { Accept: 'application/vnd.github.v3.raw' },
        cache: 'no-store',
        signal: ctrl.signal,
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.version) return String(json.version).trim();
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {}

  return '';
}

export async function checkForUpdate(manual = false): Promise<void> {
  if (updateState.checking) return;
  updateState.checking = true;
  try {
    const latest = await readRemoteVersion();
    if (latest) {
      updateState.latest = latest;
      updateState.available = isNewer(latest, PLUGIN_VERSION);
      if (manual) {
        if (updateState.available) {
          toast(`发现新版本 v${latest}，请点击「立即更新」`, 'info');
        } else {
          toast(`当前已是最新版本 (v${PLUGIN_VERSION})`, 'success');
        }
      }
    } else if (manual) {
      toast('无法连接到 GitHub 检查版本，请检查网络', 'warning');
    }
  } finally {
    updateState.checking = false;
  }
}

/**
 * 探测本扩展在 SillyTavern 中的实际文件夹名与安装类型
 */
async function getExtensionInfo(): Promise<{ folder: string; isGlobal: boolean }> {
  const ctx = getContext();
  const headers = ctx?.getRequestHeaders?.() ?? {};
  
  let folder = 'novel-ST';
  let isGlobal = false;

  try {
    // 1. 从 import.meta.url 解析
    const path = new URL(import.meta.url).pathname;
    const marker = '/third-party/';
    const idx = path.indexOf(marker);
    if (idx >= 0) {
      const rest = path.slice(idx + marker.length);
      const parsedFolder = rest.split('/')[0];
      if (parsedFolder) folder = parsedFolder;
    }
  } catch {}

  try {
    // 2. 从 ST discover 列表精准匹配
    const resp = await fetch('/api/extensions/discover', { method: 'GET', headers, cache: 'no-store' });
    if (resp.ok) {
      const list = await resp.json();
      if (Array.isArray(list)) {
        const hit = list.find(
          (x: any) =>
            x?.name === `third-party/${folder}` ||
            x?.name?.toLowerCase().includes('novel-st') ||
            x?.name?.toLowerCase().includes('novel_st')
        );
        if (hit) {
          if (hit.name) {
            folder = hit.name.replace(/^third-party\//, '');
          }
          if (hit.type === 'global') {
            isGlobal = true;
          }
        }
      }
    }
  } catch {}

  return { folder, isGlobal };
}

export async function performUpdate(): Promise<void> {
  if (updateState.updating) return;
  updateState.updating = true;
  try {
    const { folder, isGlobal } = await getExtensionInfo();
    const ctx = getContext();
    const headers = {
      'Content-Type': 'application/json',
      ...(ctx?.getRequestHeaders ? ctx.getRequestHeaders() : {}),
    };

    toast('正在通过 SillyTavern 拉取最新代码...', 'info');

    const resp = await fetch('/api/extensions/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ extensionName: folder, global: isGlobal }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || resp.statusText || `HTTP ${resp.status}`);
    }

    toast('🎉 更新成功，正在自动刷新页面...', 'success');
    updateState.available = false;
    setTimeout(() => location.reload(), 1200);
  } catch (err: any) {
    toast(`更新失败: ${err.message || err}`, 'error');
  } finally {
    updateState.updating = false;
  }
}
