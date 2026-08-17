import { openNovelST } from '@/state/ui';

const MENU_ITEM_ID = 'novel-st-menu-item';
const TOPBAR_BTN_ID = 'novel-st-topbar-button';

/**
 * Inject entry item into SillyTavern extensions dropdown menu
 */
export function injectExtensionsMenu() {
  const tryInject = () => {
    const $menu = window.$ ? window.$('#extensionsMenu') : null;
    if (!$menu || $menu.length === 0) return false;
    if (window.$(`#${MENU_ITEM_ID}`).length > 0) return true;

    const $item = window.$(`
      <div class="extension_container interactable" tabindex="0">
        <a id="${MENU_ITEM_ID}" class="list-group-item" href="#" title="Novel-ST 剧情沙盒">
          <i class="fa-solid fa-book-open"></i>
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
    const interval = setInterval(() => {
      if (tryInject()) clearInterval(interval);
    }, 1000);
  }
}

/**
 * Inject quick icon into SillyTavern top bar
 */
export function injectTopBarButton() {
  const tryInject = () => {
    const $holder = window.$ ? window.$('#top-settings-holder') : null;
    if (!$holder || $holder.length === 0) return false;
    if (window.$(`#${TOPBAR_BTN_ID}`).length > 0) return true;

    const $btn = window.$(`
      <div id="${TOPBAR_BTN_ID}" class="drawer interactable" title="Novel-ST 剧情沙盒" tabindex="0">
        <div class="drawer-icon fa-solid fa-book-open"></div>
      </div>
    `);

    $btn.on('click', () => {
      openNovelST('settings');
    });

    $holder.prepend($btn);
    return true;
  };

  if (!tryInject()) {
    const interval = setInterval(() => {
      if (tryInject()) clearInterval(interval);
    }, 1000);
  }
}
