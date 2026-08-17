import { getContext } from '@/st/context';
import { reactive, watch } from 'vue';

export interface ApiChannel {
  id: string;
  name: string;
  url: string;
  key: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutSec: number;
}

export interface NovelSTSettings {
  enabled: boolean;
  
  // Task Channel Assignments ('' means follow Main API)
  directorChannel: string; // 剧情裁判/导演
  parserChannel: string;   // 分镜提取/清洗
  summaryChannel: string;  // 动态记忆总结
  sequelChannel: string;   // 烂尾续写/番外生成

  // Secondary API Channels
  channels: ApiChannel[];

  // General Settings
  autoEvaluate: boolean;
  evaluateInterval: number;
  divergenceThreshold: number; // 0 ~ 100
  showHud: boolean;
  showTopBarButton: boolean;
  hudPosition: 'left' | 'right' | 'float';

  // Scenario & Cleaning
  chunkSize: number;
  extractOutcomes: boolean;
  extractCharacterState: boolean;

  // Dual-track Memory
  spoilerProtection: boolean;
  ifPriority: boolean;
  dynamicMasking: boolean;

  // Prompts
  directorPrompt: string;
  cleanerPrompt: string;
  oocGuidePrompt: string;
  sequelPrompt: string;
}

export function createNewChannel(name = '新渠道'): ApiChannel {
  return {
    id: 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name,
    url: 'https://api.openai.com/v1',
    key: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    timeoutSec: 120,
  };
}

const DEFAULT_SETTINGS: NovelSTSettings = {
  enabled: true,

  directorChannel: '',
  parserChannel: '',
  summaryChannel: '',
  sequelChannel: '',

  channels: [
    {
      id: 'default_silicon',
      name: '硅基流动 (示例)',
      url: 'https://api.siliconflow.cn/v1',
      key: '',
      model: 'deepseek-ai/DeepSeek-V3',
      temperature: 0.7,
      maxTokens: 2048,
      timeoutSec: 120,
    },
  ],

  autoEvaluate: true,
  evaluateInterval: 2,
  divergenceThreshold: 70,
  showHud: true,
  showTopBarButton: true,
  hudPosition: 'right',

  chunkSize: 2500,
  extractOutcomes: true,
  extractCharacterState: true,

  spoilerProtection: true,
  ifPriority: true,
  dynamicMasking: true,

  directorPrompt: `你是一个中立严谨的【小说剧情导演与因果裁判】。
你的任务是根据当前剧本分镜的【原著预期走向】与【玩家最近对话】，判定当前剧情进展：
1. 玩家是否已达成原著核心目标；
2. 玩家的言行是否导致情节偏离原著（计算偏离度 0~100% 并说明蝴蝶效应原因）；
3. 输出下一阶段的剧外引导建议。`,

  cleanerPrompt: `你是一个专业的小说分镜与剧本解析器。
请将输入的长篇小说文本切分为连续的剧本节点（Scene Nodes），提取：
1. 场景时空与在场角色初始状态；
2. 原著发生的事件与预期因果走向（Canon Expected Outcomes）；
3. 玩家可介入的转折点（Beats）。`,

  oocGuidePrompt: `你负责为玩家生成【剧外锦囊】（OOC Guide）。
请用 1~2 句话简要提示玩家：在当前情境下原著主角做出的经典选择/台词，帮助玩家不翻书也能顺畅演下去。`,

  sequelPrompt: `你是一个【烂尾小说救赎与IF线番外推演引擎】。
根据前序未闭合的伏笔和玩家创造的因果变轨，合理推演后续大纲走向，确保逻辑严密、情感充沛。`,
};

export const novelSettings = reactive<NovelSTSettings>({ ...DEFAULT_SETTINGS });

let isHydrated = false;

export function hydrateSettings() {
  const ctx = getContext();
  if (!ctx) return;

  if (!ctx.extension_settings) {
    ctx.extension_settings = {};
  }

  const saved = ctx.extension_settings.novel_st;
  if (saved && typeof saved === 'object') {
    Object.assign(novelSettings, saved);
    if (!Array.isArray(novelSettings.channels)) {
      novelSettings.channels = [];
    }
  } else {
    ctx.extension_settings.novel_st = { ...novelSettings };
    ctx.saveSettingsDebounced?.();
  }

  isHydrated = true;
}

// Auto-save changes to SillyTavern extension_settings
watch(
  novelSettings,
  (val) => {
    if (!isHydrated) return;
    const ctx = getContext();
    if (ctx && ctx.extension_settings) {
      ctx.extension_settings.novel_st = JSON.parse(JSON.stringify(val));
      ctx.saveSettingsDebounced?.();
    }
  },
  { deep: true }
);
