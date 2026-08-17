import type { Component } from 'vue';
import SettingsPage from './settings/index.vue';
import ScenarioPage from './scenario/index.vue';
import MemoryPage from './memory/index.vue';
import CharactersPage from './characters/index.vue';
import DivergencePage from './divergence/index.vue';

export interface PageDef {
  id: string;
  label: string;
  icon: string;
  component: Component;
}

export const PAGES: PageDef[] = [
  {
    id: 'scenario',
    label: '大纲分镜',
    icon: 'scenario',
    component: ScenarioPage,
  },
  {
    id: 'memory',
    label: '双轨记忆',
    icon: 'memory',
    component: MemoryPage,
  },
  {
    id: 'characters',
    label: '角色追踪',
    icon: 'characters',
    component: CharactersPage,
  },
  {
    id: 'divergence',
    label: 'IF演变·续写',
    icon: 'divergence',
    component: DivergencePage,
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    component: SettingsPage,
  },
];

export function getPage(id: string): PageDef {
  return PAGES.find((p) => p.id === id) || PAGES[PAGES.length - 1];
}
