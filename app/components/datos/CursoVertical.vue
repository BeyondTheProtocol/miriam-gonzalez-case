<script setup lang="ts">
/**
 * CursoVertical — la figura de primer vistazo en el móvil: el tiempo baja por la pantalla y cada
 * carril es una columna. La horizontal en un teléfono sale a letra de 3 px; aquí se lee con el
 * pulgar, igual que se lee la cronología. Mismo dato y mismas reglas de dibujo que CursoClinico:
 * fuera de rango relleno, franjas para fechas conocidas solo al mes, ×LSN del informe de ese día.
 * Columnas: fecha · tratamiento y eventos · CA 15-3 · AST y ALT · hemoglobina.
 */
import type { Analito, Evento, Forma, Lang } from '~/utils/datosCaso'

interface Linea { id: string; tratamiento: unknown; inicio: string; fin: string | null }
const props = defineProps<{
  eventos: Evento[]
  lineas: Linea[]
  grupos: Record<string, { nombre: string; analitos: Analito[] }>
  hoy: string
  lang: Lang
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

type Vista = 'anio' | 'dx'
const vista = ref<Vista>('anio')
const DIA = 86400000
const hoyMs = computed(() => msFecha(props.hoy))
const dominio = computed<[number, number]>(() =>
  vista.value === 'anio' ? [hoyMs.value - 365 * DIA, hoyMs.value + 30 * DIA] : [Date.UTC(2023, 9, 1), hoyMs.value + 30 * DIA])
const PX_DIA = computed(() => (vista.value === 'anio' ? 2.4 : 1.15))

const W = 360
const TOP = 46
const H = computed(() => TOP + (dominio.value[1] - dominio.value[0]) / DIA * PX_DIA.value + 16)
const Y = (t: number) => rc(TOP + (t - dominio.value[0]) / DIA * PX_DIA.value)
const YF = (iso: string) => Y(msFecha(iso))
const dentro = (t: number) => t >= dominio.value[0] && t <= dominio.value[1]

// `ev` ancho para que «Tratamiento» no pise la cabecera de CA 15-3 (lo midió `diseno`, 24-sep)
const COL = { ev: [44, 110], mk: [116, 182], hp: [190, 258], hb: [266, 352] } as const

const meses = computed(() => {
  const out: { y: number; txt: string; anio: boolean }[] = []
  const [d0, d1] = dominio.value
  for (let a = new Date(d0).getUTCFullYear(); a <= new Date(d1).getUTCFullYear(); a++)
    for (let m = 0; m < 12; m++) {
      const t = Date.UTC(a, m, 1)
      if (!dentro(t)) continue
      if (vista.value === 'dx' && m % 3) continue
      out.push({ y: Y(t), txt: m === 0 ? String(a) : mesCorto(m, props.lang), anio: m === 0 })
    }
  return out
})

const FORMA: Record<string, Forma> = { diagnostico: 'estrella', progresion: 'triangulo', tratamiento: 'cuadrado', molecular: 'rombo', ingreso: 'aspa', sintomas: 'circulo', antecedentes: 'circulo' }
const numerados = computed(() => props.eventos.filter((e) => e.dibujar).slice()
  .sort((a, b) => a.desde.localeCompare(b.desde)).map((e, i) => ({ ...e, n: i + 1 })))
const eventosV = computed(() => {
  let ult = -1e9
  return numerados.value.filter((e) => msFecha(e.hasta) >= dominio.value[0] && msFecha(e.desde) <= dominio.value[1])
    .map((e) => {
      const puntual = e.precision === 'dia' && e.desde === e.hasta
      const ya = YF(e.desde)
      const yb = puntual ? ya : YF(e.hasta) + PX_DIA.value
      const yc = puntual ? ya : (ya + yb) / 2
      const col = yc - ult < 11 ? 1 : 0 // dos columnas de números para los eventos pegados
      if (!col) ult = yc
      return { ...e, puntual, ya, yb, yc, col }
    })
})
const guias = computed(() => eventosV.value.filter((e) => e.clase === 'progresion' || e.clase === 'diagnostico'))

const lineasV = computed(() => props.lineas.map((l) => {
  const ini = rangoParcial(l.inicio)
  if (!ini) return null
  const fin = l.fin ? rangoParcial(l.fin) : null
  const sistemica = /^\d+L$/i.test(l.id)
  const rt = l.id.toUpperCase().startsWith('RT')
  const y0 = Y(Math.max(ini[0], dominio.value[0]))
  const y1 = Y(Math.min(fin ? fin[1] + DIA : dominio.value[1], dominio.value[1]))
  const x = sistemica ? COL.ev[0] + 2 : rt ? COL.ev[0] + 16 : COL.ev[0] + 23 + (l.id === 'LHRHa' ? 0 : 5)
  const w = sistemica ? 12 : rt ? 5 : 3
  return { ...l, sistemica, rt, y0, y1, x, w, futura: ini[0] > hoyMs.value }
}).filter((l): l is NonNullable<typeof l> => !!l && l.y1 > TOP && l.y0 < H.value))

/* columnas de datos: el valor va en horizontal dentro de su columna */
const colLog = (key: string, x0: number, x1: number, min: number, max: number) => {
  const a = buscarAnalito(props.grupos, key)
  if (!a) return null
  const X = logEscala(min, max, x0, x1)
  const pts = a.puntos.filter((p) => dentro(msFecha(p.f))).map((p) => ({ p, r: xlsn(p) }))
    .filter((q): q is { p: typeof q.p; r: number } => q.r != null)
    .map(({ p, r }) => ({ p, x: X(r), y: YF(p.f), fuera: !!p.fuera }))
  return { a, pts, uno: X(1), d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join('') }
}
const ca = computed(() => colLog('ca153', COL.mk[0], COL.mk[1], 0.3, 30))
const ast = computed(() => colLog('got', COL.hp[0], COL.hp[1], 0.25, 10))
const alt = computed(() => colLog('gpt', COL.hp[0], COL.hp[1], 0.25, 10))
const hb = computed(() => {
  const a = buscarAnalito(props.grupos, 'hemoglobina')
  if (!a) return null
  const X = linEscala(6, 17, COL.hb[0], COL.hb[1])
  const pts = a.puntos.filter((p) => dentro(msFecha(p.f))).map((p) => ({ p, x: X(p.v), y: YF(p.f) }))
  return { a, pts, banda: a.ref ? [X(a.ref.low), X(a.ref.high)] : null, d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join('') }
})
const r1 = (v: number) => v.toFixed(1)
</script>

<template>
  <figure class="cv">
    <div class="cv__vistas" role="group" :aria-label="L('Ventana de tiempo', 'Time window')">
      <button v-for="[k, es, en] in [['anio','Último año','Last year'],['dx','Desde el diagnóstico','Since diagnosis']]" :key="k"
              type="button" class="cv__vista" :aria-pressed="vista === k" @click="vista = k as Vista">{{ L(es, en) }}</button>
    </div>
    <svg :viewBox="`0 0 ${W} ${H}`" class="cv__svg" role="img"
         :aria-label="L('Curso clínico en vertical: el tiempo baja. Columnas: tratamientos y eventos, CA 15-3 y transaminasas en múltiplos del límite superior de la normalidad (× LSN), y hemoglobina. Los mismos datos están en las tablas de la página.',
                        'Clinical course, vertical: time runs down. Columns: treatments and events, CA 15-3 and transaminases in multiples of the upper limit of normal, and hemoglobin. The same data are in the tables on this page.')">
      <!-- cabeceras -->
      <text :x="COL.ev[0]" y="14" class="cv__cab">{{ L('Tratamiento', 'Treatment') }}</text>
      <text :x="COL.ev[0]" y="26" class="cv__sub">{{ L('y eventos', 'and events') }}</text>
      <text :x="COL.mk[0]" y="14" class="cv__cab">CA 15-3</text>
      <text :x="COL.mk[0]" y="26" class="cv__sub">{{ L('× LSN · log', '× ULN · log') }}</text>
      <text :x="COL.hp[0]" y="14" class="cv__cab">AST · ALT</text>
      <text :x="COL.hp[0]" y="26" class="cv__sub">{{ L('× LSN · log', '× ULN · log') }}</text>
      <text :x="COL.hb[0]" y="14" class="cv__cab">{{ L('Hemoglobina', 'Hemoglobin') }}</text>
      <text :x="COL.hb[0]" y="26" class="cv__sub">g/dL · 6–17</text>
      <g :transform="`translate(${COL.hp[0] + 2}, 36)`">
        <path :d="pathForma('circulo', 3, 0, 2.5)" class="cv__p cv__p--ast" /><text x="9" y="3" class="cv__sub">AST</text>
        <path :d="pathForma('cuadrado', 36, 0, 2.3)" class="cv__p cv__p--alt" /><text x="42" y="3" class="cv__sub">ALT</text>
      </g>

      <!-- rejilla de meses -->
      <g v-for="m in meses" :key="m.y">
        <line x1="0" :x2="W" :y1="m.y" :y2="m.y" :class="m.anio ? 'cv__rej-anio' : 'cv__rej'" />
        <text x="2" :y="m.y + 10" :class="m.anio ? 'cv__mes cv__mes--anio' : 'cv__mes'">{{ m.txt }}</text>
      </g>

      <!-- guías de progresión y diagnóstico -->
      <template v-for="e in guias" :key="`g${e.id}`">
        <line v-if="e.puntual" :x1="COL.mk[0] - 4" :x2="W" :y1="e.ya" :y2="e.ya" class="cv__guia" />
        <rect v-else :x="COL.mk[0] - 4" :y="e.ya" :width="W - COL.mk[0] + 4" :height="Math.max(1, e.yb - e.ya)" class="cv__guia-franja" />
      </template>

      <!-- líneas de tratamiento -->
      <g v-for="l in lineasV" :key="l.id">
        <rect :x="l.x" :y="l.y0" :width="l.w" :height="Math.max(2, l.y1 - l.y0)"
              :class="['cv__linea', { 'cv__linea--rt': l.rt, 'cv__linea--fondo': !l.sistemica && !l.rt, 'cv__linea--futura': l.futura }]" />
        <text v-if="l.sistemica" :x="l.x + 6" :y="l.y0 + 12" text-anchor="middle" class="cv__linea-txt">{{ l.id }}</text>
      </g>

      <!-- eventos -->
      <g v-for="e in eventosV" :key="e.id">
        <rect v-if="!e.puntual" :x="COL.ev[0] + 33" :y="e.ya" width="6" :height="Math.max(2, e.yb - e.ya)" class="cv__franja" />
        <path :d="pathForma(FORMA[e.clase ?? 'sintomas'] ?? 'circulo', COL.ev[0] + 36, e.yc, 4)"
              :class="['cv__glifo', { 'cv__glifo--fuerte': e.clase === 'progresion' || e.clase === 'diagnostico' }]" />
        <text :x="COL.ev[0] + 44 + e.col * 13" :y="e.yc + 3" class="cv__num">{{ e.n }}</text>
      </g>

      <!-- CA 15-3 -->
      <template v-if="ca">
        <line :x1="ca.uno" :x2="ca.uno" :y1="TOP" :y2="H - 10" class="cv__uno" />
        <text :x="ca.uno + 2" :y="TOP + 8" class="cv__sub">1×</text>
        <path :d="ca.d" class="cv__serie" />
        <path v-for="q in ca.pts" :key="q.p.f" :d="pathForma('circulo', q.x, q.y, q.fuera ? 3 : 2.3)" :class="['cv__p', { 'cv__p--fuera': q.fuera }]" />
      </template>
      <!-- AST · ALT -->
      <template v-if="ast">
        <line :x1="ast.uno" :x2="ast.uno" :y1="TOP" :y2="H - 10" class="cv__uno" />
        <text :x="ast.uno + 2" :y="TOP + 8" class="cv__sub">1×</text>
        <path :d="ast.d" class="cv__serie" />
        <path v-for="q in ast.pts" :key="q.p.f" :d="pathForma('circulo', q.x, q.y, q.fuera ? 3 : 2.3)" :class="['cv__p', 'cv__p--ast', { 'cv__p--fuera': q.fuera }]" />
      </template>
      <template v-if="alt">
        <path :d="alt.d" class="cv__serie cv__serie--alt" />
        <path v-for="q in alt.pts" :key="q.p.f" :d="pathForma('cuadrado', q.x, q.y, q.fuera ? 2.8 : 2.1)" :class="['cv__p', 'cv__p--alt', { 'cv__p--fuera-alt': q.fuera }]" />
      </template>
      <!-- Hb -->
      <template v-if="hb">
        <rect v-if="hb.banda" :x="hb.banda[0]" :y="TOP" :width="hb.banda[1] - hb.banda[0]" :height="H - TOP - 10" class="cv__rango" />
        <path :d="hb.d" class="cv__serie" />
        <template v-for="q in hb.pts" :key="q.p.f">
          <path v-if="q.p.fuera === 'bajo'" :d="`M${r1(q.x + 3)},${r1(q.y - 4)}v8l-6,-4Z`" class="cv__fuera" />
          <circle v-else :cx="q.x" :cy="q.y" r="2.2" class="cv__dentro" />
        </template>
      </template>

      <line x1="0" :x2="W" :y1="Y(hoyMs)" :y2="Y(hoyMs)" class="cv__hoy" />
      <text :x="W - 2" :y="Y(hoyMs) - 3" text-anchor="end" class="cv__hoy-txt">{{ L('hoy', 'today') }}</text>
    </svg>
    <figcaption class="cv__pie">
      {{ L('Relleno = fuera de rango. ◀ = hemoglobina bajo el rango. Líneas discontinuas = progresiones. Los números son los eventos de la lista de abajo; el resto de pruebas, en «Analíticas».',
           'Filled = out of range. ◀ = hemoglobin below range. Dashed lines = progressions. Numbers are the events listed below; every other test is under “Labs”.') }}
    </figcaption>
  </figure>
</template>

<style scoped>
.cv { margin: 0; }
.cv__vistas { display: inline-flex; gap: 4px; padding: 3px; border-radius: 999px; background: rgb(var(--color-text-rgb) / 0.05); margin-bottom: 8px; }
.cv__vista { font: 600 13px/1 var(--font-body); padding: 9px 12px; border-radius: 999px; color: var(--color-text-soft); min-height: 36px; }
.cv__vista[aria-pressed='true'] { background: var(--color-text); color: var(--color-bg); }
.cv__vista:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.cv__svg { display: block; width: 100%; height: auto; }
.cv__cab { font: 700 10.5px var(--font-body); fill: var(--color-text); }
.cv__sub { font: 400 8.5px var(--font-mono); fill: var(--color-text-soft); }
.cv__rej { stroke: var(--viz-rejilla); }
.cv__rej-anio { stroke: var(--viz-eje); }
.cv__mes { font: 500 9px var(--font-mono); fill: var(--color-text-soft); }
.cv__mes--anio { font-weight: 700; fill: var(--color-text); }
.cv__guia { stroke: var(--color-text); stroke-opacity: 0.45; stroke-dasharray: 3 3; }
.cv__guia-franja { fill: var(--color-text); fill-opacity: 0.06; }
.cv__linea { fill: var(--viz-sev-2); stroke: var(--color-text); stroke-opacity: 0.35; }
.cv__linea--rt { fill: var(--viz-sev-4); stroke: none; }
.cv__linea--fondo { fill: var(--viz-div-2); stroke: none; }
.cv__linea--futura { fill: none; stroke-dasharray: 3 2; stroke-opacity: 0.8; }
.cv__linea-txt { font: 700 8px var(--font-mono); fill: var(--color-text); writing-mode: vertical-rl; }
.cv__franja { fill: var(--color-text); fill-opacity: 0.1; }
.cv__glifo { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.2; }
.cv__glifo--fuerte { fill: var(--color-text); }
.cv__num { font: 600 9px var(--font-mono); fill: var(--color-text); }
.cv__uno { stroke: var(--color-text); stroke-opacity: 0.55; }
.cv__serie { fill: none; stroke: var(--color-text); stroke-width: 1.1; }
.cv__serie--alt { stroke: var(--color-miriam); stroke-dasharray: 4 3; }
.cv__p { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.1; }
.cv__p--alt { stroke: var(--color-miriam); }
.cv__p--fuera { fill: var(--color-text); }
.cv__p--fuera-alt { fill: var(--color-miriam); }
.cv__rango { fill: var(--color-text); fill-opacity: 0.07; }
.cv__dentro { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1; }
.cv__fuera { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.6; }
.cv__hoy { stroke: var(--color-miriam); stroke-width: 1.2; }
.cv__hoy-txt { font: 700 9px var(--font-mono); fill: var(--color-miriam); }
.cv__pie { font: 400 12.5px/1.45 var(--font-body); color: var(--color-text-soft); margin-top: 8px; }
</style>
