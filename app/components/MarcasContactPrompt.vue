<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <div v-if="visible" class="mcp" role="dialog" aria-live="polite" :aria-label="$t('marcas.popup_title')">
      <Icon name="ph:handshake" class="w-5 h-5 shrink-0 text-miriam-claro mt-0.5" aria-hidden="true" />
      <div class="min-w-0">
        <p class="text-sm font-semibold text-cream leading-snug">{{ $t('marcas.popup_title') }}</p>
        <p class="text-xs text-cream/75 leading-snug mt-0.5">{{ $t('marcas.popup_text') }}</p>
        <NuxtLink :to="localePath('contacto')" class="mcp__cta" @click="dismiss">
          {{ $t('marcas.popup_cta') }}
          <Icon name="ph:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
        </NuxtLink>
      </div>
      <button type="button" class="mcp__close" :aria-label="$t('marcas.popup_dismiss')" @click="dismiss">
        <Icon name="ph:x-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Pop-up de contacto SOLO para /marcas (· /en/brands).
 * Sustituye, en esta ruta, el aviso de donación (DonationReturnPrompt): aquí se
 * negocia una colaboración, no se pide donativo. Apunta a /contacto, nunca a
 * GoFundMe. Aparece una sola vez por sesión, tras unos segundos en la página, y
 * es descartable. Si el visitante ya lo cerró, no vuelve. Sin auto-popup molesto:
 * solo se monta en /marcas (ver v-if en la página) y respeta reduced-motion.
 */
const localePath = useLocalePath()
const visible = ref(false)
const DELAY_MS = 6000
let timer: ReturnType<typeof setTimeout> | null = null

function show() {
  if (visible.value) return
  let done: string | null = null
  try {
    done = sessionStorage.getItem('hm_marcas_prompt_done')
  } catch {
    return
  }
  if (done) return
  visible.value = true
}

function dismiss() {
  visible.value = false
  try {
    sessionStorage.setItem('hm_marcas_prompt_done', '1')
  } catch {
    /* noop */
  }
}

onMounted(() => {
  timer = setTimeout(show, DELAY_MS)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
/* Misma familia visual que DonationReturnPrompt (tarjeta berenjena flotante),
   pero acento violeta (identidad) en vez de coral (acción/donación). */
.mcp {
  position: fixed;
  z-index: 60;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 23rem;
  margin-left: auto;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: #2d1b3d;
  box-shadow: 0 16px 40px -12px rgba(45, 27, 61, 0.5);
}
/* Sobre la barra de apoyo persistente (<lg). En desktop, abajo a la derecha. */
@media (max-width: 1023px) {
  .mcp {
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }
}
.mcp__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: #c77dd2; /* miriam-claro — identidad sobre oscuro */
  text-decoration: none;
}
.mcp__cta:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.mcp__close {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(250, 246, 240, 0.6);
  padding: 2px;
}
.mcp__close:hover {
  color: #faf6f0;
}
.mcp__cta:focus-visible,
.mcp__close:focus-visible {
  outline: 2px solid #c77dd2;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
