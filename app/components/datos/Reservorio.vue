<script setup lang="ts">
/**
 * Reservorio — el catéter trazado tres veces. Cada línea es la longitud del catéter, del portal a
 * la punta, medida en un TC (24-mar, 10-jul y 8-sep-2026), dibujada desde el mismo origen. Al
 * entrar en pantalla se trazan una tras otra y terminan en el mismo sitio: si el catéter se
 * hubiera retraído o acodado, alguna se quedaría corta. La banda al final es el margen de la
 * medida (± mm). Semiautomática y sin validar por radiología: lo dicen el sello y la fuente.
 */
import type { Lang } from '~/utils/datosCaso'

interface Medida { fecha: string; longitud_mm: number; margen_mm: number; sello: string }
const props = defineProps<{ medidas: Medida[]; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const { armado, visto } = useAlVer(caja, 0.4)
const FILA = 30
const H = computed(() => props.medidas.length * FILA + 34)
const geo = computed(() => {
  const X = linEscala(0, 170, 86, W.value - 12)
  return {
    X, ticks: [0, 50, 100, 150].map((t) => ({ t, x: X(t) })),
    filas: props.medidas.map((m, i) => ({ ...m, y: 14 + i * FILA, x: X(m.longitud_mm),
      xa: X(m.longitud_mm - m.margen_mm), xb: X(m.longitud_mm + m.margen_mm) })),
  }
})
</script>

<template>
  <figure ref="caja" class="rv" :class="{ 'rv--armado': armado, 'rv--visto': visto }">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="rv__svg" role="img"
         :aria-label="L('Longitud del catéter en cada TC: ', 'Catheter length on each CT: ') + medidas.map((m) => `${m.fecha} ${numCaso(m.longitud_mm, lang)} mm`).join(', ')">
      <line v-for="tk in geo.ticks" :key="tk.t" :x1="tk.x" :x2="tk.x" y1="2" :y2="H - 20" class="rv__rej" />
      <text v-for="tk in geo.ticks" :key="`t${tk.t}`" :x="tk.x" :y="H - 6" text-anchor="middle" class="rv__tick">{{ tk.t }} mm</text>
      <g v-for="(f, i) in geo.filas" :key="f.fecha">
        <text x="0" :y="f.y + 4" class="rv__fecha nums">{{ fechaCorta(f.fecha, lang) }}</text>
        <rect :x="f.xa" :y="f.y - 7" :width="f.xb - f.xa" height="14" rx="3" class="rv__margen" :style="{ animationDelay: `${i * 550 + 900}ms` }" />
        <circle :cx="geo.X(0)" :cy="f.y" r="5" class="rv__portal" />
        <line :x1="geo.X(0)" :x2="f.x" :y1="f.y" :y2="f.y" class="rv__cateter" pathLength="1" :style="{ animationDelay: `${i * 550}ms` }" />
        <circle :cx="f.x" :cy="f.y" r="3.5" class="rv__punta" :style="{ animationDelay: `${i * 550 + 850}ms` }" />
        <text :x="f.x" :y="f.y - 10" text-anchor="end" class="rv__val nums" :style="{ animationDelay: `${i * 550 + 850}ms` }">{{ numCaso(f.longitud_mm, lang) }} mm</text>
      </g>
    </svg>
    <p class="rv__ley"><span class="rv__ley-portal" />{{ L('portal', 'port') }} <span class="rv__ley-punta" />{{ L('punta', 'tip') }} <span class="rv__ley-margen" />{{ L('margen de la medida', 'measurement margin') }}</p>
  </figure>
</template>

<style scoped>
.rv { margin: 0; }
.rv__svg { display: block; overflow: visible; }
.rv__rej { stroke: var(--viz-rejilla); }
.rv__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.rv__fecha { font: 600 11.5px var(--font-mono); fill: var(--color-text); }
.rv__margen { fill: var(--color-miriam); fill-opacity: 0.16; }
.rv__portal { fill: var(--color-text); }
.rv__cateter { stroke: var(--color-text); stroke-width: 3; stroke-linecap: round; }
.rv__punta { fill: var(--color-miriam); }
.rv__punta, .rv__val, .rv__margen { transform-box: fill-box; transform-origin: center; }
.rv__val { font: 700 11px var(--font-mono); fill: var(--color-text); }
.rv--armado:not(.rv--visto) .rv__cateter { stroke-dasharray: 1; stroke-dashoffset: 1; }
.rv--armado:not(.rv--visto) :is(.rv__punta, .rv__val, .rv__margen) { opacity: 0; }
.rv--visto .rv__cateter { stroke-dasharray: 1; animation: rv-traza 900ms var(--curva-salida) both; }
.rv--visto :is(.rv__punta, .rv__val, .rv__margen) { animation: rv-aparece 420ms var(--curva-salida) both; }
@keyframes rv-traza { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes rv-aparece { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .rv--visto :is(.rv__cateter, .rv__punta, .rv__val, .rv__margen) { animation: none; } }
.rv__ley { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font: 400 12px var(--font-body); color: var(--color-text-soft); margin: 4px 0 0; }
.rv__ley span { display: inline-block; margin-left: 6px; }
.rv__ley-portal { width: 8px; height: 8px; border-radius: 50%; background: var(--color-text); }
.rv__ley-punta { width: 7px; height: 7px; border-radius: 50%; background: var(--color-miriam); }
.rv__ley-margen { width: 14px; height: 8px; border-radius: 2px; background: rgb(var(--color-miriam-rgb) / 0.16); }
</style>
