<script setup lang="ts">
import ModalMask from '@/components/ModalMask.vue';
import Icon from '@/components/Icon.vue';

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: '确定',
    cancelText: '取消',
    danger: false,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <ModalMask :open="open" @close="emit('cancel')">
    <div class="nst-dialog-box">
      <div class="nst-dialog-header">
        <h3 class="nst-dialog-title">{{ title }}</h3>
        <button class="nst-icon-btn" @click="emit('cancel')">
          <Icon name="close" :size="16" />
        </button>
      </div>
      <div class="nst-dialog-body">
        <p class="nst-dialog-text">{{ message }}</p>
      </div>
      <div class="nst-dialog-footer">
        <button class="nst-btn nst-btn-secondary" @click="emit('cancel')">
          {{ cancelText }}
        </button>
        <button
          class="nst-btn"
          :class="danger ? 'nst-btn-danger' : 'nst-btn-primary'"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </ModalMask>
</template>

<style scoped>
.nst-dialog-box {
  width: 100%;
  max-width: 420px;
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  box-shadow: var(--nst-shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nst-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--nst-border);
}

.nst-dialog-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-dialog-body {
  padding: 18px;
}

.nst-dialog-text {
  margin: 0;
  font-size: 13px;
  color: var(--nst-ink-dim);
  line-height: 1.5;
}

.nst-dialog-footer {
  padding: 12px 18px;
  background: var(--nst-bg-card);
  border-top: 1px solid var(--nst-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>
