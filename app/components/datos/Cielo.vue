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
import type { Analito, Contexto, Lang } from '~/utils/datosCaso'

const props = defineProps<{
  grupos: Record<string, { analitos: Analito[] }>
  contexto: Contexto
  hoy: string
  lang: Lang
}>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

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
  .map((p) => ({ t: msFecha(p.f), fila: i, fuera: !!p.fuera }))
  .filter((q) => q.t >= desde && q.t <= hasta)))
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
watch([W, () => props.lang], () => pintar())
onBeforeUnmount(() => { io?.disconnect(); clearTimeout(reserva); cancelAnimationFrame(raf) })
function repetir() { cancelAnimationFrame(raf); barrido = 0; encender() }
</script>

<template>
  <section class="cielo" :aria-label="L('Todas las analíticas en un vistazo', 'Every lab value at a glance')">
    <div class="cielo__dentro">
      <p class="cielo__cifra"><span class="nums">{{ miles(nPuntos) }}</span> {{ L('valores de laboratorio', 'lab values') }}</p>
      <p class="cielo__sub">
        {{ L(`Cada punto es uno. Los ${miles(nFuera)} violetas se salieron de rango.`, `Each dot is one. The ${miles(nFuera)} violet ones fell outside the range.`) }}
      </p>
      <div ref="caja" class="cielo__lienzo" @click="repetir">
        <canvas ref="lienzo" role="img" :aria-label="L(`${nPuntos} valores de laboratorio desde diciembre de 2023, ${nFuera} fuera de rango, ordenados por fecha y por prueba.`, `${nPuntos} lab values since December 2023, ${nFuera} out of range, by date and by test.`)" />
      </div>
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
.cielo__lienzo { cursor: pointer; }
.cielo__lienzo canvas { display: block; }
.cielo__ley { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 10px 0 0; font: 400 12px var(--font-body); color: rgb(var(--color-bg-rgb) / 0.75); }
.cielo__ley span { display: inline-flex; align-items: center; gap: 6px; }
.cielo__px { width: 6px; height: 5px; background: rgb(var(--color-bg-rgb) / 0.45); display: inline-block; }
.cielo__px--fuera { background: var(--color-miriam-claro); box-shadow: 0 0 6px var(--color-miriam-claro); }
.cielo__raya { width: 1px; height: 12px; border-left: 1px dashed rgb(var(--color-bg-rgb) / 0.5); display: inline-block; }
.cielo__franja { width: 14px; height: 10px; background: rgb(199 125 210 / 0.25); display: inline-block; }
</style>
