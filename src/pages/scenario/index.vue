<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Icon from '@/components/Icon.vue';
import {
  loadScenarioStore,
  scenarioStore,
  switchActiveNovel,
} from '@/scenario/store';
import type { NovelSource, SceneNode } from '@/scenario/types';
import ImportModal from './ImportModal.vue';
import LibraryModal from './LibraryModal.vue';
import L1WorldviewModal from './L1WorldviewModal.vue';

onMounted(() => {
  loadScenarioStore();
});

const showImportModal = ref(false);
const showLibraryModal = ref(false);
const showL1Modal = ref(false);
const previewingNovel = ref<NovelSource | null>(null);

const mockScenes = ref<SceneNode[]>([
  {
    id: 'canon_001',
    index: 1,
    title: '第一幕：退婚之辱与立誓',
    location: '乌坦城 · 萧家大厅',
    characters: ['萧炎 (玩家)', '纳兰嫣然', '葛叶', '萧战'],
    status: 'active',
    summary: '纳兰嫣然携云岚宗葛叶执事登门强势退婚，奉上聚气丹补偿。',
    canonGoals: [
      { id: 'g1', text: '隐忍葛叶与纳兰嫣然的言语施压', done: true, required: true },
      { id: 'g2', text: '断然拒绝聚气丹赔偿', done: true, required: true },
      { id: 'g3', text: '咬破手指手书休书，立下三年之约', done: false, required: true },
    ],
    oocHint: '原著中萧炎在此处掷地有声喊出“三十年河东，三十年河西，莫欺少年穷！”，震撼全场。',
    canonExpectedOutcomes: {
      keyEvents: ['立下三年之约', '撕毁婚约', '药老暗中苏醒'],
      characterStateChanges: {
        xiao_yan: '休妻并立誓三年后挑战云岚宗',
        na_lan: '傲慢但略感屈辱',
      },
    },
  },
  {
    id: 'canon_002',
    index: 2,
    title: '第二幕：药老苏醒与焚决现世',
    location: '后山悬崖',
    characters: ['萧炎 (玩家)', '药老'],
    status: 'pending',
    summary: '萧炎在后山发泄情绪时，戒指中的药老灵魂现身，坦白吸收斗气真相并收徒。',
    canonGoals: [
      { id: 'g4', text: '识破戒指异象并与药老初次对话', done: false, required: true },
      { id: 'g5', text: '正式拜师药老，了解炼药师之道', done: false, required: true },
    ],
    oocHint: '原著中药老以炼药术和地阶功法诱惑萧炎，萧炎以机敏与尊师重道打动药老。',
    canonExpectedOutcomes: {
      keyEvents: ['拜师药老', '得知斗气倒退真相', '获赠焚决'],
      characterStateChanges: {
        yao_lao: '认可萧炎心性并认作关门弟子',
      },
    },
  },
]);

function handleNovelSaved(source: NovelSource) {
  previewingNovel.value = null;
}

function handleOpenImportFresh() {
  previewingNovel.value = null;
  showLibraryModal.value = false;
  showImportModal.value = true;
}

function handleViewChapters(novel: NovelSource) {
  previewingNovel.value = novel;
  showLibraryModal.value = false;
  showImportModal.value = true;
}

function handleQuickSwitch(e: Event) {
  const target = e.target as HTMLSelectElement;
  if (target.value) {
    switchActiveNovel(target.value);
  }
}

function handleWorldviewSaved() {
  // Saved event callback
}
</script>

<template>
  <div class="nst-scenario-page">
    <!-- Top Header -->
    <div class="nst-page-header">
      <div class="nst-page-title-group">
        <h2 class="nst-page-title">小说大纲与分镜导航</h2>
        <span v-if="scenarioStore.source" class="nst-page-subtitle">
          当前小说：《{{ scenarioStore.source.title }}》（共 {{ scenarioStore.source.chapters.length }} 章节 / {{ (scenarioStore.source.totalChars / 10000).toFixed(1) }} 万字）
        </span>
        <span v-else class="nst-page-subtitle">
          书架目前暂无小说，请点击导入新小说
        </span>
      </div>

      <div class="nst-header-actions">
        <!-- Quick Switch Selector if has multiple novels -->
        <div v-if="scenarioStore.novelsList.length > 1" class="nst-quick-switcher">
          <select
            :value="scenarioStore.activeNovelId || ''"
            class="nst-select nst-novel-select"
            @change="handleQuickSwitch"
          >
            <option
              v-for="n in scenarioStore.novelsList"
              :key="n.id"
              :value="n.id"
            >
              📚 《{{ n.title }}》 ({{ n.chapters.length }}章)
            </option>
          </select>
        </div>

        <!-- Open Shelf/Folder Manager -->
        <button
          class="nst-btn nst-btn-secondary nst-btn-sm"
          title="管理小说书架 / 切换剧本"
          @click="showLibraryModal = true"
        >
          <Icon name="scenario" :size="14" />
          小说书架 ({{ scenarioStore.novelsList.length }})
        </button>

        <!-- Import Button -->
        <button
          class="nst-btn nst-btn-primary nst-btn-sm"
          @click="handleOpenImportFresh"
        >
          <Icon name="plus" :size="14" />
          导入新小说
        </button>
      </div>
    </div>

    <!-- Loaded Novel Info Card -->
    <div v-if="scenarioStore.source" class="nst-source-summary-card">
      <div class="nst-source-badge-line">
        <span class="nst-source-badge">📖 当前活跃小说</span>
        <div class="nst-source-quick-btns">
          <button
            class="nst-btn nst-btn-secondary nst-btn-xs"
            @click="handleViewChapters(scenarioStore.source)"
          >
            浏览本小说全部章节 ({{ scenarioStore.source.chapters.length }})
          </button>
          <button
            class="nst-btn nst-btn-secondary nst-btn-xs"
            @click="showLibraryModal = true"
          >
            切换其他小说 ➔
          </button>
        </div>
      </div>

      <div class="nst-source-main">
        <div class="nst-source-info">
          <h3 class="nst-source-title">《{{ scenarioStore.source.title }}》</h3>
          <div class="nst-source-meta">
            <span>🎭 玩家身份：<strong>{{ scenarioStore.source.protagonist || '原著主角' }}</strong></span>
            <span>📑 章节总计：<strong>{{ scenarioStore.source.chapters.length }}</strong> 章</span>
            <span>📝 正文字数：<strong>{{ scenarioStore.source.totalChars.toLocaleString() }}</strong> 字</span>
          </div>
        </div>
        <div class="nst-source-next-box">
          <div class="nst-next-hint">已妥善保存在书架，随时可在多本小说间无缝换过去/换回来</div>
        </div>
      </div>

      <!-- L1 Static Worldview Status & Action -->
      <div class="nst-l1-extract-entry">
        <div class="nst-l1-entry-left">
          <div class="nst-l1-entry-title">
            <Icon name="sparkles" :size="16" />
            <span class="nst-l1-entry-label">全局静态世界观与全书图谱 (L1)</span>
            <span
              v-if="scenarioStore.source.l1Worldview && scenarioStore.source.l1Worldview.cleanedAt"
              class="nst-l1-status-badge is-ready"
            >
              已提炼（{{ scenarioStore.source.l1Worldview.characters?.length || 0 }} 人物 · {{ scenarioStore.source.l1Worldview.factions?.length || 0 }} 势力 · {{ scenarioStore.source.l1Worldview.terms?.length || 0 }} 条目）
            </span>
            <span v-else class="nst-l1-status-badge is-pending">
              尚未提炼
            </span>
          </div>
          <div class="nst-l1-entry-desc">
            {{
              scenarioStore.source.l1Worldview && scenarioStore.source.l1Worldview.cleanedAt
                ? '已提炼时代背景、规则常识、全书人物（含小配角）与专有名词。随时可检视或自由修改！'
                : '一键调用 AI 扫描全书目录大纲与前序采样章节，提炼时代背景、规则体系与全书人物图谱（含小配角）。'
            }}
          </div>
        </div>
        <div class="nst-l1-entry-actions">
          <button
            class="nst-btn nst-btn-sm"
            :class="scenarioStore.source.l1Worldview && scenarioStore.source.l1Worldview.cleanedAt ? 'nst-btn-secondary' : 'nst-btn-primary'"
            @click="showL1Modal = true"
          >
            <Icon :name="scenarioStore.source.l1Worldview && scenarioStore.source.l1Worldview.cleanedAt ? 'search' : 'sparkles'" :size="14" />
            {{
              scenarioStore.source.l1Worldview && scenarioStore.source.l1Worldview.cleanedAt
                ? '👁️ 检视/修改 L1 世界观'
                : '✨ 提取全局静态世界观'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State if no novel -->
    <div v-else class="nst-empty-source-card">
      <div class="nst-empty-icon">📚</div>
      <h3 class="nst-empty-title">小说书架目前空空如也</h3>
      <p class="nst-empty-desc">
        Novel-ST 支持多本小说管理（书架文件夹模式）。<br />
        你可以导入任意多本小说文本，系统会自动切章并永久保存，随时切换！
      </p>
      <button class="nst-btn nst-btn-primary" @click="handleOpenImportFresh">
        <Icon name="plus" :size="16" />
        立即导入第一本小说
      </button>
    </div>

    <!-- Active Scene Card (HUD Preview) -->
    <div class="nst-active-scene-card">
      <div class="nst-scene-tag">当前进行中分镜（示例预览）</div>
      <div class="nst-scene-header">
        <h3 class="nst-scene-title">{{ mockScenes[0].title }}</h3>
        <div class="nst-scene-loc">
          <Icon name="scenario" :size="14" />
          {{ mockScenes[0].location }}
        </div>
      </div>

      <p class="nst-scene-summary">{{ mockScenes[0].summary }}</p>

      <div class="nst-scene-section">
        <div class="nst-section-title">🎯 原著主线目标追踪 (Canon Quest)</div>
        <div class="nst-quest-list">
          <div
            v-for="(g, idx) in mockScenes[0].canonGoals"
            :key="idx"
            class="nst-quest-item"
            :class="{ 'is-done': g.done }"
          >
            <div class="nst-quest-checkbox">
              <Icon v-if="g.done" name="check" :size="12" />
            </div>
            <span class="nst-quest-text">{{ g.text }}</span>
          </div>
        </div>
      </div>

      <div class="nst-ooc-box">
        <div class="nst-ooc-title">
          <Icon name="zap" :size="14" />
          剧外锦囊 (原著台词/行为提示)
        </div>
        <p class="nst-ooc-text">{{ mockScenes[0].oocHint }}</p>
      </div>
    </div>

    <!-- Scene Timeline Tree -->
    <div class="nst-timeline-section">
      <h4 class="nst-timeline-title">📜 分镜时间线切片</h4>
      <div class="nst-timeline-list">
        <div
          v-for="sc in mockScenes"
          :key="sc.id"
          class="nst-timeline-node"
          :class="{ 'is-active': sc.status === 'active' }"
        >
          <div class="nst-node-dot"></div>
          <div class="nst-node-content">
            <div class="nst-node-head">
              <span class="nst-node-title">{{ sc.title }}</span>
              <span class="nst-node-badge">{{ sc.status === 'active' ? '进行中' : '未解锁' }}</span>
            </div>
            <div class="nst-node-meta">在场人物：{{ sc.characters.join('、') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <ImportModal
      :open="showImportModal"
      :initial-novel="previewingNovel"
      @close="showImportModal = false"
      @saved="handleNovelSaved"
    />

    <!-- Library Modal (Shelf Manager) -->
    <LibraryModal
      :open="showLibraryModal"
      @close="showLibraryModal = false"
      @open-import="handleOpenImportFresh"
      @view-chapters="handleViewChapters"
    />

    <!-- L1 Static Worldview Modal -->
    <L1WorldviewModal
      v-if="showL1Modal && scenarioStore.source"
      :novel="scenarioStore.source"
      :initial-worldview="scenarioStore.source.l1Worldview"
      @close="showL1Modal = false"
      @saved="handleWorldviewSaved"
    />
  </div>
</template>

<style scoped>
.nst-scenario-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nst-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nst-page-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nst-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-page-subtitle {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-quick-switcher {
  display: flex;
  align-items: center;
}

.nst-novel-select {
  padding: 4px 10px;
  font-size: 12px;
  max-width: 220px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}

.nst-btn-xs {
  padding: 3px 8px;
  font-size: 11px;
}

/* Source Summary Card */
.nst-source-summary-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-left: 4px solid var(--nst-primary);
  border-radius: var(--nst-radius);
  padding: 16px 20px;
  box-shadow: var(--nst-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nst-source-badge-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-source-badge {
  font-size: 11px;
  color: var(--nst-primary);
  font-weight: 600;
}

.nst-source-quick-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nst-source-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nst-source-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-source-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-source-meta strong {
  color: var(--nst-ink);
}

.nst-source-next-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.nst-next-hint {
  font-size: 11px;
  color: var(--nst-ink-dim);
}

/* L1 Static Worldview Entry */
.nst-l1-extract-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
  padding: 12px 14px;
  background: var(--nst-bg-base);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius-sm);
}

.nst-l1-entry-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-l1-entry-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--nst-ink);
  font-size: 13px;
  font-weight: 700;
}

.nst-l1-entry-label {
  color: var(--nst-ink);
}

.nst-l1-status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.nst-l1-status-badge.is-ready {
  background-color: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.nst-l1-status-badge.is-pending {
  background-color: rgba(234, 179, 8, 0.12);
  color: #ca8a04;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.nst-l1-entry-desc {
  font-size: 12px;
  color: var(--nst-ink-dim);
  line-height: 1.4;
}

.nst-l1-entry-actions {
  flex-shrink: 0;
}

/* Empty State Card */
.nst-empty-source-card {
  background: var(--nst-bg-surface);
  border: 1px dashed var(--nst-border-strong);
  border-radius: var(--nst-radius);
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.nst-empty-icon {
  font-size: 40px;
}

.nst-empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--nst-ink-dim);
  max-width: 520px;
  line-height: 1.6;
}

/* Active Scene Card */
.nst-active-scene-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border-strong);
  border-radius: var(--nst-radius);
  padding: 20px;
  box-shadow: var(--nst-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.nst-scene-tag {
  font-size: 11px;
  color: var(--nst-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nst-scene-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-scene-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-scene-loc {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-scene-summary {
  margin: 0;
  font-size: 13px;
  color: var(--nst-ink-dim);
  line-height: 1.5;
}

.nst-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
  margin-bottom: 8px;
}

.nst-quest-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-quest-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--nst-bg-card);
  border-radius: var(--nst-radius-sm);
  font-size: 13px;
  color: var(--nst-ink);
}

.nst-quest-item.is-done {
  color: var(--nst-ink-dim);
  text-decoration: line-through;
}

.nst-quest-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--nst-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--nst-bg-surface);
  color: var(--nst-primary);
}

.nst-quest-item.is-done .nst-quest-checkbox {
  background: var(--nst-primary-bg);
  border-color: var(--nst-primary);
}

/* OOC Box */
.nst-ooc-box {
  background: var(--nst-primary-bg);
  border-left: 3px solid var(--nst-primary);
  border-radius: var(--nst-radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-ooc-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--nst-primary);
}

.nst-ooc-text {
  margin: 0;
  font-size: 12px;
  color: var(--nst-ink);
  line-height: 1.5;
}

/* Timeline */
.nst-timeline-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-timeline-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 10px;
  border-left: 2px solid var(--nst-border);
}

.nst-timeline-node {
  position: relative;
  padding-left: 18px;
}

.nst-node-dot {
  position: absolute;
  left: -16px;
  top: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--nst-border-strong);
  border: 2px solid var(--nst-bg-base);
}

.nst-timeline-node.is-active .nst-node-dot {
  background: var(--nst-primary);
  box-shadow: 0 0 0 3px var(--nst-primary-bg);
}

.nst-node-content {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius-sm);
  padding: 10px 14px;
}

.nst-node-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-node-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-node-badge {
  font-size: 11px;
  color: var(--nst-ink-dim);
}

.nst-node-meta {
  font-size: 12px;
  color: var(--nst-ink-dim);
  margin-top: 4px;
}
</style>
