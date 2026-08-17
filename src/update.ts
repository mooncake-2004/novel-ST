import { reactive } from 'vue';
import { getContext } from '@/st/context';
import { PLUGIN_VERSION } from '@/version';
import { toast } from '@/st/toast';

const REMOTE_MANIFEST_URL = 'https://raw.githubusercontent.com/mooncake-2004/novel-ST/main/manifest.json';

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
  const pa = a.split('.').map(n => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

async function readRemoteVersion(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const resp = await fetch(`${REMOTE_MANIFEST_URL}?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal,
      });
      if (!resp.ok) return '';
      const json = (await resp.json()) as { version?: string };
      return String(json?.version ?? '').trim();
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return '';
  }
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
          toast(`发现新版本 v${latest}，请点击更新`, 'info');
        } else {
          toast(`当前已是最新版本 (v${PLUGIN_VERSION})`, 'success');
        }
      }
    } else if (manual) {
      toast('无法连接到 GitHub 检查版本', 'warning');
    }
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

export async function performUpdate(): Promise<void> {
  if (updateState.updating) return;
  updateState.updating = true;
  try {
    const folder = extensionFolderName();
    const ctx = getContext();
    const headers = ctx?.getRequestHeaders?.() ?? { 'Content-Type': 'application/json' };
    
    // Check extension discover
    let isGlobal = false;
    try {
      const discResp = await fetch('/api/extensions/discover', { method: 'GET', headers, cache: 'no-store' });
      if (discResp.ok) {
        const list = await discResp.json();
        const hit = Array.isArray(list) ? list.find((x: any) => x?.name === `third-party/${folder}` || x?.name?.includes(folder)) : null;
        if (hit && hit.type === 'global') isGlobal = true;
      }
    } catch {}

    const resp = await fetch('/api/extensions/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ extensionName: folder, global: isGlobal }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || resp.statusText || `HTTP ${resp.status}`);
    }

    toast('更新成功，正在刷新页面...', 'success');
    updateState.available = false;
    setTimeout(() => location.reload(), 1000);
  } catch (err: any) {
    toast(`更新失败: ${err.message || err}`, 'error');
  } finally {
    updateState.updating = false;
  }
}
