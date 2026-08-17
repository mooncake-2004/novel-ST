export interface Chapter {
  id: string;
  index: number;
  title: string;
  content: string;
  charCount: number;
  selected: boolean;
}

export interface L1Character {
  id: string;
  name: string;
  aliases: string[];
  identity: string; // 首次登场时的表面身份/官职/地位（Day 0 原始状态）
  personality: string; // 核心性格特质、语言口吻风格
  initialRelation: string; // 首次登场时对主角的初始态度/关系（如冷漠/戒备/敌视/利用）
  faction?: string; // 首次登场时所属的原生势力（严禁填后期被主角接管的状态）
  firstAppearance?: string; // 首次出场章节与场景（如：第1章 · 司礼监 / 第25章 · 赏花宴）
  importance: 'protagonist' | 'major' | 'supporting' | 'minor'; // 主角/主要核心/重要配角/小配角
  summary: string; // 初始人物小传、固有软肋与性格底线（严禁包含后期剧情剧透与大结局）
}

export interface L1Faction {
  id: string;
  name: string;
  leader?: string; // 故事开局时的最初领袖（严禁填主角后期接管后的身份）
  stance: string; // 故事开局时的立场/阵营（如：朝廷鹰犬 / 中立门阀 / 皇权正统）
  summary: string; // 初始势力职能、核心特权与驻地
}

export interface L1Term {
  id: string;
  name: string;
  category: 'location' | 'item' | 'concept' | 'custom'; // 地点/道具秘宝/概念/自定义
  content: string; // 初始背景定义与渊源
}

export interface L1MacroArc {
  id: string;
  index: number;
  title: string;
  chapterRange: string;
  summary: string;
  coreConflict: string;
}

export interface L1Worldview {
  novelId: string;
  novelTitle: string;
  originalProtagonist: string;
  background: string; // 开局时代背景与世界初始格局
  ruleSystem: string; // 开局规则体系与社会常识（法度、力量体系、阶层规矩）
  factions: L1Faction[];
  characters: L1Character[];
  terms: L1Term[];
  macroArcs: L1MacroArc[];
  cleanedAt: number;
}

export interface NovelSource {
  id: string;
  title: string;
  protagonist: string;
  totalChars: number;
  chapters: Chapter[];
  createdAt: number;
  l1Worldview?: L1Worldview;
}

export interface CanonGoal {
  id: string;
  text: string;
  done: boolean;
  required: boolean;
}

export interface SceneNode {
  id: string;
  index: number;
  title: string;
  chapterIndex?: number;
  chapterTitle?: string;
  location: string;
  characters: string[];
  summary: string;
  status: 'active' | 'completed' | 'pending' | 'diverged';
  canonGoals: CanonGoal[];
  oocHint: string;
  canonExpectedOutcomes: {
    keyEvents: string[];
    characterStateChanges: Record<string, string>;
  };
  triggerNextCondition?: string;
}

export interface ScenarioPack {
  id: string;
  novelTitle: string;
  protagonist: string;
  worldLore?: string;
  activeSceneId: string;
  scenes: SceneNode[];
  createdAt: number;
  updatedAt: number;
}
