<script setup lang="ts">
/** R0 · ¿Salió bien la prueba? Texto aprobado por Miriam (17-oct-2026); la figura solo pinta las dos cifras de células. */
import { fmtN, MUESTRAS, type Bloque, type R0 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque }>()
const d = computed(() => props.b.datos as R0)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
const maxN = computed(() => Math.max(...MUESTRAS.map((m) => d.value.muestras[m].celulas)))
const ancho = (m: 'higado' | 'hueso') => `${(d.value.muestras[m].celulas / maxN.value) * 100}%`
</script>

<template>
  <CelulaBloque clave="R0" :titulo="L('¿Salió bien la prueba?', 'Did the test work?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__texto">{{ L('Sí, y muy bien. Se analizaron célula a célula dos biopsias: unas 20.600 células del hígado y unas 2.500 del hueso, un tejido especialmente difícil que hay que descalcificar antes de leerlo. Las dos dieron datos de excelente calidad.',
      'Yes, and very well. Two biopsies were analyzed cell by cell: about 20,600 cells from the liver and about 2,500 from the bone, a particularly difficult tissue that has to be decalcified before it can be read. Both gave excellent-quality data.') }}</p>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h4 class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h4>
        <p class="r0__n"><span class="r0__aprox" aria-hidden="true">~</span>{{ f(d.muestras[m].celulas) }} <span class="r0__u">{{ L('células', 'cells') }}</span></p>
        <div class="r0__barra" aria-hidden="true"><span :style="{ width: ancho(m) }" /></div>
      </section>
    </div>
  </CelulaBloque>
</template>

<style scoped>
.r0__n { margin: 0 0 var(--sp-8); font: var(--tipo-cifra); font-size: clamp(32px, 6vw, 44px); letter-spacing: var(--track-cifra); color: var(--texto-1); }
.r0__aprox { color: var(--texto-2); margin-right: 2px; }
.r0__u { font: 400 var(--texto-sm)/1 var(--font-body); letter-spacing: 0; color: var(--texto-2); }
.r0__barra { height: 10px; border-radius: var(--radius-pill); background: var(--trazo-interactivo); overflow: hidden; }
.r0__barra span { display: block; height: 100%; min-width: 6px; border-radius: var(--radius-pill); background: var(--identidad); }
</style>
