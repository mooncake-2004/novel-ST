import { reactive } from 'vue';
import { getContext } from '@/st/context';
import { dbDeleteNovel, dbGetAllNovels, dbGetNovel, dbSaveNovel } from './db';
import type { NovelSource, ScenarioPack } from './types';

const ACTIVE_NOVEL_ID_KEY = 'novel_st_active_novel_id_v1';

export const scenarioStore = reactive<{
  source: NovelSource | null;
  novelsList: NovelSource[];
  activeNovelId: string | null;
  activeScenario: ScenarioPack | null;
  isLoading: boolean;
}>({
  source: null,
  novelsList: [],
  activeNovelId: null,
  activeScenario: null,
  isLoading: false,
});

/**
 * 初始化小说库与活跃小说
 */
export async function loadScenarioStore(): Promise<void> {
  scenarioStore.isLoading = true;
  try {
    // 1. 从 IndexedDB 加载所有已录入的小说清单
    const list = await dbGetAllNovels();
    scenarioStore.novelsList = list;

    // 2. 读取当前活跃小说 ID
    let activeId = localStorage.getItem(ACTIVE_NOVEL_ID_KEY);
    const ctx = getContext();
    if (ctx?.extensionSettings?.['novel_st']?.activeNovelId) {
      activeId = ctx.extensionSettings['novel_st'].activeNovelId;
    }

    // 3. 匹配活跃小说
    if (activeId) {
      const found = list.find((n) => n.id === activeId);
      if (found) {
        scenarioStore.activeNovelId = found.id;
        scenarioStore.source = found;
      } else if (list.length > 0) {
        scenarioStore.activeNovelId = list[0].id;
        scenarioStore.source = list[0];
      } else {
        scenarioStore.activeNovelId = null;
        scenarioStore.source = null;
      }
    } else if (list.length > 0) {
      scenarioStore.activeNovelId = list[0].id;
      scenarioStore.source = list[0];
    } else {
      scenarioStore.activeNovelId = null;
      scenarioStore.source = null;
    }
  } catch (e) {
    console.error('[Novel-ST] Failed to init novel library store', e);
  } finally {
    scenarioStore.isLoading = false;
  }
}

/**
 * 切换活跃小说（换过去 / 换回来）
 */
export async function switchActiveNovel(id: string): Promise<void> {
  scenarioStore.isLoading = true;
  try {
    const novel = await dbGetNovel(id);
    if (novel) {
      scenarioStore.activeNovelId = novel.id;
      scenarioStore.source = novel;

      // 持久化活跃 ID
      localStorage.setItem(ACTIVE_NOVEL_ID_KEY, novel.id);
      const ctx = getContext();
      if (ctx?.extensionSettings) {
        if (!ctx.extensionSettings['novel_st']) ctx.extensionSettings['novel_st'] = {};
        ctx.extensionSettings['novel_st'].activeNovelId = novel.id;
      }
    }
  } catch (e) {
    console.error('[Novel-ST] Switch active novel failed', e);
  } finally {
    scenarioStore.isLoading = false;
  }
}

/**
 * 保存新录入的小说并自动切换为活跃小说
 */
export async function saveNovelSource(source: NovelSource): Promise<void> {
  scenarioStore.isLoading = true;
  try {
    // 存入 IndexedDB
    await dbSaveNovel(source);

    // 重新从数据库拉取最新列表，保证数据完全一致
    const list = await dbGetAllNovels();
    scenarioStore.novelsList = list;

    // 切换当前激活
    scenarioStore.activeNovelId = source.id;
    scenarioStore.source = source;

    localStorage.setItem(ACTIVE_NOVEL_ID_KEY, source.id);
    const ctx = getContext();
    if (ctx?.extensionSettings) {
      if (!ctx.extensionSettings['novel_st']) ctx.extensionSettings['novel_st'] = {};
      ctx.extensionSettings['novel_st'].activeNovelId = source.id;
    }
  } catch (e) {
    console.error('[Novel-ST] Save novel source failed', e);
    throw e;
  } finally {
    scenarioStore.isLoading = false;
  }
}

/**
 * 重命名或编辑小说基本信息
 */
export async function updateNovelMeta(id: string, title: string, protagonist: string): Promise<void> {
  const novel = await dbGetNovel(id);
  if (!novel) return;

  novel.title = title;
  novel.protagonist = protagonist;
  novel.createdAt = novel.createdAt || Date.now();

  await dbSaveNovel(novel);

  // 刷新列表与当前
  const list = await dbGetAllNovels();
  scenarioStore.novelsList = list;
  if (scenarioStore.activeNovelId === id) {
    scenarioStore.source = novel;
  }
}

/**
 * 删除某本小说
 */
export async function deleteNovelSource(id: string): Promise<void> {
  await dbDeleteNovel(id);
  const list = await dbGetAllNovels();
  scenarioStore.novelsList = list;

  if (scenarioStore.activeNovelId === id) {
    if (list.length > 0) {
      await switchActiveNovel(list[0].id);
    } else {
      scenarioStore.activeNovelId = null;
      scenarioStore.source = null;
      localStorage.removeItem(ACTIVE_NOVEL_ID_KEY);
    }
  }
}

/**
 * 清除所有小说与缓存
 */
export async function clearAllNovels(): Promise<void> {
  for (const n of scenarioStore.novelsList) {
    await dbDeleteNovel(n.id);
  }
  scenarioStore.novelsList = [];
  scenarioStore.activeNovelId = null;
  scenarioStore.source = null;
  localStorage.removeItem(ACTIVE_NOVEL_ID_KEY);
}
