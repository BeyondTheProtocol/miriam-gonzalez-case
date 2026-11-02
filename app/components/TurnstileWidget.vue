<template>
  <div v-if="enabled" class="turnstile-wrap" :style="{ minHeight: TAMANOS[tamano].alto + 'px' }">
    <div ref="container" class="turnstile-container" />
    <p v-if="loadError" class="msg-atencion" role="alert">
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

// Los dos tamaños de widget que publica Cloudflare, con sus medidas (consultadas el 2-nov-2026 en
// developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations):
//   normal   300 × 65   el de siempre
//   flexible 100 % del contenedor, MÍNIMO 300, × 65   → no sirve: por debajo de 300 sigue midiendo 300
//   compact  150 × 140  el único que cabe en una columna estrecha (es más alto para compensar el ancho)
// El widget es una caja de ancho FIJO: en una pista de rejilla o de flex a la que no se deja encoger,
// esos 300 px ensanchan la página entera (WCAG 1.4.10, reflow a 320 px). Por eso el componente elige el
// tamaño según lo que mide SU hueco, no según el ancho de la ventana: así cubre también la columna
// estrecha de una tarjeta y el zoom del 400 % sobre 1280 (320 px de ancho efectivo).
const TAMANOS = { normal: { ancho: 300, alto: 65 }, compact: { ancho: 150, alto: 140 } } as const
const tamano = ref<keyof typeof TAMANOS>('normal')

/** El tamaño que cabe en el hueco del widget. Se mide con el contenedor VACÍO: una vez pintado, el
 *  propio widget ensancharía la pista y la medida mentiría. */
function tamanoQueCabe(): keyof typeof TAMANOS {
  const hueco = container.value?.getBoundingClientRect().width ?? 0
  return hueco > 0 && hueco < TAMANOS.normal.ancho ? 'compact' : 'normal'
}

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
  // Con el contenedor ya vacío, lo que mide es el hueco de verdad.
  tamano.value = tamanoQueCabe()
  widgetId = window.turnstile.render(container.value, {
    sitekey: siteKey.value,
    action: props.action ?? 'form',
    theme: 'light',
    size: tamano.value,
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

// Girar el teléfono o cambiar el zoom cambia el hueco. Si el tamaño que cabe ya no es el pintado, se
// vuelve a pintar, pero solo mientras nadie haya resuelto el reto (`settled`): repintar tira el token.
let temporizadorHueco: ReturnType<typeof setTimeout> | undefined
function alCambiarHueco() {
  if (settled || !widgetId) return
  if (temporizadorHueco) clearTimeout(temporizadorHueco)
  temporizadorHueco = setTimeout(() => {
    if (settled || !widgetId) return
    if (tamanoQueCabe() !== tamano.value) renderWidget()
  }, 250)
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
    window.addEventListener('resize', alCambiarHueco)
  } catch {
    settled = true
    clearResolveTimer()
    loadError.value = true
    emit('error')
  }
})

onBeforeUnmount(() => {
  clearResolveTimer()
  window.removeEventListener('resize', alCambiarHueco)
  if (temporizadorHueco) clearTimeout(temporizadorHueco)
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
/* El widget de Cloudflare es una caja de ancho fijo (300 px el normal). Sin esto, esos 300 px pasan a ser
   el mínimo de la pista de rejilla o de flex que lo contiene y ensanchan la PÁGINA: a 320 px el formulario
   de /contacto se salía 54 px y el de /expertos y /ciencia, 29 (medido el 2-nov-2026 en helpmiriam.com).
   `min-width: 0` deja encoger la pista y, al ser contenedor de desplazamiento, su mínimo intrínseco pasa a
   ser 0: lo que no cabe se desliza AQUÍ y no en la página. MEDIDO (2-nov-2026, widget forzado a 300 px a
   320): basta en /expertos y /ciencia (el wrap encoge a 222 px y la página no se sale; sin la guarda, 349),
   y NO basta en /contacto, porque allí la pista implícita de la rejilla se dimensiona por max-content y da
   350 px: eso se arregla en su sitio, con `minmax(0, …)` en la rejilla (regla 2 de retícula del DS).
   La guarda es la red; el caso normal lo resuelve `size: compact` (150 px) cuando el hueco no llega a 300. */
.turnstile-wrap {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
}
.turnstile-container {
  display: flex;
  justify-content: flex-start;
}
</style>