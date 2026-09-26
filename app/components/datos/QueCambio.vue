<script setup lang="ts">
/**
 * QueCambio — qué cambió entre las dos últimas analíticas, en una hoja que sube desde abajo.
 *
 * Móvil primero: un resumen en «Hoy» (las tres pruebas que más cambiaron) abre una hoja con
 * TODAS las pruebas que tienen valor en las dos fechas, ordenadas por el tamaño del cambio en
 * proporción. Cada fila es una flecha sobre un eje común: veces el límite superior de SU propio
 * informe (los dos informes no traen los mismos rangos), escala log, banda gris = rango normal.
 * Hueco = la anterior, relleno = la última; ▲▼ fuera de rango, ◆ marcado sin salirse. Al abrir,
 * el trazo se dibuja de la anterior a la última y el marcador viaja con él: el movimiento es el cambio.
 * Sin contadores ni tono de celebración: sube o baja, cuánto, y su fuente.
 */
import type { Analito, Cambio, Lang, Punto } from '~/utils/datosCaso'
// importación explícita: las constantes nuevas de datosCaso no llegaban por auto-import (500 en el prerender)
import { RCV, RCV_FUENTE, rcvComparable, unidadTxt } from '~/utils/datosCaso'

const props = defineProps<{
  grupos: Record<string, { analitos: Analito[] }>
  /** nombre corto por clave, en el idioma de la página */
  nombres: Record<string, string>
  /** lo que pasó entre las dos analíticas, cada cosa con su sello */
  entre: { txt: string; sello?: string }[]
  /** nota pegada a una prueba (p. ej. la transfusión junto a la hemoglobina) */
  notas: Record<string, { txt: string; sello?: string }>
  /** claves que tienen gráfico en «Evolución»: la fila lleva hasta él */
  conGrafico: string[]
  lang: Lang
}>()
const emit = defineEmits<{ ir: [key: string, fecha: string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const par = computed(() => dosUltimas(props.grupos))
const cambios = computed<Cambio[]>(() => (par.value ? cambiosEntre(props.grupos, par.value[0], par.value[1]) : []))
const nombre = (a: Analito) => props.nombres[a.key] ?? a.nombre
const fc = (f: string) => fechaCorta(f, props.lang).replace(/,? \d{4}$/, '') // «8 sep» / «Sep 8», sin año

/* texto de cada fila: «100 → 59 U/L», «−41 %», «3,3× → 1,7×» */
const n = (v: number) => numCaso(v, props.lang)
const r1 = (v: number) => numCaso(Math.round(v * 10) / 10, props.lang)
const pct = (c: Cambio) => {
  if (c.razon == null) return ''
  const p = Math.round((c.razon - 1) * 100)
  const pc = props.lang === 'en' ? '%' : ' %'
  return p === 0 ? L('sin cambio', 'no change') : `${p > 0 ? '+' : '−'}${Math.abs(p)}${pc}`
}
const dir = (c: Cambio) => (c.ahora.v > c.antes.v ? 'sube' : c.ahora.v < c.antes.v ? 'baja' : 'igual')
const DIR: Record<string, [string, string, string]> = { sube: ['↑', 'sube', 'up'], baja: ['↓', 'baja', 'down'], igual: ['=', 'igual', 'same'] }
const estado = (p: Punto) => (p.fuera === 'alto' ? L('por encima del rango', 'above range') : p.fuera === 'bajo' ? L('por debajo del rango', 'below range') : p.fuera ? L('marcado en el informe', 'flagged on report') : L('dentro del rango', 'within range'))
const forma = (p: Punto) => (p.fuera === 'alto' ? '▲' : p.fuera === 'bajo' ? '▼' : p.fuera ? '◆' : '')
// «baja un 60 %», no «baja −60 %»: el lector de pantalla diría la dirección dos veces (voz-miriam)
const cuanto = (c: Cambio) => (c.razon == null ? '' : dir(c) === 'igual' ? L('sin cambio', 'no change') : `${L(DIR[dir(c)]![1], DIR[dir(c)]![2])} ${L('un ', '')}${pct(c).replace(/^[+−]/, '')}`)
const lectura = (c: Cambio) => `${nombre(c.a)}: ${L('de', 'from')} ${n(c.antes.v)} ${L('a', 'to')} ${n(c.ahora.v)} ${unidadTxt(c.a.unidad)}, ${cuanto(c)}. ${fc(c.antes.f)}: ${estado(c.antes)}; ${fc(c.ahora.f)}: ${estado(c.ahora)}.`

/* eje común en ×LSN (log): mismo sitio = misma distancia al límite, sea cual sea la prueba */
const caja = ref<HTMLElement | null>(null)
const W = useAncho(caja, 320)
const X0 = 8
// UN eje para todas las filas (no zoom por fila): así el largo del trazo es el tamaño del cambio y
// coincide con el orden; con zoom por fila, CA 15-3 (+1 %) se vería como ALT (−60 %). Lo discutió `diseno`.
const dominio = computed(() => {
  const vs = cambios.value.flatMap((c) => c.lsn ?? [])
  return { min: Math.min(0.25, ...vs) * 0.85, max: Math.max(2, ...vs) * 1.15 }
})
const hazEje = (ancho: number, x0 = X0) => {
  const { min, max } = dominio.value
  const X = logEscala(min, max, x0, ancho - 8)
  return { X, min, ticks: [0.25, 0.5, 1, 2, 5, 10, 20].filter((v) => v >= min && v <= max).map((v) => ({ v, x: X(v), txt: `${numCaso(v, props.lang)}×` })) }
}
const eje = computed(() => hazEje(W.value))
const HF = 26 // alto de la pista de cada fila
const Y = 13
const geo = (c: Cambio, e = eje.value) => {
  if (!c.lsn) return null
  const { X, min } = e
  const x0 = X(c.lsn[0]), x1 = X(c.lsn[1])
  // banda normal del informe MÁS reciente: de su límite inferior (en ×LSN) a 1×
  const lo = c.ahora.lo != null && c.ahora.hi ? c.ahora.lo / c.ahora.hi : 0
  const b0 = X(Math.max(min, lo)), b1 = X(1)
  const larga = Math.abs(x1 - x0) > 10
  // sin punta de flecha: chocaba con ▲▼ del valor nuevo; la dirección la dan hueco → relleno y ↑↓
  const s = Math.sign(x1 - x0)
  return { x0, x1, b0, b1, larga, d: `M${rc(x0 + s * 5)},${Y}L${rc(x1 - s * 5)},${Y}` }
}
const marca = (p: Punto, x: number, r = 5) =>
  p.fuera === 'alto' ? `M${rc(x - r)},${rc(Y + r * 0.8)}h${2 * r}l${-r},${rc(-r * 1.7)}Z`
    : p.fuera === 'bajo' ? `M${rc(x - r)},${rc(Y - r * 0.8)}h${2 * r}l${-r},${rc(r * 1.7)}Z`
      : p.fuera ? pathForma('rombo', x, Y, r * 0.85) : pathForma('circulo', x, Y, r * 0.8)

/* RCV: banda de «variación esperable» alrededor del valor ANTERIOR (solo marcadores con RCV publicado y
   solo si los dos informes son comparables); si no lo son, se dice por qué y no se pinta nada */
// la fuente, en el script: una constante usada SOLO en la plantilla llegaba undefined (auto-import) y rompía la hoja
const fuenteRcv = RCV_FUENTE
const rcvDe = (c: Cambio) => RCV[c.a.key] ?? null
const rcvGeo = (c: Cambio) => {
  const r = rcvDe(c); if (!r || !c.lsn || !rcvComparable(c.antes, c.ahora)) return null
  const X = eje.value.X, v = c.lsn[0]
  return { o0: X(v * (1 - r.max / 100)), o1: X(v * (1 + r.max / 100)), i0: X(v * (1 - r.min / 100)), i1: X(v * (1 + r.min / 100)) }
}
const pct1 = (c: Cambio) => { if (c.razon == null) return ''; const p = Math.round((c.razon - 1) * 1000) / 10; return `${p > 0 ? '+' : p < 0 ? '−' : '±'}${numCaso(Math.abs(p), props.lang)}${props.lang === 'en' ? '%' : ' %'}` }

/* resumen en «Hoy»: las tres primeras, cada una con su mini-pista en el MISMO eje (se anima al verse) */
const top = computed(() => cambios.value.slice(0, 3))
const resCaja = ref<HTMLElement | null>(null)
const WR = useAncho(resCaja, 300)
const ejeRes = computed(() => hazEje(WR.value, 4))
const { armado: resArmado, visto: resVisto } = useAlVer(resCaja)

/* hoja: <dialog> nativo (foco atrapado, Esc, fondo inerte) con forma de hoja inferior */
const hoja = ref<HTMLDialogElement | null>(null)
const cierreBtn = ref<HTMLButtonElement | null>(null)
const abierta = ref(false)
const cerrando = ref(false)
const arrastre = ref(0)
let reservaCierre: ReturnType<typeof setTimeout> | undefined
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function abrir() {
  if (!hoja.value || hoja.value.open) return
  cerrando.value = false; arrastre.value = 0
  hoja.value.showModal()
  document.documentElement.classList.add('qc-bloqueo')
  abierta.value = true
  cierreBtn.value?.focus() // el foco, en «Cerrar» y no en el contenedor con scroll
}
function cerrar() {
  if (!hoja.value?.open || cerrando.value) return
  // el desbloqueo va aquí y no solo en @close: ese evento llega en otra tarea y, con la pestaña oculta, tarde
  const fin = () => { clearTimeout(reservaCierre); hoja.value?.close(); cerrando.value = false; arrastre.value = 0; alCerrar() }
  if (quieto()) { fin(); return }
  cerrando.value = true
  reservaCierre = setTimeout(fin, 240)
}
function alCerrar() { abierta.value = false; document.documentElement.classList.remove('qc-bloqueo') }
function cancelar(ev: Event) { ev.preventDefault(); cerrar() } // Esc: con la misma salida animada
function clicFondo(ev: MouseEvent) { if (ev.target === hoja.value) cerrar() } // el ::backdrop cuenta como el propio dialog
/* arrastrar el asa hacia abajo cierra (más de 90 px, o un tirón rápido) */
let y0 = 0, t0 = 0, tirando = false
function asaAbajo(ev: PointerEvent) { tirando = true; y0 = ev.clientY; t0 = performance.now(); (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId) }
function asaMueve(ev: PointerEvent) { if (tirando) arrastre.value = Math.max(0, ev.clientY - y0) }
function asaArriba(ev: PointerEvent) {
  if (!tirando) return
  tirando = false
  const dy = ev.clientY - y0, v = dy / Math.max(1, performance.now() - t0)
  if (dy > 90 || v > 0.6) cerrar(); else arrastre.value = 0
}
function ir(c: Cambio) { emit('ir', c.a.key, c.ahora.f); cerrar() }
onBeforeUnmount(() => { clearTimeout(reservaCierre); document.documentElement.classList.remove('qc-bloqueo') })
defineExpose({ abrir })
</script>

<template>
  <div v-if="par && cambios.length" class="qc">
    <button type="button" class="qc-res" aria-haspopup="dialog" @click="abrir">
      <span class="qc-res__cab">
        <span class="qc-res__t">{{ L('Qué cambió', 'What changed') }}</span>
        <span class="qc-res__f nums">{{ fc(par[0]) }} → {{ fc(par[1]) }}</span>
      </span>
      <span ref="resCaja" class="qc-res__filas" :class="{ 'qc-res--armado': resArmado, 'qc-res--visto': resVisto }">
        <span v-for="(c, i) in top" :key="c.a.key" class="qc-res__fila" :style="{ '--i': i }">
          <span class="qc-res__n">{{ nombre(c.a) }}</span>
          <span class="qc-res__v nums"><span class="qc-fila__forma">{{ forma(c.antes) }}</span>{{ n(c.antes.v) }} → <span class="qc-fila__forma">{{ forma(c.ahora) }}</span><strong>{{ n(c.ahora.v) }}</strong> <span class="qc-res__u">{{ unidadTxt(c.a.unidad) }}</span></span>
          <span class="qc-res__p nums"><span aria-hidden="true">{{ DIR[dir(c)]![0] }}</span> {{ pct(c) }}</span>
          <svg v-if="geo(c, ejeRes)" :viewBox="`0 0 ${WR} ${HF}`" :width="WR" :height="HF" class="qc-res__pista" aria-hidden="true">
            <rect :x="geo(c, ejeRes)!.b0" :y="Y - 6" :width="Math.max(2, geo(c, ejeRes)!.b1 - geo(c, ejeRes)!.b0)" height="12" rx="3" class="qc-banda" />
            <line :x1="ejeRes.X(1)" :x2="ejeRes.X(1)" :y1="Y - 9" :y2="Y + 9" class="qc-uno" />
            <path v-if="geo(c, ejeRes)!.larga" :d="geo(c, ejeRes)!.d" class="qc-flecha" pathLength="1" />
            <path :d="marca(c.antes, geo(c, ejeRes)!.x0)" class="qc-m qc-m--antes" />
            <path :d="marca(c.ahora, geo(c, ejeRes)!.x1)" class="qc-m qc-m--ahora" :style="{ '--dx': `${rc(geo(c, ejeRes)!.x0 - geo(c, ejeRes)!.x1)}px` }" />
          </svg>
        </span>
      </span>
      <span class="qc-res__mas">{{ L(`Las ${cambios.length} pruebas de las dos analíticas`, `All ${cambios.length} tests from both reports`) }} <span aria-hidden="true">↑</span></span>
    </button>

    <dialog ref="hoja" class="qc-hoja" :class="{ 'qc-hoja--cerrando': cerrando, 'qc-hoja--tirando': arrastre > 0 }"
            :style="arrastre ? { transform: `translateY(${arrastre}px)` } : undefined"
            aria-labelledby="qc-titulo" @cancel="cancelar" @close="alCerrar" @click="clicFondo">
      <div class="qc-hoja__dentro">
        <div class="qc-asa" aria-hidden="true" @pointerdown="asaAbajo" @pointermove="asaMueve" @pointerup="asaArriba" @pointercancel="asaArriba"><span /></div>
        <header class="qc-cab">
          <div>
            <h2 id="qc-titulo" class="qc-cab__t">{{ L('Qué cambió entre las dos últimas analíticas', 'What changed between the last two lab reports') }}</h2>
            <p class="qc-cab__f nums">{{ fechaCorta(par[0], lang) }} → {{ fechaCorta(par[1], lang) }}</p>
            <p class="qc-cab__s">{{ L('Todos los valores:', 'Every value:') }} <DatosSello s="extraido" :lang="lang" /></p>
          </div>
          <button ref="cierreBtn" type="button" class="qc-x" :aria-label="L('Cerrar', 'Close')" @click="cerrar"><Icon name="ph:x-bold" class="w-5 h-5" aria-hidden="true" /></button>
        </header>
        <p v-if="entre.length" class="qc-entre">
          <strong>{{ L('Entre las dos:', 'In between:') }}</strong>{{ ' ' }}
          <span v-for="(e, i) in entre" :key="i"> {{ e.txt }}<DatosSello v-if="e.sello" :s="e.sello" :lang="lang" class="ml-1" />{{ i < entre.length - 1 ? ' ·' : '' }}</span>
        </p>
        <div ref="caja" class="qc-leyenda">
          <p class="qc-leyenda__t">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path :d="pathForma('circulo', 7, 7, 4)" class="qc-m qc-m--antes" /></svg> {{ fc(par[0]) }}
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" class="ml-2"><path :d="pathForma('circulo', 7, 7, 4)" class="qc-m qc-m--ahora" /></svg> {{ fc(par[1]) }}
            · <span aria-hidden="true">▲▼</span> {{ L('fuera de rango', 'out of range') }} · <span aria-hidden="true">◆</span> {{ L('marcado en el informe', 'flagged on report') }}
          </p>
          <svg :viewBox="`0 0 ${W} 18`" :width="W" height="18" class="qc-regla" aria-hidden="true">
            <template v-for="t in eje.ticks" :key="t.v">
              <line :x1="t.x" :x2="t.x" y1="12" y2="18" :class="t.v === 1 ? 'qc-uno' : 'qc-rej'" />
              <text :x="t.x" y="9" text-anchor="middle" class="qc-tick">{{ t.txt }}</text>
            </template>
          </svg>
          <p class="qc-leyenda__eje">{{ L('Veces el límite superior de cada informe; en gris, su rango normal.', 'Multiples of each report’s upper limit; in gray, its normal range.') }}</p>
        </div>
        <ol class="qc-lista" :class="{ 'qc-lista--viva': abierta }">
          <li v-for="(c, i) in cambios" :key="c.a.key" class="qc-fila" :style="{ '--i': i }">
            <component :is="conGrafico.includes(c.a.key) ? 'button' : 'div'" :type="conGrafico.includes(c.a.key) ? 'button' : undefined"
                       class="qc-fila__caja" :aria-label="lectura(c) + (conGrafico.includes(c.a.key) ? ' ' + L('Ver su gráfico.', 'See its chart.') : '')"
                       @click="conGrafico.includes(c.a.key) && ir(c)">
              <span class="qc-fila__cab" aria-hidden="true">
                <span class="qc-fila__n">{{ nombre(c.a) }}</span>
                <span class="qc-fila__v nums">
                  <span class="qc-fila__forma">{{ forma(c.antes) }}</span>{{ n(c.antes.v) }}{{ c.antes.ref_de === 'banda' ? '*' : '' }} → <span class="qc-fila__forma">{{ forma(c.ahora) }}</span><strong>{{ n(c.ahora.v) }}</strong>{{ c.ahora.ref_de === 'banda' ? '*' : '' }}
                  <span class="qc-fila__u">{{ unidadTxt(c.a.unidad) }}</span>
                </span>
                <span class="qc-fila__p nums" :class="`qc-fila__p--${dir(c)}`">{{ DIR[dir(c)]![0] }} {{ pct(c) }}</span>
              </span>
              <svg v-if="geo(c)" :viewBox="`0 0 ${W} ${HF}`" :width="W" :height="HF" class="qc-pista" aria-hidden="true">
                <rect :x="geo(c)!.b0" :y="Y - 6" :width="Math.max(2, geo(c)!.b1 - geo(c)!.b0)" height="12" rx="3" class="qc-banda" />
                <template v-if="rcvGeo(c)">
                  <rect :x="rcvGeo(c)!.o0" :y="Y - 10" :width="rcvGeo(c)!.o1 - rcvGeo(c)!.o0" height="20" rx="4" class="qc-rcv" />
                  <rect :x="rcvGeo(c)!.i0" :y="Y - 10" :width="rcvGeo(c)!.i1 - rcvGeo(c)!.i0" height="20" rx="4" class="qc-rcv qc-rcv--in" />
                </template>
                <line :x1="eje.X(1)" :x2="eje.X(1)" :y1="Y - 9" :y2="Y + 9" class="qc-uno" />
                <path v-if="geo(c)!.larga" :d="geo(c)!.d" class="qc-flecha" pathLength="1" />
                <path :d="marca(c.antes, geo(c)!.x0)" class="qc-m qc-m--antes" />
                <path :d="marca(c.ahora, geo(c)!.x1)" class="qc-m qc-m--ahora" :style="{ '--dx': `${rc(geo(c)!.x0 - geo(c)!.x1)}px` }" />
              </svg>
              <span class="qc-fila__pie" aria-hidden="true">
                <span v-if="c.lsn" class="nums">{{ r1(c.lsn[0]) }}× → {{ r1(c.lsn[1]) }}×</span>
                <!-- ese límite no viene del informe: las veces el límite de ese valor son inferidas, no extraídas -->
                <span v-if="c.antes.ref_de === 'banda' || c.ahora.ref_de === 'banda'">{{ L('* ese informe no trae límite; usamos el habitual del laboratorio', '* that report prints no limit; we use the lab’s usual one') }} <DatosSello s="inferido" :lang="lang" /></span>
                <span v-if="conGrafico.includes(c.a.key)" class="qc-fila__ir">{{ L('su gráfico', 'its chart') }} →</span>
              </span>
            </component>
            <!-- «¿cambio real o ruido?»: hasta cuánto puede variar solo por laboratorio y biología (RCV: límite estadístico,
                 no clínico; verificacion 25-sep: «personas sanas» no lo dice la fuente y no va; el aviso es por «otra enfermedad de base»,
                 literal de la fuente; y se acota qué compara para que no se lea «no ha pasado nada», diseno) -->
            <p v-if="rcvDe(c) && rcvGeo(c)" class="qc-fila__rcv">
              <i class="qc-fila__rcv-m" aria-hidden="true" />{{ L(`Hasta un ${rcvDe(c)!.min}-${rcvDe(c)!.max} % de cambio puede deberse solo al laboratorio y a la biología (límite estadístico al 95 %, no clínico; si otra enfermedad de base eleva el marcador, puede ser mayor; ${fuenteRcv.es}). Este cambio: ${pct1(c)}. Esta franja compara solo este análisis con el anterior; no valora la enfermedad en conjunto.`, `Up to ${rcvDe(c)!.min}-${rcvDe(c)!.max}% change can come from the lab and biology alone (a 95% statistical limit, not a clinical one; it can be larger if another underlying disease raises the marker; ${fuenteRcv.en}). This change: ${pct1(c)}. This range compares only this test against the last one; it doesn’t assess the disease overall.`) }}
              <DatosSello s="verificado" :lang="lang" />
            </p>
            <p v-else-if="rcvDe(c)" class="qc-fila__rcv">{{ c.antes.ref_de === 'banda' || c.ahora.ref_de === 'banda'
              ? L(`Sin comparar con su límite de ${rcvDe(c)!.min}-${rcvDe(c)!.max} %: uno de los dos informes no imprime rango, así que no sabemos si es el mismo laboratorio o método.`, `Not compared with its ${rcvDe(c)!.min}-${rcvDe(c)!.max}% limit: one of the two reports prints no range, so we don’t know if it is the same lab or method.`)
              : L(`Sin comparar con su límite de ${rcvDe(c)!.min}-${rcvDe(c)!.max} %: los dos informes traen rangos distintos, puede ser otro laboratorio o método.`, `Not compared with its ${rcvDe(c)!.min}-${rcvDe(c)!.max}% limit: the two reports print different ranges, possibly another lab or method.`) }}</p>
            <p v-if="notas[c.a.key]" class="qc-fila__nota">{{ notas[c.a.key]!.txt }} <DatosSello v-if="notas[c.a.key]!.sello" :s="notas[c.a.key]!.sello!" :lang="lang" /></p>
          </li>
        </ol>
        <p class="qc-pie">{{ L('Solo las pruebas con valor en las dos fechas, ordenadas por cuánto cambiaron en proporción. El porcentaje sale de los dos valores; las veces el límite, de cada valor y el límite de su informe.',
                               'Only tests with a value on both dates, sorted by relative change, largest first. The percentage comes from the two values; the multiple of the limit, from each value and its own report’s limit.') }}</p>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.qc { grid-column: 1 / -1; }
/* resumen en «Hoy» */
.qc-res { display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: left; padding: 14px 16px; border-radius: 14px;
  background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); color: inherit;
  transition: transform var(--dur-micro) var(--curva-salida), border-color var(--dur-micro); }
.qc-res:hover { border-color: rgb(var(--color-text-rgb) / 0.22); }
.qc-res:active { transform: scale(0.985); }
.qc-res:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 3px; }
.qc-res__cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.qc-res__t { font: 600 12.5px/1.3 var(--font-body); color: var(--color-text-soft); }
.qc-res__f { font: 500 11px var(--font-mono); color: var(--color-text-soft); }
.qc-res__filas { display: grid; gap: 6px; }
.qc-res__fila { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 0 10px; align-items: baseline; }
.qc-res__n { font: 700 14px/1.25 var(--font-body); color: var(--color-text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qc-res__v { font: 500 12.5px var(--font-mono); color: var(--color-text-soft); white-space: nowrap; }
.qc-res__v strong { color: var(--color-text); }
.qc-res__u { font-size: 10.5px; }
.qc-res__p { font: 700 12.5px var(--font-mono); color: var(--color-text); min-width: 52px; text-align: right; }
.qc-res__pista { grid-column: 1 / -1; display: block; margin-top: -2px; overflow: visible; }
.qc-res__mas { font: 700 13px var(--font-body); color: var(--color-miriam); min-height: 28px; display: flex; align-items: center; gap: 4px; }

/* hoja inferior: en el móvil pegada abajo y a todo el ancho; en escritorio, centrada */
.qc-hoja { position: fixed; inset: auto 0 0 0; margin: 0 auto; width: 100%; max-width: 640px; max-height: 88dvh; padding: 0;
  border: 0; border-radius: 20px 20px 0 0; background: var(--color-bg); color: var(--color-text); overflow: hidden;
  box-shadow: 0 -12px 40px rgb(0 0 0 / 0.18); }
.qc-hoja[open] { display: flex; flex-direction: column; }
.qc-hoja::backdrop { background: rgb(0 0 0 / 0.42); }
@media (min-width: 700px) { .qc-hoja { inset: 0; margin: auto; border-radius: 20px; max-height: 84dvh; } }
.qc-hoja__dentro { overflow-y: auto; overscroll-behavior: contain; padding: 0 16px calc(16px + env(safe-area-inset-bottom)); }
@media (prefers-reduced-motion: no-preference) {
  .qc-hoja[open] { animation: qc-sube 380ms var(--curva-salida) both; }
  .qc-hoja[open]::backdrop { animation: qc-fondo 300ms ease-out both; }
  .qc-hoja--cerrando[open] { animation: qc-baja 230ms var(--curva-salida) both; }
  .qc-hoja--cerrando[open]::backdrop { animation: qc-fondo 230ms var(--curva-salida) reverse both; }
  .qc-hoja--tirando[open] { animation: none; transition: none; }
  @media (min-width: 700px) {
    .qc-hoja[open] { animation-name: qc-aparece; }
    .qc-hoja--cerrando[open] { animation-name: qc-desaparece; }
  }
}
@keyframes qc-sube { from { transform: translateY(100%); } }
@keyframes qc-baja { to { transform: translateY(100%); } }
@keyframes qc-aparece { from { opacity: 0; transform: translateY(24px) scale(0.98); } }
@keyframes qc-desaparece { to { opacity: 0; transform: translateY(24px) scale(0.98); } }
@keyframes qc-fondo { from { opacity: 0; } }
.qc-asa { position: sticky; top: 0; z-index: 2; display: flex; justify-content: center; padding: 10px 0 6px; margin: 0 -16px; background: var(--color-bg); touch-action: none; cursor: grab; }
.qc-asa span { width: 40px; height: 5px; border-radius: 999px; background: rgb(var(--color-text-rgb) / 0.25); }
@media (min-width: 700px) { .qc-asa { display: none; } }
.qc-cab { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-top: 4px; }
@media (min-width: 700px) { .qc-cab { padding-top: 18px; } }
.qc-cab__t { font: 700 18px/1.25 var(--font-display); color: var(--color-text); margin: 0; }
.qc-cab__f { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: 500 12px var(--font-mono); color: var(--color-text-soft); margin: 4px 0 0; }
.qc-cab__s { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: 400 12px var(--font-body); color: var(--color-text-soft); margin: 4px 0 0; }
.qc-x { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin: -6px -8px 0 0; border-radius: 999px; color: var(--color-text); }
.qc-x:hover { background: rgb(var(--color-text-rgb) / 0.06); }
.qc-x:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 1px; }
.qc-entre { font: 400 13px/1.5 var(--font-body); color: var(--color-text); margin: 10px 0 0; padding: 8px 10px; border-radius: 10px; background: rgb(var(--color-text-rgb) / 0.05); }
.qc-leyenda { position: sticky; top: 21px; z-index: 1; background: var(--color-bg); padding: 10px 0 4px; margin-top: 4px; border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.1); }
@media (min-width: 700px) { .qc-leyenda { top: 0; } }
.qc-leyenda__t { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; font: 500 11.5px var(--font-body); color: var(--color-text-soft); margin: 0 0 4px; }
.qc-leyenda__eje { font: 400 11px var(--font-body); color: var(--color-text-soft); margin: 2px 0 0; }
.qc-regla { display: block; }
.qc-tick { font: 500 10px var(--font-mono); fill: var(--color-text-soft); }
.qc-rej { stroke: var(--viz-rejilla); }
.qc-uno { stroke: var(--color-text); stroke-opacity: 0.55; stroke-width: 1.2; }
.qc-lista { list-style: none; margin: 0; padding: 0; }
.qc-fila { border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.07); }
.qc-fila__caja { display: block; width: 100%; text-align: left; padding: 10px 0 8px; color: inherit; border-radius: 8px; }
button.qc-fila__caja { cursor: pointer; }
button.qc-fila__caja:hover .qc-fila__ir { text-decoration: underline; }
.qc-fila__caja:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.qc-fila__cab { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 10px; align-items: baseline; }
.qc-fila__n { font: 700 14px/1.25 var(--font-body); color: var(--color-text); }
.qc-fila__p { font: 700 13px var(--font-mono); color: var(--color-text); text-align: right; grid-row: 1; grid-column: 2; }
.qc-fila__v { grid-column: 1 / -1; font: 500 12.5px var(--font-mono); color: var(--color-text-soft); }
.qc-fila__v strong { color: var(--color-text); }
.qc-fila__forma { color: var(--color-miriam); margin-right: 1px; }
.qc-fila__u { font-size: 11px; margin-left: 2px; }
.qc-pista { display: block; margin-top: 4px; overflow: visible; }
.qc-banda { fill: rgb(var(--color-text-rgb) / 0.1); }
.qc-flecha { fill: none; stroke: var(--color-text); stroke-width: 1.6; }
.qc-m { stroke-width: 1.5; }
.qc-m--antes { fill: var(--color-bg); stroke: var(--viz-div-2); }
.qc-m--ahora { fill: var(--color-miriam); stroke: var(--color-text); stroke-width: 0.8; }
.qc-fila__pie { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; font: 400 11.5px/1.4 var(--font-body); color: var(--color-text-soft); margin-top: 2px; }
.qc-fila__pie .nums { font: 500 11px var(--font-mono); }
.qc-fila__ir { margin-left: auto; font: 700 12px var(--font-body); color: var(--color-miriam); }
.qc-rcv { fill: var(--color-miriam); fill-opacity: 0.12; stroke: var(--color-miriam); stroke-opacity: 0.35; stroke-dasharray: 2 2; }
.qc-rcv--in { fill-opacity: 0.22; stroke: none; }
.qc-fila__rcv { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font: 400 12px/1.45 var(--font-body); color: var(--color-text); margin: -2px 0 8px; }
.qc-fila__rcv-m { width: 18px; height: 10px; border-radius: 3px; background: rgb(var(--color-miriam-rgb) / 0.2); border: 1px dashed rgb(var(--color-miriam-rgb) / 0.5); display: inline-block; }
.qc-fila__nota { font: 400 12px/1.4 var(--font-body); color: var(--color-text); margin: -2px 0 8px; }
.qc-pie { font: 400 11.5px/1.5 var(--font-body); color: var(--color-text-soft); margin: 12px 0 0; }
/* resumen: la primera vez que se ve, cada trazo va de la anterior a la última */
@media (prefers-reduced-motion: no-preference) {
  .qc-res--armado:not(.qc-res--visto) .qc-flecha { stroke-dasharray: 1; stroke-dashoffset: 1; }
  .qc-res--armado:not(.qc-res--visto) .qc-m--ahora { transform: translateX(var(--dx)); }
  .qc-res--visto .qc-flecha { stroke-dasharray: 1; animation: qc-traza 700ms var(--curva-salida) calc(200ms + var(--i) * 120ms) both; }
  .qc-res--visto .qc-m--ahora { animation: qc-viaja 700ms var(--curva-salida) calc(200ms + var(--i) * 120ms) both; }
}
/* al abrir: cada flecha se traza de la anterior a la última y el marcador viaja con ella, en cascada */
@media (prefers-reduced-motion: no-preference) {
  .qc-lista--viva .qc-flecha { stroke-dasharray: 1; animation: qc-traza 620ms var(--curva-salida) calc(260ms + var(--i) * 45ms) both; }
  .qc-lista--viva .qc-m--ahora { animation: qc-viaja 620ms var(--curva-salida) calc(260ms + var(--i) * 45ms) both; }
}
@keyframes qc-traza { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes qc-viaja { from { transform: translateX(var(--dx)); } }
</style>

<style>
/* con la hoja abierta, la página de detrás no se desplaza */
html.qc-bloqueo { overflow: hidden; }
</style>
