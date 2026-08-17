import { createApp } from 'vue';
import App from '@/App.vue';
import { hydrateSettings } from '@/api/settings';
import { injectExtensionsMenu, injectTopBarButton } from '@/st/menu';
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
  if (typeof window !== 'undefined' && window.SillyTavern?.getContext) {
    try {
      console.log('[Novel-ST] 初始化挂载中...');
      hydrateSettings();
      mountApp();
      injectExtensionsMenu();
      injectTopBarButton();
      console.log('[Novel-ST] 初始化就绪！');
    } catch (e) {
      console.error('[Novel-ST] 初始化失败:', e);
    }
    return;
  }

  if (attempt > 30) {
    // If running in standalone preview or ST slow start
    mountApp();
    return;
  }

  setTimeout(() => initNovelST(attempt + 1), 500);
}

// Start extension
if (typeof window !== 'undefined') {
  if (window.$) {
    window.$(() => initNovelST());
  } else {
    window.addEventListener('DOMContentLoaded', () => initNovelST());
  }
}
