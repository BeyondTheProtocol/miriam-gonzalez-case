<template>
  <p class="nota">
    <Icon v-if="icon === 'tap'" name="ph:hand-tap" class="nota-icon" aria-hidden="true" />
    <Icon v-else name="ph:asterisk-bold" class="nota-icon" aria-hidden="true" />
    <span><slot /></span>
  </p>
</template>

<script setup lang="ts">
/**
 * Anotación de navegación: micro-nota que explica cómo usar algo de la página
 * (no es contenido). Voz común en todo el sitio: monoespaciada pequeña +
 * marca magenta. La marca dice el género:
 *   · dedito (icon="tap") → "esto se puede tocar" (gesto, interacción)
 *   · asterisco (por defecto) → nota al margen / meta (p. ej. última actualización)
 * Política: como mucho una por página, en el primer punto de necesidad;
 * no se repite lo aprendido (la propia affordance — p. ej. el punteado de
 * los términos — ya viaja de página en página).
 */
defineProps<{ icon?: 'tap' }>()
</script>

<style scoped>
.nota {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: var(--texto-xs);
  line-height: 1.55;
  color: var(--texto-3);
  max-width: var(--measure);
}
.nota-icon {
  width: 14px;
  height: 14px;
  color: var(--identidad);
  flex-shrink: 0;
  /* centrado con la primera línea (13 px × 1,55 = 20 px de línea; el icono mide 14) */
  margin-top: 3px;
}
</style>
