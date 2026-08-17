<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { PAGES } from '@/pages/registry';
import { ui } from '@/state/ui';

function onTabClick(id: string) {
  ui.activeTab = id;
}
</script>

<template>
  <nav class="nst-navbar">
    <div class="nst-nav-list">
      <button
        v-for="page in PAGES"
        :key="page.id"
        class="nst-nav-item"
        :class="{ 'is-active': ui.activeTab === page.id }"
        type="button"
        @click="onTabClick(page.id)"
      >
        <Icon :name="page.icon" :size="16" class="nst-nav-icon" />
        <span class="nst-nav-label">{{ page.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.nst-navbar {
  display: flex;
  align-items: center;
  padding: 10px 24px 0;
  background: var(--nst-bg-surface);
  border-bottom: 1px solid var(--nst-border);
  overflow-x: auto;
}

.nst-nav-list {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nst-nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--nst-radius-pill);
  border: 1px solid transparent;
  background: transparent;
  color: var(--nst-ink-dim);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--nst-dur) var(--nst-ease);
  user-select: none;
  font-family: inherit;
  white-space: nowrap;
}

.nst-nav-item:hover {
  color: var(--nst-ink);
  background: var(--nst-bg-item);
}

.nst-nav-item.is-active {
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  box-shadow: var(--nst-shadow-sm);
}

.nst-nav-icon {
  flex-shrink: 0;
}
</style>
