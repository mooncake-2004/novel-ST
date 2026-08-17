<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    badge?: string;
    open?: boolean;
  }>(),
  { open: false }
);

const expanded = ref(props.open);

watch(
  () => props.open,
  (val) => {
    expanded.value = val;
  }
);
</script>

<template>
  <section class="nst-collapsible" :class="{ 'is-open': expanded }">
    <button
      class="nst-collapsible-head"
      type="button"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <div class="nst-collapsible-left">
        <span class="nst-collapsible-title">{{ title }}</span>
        <span v-if="badge" class="nst-collapsible-badge">{{ badge }}</span>
      </div>
      <Icon name="chevron" class="nst-collapsible-chevron" :size="16" />
    </button>
    <div class="nst-collapsible-outer">
      <div class="nst-collapsible-inner">
        <div class="nst-collapsible-body">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nst-collapsible {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  overflow: hidden;
  transition: border-color var(--nst-dur) var(--nst-ease), box-shadow var(--nst-dur) var(--nst-ease);
}

.nst-collapsible.is-open {
  border-color: var(--nst-border-strong);
  box-shadow: var(--nst-shadow-sm);
}

.nst-collapsible-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  user-select: none;
  font-family: inherit;
  color: var(--nst-ink);
}

.nst-collapsible-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-collapsible-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-collapsible-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--nst-primary-bg);
  color: var(--nst-primary);
  font-weight: 500;
}

.nst-collapsible-chevron {
  color: var(--nst-ink-dim);
  transition: transform var(--nst-dur-slow) var(--nst-ease);
}

.nst-collapsible.is-open .nst-collapsible-chevron {
  transform: rotate(180deg);
}

/* Grid transition */
.nst-collapsible-outer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--nst-dur-slow) var(--nst-ease);
}

.nst-collapsible.is-open .nst-collapsible-outer {
  grid-template-rows: 1fr;
}

.nst-collapsible-inner {
  overflow: hidden;
}

.nst-collapsible-body {
  padding: 4px 18px 18px;
  border-top: 1px solid var(--nst-border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
