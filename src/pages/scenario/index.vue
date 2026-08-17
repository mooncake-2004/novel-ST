<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { ref } from 'vue';

const mockScenes = ref([
  {
    id: 'canon_001',
    title: '第一幕：退婚之辱与立誓',
    location: '乌坦城 · 萧家大厅',
    characters: ['萧炎 (玩家)', '纳兰嫣然', '葛叶', '萧战'],
    status: 'active',
    summary: '纳兰嫣然携云岚宗葛叶执事登门强势退婚，奉上聚气丹补偿。',
    canonGoals: [
      { text: '隐忍葛叶与纳兰嫣然的言语施压', done: true },
      { text: '断然拒绝聚气丹赔偿', done: true },
      { text: '咬破手指手书休书，立下三年之约', done: false },
    ],
    oocHint: '原著中萧炎在此处掷地有声喊出“三十年河东，三十年河西，莫欺少年穷！”，震撼全场。',
  },
  {
    id: 'canon_002',
    title: '第二幕：药老苏醒与焚决现世',
    location: '后山悬崖',
    characters: ['萧炎 (玩家)', '药老'],
    status: 'pending',
    summary: '萧炎在后山发泄情绪时，戒指中的药老灵魂现身，坦白吸收斗气真相并收徒。',
    canonGoals: [
      { text: '识破戒指异象并与药老初次对话', done: false },
      { text: '正式拜师药老，了解炼药师之道', done: false },
    ],
    oocHint: '原著中药老以炼药术和地阶功法诱惑萧炎，萧炎以机敏与尊师重道打动药老。',
  },
]);
</script>

<template>
  <div class="nst-scenario-page">
    <div class="nst-page-header">
      <div class="nst-page-title-group">
        <h2 class="nst-page-title">小说大纲与分镜导航</h2>
        <span class="nst-page-subtitle">当前剧本：《斗破苍穹》（示例片段）</span>
      </div>
      <div class="nst-header-actions">
        <button class="nst-btn nst-btn-secondary nst-btn-sm">
          <Icon name="refresh" :size="14" />
          重新清洗分镜
        </button>
        <button class="nst-btn nst-btn-primary nst-btn-sm">
          <Icon name="plus" :size="14" />
          导入新小说
        </button>
      </div>
    </div>

    <!-- Active Scene Card (HUD Preview) -->
    <div class="nst-active-scene-card">
      <div class="nst-scene-tag">当前进行中分镜</div>
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
  gap: 8px;
}

.nst-btn-sm {
  padding: 4px 12px;
  font-size: 12px;
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
