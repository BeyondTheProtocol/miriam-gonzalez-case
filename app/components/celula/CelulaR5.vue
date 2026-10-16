<script setup lang="ts">
/** R5 · Hígado frente a hueso: las mismas dianas, una lesión debajo de la otra, y el cielo de cada muestra. */
import { MUESTRAS, type Bloque, type R5 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number; nivel: number }>()
const d = computed(() => props.b.datos as R5)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
</script>

<template>
  <CelulaBloque :etiqueta="L('Comparación', 'Comparison')" :titulo="L('Hígado frente a hueso', 'Liver versus bone')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__intro">{{ L('Lo mismo, una lesión debajo de la otra, para poder compararlo con la vista. Después, un dibujo de cada muestra.', 'The same figures, one lesion under the other, to compare them by eye. Then a drawing of each sample.') }}</p>
    <ul class="blq__lista r5__lista">
      <li v-for="q in d.dianas" :key="q.gen" class="r5__diana">
        <h4 class="r5__gen">{{ q.gen }}</h4>
        <ul class="blq__lista">
          <CelulaFila v-for="m in MUESTRAS" :key="m" :nombre="nombre(m)" :g="{ gen: q.gen, en_panel: true, ...q[m] }" :base="base" :nivel="nivel" sub />
        </ul>
      </li>
    </ul>
    <h4 class="r5__cielo-t">{{ L('El cielo de cada muestra', 'The sky of each sample') }}</h4>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h5 class="r5__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h5>
        <CelulaCielo :grupos="d.cielo[m].grupos" :alt="L(`Mapa estelar orientativo de la muestra de ${nombre(m).toLowerCase()}. Células por grupo, de mayor a menor tamaño de figura.`, `Orientative star map of the ${nombre(m).toLowerCase()} sample. Cells per group.`)" />
      </section>
    </div>
    <p class="r5__orient">{{ L('Orientativo. Cada figura es un grupo de células parecidas, con la forma de su tipo, y su tamaño sigue el número de células. Dónde cae cada una sirve para ver cuáles se parecen, no para medir distancias.',
      'Orientative. Each shape is a group of similar cells, with the shape of its type, and its size follows the number of cells. Where each one lands shows which look alike, not distances.') }}</p>
    <template #pie>
      {{ L('Son dos lesiones distintas y dos trozos pequeños. Lo que se parezca o se separe entre una cifra y otra es lo que dicen estos trozos, y nada más.',
        'These are two different lesions and two small pieces. Whatever looks alike or apart between one figure and the other is what these pieces say, and no more.') }}
    </template>
  </CelulaBloque>
</template>

<style scoped>
.r5__lista { display: grid; gap: var(--sp-16); }
@media (min-width: 900px) { .r5__lista { grid-template-columns: 1fr 1fr; column-gap: var(--sp-32); } }
.r5__diana { padding: var(--sp-12) var(--sp-16); border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.r5__gen { font: 700 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0 0 var(--sp-8); }
.r5__cielo-t { font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: var(--sp-24) 0 var(--sp-12); }
.r5__mt { display: flex; align-items: center; gap: var(--sp-8); font: 700 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-2); margin: 0 0 var(--sp-8); }
.r5__mt svg { width: 18px; height: 18px; color: var(--identidad); }
.r5__orient { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
</style>
