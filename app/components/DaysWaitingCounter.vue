<template>
  <div class="card-base bg-cream text-center" role="status" aria-live="polite">
    <span
      class="block heading-display text-coral-deep leading-none nums"
      style="font-size: clamp(2.2rem, 9vw, 3.4rem); letter-spacing: -0.03em"
      >{{ days }}</span
    >
    <p class="mt-2 text-sm font-semibold text-berenjena">{{ $t('counter.label') }}</p>
    <small class="mt-1 block text-xs text-tinta">{{ $t('counter.sub') }}</small>
  </div>
</template>

<script setup lang="ts">
/**
 * Contador "días esperando una nueva línea" (plan clínico · P3c).
 * Día 0 = 30/04/2026, suspensión de la 2ª línea (abemaciclib).
 * Texto real (role=status, aria-live). font-size con clamp() (mobile-first).
 */
const DAY_ZERO = '2026-04-30'
const days = computed(() =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(`${DAY_ZERO}T00:00:00`).getTime()) / 86400000)
  )
)
</script>
