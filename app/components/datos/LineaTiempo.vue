<script setup lang="ts">
/**
 * LineaTiempo — el eje de todo /datos: las líneas de tratamiento como barras y solo los eventos
 * que un clínico cruza con las analíticas (diagnóstico, progresiones, ingresos, biopsias). El
 * resto de la cronología vive en /timeline. Comparte la ventana de tiempo con los minis de
 * debajo, así que una progresión aquí cae en la misma x que en cada analítica.
 * Tocar (o enfocar con teclado) un símbolo escribe el evento debajo: en el móvil no hay hover.
 */
import type { Evento, Forma, Lang, Texto } from '~/utils/datosCaso'

interface Linea { id: string; tratamiento: Texto; inicio: string; fin: string | null; motivo_fin?: Texto | null }
const props = defineProps<{ eventos: Evento[]; lineas: Linea[]; desde: number; hasta: number; hoy: string; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja)
const PAD = 6
const X = (t: number) => linEscala(props.desde, props.hasta, PAD, W.value - PAD)(t)
const hoyMs = computed(() => msFecha(props.hoy))

const Y_EJE = 12
const Y_LIN = 20
const Y_RT = 44
const Y_EV = 70
const H = 96

const ticks = computed(() => {
  const out: { x: number; txt: string; anio: boolean }[] = []
  const corto = props.hasta - props.desde < 420 * DIA_MS
  for (let a = new Date(props.desde).getUTCFullYear(); a <= new Date(props.hasta).getUTCFullYear(); a++)
    for (let m = 0; m < 12; m++) {
      const t = Date.UTC(a, m, 1)
      if (t < props.desde || t > props.hasta) continue
      if (m === 0) out.push({ x: X(t), txt: String(a), anio: true })
      else if (corto && m % 3 === 0) out.push({ x: X(t), txt: mesCorto(m, props.lang), anio: false })
    }
  return out
})

const lineas = computed(() => props.lineas.map((l) => {
  const sistemica = /^\d+L$/i.test(l.id)
  const rt = l.id.toUpperCase().startsWith('RT')
  if (!sistemica && !rt) return null
  const ini = rangoParcial(l.inicio)
  if (!ini) return null
  const fin = l.fin ? rangoParcial(l.fin) : null
  const a = Math.max(ini[0], props.desde)
  const b = Math.min(fin ? fin[1] + DIA_MS : props.hasta, props.hasta)
  if (b <= props.desde || a >= props.hasta) return null
  return { ...l, rt, x: X(a), w: Math.max(3, X(b) - X(a)), futura: ini[0] > hoyMs.value, abierta: !fin }
}).filter((l): l is NonNullable<typeof l> => !!l))

const FORMA: Record<string, Forma> = { diagnostico: 'estrella', progresion: 'triangulo', ingreso: 'aspa', molecular: 'rombo' }
const clave = (e: Evento) => e.dibujar && (e.clase === 'diagnostico' || e.clase === 'progresion' || e.clase === 'ingreso'
  || (e.clase === 'molecular' && /biops/i.test(e.titulo.es)))
const eventos = computed(() => {
  const filas: number[] = []
  return props.eventos.filter(clave)
    .filter((e) => msFecha(e.hasta) >= props.desde && msFecha(e.desde) <= props.hasta)
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .map((e) => {
      const puntual = e.precision === 'dia' && e.desde === e.hasta
      const xa = X(msFecha(e.desde))
      const xb = X(msFecha(e.hasta) + DIA_MS)
      const x = puntual ? xa : (xa + xb) / 2
      let fila = filas.findIndex((u) => x - u > 13)
      if (fila === -1) { fila = filas.length < 2 ? filas.push(-1e9) - 1 : 1 }
      filas[fila] = x
      return { ...e, puntual, xa, xb, x, y: Y_EV + fila * 13 }
    })
})
const sel = ref<string | null>(null)
const elegido = computed(() => eventos.value.find((e) => e.id === sel.value) ?? null)
</script>

<template>
  <figure ref="caja" class="lt">
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="lt__svg" role="group"
         :aria-label="L('Línea de tiempo: tratamientos y eventos clave', 'Timeline: treatments and key events')">
      <g v-for="tk in ticks" :key="tk.x">
        <line :x1="tk.x" :x2="tk.x" :y1="Y_EJE + 3" :y2="H" :class="tk.anio ? 'lt__rej-anio' : 'lt__rej'" />
        <text :x="tk.x + 3" :y="Y_EJE" :class="['lt__tick', { 'lt__tick--anio': tk.anio }]">{{ tk.txt }}</text>
      </g>
      <g v-for="l in lineas" :key="l.id">
        <title>{{ l.id }} · {{ txtCaso(l.tratamiento, lang) }}{{ l.motivo_fin ? ` → ${txtCaso(l.motivo_fin, lang)}` : '' }}</title>
        <rect :x="l.x" :y="l.rt ? Y_RT : Y_LIN" :width="l.w" :height="l.rt ? 8 : 20" rx="3"
              :class="['lt__linea', { 'lt__linea--rt': l.rt, 'lt__linea--futura': l.futura }]" />
        <text v-if="!l.rt && l.w > 22" :x="l.x + 5" :y="Y_LIN + 14" class="lt__linea-txt">{{ l.id }}</text>
      </g>
      <line :x1="X(hoyMs)" :x2="X(hoyMs)" :y1="Y_EJE + 3" :y2="H" class="lt__hoy" />
      <g v-for="e in eventos" :key="e.id" class="lt__ev" tabindex="0" role="button"
         :aria-label="`${e.fecha_texto}: ${txtCaso(e.titulo, lang)}`" :aria-pressed="sel === e.id"
         @click="sel = sel === e.id ? null : e.id" @keydown.enter.prevent="sel = e.id" @keydown.space.prevent="sel = e.id">
        <rect v-if="!e.puntual" :x="e.xa" :y="e.y - 2" :width="Math.max(2, e.xb - e.xa)" height="4" class="lt__franja" />
        <rect :x="e.x - 11" :y="e.y - 11" width="22" height="22" fill="transparent" />
        <path :d="pathForma(FORMA[e.clase ?? ''] ?? 'circulo', e.x, e.y, 5)"
              :class="['lt__glifo', { 'lt__glifo--fuerte': e.clase === 'progresion' || e.clase === 'diagnostico', 'lt__glifo--sel': sel === e.id }]" />
      </g>
    </svg>
    <figcaption class="lt__pie" aria-live="polite">
      <template v-if="elegido"><strong class="nums">{{ elegido.fecha_texto }}</strong> · {{ txtCaso(elegido.titulo, lang) }}</template>
      <template v-else>{{ L('Toca un símbolo para ver qué pasó.', 'Tap a symbol to see what happened.') }}</template>
    </figcaption>
    <p class="lt__ley">
      <span><svg width="14" height="12" aria-hidden="true"><path :d="pathForma('estrella', 7, 6, 4.5)" class="lt__glifo lt__glifo--fuerte" /></svg>{{ L('diagnóstico', 'diagnosis') }}</span>
      <span><svg width="14" height="12" aria-hidden="true"><path :d="pathForma('triangulo', 7, 6, 4.5)" class="lt__glifo lt__glifo--fuerte" /></svg>{{ L('progresión', 'progression') }}</span>
      <span><svg width="14" height="12" aria-hidden="true"><path :d="pathForma('rombo', 7, 6, 4.5)" class="lt__glifo" /></svg>{{ L('biopsia', 'biopsy') }}</span>
      <span><svg width="14" height="12" aria-hidden="true"><path :d="pathForma('aspa', 7, 6, 4)" class="lt__glifo" /></svg>{{ L('ingreso', 'admission') }}</span>
      <span><svg width="18" height="12" aria-hidden="true"><rect x="0" y="2" width="18" height="8" rx="2" class="lt__linea" /></svg>{{ L('línea de tratamiento', 'treatment line') }}</span>
      <span><svg width="18" height="12" aria-hidden="true"><rect x="0" y="4" width="18" height="5" rx="2" class="lt__linea lt__linea--rt" /></svg>{{ L('radioterapia', 'radiotherapy') }}</span>
    </p>
  </figure>
</template>

<style scoped>
.lt { margin: 0; }
.lt__svg { display: block; overflow: visible; }
.lt__rej { stroke: var(--viz-rejilla); }
.lt__rej-anio { stroke: var(--viz-eje); }
.lt__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.lt__tick--anio { font-weight: 700; fill: var(--color-text); }
.lt__linea { fill: var(--viz-sev-2); stroke: var(--color-text); stroke-opacity: 0.3; }
.lt__linea--rt { fill: var(--viz-sev-4); stroke: none; }
.lt__linea--futura { fill: none; stroke-dasharray: 4 3; stroke-opacity: 0.8; }
.lt__linea-txt { font: 700 11px var(--font-mono); fill: var(--color-text); pointer-events: none; }
.lt__hoy { stroke: var(--color-miriam); stroke-width: 1.5; }
.lt__ev { cursor: pointer; outline: none; }
.lt__ev:focus-visible .lt__glifo { stroke: var(--color-miriam); stroke-width: 2.5; }
.lt__franja { fill: var(--color-text); fill-opacity: 0.18; }
.lt__glifo { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.4; }
.lt__glifo--fuerte { fill: var(--color-text); }
.lt__glifo--sel { fill: var(--color-miriam); stroke: var(--color-miriam); }
.lt__pie { font: 400 14px/1.4 var(--font-body); color: var(--color-text); margin: 6px 0 0; min-height: 2.8em; }
.lt__ley { display: flex; flex-wrap: wrap; gap: 4px 12px; font: 400 12px var(--font-body); color: var(--color-text-soft); margin: 4px 0 0; }
.lt__ley span { display: inline-flex; align-items: center; gap: 4px; }
</style>
