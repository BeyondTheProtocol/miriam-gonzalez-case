<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <div
      v-if="visible"
      class="drp"
      role="status"
      aria-live="polite"
    >
      <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-5 h-5 shrink-0 text-coral" aria-hidden="true" />
      <div class="min-w-0">
        <p class="text-sm font-semibold text-cream leading-snug">{{ $t('donatePrompt.q') }}</p>
        <NuxtLink :to="localePath('gracias')" class="drp__cta" @click="dismiss">
          {{ $t('donatePrompt.cta') }}
          <Icon name="ph:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
        </NuxtLink>
      </div>
      <button
        type="button"
        class="drp__close"
        :aria-label="$t('donatePrompt.dismiss')"
        @click="dismiss"
      >
        <Icon name="ph:x-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Aviso suave al volver a la pestaña tras pulsar "Apoyar a Miriam".
 * Con tacto: solo si hubo clic de apoyo (useSupport marca `hm_support_ts`),
 * solo si estuvo fuera > 15 s (tiempo plausible de pasar por GoFundMe), una
 * sola vez por sesión y descartable. Pregunta ("¿Has donado?"), no da por hecho.
 */
const localePath = useLocalePath()
const visible = ref(false)

function maybeShow() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  if (visible.value) return
  let ts: string | null = null
  let done: string | null = null
  try {
    ts = sessionStorage.getItem('hm_support_ts')
    done = sessionStorage.getItem('hm_prompt_done')
  } catch {
    return
  }
  if (done || !ts) return
  if (Date.now() - Number(ts) < 15000) return
  try {
    sessionStorage.removeItem('hm_support_ts')
  } catch {
    /* noop */
  }
  visible.value = true
}

function dismiss() {
  visible.value = false
  try {
    sessionStorage.setItem('hm_prompt_done', '1')
    sessionStorage.removeItem('hm_support_ts')
  } catch {
    /* noop */
  }
}

onMounted(() => document.addEventListener('visibilitychange', maybeShow))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', maybeShow))
</script>

<style scoped>
.drp {
  position: fixed;
  z-index: 60;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 22rem;
  margin-left: auto;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: #2d1b3d;
  box-shadow: 0 16px 40px -12px rgba(45, 27, 61, 0.5);
}
/* Sobre la barra de apoyo persistente (<lg). En desktop queda abajo a la derecha. */
@media (max-width: 1023px) {
  .drp {
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }
}
.drp__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: #ff6b47;
  text-decoration: none;
}
.drp__cta:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.drp__close {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(250, 246, 240, 0.6);
  padding: 2px;
}
.drp__close:hover {
  color: #faf6f0;
}
.drp__cta:focus-visible,
.drp__close:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
