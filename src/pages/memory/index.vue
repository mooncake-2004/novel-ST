<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { ref } from 'vue';

const memoryLayers = ref([
  {
    layer: 'L1: 绝对静态设定 (World Lore)',
    desc: '力量等级（斗者~斗帝）、加玛帝国地理、炼药师品阶等全书不可变规则。',
    entriesCount: 18,
    status: '已载入 SillyTavern 世界书',
  },
  {
    layer: 'L2: 时间线切片记忆 (Canon Snapshot)',
    desc: '截至当前「乌坦城退婚」前，萧炎曾是天才后变为废柴的三年记忆，不含云岚宗后续信息。',
    entriesCount: 8,
    status: '严格锁定时序（防剧透）',
  },
  {
    layer: 'L3: 动态演变记忆 (IF Divergence)',
    desc: '玩家介入后生成的新因果：萧炎当场手撕婚约并立下三年之约。',
    entriesCount: 2,
    status: '优先注入（覆盖原著冲突）',
  },
]);
</script>

<template>
  <div class="nst-memory-page">
    <div class="nst-page-header">
      <div>
        <h2 class="nst-page-title">三层双轨记忆库</h2>
        <span class="nst-page-subtitle">静态世界观 + 阶段时序切片 + 动态 IF 因果追踪</span>
      </div>
      <button class="nst-btn nst-btn-primary nst-btn-sm">
        <Icon name="plus" :size="14" />
        新增设定条目
      </button>
    </div>

    <div class="nst-memory-cards">
      <div v-for="(item, idx) in memoryLayers" :key="idx" class="nst-memory-card">
        <div class="nst-card-head">
          <div class="nst-card-title">{{ item.layer }}</div>
          <span class="nst-card-badge">{{ item.status }}</span>
        </div>
        <p class="nst-card-desc">{{ item.desc }}</p>
        <div class="nst-card-footer">
          <span class="nst-footer-text">包含 {{ item.entriesCount }} 条结构化记忆条目</span>
          <button class="nst-btn-link">查看详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nst-memory-page {
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

.nst-memory-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nst-memory-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nst-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-card-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--nst-primary-bg);
  color: var(--nst-primary);
  font-weight: 600;
}

.nst-card-desc {
  margin: 0;
  font-size: 13px;
  color: var(--nst-ink-dim);
  line-height: 1.5;
}

.nst-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--nst-border);
}

.nst-footer-text {
  font-size: 12px;
  color: var(--nst-ink-faint);
}

.nst-btn-link {
  background: none;
  border: none;
  color: var(--nst-primary);
  font-size: 12px;
  cursor: pointer;
}
</style>
