<template>
  <NConfigProvider :locale="zhCN" :theme="currentTheme" :theme-overrides="themeOverrides" :inline-theme-disabled="false">
    <NMessageProvider placement="top">
      <NDialogProvider>
        <router-view />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup>
import { zhCN, darkTheme } from 'naive-ui'
import { useChatStore } from './stores/chat.js'
import { onMounted, ref, watch, computed, provide } from 'vue'

const chatStore = useChatStore()
const isDark = ref(localStorage.getItem('deepseek-theme') === 'dark')

const currentTheme = computed(() => isDark.value ? darkTheme : null)

watch(isDark, (val) => {
  localStorage.setItem('deepseek-theme', val ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', val)
})

const themeOverrides = computed(() => {
  const dark = isDark.value
  return {
    common: {
      primaryColor: '#E8742A',
      primaryColorHover: '#F0883E',
      primaryColorPressed: '#D05E1A',
      primaryColorSuppl: '#E8742A',
      infoColor: '#C8953B',
      successColor: '#5B8C5A',
      warningColor: '#E8A835',
      errorColor: '#C45A4A',
      bodyColor: dark ? '#1A1410' : '#FAF7F2',
      cardColor: dark ? '#241C16' : '#FFFFFF',
      modalColor: dark ? '#241C16' : '#FFFFFF',
      popoverColor: dark ? '#241C16' : '#FFFFFF',
      borderColor: dark ? '#3D3028' : '#E8E0D3',
      dividerColor: dark ? '#3D3028' : '#E8E0D3',
      textColor1: dark ? '#FFFFFF' : '#2D2420',
      textColor2: dark ? '#B8AFA6' : '#6B5F56',
      textColor3: dark ? '#7A7068' : '#9B8E85',
      actionColor: 'rgba(232, 116, 42, ' + (dark ? '0.12' : '0.08') + ')',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    Button: { rippleDuration: '.4s' },
    Input: { borderRadius: '8px' },
    Select: { peers: { InternalSelection: { borderRadius: '8px' } } },
    Slider: { fillColor: '#E8742A', fillColorHover: '#F0883E' },
    Switch: { railColorActive: '#E8742A' },
    Card: {
      titleTextColor: dark ? '#FFFFFF' : '#2D2420',
      headerColor: dark ? '#241C16' : '#FFFFFF',
      color: dark ? '#241C16' : '#FFFFFF',
      textColor: dark ? '#FFFFFF' : '#2D2420',
      closeColor: dark ? '#B8AFA6' : '#6B5F56',
      closeColorHover: dark ? '#FFFFFF' : '#2D2420',
    },
    Modal: {
      titleTextColor: dark ? '#FFFFFF' : '#2D2420',
      textColor: dark ? '#FFFFFF' : '#2D2420',
      closeColor: dark ? '#B8AFA6' : '#6B5F56',
      closeColorHover: dark ? '#FFFFFF' : '#2D2420',
    },
  }
})

provide('appTheme', { isDark, toggle: () => { isDark.value = !isDark.value } })

onMounted(() => { chatStore.init() })
document.documentElement.classList.toggle('dark', isDark.value)
</script>
