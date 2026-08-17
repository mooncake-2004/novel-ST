import { reactive, watch } from 'vue';
import { getContext } from '@/st/context';
import type { NovelSource, ScenarioPack, SceneNode } from './types';

const SOURCE_STORAGE_KEY = 'novel_st_source_v1';
const SCENARIO_STORAGE_KEY = 'novel_st_active_scenario_v1';

export const scenarioStore = reactive<{
  source: NovelSource | null;
  activeScenario: ScenarioPack | null;
  savedScenarios: ScenarioPack[];
  isLoading: boolean;
}>({
  source: null,
  activeScenario: null,
  savedScenarios: [],
  isLoading: false,
});

/**
 * 从本地或 ST 加载持久化数据
 */
export function loadScenarioStore(): void {
  try {
    const rawSrc = localStorage.getItem(SOURCE_STORAGE_KEY);
    if (rawSrc) {
      scenarioStore.source = JSON.parse(rawSrc);
    }
  } catch (e) {
    console.warn('[Novel-ST] Failed to load source from storage', e);
  }

  try {
    const rawSc = localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (rawSc) {
      scenarioStore.activeScenario = JSON.parse(rawSc);
    }
  } catch (e) {
    console.warn('[Novel-ST] Failed to load active scenario', e);
  }
}

/**
 * 保存导入的小说源数据
 */
export function saveNovelSource(source: NovelSource): void {
  scenarioStore.source = source;
  try {
    localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(source));
    const ctx = getContext();
    if (ctx?.extensionSettings) {
      if (!ctx.extensionSettings['novel_st']) ctx.extensionSettings['novel_st'] = {};
      ctx.extensionSettings['novel_st'].lastNovelSource = {
        id: source.id,
        title: source.title,
        protagonist: source.protagonist,
        totalChars: source.totalChars,
        chapterCount: source.chapters.length,
      };
    }
  } catch (e) {
    console.error('[Novel-ST] Save novel source error', e);
  }
}

/**
 * 保存并激活剧本包
 */
export function saveActiveScenario(pack: ScenarioPack): void {
  scenarioStore.activeScenario = pack;
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(pack));
    const ctx = getContext();
    if (ctx?.extensionSettings) {
      if (!ctx.extensionSettings['novel_st']) ctx.extensionSettings['novel_st'] = {};
      ctx.extensionSettings['novel_st'].activeScenario = pack;
    }
  } catch (e) {
    console.error('[Novel-ST] Save active scenario error', e);
  }
}

/**
 * 清除当前小说与剧本
 */
export function clearCurrentNovel(): void {
  scenarioStore.source = null;
  scenarioStore.activeScenario = null;
  try {
    localStorage.removeItem(SOURCE_STORAGE_KEY);
    localStorage.removeItem(SCENARIO_STORAGE_KEY);
  } catch {}
}
