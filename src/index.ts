import { createApp, watch } from 'vue';
import App from '@/App.vue';
import { hydrateSettings, novelSettings } from '@/api/settings';
import { loadScenarioStore } from '@/scenario/store';
import { injectExtensionsMenu, syncTopBarButton } from '@/st/menu';
import { initTheme } from '@/state/ui';
import '@/styles/base.css';
import '@/styles/theme.css';

const HOST_ID = 'novel-st-host';

function mountApp() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
  }

  host.style.setProperty('display', 'contents', 'important');

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  shadow.textContent = '';

  // Inject bundled styles into Shadow Root
  const currentScriptUrl = import.meta.url;
  const styleUrl = new URL('./index.css', currentScriptUrl).href;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = styleUrl;
  shadow.appendChild(link);

  const container = document.createElement('div');
  shadow.appendChild(container);

  const app = createApp(App);
  app.mount(container);

  initTheme();
}

function initNovelST(attempt = 0) {
  if (typeof window !== 'undefined' && (window as any).SillyTavern?.getContext) {
    try {
      console.log('[Novel-ST] 正在挂载插件...');
      hydrateSettings();
      loadScenarioStore();
      mountApp();
      injectExtensionsMenu();
      syncTopBarButton(novelSettings.showTopBarButton);

      // Watch setting changes
      watch(
        () => novelSettings.showTopBarButton,
        (val) => {
          syncTopBarButton(val);
        }
      );

      console.log('[Novel-ST] 插件挂载完成！');
    } catch (e) {
      console.error('[Novel-ST] 初始化失败:', e);
    }
    return;
  }

  if (attempt > 40) {
    mountApp();
    syncTopBarButton(true);
    return;
  }

  setTimeout(() => initNovelST(attempt + 1), 500);
}

// Start extension
if (typeof window !== 'undefined') {
  const $ = (window as any).$;
  if ($) {
    $(() => initNovelST());
  } else {
    window.addEventListener('DOMContentLoaded', () => initNovelST());
  }
}
