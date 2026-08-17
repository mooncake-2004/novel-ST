<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import NavBar from '@/components/NavBar.vue';
import { getPage } from '@/pages/registry';
import { closeNovelST, modalHost, toggleTheme, ui } from '@/state/ui';
import { computed } from 'vue';

const currentPage = computed(() => getPage(ui.activeTab));
</script>

<template>
  <div class="nst-root" :data-theme="ui.theme">
    <!-- Teleport target for modals inside shadow DOM -->
    <div ref="modalHost"></div>

    <!-- Main Window Overlay -->
    <Transition name="nst-fade">
      <div v-if="ui.isOpen" class="nst-overlay" @click.self="closeNovelST">
        <div class="nst-window" @click.stop>
          <!-- Window Header -->
          <div class="nst-header">
            <div class="nst-title-area">
              <h1 class="nst-logo-title">Novel-ST · 剧情沙盒</h1>
            </div>

            <div class="nst-header-actions">
              <!-- Theme Toggle Button -->
              <button
                class="nst-icon-btn"
                type="button"
                :title="ui.theme === 'light' ? '切换为暗色模式' : '切换为亮色模式'"
                @click="toggleTheme"
              >
                <Icon :name="ui.theme === 'light' ? 'moon' : 'sun'" :size="16" />
              </button>

              <!-- Close Button -->
              <button
                class="nst-icon-btn"
                type="button"
                title="关闭"
                @click="closeNovelST"
              >
                <Icon name="close" :size="16" />
              </button>
            </div>
          </div>

          <!-- Top Navigation Bar -->
          <NavBar />

          <!-- Body Content Area -->
          <div class="nst-body">
            <component :is="currentPage.component" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.nst-fade-enter-active,
.nst-fade-leave-active {
  transition: opacity 0.2s ease;
}

.nst-fade-enter-from,
.nst-fade-leave-to {
  opacity: 0;
}
</style>
