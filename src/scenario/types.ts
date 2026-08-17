export interface Chapter {
  id: string;
  index: number;
  title: string;
  content: string;
  charCount: number;
  selected: boolean;
}

export interface NovelSource {
  id: string;
  title: string;
  protagonist: string;
  totalChars: number;
  chapters: Chapter[];
  createdAt: number;
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
