<script setup lang="ts">
/**
 * Referencia bibliográfica (sistema v3, S4): autoría, año, título, revista y DOI en una línea de texto, mono de 13 px.
 * Sustituye a la píldora azul en mayúsculas ×20 de /ciencia/evidencia (`status-badge--reference`): las mayúsculas rompían
 * títulos de revista y DOI, y la píldora no dejaba ver dónde acababa la cita.
 *
 * · El DOI es un enlace `.link-inline` (subrayado siempre, WCAG 1.4.1) a doi.org, en pestaña nueva y avisado.
 * · `nivel` (opcional) dice el escalón de la evidencia —in vitro, modelo animal, caso, cohorte retrospectiva, ensayo,
 *   guía clínica— con palabras. No aplana un resultado preclínico a «esto funciona».
 * · Los espacios entre la cita, la revista, el DOI y el aviso de pestaña nueva son TEXTO (`{{ ' ' }}`): Vue, en modo condense,
 *   elimina el espacio inicial de un <template> y los que hay entre elementos separados por un salto de línea.
 * · Nunca se escribe una referencia que no se haya abierto y verificado: el componente pinta lo que recibe, no lo inventa.
 */
const props = defineProps<{
  autoria: string
  anio: string | number
  titulo: string
  revista?: string
  doi?: string
  nivel?: string
}>()

const urlDoi = computed(() => (props.doi ? `https://doi.org/${props.doi}` : ''))
</script>

<template>
  <p class="referencia">
    <span class="referencia__cita">{{ autoria }} ({{ anio }}). {{ titulo }}.<template v-if="revista">{{ ' ' }}<em>{{ revista }}</em>.</template></span>
    <template v-if="doi">{{ ' ' }}<a :href="urlDoi" class="link-inline referencia__doi" target="_blank" rel="noopener noreferrer">doi:{{ doi }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span></a></template>
    <span v-if="nivel" class="referencia__nivel">{{ nivel }}</span>
  </p>
</template>

<style scoped>
.referencia { margin: 0; font: 400 var(--texto-xs)/1.55 var(--font-mono); color: var(--texto-1); overflow-wrap: anywhere; }
.referencia__nivel { display: block; margin-top: var(--sp-4); color: var(--texto-2); }
</style>
