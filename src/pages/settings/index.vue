<script setup lang="ts">
import Collapsible from '@/components/Collapsible.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Icon from '@/components/Icon.vue';
import ModalMask from '@/components/ModalMask.vue';
import { fetchModels, testChannel } from '@/api/client';
import {
  novelSettings,
  createNewChannel,
  type ApiChannel,
} from '@/api/settings';
import { toast } from '@/st/toast';
import { updateState, checkForUpdate, performUpdate } from '@/update';
import { onMounted, ref } from 'vue';

onMounted(() => {
  checkForUpdate(false);
});

async function handleUpdateClick() {
  if (updateState.available) {
    await performUpdate();
  } else {
    await checkForUpdate(true);
  }
}

// Channel Editing State
const editingChannel = ref<ApiChannel | null>(null);
const isEditingNew = ref(false);
const isTesting = ref(false);
const testResult = ref<{ ok: boolean; msg: string } | null>(null);
const isFetchingModels = ref(false);
const modelList = ref<string[]>([]);
const showDeleteConfirm = ref(false);
const channelToDelete = ref<ApiChannel | null>(null);
const showKey = ref(false);

function openAddChannel() {
  editingChannel.value = createNewChannel(`自定义渠道 ${novelSettings.channels.length + 1}`);
  isEditingNew.value = true;
  testResult.value = null;
  modelList.value = [];
  showKey.value = false;
}

function openEditChannel(channel: ApiChannel) {
  editingChannel.value = JSON.parse(JSON.stringify(channel));
  isEditingNew.value = false;
  testResult.value = null;
  modelList.value = [];
  showKey.value = false;
}

function closeChannelModal() {
  editingChannel.value = null;
  testResult.value = null;
  modelList.value = [];
}

async function handleTestChannel() {
  if (!editingChannel.value) return;
  isTesting.value = true;
  testResult.value = null;
  try {
    const res = await testChannel(editingChannel.value);
    if (res.ok) {
      testResult.value = { ok: true, msg: `连接成功 (耗时: ${res.latencyMs}ms)` };
      toast.success(`渠道连接成功 (${res.latencyMs}ms)`);
    } else {
      testResult.value = { ok: false, msg: `连接失败: ${res.error}` };
      toast.error(`连接失败: ${res.error}`);
    }
  } catch (e: any) {
    testResult.value = { ok: false, msg: `异常: ${e.message}` };
    toast.error(`测试异常: ${e.message}`);
  } finally {
    isTesting.value = false;
  }
}

async function handleFetchModels() {
  if (!editingChannel.value) return;
  isFetchingModels.value = true;
  try {
    const list = await fetchModels(editingChannel.value);
    if (list.length > 0) {
      modelList.value = list;
      if (!editingChannel.value.model && list[0]) {
        editingChannel.value.model = list[0];
      }
      toast.success(`成功获取 ${list.length} 个模型`);
    } else {
      toast.warning('未获取到模型列表，请手动输入');
    }
  } catch (e: any) {
    toast.error(`获取模型失败: ${e.message}`);
  } finally {
    isFetchingModels.value = false;
  }
}

function saveChannel() {
  if (!editingChannel.value) return;
  if (!editingChannel.value.name.trim()) {
    toast.warning('渠道名称不能为空');
    return;
  }

  const idx = novelSettings.channels.findIndex((c) => c.id === editingChannel.value!.id);
  if (idx >= 0) {
    novelSettings.channels[idx] = { ...editingChannel.value };
  } else {
    novelSettings.channels.push({ ...editingChannel.value });
  }

  toast.success('渠道已保存');
  closeChannelModal();
}

function promptDeleteChannel(channel: ApiChannel) {
  channelToDelete.value = channel;
  showDeleteConfirm.value = true;
}

function confirmDeleteChannel() {
  if (!channelToDelete.value) return;
  const id = channelToDelete.value.id;
  novelSettings.channels = novelSettings.channels.filter((c) => c.id !== id);

  // Clear task assignments if assigned
  if (novelSettings.directorChannel === id) novelSettings.directorChannel = '';
  if (novelSettings.parserChannel === id) novelSettings.parserChannel = '';
  if (novelSettings.summaryChannel === id) novelSettings.summaryChannel = '';
  if (novelSettings.sequelChannel === id) novelSettings.sequelChannel = '';

  toast.info('渠道已删除');
  showDeleteConfirm.value = false;
  channelToDelete.value = null;
  if (editingChannel.value?.id === id) {
    closeChannelModal();
  }
}
</script>

<template>
  <div class="nst-settings-page">
    <!-- Top Settings Header -->
    <div class="nst-settings-topbar">
      <h2 class="nst-settings-main-title">设置</h2>
      <div class="nst-settings-version-group">
        <span class="nst-version-badge">v{{ updateState.current }}</span>
        <button
          class="nst-update-btn"
          :class="{ 'has-new-ver': updateState.available }"
          :disabled="updateState.checking || updateState.updating"
          @click="handleUpdateClick"
        >
          <span v-if="updateState.updating">正在更新...</span>
          <span v-else-if="updateState.checking">检查中...</span>
          <span v-else-if="updateState.available">立即更新至 v{{ updateState.latest }}</span>
          <span v-else>检查更新</span>
        </button>
      </div>
    </div>

    <!-- Master Switch Hero Card -->
    <div class="nst-hero-toggle-card">
      <div class="nst-hero-title-group">
        <div class="nst-hero-stripe"></div>
        <div>
          <div class="nst-hero-title">Novel-ST · 剧情引擎</div>
          <div class="nst-hero-desc">全局总开关：接管小说分镜、因果判定、动态记忆与剧外引导</div>
        </div>
      </div>
      <label class="nst-switch">
        <input type="checkbox" v-model="novelSettings.enabled" />
        <span class="nst-slider"></span>
      </label>
    </div>

    <!-- 1. 基本设置 -->
    <Collapsible title="基本设置" :open="false">
      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">启用侧边栏剧情 HUD</div>
          <div class="nst-field-desc">在酒馆侧边栏实时显示当前分镜目标、原著锦囊与偏离度</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.showHud" />
          <span class="nst-slider"></span>
        </label>
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">HUD 挂载位置</div>
          <div class="nst-field-desc">选择剧情导航浮窗停靠方向</div>
        </div>
        <select class="nst-select nst-field-select" v-model="novelSettings.hudPosition">
          <option value="right">右侧边栏</option>
          <option value="left">左侧边栏</option>
          <option value="float">独立悬浮窗</option>
        </select>
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">自动因果脱轨判定</div>
          <div class="nst-field-desc">每隔若干轮对话后台静默评估玩家是否偏离原著</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.autoEvaluate" />
          <span class="nst-slider"></span>
        </label>
      </div>

      <div v-if="novelSettings.autoEvaluate" class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">判定周期 (轮数)</div>
          <div class="nst-field-desc">每发送几条消息触发一次剧情裁判判定</div>
        </div>
        <input
          type="number"
          min="1"
          max="10"
          class="nst-input nst-field-number"
          v-model.number="novelSettings.evaluateInterval"
        />
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">偏离脱轨阈值 ({{ novelSettings.divergenceThreshold }}%)</div>
          <div class="nst-field-desc">当因果变轨指数超过此阈值时，自动由 LLM 生成全新动态节点接管</div>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          class="nst-range"
          v-model.number="novelSettings.divergenceThreshold"
        />
      </div>
    </Collapsible>

    <!-- 2. 副 API 与 主 API 指派 (重点核心) -->
    <Collapsible title="副 API" :open="true">
      <!-- Task Assignments Dropdowns -->
      <div class="nst-assign-grid">
        <div class="nst-assign-item">
          <label class="nst-assign-label">剧情判定使用</label>
          <select class="nst-select" v-model="novelSettings.directorChannel">
            <option value="">跟随主 API</option>
            <option
              v-for="ch in novelSettings.channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ ch.name }} ({{ ch.model || '未设模型' }})
            </option>
          </select>
        </div>

        <div class="nst-assign-item">
          <label class="nst-assign-label">分镜清洗使用</label>
          <select class="nst-select" v-model="novelSettings.parserChannel">
            <option value="">跟随主 API</option>
            <option
              v-for="ch in novelSettings.channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ ch.name }} ({{ ch.model || '未设模型' }})
            </option>
          </select>
        </div>

        <div class="nst-assign-item">
          <label class="nst-assign-label">动态记忆使用</label>
          <select class="nst-select" v-model="novelSettings.summaryChannel">
            <option value="">跟随主 API</option>
            <option
              v-for="ch in novelSettings.channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ ch.name }} ({{ ch.model || '未设模型' }})
            </option>
          </select>
        </div>

        <div class="nst-assign-item">
          <label class="nst-assign-label">续写番外使用</label>
          <select class="nst-select" v-model="novelSettings.sequelChannel">
            <option value="">跟随主 API</option>
            <option
              v-for="ch in novelSettings.channels"
              :key="ch.id"
              :value="ch.id"
            >
              {{ ch.name }} ({{ ch.model || '未设模型' }})
            </option>
          </select>
        </div>
      </div>

      <div class="nst-hint-banner">
        不指派渠道时跟随主 API: 直接借用你主界面当前正在用的 API (聊天补全/文本补全) 执行任务，无需额外配置。想用不同模型再在下方建副渠道指派。
      </div>

      <!-- Channels List Section -->
      <div class="nst-channels-section">
        <div class="nst-channels-header">
          <span class="nst-channels-title">渠道</span>
          <button class="nst-btn nst-btn-primary nst-btn-sm" @click="openAddChannel">
            <Icon name="plus" :size="14" />
            添加渠道
          </button>
        </div>

        <div class="nst-channels-list">
          <div
            v-for="channel in novelSettings.channels"
            :key="channel.id"
            class="nst-channel-card"
            @click="openEditChannel(channel)"
          >
            <div class="nst-channel-name">{{ channel.name }}</div>
            <div class="nst-channel-model">{{ channel.model || '未配置模型' }}</div>
          </div>

          <div v-if="novelSettings.channels.length === 0" class="nst-empty-channels">
            暂无副渠道，所有任务将默认使用主 API。点击右上角“添加渠道”可配置专属模型。
          </div>
        </div>
      </div>
    </Collapsible>

    <!-- 3. 分镜与清洗设置 -->
    <Collapsible title="分镜与大纲清洗" :open="false">
      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">分镜建议颗粒度 (字数)</div>
          <div class="nst-field-desc">长篇小说自动清洗分镜时的推荐单幕字数 (1500~4000 字最佳)</div>
        </div>
        <input
          type="number"
          min="500"
          max="8000"
          step="500"
          class="nst-input nst-field-number"
          v-model.number="novelSettings.chunkSize"
        />
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">提取原著预期因果 (Canon Outcomes)</div>
          <div class="nst-field-desc">自动抽取出每幕原著发生的重大事件与结局，作为判定基准</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.extractOutcomes" />
          <span class="nst-slider"></span>
        </label>
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">提取在场角色心境与初始状态</div>
          <div class="nst-field-desc">自动解析当前幕各角色入场时的心理、好感度与生理状态</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.extractCharacterState" />
          <span class="nst-slider"></span>
        </label>
      </div>
    </Collapsible>

    <!-- 4. 双轨记忆与时间线设置 -->
    <Collapsible title="双轨记忆与时间线" :open="false">
      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">时间切片防剧透 (Spoiler Protection)</div>
          <div class="nst-field-desc">仅向 AI 注入当前分镜时间点之前的小说记忆，严格锁死未来剧情信息</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.spoilerProtection" />
          <span class="nst-slider"></span>
        </label>
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">IF 动态记忆优先压制</div>
          <div class="nst-field-desc">当玩家创造了与原著冲突的因果时，动态记忆优先于原著世界书生效</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.ifPriority" />
          <span class="nst-slider"></span>
        </label>
      </div>

      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">动态掩码与实体状态覆写 (Dynamic Masking)</div>
          <div class="nst-field-desc">若原著角色在 IF 线中阵亡或退场，自动重写原著 Lorebook 防止诈尸</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.dynamicMasking" />
          <span class="nst-slider"></span>
        </label>
      </div>
    </Collapsible>

    <!-- 5. 注入与上下文设置 -->
    <Collapsible title="注入设置" :open="false">
      <div class="nst-hint-banner">
        插件将在每轮提示词中动态注入【当前分镜目标】与【剧外锦囊】，引导 NPC 与玩家互动。
      </div>
      <div class="nst-field-row">
        <div class="nst-field-info">
          <div class="nst-field-label">顶栏快速入口按钮</div>
          <div class="nst-field-desc">在 SillyTavern 顶栏显示 Novel-ST 快速打开图标</div>
        </div>
        <label class="nst-switch">
          <input type="checkbox" v-model="novelSettings.showTopBarButton" />
          <span class="nst-slider"></span>
        </label>
      </div>
    </Collapsible>

    <!-- 6. 自定义提示词 -->
    <Collapsible title="自定义提示词" :open="false">
      <div class="nst-prompt-block">
        <label class="nst-prompt-label">剧情裁判 / 导演判定 Prompt</label>
        <textarea
          class="nst-textarea"
          v-model="novelSettings.directorPrompt"
          rows="4"
        ></textarea>
      </div>

      <div class="nst-prompt-block">
        <label class="nst-prompt-label">小说分镜清洗与提取 Prompt</label>
        <textarea
          class="nst-textarea"
          v-model="novelSettings.cleanerPrompt"
          rows="4"
        ></textarea>
      </div>

      <div class="nst-prompt-block">
        <label class="nst-prompt-label">剧外锦囊引导 Prompt</label>
        <textarea
          class="nst-textarea"
          v-model="novelSettings.oocGuidePrompt"
          rows="3"
        ></textarea>
      </div>

      <div class="nst-prompt-block">
        <label class="nst-prompt-label">烂尾小说续写与 IF 演变 Prompt</label>
        <textarea
          class="nst-textarea"
          v-model="novelSettings.sequelPrompt"
          rows="3"
        ></textarea>
      </div>
    </Collapsible>

    <!-- Channel Edit Modal Dialog -->
    <ModalMask :open="!!editingChannel" @close="closeChannelModal">
      <div v-if="editingChannel" class="nst-modal-card" @click.stop>
        <div class="nst-modal-head">
          <h3 class="nst-modal-title">
            {{ isEditingNew ? '添加副 API 渠道' : '编辑渠道: ' + editingChannel.name }}
          </h3>
          <button class="nst-icon-btn" @click="closeChannelModal">
            <Icon name="close" :size="16" />
          </button>
        </div>

        <div class="nst-modal-body">
          <div class="nst-form-group">
            <label class="nst-form-label">渠道名称</label>
            <input
              type="text"
              class="nst-input"
              v-model="editingChannel.name"
              placeholder="例如：硅基流动-DeepSeek / FUFU"
            />
          </div>

          <div class="nst-form-group">
            <label class="nst-form-label">Base URL (OpenAI 兼容)</label>
            <input
              type="text"
              class="nst-input"
              v-model="editingChannel.url"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div class="nst-form-group">
            <label class="nst-form-label">API Key (密钥)</label>
            <div class="nst-input-password-wrap">
              <input
                :type="showKey ? 'text' : 'password'"
                class="nst-input"
                v-model="editingChannel.key"
                placeholder="sk-..."
              />
              <button
                type="button"
                class="nst-toggle-eye-btn"
                @click="showKey = !showKey"
              >
                {{ showKey ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="nst-form-group">
            <div class="nst-label-with-action">
              <label class="nst-form-label">模型名称 (Model)</label>
              <button
                type="button"
                class="nst-btn-link"
                :disabled="isFetchingModels"
                @click="handleFetchModels"
              >
                {{ isFetchingModels ? '获取中...' : '拉取模型列表' }}
              </button>
            </div>

            <div v-if="modelList.length > 0" class="nst-model-select-wrap">
              <select class="nst-select" v-model="editingChannel.model">
                <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <input
              v-else
              type="text"
              class="nst-input"
              v-model="editingChannel.model"
              placeholder="如 deepseek-ai/DeepSeek-V3 / gpt-4o"
            />
          </div>

          <div class="nst-form-grid-2">
            <div class="nst-form-group">
              <label class="nst-form-label">Temperature: {{ editingChannel.temperature }}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                class="nst-range"
                v-model.number="editingChannel.temperature"
              />
            </div>

            <div class="nst-form-group">
              <label class="nst-form-label">Max Tokens</label>
              <input
                type="number"
                min="256"
                max="32768"
                step="256"
                class="nst-input"
                v-model.number="editingChannel.maxTokens"
              />
            </div>
          </div>

          <div class="nst-form-group">
            <label class="nst-form-label">超时时间 (秒)</label>
            <input
              type="number"
              min="10"
              max="600"
              class="nst-input"
              v-model.number="editingChannel.timeoutSec"
            />
          </div>

          <div v-if="testResult" class="nst-test-result" :class="testResult.ok ? 'is-ok' : 'is-err'">
            {{ testResult.msg }}
          </div>
        </div>

        <div class="nst-modal-footer">
          <button
            v-if="!isEditingNew"
            class="nst-btn nst-btn-danger"
            @click="promptDeleteChannel(editingChannel!)"
          >
            <Icon name="trash" :size="14" />
            删除
          </button>
          <div class="nst-spacer"></div>
          <button
            class="nst-btn nst-btn-secondary"
            :disabled="isTesting"
            @click="handleTestChannel"
          >
            <Icon name="zap" :size="14" />
            {{ isTesting ? '测试中...' : '测试连接' }}
          </button>
          <button class="nst-btn nst-btn-primary" @click="saveChannel">
            保存
          </button>
        </div>
      </div>
    </ModalMask>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="确认删除渠道"
      :message="`确定要删除渠道「${channelToDelete?.name}」吗？已指派该渠道的任务将自动退回主 API。`"
      :danger="true"
      @confirm="confirmDeleteChannel"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped>
.nst-settings-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Topbar */
.nst-settings-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.nst-settings-main-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--nst-ink);
}

.nst-settings-version-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nst-version-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--nst-radius-pill);
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  font-weight: 600;
}

.nst-update-btn {
  background: var(--nst-bg-card-hover);
  color: var(--nst-ink);
  border: 1px solid var(--nst-border);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: var(--nst-radius-pill);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-update-btn:hover {
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  border-color: transparent;
}

.nst-update-btn.has-new-ver {
  background: var(--nst-primary);
  color: var(--nst-primary-text);
  border-color: transparent;
  animation: nst-pulse 2s infinite;
}

@keyframes nst-pulse {
  0% { box-shadow: 0 0 0 0 rgba(194, 91, 44, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(194, 91, 44, 0); }
  100% { box-shadow: 0 0 0 0 rgba(194, 91, 44, 0); }
}

/* Form row styles */
.nst-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
}

.nst-field-info {
  flex: 1;
}

.nst-field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-field-desc {
  font-size: 12px;
  color: var(--nst-ink-dim);
  margin-top: 2px;
}

.nst-field-select {
  width: 140px;
  flex-shrink: 0;
}

.nst-field-number {
  width: 90px;
  flex-shrink: 0;
}

.nst-range {
  width: 160px;
  accent-color: var(--nst-primary);
}

/* Task Assignments Grid */
.nst-assign-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 6px;
}

.nst-assign-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-assign-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

/* Hint Banner */
.nst-hint-banner {
  font-size: 12px;
  color: var(--nst-ink-dim);
  line-height: 1.5;
  background: var(--nst-bg-base);
  padding: 10px 14px;
  border-radius: var(--nst-radius-sm);
  border-left: 3px solid var(--nst-primary);
}

/* Channels List Section */
.nst-channels-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.nst-channels-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-channels-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.nst-channels-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nst-channel-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--nst-bg-card);
  border-radius: var(--nst-radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--nst-dur) var(--nst-ease);
}

.nst-channel-card:hover {
  background: var(--nst-bg-card-hover);
  border-color: var(--nst-border-strong);
}

.nst-channel-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-channel-model {
  font-size: 12px;
  color: var(--nst-ink-dim);
  font-family: var(--nst-font-mono);
}

.nst-empty-channels {
  font-size: 12px;
  color: var(--nst-ink-faint);
  text-align: center;
  padding: 16px;
  background: var(--nst-bg-card);
  border-radius: var(--nst-radius-sm);
}

/* Prompts */
.nst-prompt-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-prompt-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--nst-ink);
}

/* Modal Card */
.nst-modal-card {
  width: 100%;
  max-width: 520px;
  background: var(--nst-bg-surface);
  border-radius: var(--nst-radius);
  box-shadow: var(--nst-shadow-lg);
  border: 1px solid var(--nst-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nst-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--nst-border);
}

.nst-modal-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 70vh;
  overflow-y: auto;
}

.nst-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nst-form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--nst-ink);
}

.nst-label-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nst-btn-link {
  background: none;
  border: none;
  color: var(--nst-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}
.nst-btn-link:hover {
  text-decoration: underline;
}

.nst-input-password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.nst-toggle-eye-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 12px;
  color: var(--nst-ink-dim);
  cursor: pointer;
}

.nst-form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.nst-test-result {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: var(--nst-radius-sm);
}
.nst-test-result.is-ok {
  background: var(--nst-accent-bg);
  color: var(--nst-accent);
}
.nst-test-result.is-err {
  background: var(--nst-danger-bg);
  color: var(--nst-danger);
}

.nst-modal-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--nst-border);
  background: var(--nst-bg-card);
}

.nst-spacer {
  flex: 1;
}

@media (max-width: 600px) {
  .nst-assign-grid {
    grid-template-columns: 1fr;
  }
}
</style>
