import { reactive } from 'vue';
import { getContext } from '@/st/context';
import { PLUGIN_VERSION } from '@/version';
import { toast } from '@/st/toast';

const CURRENT_VERSION = PLUGIN_VERSION;

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
  statusText: string;
}>({
  current: CURRENT_VERSION,
  latest: '',
  available: false,
  checking: false,
  updating: false,
  statusText: '',
});

let checkedThisSession = false;

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

async function fetchFromUrl(url: string, timeoutMs = 4000): Promise<string> {
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
  for (const mirror of MANIFEST_MIRRORS) {
    const v = await fetchFromUrl(mirror, 3000);
    if (v) return v;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
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

export async function checkForUpdate(force = false): Promise<void> {
  if (updateState.checking) return;
  if (checkedThisSession && !force) return;
  updateState.checking = true;
  try {
    const latest = await readRemoteVersion();
    if (latest) {
      updateState.latest = latest;
      updateState.available = isNewer(latest, CURRENT_VERSION);
      if (force) {
        if (updateState.available) {
          toast.info(`发现新版本 v${latest}，准备更新`);
        } else {
          toast.info(`当前已是最新版本 (v${CURRENT_VERSION})`);
        }
      }
    } else if (force) {
      toast.warning('未能连接到 GitHub 检查最新版本');
    }
    checkedThisSession = true;
  } finally {
    updateState.checking = false;
  }
}

function extensionFolderName(): string {
  try {
    const path = new URL(import.meta.url).pathname;
    const marker = '/third-party/';
    const idx = path.indexOf(marker);
    if (idx >= 0) {
      const rest = path.slice(idx + marker.length);
      const folder = rest.split('/')[0];
      if (folder) return folder;
    }
  } catch {}
  return 'novel-ST';
}

async function discoverExtensionType(folder: string): Promise<'global' | 'local' | 'system' | null> {
  try {
    const headers = getContext()?.getRequestHeaders?.() ?? {};
    const resp = await fetch('/api/extensions/discover', { method: 'GET', headers, cache: 'no-store' });
    if (!resp.ok) return null;
    const list = (await resp.json()) as Array<{ name?: string; type?: string }>;
    if (!Array.isArray(list)) return null;
    const target = `third-party/${folder}`;
    const hit = list.find((x) => x?.name === target || x?.name?.toLowerCase().includes('novel-st'));
    const type = hit?.type;
    return type === 'global' || type === 'local' || type === 'system' ? type : null;
  } catch {
    return null;
  }
}

export async function performUpdate(): Promise<void> {
  if (updateState.updating) return;
  updateState.updating = true;
  updateState.statusText = '正在拉取最新代码...';
  
  try {
    const folder = extensionFolderName();
    const type = await discoverExtensionType(folder);
    const ctx = getContext();
    const headers = {
      'Content-Type': 'application/json',
      ...(ctx?.getRequestHeaders ? ctx.getRequestHeaders() : {}),
    };

    toast.info('正在从 GitHub 拉取更新，请稍候...', 'Novel-ST');

    const resp = await fetch('/api/extensions/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ extensionName: folder, global: type === 'global' }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || resp.statusText || `HTTP ${resp.status}`);
    }

    updateState.statusText = '更新成功，正在刷新...';
    toast.success('🎉 插件已更新至最新版本！即将自动刷新页面...', 'Novel-ST');
    updateState.available = false;

    // 延迟 1 秒后自动强制刷新页面加载最新产物
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (err: any) {
    updateState.statusText = '';
    toast.error(`更新失败: ${err.message || err}`, 'Novel-ST');
  } finally {
    updateState.updating = false;
  }
}
