import type { Chapter } from './types';

/**
 * 常见中文与英文小说章节标题匹配正则
 */
const CHAPTER_REGEX_LIST = [
  // 1. 标准：第 1 章 标题 / 第一百二十章·标题 / 第3卷 第2章
  /^[ \t]*(?:第\s*[0-9一二三四五六七八九十百千万零〇]+\s*[卷部集篇])?[ \t]*第\s*[0-9一二三四五六七八九十百千万零〇]+\s*[章回节折幕集话][ \t:：\-_]*(.*)$/m,
  // 2. 括号包裹：【第1章 标题】/ (第一百章)
  /^[ \t]*[【\[(（]第\s*[0-9一二三四五六七八九十百千万零〇]+\s*[章回节折幕集话][\)）\]】][ \t:：\-_]*(.*)$/m,
  // 3. 英文 Chapter 1: Title
  /^[ \t]*Chapter\s*([0-9]+)[ \t:：\-_]*(.*)$/im,
  // 4. 数字标号：1. 标题 / 001 标题
  /^[ \t]*[0-9]{1,4}[ \t:：、\-_]+[^\n\r]{2,30}$/m,
];

/**
 * 智能分章算法：
 * 1. 优先扫描章节标题正则；
 * 2. 如果识别到的章节过少或没有章节标题，按字数（例如 3000 字）自动切片。
 */
export function splitNovelIntoChapters(rawText: string, chunkWordLimit = 3000): Chapter[] {
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!cleanText.trim()) return [];

  // 1. 尝试找到最佳正则匹配
  let bestSplits: Array<{ title: string; index: number; start: number; end: number }> = [];

  for (const regex of CHAPTER_REGEX_LIST) {
    const globalRegex = new RegExp(regex.source, 'gim');
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    while ((match = globalRegex.exec(cleanText)) !== null) {
      matches.push(match);
    }

    if (matches.length >= 2) {
      const splits = [];
      for (let i = 0; i < matches.length; i++) {
        const cur = matches[i];
        const next = matches[i + 1];
        const start = cur.index;
        const end = next ? next.index : cleanText.length;
        const title = cur[0].trim();
        splits.push({ title, index: i + 1, start, end });
      }

      // 如果当前正则匹配出的章节数更多且合理，采用之
      if (splits.length > bestSplits.length) {
        bestSplits = splits;
      }
    }
  }

  // 2. 如果成功用正则识别出章节
  if (bestSplits.length > 0) {
    // 检查第一章前是否有序章/引子/楔子
    const chapters: Chapter[] = [];
    if (bestSplits[0].start > 100) {
      const introText = cleanText.slice(0, bestSplits[0].start).trim();
      if (introText.length > 50) {
        chapters.push({
          id: 'chap_intro',
          index: 0,
          title: '【序章 / 前言】',
          content: introText,
          charCount: introText.length,
          selected: true,
        });
      }
    }

    bestSplits.forEach((sp, idx) => {
      const content = cleanText.slice(sp.start, sp.end).trim();
      chapters.push({
        id: `chap_${idx + 1}`,
        index: chapters.length + 1,
        title: sp.title.slice(0, 50),
        content,
        charCount: content.length,
        selected: true,
      });
    });

    return chapters;
  }

  // 3. 兜底方案：无章节标题，按字数和段落切分
  const paragraphs = cleanText.split('\n\n').map(p => p.trim()).filter(Boolean);
  const chapters: Chapter[] = [];
  let currentChunk = '';
  let chunkIdx = 1;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkWordLimit && currentChunk.length > 1000) {
      chapters.push({
        id: `chap_${chunkIdx}`,
        index: chunkIdx,
        title: `第 ${chunkIdx} 节 (约 ${currentChunk.length} 字)`,
        content: currentChunk.trim(),
        charCount: currentChunk.length,
        selected: true,
      });
      chunkIdx++;
      currentChunk = para + '\n\n';
    } else {
      currentChunk += para + '\n\n';
    }
  }

  if (currentChunk.trim()) {
    chapters.push({
      id: `chap_${chunkIdx}`,
      index: chunkIdx,
      title: `第 ${chunkIdx} 节 (约 ${currentChunk.length} 字)`,
      content: currentChunk.trim(),
      charCount: currentChunk.length,
      selected: true,
    });
  }

  return chapters;
}

/**
 * 读取上传的文件，自动处理 GBK / GB2312 / UTF-8 编码防乱码
 */
export async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  // 优先尝试 UTF-8 解码
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // 若 UTF-8 解码抛错，尝试 GBK
    try {
      const gbkDecoder = new TextDecoder('gbk', { fatal: false });
      return gbkDecoder.decode(buffer);
    } catch {
      // 最终普通回退
      const fallbackDecoder = new TextDecoder('utf-8');
      return fallbackDecoder.decode(buffer);
    }
  }
}
