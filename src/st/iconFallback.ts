/**
 * 字体图标兜底: 兼容各类酒馆第三方美化主题
 * \f02d = fa-book (书本图标)
 * \e0bb = fa-book-bookmark
 */
const ICON_UNICODE = '\\f02d';
const injected = new Set<string>();

export function ensureIconFallback(styleId: string, selector: string): void {
  if (injected.has(styleId) || document.getElementById(styleId)) {
    injected.add(styleId);
    return;
  }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
${selector}::before {
  content: '${ICON_UNICODE}' !important;
  font-family: 'Font Awesome 6 Free', 'Font Awesome 5 Free', 'FontAwesome' !important;
  font-weight: 900 !important;
  width: auto !important;
  height: auto !important;
  font-size: 16px !important;
  color: inherit !important;
  background: none !important;
  display: inline-block !important;
}
#novel-st-topbar-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
`;
  document.head.appendChild(style);
  injected.add(styleId);
}
