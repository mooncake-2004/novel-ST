<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { ref } from 'vue';

const divergenceRate = ref(15);

const plotHooks = ref([
  {
    title: '三年之约伏笔',
    status: 'open',
    originalResolution: '三年后萧炎上云岚宗击败纳兰嫣然',
    currentBranch: '正轨推进中',
  },
  {
    title: '药老身世与魂殿线索',
    status: 'open',
    originalResolution: '药尊者被孽徒韩枫背叛',
    currentBranch: '待药老苏醒后触发',
  },
  {
    title: '古熏儿真实身份与古族',
    status: 'open',
    originalResolution: '远古八族之一古族千金',
    currentBranch: '潜伏保护萧炎中',
  },
]);
</script>

<template>
  <div class="nst-divergence-page">
    <div class="nst-page-header">
      <div>
        <h2 class="nst-page-title">IF 演变与烂尾续写</h2>
        <span class="nst-page-subtitle">因果偏离监控 · 伏笔闭环推演 · 结局番外生成</span>
      </div>
      <button class="nst-btn nst-btn-primary nst-btn-sm">
        <Icon name="divergence" :size="14" />
        推演生成专属番外
      </button>
    </div>

    <!-- Divergence Status Box -->
    <div class="nst-divergence-card">
      <div class="nst-div-header">
        <div class="nst-div-title">当前世界线偏离度：{{ divergenceRate }}% (正轨稳定)</div>
        <span class="nst-div-badge">世界线 α-01</span>
      </div>
      <div class="nst-progress-bar">
        <div class="nst-progress-fill" :style="{ width: divergenceRate + '%' }"></div>
      </div>
      <p class="nst-div-desc">
        当前玩家行为高度契合原著走向，因果网络保持原著收敛。一旦做出重大破坏性决定（如当场击杀纳兰嫣然或投靠云岚宗），系统将触发变轨并由导演模型动态生成 IF 衍生大纲。
      </p>
    </div>

    <!-- Plot Hooks Board (烂尾救赎伏笔看板) -->
    <div class="nst-hooks-section">
      <h3 class="nst-hooks-title">🧩 未闭合伏笔与长线暗线追踪 (Plot Hooks)</h3>
      <div class="nst-hooks-list">
        <div v-for="(h, idx) in plotHooks" :key="idx" class="nst-hook-card">
          <div class="nst-hook-head">
            <div class="nst-hook-name">{{ h.title }}</div>
            <span class="nst-hook-badge">{{ h.currentBranch }}</span>
          </div>
          <div class="nst-hook-body">
            <div class="nst-hook-meta">原著归宿: {{ h.originalResolution }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nst-divergence-page {
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

.nst-btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.nst-divergence-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-div-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-div-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-div-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--nst-accent-bg);
  color: var(--nst-accent);
  font-weight: 600;
}

.nst-progress-bar {
  height: 8px;
  background: var(--nst-bg-card);
  border-radius: 99px;
  overflow: hidden;
}

.nst-progress-fill {
  height: 100%;
  background: var(--nst-primary);
  border-radius: 99px;
  transition: width 0.3s ease;
}

.nst-div-desc {
  margin: 0;
  font-size: 12px;
  color: var(--nst-ink-dim);
  line-height: 1.5;
}

/* Hooks */
.nst-hooks-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-hooks-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-hooks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nst-hook-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius-sm);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-hook-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-hook-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-hook-badge {
  font-size: 11px;
  color: var(--nst-primary);
  font-weight: 500;
}

.nst-hook-meta {
  font-size: 12px;
  color: var(--nst-ink-dim);
}
</style>
