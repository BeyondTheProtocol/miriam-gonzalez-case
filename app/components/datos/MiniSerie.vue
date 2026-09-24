<script setup lang="ts">
/**
 * MiniSerie — un analito en sus unidades reales, con su banda de referencia (formato A del
 * médico: «cuál se ha salido, y cuándo»). Fuera de rango: triángulo relleno hacia donde se sale
 * (▲ alto, ▼ bajo); dentro: punto hueco. La tabla con todos los valores va en un desplegable.
 */
import type { Analito, Lang } from '~/utils/datosCaso'

const props = defineProps<{ a: Analito; desde: number; hasta: number; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const W = 300
const H = 120
const X0 = 34
const X1 = W - 8
const Y0 = 12
const Y1 = H - 20

const vis = computed(() => props.a.puntos.filter((p) => {
  const t = msFecha(p.f)
  return t >= props.desde && t <= props.hasta
}))
const geo = computed(() => {
  const vals = vis.value.map((p) => p.v).concat(props.a.ref ? [props.a.ref.low, props.a.ref.high] : [])
  const lo = Math.min(...vals, 0)
  const hi = Math.max(...vals)
  const Y = linEscala(lo, hi * 1.08 || 1, Y1, Y0)
  const X = linEscala(props.desde, props.hasta, X0, X1)
  const pts = vis.value.map((p) => ({ p, x: X(msFecha(p.f)), y: Y(p.v) }))
  const ticksY = [lo, (lo + hi) / 2, hi].map((v) => ({ v, y: Y(v) }))
  const anios: { x: number; a: number }[] = []
  for (let a = new Date(props.desde).getUTCFullYear() + 1; a <= new Date(props.hasta).getUTCFullYear(); a++)
    anios.push({ x: X(Date.UTC(a, 0, 1)), a })
  return {
    pts, ticksY, anios,
    banda: props.a.ref ? { y0: Y(props.a.ref.high), y1: Y(props.a.ref.low) } : null,
    d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(''),
  }
})
const ultimo = computed(() => vis.value[vis.value.length - 1])
const nFuera = computed(() => vis.value.filter((p) => p.fuera).length)
const redondo = (v: number) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10)
</script>

<template>
  <article class="ms">
    <header class="ms__cab">
      <h4 class="ms__nombre">{{ a.nombre }} <span class="ms__unidad">({{ a.unidad }})</span></h4>
      <p v-if="ultimo" class="ms__ultimo nums">
        {{ numCaso(ultimo.v, lang) }}
        <span v-if="ultimo.fuera" class="ms__marca">{{ ultimo.fuera === 'bajo' ? '▼' : '▲' }}</span>
        <span class="ms__fecha">{{ fechaCorta(ultimo.f, lang) }}</span>
      </p>
    </header>
    <svg :viewBox="`0 0 ${W} ${H}`" class="ms__svg" role="img"
         :aria-label="`${a.nombre}: ${vis.length} ${L('valores', 'values')}, ${nFuera} ${L('fuera de rango', 'out of range')}`">
      <rect v-if="geo.banda" :x="X0" :y="geo.banda.y0" :width="X1 - X0" :height="Math.max(1, geo.banda.y1 - geo.banda.y0)" class="ms__banda" />
      <line v-for="an in geo.anios" :key="an.a" :x1="an.x" :x2="an.x" :y1="Y0" :y2="Y1" class="ms__rej" />
      <text v-for="an in geo.anios" :key="`t${an.a}`" :x="an.x" :y="H - 6" text-anchor="middle" class="ms__tick">{{ an.a }}</text>
      <text v-for="tk in geo.ticksY" :key="tk.v" :x="X0 - 4" :y="tk.y + 3" text-anchor="end" class="ms__tick">{{ numCaso(redondo(tk.v), lang) }}</text>
      <path :d="geo.d" class="ms__linea" />
      <template v-for="q in geo.pts" :key="q.p.f">
        <path v-if="q.p.fuera === 'bajo'" :d="`M${q.x - 4},${q.y - 3}h8l-4,7Z`" class="ms__fuera" />
        <path v-else-if="q.p.fuera" :d="`M${q.x - 4},${q.y + 3}h8l-4,-7Z`" class="ms__fuera" />
        <circle v-else :cx="q.x" :cy="q.y" r="2.3" class="ms__dentro" />
      </template>
    </svg>
    <p class="ms__pie">
      <span v-if="a.ref">{{ L('Rango de referencia', 'Reference range') }} {{ numCaso(a.ref.low, lang) }}–{{ numCaso(a.ref.high, lang) }}</span>
      <span>· {{ nFuera }}/{{ vis.length }} {{ L('fuera de rango', 'out of range') }}</span>
    </p>
    <details class="ms__det">
      <summary>{{ L('Ver los valores', 'See the values') }}</summary>
      <table class="ms__tabla nums">
        <thead><tr><th>{{ L('Fecha', 'Date') }}</th><th>{{ L('Valor', 'Value') }}</th><th>{{ L('Rango del informe', 'Report range') }}</th></tr></thead>
        <tbody>
          <tr v-for="p in [...vis].reverse()" :key="p.f">
            <td>{{ p.f }}</td>
            <td :class="{ 'ms__td-fuera': p.fuera }">{{ numCaso(p.v, lang) }}{{ p.fuera === 'bajo' ? ' ▼' : p.fuera ? ' ▲' : '' }}</td>
            <td>{{ p.hi != null ? `${numCaso(p.lo ?? 0, lang)}–${numCaso(p.hi, lang)}` : '—' }}{{ p.ref_de === 'banda' ? ' *' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </article>
</template>

<style scoped>
.ms { background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 12px; padding: 12px 12px 8px; }
.ms__cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ms__nombre { font: 700 14px/1.2 var(--font-body); color: var(--color-text); margin: 0; }
.ms__unidad { font-weight: 400; color: var(--color-text-soft); font-size: 12px; }
.ms__ultimo { font: 600 14px var(--font-mono); color: var(--color-text); margin: 0; white-space: nowrap; }
.ms__marca { color: var(--color-miriam); }
.ms__fecha { font: 400 11px var(--font-body); color: var(--color-text-soft); margin-left: 4px; }
.ms__svg { display: block; width: 100%; height: auto; margin-top: 4px; }
.ms__banda { fill: var(--color-text); fill-opacity: 0.08; }
.ms__rej { stroke: var(--viz-rejilla); }
.ms__tick { font: 500 9px var(--font-mono); fill: var(--color-text-soft); }
.ms__linea { fill: none; stroke: var(--color-text); stroke-width: 1.3; }
.ms__dentro { fill: var(--color-bg-card); stroke: var(--color-text); stroke-width: 1.1; }
.ms__fuera { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.6; }
.ms__pie { font: 400 11.5px var(--font-body); color: var(--color-text-soft); margin: 2px 0 0; }
.ms__det summary { font: 600 12px var(--font-body); color: var(--color-miriam); cursor: pointer; margin-top: 4px; }
.ms__tabla { width: 100%; font: 400 12px var(--font-mono); border-collapse: collapse; margin-top: 6px; }
.ms__tabla th { text-align: left; font: 600 11px var(--font-body); color: var(--color-text-soft); padding: 4px; }
.ms__tabla td { padding: 3px 4px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.06); }
.ms__td-fuera { font-weight: 700; }
</style>
