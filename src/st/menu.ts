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
 * 插入在「用户设定」(#persona-management-button) 左侧
 */
let pollTimer: any = null;

function buildButton(): HTMLElement {
  const btn = document.createElement('div');
  btn.id = TOPBAR_BTN_ID;
  btn.className = 'drawer';
  btn.title = 'Novel-ST 剧情沙盒';
  btn.innerHTML = `
    <div class="drawer-toggle">
      <div class="drawer-icon fa-solid fa-book fa-fw closedIcon" title="Novel-ST 剧情沙盒"></div>
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
  const persona = document.getElementById('persona-management-button');
  if (persona) {
    persona.before(btn);
  } else {
    holder.appendChild(btn);
  }
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

  if (tryInjectTopBar()) return;

  let attempts = 0;
  pollTimer = setInterval(() => {
    if (tryInjectTopBar() || ++attempts > 40) {
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
          <i class="fa-solid fa-book"></i>
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
