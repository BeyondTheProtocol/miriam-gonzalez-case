<template>
  <div data-print-hide>
    <button type="button" class="btn-secondary min-h-[44px]" @click="copy">
      <Icon :name="state === 'ok' ? 'ph:check' : 'ph:copy'" class="w-4 h-4" aria-hidden="true" />
      {{ state === 'ok' ? copiedLabel : label }}
    </button>
    <!-- Anuncia el resultado a lector de pantalla sin mover el foco. -->
    <span class="sr-only" role="status" aria-live="polite">{{ state === 'ok' ? copiedLabel : '' }}</span>
    <!-- Si el navegador no deja copiar, el fallo se ve (antes fallaba en silencio). -->
    <p v-if="state === 'error'" class="mt-2 flex items-start gap-2 text-sm text-berenjena" role="alert">
      <Icon name="ph:warning" class="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      {{ failedLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Botón «copiar texto» de la sala de prensa (boilerplate y biografías). Reutiliza `btn-secondary`.
 * Foco intacto; el resultado se anuncia en una región `role="status"`; si falla, se dice.
 */
const props = defineProps<{
  text: string
  label: string
  copiedLabel: string
  failedLabel: string
}>()

const state = ref<'idle' | 'ok' | 'error'>('idle')
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!import.meta.client) return
  clearTimeout(timer)
  try {
    await navigator.clipboard.writeText(props.text)
    state.value = 'ok'
    timer = setTimeout(() => (state.value = 'idle'), 2500)
  } catch {
    state.value = 'error'
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
