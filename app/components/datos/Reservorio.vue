<script setup lang="ts">
/**
 * Reservorio — la longitud del catéter, del portal a la punta, en cada TC: un punto con su margen
 * (± de la medida) sobre un eje en mm. Si el catéter se hubiera retraído o acodado, el punto se
 * iría a la izquierda; las tres caen juntas. Medida semiautomática, sin validar por radiología:
 * lo dice el sello y la fuente. El visor 3D vive en /reservorio (se enlaza desde la página).
 */
import type { Lang } from '~/utils/datosCaso'

interface Medida { fecha: string; longitud_mm: number; margen_mm: number; sello: string }
const props = defineProps<{ medidas: Medida[]; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const FILA = 34
const X0 = 78
const H = computed(() => props.medidas.length * FILA + 30)
const geo = computed(() => {
  const X = linEscala(135, 170, X0, W.value - 10)
  return {
    X, ticks: [140, 150, 160, 170].map((t) => ({ t, x: X(t) })),
    filas: props.medidas.map((m, i) => ({ ...m, y: 16 + i * FILA,
      x: X(m.longitud_mm), xa: X(m.longitud_mm - m.margen_mm), xb: X(m.longitud_mm + m.margen_mm) })),
  }
})
</script>

<template>
  <figure ref="caja" class="rv">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="rv__svg" role="img"
         :aria-label="L('Longitud del catéter en cada TC: ', 'Catheter length on each CT: ') + medidas.map((m) => `${m.fecha} ${numCaso(m.longitud_mm, lang)} mm`).join(', ')">
      <line v-for="tk in geo.ticks" :key="tk.t" :x1="tk.x" :x2="tk.x" y1="4" :y2="H - 20" class="rv__rej" />
      <text v-for="tk in geo.ticks" :key="`t${tk.t}`" :x="tk.x" :y="H - 6" text-anchor="middle" class="rv__tick">{{ tk.t }} mm</text>
      <g v-for="f in geo.filas" :key="f.fecha">
        <text x="0" :y="f.y + 4" class="rv__fecha nums">{{ fechaCorta(f.fecha, lang) }}</text>
        <line :x1="f.xa" :x2="f.xb" :y1="f.y" :y2="f.y" class="rv__margen" />
        <line :x1="f.xa" :x2="f.xa" :y1="f.y - 5" :y2="f.y + 5" class="rv__margen" />
        <line :x1="f.xb" :x2="f.xb" :y1="f.y - 5" :y2="f.y + 5" class="rv__margen" />
        <circle :cx="f.x" :cy="f.y" r="5" class="rv__p" />
        <text :x="f.x" :y="f.y - 9" text-anchor="middle" class="rv__val nums">{{ numCaso(f.longitud_mm, lang) }}</text>
      </g>
    </svg>
  </figure>
</template>

<style scoped>
.rv { margin: 0; }
.rv__svg { display: block; overflow: visible; }
.rv__rej { stroke: var(--viz-rejilla); }
.rv__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.rv__fecha { font: 600 11.5px var(--font-mono); fill: var(--color-text); }
.rv__margen { stroke: var(--color-text); stroke-opacity: 0.55; stroke-width: 1.5; }
.rv__p { fill: var(--color-miriam); }
.rv__val { font: 700 11px var(--font-mono); fill: var(--color-text); }
</style>
