<script setup lang="ts">
/**
 * Dias — un cuadrado por cada día desde el diagnóstico (gráfico de unidades, «1 cuadrado = 1
 * día», en la línea de *Bruises* de Lupi y King). Cada fila es un mes; cada columna, un día del
 * mes. Violeta = día dentro de una línea de tratamiento (1L, 2L, 3L…); hueco = sin línea en
 * curso; rayado = el día cae en un mes donde solo se sabe el mes de inicio o fin (no se
 * inventa el día); ▲ = progresión con fecha exacta; punto = radioterapia.
 * Lo que enseña de un golpe: cuánto tiempo, y los huecos sin tratamiento entre líneas.
 * Se rellena día a día al entrar en pantalla (canvas; sin animar con movimiento reducido).
 */
import type { Evento, Lang, Texto } from '~/utils/datosCaso'

interface Linea { id: string; tratamiento: Texto; inicio: string; fin: string | null }
const props = defineProps<{ lineas: Linea[]; eventos: Evento[]; diagnostico: string; hoy: string; lang: Lang }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const DIA = 86400000
const ini = msFecha(props.diagnostico)
const fin = msFecha(props.hoy)

type Estado = 'trat' | 'sin' | 'incierto'
const tramos = props.lineas.map((l) => {
  const sistemica = /^\d+L$/i.test(l.id)
  const rt = l.id.toUpperCase().startsWith('RT')
  const a = rangoParcial(l.inicio)
  const z = l.fin ? rangoParcial(l.fin) : null
  return a && (sistemica || rt) ? { id: l.id, sistemica, rt, a, z } : null
}).filter((t): t is NonNullable<typeof t> => !!t)
const progresiones = new Set(props.eventos.filter((e) => e.clase === 'progresion' && e.precision === 'dia').map((e) => e.desde))

const dias = computed(() => {
  const out: { t: number; iso: string; estado: Estado; rt: boolean; prog: boolean }[] = []
  for (let t = ini; t <= fin; t += DIA) {
    const iso = new Date(t).toISOString().slice(0, 10)
    let estado: Estado = 'sin'
    let rt = false
    for (const s of tramos) {
      const desdeSeguro = s.a[1], hastaSeguro = s.z ? s.z[0] : Infinity
      const desdePosible = s.a[0], hastaPosible = s.z ? s.z[1] : Infinity
      const dentroSeguro = t >= desdeSeguro && t <= hastaSeguro
      const dentroPosible = t >= desdePosible && t <= hastaPosible
      // radioterapia: solo con fecha de día; una RT sabida «en junio» pintaría 30 días de más
      if (s.rt) { if (s.a[0] === s.a[1] && dentroPosible) rt = true; continue }
      if (dentroSeguro) estado = 'trat'
      else if (dentroPosible && estado !== 'trat') estado = 'incierto'
    }
    out.push({ t, iso, estado, rt, prog: progresiones.has(iso) })
  }
  return out
})
const cuenta = computed(() => ({
  total: dias.value.length,
  trat: dias.value.filter((d) => d.estado === 'trat').length,
  sin: dias.value.filter((d) => d.estado === 'sin').length,
  incierto: dias.value.filter((d) => d.estado === 'incierto').length,
}))

const caja = ref<HTMLElement | null>(null)
const lienzo = ref<HTMLCanvasElement | null>(null)
const W = useAncho(caja)
const IZQ = 40
const meses = computed(() => {
  const out: { a: number; m: number }[] = []
  const d0 = new Date(ini), d1 = new Date(fin)
  for (let a = d0.getUTCFullYear(), m = d0.getUTCMonth(); a < d1.getUTCFullYear() || (a === d1.getUTCFullYear() && m <= d1.getUTCMonth()); m++) {
    if (m > 11) { m = 0; a++ }
    out.push({ a, m })
  }
  return out
})
const celda = computed(() => Math.max(6, Math.floor((W.value - IZQ) / 31)))
const H = computed(() => meses.value.length * celda.value + 4)

let progreso = 1
let raf = 0
function css(v: string) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() }
function pintar() {
  const cv = lienzo.value
  if (!cv) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = W.value, h = H.value, c = celda.value
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`
  const cx = cv.getContext('2d')!
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h)
  const tinta = css('--color-text'), violeta = css('--color-miriam'), suave = css('--color-text-soft')
  const hasta = Math.floor(dias.value.length * progreso)
  cx.font = '600 9px "JetBrains Mono", ui-monospace, monospace'; cx.textBaseline = 'middle'
  meses.value.forEach(({ a, m }, fila) => {
    if (m === 0 || fila === 0) { cx.fillStyle = tinta; cx.fillText(String(a), 0, fila * c + c / 2) }
    else { cx.fillStyle = suave; cx.fillText(mesCorto(m, props.lang), 4, fila * c + c / 2) }
  })
  const s = c - 2
  for (let i = 0; i < hasta; i++) {
    const d = dias.value[i]
    const f = new Date(d.t)
    const fila = (f.getUTCFullYear() - new Date(ini).getUTCFullYear()) * 12 + f.getUTCMonth() - new Date(ini).getUTCMonth()
    const x = IZQ + (f.getUTCDate() - 1) * c, y = fila * c
    if (d.estado === 'trat') { cx.fillStyle = violeta; cx.globalAlpha = 0.85; cx.fillRect(x, y, s, s); cx.globalAlpha = 1 }
    else if (d.estado === 'incierto') {
      cx.strokeStyle = violeta; cx.lineWidth = 1; cx.globalAlpha = 0.7
      cx.beginPath(); cx.moveTo(x, y + s); cx.lineTo(x + s, y); cx.stroke()
      cx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1); cx.globalAlpha = 1
    } else { cx.strokeStyle = tinta; cx.globalAlpha = 0.28; cx.lineWidth = 1; cx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1); cx.globalAlpha = 1 }
    if (d.rt) { cx.fillStyle = tinta; cx.beginPath(); cx.arc(x + s / 2, y + s / 2, Math.max(1.5, s / 5), 0, 7); cx.fill() }
    if (d.prog) {
      cx.fillStyle = tinta
      cx.beginPath(); cx.moveTo(x + s / 2, y - 1); cx.lineTo(x + s + 1, y + s + 1); cx.lineTo(x - 1, y + s + 1); cx.closePath(); cx.fill()
    }
  }
}
function llenar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.visibilityState === 'hidden') { progreso = 1; pintar(); return }
  const t0 = performance.now()
  const paso = (t: number) => {
    progreso = Math.min(1, Math.max(0, (t - t0) / 2200))
    pintar()
    if (progreso < 1) raf = requestAnimationFrame(paso)
  }
  raf = requestAnimationFrame(paso)
}
const { armado, visto } = useAlVer(caja, 0.25)
watch(armado, (a) => { if (a && !visto.value) { progreso = 0; pintar() } })
watch(visto, (v) => { if (v) llenar() })
onMounted(() => pintar())
watch([W, () => props.lang], () => pintar())
onBeforeUnmount(() => cancelAnimationFrame(raf))
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, props.lang === 'en' ? ',' : '.')
</script>

<template>
  <figure class="dias">
    <p class="dias__cifra"><span class="nums">{{ miles(cuenta.total) }}</span> {{ L('días', 'days') }}</p>
    <p class="dias__sub nums">
      {{ L(`${miles(cuenta.trat)} en una línea de tratamiento · ${miles(cuenta.sin)} sin línea en curso`, `${miles(cuenta.trat)} on a treatment line · ${miles(cuenta.sin)} with no line running`) }}<template v-if="cuenta.incierto"> · {{ L(`${cuenta.incierto} con fecha aproximada`, `${cuenta.incierto} with an approximate date`) }}</template>
    </p>
    <div ref="caja">
      <canvas ref="lienzo" role="img"
              :aria-label="L(`${cuenta.total} días desde el diagnóstico: ${cuenta.trat} en una línea de tratamiento, ${cuenta.sin} sin línea en curso.`, `${cuenta.total} days since diagnosis: ${cuenta.trat} on a treatment line, ${cuenta.sin} with no line running.`)" />
    </div>
    <p class="dias__ley">
      <span><i class="dias__c dias__c--trat" />{{ L('con tratamiento', 'on treatment') }}</span>
      <span><i class="dias__c" />{{ L('sin línea en curso', 'no line running') }}</span>
      <span><i class="dias__c dias__c--inc" />{{ L('fecha aproximada', 'approximate date') }}</span>
      <span>▲ {{ L('progresión', 'progression') }}</span>
      <span>● {{ L('radioterapia', 'radiotherapy') }}</span>
    </p>
  </figure>
</template>

<style scoped>
.dias { margin: 0; }
.dias__cifra { font: var(--tipo-cifra); font-size: clamp(22px, 6vw, 32px); letter-spacing: var(--track-cifra); margin: 0; color: var(--color-text); }
.dias__cifra .nums { color: var(--color-miriam); }
.dias__sub { font: 500 13px/1.4 var(--font-body); color: var(--color-text-soft); margin: 4px 0 12px; }
.dias canvas { display: block; }
.dias__ley { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 10px 0 0; font: 400 12px var(--font-body); color: var(--color-text-soft); }
.dias__ley span { display: inline-flex; align-items: center; gap: 5px; }
.dias__c { width: 10px; height: 10px; border: 1px solid rgb(var(--color-text-rgb) / 0.35); display: inline-block; }
.dias__c--trat { background: rgb(var(--color-miriam-rgb) / 0.85); border-color: transparent; }
.dias__c--inc { border-color: var(--color-miriam); background: linear-gradient(to top right, transparent 45%, var(--color-miriam) 45%, var(--color-miriam) 55%, transparent 55%); }
</style>
