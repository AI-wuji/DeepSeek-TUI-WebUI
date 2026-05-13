<script setup>
import { useChatStore } from '../stores/chat.js'
import { ref, onMounted, nextTick, inject } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { SendOutline, StopOutline } from '@vicons/ionicons5'

const chatStore = useChatStore()
const { isDark } = inject('appTheme')
const inputText = ref('')
const textareaRef = ref(null)

function adjustHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || chatStore.isStreaming) return
  chatStore.sendMessage(text)
  inputText.value = ''
  nextTick(() => adjustHeight())
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleStop() {
  chatStore.stopStreaming()
}

onMounted(() => {
  textareaRef.value?.focus()
})
</script>

<template>
  <div class="input-area" :class="{ dark: isDark }">
    <div class="input-wrapper">
      <div class="input-box-outer">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="input-box"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行…"
          rows="1"
          @input="adjustHeight"
          @keydown="handleKeydown"
        ></textarea>
        <div class="input-actions">
          <span class="input-hint" v-if="!inputText.trim()">无极-DeepSeek</span>
          <NButton
            type="primary"
            circle
            size="medium"
            :disabled="!inputText.trim() && !chatStore.isStreaming"
            @click="chatStore.isStreaming ? handleStop() : handleSend()"
            class="send-btn"
          >
            <template #icon>
              <NIcon size="18">
                <StopOutline v-if="chatStore.isStreaming" />
                <SendOutline v-else />
              </NIcon>
            </template>
          </NButton>
        </div>
      </div>
    </div>
    <div class="input-footer">
      <span v-if="chatStore.error" class="error-msg">{{ chatStore.error }}</span>
      <span class="hint">Enter 发送 &middot; Shift+Enter 换行</span>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  padding: 16px 24px 20px;
  background: #FFFFFF;
  flex-shrink: 0;
  border-top: 1px solid var(--n-border-color, #E8E0D3);
}
.dark.input-area { background: #241C16; }

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.input-box-outer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #FAF7F2;
  border: 1px solid var(--n-border-color, #E8E0D3);
  border-radius: 14px;
  padding: 8px 8px 8px 18px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.dark .input-box-outer { background: #1A1410; }
.input-box-outer:focus-within {
  border-color: #E8742A;
  box-shadow: 0 0 0 3px rgba(232, 116, 42, 0.1);
}

.input-box {
  flex: 1;
  resize: none;
  border: none;
  padding: 6px 0;
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  outline: none;
  background: transparent;
  color: var(--n-text-color-1, #2D2420);
  min-height: 24px;
  max-height: 150px;
}
.input-box::placeholder {
  color: var(--n-text-color-3, #9B8E85);
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.input-hint {
  font-size: 11px;
  opacity: 0.3;
  white-space: nowrap;
}

.send-btn {
  flex-shrink: 0;
}

.input-footer {
  max-width: 800px;
  margin: 6px auto 0;
  text-align: center;
}

.hint {
  font-size: 11px;
  opacity: 0.3;
  letter-spacing: 0.2px;
}

.error-msg {
  font-size: 12px;
  color: #C45A4A;
  margin-right: 16px;
}
</style>
