<template>
  <NModal v-model:show="visible" preset="card" title="对话设置" :mask-closable="true" style="max-width: 560px;">
    <div class="settings-body">
      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><HardwareChipOutline /></NIcon>
          <span>模型选择</span>
        </div>
        <NSelect v-model:value="localSettings.model" :options="modelOptions" placeholder="选择模型" clearable />
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><ThermometerOutline /></NIcon>
          <span>温度 (Temperature)</span>
          <span class="setting-value-tag" :class="tempClass">{{ localSettings.temperature.toFixed(1) }}</span>
        </div>
        <NSlider v-model:value="localSettings.temperature" :min="0" :max="2" :step="0.1" :marks="tempMarks" />
        <div class="setting-hint">越高回答越随机，越低越确定</div>
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><OptionsOutline /></NIcon>
          <span>核采样 (Top P)</span>
          <span class="setting-value-tag">{{ localSettings.topP.toFixed(2) }}</span>
        </div>
        <NSlider v-model:value="localSettings.topP" :min="0" :max="1" :step="0.05" :marks="topPMarks" />
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><TextOutline /></NIcon>
          <span>最大 Token 数</span>
          <span class="setting-value-tag">{{ localSettings.maxTokens.toLocaleString() }}</span>
        </div>
        <NSlider v-model:value="localSettings.maxTokens" :min="256" :max="393216" :step="256" :marks="tokenMarks" />
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><SettingsOutline /></NIcon>
          <span>系统提示词</span>
        </div>
        <NInput v-model:value="localSettings.systemPrompt" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="设置 AI 的角色和行为&hellip;" />
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><KeyOutline /></NIcon>
          <span>API Key</span>
        </div>
        <NInput v-model:value="localSettings.apiKey" type="password" show-password-on="click" placeholder="输入 API Key&hellip;" />
      </div>

      <div class="setting-group">
        <div class="setting-label">
          <NIcon size="16" color="#E8742A"><GlobeOutline /></NIcon>
          <span>API 地址</span>
        </div>
        <NInput v-model:value="localSettings.baseUrl" placeholder="https://api.deepseek.com" />
        <div class="setting-hint">支持第三方兼容 API，如 OpenRouter、硅基流动等</div>
      </div>

      <!-- 系统维护 -->
      <div style="border-top: 1px solid var(--n-border-color, #E8E0D3); padding-top: 18px; margin-top: 4px;">
        <div class="setting-label" style="margin-bottom: 10px;">
          <NIcon size="16" color="#E8742A"><RefreshOutline /></NIcon>
          <span>系统维护</span>
        </div>

        <!-- 版本信息 -->
        <div class="update-version-info">
          <div class="update-version-row" v-if="currentVersion">
            <span class="update-version-label">当前版本</span>
            <span class="update-version-value current">{{ currentVersion }}</span>
          </div>
          <div class="update-version-row" v-if="newVersion && newVersion !== currentVersion">
            <span class="update-version-label">最新版本</span>
            <span class="update-version-value latest">{{ newVersion }}</span>
          </div>
          <div class="update-version-row" v-if="updateResult">
            <span class="update-version-label" :style="{ color: updateResult.success ? '#5B8C5A' : '#C45A4A' }">{{ updateResult.success ? '更新结果' : '更新失败' }}</span>
            <span class="update-version-value" :style="{ color: updateResult.success ? '#5B8C5A' : '#C45A4A' }">{{ updateResult.msg }}</span>
          </div>
          <div v-if="!currentVersion && !versionLoading" class="update-version-row">
            <span class="update-version-label" style="color: var(--text-tertiary)">无法获取版本信息</span>
          </div>
          <div v-if="versionLoading" class="update-version-row">
            <span class="update-version-label">正在获取版本...</span>
          </div>
        </div>

        <NButton type="primary" block :loading="updating" @click="handleUpdate" size="large" round style="margin-top: 10px;">
          <template #icon><NIcon><RefreshOutline /></NIcon></template>
          {{ newVersion && newVersion !== currentVersion ? '升级 DeepSeek TUI' : '检查并更新 DeepSeek TUI' }}
        </NButton>
        <div class="setting-hint" style="margin-top: 6px; text-align: center;">
          自动执行 npm update -g deepseek-tui，保持最新版本
        </div>
      </div>
    </div>

    <template #footer>
      <div class="settings-footer">
        <NButton @click="resetDefaults" quaternary size="small">恢复默认</NButton>
        <NSpace>
          <NButton @click="visible = false" quaternary>取消</NButton>
          <NButton type="primary" @click="save">保存设置</NButton>
        </NSpace>
      </div>
    </template>
  </NModal>
</template>

<script setup>
import { NModal, NSelect, NSlider, NButton, NInput, NSpace, NIcon } from 'naive-ui'
import { HardwareChipOutline, ThermometerOutline, OptionsOutline, TextOutline, SettingsOutline, KeyOutline, GlobeOutline, RefreshOutline } from '@vicons/ionicons5'
import { useChatStore, getModelOptions } from '../stores/chat.js'
import { ref, watch, computed } from 'vue'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

const updating = ref(false)
const versionLoading = ref(false)
const currentVersion = ref('')
const newVersion = ref('')
const updateResult = ref(null)

const chatStore = useChatStore()
const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const modelOptions = getModelOptions()

const localSettings = ref({ ...chatStore.settings })
watch(() => props.show, (val) => {
  if (val) {
    localSettings.value = { ...chatStore.settings }
    fetchVersions()
  }
})

const tempMarks = { 0: '精确', 1: '平衡', 2: '创意' }
const topPMarks = { 0: '0', 0.5: '0.5', 1: '1' }
const tokenMarks = { 256: '256', 4096: '4K', 8192: '8K', 16384: '16K', 32768: '32K', 65536: '64K', 131072: '128K', 393216: '384K' }

const tempClass = computed(() => {
  const t = localSettings.value.temperature
  if (t < 0.3) return 'tag-cool'
  if (t < 0.8) return 'tag-warm'
  if (t < 1.3) return 'tag-hot'
  return 'tag-blazing'
})

async function fetchVersions() {
  versionLoading.value = true
  updateResult.value = null
  try {
    const res = await fetch('/api/update-deepseek/check')
    const data = await res.json()
    if (data.current) {
      const m = data.current.match(/(\d+\.\d+\.\d+)/)
      currentVersion.value = m ? m[1] : data.current
    }
    if (data.latest) {
      newVersion.value = data.latest.trim()
    }
  } catch (e) {
    currentVersion.value = ''
    newVersion.value = ''
  }
  versionLoading.value = false
}

async function handleUpdate() {
  const oldVer = currentVersion.value
  updating.value = true
  updateResult.value = null
  try {
    const res = await fetch('/api/update-deepseek', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      updateResult.value = { success: true, msg: '更新完成，请刷新查看新版本' }
    } else {
      updateResult.value = { success: false, msg: data.error || '未知错误' }
    }
    await fetchVersions()
  } catch (e) {
    updateResult.value = { success: false, msg: '网络请求失败' }
  }
  updating.value = false
}

function save() {
  chatStore.updateSettings(localSettings.value)
  visible.value = false
}

function resetDefaults() {
  localSettings.value = {
    model: 'deepseek-chat',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 393216,
    systemPrompt: '',
    apiKey: '',
    baseUrl: '',
  }
}
</script>

<style scoped>
.settings-body { display: flex; flex-direction: column; gap: 22px; }
.setting-group { display: flex; flex-direction: column; gap: 8px; }
.setting-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500;
  color: var(--n-text-color-1, #2D2420);
}
.dark .setting-label, .dark .setting-label span { color: #FFFFFF !important; }
.setting-label span { color: inherit; }
.setting-value-tag {
  margin-left: auto; font-size: 12px; font-weight: 600;
  padding: 2px 10px; border-radius: 10px;
  background: rgba(232, 116, 42, 0.1); color: #E8742A;
}
.tag-cool { background: rgba(91, 140, 90, 0.1); color: #5B8C5A; }
.tag-warm { background: rgba(232, 164, 53, 0.1); color: #E8A835; }
.tag-hot { background: rgba(232, 116, 42, 0.1); color: #E8742A; }
.tag-blazing { background: rgba(196, 90, 74, 0.1); color: #C45A4A; }
.setting-hint { font-size: 12px; opacity: 0.4; }
.settings-footer { display: flex; justify-content: space-between; align-items: center; }

.update-version-info {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 14px; border-radius: 8px;
  background: rgba(232, 116, 42, 0.04);
}
.dark .update-version-info { background: rgba(255, 255, 255, 0.04); }
.update-version-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px;
}
.update-version-label { opacity: 0.6; }
.update-version-value { font-weight: 600; font-variant-numeric: tabular-nums; }
.update-version-value.current { color: var(--n-text-color-1, #2D2420); }
.update-version-value.latest { color: #E8742A; }
.dark .update-version-value.current { color: #FFFFFF; }
</style>