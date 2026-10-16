<script setup lang="ts">
/** R0 · ¿Salió bien la prueba? Células leídas, células que se usan y genes por célula, por muestra. */
import { fmtN, MUESTRAS, type Bloque, type R0 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number }>()
const d = computed(() => props.b.datos as R0)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
</script>

<template>
  <CelulaBloque :etiqueta="L('Control de calidad', 'Quality check')" :titulo="L('¿Salió bien la prueba?', 'Did the test work?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__intro">{{ L('Antes de mirar qué hay en las células, cuántas se han leído y cuántas se pueden usar.', 'Before looking at what is in the cells: how many were read and how many can be used.') }}</p>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h4 class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h4>
        <dl class="r0">
          <div><dt>{{ L('Células leídas', 'Cells read') }}</dt><dd>{{ f(d.muestras[m].leidas) }}</dd></div>
          <div><dt>{{ L('Células que se usan', 'Cells used') }}</dt><dd>{{ f(d.muestras[m].usadas) }}</dd></div>
          <div><dt>{{ L('Genes distintos por célula, mediana', 'Distinct genes per cell, median') }}</dt><dd>{{ f(d.muestras[m].genes_mediana) }}</dd></div>
        </dl>
        <p class="r0__de">{{ L(`De las leídas, se usan ${f(d.muestras[m].usadas_por_100)} de cada ${f(base)}.`, `Of those read, ${f(d.muestras[m].usadas_por_100)} in every ${f(base)} are used.`) }}</p>
        <CelulaTira :por="d.muestras[m].usadas_por_100" :base="base" />
      </section>
    </div>
    <template #pie>
      {{ L('Una célula se usa si pasa los filtros de calidad: suficientes lecturas y un ARN poco dañado. El hueso se descalcifica antes de cortarlo y eso puede dañar el ARN, así que conviene mirar las dos muestras por separado.',
        'A cell is used if it passes the quality filters: enough reads and little RNA damage. Bone is decalcified before it is cut, which can damage RNA, so the two samples are best looked at separately.') }}
    </template>
  </CelulaBloque>
</template>

<style scoped>
.r0 { margin: 0 0 var(--sp-16); display: grid; gap: var(--sp-12); }
.r0 > div { display: flex; flex-direction: column-reverse; }
.r0 dt { font: var(--tipo-body-sm); color: var(--texto-2); }
.r0 dd { margin: 0; font: var(--tipo-cifra); font-size: clamp(28px, 5vw, 38px); letter-spacing: var(--track-cifra); color: var(--texto-1); }
.r0__de { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); color: var(--texto-1); }
</style>
