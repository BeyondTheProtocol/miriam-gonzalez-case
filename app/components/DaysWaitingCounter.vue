<template>
  <!-- Nota de estado, no hito: el raíl es solo para hechos ocurridos. Esto es
       un apunte discreto "a tener en cuenta" — mini-card sutil con el punto
       vivo, arriba de la cronología. -->
  <div
    class="inline-flex items-start gap-3 rounded-xl px-4 py-3"
    style="background: rgba(255, 107, 71, 0.06); border: 1px solid rgba(255, 107, 71, 0.18)"
    role="status"
    aria-live="polite"
  >
    <span
      class="counter-dot mt-[7px] w-2 h-2 shrink-0 rounded-full"
      style="background: #bb4128"
      aria-hidden="true"
    />
    <div>
      <p class="text-sm text-berenjena font-semibold leading-snug">
        <span class="font-display text-coral-deep nums text-xl leading-none align-[-1px]">{{ days }}</span>
        {{ $t('counter.label') }}
      </p>
      <p class="mt-0.5 text-xs text-tinta">{{ $t('counter.sub') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Contador "días esperando una nueva línea de tratamiento".
 * Día 0 = 30/03/2026, suspensión de abemaciclib (fin de la 2ª línea).
 * Texto real (role=status, aria-live).
 */
const DAY_ZERO = '2026-03-30'
const days = computed(() =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(`${DAY_ZERO}T00:00:00`).getTime()) / 86400000)
  )
)
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .counter-dot {
    animation: counter-pulse 2.4s ease-in-out infinite;
  }
  @keyframes counter-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(187, 65, 40, 0.4);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(187, 65, 40, 0);
    }
  }
}
</style>
