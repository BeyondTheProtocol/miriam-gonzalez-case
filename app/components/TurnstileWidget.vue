<template>
  <div v-if="enabled" class="turnstile-wrap">
    <div ref="container" class="turnstile-container" />
    <p v-if="loadError" class="text-xs text-coral-deep" role="alert">
      {{ $t('captcha.load_error') }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  action?: string
}>()

const emit = defineEmits<{
  token: [value: string]
  expired: []
  error: []
}>()

const { siteKey, enabled } = useTurnstile()
const container = ref<HTMLElement | null>(null)
const loadError = ref(false)
let widgetId: string | undefined
let scriptEl: HTMLScriptElement | null = null

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: Record<string, unknown>
      ) => string
      remove: (id: string) => void
      reset: (id: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    window.onTurnstileLoad = () => resolve()
    scriptEl = document.createElement('script')
    scriptEl.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    scriptEl.async = true
    scriptEl.defer = true
    scriptEl.onerror = () => reject(new Error('turnstile script failed'))
    document.head.appendChild(scriptEl)
  })
}

function renderWidget() {
  if (!container.value || !window.turnstile || !siteKey.value) return
  if (widgetId) {
    window.turnstile.remove(widgetId)
    widgetId = undefined
  }
  widgetId = window.turnstile.render(container.value, {
    sitekey: siteKey.value,
    action: props.action ?? 'form',
    theme: 'light',
    language: 'auto',
    callback: (token: string) => emit('token', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => {
      loadError.value = true
      emit('error')
    },
  })
}

onMounted(async () => {
  if (!enabled.value) return
  try {
    await loadScript()
    renderWidget()
  } catch {
    loadError.value = true
    emit('error')
  }
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId)
  }
  if (scriptEl?.parentNode) {
    scriptEl.parentNode.removeChild(scriptEl)
  }
})

defineExpose({
  reset() {
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
  },
})
</script>

<style scoped>
.turnstile-wrap {
  min-height: 65px;
}
.turnstile-container {
  display: flex;
  justify-content: flex-start;
}
</style>