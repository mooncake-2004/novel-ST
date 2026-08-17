<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from '@/components/Icon.vue';
import ModalMask from '@/components/ModalMask.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import {
  deleteNovelSource,
  scenarioStore,
  switchActiveNovel,
  updateNovelMeta,
} from '@/scenario/store';
import type { NovelSource } from '@/scenario/types';
import { toast } from '@/st/toast';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-import'): void;
  (e: 'view-chapters', novel: NovelSource): void;
}>();

const searchQuery = ref('');
const novelToDelete = ref<NovelSource | null>(null);

// Edit Meta State
const editingNovel = ref<{ id: string; title: string; protagonist: string } | null>(null);

const filteredNovels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return scenarioStore.novelsList;
  return scenarioStore.novelsList.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      (n.protagonist && n.protagonist.toLowerCase().includes(q))
  );
});

async function handleSwitch(novel: NovelSource) {
  if (novel.id === scenarioStore.activeNovelId) {
    emit('close');
    return;
  }
  await switchActiveNovel(novel.id);
  toast(`已切换至小说《${novel.title}》`, 'success');
  emit('close');
}

function handleStartEdit(novel: NovelSource) {
  editingNovel.value = {
    id: novel.id,
    title: novel.title,
    protagonist: novel.protagonist || '',
  };
}

async function handleSaveEdit() {
  if (!editingNovel.value || !editingNovel.value.title.trim()) {
    toast('小说书名不能为空', 'warning');
    return;
  }
  await updateNovelMeta(
    editingNovel.value.id,
    editingNovel.value.title.trim(),
    editingNovel.value.protagonist.trim()
  );
  toast('小说信息已更新', 'success');
  editingNovel.value = null;
}

function handleConfirmDelete() {
  if (!novelToDelete.value) return;
  const title = novelToDelete.value.title;
  deleteNovelSource(novelToDelete.value.id);
  toast(`已移除小说《${title}》`, 'info');
  novelToDelete.value = null;
}
</script>

<template>
  <ModalMask :open="open" max-width="840px" @close="emit('close')">
    <div class="nst-library-container" @click.stop>
      <!-- Header -->
      <div class="nst-lib-header">
        <div class="nst-lib-title-group">
          <h3 class="nst-lib-title">
            <Icon name="scenario" :size="20" />
            小说书架与剧本库 ({{ scenarioStore.novelsList.length }})
          </h3>
          <span class="nst-lib-subtitle">
            所有已导入的小说均会妥善保存，随时无缝切换，永不丢失分章与设定
          </span>
        </div>

        <div class="nst-lib-header-actions">
          <button class="nst-btn nst-btn-primary nst-btn-sm" @click="emit('open-import')">
            <Icon name="plus" :size="14" />
            导入新小说
          </button>
          <button class="nst-icon-btn" @click="emit('close')">
            <Icon name="close" :size="18" />
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div v-if="scenarioStore.novelsList.length > 0" class="nst-lib-search-bar">
        <input
          v-model="searchQuery"
          type="text"
          class="nst-input nst-search-input"
          placeholder="搜索小说书名、主角姓名..."
        />
      </div>

      <!-- Books Grid / List -->
      <div v-if="filteredNovels.length > 0" class="nst-books-grid">
        <div
          v-for="novel in filteredNovels"
          :key="novel.id"
          class="nst-book-card"
          :class="{ 'is-active': novel.id === scenarioStore.activeNovelId }"
        >
          <!-- Active Badge -->
          <div v-if="novel.id === scenarioStore.activeNovelId" class="nst-active-tag">
            <Icon name="check" :size="12" />
            当前正在游玩
          </div>

          <!-- Book Header -->
          <div class="nst-book-head">
            <div class="nst-book-icon">📚</div>
            <div class="nst-book-info">
              <h4 class="nst-book-title" :title="novel.title">《{{ novel.title }}》</h4>
              <div class="nst-book-protagonist">
                🎭 主角：<strong>{{ novel.protagonist || '原著主角' }}</strong>
              </div>
            </div>
          </div>

          <!-- Book Stats -->
          <div class="nst-book-stats">
            <div class="nst-stat-chip">
              📑 <strong>{{ novel.chapters.length }}</strong> 章节
            </div>
            <div class="nst-stat-chip">
              📝 <strong>{{ (novel.totalChars / 10000).toFixed(1) }}</strong> 万字
            </div>
          </div>

          <!-- Action Footer -->
          <div class="nst-book-footer">
            <div class="nst-footer-left">
              <button
                class="nst-sub-action-btn"
                title="浏览/阅读章节目录"
                @click="emit('view-chapters', novel)"
              >
                章节预览
              </button>
              <button
                class="nst-sub-action-btn"
                title="编辑书名或主角"
                @click="handleStartEdit(novel)"
              >
                编辑
              </button>
              <button
                class="nst-sub-action-btn nst-btn-del"
                title="从书架删除"
                @click="novelToDelete = novel"
              >
                删除
              </button>
            </div>

            <button
              v-if="novel.id === scenarioStore.activeNovelId"
              class="nst-btn nst-btn-secondary nst-btn-xs"
              disabled
            >
              已在当前
            </button>
            <button
              v-else
              class="nst-btn nst-btn-primary nst-btn-xs"
              @click="handleSwitch(novel)"
            >
              切换至此 ➔
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="nst-lib-empty">
        <div class="nst-empty-icon">📖</div>
        <div class="nst-empty-text">
          {{ searchQuery ? '未找到匹配的小说' : '书架空空如也，快去导入你的第一本小说吧！' }}
        </div>
        <button
          v-if="!searchQuery"
          class="nst-btn nst-btn-primary nst-btn-sm"
          @click="emit('open-import')"
        >
          <Icon name="plus" :size="14" />
          立即导入小说
        </button>
      </div>

      <!-- Edit Novel Meta Modal -->
      <ModalMask :open="!!editingNovel" @close="editingNovel = null">
        <div v-if="editingNovel" class="nst-edit-dialog" @click.stop>
          <div class="nst-edit-head">
            <h4>编辑小说信息</h4>
            <button class="nst-icon-btn" @click="editingNovel = null">
              <Icon name="close" :size="16" />
            </button>
          </div>
          <div class="nst-edit-body">
            <div class="nst-form-group">
              <label class="nst-label">小说书名</label>
              <input v-model="editingNovel.title" type="text" class="nst-input" />
            </div>
            <div class="nst-form-group">
              <label class="nst-label">扮演身份 / 主角名称</label>
              <input v-model="editingNovel.protagonist" type="text" class="nst-input" />
            </div>
          </div>
          <div class="nst-edit-foot">
            <button class="nst-btn nst-btn-secondary" @click="editingNovel = null">取消</button>
            <button class="nst-btn nst-btn-primary" @click="handleSaveEdit">保存更改</button>
          </div>
        </div>
      </ModalMask>

      <!-- Delete Confirm Dialog -->
      <ConfirmDialog
        :open="!!novelToDelete"
        title="确认删除小说"
        :message="`确定要从书架删除《${novelToDelete?.title}》吗？这将移除该小说的所有章节与缓存。`"
        confirm-text="确认删除"
        :danger="true"
        @confirm="handleConfirmDelete"
        @cancel="novelToDelete = null"
      />
    </div>
  </ModalMask>
</template>

<style scoped>
.nst-library-container {
  width: 100%;
  max-width: 840px;
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border-strong);
  border-radius: var(--nst-radius);
  box-shadow: var(--nst-shadow-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 85vh;
  box-sizing: border-box;
}

.nst-lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--nst-border);
  padding-bottom: 14px;
}

.nst-lib-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nst-lib-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nst-ink);
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-lib-subtitle {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-lib-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nst-lib-search-bar {
  display: flex;
}

.nst-search-input {
  width: 100%;
  font-size: 13px;
}

/* Books Grid */
.nst-books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  overflow-y: auto;
  padding: 4px 2px;
  max-height: 520px;
}

.nst-book-card {
  background: var(--nst-bg-card);
  border: 1px solid var(--nst-border);
  border-radius: var(--nst-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-book-card:hover {
  background: var(--nst-bg-card-hover);
  border-color: var(--nst-border-strong);
  transform: translateY(-2px);
  box-shadow: var(--nst-shadow-sm);
}

.nst-book-card.is-active {
  border-color: var(--nst-primary);
  background: var(--nst-primary-bg);
}

.nst-active-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--nst-radius-pill);
  display: flex;
  align-items: center;
  gap: 4px;
}

.nst-book-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.nst-book-icon {
  font-size: 24px;
  line-height: 1;
}

.nst-book-info {
  flex: 1;
  overflow: hidden;
}

.nst-book-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--nst-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nst-book-protagonist {
  font-size: 12px;
  color: var(--nst-ink-dim);
}

.nst-book-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-stat-chip {
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border);
  padding: 3px 8px;
  border-radius: var(--nst-radius-sm);
  font-size: 11px;
  color: var(--nst-ink-dim);
}

.nst-stat-chip strong {
  color: var(--nst-ink);
}

.nst-book-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--nst-border);
}

.nst-footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nst-sub-action-btn {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--nst-ink-dim);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.nst-sub-action-btn:hover {
  color: var(--nst-primary);
  background: var(--nst-bg-surface);
}

.nst-btn-del:hover {
  color: var(--nst-danger) !important;
}

.nst-btn-xs {
  padding: 3px 10px;
  font-size: 11px;
}

/* Empty */
.nst-lib-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--nst-ink-dim);
}

.nst-empty-icon {
  font-size: 36px;
}

.nst-empty-text {
  font-size: 13px;
}

/* Edit Dialog */
.nst-edit-dialog {
  width: 100%;
  max-width: 440px;
  background: var(--nst-bg-surface);
  border: 1px solid var(--nst-border-strong);
  border-radius: var(--nst-radius);
  box-shadow: var(--nst-shadow-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nst-edit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-edit-head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-edit-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nst-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-edit-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}
</style>
