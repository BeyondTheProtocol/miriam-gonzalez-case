<script setup lang="ts">
/**
 * Cielo — el caso entero en un golpe de vista: cada valor de laboratorio es un píxel.
 *
 * Miriam (24-sep-2026): «quiero que haya impresión visual». Guiño al pixel art (el vídeo de
 * @DotCSV que trajo), pero sin decorar nada: x = fecha de la extracción, y = la prueba
 * (agrupadas: marcadores, sangre, hígado y riñón, iones). Píxel tenue = dentro del rango de su
 * informe; píxel violeta que brilla = fuera. Rayas = progresiones; franjas = líneas de
 * tratamiento. Al entrar en pantalla se encienden de izquierda a derecha, como el tiempo; con
 * «movimiento reducido» se pinta entero sin animar.
 *
 * Canvas 2D (1.700 píxeles con brillo van mejor que 1.700 nodos SVG en un móvil). En el HTML
 * estático queda el texto; los píxeles los pinta el cliente.
 */
import type { Analito, Contexto, Lang, Punto } from '~/utils/datosCaso'
import { unidadTxt, valCaso } from '~/utils/datosCaso'

const props = defineProps<{
  grupos: Record<string, { analitos: Analito[] }>
  contexto: Contexto
  hoy: string
  lang: Lang
  /** nombres cortos del panel («CA 15-3», no el «CA 15.3» del informe) */
  nombres?: Record<string, string>
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
/** tocar el cielo lleva a esa fecha: la página fija el cursor y baja a Evolución */
const emit = defineEmits<{ fecha: [iso: string] }>()

const ORDEN: [string, string, string][] = [
  ['marcadores', 'Marcadores', 'Markers'], ['hematologia', 'Sangre', 'Blood'],
  ['renal_hepatico', 'Hígado y riñón', 'Liver & kidney'], ['electrolitos', 'Iones', 'Ions'],
]
const DIA = 86400000
const desde = Date.UTC(2023, 11, 1)
const hasta = msFecha(props.hoy) + 20 * DIA

const filas = computed(() => {
  const out: { g: string; a: Analito }[] = []
  for (const [g] of ORDEN) for (const a of props.grupos[g]?.analitos ?? []) out.push({ g, a })
  return out
})
const puntos = computed(() => filas.value.flatMap((f, i) => f.a.puntos
  // violeta = se sale DE VERDAD (alto/bajo); lo que el informe marcó sin salirse del rango, tenue
  .map((p) => ({ t: msFecha(p.f), fila: i, fuera: p.fuera === 'alto' || p.fuera === 'bajo', p, a: f.a }))
  .filter((q) => q.t >= desde && q.t <= hasta)))
type PuntoCielo = (typeof puntos.value)[number]
/** el punto elegido (tocar o teclado); se declara aquí porque pintar() y el watch lo leen */
const sel = ref<PuntoCielo | null>(null)
const nPuntos = computed(() => puntos.value.length)
const nFuera = computed(() => puntos.value.filter((p) => p.fuera).length)
// miles con separador siempre (es-ES no agrupa 4 cifras: «1696» se lee peor que «1.696»)
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, props.lang === 'en' ? ',' : '.')

const caja = ref<HTMLElement | null>(null)
const lienzo = ref<HTMLCanvasElement | null>(null)
const W = useAncho(caja)
const IZQ = 84
const ALTO_FILA = computed(() => (W.value < 520 ? 5 : 7))
const H = computed(() => filas.value.length * ALTO_FILA.value + 40)

let barrido = 0 // 0..1: hasta dónde se ha encendido el cielo
let raf = 0
function color(v: string) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() }

function pintar() {
  const cv = lienzo.value
  if (!cv) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = W.value
  const h = H.value
  cv.width = w * dpr; cv.height = h * dpr
  cv.style.width = `${w}px`; cv.style.height = `${h}px`
  const cx = cv.getContext('2d')!
  cx.setTransform(dpr, 0, 0, dpr, 0, 0)
  cx.clearRect(0, 0, w, h)
  const X = (t: number) => IZQ + ((t - desde) / (hasta - desde)) * (w - IZQ - 8)
  const fila = ALTO_FILA.value
  const tope = desde + (hasta - desde) * barrido
  const crema = color('--color-bg') || '#faf6f0'
  const violeta = color('--color-miriam-claro') || '#c77dd2'

  // líneas de tratamiento (franjas) y progresiones (rayas)
  // (199,125,210) = --color-miriam-claro: el canvas no mezcla variables CSS con alfa
  cx.fillStyle = 'rgba(199,125,210,0.07)'
  for (const b of props.contexto.bandas) {
    const a = Math.max(b.ini, desde), z = Math.min(b.fin, tope)
    if (z > a) cx.fillRect(X(a), 8, X(z) - X(a), filas.value.length * fila)
  }
  cx.strokeStyle = 'rgba(250,246,240,0.28)'; cx.setLineDash([3, 3]); cx.lineWidth = 1
  for (const t of props.contexto.progresiones) {
    if (t < desde || t > tope) continue
    cx.beginPath(); cx.moveTo(X(t) + 0.5, 4); cx.lineTo(X(t) + 0.5, 8 + filas.value.length * fila); cx.stroke()
  }
  cx.setLineDash([])

  // separadores y nombres de grupo
  cx.font = '600 10px "Hanken Grotesk", system-ui, sans-serif'
  cx.textBaseline = 'middle'
  let i0 = 0
  for (const [g, es, en] of ORDEN) {
    const n = filas.value.filter((f) => f.g === g).length
    if (!n) continue
    cx.fillStyle = 'rgba(250,246,240,0.7)'
    cx.fillText(L(es, en), 2, 8 + (i0 + n / 2) * fila)
    cx.fillStyle = 'rgba(250,246,240,0.08)'
    cx.fillRect(IZQ, 8 + i0 * fila - 0.5, w - IZQ - 8, 1)
    i0 += n
  }

  // píxeles: primero los de dentro (tenues), luego los de fuera (con brillo)
  const px = fila <= 5 ? 3 : 4
  cx.fillStyle = crema; cx.globalAlpha = 0.42
  for (const p of puntos.value) if (!p.fuera && p.t <= tope) cx.fillRect(Math.round(X(p.t)), 8 + p.fila * fila, px, px - 1)
  cx.globalAlpha = 1; cx.fillStyle = violeta; cx.shadowColor = violeta; cx.shadowBlur = 6
  for (const p of puntos.value) if (p.fuera && p.t <= tope) cx.fillRect(Math.round(X(p.t)), 8 + p.fila * fila, px, px - 1)
  cx.shadowBlur = 0

  // el punto elegido (tocar o teclado): anillo y cruz fina, para ver qué se está leyendo
  if (sel.value) {
    const sx = Math.round(X(sel.value.t)) + px / 2, sy = 8 + sel.value.fila * fila + (px - 1) / 2
    cx.strokeStyle = crema; cx.lineWidth = 1; cx.globalAlpha = 0.35
    cx.beginPath(); cx.moveTo(sx, 4); cx.lineTo(sx, 8 + filas.value.length * fila); cx.moveTo(IZQ, sy); cx.lineTo(w - 8, sy); cx.stroke()
    cx.globalAlpha = 1; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(sx, sy, 6, 0, 7); cx.stroke()
  }

  // cabeza del barrido
  if (barrido < 1) {
    const xh = X(tope)
    const grad = cx.createLinearGradient(xh - 30, 0, xh, 0)
    grad.addColorStop(0, 'rgba(199,125,210,0)'); grad.addColorStop(1, 'rgba(199,125,210,0.55)')
    cx.fillStyle = grad; cx.fillRect(xh - 30, 4, 30, filas.value.length * fila + 6)
  }

  // años
  cx.fillStyle = 'rgba(250,246,240,0.6)'; cx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'
  for (let a = new Date(desde).getUTCFullYear() + 1; a <= new Date(hasta).getUTCFullYear(); a++) {
    const x = X(Date.UTC(a, 0, 1))
    cx.fillRect(x, 8 + filas.value.length * fila + 2, 1, 5)
    cx.fillText(String(a), x + 3, h - 12)
  }
}

function encender() {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducido) { barrido = 1; pintar(); return }
  const t0 = performance.now()
  const dur = 3200
  const paso = (t: number) => {
    barrido = Math.min(1, Math.max(0, (t - t0) / dur))
    barrido = 1 - Math.pow(1 - barrido, 2) // frena al llegar a hoy
    pintar()
    if (barrido < 1) raf = requestAnimationFrame(paso)
  }
  raf = requestAnimationFrame(paso)
}

let io: IntersectionObserver | null = null
let reserva: ReturnType<typeof setTimeout> | undefined
let encendido = false
function arrancar() { if (encendido) return; encendido = true; io?.disconnect(); clearTimeout(reserva); encender() }
onMounted(() => {
  pintar()
  io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) arrancar() }, { threshold: 0.35 })
  if (caja.value) io.observe(caja.value)
  // si el observador no dispara (pestaña oculta), el cielo no se queda vacío: se pinta entero
  reserva = setTimeout(() => { if (!encendido) { encendido = true; io?.disconnect(); barrido = 1; pintar() } }, 10000)
})
watch([W, () => props.lang, sel], () => pintar())
onBeforeUnmount(() => { io?.disconnect(); clearTimeout(reserva); cancelAnimationFrame(raf) })
/* tocar (o clic) ELIGE el punto más cercano y dice qué es; saltar a Evolución es un segundo paso
   (antes saltaba sin decir qué se había tocado). Con teclado: ← → fechas de esa prueba, ↑ ↓ otra
   prueba, Inicio/Fin extremos, Intro salta, Esc suelta. */
const tiempoX = (x: number) => desde + ((x - IZQ) / (W.value - IZQ - 8)) * (hasta - desde)
function tocar(ev: PointerEvent) {
  const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ev.clientX - r.left, y = ev.clientY - r.top
  if (x < IZQ) return
  const t = tiempoX(x), fila = Math.floor((y - 8) / ALTO_FILA.value)
  // en esa fila, el punto más cercano en X a menos de 24 px (como en las minis); si no hay, no se elige
  // nada: antes se enganchaba al más cercano aunque estuviera a meses (clic en sep → 30-abr)
  const pxPorMs = (W.value - IZQ - 8) / (hasta - desde)
  let mejor: PuntoCielo | null = null, dmin = 24
  for (const p of puntos.value) if (p.fila === fila) { const d = Math.abs(p.t - t) * pxPorMs; if (d < dmin) { dmin = d; mejor = p } }
  sel.value = mejor
}
const deFila = (f: number) => puntos.value.filter((p) => p.fila === f).sort((a, b) => a.t - b.t)
function tecla(ev: KeyboardEvent) {
  if (!puntos.value.length) return
  const s = sel.value
  if (ev.key === 'Escape') { sel.value = null; return }
  if (ev.key === 'Enter' && s) { ev.preventDefault(); emit('fecha', s.p.f); return }
  let n: PuntoCielo | null | undefined = null
  if (!s) n = puntos.value.reduce((m, p) => (p.t > m.t ? p : m), puntos.value[0]!) // sin selección: lo último
  else if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
    const fs = deFila(s.fila), i = fs.findIndex((p) => p.t === s.t)
    n = fs[Math.max(0, Math.min(fs.length - 1, i + (ev.key === 'ArrowRight' ? 1 : -1)))]
  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    const paso = ev.key === 'ArrowDown' ? 1 : -1
    for (let f = s.fila + paso; f >= 0 && f < filas.value.length; f += paso) {
      const fs = deFila(f); if (!fs.length) continue
      n = fs.reduce((m, p) => (Math.abs(p.t - s.t) < Math.abs(m.t - s.t) ? p : m), fs[0]!); break
    }
    n = n ?? s
  } else if (ev.key === 'Home' || ev.key === 'End') { const fs = deFila(s.fila); n = ev.key === 'Home' ? fs[0] : fs[fs.length - 1] }
  else return
  ev.preventDefault(); if (n) sel.value = n
}
const lectura = computed(() => {
  const s = sel.value; if (!s) return ''
  const p: Punto = s.p
  const forma = p.fuera === 'alto' ? '▲ ' : p.fuera === 'bajo' ? '▼ ' : p.fuera ? '◆ ' : ''
  const rango = p.hi != null ? ` · ${L('rango', 'range')} ${numCaso(p.lo ?? 0, props.lang)}–${numCaso(p.hi, props.lang)}${p.ref_de === 'banda' ? '*' : ''}` : ''
  const estado = p.fuera === 'alto' ? L('por encima del rango', 'above range') : p.fuera === 'bajo' ? L('por debajo del rango', 'below range') : p.fuera ? L('marcado en el informe', 'flagged on report') : L('dentro del rango', 'within range')
  return `${props.nombres?.[s.a.key] ?? s.a.nombre} · ${forma}${valCaso(p, props.lang)} ${unidadTxt(s.a.unidad)} · ${fechaCorta(p.f, props.lang)}${rango} · ${estado}`
})
</script>

<template>
  <section class="cielo" :aria-label="L('Todas las analíticas en un vistazo', 'Every lab value at a glance')">
    <div class="cielo__dentro">
      <p class="cielo__cifra"><span class="nums">{{ miles(nPuntos) }}</span> {{ L('valores de laboratorio', 'lab values') }}</p>
      <p class="cielo__sub">
        {{ L(`Cada punto es uno. Los ${miles(nFuera)} violetas se salieron de rango.`, `Each dot is one. The ${miles(nFuera)} violet ones fell outside the range.`) }}
      </p>
      <div ref="caja" class="cielo__lienzo" @pointerup="tocar">
        <canvas ref="lienzo" class="cielo__canvas" role="slider" tabindex="0"
                :aria-label="L(`${nPuntos} valores de laboratorio desde diciembre de 2023, ${nFuera} fuera de rango, ordenados por fecha y por prueba. Flechas izquierda y derecha: fechas; arriba y abajo: pruebas; Intro: ir a esa fecha.`, `${nPuntos} lab values since December 2023, ${nFuera} out of range, by date and by test. Left and right arrows: dates; up and down: tests; Enter: go to that date.`)"
                :aria-valuemin="0" :aria-valuemax="Math.max(0, nPuntos - 1)" :aria-valuenow="sel ? puntos.indexOf(sel) : undefined"
                :aria-valuetext="lectura || undefined" @keydown="tecla" />
      </div>
      <p class="cielo__lee nums" aria-live="polite">
        <template v-if="sel">{{ lectura }} <span class="cielo__sello">↧ {{ L('extraído del informe', 'extracted from report') }}</span>
          <button type="button" class="cielo__ir" @click="emit('fecha', sel.p.f)">{{ L('Ver esa fecha en Evolución', 'See that date in Clinical course') }} →</button></template>
        <template v-else>{{ L('Toca un punto para leerlo.', 'Tap a dot to read it.') }}</template>
      </p>
      <p class="cielo__ley">
        <span><i class="cielo__px" />{{ L('dentro de rango', 'in range') }}</span>
        <span><i class="cielo__px cielo__px--fuera" />{{ L('fuera de rango', 'out of range') }}</span>
        <span><i class="cielo__raya" />{{ L('progresión', 'progression') }}</span>
        <span><i class="cielo__franja" />{{ L('línea de tratamiento', 'treatment line') }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.cielo { background: radial-gradient(120% 90% at 70% 0%, var(--cielo-resplandor) 0%, var(--color-text) 70%); color: var(--color-bg);
  border-radius: 18px; margin: 18px 0 8px; overflow: hidden; }
.cielo__dentro { padding: 20px 16px 16px; }
@media (min-width: 700px) { .cielo__dentro { padding: 28px 28px 20px; } }
.cielo__cifra { font: var(--tipo-cifra); font-size: clamp(22px, 6vw, 34px); letter-spacing: var(--track-cifra); margin: 0; line-height: 1.05; }
.cielo__cifra span { color: var(--color-miriam-claro); }
.cielo__cifra .nums { font-size: clamp(40px, 11vw, 72px); display: block; }
.cielo__sub { font: 400 14.5px/1.45 var(--font-body); color: rgb(var(--color-bg-rgb) / 0.8); margin: 8px 0 14px; max-width: 46ch; }
.cielo__lienzo { cursor: crosshair; touch-action: pan-y; }
.cielo__canvas:focus-visible { outline: 2px solid var(--color-miriam-claro); outline-offset: 3px; border-radius: 4px; }
.cielo__lee { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; min-height: 44px; font: 500 12.5px/1.45 var(--font-mono); color: var(--color-bg); margin: 8px 0 0; }
.cielo__sello { font: 600 11px var(--font-mono); color: rgb(var(--color-bg-rgb) / 0.7); }
.cielo__ir { min-height: 44px; font: 700 13px var(--font-body); color: var(--color-miriam-claro); text-decoration: underline; text-underline-offset: 3px; }
.cielo__ir:focus-visible { outline: 2px solid var(--color-miriam-claro); outline-offset: 2px; }
.cielo__pista { font: 600 12px var(--font-body); color: var(--color-miriam-claro); margin: 8px 0 0; }
.cielo__lienzo canvas { display: block; }
.cielo__ley { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 10px 0 0; font: 400 12px var(--font-body); color: rgb(var(--color-bg-rgb) / 0.75); }
.cielo__ley span { display: inline-flex; align-items: center; gap: 6px; }
.cielo__px { width: 6px; height: 5px; background: rgb(var(--color-bg-rgb) / 0.45); display: inline-block; }
.cielo__px--fuera { background: var(--color-miriam-claro); box-shadow: 0 0 6px var(--color-miriam-claro); }
.cielo__raya { width: 1px; height: 12px; border-left: 1px dashed rgb(var(--color-bg-rgb) / 0.5); display: inline-block; }
.cielo__franja { width: 14px; height: 10px; background: rgb(199 125 210 / 0.25); display: inline-block; }
</style>
