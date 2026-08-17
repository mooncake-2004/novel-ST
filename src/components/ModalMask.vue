<script setup lang="ts">
import { modalHost } from '@/state/ui';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <Teleport :to="modalHost || 'body'" :disabled="!modalHost">
    <Transition name="nst-modal-fade">
      <div v-if="open" class="nst-modal-mask" @click.self="emit('close')">
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.nst-modal-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--nst-z-modal);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.nst-modal-fade-enter-active,
.nst-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.nst-modal-fade-enter-from,
.nst-modal-fade-leave-to {
  opacity: 0;
}
</style>
