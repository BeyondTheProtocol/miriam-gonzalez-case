<script setup lang="ts">
/**
 * CelulaExplorarVistaForma: la forma 3D predicha (AlphaFold) de una proteína de «Genes de interés» sin salir de la lista
 * (Miriam, 21-oct-2026: «tiene que ser más intuitivo, que pases el ratón por encima y se vea»; el bloque plegado al
 * final del detalle quedaba a cinco pantallas en el móvil y no lo encontraba). Una sola por explorador; el visor es el
 * mismo del bloque, en su variante compacta (CelulaExplorarEstructura, `compacto`), y abajo «Ver la forma completa».
 *
 * Cómo se abre (decisión de Miriam con diseno, 21-oct):
 *  · ratón sobre «3D» 400 ms → flota junto al botón; se cierra 200 ms después de salir del botón y de ella. El puntero
 *    puede entrar en ella y Esc la cierra (WCAG 1.4.13). Solo con ratón (pointerType): el toque emula un mouseenter;
 *  · clic o Enter/Espacio en «3D» → se queda fija, con el foco dentro; Esc o ✕ la cierran y el foco vuelve al botón.
 *    No se abre al enfocar: recorrer las diez filas con Tab abriría diez (diseno);
 *  · toque, o pantalla estrecha → hoja inferior (<dialog> modal, el patrón de .qc-hoja en QueCambio, sin arrastre).
 * Capa superior (popover nativo o dialog) DENTRO de .exp: hereda data-tema, y ni el container-type de la lista ni el
 * scroll del panel la recortan (diseno). Nada se pide a AlphaFold hasta que se abre; el visor se desmonta al cerrar
 * y suelta su contexto WebGL (forceContextLoss en el visor).
 */
import { uniprotDe } from '~/utils/alphafold'
import { PROTEINA } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ lang: 'es' | 'en'; tema: 'claro' | 'oscuro' }>()
/** «Ver la forma completa»: el explorador abre el gen y despliega su bloque */
const emit = defineEmits<{ completa: [string] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

type Modo = 'flota' | 'fija' | 'hoja'
const abierta = ref<{ gen: string; uniprot: string; modo: Modo } | null>(null)
const proteina = computed(() => (abierta.value ? PROTEINA[abierta.value.gen] ?? abierta.value.gen : ''))
const flota = ref<HTMLElement | null>(null)
const hoja = ref<HTMLDialogElement | null>(null)
const cierreHoja = ref<HTMLButtonElement | null>(null)
const pos = ref({ top: 0, left: 0 })
let ancla: HTMLElement | null = null
let tAbre: ReturnType<typeof setTimeout> | undefined
let tCierra: ReturnType<typeof setTimeout> | undefined

const ESPERA_ABRE = 400, ESPERA_CAMBIA = 150, ESPERA_CIERRA = 200
const estrecho = () => window.matchMedia('(max-width: 639px), (hover: none), (pointer: coarse)').matches

/** ratón sobre «3D»: abre tras la espera; si ya hay una flotando, cambia antes. Una fija u hoja abierta manda. */
function entra(gen: string, el: HTMLElement) {
  clearTimeout(tCierra)
  const a = abierta.value
  if (a && a.modo !== 'flota') return
  if (a?.gen === gen) return
  clearTimeout(tAbre)
  tAbre = setTimeout(() => void muestra(gen, el, 'flota'), a ? ESPERA_CAMBIA : ESPERA_ABRE)
}
function sale() {
  clearTimeout(tAbre)
  if (abierta.value?.modo === 'flota') { clearTimeout(tCierra); tCierra = setTimeout(() => cierra(false), ESPERA_CIERRA) }
}
/** el puntero entró en la flotante: se queda */
function quedate() { clearTimeout(tCierra) }
/** clic, toque o tecla en «3D»: fija (o hoja). Otra pulsación sobre el mismo la cierra. */
function fija(gen: string, el: HTMLElement, tactil: boolean) {
  clearTimeout(tAbre); clearTimeout(tCierra)
  const modo: Modo = tactil || estrecho() ? 'hoja' : 'fija'
  const a = abierta.value
  if (a?.gen === gen && a.modo === modo) { cierra(true); return }
  void muestra(gen, el, modo)
}

async function muestra(gen: string, el: HTMLElement, modo: Modo) {
  const uniprot = uniprotDe(gen)
  if (!uniprot) return
  const antes = abierta.value
  // de flotante a hoja (o al revés) cambia el contenedor: se cierra el otro sin devolver el foco
  if (antes && (antes.modo === 'hoja') !== (modo === 'hoja')) cierra(false)
  ancla = el
  abierta.value = { gen, uniprot, modo }
  await nextTick()
  if (modo === 'hoja') {
    if (hoja.value && !hoja.value.open) hoja.value.showModal()
    cierreHoja.value?.focus()
    return
  }
  const f = flota.value
  if (!f) return
  if (!f.matches(':popover-open')) f.showPopover()
  coloca()
  if (modo === 'fija') f.focus({ preventScroll: true })
}

/** cierra; `foco`: devuelve el foco al «3D» que la abrió (no cuando se sale con el ratón, ni hacia «Ver la forma completa») */
function cierra(foco: boolean) {
  clearTimeout(tAbre); clearTimeout(tCierra)
  if (!abierta.value) return
  abierta.value = null
  if (flota.value?.matches(':popover-open')) flota.value.hidePopover()
  if (hoja.value?.open) hoja.value.close()
  if (foco && ancla?.isConnected) ancla.focus({ preventScroll: true })
}
function completa() {
  const g = abierta.value?.gen
  cierra(false)
  if (g) emit('completa', g)
}

/** a la izquierda del panel (sobre el mapa), a la altura del botón: junto al botón tapaba los nombres de las otras
 * proteínas de la lista (capturas del 21-oct). Si no cabe (panel a todo el ancho), debajo o encima. Siempre dentro. */
function coloca() {
  const f = flota.value
  if (!f || !ancla?.isConnected) return
  const r = ancla.getBoundingClientRect(), w = f.offsetWidth, h = f.offsetHeight, m = 8, sep = 12
  const borde = (ancla.closest('.exp__panel') ?? ancla).getBoundingClientRect().left
  const dentro = (v: number, max: number) => Math.max(m, Math.min(v, max - m))
  let left = borde - w - sep, top: number
  if (left >= m) top = dentro(r.top + r.height / 2 - h / 2, innerHeight - h)
  else {
    left = dentro(r.right - w, innerWidth - w)
    top = r.bottom + sep + h <= innerHeight - m ? r.bottom + sep : dentro(r.top - sep - h, innerHeight - h)
  }
  pos.value = { top: Math.round(top), left: Math.round(left) }
}
/** al cargar el modelo crece (leyenda, aviso): se recoloca */
let ro: ResizeObserver | null = null
/** al desplazar: la flotante sigue al botón; si el botón sale de la vista, se cierra */
function alDesplazar() {
  const a = abierta.value
  if (!a || a.modo === 'hoja' || !ancla) return
  const r = ancla.getBoundingClientRect()
  if (r.bottom < 0 || r.top > innerHeight) cierra(false)
  else coloca()
}

/** Esc (la flotante no es un dialog) y pulsar fuera de la fija la cierran */
function tecla(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !abierta.value || abierta.value.modo === 'hoja') return
  e.preventDefault()
  cierra(abierta.value.modo === 'fija' || !!flota.value?.contains(document.activeElement))
}
function pulsaFuera(e: PointerEvent) {
  const a = abierta.value
  if (!a || a.modo === 'hoja') return
  const t = e.target as Node
  if (flota.value?.contains(t) || ancla?.contains(t)) return
  cierra(false)
}
/** con Tab fuera de la fija se cierra (sin robar el foco a donde se fue) */
function focoFuera(e: FocusEvent) {
  const a = abierta.value, t = e.relatedTarget as Node | null
  if (a?.modo === 'fija' && t && !flota.value?.contains(t) && !ancla?.contains(t)) cierra(false)
}
/** hoja: Esc nativo, ✕ o el fondo */
function alCerrarHoja() { if (abierta.value?.modo === 'hoja') { const el = ancla; abierta.value = null; if (el?.isConnected) el.focus({ preventScroll: true }) } }
function clicFondo(e: MouseEvent) { if (e.target === hoja.value) cierra(true) }

onMounted(() => {
  if (flota.value) { ro = new ResizeObserver(() => { if (abierta.value && abierta.value.modo !== 'hoja') coloca() }); ro.observe(flota.value) }
  document.addEventListener('keydown', tecla)
  document.addEventListener('pointerdown', pulsaFuera, true)
  window.addEventListener('scroll', alDesplazar, { capture: true, passive: true })
  window.addEventListener('resize', alDesplazar, { passive: true })
})
onBeforeUnmount(() => {
  clearTimeout(tAbre); clearTimeout(tCierra); ro?.disconnect()
  document.removeEventListener('keydown', tecla)
  document.removeEventListener('pointerdown', pulsaFuera, true)
  window.removeEventListener('scroll', alDesplazar, { capture: true })
  window.removeEventListener('resize', alDesplazar)
})

/** lo que el explorador pregunta para pintar aria-expanded en cada «3D» */
const abiertaDe = computed(() => abierta.value?.gen ?? null)
defineExpose({ entra, sale, fija, cierra, abiertaDe })
const titulo = computed(() => L(`Forma 3D predicha de ${proteina.value}`, `Predicted 3D shape of ${proteina.value}`))
</script>

<template>
  <div class="pv">
    <!-- flotante (escritorio): popover manual, colocado junto al «3D» -->
    <div ref="flota" popover="manual" class="pv__flota" role="dialog" aria-labelledby="pv-titulo-flota" tabindex="-1"
         :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
         @pointerenter="quedate" @pointerleave="sale" @focusout="focoFuera">
      <template v-if="abierta && abierta.modo !== 'hoja'">
        <div class="pv__cab">
          <p id="pv-titulo-flota" class="pv__t">{{ titulo }}</p>
          <button type="button" class="pv__x" :aria-label="L('Cerrar', 'Close')" @click="cierra(true)">
            <svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" /></svg>
          </button>
        </div>
        <LazyCelulaExplorarEstructura :key="`pv-${abierta.uniprot}`" compacto :gen="abierta.gen" :uniprot="abierta.uniprot" :proteina="proteina" :lang="lang" :tema="tema" />
        <button type="button" class="pv__completa" @click="completa">{{ L('Ver la forma completa', 'See the full shape') }}</button>
      </template>
    </div>
    <!-- hoja inferior (táctil o estrecho): dialog modal; Esc, foco atrapado y fondo inerte, nativos -->
    <dialog ref="hoja" class="pv__hoja" aria-labelledby="pv-titulo-hoja" @close="alCerrarHoja" @click="clicFondo">
      <div v-if="abierta && abierta.modo === 'hoja'" class="pv__dentro">
        <div class="pv__cab">
          <h2 id="pv-titulo-hoja" class="pv__t">{{ titulo }}</h2>
          <button ref="cierreHoja" type="button" class="pv__x" :aria-label="L('Cerrar', 'Close')" @click="cierra(true)">
            <svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" /></svg>
          </button>
        </div>
        <LazyCelulaExplorarEstructura :key="`pv-${abierta.uniprot}`" compacto :gen="abierta.gen" :uniprot="abierta.uniprot" :proteina="proteina" :lang="lang" :tema="tema" />
        <button type="button" class="pv__completa" @click="completa">{{ L('Ver la forma completa', 'See the full shape') }}</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
/* la flotante: capa superior, colocada a mano (inset y margin del popover, fuera) */
.pv__flota {
  position: fixed; inset: auto; margin: 0; width: min(340px, calc(100vw - 16px)); max-height: calc(100dvh - 16px); overflow-y: auto;
  padding: var(--sp-12); border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn);
  background: var(--fondo); color: var(--texto-1); box-shadow: var(--sombra-flotante); --pv-alto: 200px;
}
.pv__flota:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
/* entra desde 0,97 y transparente, con la curva de salida (vara movimiento-movil); con movimiento reducido, solo opacidad */
@media (prefers-reduced-motion: no-preference) {
  .pv__flota:popover-open { animation: pv-aparece var(--dur-transicion) var(--curva-salida) both; }
}
@media (prefers-reduced-motion: reduce) {
  .pv__flota:popover-open { animation: pv-funde var(--dur-micro) linear both; }
}
@keyframes pv-aparece { from { opacity: 0; transform: scale(0.97); } }
@keyframes pv-funde { from { opacity: 0; } }
.pv__cab { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--sp-8); margin-bottom: var(--sp-8); }
.pv__t { margin: 0; padding-top: var(--sp-8); font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.pv__x {
  display: inline-grid; place-items: center; flex: none; width: 44px; height: 44px; margin: calc(-1 * var(--sp-4)) calc(-1 * var(--sp-8)) 0 0;
  padding: 0; border: 0; border-radius: 9999px; background: transparent; color: var(--texto-1); cursor: pointer;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.pv__x svg { width: 18px; height: 18px; }
@media (hover: hover) and (pointer: fine) { .pv__x:hover { background: var(--superficie); } }
.pv__x:focus-visible, .pv__completa:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.pv__completa {
  display: flex; align-items: center; justify-content: center; width: 100%; min-height: 44px; margin-top: var(--sp-12);
  border: 1px solid var(--trazo-interactivo); border-radius: 9999px; background: var(--fondo); color: var(--identidad);
  font: 600 var(--texto-sm)/1.2 var(--font-body); cursor: pointer;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: transform var(--dur-micro) var(--curva-entrada);
}
.pv__completa:active { transform: scale(0.97); }
@media (hover: hover) and (pointer: fine) { .pv__completa:hover { background: var(--superficie); } }
@media (prefers-reduced-motion: reduce) { .pv__completa { transition: none; } .pv__completa:active { transform: none; } }

/* la hoja: pegada abajo y a todo el ancho (como .qc-hoja de QueCambio), con el velo del DS */
.pv__hoja {
  position: fixed; inset: auto 0 0 0; margin: 0 auto; width: 100%; max-width: 560px; max-height: 88dvh; padding: 0;
  border: 0; border-radius: 20px 20px 0 0; background: var(--fondo); color: var(--texto-1); overflow: hidden;
  box-shadow: var(--sombra-flotante); --pv-alto: min(42dvh, 300px);
}
.pv__hoja[open] { display: flex; flex-direction: column; }
.pv__hoja::backdrop { background: var(--velo-berenjena-60); }
.pv__dentro { overflow-y: auto; overscroll-behavior: contain; padding: var(--sp-12) var(--sp-16) calc(var(--sp-16) + env(safe-area-inset-bottom)); }
.pv__hoja .pv__t { font-size: var(--texto-sm); }
@media (prefers-reduced-motion: no-preference) {
  .pv__hoja[open] { animation: pv-sube var(--dur-transicion) var(--curva-salida) both; }
  .pv__hoja[open]::backdrop { animation: pv-funde var(--dur-transicion) var(--curva-salida) both; }
}
@keyframes pv-sube { from { transform: translateY(100%); } }
</style>
