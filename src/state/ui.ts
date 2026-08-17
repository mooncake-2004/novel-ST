import { reactive, ref } from 'vue';

export const modalHost = ref<HTMLElement | null>(null);

export type ThemeMode = 'light' | 'dark';

export interface UIState {
  isOpen: boolean;
  activeTab: string;
  theme: ThemeMode;
}

export const ui = reactive<UIState>({
  isOpen: false,
  activeTab: 'settings',
  theme: 'light',
});

export function openNovelST(tab = 'settings') {
  ui.activeTab = tab;
  ui.isOpen = true;
}

export function closeNovelST() {
  ui.isOpen = false;
}

export function toggleTheme() {
  ui.theme = ui.theme === 'light' ? 'dark' : 'light';
  try {
    localStorage.setItem('novel_st_theme', ui.theme);
  } catch {}
}

export function initTheme() {
  try {
    const saved = localStorage.getItem('novel_st_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light') {
      ui.theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      ui.theme = 'dark';
    }
  } catch {}
}
