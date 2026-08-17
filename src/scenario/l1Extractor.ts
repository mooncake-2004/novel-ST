import { executeNovelTask } from '@/api/client';
import type {
  Chapter,
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

export type ProgressCallback = (percent: number, message: string, foundCharsCount: number) => void;

/**
 * 清洗并解析 JSON 结果
 */
function cleanAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  } else {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    cleaned = cleaned
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(cleaned);
  }
}

/**
 * 角色去重与初始状态锁定合并（严格保留首次出场的原生设定，防后期剧透与势力夺权污染）
 */
function mergeCharacters(
  existingList: L1Character[],
  newChars: Array<Partial<L1Character>>,
  currentChunkRangeText: string
): L1Character[] {
  const result: L1Character[] = [...existingList];

  const importanceRank = {
    protagonist: 4,
    major: 3,
    supporting: 2,
    minor: 1,
  };

  for (const nc of newChars) {
    if (!nc.name || !nc.name.trim()) continue;
    const name = nc.name.trim();

    // 查找已存在角色 (同名或别名命中)
    const existing = result.find(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase() === name.toLowerCase())) ||
        (nc.aliases && nc.aliases.some((a) => a.toLowerCase() === c.name.toLowerCase()))
    );

    const imp = (['protagonist', 'major', 'supporting', 'minor'].includes(nc.importance as any)
      ? nc.importance
      : 'minor') as L1Character['importance'];

    if (existing) {
      // 关键原则：已存在角色的【首次登场身份、原生势力、首次出场章节、初始态度】保持最早记录不变！
      // 只合并补充别名与重要度提档
      if (Array.isArray(nc.aliases)) {
        for (const a of nc.aliases) {
          if (a && !existing.aliases.includes(a) && a !== existing.name) {
            existing.aliases.push(a);
          }
        }
      }
      if (importanceRank[imp] > importanceRank[existing.importance]) {
        existing.importance = imp;
      }
      // 补充缺失字段
      if (!existing.personality && nc.personality) existing.personality = nc.personality;
      if (!existing.identity && nc.identity) existing.identity = nc.identity;
      if (!existing.faction && nc.faction) existing.faction = nc.faction;
      if (!existing.initialRelation && nc.initialRelation) existing.initialRelation = nc.initialRelation;
    } else {
      // 新发现角色：首次记录其原始状态
      result.push({
        id: genId('char'),
        name: name,
        aliases: Array.isArray(nc.aliases) ? nc.aliases.filter(Boolean) : [],
        identity: nc.identity || '',
        personality: nc.personality || '',
        initialRelation: nc.initialRelation || '初识/未知',
        faction: nc.faction || undefined,
        firstAppearance: nc.firstAppearance || currentChunkRangeText,
        importance: imp,
        summary: nc.summary || '',
      });
    }
  }

  // 排序：主角 > 核心 > 配角 > 小配角
  return result.sort(
    (a, b) => importanceRank[b.importance] - importanceRank[a.importance]
  );
}

/**
 * 将整本小说拆解为适合 LLM 扫描的批次 (每批约 6~12 章)
 */
function chunkChapters(chapters: Chapter[], targetBatchChars: number = 25000): Chapter[][] {
  const chunks: Chapter[][] = [];
  let currentChunk: Chapter[] = [];
  let currentChars = 0;

  for (const ch of chapters) {
    const chLen = ch.charCount || ch.content.length || 0;
    if (currentChars + chLen > targetBatchChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [ch];
      currentChars = chLen;
    } else {
      currentChunk.push(ch);
      currentChars += chLen;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * 全书全量扫描：分卷扫描全书所有章节 + 严格提取【Day 0 原始世界状态与首次登场设定】
 */
export async function extractL1Worldview(
  novel: NovelSource,
  onProgress?: ProgressCallback
): Promise<{ worldview: L1Worldview; source: string; latencyMs: number }> {
  const chapters = novel.chapters || [];
  if (!chapters.length) {
    throw new Error('当前小说无有效章节内容，无法提炼世界观');
  }

  const startTime = performance.now();
  let executedSource = 'AI 模型';

  // 1. 拆分全书批次
  const chunks = chunkChapters(chapters, 30000);
  const totalChunks = chunks.length;
  let allCharacters: L1Character[] = [];

  onProgress?.(5, `已将全书 ${chapters.length} 章节划分为 ${totalChunks} 个扫描卷，开始全量逐卷扫描初始状态...`, 0);

  // 2. 逐批次扫描角色与原生势力
  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunks[i];
    const firstCh = chunk[0];
    const lastCh = chunk[chunk.length - 1];
    const rangeLabel = `第${firstCh.index + 1}章「${firstCh.title}」至 第${lastCh.index + 1}章「${lastCh.title}」`;

    const percent = Math.round(5 + ((i + 1) / (totalChunks + 1)) * 75);
    onProgress?.(
      percent,
      `正在扫描【卷 ${i + 1}/${totalChunks}】(${rangeLabel})...`,
      allCharacters.length
    );

    const chunkContent = chunk
      .map(
        (c) =>
          `--- 【第${c.index + 1}章：${c.title}】 ---\n${c.content.slice(0, 4000)}`
      )
      .join('\n\n');

    const chunkSystemPrompt = `你是一位严谨的小说人物图谱提取专家。
请仔细阅读以下小说章节切片，挖掘并提取在本章节范围内【所有出场、被提及、有互动戏份的角色】（包括主角、反派、配角、侍女、小太监、侍卫等小配角）。

【⚠️ 铁律准则——严格提取“首次出场原生状态”，严禁后期剧透与归顺篡位】：
1. 【原生身份与势力】：角色填写的 identity 和 faction 必须是其【在本章节/首次登场时原本所属的身份与阵营】！例如某势力后期虽被主角接管，但本章节中仍由原势力主统治，必须填原势力；若某角色原本是反派/敌对宗门，严禁将其势力直接填为“主角手下”！
2. 【初始态度】：必须填写该角色初见/首次登场时对主角或当时局势的原始态度（如：冷漠审视、利用防备、傲慢轻视、纯粹交易、敌视等），严禁填写后期反转爱上或臣服于主角后的态度！
3. 【无大结局剧透】：summary 仅提炼该角色的核心性格特征、口吻语气、固有秘密与性格底线软肋，不得剧透后文死亡、退隐或大结局！

请严格输出 JSON 数组格式：
[
  {
    "name": "角色准确姓名",
    "aliases": ["别名", "尊称", "外号"],
    "identity": "本章节/首次出场时的表面身份与官职/地位",
    "personality": "性格特征、说话口吻与行事习惯",
    "initialRelation": "初次登场时对主角的初始态度/关系（如冷漠/戒备/敌视/利用）",
    "faction": "首次出场时所属的原生势力（严禁填后期归顺状态）",
    "firstAppearance": "第${firstCh.index + 1}章「${firstCh.title}」",
    "importance": "protagonist / major / supporting / minor",
    "summary": "核心性格特征、固有动机与底线软肋（50~150字，不含大结局剧透）"
  }
]`;

    const chunkUserPrompt = `小说书名：《${novel.title}》
当前扫描章节范围：${rangeLabel} (共 ${chunk.length} 章)

${chunkContent}
`;

    try {
      const res = await executeNovelTask('parser', chunkSystemPrompt, chunkUserPrompt);
      executedSource = res.source;
      const parsedList = cleanAndParseJson(res.text);
      if (Array.isArray(parsedList)) {
        allCharacters = mergeCharacters(allCharacters, parsedList, `第${firstCh.index + 1}章`);
      }
    } catch (e: any) {
      console.warn(`[Novel-ST] Scan chunk ${i + 1} warning:`, e);
    }
  }

  // 3. 全书大纲、开局初始世界观、原生势力统筹 (Pass 2)
  onProgress?.(85, '全书章节扫描完毕，正在提炼开局初始时代背景、初始势力与宏观篇章路线...', allCharacters.length);

  const toc = chapters
    .map((c, idx) => `[第${idx + 1}章] ${c.title || `第${idx + 1}章`}`)
    .join('\n');

  const globalSystemPrompt = `你是一位资深网络文学总架构师。
你已拥有该小说的全书目录和全书已挖掘的人物图谱（共 ${allCharacters.length} 位角色）。
你的任务是对《${novel.title}》进行【L1 静态基底：故事开局 Day 0 初始世界观与原生势力】的全局统筹提炼。

【⚠️ 铁律准则——必须为故事开局/最初始的静态状态】：
1. 【势力与领袖】：factions 中列出的势力领袖（leader）和立场（stance），必须是【故事开局第一幕时的实际执掌者和初始立场】！严禁将主角后期接管、夺权后的状态填入领袖！例如司礼监在开局由某督公执掌就必须填该督公，绝不能提前写成主角接管。
2. 【时代背景与规则】：提炼开局时的社会常识、法度等级与力量层级，作为沙盒推演的稳固基石。

请务必输出严格合法的 JSON 对象：
{
  "novelTitle": "${novel.title}",
  "originalProtagonist": "原著第一主角真实姓名",
  "background": "故事开局时的时代背景、地理格局、历史渊源与基本世界设定（400~800字，详尽严谨）",
  "ruleSystem": "故事开局时的规则体系与社会常识（包括朝廷法度、官职体系、力量/修仙/武道层级、社会等级与不可触犯的禁忌常理，400~800字）",
  "factions": [
    {
      "name": "势力/门派/机构名称（如：司礼监、云岚宗、内阁、某世家）",
      "leader": "故事开局时的初始领袖/掌权者姓名（严禁填主角后期夺权）",
      "stance": "开局立场（如：朝廷鹰犬 / 中立门阀 / 皇权正统 / 隐秘敌对）",
      "summary": "初始势力核心职能、特权、驻地与内部矛盾（100~200字）"
    }
  ],
  "terms": [
    {
      "name": "专有名词名称（如特定地点/官衔/秘宝/阵法/信物）",
      "category": "location / item / concept / custom",
      "content": "初始定义与背景渊源"
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
}`;

  const topCharsPreview = allCharacters
    .slice(0, 30)
    .map((c) => `• ${c.name} (${c.identity || '未知身份'}) [首登场: ${c.firstAppearance || '开篇'}] - ${c.importance}`)
    .join('\n');

  const globalUserPrompt = `
小说书名：《${novel.title}》
总章节数：${chapters.length} 章
总字数：${novel.totalChars} 字

【全书已挖掘的人物及首次登场概览】：
${topCharsPreview}

【全书完整章节目录】：
${toc}
`.trim();

  const globalRes = await executeNovelTask('parser', globalSystemPrompt, globalUserPrompt);
  const globalParsed = cleanAndParseJson(globalRes.text);

  // 整合构建最终 L1Worldview
  const worldview: L1Worldview = {
    novelId: novel.id,
    novelTitle: globalParsed.novelTitle || novel.title,
    originalProtagonist: globalParsed.originalProtagonist || novel.protagonist || '原著主角',
    background: globalParsed.background || '',
    ruleSystem: globalParsed.ruleSystem || '',
    factions: Array.isArray(globalParsed.factions)
      ? globalParsed.factions.map((f: any) => ({
          id: genId('fac'),
          name: String(f.name || '未命名势力'),
          leader: f.leader ? String(f.leader) : undefined,
          stance: String(f.stance || '中立'),
          summary: String(f.summary || ''),
        }))
      : [],
    characters: allCharacters,
    terms: Array.isArray(globalParsed.terms)
      ? globalParsed.terms.map((t: any) => ({
          id: genId('term'),
          name: String(t.name || '未命名条目'),
          category: ['location', 'item', 'concept', 'custom'].includes(t.category)
            ? t.category
            : 'custom',
          content: String(t.content || ''),
        }))
      : [],
    macroArcs: Array.isArray(globalParsed.macroArcs)
      ? globalParsed.macroArcs.map((a: any, idx: number) => ({
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

  onProgress?.(100, `🎉 全书扫描完成！已提取 ${worldview.characters.length} 位人物初始档案、${worldview.factions.length} 个初始势力（Day 0 原始状态）`, worldview.characters.length);

  return {
    worldview,
    source: executedSource,
    latencyMs: Math.round(performance.now() - startTime),
  };
}

/**
 * 默认空世界观模板
 */
export function createDefaultL1Worldview(novel: NovelSource): L1Worldview {
  return {
    novelId: novel.id,
    novelTitle: novel.title,
    originalProtagonist: novel.protagonist || '原著主角',
    background: '请在此输入小说故事开局时的时代背景、地理环境、朝代制度或大千世界格局...',
    ruleSystem: '请在此输入本世界开局时的法度规矩、力量层级、武学/功法/阶级常识及不可触犯的禁忌...',
    factions: [
      {
        id: genId('fac'),
        name: '初始势力 A',
        leader: '原著初始掌门 / 督公 / 皇上',
        stance: '朝廷中枢',
        summary: '故事开局时的原始统治组织与核心职责。',
      },
    ],
    characters: [
      {
        id: genId('char'),
        name: novel.protagonist || '主角姓名',
        aliases: [],
        identity: '故事开局时的初始身份',
        personality: '性格沉着、心思缜密',
        initialRelation: '自身',
        firstAppearance: '第1章',
        importance: 'protagonist',
        summary: '故事第一主角开篇档案。',
      },
    ],
    terms: [
      {
        id: genId('term'),
        name: '核心地点',
        category: 'location',
        content: '故事开局主要发生地。',
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
