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

// Turnstile puede quedarse colgado sin emitir token NI error (sitekey con el
// dominio mal configurado en Cloudflare, red rara, bloqueadores). En ese caso no
// llama a ningún callback y el formulario se quedaría con el botón de envío muerto
// para todo el mundo. Un temporizador de seguridad convierte ese "cuelgue mudo" en
// el mismo camino de degradación que ya tratamos para un error explícito: avisamos
// al padre para que NO bloquee el envío (Netlify mantiene honeypot + antispam).
const RESOLVE_TIMEOUT_MS = 8000
let resolveTimer: ReturnType<typeof setTimeout> | undefined
let settled = false
function clearResolveTimer() {
  if (resolveTimer) {
    clearTimeout(resolveTimer)
    resolveTimer = undefined
  }
}

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
    callback: (token: string) => {
      settled = true
      clearResolveTimer()
      emit('token', token)
    },
    'expired-callback': () => emit('expired'),
    'error-callback': () => {
      settled = true
      clearResolveTimer()
      loadError.value = true
      emit('error')
    },
  })
}

onMounted(async () => {
  if (!enabled.value) return
  // Si en RESOLVE_TIMEOUT_MS no ha llegado token ni error (cuelgue mudo), lo damos
  // por no disponible y avisamos al padre para no dejar el botón bloqueado.
  resolveTimer = setTimeout(() => {
    if (!settled) {
      settled = true
      emit('error')
    }
  }, RESOLVE_TIMEOUT_MS)
  try {
    await loadScript()
    renderWidget()
  } catch {
    settled = true
    clearResolveTimer()
    loadError.value = true
    emit('error')
  }
})

onBeforeUnmount(() => {
  clearResolveTimer()
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