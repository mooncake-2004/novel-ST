import { executeNovelTask } from '@/api/client';
import type {
  L1Character,
  L1Faction,
  L1MacroArc,
  L1Term,
  L1Worldview,
  NovelSource,
} from './types';

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 智能采样小说文本构建提炼上下文：
 * 1. 完整章节目录 (TOC)
 * 2. 开篇 1~3 章完整正文 (确立世界基调与核心出场角色)
 * 3. 中期关键转折抽样章 (感知势力冲突与配角)
 * 4. 尾卷抽样章 (感知宏观全貌)
 */
export function buildNovelSampleContext(novel: NovelSource): string {
  const chapters = novel.chapters || [];
  if (!chapters.length) return '';

  // 1. 目录大纲
  const toc = chapters
    .map((c, idx) => `[第${idx + 1}章] ${c.title || `第${idx + 1}章`} (${c.charCount || c.content.length}字)`)
    .join('\n');

  // 2. 开篇正文 (最多前 3 章，合计不超过 15,000 字)
  const introChapters = chapters.slice(0, 3);
  const introText = introChapters
    .map((c, idx) => `=== 【开篇第${idx + 1}章：${c.title}】 ===\n${c.content.slice(0, 5000)}`)
    .join('\n\n');

  // 3. 中期抽样
  let midText = '';
  if (chapters.length > 6) {
    const midIdx = Math.floor(chapters.length / 2);
    const midCh = chapters[midIdx];
    midText = `=== 【中期转折抽样：${midCh.title}】 ===\n${midCh.content.slice(0, 4000)}`;
  }

  // 4. 后期抽样
  let lateText = '';
  if (chapters.length > 10) {
    const lateIdx = Math.floor(chapters.length * 0.8);
    const lateCh = chapters[lateIdx];
    lateText = `=== 【后期高潮抽样：${lateCh.title}】 ===\n${lateCh.content.slice(0, 3000)}`;
  }

  return `
《${novel.title}》全书概况与采样：
总字数：${novel.totalChars} 字
总章节：${chapters.length} 章
玩家预设扮演角色：${novel.protagonist || '原著主角'}

【完整章节目录】：
${toc}

【采样正文切片】：
${introText}

${midText}

${lateText}
`.trim();
}

/**
 * 清洗并解析 JSON 结果
 */
function cleanAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  // 匹配 markdown ```json ... ``` 块
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  } else {
    // 寻找最外层的 { ... }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // 简单容错替换常见格式错误
    cleaned = cleaned
      .replace(/,\s*([\]}])/g, '$1') // 移除末尾逗号
      .replace(/[\u201C\u201D]/g, '"') // 替换中文双引号
      .replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(cleaned);
  }
}

/**
 * 提取 L1 静态世界观与全书图谱
 */
export async function extractL1Worldview(
  novel: NovelSource,
  customProtagonist?: string
): Promise<{ worldview: L1Worldview; source: string; latencyMs: number }> {
  const sampleContext = buildNovelSampleContext(novel);
  if (!sampleContext) {
    throw new Error('当前小说无有效章节内容，无法提炼世界观');
  }

  const systemPrompt = `你是一位资深网络文学架构师与互动剧本总导演。你的任务是通读给定的长篇小说目录与采样正文，全面提炼该小说的【L1 静态世界观基底与全书图谱】。

请务必输出严格合法的 JSON 对象，不要输出任何额外的解释性前言或后缀。

JSON 输出格式模板：
{
  "novelTitle": "${novel.title}",
  "originalProtagonist": "原著第一主角真实姓名",
  "background": "时代背景、地理格局、历史渊源与基本世界设定（400~800字，详尽严谨，还原原著氛围）",
  "ruleSystem": "规则体系与社会常识（包括朝廷法度、官职体系、力量/修仙/魔法层级、社会等级与不可触犯的禁忌常理，400~800字）",
  "factions": [
    {
      "name": "势力/组织名称（如：司礼监、锦衣卫、云岚宗、内阁、某世家）",
      "leader": "领袖/掌权者姓名",
      "stance": "在故事中的立场（如：朝廷鹰犬/中立/主角依靠/敌对）",
      "summary": "势力核心职能、特权、驻地与内部矛盾（100~200字）"
    }
  ],
  "characters": [
    {
      "name": "角色姓名",
      "aliases": ["别名", "外号", "尊称"],
      "identity": "表面身份与官职/地位",
      "personality": "性格特质、语言语气习惯与行事风格",
      "initialRelation": "与主角的初始关系与态度（防备/利用/关照/敌视/依恋等）",
      "faction": "所属势力名称",
      "importance": "protagonist / major / supporting / minor",
      "summary": "生平小传、核心秘密、不可触碰的软肋与不可退让的底线（100~200字）"
    }
  ],
  "terms": [
    {
      "name": "专有名词名称（如特定地点/官衔/信物/秘宝/阵法/功法）",
      "category": "location / item / concept / custom",
      "content": "详细定义与背景渊源"
    }
  ],
  "macroArcs": [
    {
      "index": 1,
      "title": "大阶段标题（如：第一卷·深宫初遇与求存）",
      "chapterRange": "第1章~第X章",
      "coreConflict": "本大阶段的核心戏剧冲突与主要转折",
      "summary": "本阶段剧情起承转合简述"
    }
  ]
}

【核心提取准则】：
1. 【全角色挖掘】：不仅要提炼男女主，更务必挖掘小说中出场的重要反派、关键配角、乃至有互动戏份的侍从/属下/同门等小配角（importance 标为 minor），以便玩家自由选择对戏角色！
2. 【原著忠实】：严格基于原著世界设定，不得凭空胡编现代违和概念。
3. 【数据规范】：每个角色必须明确注明 importance（'protagonist' | 'major' | 'supporting' | 'minor'）和所属势力。
`;

  const userPrompt = `
请阅读以下《${novel.title}》的目录大纲与文本片段，提炼并输出完整的 L1 静态世界观 JSON：

${sampleContext}
`.trim();

  // 调度 'parser' 任务对应的副 API 或主 API
  const result = await executeNovelTask('parser', systemPrompt, userPrompt);
  const parsed = cleanAndParseJson(result.text);

  // 格式化并补齐默认 ID
  const worldview: L1Worldview = {
    novelId: novel.id,
    novelTitle: parsed.novelTitle || novel.title,
    originalProtagonist: parsed.originalProtagonist || novel.protagonist || '原著主角',
    background: parsed.background || '',
    ruleSystem: parsed.ruleSystem || '',
    factions: Array.isArray(parsed.factions)
      ? parsed.factions.map((f: any) => ({
          id: genId('fac'),
          name: String(f.name || '未命名势力'),
          leader: f.leader ? String(f.leader) : undefined,
          stance: String(f.stance || '中立'),
          summary: String(f.summary || ''),
        }))
      : [],
    characters: Array.isArray(parsed.characters)
      ? parsed.characters.map((c: any) => ({
          id: genId('char'),
          name: String(c.name || '未命名人物'),
          aliases: Array.isArray(c.aliases) ? c.aliases.map(String) : [],
          identity: String(c.identity || ''),
          personality: String(c.personality || ''),
          initialRelation: String(c.initialRelation || ''),
          faction: c.faction ? String(c.faction) : undefined,
          importance: ['protagonist', 'major', 'supporting', 'minor'].includes(c.importance)
            ? c.importance
            : 'supporting',
          summary: String(c.summary || ''),
        }))
      : [],
    terms: Array.isArray(parsed.terms)
      ? parsed.terms.map((t: any) => ({
          id: genId('term'),
          name: String(t.name || '未命名条目'),
          category: ['location', 'item', 'concept', 'custom'].includes(t.category)
            ? t.category
            : 'custom',
          content: String(t.content || ''),
        }))
      : [],
    macroArcs: Array.isArray(parsed.macroArcs)
      ? parsed.macroArcs.map((a: any, idx: number) => ({
          id: genId('arc'),
          index: typeof a.index === 'number' ? a.index : idx + 1,
          title: String(a.title || `第${idx + 1}阶段`),
          chapterRange: String(a.chapterRange || ''),
          summary: String(a.summary || ''),
          coreConflict: String(a.coreConflict || ''),
        }))
      : [],
    cleanedAt: Date.now(),
  };

  return {
    worldview,
    source: result.source,
    latencyMs: result.latencyMs,
  };
}

/**
 * 默认空世界观模板 (供手动创建或离线预置)
 */
export function createDefaultL1Worldview(novel: NovelSource): L1Worldview {
  return {
    novelId: novel.id,
    novelTitle: novel.title,
    originalProtagonist: novel.protagonist || '原著主角',
    background: '请在此输入小说所处的时代背景、地理环境、朝代制度或大千世界格局...',
    ruleSystem: '请在此输入本世界的法度规矩、力量层级、武学/功法/阶级常识及不可触犯的禁忌...',
    factions: [
      {
        id: genId('fac'),
        name: '核心势力 A',
        leader: '掌门 / 督公 / 皇上',
        stance: '朝廷中枢',
        summary: '掌握核心权力的统治组织。',
      },
    ],
    characters: [
      {
        id: genId('char'),
        name: novel.protagonist || '主角姓名',
        aliases: [],
        identity: '表面身份',
        personality: '性格沉着、心思缜密',
        initialRelation: '自身',
        importance: 'protagonist',
        summary: '故事第一主角。',
      },
    ],
    terms: [
      {
        id: genId('term'),
        name: '核心地点',
        category: 'location',
        content: '故事主要发生地。',
      },
    ],
    macroArcs: [
      {
        id: genId('arc'),
        index: 1,
        title: '第一卷·风云初起',
        chapterRange: `第1章~第${Math.min(novel.chapters.length, 20)}章`,
        coreConflict: '初入险境，求存与立足',
        summary: '主角初入格局，打破现状并立下宏愿。',
      },
    ],
    cleanedAt: Date.now(),
  };
}
