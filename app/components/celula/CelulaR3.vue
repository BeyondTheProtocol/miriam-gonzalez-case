<script setup lang="ts">
/** R3 · Dianas de superficie: de cada 100 células tumorales, cuántas llevan cada gen, con n e IC. */
import { MUESTRAS, type Bloque, type R3 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number; nivel: number }>()
const d = computed(() => props.b.datos as R3)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
</script>

<template>
  <CelulaBloque :etiqueta="L('Dianas', 'Targets')" :titulo="L('¿Qué dianas de superficie hay y en cuántas células?', 'Which surface targets are there, and in how many cells?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__intro">{{ L(`Para cada diana, de cada ${base} células tumorales, cuántas tienen encendido su gen: son los puntos altos. La raya de debajo es el intervalo de confianza (IC): el margen en el que cae la cifra de este trozo.`,
      `For each target, out of every ${base} tumor cells, how many have its gene switched on: the tall dots. The line underneath is the confidence interval (CI): the range in which the figure for this piece falls.`) }}</p>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h4 class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h4>
        <ul class="blq__lista">
          <CelulaFila v-for="g in d.muestras[m].dianas" :key="g.gen" :nombre="g.gen" :g="g" :base="base" :nivel="nivel" />
        </ul>
      </section>
    </div>
    <template #pie>
      {{ L('Un gen encendido no garantiza que la proteína llegue a la superficie. Además, las células de una biopsia no son muestras independientes: el intervalo describe este trozo y se queda corto para el tumor entero.',
        'A gene being switched on does not guarantee that the protein reaches the surface. Cells from one biopsy are also not independent samples: the interval describes this piece and falls short for the whole tumor.') }}
    </template>
  </CelulaBloque>
</template>
