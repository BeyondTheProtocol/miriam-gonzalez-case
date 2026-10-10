<script setup lang="ts">
/**
 * Pelicula — «El caso en el tiempo» (en el código, «la película»): el recorrido del diagnóstico a hoy, a pantalla completa.
 *
 * Nace de una petición de Miriam (10-oct-2026: «que datos sea espectacular además de útil») tras
 * ver el anuncio de Claude Motion. De aquel vídeo se queda lo que explica: un reloj que avanza y
 * una etiqueta pegada a cada dato. Lo que no se copia (comité `diseno`): cámara que vuela, pausa
 * dramática sobre una progresión, cierre triunfal.
 *
 *  · <dialog> nativo: foco atrapado, Esc, fondo inerte. Atrás del navegador también cierra (la
 *    página lo abre con ?peli=1).
 *  · Se abre en pausa. Sin autoplay y sin sonido.
 *  · La barra es un <input type="range">: arrastre, teclado y lector de pantalla sin inventar nada.
 *  · Teclado: Espacio reproduce o pausa; ← → mueven una semana; RePág/AvPág cambian de capítulo;
 *    Inicio/Fin van a los extremos.
 *  · `window.__peli.seek('AAAA-MM-DD')` coloca el cabezal en un día: lo usan el test de cifras
 *    (scripts/test-cifras-datos.mjs) y la grabación del vídeo.
 */
import type { Analito, Contexto, Evento, Lang, Texto } from '~/utils/datosCaso'
import { DIA_MS } from '~/utils/datosCaso'
// import explícito: con solo el `import type` de este módulo, el auto-import no resolvía usePelicula en el build
import { usePelicula, type Capitulo } from '~/composables/usePelicula'

interface Linea { id: string; tratamiento: Texto; inicio: string; fin: string | null; motivo_fin?: Texto | null }
const props = defineProps<{
  abierta: boolean
  eventos: Evento[]
  lineas: Linea[]
  series: { a: Analito; modo: 'real' | 'lsn'; nombre: string }[]
  contexto: Contexto
  desde: number
  hasta: number
  diagnostico: string | null
  hoy: string
  /** fecha con la que abrir (enlace ?t=): ya validada como AAAA-MM-DD; aquí se acota al rango */
  t?: string | null
  sello: string
  lang: Lang
}>()
const emit = defineEmits<{ cerrar: []; ver: []; fecha: [iso: string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const hoyMs = msFecha(props.hoy)
const corto = (v: Texto) => txtCaso(v, props.lang).split(' (')[0]!
const capitulos = computed<Capitulo[]>(() => {
  const cs: Capitulo[] = []
  if (props.diagnostico) cs.push({ k: 'dx', t: msFecha(props.diagnostico), nombre: L('Diagnóstico', 'Diagnosis') })
  for (const l of props.lineas) {
    if (!/^\d+L$/i.test(l.id)) continue
    const i = rangoParcial(l.inicio)
    // solo líneas ya empezadas y con día exacto de inicio: un mes aproximado no marca un capítulo
    if (i && i[0] === i[1] && i[0] <= hoyMs) cs.push({ k: l.id, t: i[0], nombre: `${l.id} · ${corto(l.tratamiento)}` })
  }
  cs.push({ k: 'hoy', t: hoyMs, nombre: L('Hoy', 'Today') })
  return cs.filter((c) => c.t >= props.desde).sort((a, b) => a.t - b.t)
})
const peli = usePelicula({ desde: props.desde, fin: hoyMs, capitulos: () => capitulos.value })
const { cabezal, reproduciendo, velocidad, quieto, alFinal, capitulo } = peli

const iso = computed(() => new Date(cabezal.value).toISOString().slice(0, 10))
const capTxt = computed(() => (capitulo.value < 0 ? L('Antes del diagnóstico', 'Before diagnosis') : capitulos.value[capitulo.value]!.nombre))
const nDias = Math.round((hoyMs - props.desde) / DIA_MS)
const diaIdx = computed(() => Math.round((cabezal.value - props.desde) / DIA_MS))
const marcas = computed(() => capitulos.value.filter((c) => c.t > props.desde && c.t < hoyMs).map((c) => ({ k: c.k, pct: ((c.t - props.desde) / (hoyMs - props.desde)) * 100 })))

const dlg = ref<HTMLDialogElement | null>(null)
const play = ref<HTMLButtonElement | null>(null)
function alBarra(ev: Event) { peli.pausar(); peli.seek(props.desde + Number((ev.target as HTMLInputElement).value) * DIA_MS) }
function tecla(ev: KeyboardEvent) {
  const el = ev.target as HTMLElement
  const enBarra = el.tagName === 'INPUT'
  if (ev.key === ' ' && el.tagName !== 'BUTTON') { ev.preventDefault(); peli.reproducir() }
  else if (ev.key === 'PageDown') { ev.preventDefault(); peli.irCapitulo(1) }
  else if (ev.key === 'PageUp') { ev.preventDefault(); peli.irCapitulo(-1) }
  else if (enBarra && (ev.key === 'ArrowRight' || ev.key === 'ArrowUp')) { ev.preventDefault(); peli.pausar(); peli.seek(cabezal.value + 7 * DIA_MS) }
  else if (enBarra && (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown')) { ev.preventDefault(); peli.pausar(); peli.seek(cabezal.value - 7 * DIA_MS) }
}

function abrir() {
  if (!dlg.value || dlg.value.open) return
  peli.seek(props.t ? msFecha(props.t) : props.desde)
  dlg.value.showModal()
  document.documentElement.classList.add('pl-bloqueo')
  ;(window as any).__peli = {
    seek: (f: string | number) => { peli.pausar(); peli.seek(typeof f === 'number' ? f : msFecha(f)); return nextTick() },
    estado: () => ({ fecha: iso.value, capitulo: capTxt.value, reproduciendo: reproduciendo.value }),
    rango: () => ({ desde: new Date(props.desde).toISOString().slice(0, 10), hasta: props.hoy }),
  }
  nextTick(() => play.value?.focus())
}
function limpiar() {
  peli.pausar()
  document.documentElement.classList.remove('pl-bloqueo')
  delete (window as any).__peli
}
function cerrar() { if (dlg.value?.open) dlg.value.close(); limpiar() }
watch(() => props.abierta, (v) => (v ? nextTick(abrir) : cerrar()))
onMounted(() => { if (props.abierta) abrir() })
onBeforeUnmount(limpiar)
/* la fecha del enlace solo se actualiza con el cabezal parado: en reproducción no se toca la URL */
let aviso: ReturnType<typeof setTimeout> | undefined
watch([cabezal, reproduciendo], () => {
  clearTimeout(aviso)
  if (!props.abierta || reproduciendo.value) return
  aviso = setTimeout(() => emit('fecha', iso.value), 500)
})
onBeforeUnmount(() => clearTimeout(aviso))
</script>

<template>
  <dialog ref="dlg" class="pl" :aria-label="L('El caso en el tiempo', 'The case over time')"
          @cancel.prevent="emit('cerrar')" @keydown="tecla">
    <div v-if="abierta" class="pl__in">
      <header class="pl__cab">
        <h2 class="pl__tit">{{ L('El caso en el tiempo', 'The case over time') }}</h2>
        <button type="button" class="pl__ver" @click="emit('ver')">{{ L('Ver los datos', 'See the data') }} →</button>
        <button type="button" class="pl__x" :aria-label="L('Cerrar', 'Close')" @click="emit('cerrar')">
          <Icon name="ph:x-bold" class="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div class="pl__escena">
        <div class="pl__reloj-fila">
          <p class="pl__reloj nums" aria-live="off">{{ fechaCorta(iso, lang) }}</p>
          <p class="pl__cap" aria-live="polite">{{ capTxt }}</p>
        </div>
        <DatosLineaTiempo :eventos="eventos" :lineas="lineas" :desde="desde" :hasta="hasta" :hoy="hoy" :lang="lang" :cabezal="cabezal" />
        <DatosPeliSerie v-for="s in series" :key="s.a.key" :a="s.a" :nombre="s.nombre" :modo="s.modo"
                        :desde="desde" :hasta="hasta" :cabezal="cabezal" :contexto="contexto" :lang="lang" />
        <p class="pl__pie">
          {{ L('Analíticas hasta el', 'Labs up to') }} <span class="nums">{{ fechaCorta(hoy, lang) }}</span> <DatosSello :s="sello" :lang="lang" />
          · {{ L('▲▼ fuera del rango de su informe. En las series en ×, 1× es el límite superior normal de cada informe.', '▲▼ outside the report’s range. In the × series, 1× is each report’s upper limit of normal.') }}
        </p>
      </div>

      <footer class="pl__ctl">
        <div class="pl__barra-caja">
          <span v-for="m in marcas" :key="m.k" class="pl__marca" :style="{ left: `${m.pct}%` }" aria-hidden="true" />
          <input type="range" class="pl__barra" min="0" :max="nDias" step="1" :value="diaIdx"
                 :aria-label="L('Fecha mostrada', 'Date shown')" :aria-valuetext="`${fechaCorta(iso, lang)}, ${capTxt}`" @input="alBarra">
        </div>
        <div class="pl__botones">
          <button type="button" class="pl__paso" :aria-label="L('Etapa anterior', 'Previous stage')" :disabled="cabezal <= desde" @click="peli.irCapitulo(-1)">
            <Icon name="ph:skip-back-fill" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button v-if="!quieto" ref="play" type="button" class="pl__play" :aria-pressed="reproduciendo" @click="peli.reproducir()">
            <Icon :name="reproduciendo ? 'ph:pause-fill' : 'ph:play-fill'" class="w-5 h-5" aria-hidden="true" />
            {{ reproduciendo ? L('Pausa', 'Pause') : alFinal ? L('Otra vez', 'Again') : L('Reproducir', 'Play') }}
          </button>
          <button type="button" class="pl__paso" :class="{ 'pl__paso--ancho': quieto }" :aria-label="L('Etapa siguiente', 'Next stage')" :disabled="alFinal" @click="peli.irCapitulo(1)">
            <template v-if="quieto">{{ L('Siguiente', 'Next') }} </template><Icon name="ph:skip-forward-fill" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button v-if="!quieto" type="button" class="pl__vel nums" :aria-label="L(`Velocidad: ${velocidad}×. Cambiar`, `Speed: ${velocidad}×. Change`)" @click="peli.otraVelocidad()">
            {{ numCaso(velocidad, lang) }}×
          </button>
        </div>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.pl { width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0; padding: 0; border: 0;
  background: var(--color-bg); color: var(--color-text); overflow: hidden; }
.pl::backdrop { background: var(--color-bg); }
.pl__in { display: flex; flex-direction: column; height: 100%; max-width: 860px; margin: 0 auto;
  padding: env(safe-area-inset-top) max(16px, env(safe-area-inset-right)) env(safe-area-inset-bottom) max(16px, env(safe-area-inset-left)); }
.pl__cab { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; }
.pl__tit { font: 700 15px/1.2 var(--font-body); color: var(--color-text-soft); margin: 0 auto 0 0; }
.pl__x { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 999px;
  border: 1px solid rgb(var(--color-text-rgb) / 0.2); color: var(--color-text); }
.pl__escena { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-bottom: 8px; }
.pl__reloj-fila { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 14px; margin: 2px 0 8px; }
.pl__reloj { font: var(--tipo-cifra); font-size: clamp(30px, 9vw, 52px); letter-spacing: var(--track-cifra); color: var(--color-miriam); margin: 0; }
.pl__cap { font: 600 14px/1.3 var(--font-body); color: var(--color-text); margin: 0; }
.pl__pie { font: 400 12px/1.5 var(--font-body); color: var(--color-text-soft); margin: 8px 0 0; }
.pl__ctl { flex: none; padding: 6px 0 10px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.1); background: var(--color-bg); }
.pl__barra-caja { position: relative; height: 44px; display: flex; align-items: center; }
.pl__barra { width: 100%; height: 44px; margin: 0; accent-color: var(--color-miriam); touch-action: pan-y; cursor: pointer; }
.pl__marca { position: absolute; top: 9px; width: 2px; height: 8px; margin-left: -1px; background: var(--color-text); opacity: 0.45; pointer-events: none; }
.pl__botones { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.pl__play { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 20px; border-radius: 999px;
  background: var(--color-miriam); color: #fff; font: 700 15px var(--font-body); }
.pl__paso, .pl__vel { min-width: 44px; height: 44px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 999px; border: 1px solid rgb(var(--color-text-rgb) / 0.2); color: var(--color-text); font: 600 13.5px var(--font-body); }
.pl__paso--ancho { padding: 0 16px; }
.pl__paso:disabled { opacity: 0.35; }
.pl__ver { min-height: 44px; padding: 0 6px; font: 600 13.5px var(--font-body); color: var(--color-miriam); }
.pl__play, .pl__paso, .pl__vel, .pl__x { transition: transform var(--dur-micro) var(--curva-salida); }
.pl__play:active, .pl__paso:active, .pl__vel:active, .pl__x:active { transform: scale(0.96); }
.pl__play:focus-visible { outline: 2px solid var(--color-text); outline-offset: 2px; }
.pl__paso:focus-visible, .pl__vel:focus-visible, .pl__x:focus-visible, .pl__ver:focus-visible, .pl__barra:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) {
  .pl[open] { animation: pl-entra var(--dur-transicion) var(--curva-salida) both; }
  @keyframes pl-entra { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
}
@media (prefers-reduced-motion: reduce) { .pl__play, .pl__paso, .pl__vel, .pl__x { transition: none; } }
</style>

<style>
html.pl-bloqueo { overflow: hidden; }
</style>
