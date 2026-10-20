<script setup lang="ts">
/**
 * Elegir muestra en /laminillas: «Todas» (comparar, solo en escritorio) y una por muestra. Una
 * muestra sin la tinción elegida sale atenuada y con borde discontinuo; sigue siendo enfocable y
 * dice por qué en sr-only. Vive arriba, en el selector, en escritorio; en móvil, junto a la imagen.
 */
import type { Idioma, Manifest } from '~/utils/laminillas'

const props = defineProps<{
  manifest: Manifest
  idioma: Idioma
  conTodas: boolean
  todasElegida: boolean
  elegida: (id: string) => boolean
  tiene: (id: string) => boolean
}>()
const emit = defineEmits<{ elige: [id: string | null] }>()
const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
</script>

<template>
  <div class="muestras-chips" role="group" :aria-label="L('Muestra', 'Sample')">
    <button v-if="conTodas" type="button" class="chip" :aria-pressed="todasElegida" @click="emit('elige', null)">{{ L('Todas', 'All') }}</button>
    <button
      v-for="m in manifest.muestras"
      :key="m.id"
      type="button"
      class="chip"
      :aria-pressed="elegida(m.id)"
      :aria-disabled="!tiene(m.id) || undefined"
      @click="tiene(m.id) && emit('elige', m.id)"
    >{{ m.corto[idioma] }}<span v-if="!tiene(m.id)" class="sr-only"> {{ L('(sin esta tinción)', '(no slide for this stain)') }}</span></button>
  </div>
</template>

<style scoped>
/* Misma gramática que los chips de tinción de la página y los radios del visor. */
.muestras-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.chip { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-text) 30%, transparent); background: var(--color-bg-card);
  font: 600 var(--texto-sm) var(--font-body); color: var(--color-text); white-space: nowrap; cursor: pointer; }
.chip[aria-pressed='true'] { background: var(--seleccionado-bg); border-color: var(--color-miriam); text-decoration: underline; text-underline-offset: 4px; }
.chip[aria-disabled='true'] { opacity: .45; cursor: not-allowed; border-style: dashed; }
.chip:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
/* En móvil, una sola línea (las tres caben a 390 px con este relleno; si no, se desliza). */
@media (max-width: 767px) {
  .muestras-chips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .muestras-chips::-webkit-scrollbar { display: none; }
  .chip { padding: 0 10px; }
}
@media (hover: hover) and (pointer: fine) {
  .chip:not([aria-disabled='true']):hover { border-color: var(--color-miriam); }
}
</style>
