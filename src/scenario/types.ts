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
  identity: string; // 身份/官职/地位
  personality: string; // 性格特征/说话风格
  initialRelation: string; // 与主角初始关系/态度
  faction?: string; // 所属势力
  importance: 'protagonist' | 'major' | 'supporting' | 'minor'; // 主角/主要配角/重要配角/小配角
  summary: string; // 人物小传/关键经历与软肋
}

export interface L1Faction {
  id: string;
  name: string;
  leader?: string;
  stance: string; // 立场/阵营
  summary: string; // 势力介绍
}

export interface L1Term {
  id: string;
  name: string;
  category: 'location' | 'item' | 'concept' | 'custom'; // 地点/道具秘宝/概念/自定义
  content: string; // 详细解释
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
  background: string; // 时代背景与世界格局
  ruleSystem: string; // 规则体系与社会常识（法度、力量体系、阶层规矩）
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
