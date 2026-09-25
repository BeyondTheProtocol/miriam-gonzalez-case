<script setup lang="ts">
/**
 * Dias — un calendario por pistas: cada fila es un mes, cada columna un día desde el diagnóstico
 * (en la línea de *1,374 Days* de Giorgia Lupi para NYT, 2023, y de *Bruises*, Lupi y King).
 * Dentro de cada día se apilan capas, de arriba abajo:
 *   · trazos hacia ARRIBA: cuántos valores de esa analítica salieron por encima del rango (▲);
 *   · la banda de la línea de tratamiento (1L sólida, 2L clara, 3L rayada; sin línea, una raya
 *     fina; rayado de contorno = solo se sabe el mes, no se inventa el día);
 *   · trazos hacia ABAJO: cuántos salieron por debajo (▼);
 *   · encima de todo: progresión = raya fina con banderín (▲▼ son «fuera de rango») · TAC con RECIST = ■ (◆ ya es «marcado en el informe») ·
 *     radioterapia = ●; lo sabido solo por mes, hueco (△ ○) junto a la etiqueta del mes.
 * Lo que enseña de un golpe: cuánto duró cada línea, los huecos entre líneas y cuándo las
 * analíticas se cargan de valores fuera de rango. Tocar un día lo lee; si hubo analítica, lleva a ella.
 * Solo cuenta ▲ y ▼ (lo que el informe pone fuera de rango); no pondera pruebas ni interpreta.
 */
import type { Analito, Evento, Lang, Texto } from '~/utils/datosCaso'

interface Linea { id: string; tratamiento: Texto; inicio: string; fin: string | null }
const props = defineProps<{
  lineas: Linea[]
  eventos: Evento[]
  grupos: Record<string, { analitos: Analito[] }>
  /** fechas de TAC con medida RECIST del radiólogo */
  tacs: string[]
  diagnostico: string
  hoy: string
  lang: Lang
}>()
const emit = defineEmits<{ fecha: [iso: string] }>()
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
/* lo que solo se sabe por MES (progresión de mar-2026, RT de jun-2026): no se inventa el día; se marca
   hueco (△ ○) junto a la etiqueta del mes. Antes no salía y la leyenda daba a entender que estaban todas. */
const mesDe = (iso: string) => iso.slice(0, 7)
const progresionesMes = new Set(props.eventos.filter((e) => e.clase === 'progresion' && e.precision === 'mes').map((e) => mesDe(e.desde)))
const rtMes = new Set(props.lineas.filter((l) => l.id.toUpperCase().startsWith('RT') && /^\d{4}-\d{2}$/.test(l.inicio)).map((l) => l.inicio))
const tacs = new Set(props.tacs)
/* por fecha: cuántos valores ▲ y ▼ trae la analítica de ese día (solo lo que el informe marca) */
const labs = (() => {
  const m = new Map<string, { alto: number; bajo: number; n: number }>()
  for (const g of Object.values(props.grupos)) for (const a of g.analitos) for (const p of a.puntos) {
    const r = m.get(p.f) ?? { alto: 0, bajo: 0, n: 0 }
    r.n++; if (p.fuera === 'alto') r.alto++; else if (p.fuera === 'bajo') r.bajo++
    m.set(p.f, r)
  }
  return m
})()

interface Dia { t: number; iso: string; estado: Estado; linea: string | null; rt: boolean; prog: boolean; tac: boolean; lab: { alto: number; bajo: number; n: number } | null }
const dias = computed(() => {
  const out: Dia[] = []
  for (let t = ini; t <= fin; t += DIA) {
    const iso = new Date(t).toISOString().slice(0, 10)
    let estado: Estado = 'sin'
    let linea: string | null = null
    let rt = false
    for (const s of tramos) {
      const dentroSeguro = t >= s.a[1] && t <= (s.z ? s.z[0] : Infinity)
      const dentroPosible = t >= s.a[0] && t <= (s.z ? s.z[1] : Infinity)
      // radioterapia: solo con fecha de día; una RT sabida «en junio» pintaría 30 días de más
      if (s.rt) { if (s.a[0] === s.a[1] && dentroPosible) rt = true; continue }
      if (dentroSeguro) { estado = 'trat'; linea = s.id }
      else if (dentroPosible && estado !== 'trat') { estado = 'incierto'; linea = s.id }
    }
    out.push({ t, iso, estado, linea, rt, prog: progresiones.has(iso), tac: tacs.has(iso), lab: labs.get(iso) ?? null })
  }
  return out
})
/* largo de un trazo: LINEAL en el número de valores fuera, de 3 px (1 valor) al alto de su pista
   (el máximo real del caso), sin tope que empate 9 con 10 (diseno midió el empate con el cap anterior) */
const maxFuera = computed(() => dias.value.reduce((m, d) => (d.lab ? { alto: Math.max(m.alto, d.lab.alto), bajo: Math.max(m.bajo, d.lab.bajo) } : m), { alto: 1, bajo: 1 }))
const largo = (n: number, max: number, pista: number) => 3 + (pista - 3) * ((n - 1) / Math.max(1, max - 1))
const cuenta = computed(() => ({
  total: dias.value.length,
  trat: dias.value.filter((d) => d.estado === 'trat').length,
  sin: dias.value.filter((d) => d.estado === 'sin').length,
  incierto: dias.value.filter((d) => d.estado === 'incierto').length,
  labs: dias.value.filter((d) => d.lab).length,
}))
/* estilo de banda por línea: por textura y opacidad, no solo por color (1L, 2L, 3L, 4L…) */
const ordenLineas = tramos.filter((s) => s.sistemica).map((s) => s.id)
/** primer día seguro de cada línea sistémica que cae desde el diagnóstico: ahí va su etiqueta */
const inicioLinea = tramos.filter((s) => s.sistemica).map((s) => [s.id, Math.max(ini, s.a[1])] as [string, number]).filter(([, t]) => t <= fin)
// un estilo por línea (sin módulo: con i % 3 la 4L se pintaría igual que la 1L)
const ESTILOS = ['solida', 'clara', 'rayada', 'contrarrayada'] as const
const estiloLinea = (id: string | null) => { const i = id ? ordenLineas.indexOf(id) : -1; return ESTILOS[Math.max(0, Math.min(ESTILOS.length - 1, i))]! }
const lineasLeyenda = computed(() => ordenLineas.filter((id) => { const s = tramos.find((x) => x.id === id); return s && s.a[1] <= fin }).map((id) => ({ id, e: estiloLinea(id) })))

const caja = ref<HTMLElement | null>(null)
const lienzo = ref<HTMLCanvasElement | null>(null)
const W = useAncho(caja)
const IZQ = 40
const FILA = 26
// pistas dentro de la fila: trazos ▲ crecen hacia arriba desde ARR; banda de BAN a BAN+6; ▼ hacia abajo desde ABA
const ARR = 11, BAN = 11, ABA = 17
const meses = computed(() => {
  const out: { a: number; m: number }[] = []
  const d0 = new Date(ini), d1 = new Date(fin)
  for (let a = d0.getUTCFullYear(), m = d0.getUTCMonth(); a < d1.getUTCFullYear() || (a === d1.getUTCFullYear() && m <= d1.getUTCMonth()); m++) {
    if (m > 11) { m = 0; a++ }
    out.push({ a, m })
  }
  return out
})
const celda = computed(() => Math.max(6, (W.value - IZQ) / 31))
const H = computed(() => meses.value.length * FILA + 4)
const filaDe = (t: number) => { const f = new Date(t), d0 = new Date(ini); return (f.getUTCFullYear() - d0.getUTCFullYear()) * 12 + f.getUTCMonth() - d0.getUTCMonth() }
const xDe = (t: number) => IZQ + (new Date(t).getUTCDate() - 1) * celda.value

let progreso = 1
let raf = 0
const sel = ref<Dia | null>(null)
function css(v: string) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() }
function pintar() {
  const cv = lienzo.value
  if (!cv) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = W.value, h = H.value, c = celda.value
  cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`
  const cx = cv.getContext('2d')!
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h)
  const tinta = css('--color-text'), violeta = css('--color-miriam'), suave = css('--color-text-soft'), fondo = css('--color-bg')
  const hasta = Math.floor(dias.value.length * progreso)
  cx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; cx.textBaseline = 'middle'
  meses.value.forEach(({ a, m }, fila) => {
    const y = fila * FILA + BAN + 3
    if (m === 0 || fila === 0) { cx.fillStyle = tinta; cx.fillText(String(a), 0, y) }
    else { cx.fillStyle = suave; cx.fillText(mesCorto(m, props.lang), 4, y) }
  })
  // rayado para la 3L: patrón de diagonales
  const rayas = (col: string) => {
    const p = document.createElement('canvas'); p.width = 4; p.height = 4
    const pc = p.getContext('2d')!; pc.strokeStyle = col; pc.lineWidth = 1.3
    pc.beginPath(); pc.moveTo(0, 4); pc.lineTo(4, 0); pc.moveTo(-1, 1); pc.lineTo(1, -1); pc.moveTo(3, 5); pc.lineTo(5, 3); pc.stroke()
    return cx.createPattern(p, 'repeat')!
  }
  const patRayas = rayas(violeta)
  // contrarrayada (4L): diagonales en la otra dirección
  const patContra = (() => {
    const p = document.createElement('canvas'); p.width = 4; p.height = 4
    const pc = p.getContext('2d')!; pc.strokeStyle = violeta; pc.lineWidth = 1.3
    pc.beginPath(); pc.moveTo(0, 0); pc.lineTo(4, 4); pc.moveTo(3, -1); pc.lineTo(5, 1); pc.moveTo(-1, 3); pc.lineTo(1, 5); pc.stroke()
    return cx.createPattern(p, 'repeat')!
  })()
  const vis = dias.value.slice(0, hasta)
  // progresión, DEBAJO de todo: raya fina que atraviesa la fila; su banderín va al final, encima y con halo.
  // Antes era una barra oscura encima y destrozaba el ◆ del TAC del mismo día (13-jul-2026, diseno)
  for (const d of vis) if (d.prog) { cx.fillStyle = tinta; cx.globalAlpha = 0.7; cx.fillRect(xDe(d.t) + c / 2 - 0.6, filaDe(d.t) * FILA + 2, 1.2, FILA - 3); cx.globalAlpha = 1 }
  // pista central por TRAMOS (días seguidos del mismo estado y línea en la misma fila): banda redondeada
  for (let i = 0; i < vis.length;) {
    const d = vis[i]!, fila = filaDe(d.t)
    let j = i
    while (j + 1 < vis.length && filaDe(vis[j + 1]!.t) === fila && vis[j + 1]!.estado === d.estado && vis[j + 1]!.linea === d.linea) j++
    const x0 = xDe(d.t), x1 = xDe(vis[j]!.t) + c, y = fila * FILA
    if (d.estado === 'trat') {
      const e = estiloLinea(d.linea)
      cx.globalAlpha = e === 'clara' ? 0.42 : 0.92; cx.fillStyle = e === 'rayada' ? patRayas : e === 'contrarrayada' ? patContra : violeta
      cx.beginPath(); cx.roundRect(x0 + 0.5, y + BAN, x1 - x0 - 1, 6, 3); cx.fill(); cx.globalAlpha = 1
      if (e === 'rayada' || e === 'contrarrayada') { cx.strokeStyle = violeta; cx.lineWidth = 1; cx.beginPath(); cx.roundRect(x0 + 1, y + BAN + 0.5, x1 - x0 - 2, 5, 2.5); cx.stroke() }
    } else if (d.estado === 'incierto') {
      cx.strokeStyle = violeta; cx.globalAlpha = 0.65; cx.lineWidth = 1; cx.setLineDash([2, 2])
      cx.beginPath(); cx.roundRect(x0 + 1, y + BAN + 0.5, x1 - x0 - 2, 5, 2.5); cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1
    } else { cx.fillStyle = tinta; cx.globalAlpha = 0.22; cx.fillRect(x0, y + BAN + 2.5, x1 - x0, 1); cx.globalAlpha = 1 }
    i = j + 1
  }
  const tw = Math.max(2.4, c * 0.38)
  for (const d of vis) {
    const y = filaDe(d.t) * FILA, x = xDe(d.t)
    // analítica: trazo ▲ hacia arriba y ▼ hacia abajo, largo según cuántos valores salen del rango
    if (d.lab) {
      const cxm = x + c / 2
      cx.fillStyle = tinta
      if (d.lab.alto) { const hA = largo(d.lab.alto, maxFuera.value.alto, ARR - 1); cx.beginPath(); cx.roundRect(cxm - tw / 2, y + ARR - hA - 0.5, tw, hA, tw / 2); cx.fill() }
      if (d.lab.bajo) { const hB = largo(d.lab.bajo, maxFuera.value.bajo, FILA - ABA - 1); cx.beginPath(); cx.roundRect(cxm - tw / 2, y + ABA + 0.5, tw, hB, tw / 2); cx.fill() }
      // analítica sin nada fuera: ANILLO hueco (no un punto relleno, que se confundía con «1 fuera»)
      if (!d.lab.alto && !d.lab.bajo) { cx.strokeStyle = tinta; cx.lineWidth = 1.1; cx.beginPath(); cx.arc(cxm, y + ARR - 3, 1.9, 0, 7); cx.stroke() }
    }
    if (d.rt) { cx.fillStyle = tinta; cx.beginPath(); cx.arc(x + c / 2, y + BAN + 3, 2.4, 0, 7); cx.fill() }
    if (d.tac) { // ■ con halo de fondo (no ◆: en el resto de la página ◆ es «marcado en el informe»)
      const mx = x + c / 2, my = y + BAN + 3
      cx.beginPath(); cx.rect(mx - 3.8, my - 3.8, 7.6, 7.6)
      cx.fillStyle = tinta; cx.fill(); cx.lineWidth = 1.2; cx.strokeStyle = fondo; cx.stroke()
    }
    if (d.prog) { // banderín en lo alto de la raya de la progresión, con halo (la raya ya está debajo)
      banderin(cx, x + c / 2, y + 1, 7); cx.lineWidth = 2; cx.strokeStyle = fondo; cx.stroke(); cx.fillStyle = tinta; cx.fill()
    }
  }
  // etiqueta de cada línea donde empieza, DESPUÉS de los trazos y con halo: antes un trazo tapaba «2L»
  cx.font = '700 9px "JetBrains Mono", ui-monospace, monospace'; cx.textBaseline = 'alphabetic'
  for (const [id, t] of inicioLinea) {
    if (t > (vis[vis.length - 1]?.t ?? -1)) continue
    const x = xDe(t) + 1, y = filaDe(t) * FILA + ARR - 2
    cx.lineWidth = 3; cx.strokeStyle = fondo; cx.strokeText(id, x, y); cx.fillStyle = violeta; cx.fillText(id, x, y)
  }
  // lo sabido solo por mes: hueco junto a la etiqueta del mes (banderín hueco = progresión, círculo discontinuo = RT)
  meses.value.forEach(({ a, m }, fila) => {
    const clave = `${a}-${String(m + 1).padStart(2, '0')}`
    if (!vis.length || Date.UTC(a, m, 1) > vis[vis.length - 1]!.t) return
    const y = fila * FILA + BAN + 3
    cx.strokeStyle = tinta; cx.fillStyle = tinta; cx.lineWidth = 1.3
    if (progresionesMes.has(clave)) { cx.fillRect(28.4, y - 6, 1.3, 12); banderin(cx, 29, y - 6, 7); cx.stroke() }
    // RT sabida por mes: círculo DISCONTINUO (el anillo liso ya es «analítica sin nada fuera»)
    if (rtMes.has(clave)) { cx.setLineDash([1.6, 1.4]); cx.beginPath(); cx.arc(progresionesMes.has(clave) ? 22 : 31, y, 3, 0, 7); cx.stroke(); cx.setLineDash([]) }
  })
  if (sel.value) { // día elegido: marco
    const x = xDe(sel.value.t), y = filaDe(sel.value.t) * FILA
    cx.strokeStyle = violeta; cx.lineWidth = 1.5; cx.strokeRect(x - 1, y + 0.5, c + 2, FILA - 1.5)
  }
}
/** banderín de la progresión (en todo el panel: ▲▼ quedan para «fuera de rango»): triángulo que
    sale a la derecha desde lo alto de la raya; el octágono se probó y a este tamaño parecía un círculo */
function banderin(cx: CanvasRenderingContext2D, x: number, yTop: number, alto: number) {
  cx.beginPath(); cx.moveTo(x + 0.6, yTop); cx.lineTo(x + alto * 0.9, yTop + alto / 2); cx.lineTo(x + 0.6, yTop + alto); cx.closePath()
}
function llenar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.visibilityState === 'hidden') { progreso = 1; pintar(); return }
  const t0 = performance.now()
  const paso = (t: number) => {
    progreso = Math.min(1, Math.max(0, (t - t0) / 2600))
    pintar()
    if (progreso < 1) raf = requestAnimationFrame(paso)
  }
  raf = requestAnimationFrame(paso)
}
const { armado, visto } = useAlVer(caja, 0.2)
watch(armado, (a) => { if (a && !visto.value) { progreso = 0; pintar() } })
watch(visto, (v) => { if (v) llenar() })
onMounted(() => pintar())
watch([W, () => props.lang, sel], () => pintar())
onBeforeUnmount(() => cancelAnimationFrame(raf))

/* tocar (o arrastrar) lee un día; el teclado recorre los días con analítica, TAC o progresión */
function diaEn(ev: PointerEvent) {
  const r = lienzo.value!.getBoundingClientRect()
  const px = ev.clientX - r.left, py = ev.clientY - r.top
  const fila = Math.floor(py / FILA), col = Math.floor((px - IZQ) / celda.value)
  const mm = meses.value[fila]
  if (!mm || col < 0 || col > 30) return null
  const t = Date.UTC(mm.a, mm.m, col + 1)
  if (new Date(t).getUTCMonth() !== mm.m || t < ini || t > fin) return null
  return dias.value[Math.round((t - ini) / DIA)] ?? null
}
let arrastrando = false
function tocar(ev: PointerEvent) { const d = diaEn(ev); if (d) sel.value = d }
function empezar(ev: PointerEvent) { arrastrando = true; (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId); tocar(ev) }
function mover(ev: PointerEvent) { if (arrastrando) tocar(ev) }
function soltar() { arrastrando = false }
const hitos = computed(() => dias.value.filter((d) => d.lab || d.tac || d.prog))
function tecla(ev: KeyboardEvent) {
  const hs = hitos.value; if (!hs.length) return
  const t = sel.value?.t
  const sig = t == null ? 0 : hs.findIndex((d) => d.t > t)
  const ant = t == null ? hs.length : hs.filter((d) => d.t < t).length
  let i: number
  if (ev.key === 'ArrowRight') i = sig < 0 ? hs.length - 1 : sig
  else if (ev.key === 'ArrowLeft') i = Math.max(0, ant - 1)
  else if (ev.key === 'Home') i = 0
  else if (ev.key === 'End') i = hs.length - 1
  else if (ev.key === 'Escape') { sel.value = null; return }
  else return
  ev.preventDefault(); sel.value = hs[i]!
}
const lectura = computed(() => {
  const d = sel.value; if (!d) return ''
  const partes = [fechaCorta(d.iso, props.lang)]
  partes.push(d.estado === 'trat' ? L(`en la ${d.linea}`, `on ${d.linea}`) : d.estado === 'incierto' ? L(`${d.linea}, fecha aproximada`, `${d.linea}, approximate date`) : L('sin línea en curso', 'no line running'))
  if (d.lab) { const pl = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
    partes.push(L(`analítica: ${pl(d.lab.alto, 'alto', 'altos')} · ${pl(d.lab.bajo, 'bajo', 'bajos')} de ${pl(d.lab.n, 'valor', 'valores')}`, `lab report: ${d.lab.alto} high · ${d.lab.bajo} low of ${pl(d.lab.n, 'value', 'values')}`)) }
  if (d.tac) partes.push(L('TAC con RECIST ■', 'CT with RECIST ■'))
  if (d.prog) partes.push(L('progresión', 'progression'))
  if (d.rt) partes.push(L('radioterapia', 'radiotherapy'))
  return partes.join(' · ')
})
/* para el lector de pantalla: los días SUMAN el total (los aproximados, solo si los hay); las analíticas, aparte;
   y lo sabido solo por mes, que no es un día y por eso el teclado no llega a ello */
// mes entero (el lector de pantalla leería «mar» como palabra)
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const mesLargo = (clave: string) => { const [a, m] = clave.split('-').map(Number); return props.lang === 'en' ? `${MESES_EN[m! - 1]} ${a}` : `${MESES_ES[m! - 1]} de ${a}` }
const soloMes = computed(() => {
  const ps = [...progresionesMes].filter((k) => Date.UTC(+k.slice(0, 4), +k.slice(5) - 1, 1) <= fin).map((k) => L(`una progresión en ${mesLargo(k)}`, `a progression in ${mesLargo(k)}`))
  const rs = [...rtMes].filter((k) => Date.UTC(+k.slice(0, 4), +k.slice(5) - 1, 1) <= fin).map((k) => L(`radioterapia en ${mesLargo(k)}`, `radiotherapy in ${mesLargo(k)}`))
  const t = [...ps, ...rs]
  return t.length ? L(` Además, ${t.join(' y ')}, sin día exacto.`, ` Also ${t.join(' and ')}, with no exact day.`) : ''
})
const etiquetaLector = computed(() => {
  const k = cuenta.value, inc = k.incierto ? L(`, ${k.incierto} con fecha aproximada`, `, ${k.incierto} with an approximate date`) : ''
  return L(`${k.total} días desde el diagnóstico: ${k.trat} en una línea de tratamiento, ${k.sin} sin línea en curso${inc}. ${k.labs} analíticas.${soloMes.value} Usa las flechas para recorrer analíticas, TAC y progresiones.`,
    `${k.total} days since diagnosis: ${k.trat} on a treatment line, ${k.sin} with no line running${inc}. ${k.labs} lab reports.${soloMes.value} Arrow keys move through lab reports, CT scans and progressions.`)
})
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, props.lang === 'en' ? ',' : '.')
</script>

<template>
  <figure class="dias">
    <p class="dias__cifra"><span class="nums">{{ miles(cuenta.total) }}</span> {{ L('días', 'days') }}</p>
    <p class="dias__sub nums">
      {{ L(`${miles(cuenta.trat)} en una línea de tratamiento · ${miles(cuenta.sin)} sin línea en curso`, `${miles(cuenta.trat)} on a treatment line · ${miles(cuenta.sin)} with no line running`) }}<template v-if="cuenta.incierto"> · {{ L(`${cuenta.incierto} con fecha aproximada`, `${cuenta.incierto} with an approximate date`) }}</template> · {{ L(`${cuenta.labs} analíticas`, `${cuenta.labs} lab reports`) }}
    </p>
    <div ref="caja">
      <canvas ref="lienzo" class="dias__lienzo" role="slider" tabindex="0"
              :aria-label="etiquetaLector"
              :aria-valuemin="0" :aria-valuemax="Math.max(0, hitos.length - 1)"
              :aria-valuenow="sel ? Math.max(0, hitos.findIndex((d) => d.t === sel!.t)) : undefined" :aria-valuetext="lectura || undefined"
              @pointerdown="empezar" @pointermove="mover" @pointerup="soltar" @pointercancel="soltar" @keydown="tecla" />
    </div>
    <p class="dias__lee nums" aria-live="polite">
      <template v-if="sel">{{ lectura }}<button v-if="sel.lab" type="button" class="dias__ir" @click="emit('fecha', sel.iso)">{{ L('ver esa analítica', 'see that lab report') }} →</button></template>
      <template v-else>{{ L('Elige un día para leerlo.', 'Pick a day to read it.') }}</template>
    </p>
    <p class="dias__ley">
      <span v-for="x in lineasLeyenda" :key="x.id"><i class="dias__c" :class="`dias__c--${x.e}`" />{{ x.id }}</span>
      <span><i class="dias__c dias__c--sin" />{{ L('sin línea', 'no line') }}</span>
      <span><i class="dias__c dias__c--inc" />{{ L('fecha aproximada', 'approximate date') }}</span>
      <span><i class="dias__t" />{{ L('analítica: trazo hacia arriba, valores por encima del rango; hacia abajo, por debajo. Más largo, más valores', 'lab report: stroke up, values above range; down, below range. Longer means more values') }}</span>
      <span><i class="dias__o" />{{ L('analítica sin nada fuera de rango', 'lab report, all in range') }}</span>
      <span>■ {{ L('TAC con RECIST', 'CT with RECIST') }}</span>
      <span><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path :d="pathForma('banderin', 4, 6, 4)" class="dias__svg-lleno" /></svg>{{ L('progresión', 'progression') }}</span>
      <span>● {{ L('radioterapia', 'radiotherapy') }}</span>
      <span v-if="progresionesMes.size || rtMes.size"><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path :d="pathForma('banderin', 4, 6, 4)" class="dias__svg-hueco" /></svg> <i class="dias__rtmes" /> {{ L('junto al mes: progresión o radioterapia de la que solo se sabe el mes', 'next to the month: progression or radiotherapy known only by month') }}</span>
    </p>
  </figure>
</template>

<style scoped>
.dias { margin: 0; }
.dias__cifra { font: var(--tipo-cifra); font-size: clamp(22px, 6vw, 32px); letter-spacing: var(--track-cifra); margin: 0; color: var(--color-text); }
.dias__cifra .nums { color: var(--color-miriam); }
.dias__sub { font: 500 13px/1.4 var(--font-body); color: var(--color-text-soft); margin: 4px 0 12px; }
.dias__lienzo { display: block; touch-action: pan-y; cursor: crosshair; }
.dias__lienzo:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; border-radius: 4px; }
.dias__lee { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; min-height: 44px; margin: 6px 0 0; font: 500 12.5px/1.4 var(--font-mono); color: var(--color-text); }
.dias__ir { font: 700 13px var(--font-body); color: var(--color-miriam); min-height: 44px; }
.dias__ir:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dias__ley { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 6px 0 0; font: 400 12px var(--font-body); color: var(--color-text-soft); }
.dias__ley span { display: inline-flex; align-items: center; gap: 5px; }
.dias__c { width: 16px; height: 6px; border-radius: 3px; display: inline-block; }
.dias__c--solida { background: rgb(var(--color-miriam-rgb) / 0.9); }
.dias__c--clara { background: rgb(var(--color-miriam-rgb) / 0.45); }
.dias__c--contrarrayada { background: repeating-linear-gradient(45deg, var(--color-miriam) 0 1.3px, transparent 1.3px 3px); box-shadow: inset 0 0 0 1px var(--color-miriam); }
.dias__c--rayada { background: repeating-linear-gradient(-45deg, var(--color-miriam) 0 1.3px, transparent 1.3px 3px); box-shadow: inset 0 0 0 1px var(--color-miriam); }
.dias__c--sin { height: 1px; background: rgb(var(--color-text-rgb) / 0.35); }
.dias__c--inc { border: 1px dashed rgb(var(--color-miriam-rgb) / 0.65); }
.dias__svg-lleno { fill: var(--color-text); }
.dias__svg-hueco { fill: none; stroke: var(--color-text); stroke-width: 1.3; }
.dias__rtmes { width: 8px; height: 8px; border: 1.2px dashed var(--color-text); border-radius: 50%; display: inline-block; }
.dias__o { width: 6px; height: 6px; border: 1.2px solid var(--color-text); border-radius: 50%; display: inline-block; }
.dias__t { width: 3px; height: 10px; border-radius: 2px; background: var(--color-text); display: inline-block; }
</style>
