<script setup lang="ts">
/** R1 · Censo «de cada 100 células»: una cuadrícula por muestra y, al lado, qué es cada forma. */
import { CATEGORIAS, fmtN, MUESTRAS, type Bloque, type Categoria, type R1 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number }>()
const d = computed(() => props.b.datos as R1)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
const tipo = (k: Categoria) => ({
  tumoral: L('Células tumorales', 'Tumor cells'), inmune: L('Células inmunes', 'Immune cells'),
  sosten: L('Células de sostén', 'Supporting cells'), otras: L('Otras', 'Other'),
}[k])
const filas = (m: 'higado' | 'hueso') => CATEGORIAS.flatMap((k) => d.value.muestras[m].categorias.filter((c) => c.clave === k))
</script>

<template>
  <CelulaBloque :etiqueta="L('Censo', 'Census')" :titulo="L('¿Qué células hay?', 'Which cells are there?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__intro">{{ L(`Si cada muestra fuera un grupo de ${f(base)} células, así se repartirían. Cada figura es una célula.`, `If each sample were a group of ${f(base)} cells, this is how they would split. Each shape is one cell.`) }}</p>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h4 class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h4>
        <div class="r1">
          <CelulaCuadricula :categorias="d.muestras[m].categorias" :base="base" />
          <ul class="r1__ley blq__lista">
            <li v-for="c in filas(m)" :key="c.clave">
              <svg viewBox="0 0 10 10" class="r1__glifo" aria-hidden="true" focusable="false"><CelulaForma :clave="c.clave" :x="5" :y="5" :r="3.4" /></svg>
              <span class="r1__tipo">{{ tipo(c.clave) }}</span>
              <span class="r1__n"><strong>{{ f(c.por_100) }}</strong> {{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }} · n = {{ f(c.n) }}</span>
            </li>
          </ul>
        </div>
        <p class="r1__tot">{{ L(`Células en total: ${f(d.muestras[m].n_total)}`, `Cells in total: ${f(d.muestras[m].n_total)}`) }}</p>
      </section>
    </div>
    <template #pie>
      {{ L('Es un recuento de este trozo. No dice cuánto pesa cada tipo de célula en el tumor entero ni dónde estaba cada una dentro del trozo.',
        'This is a count for this piece. It does not say how much each cell type weighs in the whole tumor, or where each one sat inside the piece.') }}
    </template>
  </CelulaBloque>
</template>

<style scoped>
.r1 { display: grid; gap: var(--sp-16); grid-template-columns: minmax(0, 150px) 1fr; align-items: start; }
@media (max-width: 420px) { .r1 { grid-template-columns: 1fr; } }
.r1__ley { display: grid; gap: var(--sp-12); }
.r1__ley li { display: grid; grid-template-columns: 20px 1fr; column-gap: var(--sp-8); align-items: center; }
.r1__glifo { width: 20px; height: 20px; grid-row: span 2; }
.r1__tipo { font: 700 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.r1__n { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.r1__n strong { color: var(--texto-1); font-size: var(--texto-sm); }
.r1__tot { margin: var(--sp-16) 0 0; font: 500 12px/1.4 var(--font-mono); color: var(--texto-2); }
</style>
