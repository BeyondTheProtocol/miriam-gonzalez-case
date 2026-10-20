<script setup lang="ts">
/**
 * Elegir muestra en /laminillas: «Comparar» (todas sus muestras, solo en escritorio; no «Todas», que
 * chocaba con «Todas las laminillas») y una por muestra. Una
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
    <button v-if="conTodas" type="button" class="lam-chip" :aria-pressed="todasElegida" @click="emit('elige', null)">{{ L('Comparar', 'Compare') }}</button>
    <button
      v-for="m in manifest.muestras"
      :key="m.id"
      type="button"
      class="lam-chip"
      :aria-pressed="elegida(m.id)"
      :aria-disabled="!tiene(m.id) || undefined"
      @click="tiene(m.id) && emit('elige', m.id)"
    >{{ m.corto[idioma] }}<span v-if="!tiene(m.id)" class="sr-only">{{ ' ' + L('(sin esta tinción)', '(no slide for this stain)') }}</span></button>
  </div>
</template>

<style scoped>
/* Los chips (.lam-chip) viven en main.css, compartidos con el selector de la página. */
.muestras-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
/* En móvil, una sola línea (las tres caben a 390 px; si no, se desliza). El relleno deja sitio al
   anillo de foco, que overflow-x recortaría arriba y abajo. */
@media (max-width: 767px) {
  .muestras-chips { position: relative; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 6px; margin: -6px; }
  .muestras-chips::-webkit-scrollbar { display: none; }
  .muestras-chips :deep(.lam-chip) { padding: 0 10px; }
}
</style>
