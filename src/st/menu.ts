import { openNovelST } from '@/state/ui';
import { ensureIconFallback } from './iconFallback';

const MENU_ITEM_ID = 'novel-st-menu-item';
const TOPBAR_BTN_ID = 'novel-st-topbar-button';
const STYLE_ID = 'novel-st-topbar-style';

function ensureStyle(): void {
  ensureIconFallback(STYLE_ID, `#top-settings-holder #${TOPBAR_BTN_ID} .drawer-icon.fa-solid`);
}

/**
 * 往 ST 顶栏 (#top-settings-holder) 注入快速打开 Novel-ST 的按钮
 * 放置在「扩展/积木图标」(#extensions-settings-button) 旁边
 */
let pollTimer: any = null;

function buildButton(): HTMLElement {
  const btn = document.createElement('div');
  btn.id = TOPBAR_BTN_ID;
  btn.className = 'drawer';
  btn.title = 'Novel-ST 剧情沙盒';
  btn.innerHTML = `
    <div class="drawer-toggle">
      <div class="drawer-icon fa-solid fa-clapperboard fa-fw closedIcon" title="Novel-ST 剧情沙盒"></div>
    </div>
  `;

  btn.querySelector('.drawer-toggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openNovelST('settings');
  });

  return btn;
}

function tryInjectTopBar(): boolean {
  const holder = document.getElementById('top-settings-holder');
  if (!holder) return false;
  if (document.getElementById(TOPBAR_BTN_ID)) return true;

  ensureStyle();
  const btn = buildButton();

  // 优先放在「拓展」(#extensions-settings-button) 图标旁边
  const extensionsBtn = document.getElementById('extensions-settings-button');
  if (extensionsBtn) {
    extensionsBtn.after(btn);
    return true;
  }

  // 兜底放在「用户设定」左边
  const persona = document.getElementById('persona-management-button');
  if (persona) {
    persona.before(btn);
    return true;
  }

  holder.appendChild(btn);
  return true;
}

export function syncTopBarButton(enabled = true): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (!enabled) {
    document.getElementById(TOPBAR_BTN_ID)?.remove();
    return;
  }

  if (tryInjectTopBar()) {
    // 即使注入了，如果当时 extensionsBtn 还没渲染导致插入到了末尾，等 extensionsBtn 出现时移动过去
    const extensionsBtn = document.getElementById('extensions-settings-button');
    const myBtn = document.getElementById(TOPBAR_BTN_ID);
    if (extensionsBtn && myBtn && myBtn.previousElementSibling !== extensionsBtn) {
      extensionsBtn.after(myBtn);
    }
  }

  let attempts = 0;
  pollTimer = setInterval(() => {
    const extensionsBtn = document.getElementById('extensions-settings-button');
    const myBtn = document.getElementById(TOPBAR_BTN_ID);

    if (extensionsBtn && myBtn) {
      if (myBtn.previousElementSibling !== extensionsBtn) {
        extensionsBtn.after(myBtn);
      }
      clearInterval(pollTimer);
      pollTimer = null;
      return;
    }

    if (tryInjectTopBar() && ++attempts > 40) {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 500);
}

/**
 * 往 ST 的 #extensionsMenu (魔杖菜单) 注入入口
 */
export function injectExtensionsMenu() {
  const tryInject = () => {
    const $ = (window as any).$;
    const $menu = $ ? $('#extensionsMenu') : null;
    if (!$menu || $menu.length === 0) return false;
    if ($(`#${MENU_ITEM_ID}`).length > 0) return true;

    const $item = $(`
      <div class="extension_container interactable" tabindex="0">
        <a id="${MENU_ITEM_ID}" class="list-group-item" href="#" title="Novel-ST 剧情沙盒">
          <i class="fa-solid fa-clapperboard"></i>
          <span>Novel-ST 剧情沙盒</span>
        </a>
      </div>
    `);

    $item.on('click', (e: any) => {
      e.preventDefault();
      openNovelST('settings');
    });

    $menu.append($item);
    return true;
  };

  if (!tryInject()) {
    let attempts = 0;
    const interval = setInterval(() => {
      if (tryInject() || ++attempts > 40) clearInterval(interval);
    }, 500);
  }
}
