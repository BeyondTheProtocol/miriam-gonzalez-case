<template>
  <p class="nota">
    <Icon v-if="icon === 'tap'" name="ph:hand-tap" class="nota-icon" aria-hidden="true" />
    <span v-else class="nota-mark" aria-hidden="true">✱</span>
    <span><slot /></span>
  </p>
</template>

<script setup lang="ts">
/**
 * Anotación de navegación: micro-nota que explica cómo usar algo de la página
 * (no es contenido). Voz común en todo el sitio: monoespaciada pequeña +
 * marca magenta. La marca dice el género:
 *   · dedito (icon="tap") → "esto se puede tocar" (gesto, interacción)
 *   · ✱ (por defecto)     → nota al margen / meta (p. ej. última actualización)
 * Política: como mucho una por página, en el primer punto de necesidad;
 * no se repite lo aprendido (la propia affordance — p. ej. el punteado de
 * los términos — ya viaja de página en página).
 */
defineProps<{ icon?: 'tap' }>()
</script>

<style scoped>
.nota {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(58, 51, 64, 0.78);
}
.nota-mark {
  color: #9d44ab;
  flex-shrink: 0;
}
.nota-icon {
  width: 14px;
  height: 14px;
  color: #9d44ab;
  flex-shrink: 0;
  align-self: center;
}
</style>
