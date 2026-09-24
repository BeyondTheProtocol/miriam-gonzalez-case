<script setup lang="ts">
/**
 * CursoClinico — el caso entero en una figura, sobre UN eje de tiempo compartido.
 *
 * Nace del consejo de un médico (24-sep-2026): «su evolución en el tiempo, y asociar eventos
 * relevantes que circunden esa fecha (PET, biopsia, hospitalización, inicios y suspensiones de
 * tratamientos)». Formato de la literatura para contar un caso: swimmer plot + curvas de
 * marcadores alineadas. El valor está en el eje compartido: se ve de un golpe si el CA 15-3 sube
 * antes que la progresión en imagen y qué hizo cada línea con el hemograma.
 *
 * Reglas de dibujo (del sitio y del plan aprobado):
 *  · fuera de rango = el punto pasa de HUECO a RELLENO y crece; nunca solo color;
 *  · cada serie se distingue por forma de marcador Y tipo de trazo;
 *  · un evento con precisión de mes o año es una FRANJA, no una línea en un día inventado;
 *  · ×LSN = veces el límite superior normal DEL INFORME de ese punto (los labs difieren);
 *  · todas las cifras están también en las tablas de la página (alternativa accesible).
 */
import type { Analito, Evento, Forma, Lang, Punto } from '~/utils/datosCaso'

interface Linea {
  id: string
  tratamiento: string | { es: string; en?: string }
  inicio: string
  fin: string | null
  motivo_fin?: string | { es: string; en?: string } | null
  sello: string
}
interface Medida { fecha: string; suma_mm?: number; ml?: number; n_lesiones?: number }

const props = defineProps<{
  eventos: Evento[]
  lineas: Linea[]
  grupos: Record<string, { nombre: string; analitos: Analito[] }>
  recist: Medida[]
  volumen: Medida[]
  hoy: string
  lang: Lang
}>()

const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

/* ── ventana de tiempo ──────────────────────────────────────────────────────────── */
type Vista = 'dx' | 'todo' | 'anio'
const vista = ref<Vista>('dx')
const DIA = 86400000
const hoyMs = computed(() => msFecha(props.hoy))
const dominio = computed<[number, number]>(() => {
  const fin = hoyMs.value + 45 * DIA
  if (vista.value === 'anio') return [hoyMs.value - 365 * DIA, fin]
  if (vista.value === 'dx') return [Date.UTC(2023, 9, 1), fin]
  const ini = Math.min(...props.eventos.map((e) => msFecha(e.desde)))
  return [Date.UTC(new Date(ini).getUTCFullYear(), 0, 1), fin]
})
const vistas: { k: Vista; es: string; en: string }[] = [
  { k: 'dx', es: 'Desde el diagnóstico', en: 'Since diagnosis' },
  { k: 'anio', es: 'Último año', en: 'Last year' },
  { k: 'todo', es: 'Todo (desde 2021)', en: 'All (since 2021)' },
]

/* ── geometría ─────────────────────────────────────────────────────────────────── */
const W = 1000
const X0 = 132
const X1 = W - 14
const X = (t: number) => linEscala(dominio.value[0], dominio.value[1], X0, X1)(t)
const XF = (iso: string) => X(msFecha(iso))
const dentro = (t: number) => t >= dominio.value[0] && t <= dominio.value[1]

/* carriles (y de arriba abajo) */
const Y_EJE = 22
const EV = { y: 34, h: 70 }
const LN = { y: 112, h: 58 }
const MK = { y: 184, h: 132 }
const HP = { y: 332, h: 150 }
const HM = { y: 498, h: 4 * 50 }
const CT = { y: 716, h: 70 }
const H = CT.y + CT.h + 26

/* ── ejes de tiempo ────────────────────────────────────────────────────────────── */
const ticks = computed(() => {
  const [d0, d1] = dominio.value
  const out: { x: number; txt: string; mayor: boolean }[] = []
  const a0 = new Date(d0).getUTCFullYear()
  const a1 = new Date(d1).getUTCFullYear()
  const meses = d1 - d0 < 500 * DIA
  for (let a = a0; a <= a1; a++) {
    for (let m = 0; m < 12; m++) {
      const t = Date.UTC(a, m, 1)
      if (!dentro(t)) continue
      if (m === 0) out.push({ x: X(t), txt: String(a), mayor: true })
      else if (meses && m % (d1 - d0 < 400 * DIA ? 1 : 3) === 0)
        out.push({ x: X(t), txt: mesCorto(m, props.lang), mayor: false })
    }
  }
  return out
})

/* ── eventos ───────────────────────────────────────────────────────────────────── */
const FORMA_EVENTO: Record<string, Forma> = {
  diagnostico: 'estrella', progresion: 'triangulo', tratamiento: 'cuadrado',
  molecular: 'rombo', ingreso: 'aspa', sintomas: 'circulo', antecedentes: 'circulo',
}
const CLASE_TXT: Record<string, [string, string]> = {
  diagnostico: ['Diagnóstico', 'Diagnosis'], progresion: ['Progresión', 'Progression'],
  tratamiento: ['Tratamiento / ensayo', 'Treatment / trial'], molecular: ['Biopsia / molecular', 'Biopsy / molecular'],
  ingreso: ['Ingreso', 'Admission'], sintomas: ['Síntomas / antecedentes', 'Symptoms / history'],
}
/** Numeración estable (no cambia al hacer zoom): orden cronológico de los dibujables. */
const numerados = computed(() =>
  props.eventos.filter((e) => e.dibujar)
    .slice().sort((a, b) => a.desde.localeCompare(b.desde))
    .map((e, i) => ({ ...e, n: i + 1 })))
const eventosVista = computed(() => {
  const filas: number[] = []
  return numerados.value
    .filter((e) => msFecha(e.hasta) >= dominio.value[0] && msFecha(e.desde) <= dominio.value[1])
    .map((e) => {
      const puntual = e.precision === 'dia' && e.desde === e.hasta
      const xa = XF(e.desde)
      const xb = XF(e.hasta) + (puntual ? 0 : X(DIA) - X(0))
      const xc = puntual ? xa : (xa + xb) / 2
      // números escalonados en hasta 4 filas; si ni así caben, se apilan en la última
      // (el glifo sigue en su fecha y el título completo sale al pasar el cursor)
      let fila = filas.findIndex((ult) => xc - ult > 15)
      if (fila === -1) {
        if (filas.length < 4) { fila = filas.length; filas.push(-1e9) } else fila = 3
      }
      filas[fila] = xc
      return { ...e, puntual, xa, xb, xc, fila }
    })
})
/** Guías verticales en los carriles de datos: diagnóstico y progresiones (lo que un clínico cruza). */
const guias = computed(() =>
  eventosVista.value.filter((e) => e.clase === 'progresion' || e.clase === 'diagnostico'))

/* ── líneas de tratamiento ─────────────────────────────────────────────────────── */
const lineasVista = computed(() =>
  props.lineas.map((l) => {
    const ini = rangoParcial(l.inicio)
    const fin = l.fin ? rangoParcial(l.fin) : null
    if (!ini) return null
    // fila: líneas sistémicas numeradas (1L, 2L…), radioterapia, y tratamiento de fondo
    // (supresión ovárica, soporte óseo) en filas finas propias para no tapar las líneas
    const esRT = l.id.toUpperCase().startsWith('RT')
    const sistemica = /^\d+L$/i.test(l.id)
    const xa0 = X(ini[0]); const xa1 = X(ini[1] + DIA)
    const abierta = !fin
    const xb0 = fin ? X(fin[0]) : X(dominio.value[1])
    const xb1 = fin ? X(fin[1] + DIA) : X(dominio.value[1])
    const futura = ini[0] > hoyMs.value
    return { ...l, esRT, sistemica, xa0, xa1, xb0, xb1, abierta, futura,
      incierto0: ini[0] !== ini[1], incierto1: !!fin && fin[0] !== fin[1] }
  }).filter((l): l is NonNullable<typeof l> => !!l && l.xb1 > X0 && l.xa0 < X1)
    .map((l, _i, todas) => {
      const fondo = todas.filter((z) => !z.sistemica && !z.esRT)
      const k = fondo.indexOf(l)
      const fila = l.sistemica ? { y: LN.y + 2, h: 16 } : l.esRT ? { y: LN.y + 22, h: 8 } : { y: LN.y + 38 + k * 11, h: 5 }
      return { ...l, fila, fondo: k >= 0 }
    }))

/* ── series ────────────────────────────────────────────────────────────────────── */
interface Serie { key: string; etiqueta: string; forma: Forma; color: string; trazo: string }
const ESTILOS: { forma: Forma; color: string; trazo: string }[] = [
  { forma: 'circulo', color: 'var(--color-text)', trazo: '' },
  { forma: 'cuadrado', color: 'var(--color-miriam)', trazo: '6 4' },
  { forma: 'triangulo', color: 'var(--viz-div-2)', trazo: '2 3' },
  { forma: 'rombo', color: 'var(--color-text-soft)', trazo: '9 3 2 3' },
  { forma: 'estrella', color: 'var(--viz-sev-3)', trazo: '14 4' },
]
const serie = (keys: [string, string, string][]): (Serie & { a: Analito })[] =>
  keys.map(([key, es, en], i) => {
    const a = buscarAnalito(props.grupos, key)
    return a ? { key, etiqueta: L(es, en), a, ...ESTILOS[i % ESTILOS.length] } : null
  }).filter((s): s is Serie & { a: Analito } => !!s)

const marcadores = computed(() => serie([
  ['ca153', 'CA 15-3', 'CA 15-3'], ['cea', 'CEA', 'CEA'], ['ldh', 'LDH', 'LDH']]))
const higado = computed(() => serie([
  ['got', 'AST (GOT)', 'AST'], ['gpt', 'ALT (GPT)', 'ALT'], ['fosfatasa_alcalina', 'Fosfatasa alc.', 'Alk. phos.'],
  ['ggt', 'GGT', 'GGT'], ['bilirrubina_total', 'Bilirrubina', 'Bilirubin']]))
const hemograma = computed(() => serie([
  ['hemoglobina', 'Hemoglobina', 'Haemoglobin'], ['neutrofilos_abs', 'Neutrófilos', 'Neutrophils'],
  ['linfocitos_abs', 'Linfocitos', 'Lymphocytes'], ['plaquetas', 'Plaquetas', 'Platelets']]))

const LSN_TICKS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20]
const panelLSN = (series: (Serie & { a: Analito })[], y: number, h: number, min: number, max: number) => {
  const Y = logEscala(min, max, y + h, y + 6)
  return {
    ticks: LSN_TICKS.filter((v) => v >= min && v <= max).map((v) => ({ v, y: Y(v) })),
    uno: Y(1),
    series: series.map((s) => {
      const pts = s.a.puntos
        .filter((p) => dentro(msFecha(p.f)))
        .map((p) => ({ p, r: xlsn(p) }))
        .filter((q): q is { p: Punto; r: number } => q.r != null)
        .map(({ p, r }) => ({ p, r, x: XF(p.f), y: Y(r), fuera: !!p.fuera }))
      return { ...s, pts, d: pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('') }
    }),
  }
}
const pMK = computed(() => panelLSN(marcadores.value, MK.y, MK.h, 0.05, 30))
const pHP = computed(() => panelLSN(higado.value, HP.y, HP.h, 0.1, 10))

const pHM = computed(() =>
  hemograma.value.map((s, i) => {
    const y = HM.y + i * 50
    const h = 40
    const vis = s.a.puntos.filter((p) => dentro(msFecha(p.f)))
    const vals = vis.map((p) => p.v).concat(s.a.ref ? [s.a.ref.low, s.a.ref.high] : [])
    const lo = Math.min(...vals); const hi = Math.max(...vals)
    const pad = (hi - lo) * 0.08 || 1
    const Y = linEscala(lo - pad, hi + pad, y + h, y)
    const pts = vis.map((p) => ({ p, x: XF(p.f), y: Y(p.v), fuera: p.fuera }))
    return {
      ...s, y, h,
      banda: s.a.ref ? { y0: Y(s.a.ref.high), y1: Y(s.a.ref.low) } : null,
      pts,
      d: pts.map((q, j) => `${j ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(''),
    }
  }))

/* ── carga tumoral ─────────────────────────────────────────────────────────────── */
const pCT = computed(() => {
  const r = props.recist.filter((m) => m.suma_mm != null && dentro(msFecha(m.fecha)))
    .map((m) => ({ x: XF(m.fecha), y: CT.y + 24, txt: String(m.suma_mm), fecha: m.fecha }))
  const v = props.volumen.filter((m) => m.ml != null && dentro(msFecha(m.fecha)))
    .map((m) => ({ x: XF(m.fecha), y: CT.y + 58, txt: numCaso(m.ml!, props.lang), fecha: m.fecha }))
  return { r, v }
})

/* ── lectura por fecha (hover) ─────────────────────────────────────────────────── */
const svgRef = ref<SVGSVGElement | null>(null)
const lectura = ref<{ x: number; fecha: string } | null>(null)
const fechasDatos = computed(() => {
  const s = new Set<string>()
  for (const g of [pMK.value.series, pHP.value.series]) for (const x of g) for (const q of x.pts) s.add(q.p.f)
  for (const x of pHM.value) for (const q of x.pts) s.add(q.p.f)
  return [...s].sort()
})
function mover(ev: PointerEvent) {
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * W
  if (x < X0 || x > X1) { lectura.value = null; return }
  let mejor: string | null = null; let dmin = 14
  for (const f of fechasDatos.value) {
    const d = Math.abs(XF(f) - x)
    if (d < dmin) { dmin = d; mejor = f }
  }
  lectura.value = mejor ? { x: XF(mejor), fecha: mejor } : null
}
const filasLectura = computed(() => {
  if (!lectura.value) return []
  const f = lectura.value.fecha
  const out: { etq: string; val: string; fuera: boolean }[] = []
  for (const s of [...pMK.value.series, ...pHP.value.series]) {
    const q = s.pts.find((z) => z.p.f === f)
    if (q) out.push({ etq: s.etiqueta, val: `${numCaso(q.p.v, props.lang)} ${s.a.unidad} · ${numCaso(q.r, props.lang, 1)}×`, fuera: q.fuera })
  }
  for (const s of pHM.value) {
    const q = s.pts.find((z) => z.p.f === f)
    if (q) out.push({ etq: s.etiqueta, val: `${numCaso(q.p.v, props.lang)} ${s.a.unidad}`, fuera: !!q.fuera })
  }
  return out
})
const lecturaIzq = computed(() => (lectura.value ? (lectura.value.x / W) * 100 : 0))

const tituloEvento = (e: Evento) => txtCaso(e.titulo, props.lang)
const r = (v: number) => v.toFixed(1)
</script>

<template>
  <figure class="cc">
    <div class="cc__barra">
      <div class="cc__vistas" role="group" :aria-label="L('Ventana de tiempo', 'Time window')">
        <button
          v-for="v in vistas" :key="v.k" type="button" class="cc__vista"
          :aria-pressed="vista === v.k" @click="vista = v.k"
        >{{ L(v.es, v.en) }}</button>
      </div>
      <p class="cc__nota">
        {{ L('Pasa el cursor por la figura para leer los valores de cada fecha. Todas las cifras están en las tablas de abajo.',
             'Hover over the figure to read each date’s values. Every figure is also in the tables below.') }}
      </p>
    </div>

    <div class="cc__lienzo" @pointerleave="lectura = null">
      <svg
        ref="svgRef" :viewBox="`0 0 ${W} ${H}`" class="cc__svg" role="img"
        :aria-label="L('Curso clínico del caso sobre un eje de tiempo compartido: eventos, líneas de tratamiento, marcadores tumorales y función hepática en veces el límite superior normal, hemograma y carga tumoral. Los mismos datos están en las tablas de la página.',
                       'Clinical course on a shared time axis: events, treatment lines, tumour markers and liver function in multiples of the upper limit of normal, blood counts and tumour burden. The same data are in the tables on this page.')"
        @pointermove="mover"
      >
        <defs>
          <clipPath id="cc-plot"><rect :x="X0" y="0" :width="X1 - X0" :height="H" /></clipPath>
          <pattern id="cc-rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-miriam)" stroke-width="2" stroke-opacity=".35" />
          </pattern>
        </defs>

        <!-- rejilla de tiempo -->
        <g class="cc__rejilla">
          <line v-for="tk in ticks" :key="`g${tk.x}`" :x1="tk.x" :x2="tk.x" :y1="Y_EJE + 4" :y2="H - 20"
                :stroke="tk.mayor ? 'var(--viz-eje)' : 'var(--viz-rejilla)'" />
          <text v-for="tk in ticks" :key="`t${tk.x}`" :x="tk.x + 3" :y="Y_EJE" class="cc__tick" :class="{ 'cc__tick--mayor': tk.mayor }">{{ tk.txt }}</text>
          <text v-for="tk in ticks.filter((z) => z.mayor)" :key="`b${tk.x}`" :x="tk.x + 3" :y="H - 6" class="cc__tick cc__tick--mayor">{{ tk.txt }}</text>
        </g>

        <!-- bandas de línea sistémica a lo largo de los carriles de datos -->
        <g clip-path="url(#cc-plot)">
          <rect v-for="(l, i) in lineasVista.filter((z) => z.sistemica && !z.futura)" :key="`bl${l.id}`"
                :x="l.xa0" :y="MK.y - 6" :width="Math.max(0, l.xb1 - l.xa0)" :height="CT.y + CT.h - MK.y + 6"
                :class="['cc__banda-linea', { 'cc__banda-linea--par': i % 2 }]" />
          <!-- guías de diagnóstico y progresión -->
          <template v-for="e in guias" :key="`gu${e.id}`">
            <line v-if="e.puntual" :x1="e.xa" :x2="e.xa" :y1="EV.y + 8" :y2="CT.y + CT.h" class="cc__guia" />
            <rect v-else :x="e.xa" :y="EV.y + 8" :width="Math.max(1, e.xb - e.xa)" :height="CT.y + CT.h - EV.y - 8" class="cc__guia-franja" />
          </template>
        </g>

        <!-- ── eventos ── -->
        <text :x="10" :y="EV.y + 18" class="cc__carril">{{ L('Eventos', 'Events') }}</text>
        <text :x="10" :y="EV.y + 32" class="cc__carril-sub">{{ L('cronología pública', 'public timeline') }}</text>
        <g clip-path="url(#cc-plot)">
          <g v-for="e in eventosVista" :key="e.id" class="cc__evento">
            <title>{{ e.n }}. {{ e.fecha_texto }} · {{ tituloEvento(e) }}</title>
            <rect v-if="!e.puntual" :x="e.xa" :y="EV.y + 52" :width="Math.max(2, e.xb - e.xa)" height="10" class="cc__franja" />
            <path :d="pathForma(FORMA_EVENTO[e.clase ?? 'sintomas'] ?? 'circulo', e.xc, EV.y + 57, 5)"
                  :class="['cc__glifo', { 'cc__glifo--aspa': e.clase === 'ingreso', 'cc__glifo--fuerte': e.clase === 'progresion' || e.clase === 'diagnostico' }]" />
            <line v-if="e.fila" :x1="e.xc" :x2="e.xc" :y1="EV.y + 42 - e.fila * 11" :y2="EV.y + 39" class="cc__num-guia" />
            <text :x="e.xc" :y="EV.y + 42 - e.fila * 11 - 2" text-anchor="middle" class="cc__num">{{ e.n }}</text>
          </g>
        </g>

        <!-- ── líneas de tratamiento ── -->
        <text :x="10" :y="LN.y + 16" class="cc__carril">{{ L('Tratamiento', 'Treatment') }}</text>
        <text :x="10" :y="LN.y + 29" class="cc__carril-sub">{{ L('líneas, radioterapia', 'lines, radiotherapy') }}</text>
        <text :x="10" :y="LN.y + 41" class="cc__carril-sub">{{ L('y de fondo', 'and background') }}</text>
        <g clip-path="url(#cc-plot)">
          <g v-for="l in lineasVista" :key="`l${l.id}`">
            <title>{{ l.id }} · {{ txtCaso(l.tratamiento, lang) }}{{ l.motivo_fin ? ` → ${txtCaso(l.motivo_fin, lang)}` : '' }}</title>
            <rect :x="l.xa1" :y="l.fila.y" :width="Math.max(2, l.xb0 - l.xa1)" :height="l.fila.h"
                  :class="['cc__linea', { 'cc__linea--rt': l.esRT, 'cc__linea--fondo': l.fondo, 'cc__linea--futura': l.futura }]" />
            <!-- tramo incierto (inicio/fin con precisión de mes): rayado, no sólido -->
            <rect v-if="l.incierto0" :x="l.xa0" :y="l.fila.y" :width="Math.max(1, l.xa1 - l.xa0)" :height="l.fila.h" fill="url(#cc-rayado)" />
            <rect v-if="l.incierto1" :x="l.xb0" :y="l.fila.y" :width="Math.max(1, l.xb1 - l.xb0)" :height="l.fila.h" fill="url(#cc-rayado)" />
            <path v-if="l.abierta && l.sistemica" :d="`M${r(l.xb0 - 1)},${l.fila.y}l8,8l-8,8`" class="cc__abierta" />
            <text v-if="l.sistemica" :x="Math.max(l.xa1, X0) + 5" :y="l.fila.y + 12" class="cc__linea-txt">{{ l.id }}</text>
            <text v-else-if="l.fondo" :x="Math.max(l.xa0, X0) + 3" :y="l.fila.y - 1.5" class="cc__fondo-txt">{{ l.id }}</text>
          </g>
        </g>

        <!-- ── marcadores ×LSN ── -->
        <text :x="10" :y="MK.y + 12" class="cc__carril">{{ L('Marcadores', 'Markers') }}</text>
        <text :x="10" :y="MK.y + 26" class="cc__carril-sub">{{ L('× límite sup. normal', '× upper limit normal') }}</text>
        <text :x="10" :y="MK.y + 38" class="cc__carril-sub">{{ L('escala log', 'log scale') }}</text>
        <g>
          <g v-for="tk in pMK.ticks" :key="`mk${tk.v}`">
            <line :x1="X0" :x2="X1" :y1="tk.y" :y2="tk.y" :class="tk.v === 1 ? 'cc__uno' : 'cc__hlinea'" />
            <text :x="X0 - 4" :y="tk.y + 3" text-anchor="end" class="cc__eje-v">{{ numCaso(tk.v, lang) }}×</text>
          </g>
        </g>
        <g clip-path="url(#cc-plot)">
          <g v-for="s in pMK.series" :key="s.key">
            <path :d="s.d" fill="none" :stroke="s.color" stroke-width="1.6" :stroke-dasharray="s.trazo" />
            <path v-for="q in s.pts" :key="q.p.f" :d="pathForma(s.forma, q.x, q.y, q.fuera ? 4 : 3)"
                  :stroke="s.color" stroke-width="1.3" :fill="q.fuera ? s.color : 'var(--color-bg)'" />
          </g>
        </g>
        <g v-for="(s, i) in pMK.series" :key="`lg${s.key}`" :transform="`translate(${X1 - 270 + i * 90}, ${MK.y + 2})`">
          <line x1="0" x2="20" y1="0" y2="0" :stroke="s.color" stroke-width="1.6" :stroke-dasharray="s.trazo" />
          <path :d="pathForma(s.forma, 10, 0, 3)" :stroke="s.color" fill="var(--color-bg)" stroke-width="1.3" />
          <text x="25" y="3" class="cc__leyenda">{{ s.etiqueta }}</text>
        </g>

        <!-- ── hígado ×LSN ── -->
        <text :x="10" :y="HP.y + 12" class="cc__carril">{{ L('Hígado', 'Liver') }}</text>
        <text :x="10" :y="HP.y + 26" class="cc__carril-sub">{{ L('× límite sup. normal', '× upper limit normal') }}</text>
        <text :x="10" :y="HP.y + 38" class="cc__carril-sub">{{ L('escala log', 'log scale') }}</text>
        <g>
          <g v-for="tk in pHP.ticks" :key="`hp${tk.v}`">
            <line :x1="X0" :x2="X1" :y1="tk.y" :y2="tk.y" :class="tk.v === 1 ? 'cc__uno' : 'cc__hlinea'" />
            <text :x="X0 - 4" :y="tk.y + 3" text-anchor="end" class="cc__eje-v">{{ numCaso(tk.v, lang) }}×</text>
          </g>
        </g>
        <g clip-path="url(#cc-plot)">
          <g v-for="s in pHP.series" :key="s.key">
            <path :d="s.d" fill="none" :stroke="s.color" stroke-width="1.6" :stroke-dasharray="s.trazo" />
            <path v-for="q in s.pts" :key="q.p.f" :d="pathForma(s.forma, q.x, q.y, q.fuera ? 4 : 3)"
                  :stroke="s.color" stroke-width="1.3" :fill="q.fuera ? s.color : 'var(--color-bg)'" />
          </g>
        </g>
        <g v-for="(s, i) in pHP.series" :key="`lh${s.key}`" :transform="`translate(${X1 - 520 + i * 104}, ${HP.y + 2})`">
          <line x1="0" x2="20" y1="0" y2="0" :stroke="s.color" stroke-width="1.6" :stroke-dasharray="s.trazo" />
          <path :d="pathForma(s.forma, 10, 0, 3)" :stroke="s.color" fill="var(--color-bg)" stroke-width="1.3" />
          <text x="25" y="3" class="cc__leyenda">{{ s.etiqueta }}</text>
        </g>

        <!-- ── hemograma en unidades reales ── -->
        <g v-for="s in pHM" :key="`hm${s.key}`">
          <text :x="10" :y="s.y + 16" class="cc__carril cc__carril--s">{{ s.etiqueta }}</text>
          <text :x="10" :y="s.y + 29" class="cc__carril-sub">{{ s.a.unidad }}</text>
          <rect v-if="s.banda" :x="X0" :y="s.banda.y0" :width="X1 - X0" :height="Math.max(1, s.banda.y1 - s.banda.y0)" class="cc__rango" />
          <g clip-path="url(#cc-plot)">
            <path :d="s.d" fill="none" stroke="var(--color-text)" stroke-width="1.3" />
            <template v-for="q in s.pts" :key="q.p.f">
              <path v-if="q.fuera === 'bajo'" :d="`M${r(q.x - 4)},${r(q.y - 3)}h8l-4,7Z`" class="cc__fuera" />
              <path v-else-if="q.fuera" :d="`M${r(q.x - 4)},${r(q.y + 3)}h8l-4,-7Z`" class="cc__fuera" />
              <circle v-else :cx="q.x" :cy="q.y" r="2.4" class="cc__dentro" />
            </template>
          </g>
        </g>

        <!-- ── carga tumoral ── -->
        <text :x="10" :y="CT.y + 14" class="cc__carril">{{ L('Carga tumoral', 'Tumour burden') }}</text>
        <text :x="10" :y="CT.y + 27" class="cc__carril-sub">{{ L('suma RECIST (mm)', 'RECIST sum (mm)') }}</text>
        <text :x="10" :y="CT.y + 61" class="cc__carril-sub">{{ L('volumen hígado (ml)', 'liver volume (ml)') }}</text>
        <line :x1="X0" :x2="X1" :y1="CT.y + 38" :y2="CT.y + 38" class="cc__hlinea" />
        <g clip-path="url(#cc-plot)">
          <path v-if="pCT.r.length > 1" :d="pCT.r.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join('')" class="cc__ct-linea" />
          <path v-if="pCT.v.length > 1" :d="pCT.v.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join('')" class="cc__ct-linea" />
          <g v-for="q in pCT.r" :key="`r${q.fecha}`">
            <path :d="pathForma('cuadrado', q.x, q.y, 3.5)" class="cc__ct-punto" />
            <text :x="q.x" :y="q.y - 8" text-anchor="middle" class="cc__ct-txt">{{ q.txt }}</text>
          </g>
          <g v-for="q in pCT.v" :key="`v${q.fecha}`">
            <path :d="pathForma('circulo', q.x, q.y, 3.5)" class="cc__ct-punto" />
            <text :x="q.x" :y="q.y - 8" text-anchor="middle" class="cc__ct-txt">{{ q.txt }}</text>
          </g>
        </g>

        <!-- hoy -->
        <line :x1="X(hoyMs)" :x2="X(hoyMs)" :y1="Y_EJE + 4" :y2="H - 20" class="cc__hoy" />
        <text :x="X(hoyMs) - 3" :y="EV.y + 6" text-anchor="end" class="cc__hoy-txt">{{ L('hoy', 'today') }}</text>

        <!-- lectura -->
        <line v-if="lectura" :x1="lectura.x" :x2="lectura.x" :y1="MK.y - 6" :y2="HM.y + HM.h" class="cc__cursor" />
      </svg>

      <div v-if="lectura && filasLectura.length" class="cc__tip" :class="{ 'cc__tip--izq': lecturaIzq > 60 }"
           :style="{ left: `${lecturaIzq}%` }" aria-hidden="true">
        <p class="cc__tip-fecha">{{ fechaCorta(lectura.fecha, lang) }}</p>
        <p v-for="f in filasLectura" :key="f.etq" class="cc__tip-fila">
          <span>{{ f.etq }}</span><span class="nums" :class="{ 'cc__tip-fuera': f.fuera }">{{ f.val }}{{ f.fuera ? ' ●' : '' }}</span>
        </p>
      </div>
    </div>

    <figcaption class="cc__leyendas">
      <span class="cc__ley"><svg width="16" height="12" aria-hidden="true"><path :d="pathForma('circulo', 8, 6, 3.5)" stroke="var(--color-text)" fill="var(--color-bg)" stroke-width="1.3" /></svg>{{ L('dentro de rango (hueco)', 'within range (hollow)') }}</span>
      <span class="cc__ley"><svg width="16" height="12" aria-hidden="true"><path :d="pathForma('circulo', 8, 6, 4.5)" fill="var(--color-text)" /></svg>{{ L('fuera de rango (relleno)', 'out of range (filled)') }}</span>
      <span class="cc__ley"><svg width="16" height="12" aria-hidden="true"><path d="M4,3h8l-4,7Z" class="cc__fuera" /></svg><svg width="16" height="12" aria-hidden="true"><path d="M4,10h8l-4,-7Z" class="cc__fuera" /></svg>{{ L('hemograma bajo / sobre el rango', 'blood count below / above range') }}</span>
      <span class="cc__ley"><svg width="16" height="12" aria-hidden="true"><rect x="0" y="2" width="16" height="8" fill="url(#cc-rayado-ley)" /><defs><pattern id="cc-rayado-ley" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-miriam)" stroke-width="2" stroke-opacity=".35" /></pattern></defs></svg>{{ L('fecha conocida solo al mes', 'date known only to the month') }}</span>
      <span v-for="(v, k) in CLASE_TXT" :key="k" class="cc__ley">
        <svg width="14" height="12" aria-hidden="true"><path :d="pathForma(FORMA_EVENTO[k] ?? 'circulo', 7, 6, 4)" :class="['cc__glifo', { 'cc__glifo--aspa': k === 'ingreso' }]" /></svg>{{ L(v[0], v[1]) }}
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.cc { margin: 0; }
.cc__barra { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin-bottom: 10px; }
.cc__vistas { display: inline-flex; gap: 4px; padding: 3px; border-radius: 999px; background: rgb(var(--color-text-rgb) / 0.05); }
.cc__vista { font: 600 13px/1 var(--font-body); padding: 8px 12px; border-radius: 999px; color: var(--color-text-soft); min-height: 32px; }
.cc__vista[aria-pressed='true'] { background: var(--color-text); color: var(--color-bg); }
.cc__vista:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.cc__nota { font: 400 13px/1.4 var(--font-body); color: var(--color-text-soft); margin: 0; }
.cc__lienzo { position: relative; }
.cc__svg { display: block; width: 100%; height: auto; touch-action: pan-y; }
.cc__tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.cc__tick--mayor { font-weight: 700; fill: var(--color-text); }
.cc__carril { font: 700 12px var(--font-body); fill: var(--color-text); }
.cc__carril--s { font-size: 11.5px; }
.cc__carril-sub { font: 400 10px var(--font-body); fill: var(--color-text-soft); }
.cc__eje-v { font: 500 9.5px var(--font-mono); fill: var(--color-text-soft); }
.cc__hlinea { stroke: var(--viz-rejilla); }
.cc__uno { stroke: var(--color-text); stroke-opacity: 0.55; stroke-width: 1.2; }
.cc__banda-linea { fill: var(--color-miriam); fill-opacity: 0.06; }
.cc__banda-linea--par { fill-opacity: 0.025; }
.cc__num-guia { stroke: var(--color-text); stroke-opacity: 0.25; }
.cc__guia { stroke: var(--color-text); stroke-opacity: 0.45; stroke-dasharray: 3 3; }
.cc__guia-franja { fill: var(--color-text); fill-opacity: 0.05; }
.cc__franja { fill: var(--color-text); fill-opacity: 0.1; }
.cc__glifo { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.3; }
.cc__glifo--fuerte { fill: var(--color-text); }
.cc__glifo--aspa { stroke-width: 2.2; }
.cc__num { font: 600 9.5px var(--font-mono); fill: var(--color-text); }
.cc__linea { fill: var(--viz-sev-2); stroke: var(--color-text); stroke-opacity: 0.35; }
.cc__linea--rt { fill: var(--viz-sev-4); stroke: none; }
.cc__linea--fondo { fill: var(--viz-div-2); stroke: none; }
.cc__fondo-txt { font: 600 8.5px var(--font-mono); fill: var(--color-text-soft); }
.cc__linea--futura { fill: none; stroke-dasharray: 4 3; stroke-opacity: 0.8; }
.cc__abierta { fill: none; stroke: var(--color-text); stroke-width: 1.2; }
.cc__linea-txt { font: 700 11px var(--font-mono); fill: var(--color-text); pointer-events: none; }
.cc__leyenda { font: 500 10.5px var(--font-body); fill: var(--color-text); }
.cc__rango { fill: var(--color-text); fill-opacity: 0.07; }
.cc__dentro { fill: var(--color-bg); stroke: var(--color-text); stroke-width: 1.1; }
.cc__fuera { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.6; }
.cc__ct-linea { fill: none; stroke: var(--color-text); stroke-width: 1.3; stroke-dasharray: 4 3; }
.cc__ct-punto { fill: var(--color-text); }
.cc__ct-txt { font: 600 10.5px var(--font-mono); fill: var(--color-text); }
.cc__hoy { stroke: var(--color-miriam); stroke-width: 1.2; }
.cc__hoy-txt { font: 700 10px var(--font-mono); fill: var(--color-miriam); }
.cc__cursor { stroke: var(--color-text); stroke-width: 1; stroke-opacity: 0.6; pointer-events: none; }
.cc__tip { position: absolute; top: 150px; transform: translateX(12px); min-width: 210px; max-width: 280px;
  background: var(--viz-tooltip-bg); color: var(--viz-tooltip-text); border-radius: 10px; padding: 10px 12px;
  box-shadow: var(--sombra-flotante); pointer-events: none; z-index: 5; }
.cc__tip--izq { transform: translateX(calc(-100% - 12px)); }
.cc__tip-fecha { font: 700 13px var(--font-mono); margin: 0 0 6px; }
.cc__tip-fila { display: flex; justify-content: space-between; gap: 12px; font: 400 12px/1.5 var(--font-body); margin: 0; }
.cc__tip-fuera { font-weight: 700; }
.cc__leyendas { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font: 400 12.5px/1.4 var(--font-body); color: var(--color-text-soft); }
.cc__ley { display: inline-flex; align-items: center; gap: 6px; }
</style>
