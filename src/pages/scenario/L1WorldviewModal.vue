<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import Icon from '@/components/Icon.vue';
import { extractL1Worldview } from '@/scenario/l1Extractor';
import { saveL1WorldviewToNovel } from '@/scenario/store';
import type {
  L1Character,
  L1Faction,
  L1MacroArc,
  L1Term,
  L1Worldview,
  NovelSource,
} from '@/scenario/types';
import { toast } from '@/st/toast';

const props = defineProps<{
  novel: NovelSource;
  initialWorldview?: L1Worldview | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', wv: L1Worldview): void;
}>();

// Active Subtab
type SubTab = 'background' | 'ruleSystem' | 'factions' | 'characters' | 'terms' | 'macroArcs';
const activeTab = ref<SubTab>('characters');

// Extraction state
const isExtracting = ref(false);
const extractSource = ref('');
const extractLatency = ref(0);

// Local editable copy
const form = reactive<L1Worldview>({
  novelId: props.novel.id,
  novelTitle: props.novel.title,
  originalProtagonist: props.novel.protagonist || '原著主角',
  background: '',
  ruleSystem: '',
  factions: [],
  characters: [],
  terms: [],
  macroArcs: [],
  cleanedAt: 0,
});

// Character search and filter
const charSearch = ref('');
const charFilterImportance = ref<string>('all');

// Term filter
const termCategoryFilter = ref<string>('all');

function initFormData(wv?: L1Worldview | null) {
  if (wv) {
    form.novelId = wv.novelId || props.novel.id;
    form.novelTitle = wv.novelTitle || props.novel.title;
    form.originalProtagonist = wv.originalProtagonist || props.novel.protagonist || '原著主角';
    form.background = wv.background || '';
    form.ruleSystem = wv.ruleSystem || '';
    form.factions = JSON.parse(JSON.stringify(wv.factions || []));
    form.characters = JSON.parse(JSON.stringify(wv.characters || []));
    form.terms = JSON.parse(JSON.stringify(wv.terms || []));
    form.macroArcs = JSON.parse(JSON.stringify(wv.macroArcs || []));
    form.cleanedAt = wv.cleanedAt || Date.now();
  }
}

watch(
  () => props.initialWorldview,
  (newWv) => {
    initFormData(newWv);
  },
  { immediate: true }
);

// Trigger AI Extraction
async function handleStartExtract() {
  if (isExtracting.value) return;
  isExtracting.value = true;

  try {
    toast.info('正在调用 AI 提炼全书 L1 静态世界观与人物图谱，请稍候...');
    const result = await extractL1Worldview(props.novel);
    initFormData(result.worldview);
    extractSource.value = result.source;
    extractLatency.value = result.latencyMs;
    toast.success(`✨ L1 世界观提炼完成！耗时 ${(result.latencyMs / 1000).toFixed(1)}s`);
  } catch (err: any) {
    console.error('[Novel-ST] L1 extraction error', err);
    toast.error(`提炼失败: ${err.message || err}`);
  } finally {
    isExtracting.value = false;
  }
}

// Filtered Characters
const filteredCharacters = computed(() => {
  return form.characters.filter((c) => {
    const matchSearch =
      !charSearch.value ||
      c.name.toLowerCase().includes(charSearch.value.toLowerCase()) ||
      c.identity.toLowerCase().includes(charSearch.value.toLowerCase()) ||
      c.personality.toLowerCase().includes(charSearch.value.toLowerCase());

    const matchImp =
      charFilterImportance.value === 'all' || c.importance === charFilterImportance.value;

    return matchSearch && matchImp;
  });
});

// Filtered Terms
const filteredTerms = computed(() => {
  return form.terms.filter((t) => {
    return (
      termCategoryFilter.value === 'all' || t.category === termCategoryFilter.value
    );
  });
});

// Add helpers
function addCharacter() {
  form.characters.unshift({
    id: `char_${Math.random().toString(36).slice(2, 9)}`,
    name: '新建人物',
    aliases: [],
    identity: '身份/地位',
    personality: '性格特点',
    initialRelation: '中立',
    faction: '未知势力',
    importance: 'minor',
    summary: '生平小传与角色特征...',
  });
}

function removeCharacter(idx: number) {
  form.characters.splice(idx, 1);
}

function addFaction() {
  form.factions.push({
    id: `fac_${Math.random().toString(36).slice(2, 9)}`,
    name: '新建势力',
    leader: '领袖',
    stance: '中立',
    summary: '势力职责与背景描述...',
  });
}

function removeFaction(idx: number) {
  form.factions.splice(idx, 1);
}

function addTerm() {
  form.terms.push({
    id: `term_${Math.random().toString(36).slice(2, 9)}`,
    name: '新建专有名词',
    category: 'location',
    content: '条目背景与详细定义...',
  });
}

function removeTerm(idx: number) {
  form.terms.splice(idx, 1);
}

function addMacroArc() {
  form.macroArcs.push({
    id: `arc_${Math.random().toString(36).slice(2, 9)}`,
    index: form.macroArcs.length + 1,
    title: `第${form.macroArcs.length + 1}阶段`,
    chapterRange: '第X章~第Y章',
    coreConflict: '核心戏剧冲突',
    summary: '剧情起承转合...',
  });
}

function removeMacroArc(idx: number) {
  form.macroArcs.splice(idx, 1);
}

// Save worldview
async function handleSaveWorldview() {
  try {
    const toSave: L1Worldview = {
      novelId: props.novel.id,
      novelTitle: form.novelTitle,
      originalProtagonist: form.originalProtagonist,
      background: form.background,
      ruleSystem: form.ruleSystem,
      factions: JSON.parse(JSON.stringify(form.factions)),
      characters: JSON.parse(JSON.stringify(form.characters)),
      terms: JSON.parse(JSON.stringify(form.terms)),
      macroArcs: JSON.parse(JSON.stringify(form.macroArcs)),
      cleanedAt: Date.now(),
    };

    await saveL1WorldviewToNovel(props.novel.id, toSave);
    toast.success('🎉 L1 静态世界观已保存至本小说记忆库中！');
    emit('saved', toSave);
    emit('close');
  } catch (e: any) {
    toast.error(`保存失败: ${e.message}`);
  }
}
</script>

<template>
  <div class="nst-modal-mask" @click.self="emit('close')">
    <div class="nst-l1-modal">
      <!-- Modal Header -->
      <div class="nst-l1-header">
        <div class="nst-l1-title-box">
          <span class="nst-l1-tag">L1 静态基底</span>
          <h2 class="nst-l1-title">《{{ novel.title }}》· 全书世界观与图谱检视</h2>
        </div>
        <div class="nst-l1-header-actions">
          <button
            class="nst-btn nst-btn-secondary nst-btn-sm"
            :disabled="isExtracting"
            @click="handleStartExtract"
          >
            <Icon name="sparkles" :size="14" />
            {{ isExtracting ? '正在深度提炼中...' : (form.cleanedAt ? '🔄 重新提炼世界观' : '✨ 开始 AI 提炼') }}
          </button>
          <button class="nst-icon-btn" title="关闭窗口" @click="emit('close')">
            <Icon name="close" :size="16" />
          </button>
        </div>
      </div>

      <!-- Extracting Banner -->
      <div v-if="isExtracting" class="nst-extracting-bar">
        <div class="nst-extract-spinner"></div>
        <div class="nst-extract-msg">
          <strong>AI 正在通读小说目录大纲与采样章节...</strong>
          <span>正在提炼：时代背景、规则常识、各派势力、全书角色图谱（含小配角）与专有名词...</span>
        </div>
      </div>

      <!-- Stats Bar -->
      <div v-else class="nst-l1-stats-bar">
        <div class="nst-stat-item">
          <span>全书角色</span>
          <strong>{{ form.characters.length }} 位</strong>
        </div>
        <div class="nst-stat-item">
          <span>阵营势力</span>
          <strong>{{ form.factions.length }} 个</strong>
        </div>
        <div class="nst-stat-item">
          <span>专有条目</span>
          <strong>{{ form.terms.length }} 条</strong>
        </div>
        <div class="nst-stat-item">
          <span>宏观篇章</span>
          <strong>{{ form.macroArcs.length }} 卷</strong>
        </div>
        <div class="nst-stat-item nst-stat-protagonist">
          <span>原著第一主角</span>
          <input
            v-model="form.originalProtagonist"
            type="text"
            class="nst-input nst-input-inline"
            placeholder="主角姓名"
          />
        </div>
      </div>

      <!-- Sub Tabs Navigation -->
      <div class="nst-l1-nav-tabs">
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'characters' }"
          @click="activeTab = 'characters'"
        >
          🎭 全书人物图谱 ({{ form.characters.length }})
        </button>
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'background' }"
          @click="activeTab = 'background'"
        >
          📖 时代背景与世界格局
        </button>
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'ruleSystem' }"
          @click="activeTab = 'ruleSystem'"
        >
          ⚖️ 规则体系与社会常识
        </button>
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'factions' }"
          @click="activeTab = 'factions'"
        >
          🏰 势力与派系 ({{ form.factions.length }})
        </button>
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'terms' }"
          @click="activeTab = 'terms'"
        >
          🏷️ 专有名词与条目 ({{ form.terms.length }})
        </button>
        <button
          class="nst-l1-tab"
          :class="{ active: activeTab === 'macroArcs' }"
          @click="activeTab = 'macroArcs'"
        >
          🗺️ 宏观大纲路线 ({{ form.macroArcs.length }})
        </button>
      </div>

      <!-- Sub Tab Content Body -->
      <div class="nst-l1-body">
        <!-- 1. Characters Tab -->
        <div v-if="activeTab === 'characters'" class="nst-tab-pane">
          <div class="nst-pane-toolbar">
            <div class="nst-toolbar-left">
              <input
                v-model="charSearch"
                type="text"
                class="nst-input nst-search-input"
                placeholder="🔍 搜索人物姓名、身份、特质..."
              />
              <select v-model="charFilterImportance" class="nst-select nst-filter-select">
                <option value="all">全部角色层级</option>
                <option value="protagonist">🌟 第一主角</option>
                <option value="major">👑 主要核心角色</option>
                <option value="supporting">🛡️ 重要配角</option>
                <option value="minor">🌱 侍从/同门/小配角</option>
              </select>
            </div>
            <div class="nst-toolbar-right">
              <button class="nst-btn nst-btn-secondary nst-btn-sm" @click="addCharacter">
                <Icon name="plus" :size="14" />
                添加新角色
              </button>
            </div>
          </div>

          <div class="nst-tip-banner">
            💡 <strong>全角色挖掘</strong>：系统已为你提炼出包含重要配角与小配角的完整图谱。你可以自由编辑人设细节，后续创建角色卡时可指定与任意人物对戏！
          </div>

          <div v-if="filteredCharacters.length === 0" class="nst-empty-sub">
            暂无匹配的人物条目，可点击右上角“添加新角色”或“开始 AI 提炼”
          </div>

          <div class="nst-cards-grid">
            <div
              v-for="(char, idx) in filteredCharacters"
              :key="char.id"
              class="nst-char-card"
              :class="`imp-${char.importance}`"
            >
              <div class="nst-card-top">
                <div class="nst-card-title-row">
                  <input
                    v-model="char.name"
                    type="text"
                    class="nst-input nst-char-name-input"
                    placeholder="角色名"
                  />
                  <select v-model="char.importance" class="nst-select nst-imp-select">
                    <option value="protagonist">🌟 主角</option>
                    <option value="major">👑 核心</option>
                    <option value="supporting">🛡️ 配角</option>
                    <option value="minor">🌱 小配角</option>
                  </select>
                </div>
                <button
                  class="nst-btn-icon-del"
                  title="删除该角色"
                  @click="removeCharacter(idx)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>

              <div class="nst-card-fields">
                <div class="nst-field-row">
                  <label>身份地位：</label>
                  <input
                    v-model="char.identity"
                    type="text"
                    class="nst-input"
                    placeholder="例如：司礼监掌印太监 / 萧家三少爷"
                  />
                </div>
                <div class="nst-field-row">
                  <label>所属势力：</label>
                  <input
                    v-model="char.faction"
                    type="text"
                    class="nst-input"
                    placeholder="所属派系"
                  />
                </div>
                <div class="nst-field-row">
                  <label>初始态度：</label>
                  <input
                    v-model="char.initialRelation"
                    type="text"
                    class="nst-input"
                    placeholder="与主角的初始态度/关系"
                  />
                </div>
                <div class="nst-field-col">
                  <label>性格与说话习惯：</label>
                  <input
                    v-model="char.personality"
                    type="text"
                    class="nst-input"
                    placeholder="例如：喜怒无常、阴柔狠戾，极少展露真心"
                  />
                </div>
                <div class="nst-field-col">
                  <label>人物小传、秘密与底线软肋：</label>
                  <textarea
                    v-model="char.summary"
                    class="nst-textarea nst-textarea-sm"
                    rows="3"
                    placeholder="生平背景、不可退让的底线与隐藏动机..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Background Tab -->
        <div v-else-if="activeTab === 'background'" class="nst-tab-pane">
          <div class="nst-pane-desc">
            📖 <strong>时代背景与世界格局</strong>：描述小说所处的时代渊源、朝堂制度、地理山河、大千世界宏观环境，为 AI 奠定叙事基调。
          </div>
          <textarea
            v-model="form.background"
            class="nst-textarea nst-textarea-large"
            rows="14"
            placeholder="时代背景、历史脉络与世界格局设定..."
          ></textarea>
        </div>

        <!-- 3. Rule System Tab -->
        <div v-else-if="activeTab === 'ruleSystem'" class="nst-tab-pane">
          <div class="nst-pane-desc">
            ⚖️ <strong>规则体系与社会常识</strong>：包括朝廷律法、力量层级（境界/功法/阶级）、社会禁忌与不可逾越的规则，防止 AI 产生违和幻觉。
          </div>
          <textarea
            v-model="form.ruleSystem"
            class="nst-textarea nst-textarea-large"
            rows="14"
            placeholder="律法等级、阶级制度、力量境界与不可违背的世界公理..."
          ></textarea>
        </div>

        <!-- 4. Factions Tab -->
        <div v-else-if="activeTab === 'factions'" class="nst-tab-pane">
          <div class="nst-pane-toolbar">
            <span class="nst-pane-desc">🏰 <strong>各派势力与宗门组织</strong>（共 {{ form.factions.length }} 个）</span>
            <button class="nst-btn nst-btn-secondary nst-btn-sm" @click="addFaction">
              <Icon name="plus" :size="14" />
              添加新势力
            </button>
          </div>

          <div class="nst-cards-grid">
            <div
              v-for="(fac, idx) in form.factions"
              :key="fac.id"
              class="nst-faction-card"
            >
              <div class="nst-card-top">
                <input
                  v-model="fac.name"
                  type="text"
                  class="nst-input nst-card-title-input"
                  placeholder="势力名称"
                />
                <button
                  class="nst-btn-icon-del"
                  title="删除该势力"
                  @click="removeFaction(idx)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>

              <div class="nst-card-fields">
                <div class="nst-field-row">
                  <label>掌权领袖：</label>
                  <input
                    v-model="fac.leader"
                    type="text"
                    class="nst-input"
                    placeholder="领袖姓名"
                  />
                </div>
                <div class="nst-field-row">
                  <label>核心立场：</label>
                  <input
                    v-model="fac.stance"
                    type="text"
                    class="nst-input"
                    placeholder="例如：朝廷中枢 / 宗门正统 / 隐秘敌对"
                  />
                </div>
                <div class="nst-field-col">
                  <label>职能与背景概述：</label>
                  <textarea
                    v-model="fac.summary"
                    class="nst-textarea nst-textarea-sm"
                    rows="3"
                    placeholder="势力核心特权、驻地、内部矛盾与影响范围..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Terms Tab -->
        <div v-else-if="activeTab === 'terms'" class="nst-tab-pane">
          <div class="nst-pane-toolbar">
            <div class="nst-toolbar-left">
              <select v-model="termCategoryFilter" class="nst-select nst-filter-select">
                <option value="all">全部类型条目</option>
                <option value="location">📍 重要地点</option>
                <option value="item">🔮 秘宝/信物/道具</option>
                <option value="concept">📜 功法/术语/概念</option>
                <option value="custom">🔖 自定义条目</option>
              </select>
            </div>
            <button class="nst-btn nst-btn-secondary nst-btn-sm" @click="addTerm">
              <Icon name="plus" :size="14" />
              添加专有名词
            </button>
          </div>

          <div class="nst-cards-grid">
            <div
              v-for="(t, idx) in filteredTerms"
              :key="t.id"
              class="nst-term-card"
            >
              <div class="nst-card-top">
                <input
                  v-model="t.name"
                  type="text"
                  class="nst-input nst-card-title-input"
                  placeholder="名词名称"
                />
                <select v-model="t.category" class="nst-select nst-term-cat-select">
                  <option value="location">📍 地点</option>
                  <option value="item">🔮 道具</option>
                  <option value="concept">📜 概念</option>
                  <option value="custom">🔖 自定义</option>
                </select>
                <button
                  class="nst-btn-icon-del"
                  title="删除条目"
                  @click="removeTerm(idx)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>

              <div class="nst-card-fields">
                <textarea
                  v-model="t.content"
                  class="nst-textarea nst-textarea-sm"
                  rows="3"
                  placeholder="专有名词的渊源与详细定义..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Macro Arcs Tab -->
        <div v-else-if="activeTab === 'macroArcs'" class="nst-tab-pane">
          <div class="nst-pane-toolbar">
            <span class="nst-pane-desc">🗺️ <strong>宏观篇章路线图</strong>（共 {{ form.macroArcs.length }} 卷）</span>
            <button class="nst-btn nst-btn-secondary nst-btn-sm" @click="addMacroArc">
              <Icon name="plus" :size="14" />
              添加篇章
            </button>
          </div>

          <div class="nst-macro-arcs-list">
            <div
              v-for="(arc, idx) in form.macroArcs"
              :key="arc.id"
              class="nst-macro-arc-card"
            >
              <div class="nst-arc-header">
                <span class="nst-arc-badge">卷 {{ arc.index || idx + 1 }}</span>
                <input
                  v-model="arc.title"
                  type="text"
                  class="nst-input nst-arc-title-input"
                  placeholder="篇章标题"
                />
                <input
                  v-model="arc.chapterRange"
                  type="text"
                  class="nst-input nst-arc-range-input"
                  placeholder="覆盖章节（如：第1章~第20章）"
                />
                <button
                  class="nst-btn-icon-del"
                  title="删除本篇章"
                  @click="removeMacroArc(idx)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>
              <div class="nst-arc-body">
                <div class="nst-field-row">
                  <label>核心戏剧冲突：</label>
                  <input
                    v-model="arc.coreConflict"
                    type="text"
                    class="nst-input"
                    placeholder="该卷的主要矛盾与对抗"
                  />
                </div>
                <div class="nst-field-col">
                  <label>剧情主线概述：</label>
                  <textarea
                    v-model="arc.summary"
                    class="nst-textarea nst-textarea-sm"
                    rows="2"
                    placeholder="起承转合与主要大事件..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="nst-l1-footer">
        <div class="nst-footer-notice">
          💡 本步骤保存后将同步至内存与本地记忆库（暂不生成外部酒馆文件）。
        </div>
        <div class="nst-footer-btns">
          <button class="nst-btn nst-btn-secondary" @click="emit('close')">
            取消
          </button>
          <button class="nst-btn nst-btn-primary" @click="handleSaveWorldview">
            <Icon name="check" :size="15" />
            确认并保存世界观
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nst-modal-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.nst-l1-modal {
  width: 1000px;
  max-width: 95vw;
  height: 88vh;
  background-color: var(--nst-bg-primary, #ffffff);
  border: 1px solid var(--nst-border, #e5e0d8);
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--nst-text-primary, #2b2b2b);
}

.nst-l1-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border-bottom: 1px solid var(--nst-border, #e5e0d8);
}

.nst-l1-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nst-l1-tag {
  background: var(--nst-accent, #b45309);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.nst-l1-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.nst-l1-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nst-extracting-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  background-color: rgba(180, 83, 9, 0.08);
  border-bottom: 1px solid rgba(180, 83, 9, 0.2);
}

.nst-extract-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(180, 83, 9, 0.2);
  border-top-color: var(--nst-accent, #b45309);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.nst-extract-msg {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.nst-extract-msg span {
  font-size: 12px;
  color: var(--nst-text-secondary, #666);
}

.nst-l1-stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border-bottom: 1px solid var(--nst-border, #e5e0d8);
  font-size: 13px;
}

.nst-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--nst-text-secondary, #666);
}

.nst-stat-item strong {
  color: var(--nst-accent, #b45309);
  font-size: 14px;
}

.nst-stat-protagonist {
  margin-left: auto;
}

.nst-input-inline {
  width: 120px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 600;
}

.nst-l1-nav-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border-bottom: 1px solid var(--nst-border, #e5e0d8);
  overflow-x: auto;
}

.nst-l1-tab {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--nst-text-secondary, #666);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.nst-l1-tab:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: var(--nst-text-primary, #2b2b2b);
}

.nst-l1-tab.active {
  background-color: var(--nst-accent, #b45309);
  color: #ffffff;
  border-color: var(--nst-accent, #b45309);
}

.nst-l1-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background-color: var(--nst-bg-primary, #ffffff);
}

.nst-tab-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nst-pane-desc {
  font-size: 13px;
  color: var(--nst-text-secondary, #666);
  line-height: 1.5;
}

.nst-tip-banner {
  padding: 10px 14px;
  background-color: rgba(180, 83, 9, 0.06);
  border: 1px dashed rgba(180, 83, 9, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: var(--nst-text-primary, #333);
}

.nst-pane-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nst-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.nst-search-input {
  max-width: 260px;
}

.nst-filter-select {
  width: 150px;
}

.nst-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 14px;
}

.nst-char-card,
.nst-faction-card,
.nst-term-card {
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border: 1px solid var(--nst-border, #e5e0d8);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-char-card.imp-protagonist {
  border-color: rgba(180, 83, 9, 0.5);
  box-shadow: 0 0 0 1px rgba(180, 83, 9, 0.15);
}

.nst-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nst-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.nst-char-name-input,
.nst-card-title-input {
  font-weight: 700;
  font-size: 14px;
}

.nst-imp-select,
.nst-term-cat-select {
  width: 105px;
  font-size: 12px;
  padding: 4px 6px;
}

.nst-btn-icon-del {
  background: transparent;
  border: none;
  color: var(--nst-text-secondary, #999);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.nst-btn-icon-del:hover {
  color: #dc2626;
  background-color: rgba(220, 38, 38, 0.1);
}

.nst-card-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.nst-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-field-row label {
  width: 70px;
  color: var(--nst-text-secondary, #666);
  flex-shrink: 0;
}

.nst-field-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-field-col label {
  color: var(--nst-text-secondary, #666);
}

.nst-textarea-large {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  min-height: 340px;
}

.nst-textarea-sm {
  font-size: 12px;
  line-height: 1.4;
  padding: 6px 8px;
  resize: vertical;
}

.nst-macro-arcs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nst-macro-arc-card {
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border: 1px solid var(--nst-border, #e5e0d8);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-arc-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nst-arc-badge {
  background-color: var(--nst-accent, #b45309);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.nst-arc-title-input {
  flex: 2;
  font-weight: 700;
}

.nst-arc-range-input {
  flex: 1;
}

.nst-arc-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.nst-l1-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: var(--nst-bg-secondary, #fcfbf9);
  border-top: 1px solid var(--nst-border, #e5e0d8);
}

.nst-footer-notice {
  font-size: 12px;
  color: var(--nst-text-secondary, #777);
}

.nst-footer-btns {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nst-empty-sub {
  text-align: center;
  padding: 40px 20px;
  color: var(--nst-text-secondary, #888);
  font-size: 13px;
}
</style>
