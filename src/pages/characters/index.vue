<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { ref } from 'vue';

const characters = ref([
  {
    name: '萧炎',
    role: '玩家扮演角色 (User Persona)',
    status: '存活 / 斗之气三段',
    affinity: '—',
    psychology: '自尊心被严重伤害，但内心燃起强烈复仇与证明自我的意志。',
    overwrites: '无偏离覆写',
  },
  {
    name: '纳兰嫣然',
    role: '云岚宗少宗主',
    status: '在场 / 傲慢施压中',
    affinity: '-20 (冷漠/轻视)',
    psychology: '自认退婚并予以聚气丹补偿已仁至义尽，对萧炎的顽抗感到不解与愠怒。',
    overwrites: '原著正常推进',
  },
  {
    name: '葛叶',
    role: '云岚宗执事',
    status: '在场 / 施放威压中',
    affinity: '-40 (敌视)',
    psychology: '凭借大斗师实力维护云岚宗威严，对萧家的不识抬举心生杀机。',
    overwrites: '原著正常推进',
  },
]);
</script>

<template>
  <div class="nst-characters-page">
    <div class="nst-page-header">
      <div>
        <h2 class="nst-page-title">在场角色与状态追踪</h2>
        <span class="nst-page-subtitle">实时心境、好感度与实体状态动态掩码 (Dynamic Masking)</span>
      </div>
    </div>

    <div class="nst-char-grid">
      <div v-for="c in characters" :key="c.name" class="nst-char-card">
        <div class="nst-char-head">
          <div>
            <div class="nst-char-name">{{ c.name }}</div>
            <div class="nst-char-role">{{ c.role }}</div>
          </div>
          <span class="nst-char-status-badge">{{ c.status }}</span>
        </div>

        <div class="nst-char-body">
          <div class="nst-char-info-row">
            <span class="nst-char-label">当前心境:</span>
            <span class="nst-char-val">{{ c.psychology }}</span>
          </div>
          <div class="nst-char-info-row">
            <span class="nst-char-label">对玩家好感:</span>
            <span class="nst-char-val">{{ c.affinity }}</span>
          </div>
          <div class="nst-char-info-row">
            <span class="nst-char-label">状态覆写:</span>
            <span class="nst-char-val nst-char-mask">{{ c.overwrites }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nst-characters-page {
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

.nst-char-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.nst-char-card {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nst-char-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--nst-border);
  padding-bottom: 10px;
}

.nst-char-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-char-role {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-char-status-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 99px;
  background: var(--nst-bg-item);
  color: var(--nst-ink-dim);
  font-weight: 500;
}

.nst-char-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.nst-char-info-row {
  display: flex;
  gap: 8px;
}

.nst-char-label {
  font-weight: 600;
  color: var(--nst-ink);
  flex-shrink: 0;
}

.nst-char-val {
  color: var(--nst-ink-dim);
}

.nst-char-mask {
  color: var(--nst-accent);
}
</style>
