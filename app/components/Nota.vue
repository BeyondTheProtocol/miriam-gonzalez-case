<template>
  <p class="nota">
    <span class="nota-mark" aria-hidden="true">✱</span>
    <span><slot /></span>
  </p>
</template>

<script setup lang="ts">
/**
 * Anotación de navegación: micro-nota que explica cómo usar algo de la página
 * (no es contenido). Identificador común en todo el sitio: asterisco magenta
 * + monoespaciada pequeña — el lector la reconoce como "nota al margen".
 * Política: como mucho una por página, en el primer punto de necesidad;
 * no se repite lo aprendido (la propia affordance — p. ej. el punteado de
 * los términos — ya viaja de página en página).
 */
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
</style>
