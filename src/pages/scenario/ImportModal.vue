<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import ModalMask from '@/components/ModalMask.vue';
import { readTextFile, splitNovelIntoChapters } from '@/scenario/parser';
import { saveNovelSource } from '@/scenario/store';
import type { Chapter, NovelSource } from '@/scenario/types';
import { toast } from '@/st/toast';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  initialNovel?: NovelSource | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', source: NovelSource): void;
}>();

// Steps: 1 = Input text/file, 2 = Chapter preview & verification
const currentStep = ref<1 | 2>(1);

// Input Form
const novelId = ref<string>('');
const novelTitle = ref('');
const protagonist = ref('');
const inputMode = ref<'paste' | 'file'>('paste');
const rawText = ref('');
const isProcessing = ref(false);
const fileName = ref('');
const isDragging = ref(false);

// Chapter Split Results
const parsedChapters = ref<Chapter[]>([]);
const selectedChapterId = ref<string>('');

// Stats
const totalChars = computed(() => {
  if (parsedChapters.value.length && currentStep.value === 2) {
    return parsedChapters.value.reduce((acc, c) => acc + c.charCount, 0);
  }
  return rawText.value.length;
});

const selectedChaptersCount = computed(() => {
  return parsedChapters.value.filter((c) => c.selected).length;
});

const activePreviewChapter = computed(() => {
  if (!parsedChapters.value.length) return null;
  return (
    parsedChapters.value.find((c) => c.id === selectedChapterId.value) ||
    parsedChapters.value[0]
  );
});

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.initialNovel) {
        // Load existing novel into step 2
        novelId.value = props.initialNovel.id;
        novelTitle.value = props.initialNovel.title;
        protagonist.value = props.initialNovel.protagonist || '';
        parsedChapters.value = [...props.initialNovel.chapters];
        selectedChapterId.value = props.initialNovel.chapters[0]?.id || '';
        currentStep.value = 2;
      } else {
        // Fresh import
        novelId.value = '';
        novelTitle.value = '';
        protagonist.value = '';
        rawText.value = '';
        fileName.value = '';
        parsedChapters.value = [];
        currentStep.value = 1;
      }
    }
  }
);

// File Drop / Selection handler
async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  await processFile(input.files[0]);
}

async function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  if (!e.dataTransfer?.files || !e.dataTransfer.files[0]) return;
  await processFile(e.dataTransfer.files[0]);
}

async function processFile(file: File) {
  if (
    !file.name.endsWith('.txt') &&
    !file.name.endsWith('.md') &&
    !file.name.endsWith('.epub')
  ) {
    toast('仅支持 .txt 或 .md 文件', 'warning');
    return;
  }

  isProcessing.value = true;
  fileName.value = file.name;

  try {
    const text = await readTextFile(file);
    rawText.value = text;
    if (!novelTitle.value) {
      novelTitle.value = file.name.replace(/\.[^/.]+$/, '');
    }
    toast(`文件读取成功（${(text.length / 10000).toFixed(1)} 万字）`, 'success');
  } catch (err: any) {
    toast(`文件解析失败: ${err.message || err}`, 'error');
  } finally {
    isProcessing.value = false;
  }
}

// Start splitting
function handleStartSplit() {
  if (!rawText.value.trim()) {
    toast('请先粘贴小说文本或上传文本文件', 'warning');
    return;
  }

  isProcessing.value = true;
  setTimeout(() => {
    try {
      const chapters = splitNovelIntoChapters(rawText.value);
      if (!chapters.length) {
        toast('未能识别到有效章节或文本过短', 'warning');
        return;
      }

      parsedChapters.value = chapters;
      selectedChapterId.value = chapters[0].id;
      currentStep.value = 2;

      toast(
        `成功拆分 ${chapters.length} 个章节/片段，请预览确认`,
        'success'
      );
    } catch (e: any) {
      toast(`分章失败: ${e.message || e}`, 'error');
    } finally {
      isProcessing.value = false;
    }
  }, 100);
}

// Toggle chapter selection
function toggleSelectAll(select: boolean) {
  parsedChapters.value.forEach((c) => (c.selected = select));
}

// Save novel source
async function handleSaveSource() {
  if (!novelTitle.value.trim()) {
    toast('请为小说填写一个标题', 'warning');
    return;
  }

  const newSource: NovelSource = {
    id: novelId.value || `novel_${Date.now()}`,
    title: novelTitle.value.trim(),
    protagonist: protagonist.value.trim() || '原著主角',
    totalChars: totalChars.value,
    chapters: parsedChapters.value,
    createdAt: Date.now(),
  };

  await saveNovelSource(newSource);
  toast(`《${newSource.title}》已妥善存入书架！共 ${newSource.chapters.length} 章节`, 'success');
  emit('saved', newSource);
  emit('close');
}
</script>

<template>
  <ModalMask :open="open" max-width="920px" @close="emit('close')">
    <div class="nst-import-container" @click.stop>
      <!-- Modal Header -->
      <div class="nst-import-header">
        <div class="nst-header-info">
          <h3 class="nst-import-title">
            <Icon name="scenario" :size="20" />
            {{ initialNovel ? '小说章节浏览与管理' : '小说导入与智能分章验证' }}
          </h3>
          <span class="nst-import-desc">
            {{
              initialNovel
                ? `当前查看：《${novelTitle}》（共 ${parsedChapters.length} 章节）`
                : '输入/上传小说文本，自动扫描章节标号并切片保存至书架'
            }}
          </span>
        </div>

        <!-- Step Pills / Close button -->
        <div v-if="!initialNovel" class="nst-step-pills">
          <div class="nst-step-pill" :class="{ 'is-active': currentStep === 1 }">
            1. 录入文本
          </div>
          <div class="nst-step-arrow">➔</div>
          <div class="nst-step-pill" :class="{ 'is-active': currentStep === 2 }">
            2. 分章与内容预览
          </div>
        </div>
        <button v-else class="nst-icon-btn" @click="emit('close')">
          <Icon name="close" :size="18" />
        </button>
      </div>

      <!-- STEP 1: Input Form -->
      <div v-if="currentStep === 1" class="nst-step1-body">
        <div class="nst-meta-grid">
          <div class="nst-form-item">
            <label class="nst-label">
              <span>小说书名 / 剧本名称</span>
              <span class="nst-req">*</span>
            </label>
            <input
              v-model="novelTitle"
              type="text"
              class="nst-input"
              placeholder="例如：《嫁宦》或《诡秘之主》"
            />
          </div>

          <div class="nst-form-item">
            <label class="nst-label">
              <span>你扮演的身份 / 主角名称</span>
            </label>
            <input
              v-model="protagonist"
              type="text"
              class="nst-input"
              placeholder="例如：林尽染（留空默认为原著主角）"
            />
          </div>
        </div>

        <!-- Tab selection for input type -->
        <div class="nst-tab-bar">
          <button
            class="nst-subtab-btn"
            :class="{ 'is-active': inputMode === 'paste' }"
            @click="inputMode = 'paste'"
          >
            📋 粘贴小说文本
          </button>
          <button
            class="nst-subtab-btn"
            :class="{ 'is-active': inputMode === 'file' }"
            @click="inputMode = 'file'"
          >
            📁 上传本地文件 (.txt / .md)
          </button>
        </div>

        <!-- Paste Mode -->
        <div v-if="inputMode === 'paste'" class="nst-paste-box">
          <textarea
            v-model="rawText"
            class="nst-textarea nst-novel-textarea"
            placeholder="在此处直接粘贴小说章节或全书文本...&#10;&#10;引擎将自动扫描“第X章”、“第X回”、“Chapter X”等章节标识进行切分。"
          ></textarea>
          <div class="nst-textarea-counter">
            字数统计：<strong class="nst-num">{{ totalChars.toLocaleString() }}</strong> 字
          </div>
        </div>

        <!-- File Mode -->
        <div v-else class="nst-file-box">
          <div
            class="nst-dropzone"
            :class="{ 'is-dragover': isDragging, 'has-file': Boolean(fileName) }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <div v-if="!fileName" class="nst-drop-prompt">
              <Icon name="plus" :size="32" />
              <div class="nst-drop-text">点击选择文件，或将 .txt / .md 小说文件拖放到此处</div>
              <div class="nst-drop-hint">支持 UTF-8、GBK 自动防乱码检测</div>
              <label class="nst-btn nst-btn-secondary nst-btn-sm nst-upload-label">
                选择本地文件
                <input
                  type="file"
                  accept=".txt,.md"
                  class="nst-hidden-file-input"
                  @change="handleFileSelect"
                />
              </label>
            </div>
            <div v-else class="nst-file-loaded">
              <div class="nst-file-icon">📄</div>
              <div class="nst-file-meta">
                <div class="nst-file-name">{{ fileName }}</div>
                <div class="nst-file-stats">已成功加载 {{ totalChars.toLocaleString() }} 字</div>
              </div>
              <label class="nst-btn nst-btn-secondary nst-btn-sm">
                更换文件
                <input
                  type="file"
                  accept=".txt,.md"
                  class="nst-hidden-file-input"
                  @change="handleFileSelect"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Step 1 Footer -->
        <div class="nst-modal-actions">
          <button class="nst-btn nst-btn-secondary" @click="emit('close')">
            取消
          </button>
          <button
            class="nst-btn nst-btn-primary"
            :disabled="!rawText.trim() || isProcessing"
            @click="handleStartSplit"
          >
            <Icon name="zap" :size="16" />
            {{ isProcessing ? '正在分析文本...' : '开始智能分章与校验 ➔' }}
          </button>
        </div>
      </div>

      <!-- STEP 2: Verification & Preview -->
      <div v-else class="nst-step2-body">
        <!-- Overview Banner -->
        <div class="nst-overview-bar">
          <div class="nst-stat-item">
            <span class="nst-stat-label">书名</span>
            <span class="nst-stat-val">《{{ novelTitle || '未命名' }}》</span>
          </div>
          <div class="nst-stat-item">
            <span class="nst-stat-label">主角/玩家</span>
            <span class="nst-stat-val">{{ protagonist || '原著主角' }}</span>
          </div>
          <div class="nst-stat-item">
            <span class="nst-stat-label">总字数</span>
            <span class="nst-stat-val">{{ (totalChars / 10000).toFixed(2) }} 万字</span>
          </div>
          <div class="nst-stat-item">
            <span class="nst-stat-label">拆分章节</span>
            <span class="nst-stat-val">{{ parsedChapters.length }} 章</span>
          </div>
        </div>

        <!-- 2-Column Split Workspace -->
        <div class="nst-split-workspace">
          <!-- Left: Chapter List -->
          <div class="nst-chapter-list-col">
            <div class="nst-col-header">
              <div class="nst-col-title">
                <span>章节目录清单 ({{ parsedChapters.length }})</span>
              </div>
              <div class="nst-col-actions">
                <button
                  class="nst-link-btn"
                  @click="toggleSelectAll(true)"
                >
                  全选
                </button>
                <span class="nst-divider-dot">·</span>
                <button
                  class="nst-link-btn"
                  @click="toggleSelectAll(false)"
                >
                  全不选
                </button>
              </div>
            </div>

            <div class="nst-chapter-items-scroll">
              <div
                v-for="chap in parsedChapters"
                :key="chap.id"
                class="nst-chapter-row"
                :class="{
                  'is-active': selectedChapterId === chap.id,
                  'is-checked': chap.selected,
                }"
                @click="selectedChapterId = chap.id"
              >
                <input
                  v-model="chap.selected"
                  type="checkbox"
                  class="nst-checkbox"
                  @click.stop
                />
                <div class="nst-chap-info">
                  <span class="nst-chap-title">{{ chap.title }}</span>
                  <span class="nst-chap-len">{{ chap.charCount }} 字</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Chapter Content Preview -->
          <div class="nst-chapter-preview-col">
            <div class="nst-col-header">
              <div class="nst-col-title">
                📖 章节内容预览：
                <span v-if="activePreviewChapter" class="nst-preview-title">
                  {{ activePreviewChapter.title }}
                </span>
              </div>
              <span v-if="activePreviewChapter" class="nst-chap-len">
                {{ activePreviewChapter.charCount }} 字
              </span>
            </div>

            <div class="nst-preview-text-box">
              <pre v-if="activePreviewChapter" class="nst-reader-text">{{ activePreviewChapter.content }}</pre>
              <div v-else class="nst-empty-preview">请从左侧选择章节预览</div>
            </div>
          </div>
        </div>

        <!-- Step 2 Footer -->
        <div class="nst-modal-actions">
          <button
            v-if="!initialNovel"
            class="nst-btn nst-btn-secondary"
            @click="currentStep = 1"
          >
            ⬅ 返回修改文本
          </button>
          <button
            class="nst-btn nst-btn-primary"
            :disabled="!selectedChaptersCount"
            @click="handleSaveSource"
          >
            <Icon name="check" :size="16" />
            {{ initialNovel ? '保存章节与设定更改' : `存入书架并完成录入 (已选 ${selectedChaptersCount} 章)` }}
          </button>
        </div>
      </div>
    </div>
  </ModalMask>
</template>

<style scoped>
.nst-import-container {
  width: 100%;
  max-width: 920px;
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border-strong);
  border-radius: var(--nst-radius);
  box-shadow: var(--nst-shadow-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 88vh;
  box-sizing: border-box;
}

.nst-import-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--nst-border);
  padding-bottom: 14px;
}

.nst-header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-import-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nst-ink);
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-import-desc {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-step-pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-step-pill {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--nst-radius-pill);
  background: var(--nst-bg-card);
  color: var(--nst-ink-dim);
  font-weight: 500;
}

.nst-step-pill.is-active {
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  font-weight: 600;
}

.nst-step-arrow {
  color: var(--nst-ink-dim);
  font-size: 11px;
}

/* Step 1 */
.nst-step1-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nst-meta-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 12px;
}

.nst-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--nst-ink);
  display: flex;
  align-items: center;
  gap: 4px;
}

.nst-req {
  color: var(--nst-danger);
}

.nst-tab-bar {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--nst-border);
  padding-bottom: 8px;
}

.nst-subtab-btn {
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink-dim);
  padding: 6px 12px;
  border-radius: var(--nst-radius-sm);
  cursor: pointer;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-subtab-btn.is-active {
  background: var(--nst-bg-card-hover);
  color: var(--nst-primary);
}

.nst-novel-textarea {
  min-height: 240px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
}

.nst-paste-box {
  position: relative;
}

.nst-textarea-counter {
  text-align: right;
  font-size: 12px;
  color: var(--nst-ink-dim);
  margin-top: 4px;
}

.nst-num {
  color: var(--nst-primary);
}

/* File Drop Zone */
.nst-dropzone {
  border: 2px dashed var(--nst-border-strong);
  border-radius: var(--nst-radius);
  background: var(--nst-bg-card);
  padding: 36px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-dropzone.is-dragover {
  border-color: var(--nst-primary);
  background: var(--nst-primary-bg);
}

.nst-drop-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--nst-ink-dim);
}

.nst-drop-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-drop-hint {
  font-size: 12px;
}

.nst-hidden-file-input {
  display: none;
}

.nst-upload-label {
  margin-top: 8px;
  cursor: pointer;
}

.nst-file-loaded {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: 460px;
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  padding: 12px 16px;
  border-radius: var(--nst-radius-sm);
}

.nst-file-icon {
  font-size: 28px;
}

.nst-file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nst-file-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-file-stats {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

/* STEP 2 */
.nst-step2-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nst-overview-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--nst-bg-card);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius-sm);
  padding: 10px 16px;
}

.nst-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.nst-stat-label {
  font-size: 11px;
  color: var(--nst-ink-dim);
}

.nst-stat-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--nst-ink);
}

/* Split workspace */
.nst-split-workspace {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  height: 380px;
}

.nst-chapter-list-col,
.nst-chapter-preview-col {
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius-sm);
  background: var(--nst-bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nst-col-header {
  padding: 10px 12px;
  background: var(--nst-bg-card);
  border-bottom: 1px solid var(--nst-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-col-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nst-link-btn {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--nst-primary);
  cursor: pointer;
  padding: 0;
}

.nst-link-btn:hover {
  text-decoration: underline;
}

.nst-divider-dot {
  color: var(--nst-ink-dim);
  font-size: 10px;
}

.nst-chapter-items-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-chapter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--nst-radius-sm);
  cursor: pointer;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-chapter-row:hover {
  background: var(--nst-bg-card-hover);
}

.nst-chapter-row.is-active {
  background: var(--nst-primary-bg);
  border-left: 3px solid var(--nst-primary);
}

.nst-chap-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
}

.nst-chap-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--nst-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nst-chap-len {
  font-size: 11px;
  color: var(--nst-ink-dim);
  white-space: nowrap;
}

.nst-preview-title {
  color: var(--nst-primary);
  font-weight: 700;
}

.nst-preview-text-box {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: var(--nst-bg-base);
}

.nst-reader-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.7;
  color: var(--nst-ink);
}

.nst-empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--nst-ink-dim);
}

.nst-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
</style>
