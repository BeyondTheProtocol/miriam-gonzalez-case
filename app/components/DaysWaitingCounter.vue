<template>
  <!-- El dato de estado del caso como tag destacado entre los metadatos de la
       cronología: coral, negrita y punto vivo — lo único que late en la fila.
       El title lleva la frase completa para quien quiera el detalle. -->
  <span
    class="counter-tag inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] font-semibold text-coral-deep"
    role="status"
    aria-live="polite"
    :title="$t('counter.label')"
  >
    <span class="counter-dot w-1.5 h-1.5 shrink-0 rounded-full bg-coral" aria-hidden="true" />
    <span><span class="nums">{{ days }}</span> {{ $t('counter.short') }}</span>
  </span>
</template>

<script setup lang="ts">
const { days } = useDaysWaiting()
</script>

<style scoped>
/* Sin velo de fondo coral: el texto coral-deep (#bb4128) se lee sobre crema
   limpia → 5.0:1, pasa WCAG AA (el velo al 10% lo hundía a 4.53:1). El coral
   se conserva como firma: borde + punto + texto. Auditado por Ceci (jul-2026). */
.counter-tag {
  border: 1px solid rgb(var(--color-cta-rgb) / 0.35);
}
</style>
