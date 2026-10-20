<script setup lang="ts">
/**
 * Rejilla de visores OpenSeadragon para /laminillas (solo cliente).
 *
 * `rejilla` son filas × columnas de laminillas (null = hueco). Todas comparten el zoom en
 * unidades FÍSICAS: mismos µm por píxel de pantalla en todos los paneles, con el µm/px de cada
 * escáner (Ventana 0,25; DFCI 0,25055; Hamamatsu 0,4589). El paneo se enlaza solo entre
 * laminillas del mismo grupo de paneo (mismo bloque); con el enlace activo, mover una mueve las
 * demás la misma distancia en µm, sin forzarlas a un mismo punto: cada corte conserva su encuadre.
 * Sin normalizar color: se pinta lo que dio cada escáner.
 */
import type OpenSeadragonNS from 'openseadragon'
import { fuenteDzi, grupoPaneo, reglaRedonda, type Idioma, type Laminilla, type Manifest } from '~/utils/laminillas'

const props = defineProps<{
  manifest: Manifest
  rejilla: (Laminilla | null)[][]
  idioma: Idioma
  /** Raíz de teselas (permite apuntar a un servidor local en pruebas). */
  teselas?: string
  /** Etiqueta de cada panel, por id de laminilla. */
  etiquetas: Record<string, string>
}>()

const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
const caja = ref<HTMLDivElement | null>(null)
const nodos = ref<HTMLDivElement[]>([])
const reglas = reactive<Record<number, { px: number; texto: string }>>({})
const fallos = reactive<Record<number, boolean>>({})
const enlazado = ref(true)
const pantallaCompleta = ref(false)

type Panel = { v: OpenSeadragonNS.Viewer; l: Laminilla; grupo: string; ultimo: { x: number; y: number } | null }
let OSD: typeof OpenSeadragonNS | null = null
let paneles: Panel[] = []
let sincronizando = false

const celdas = computed(() => props.rejilla.flat())
const columnas = computed(() => Math.max(1, ...props.rejilla.map((f) => f.length)))
const hayGrupoComun = computed(() => {
  const g = celdas.value.filter(Boolean).map((l) => grupoPaneo(props.manifest, l!.muestra))
  return new Set(g).size < g.length
})

const reducido = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** µm por píxel de pantalla del panel. */
function umPorPx(p: Panel, actual = true) {
  const vp = p.v.viewport
  return p.l.mpp / vp.viewportToImageZoom(vp.getZoom(actual))
}

/** Centro del panel en µm desde el origen de su imagen. */
function centroUm(p: Panel) {
  const c = p.v.viewport.viewportToImageCoordinates(p.v.viewport.getCenter(true))
  return { x: c.x * p.l.mpp, y: c.y * p.l.mpp }
}

function pintaRegla(i: number) {
  const p = paneles[i]
  if (!p || !p.v.world.getItemCount()) return
  const r = reglaRedonda(umPorPx(p), props.idioma)
  reglas[i] = { px: r.px, texto: r.texto }
  // Estado físico legible desde fuera (lo usa scripts/test-laminillas-visor.mjs): µm por píxel de
  // pantalla y centro en µm. No es estado de la app; solo se escribe.
  const c = centroUm(p)
  const el = nodos.value[i]?.parentElement
  el?.setAttribute('data-um-px', umPorPx(p).toFixed(6))
  el?.setAttribute('data-centro-um', `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
}

function alCambiar(i: number) {
  pintaRegla(i)
  if (sincronizando) return
  const src = paneles[i]
  if (!src || !src.v.world.getItemCount()) return
  sincronizando = true
  try {
    const escala = umPorPx(src)
    const ahora = centroUm(src)
    const delta = src.ultimo ? { x: ahora.x - src.ultimo.x, y: ahora.y - src.ultimo.y } : { x: 0, y: 0 }
    for (const [j, d] of paneles.entries()) {
      if (j === i || !d.v.world.getItemCount()) continue
      const vp = d.v.viewport
      const z = vp.imageToViewportZoom(d.l.mpp / escala)
      // Margen contra rebotes: dos paneles que ya están a la misma escala no se reescriben.
      if (Math.abs(vp.getZoom(true) / z - 1) > 1e-6) vp.zoomTo(z, undefined, true)
      if (enlazado.value && d.grupo === src.grupo && d.ultimo && Math.hypot(delta.x, delta.y) > 1e-3) {
        const destino = { x: d.ultimo.x + delta.x, y: d.ultimo.y + delta.y }
        vp.panTo(vp.imageToViewportCoordinates(destino.x / d.l.mpp, destino.y / d.l.mpp), true)
      }
      d.ultimo = centroUm(d)
      pintaRegla(j)
    }
    src.ultimo = ahora
  } finally {
    sincronizando = false
  }
}

function abrePanel(i: number, el: HTMLDivElement, l: Laminilla) {
  if (!OSD) return
  const v = OSD({
    element: el,
    tileSources: fuenteDzi(props.manifest, l, props.teselas || props.manifest.teselas),
    drawer: 'canvas',
    showNavigationControl: false,
    showNavigator: false,
    animationTime: reducido() ? 0 : 0.5,
    springStiffness: reducido() ? 100 : 7,
    blendTime: 0,
    maxZoomPixelRatio: 2,
    minZoomImageRatio: 0.8,
    visibilityRatio: 0.3,
    imageLoaderLimit: 6,
    background: 'transparent',
    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true },
    gestureSettingsTouch: { pinchToZoom: true, flickEnabled: !reducido() },
  } as OpenSeadragonNS.Options)
  const panel: Panel = { v, l, grupo: grupoPaneo(props.manifest, l.muestra), ultimo: null }
  paneles[i] = panel
  fallos[i] = false
  v.addHandler('open', () => {
    panel.ultimo = centroUm(panel)
    pintaRegla(i)
    // Cuando han abierto todos, se encuadran juntos a una misma escala física.
    const esperados = celdas.value.filter(Boolean).length
    if (paneles.filter((p) => p && p.v.world.getItemCount()).length === esperados) encuadra()
  })
  v.addHandler('open-failed', () => { fallos[i] = true })
  v.addHandler('viewport-change', () => alCambiar(i))
  v.addHandler('resize', () => pintaRegla(i))
  const lienzo = v.canvas as HTMLElement
  lienzo.setAttribute('aria-label', L(
    `Laminilla ${props.etiquetas[l.id] ?? l.id}. Flechas para mover, más y menos para el zoom, 0 para encuadrar.`,
    `Slide ${props.etiquetas[l.id] ?? l.id}. Arrow keys to pan, plus and minus to zoom, 0 to fit.`))
  lienzo.setAttribute('aria-roledescription', L('visor de laminilla', 'slide viewer'))
}

function cierra() {
  for (const p of paneles) p?.v.destroy()
  paneles = []
  for (const k of Object.keys(reglas)) delete reglas[+k]
}

async function monta() {
  cierra()
  await nextTick()
  if (!OSD) OSD = (await import('openseadragon')).default
  celdas.value.forEach((l, i) => {
    const el = nodos.value[i]
    if (l && el) abrePanel(i, el, l)
  })
}

// Misma forma de rejilla y otras laminillas: se reabren sin perder la escala física.
watch(() => celdas.value.map((l) => l?.id ?? '-').join('|'), () => monta())

function zoom(f: number) {
  const p = paneles.find((x) => x && x.v.world.getItemCount())
  if (!p) return
  p.v.viewport.zoomBy(f)
  p.v.viewport.applyConstraints()
}
function encuadra() {
  // Todos enteros y a la MISMA escala física: la del panel cuya imagen mide más (con la escala de
  // cualquier otro, esa no cabría). Cada uno, centrado en su propia imagen. Sin propagar nada.
  const abiertos = paneles.filter((p) => p && p.v.world.getItemCount())
  if (!abiertos.length) return
  const escala = Math.max(...abiertos.map((p) => p.l.mpp / p.v.viewport.viewportToImageZoom(p.v.viewport.getHomeZoom())))
  sincronizando = true
  try {
    for (const p of abiertos) {
      const vp = p.v.viewport
      vp.zoomTo(vp.imageToViewportZoom(p.l.mpp / escala), undefined, true)
      vp.panTo(vp.getHomeBounds().getCenter(), true)
    }
  } finally {
    sincronizando = false
  }
  for (const p of paneles) if (p) p.ultimo = centroUm(p)
  paneles.forEach((_, i) => pintaRegla(i))
}
function alternaEnlace() {
  enlazado.value = !enlazado.value
  for (const p of paneles) if (p) p.ultimo = centroUm(p)
}
async function alternaPantalla() {
  if (!caja.value) return
  if (document.fullscreenElement) await document.exitFullscreen()
  else await caja.value.requestFullscreen?.()
}
function alPantalla() { pantallaCompleta.value = document.fullscreenElement === caja.value }

onMounted(() => {
  monta()
  document.addEventListener('fullscreenchange', alPantalla)
})
onBeforeUnmount(() => {
  cierra()
  document.removeEventListener('fullscreenchange', alPantalla)
})
</script>

<template>
  <div ref="caja" class="visor-caja" :class="{ 'visor-caja--completa': pantallaCompleta }">
    <div class="visor-barra" role="toolbar" :aria-label="L('Controles del visor', 'Viewer controls')">
      <button type="button" class="visor-boton" :aria-label="L('Acercar', 'Zoom in')" @click="zoom(1.6)">
        <Icon name="ph:plus-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" class="visor-boton" :aria-label="L('Alejar', 'Zoom out')" @click="zoom(1 / 1.6)">
        <Icon name="ph:minus-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" class="visor-boton visor-boton--texto" @click="encuadra">
        <Icon name="ph:corners-out-bold" class="w-4 h-4" aria-hidden="true" />{{ L('Encuadrar', 'Fit') }}
      </button>
      <button
        v-if="hayGrupoComun"
        type="button"
        class="visor-boton visor-boton--texto"
        :aria-pressed="enlazado"
        @click="alternaEnlace"
      >
        <Icon :name="enlazado ? 'ph:link-bold' : 'ph:link-break-bold'" class="w-4 h-4" aria-hidden="true" />
        {{ L('Paneo enlazado', 'Linked panning') }}
      </button>
      <button type="button" class="visor-boton visor-boton--texto ml-auto" :aria-pressed="pantallaCompleta" @click="alternaPantalla">
        <Icon :name="pantallaCompleta ? 'ph:arrows-in-bold' : 'ph:arrows-out-bold'" class="w-4 h-4" aria-hidden="true" />
        {{ L('Pantalla completa', 'Full screen') }}
      </button>
    </div>
    <p class="visor-ayuda">
      {{ hayGrupoComun
        ? L('El zoom va a la par en micras en todos los paneles. El paneo se mueve junto solo entre cortes del mismo bloque de tejido; suelta el enlace para alinearlos y vuelve a activarlo.',
            'Zoom is matched in microns across all panels. Panning moves together only between sections of the same tissue block; unlink to line them up, then link again.')
        : L('El zoom va a la par en micras en todos los paneles. El paneo es libre: son tejidos distintos.',
            'Zoom is matched in microns across all panels. Panning is independent: these are different tissues.') }}
    </p>
    <div class="visor-rejilla" :style="{ '--cols': columnas, '--filas': rejilla.length }">
      <figure v-for="(l, i) in celdas" :key="i + '-' + (l?.id ?? 'hueco')" class="visor-panel">
        <template v-if="l">
          <figcaption class="visor-rotulo">{{ etiquetas[l.id] ?? l.id }}</figcaption>
          <div :ref="(el) => { if (el) nodos[i] = el as HTMLDivElement }" class="visor-lienzo" />
          <div v-if="reglas[i]" class="visor-regla" aria-hidden="true">
            <span class="visor-regla__barra" :style="{ width: reglas[i].px + 'px' }" />
            <span class="visor-regla__texto">{{ reglas[i].texto }}</span>
          </div>
          <p v-if="fallos[i]" class="visor-fallo" role="status">
            {{ L('No se han podido cargar las teselas de esta laminilla.', 'The tiles for this slide could not be loaded.') }}
          </p>
        </template>
        <div v-else class="visor-hueco">{{ L('Sin laminilla', 'No slide') }}</div>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.visor-caja { background: var(--color-bg); }
.visor-caja--completa { padding: var(--sp-16); overflow: auto; }
.visor-barra { display: flex; flex-wrap: wrap; gap: var(--sp-8); align-items: center; margin-bottom: var(--sp-8); }
.visor-boton {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  background: var(--color-bg-card); color: var(--color-text); font-weight: 600; font-size: var(--texto-sm);
}
.visor-boton:hover { background: var(--secundario-hover); }
.visor-boton[aria-pressed='true'] { background: var(--seleccionado-bg); border-color: var(--color-miriam); }
.visor-boton:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.visor-ayuda { font-size: var(--texto-xs); color: var(--color-text-soft); margin: 0 0 var(--sp-12); max-width: 70ch; line-height: 1.5; }
.visor-rejilla { display: grid; gap: var(--sp-12); grid-template-columns: 1fr; }
@media (min-width: 768px) {
  .visor-rejilla { grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); }
}
.visor-panel { position: relative; margin: 0; border-radius: var(--radius-md); overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent); background: #fff; }
.visor-rotulo { position: absolute; z-index: 2; top: 8px; left: 8px; right: 8px; pointer-events: none;
  font-size: var(--texto-xs); font-weight: 600; color: var(--color-text);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent); padding: 4px 8px; border-radius: var(--radius-sm); width: fit-content; }
.visor-lienzo { width: 100%; height: clamp(280px, 52vh, 640px); }
.visor-caja--completa .visor-lienzo { height: calc((100vh - 140px) / var(--filas, 1)); }
.visor-lienzo :deep(.openseadragon-canvas:focus-visible) { outline: 3px solid var(--anillo-foco); outline-offset: -3px; }
.visor-regla { position: absolute; z-index: 2; left: 10px; bottom: 10px; pointer-events: none;
  display: flex; flex-direction: column; gap: 2px; padding: 4px 6px 3px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent); }
.visor-regla__barra { display: block; height: 4px; background: var(--color-text);
  border-left: 2px solid var(--color-text); border-right: 2px solid var(--color-text); }
.visor-regla__texto { font-family: var(--font-mono); font-size: 12px; color: var(--color-text); }
.visor-fallo { position: absolute; inset: auto 8px 48px 8px; z-index: 2; font-size: var(--texto-sm);
  background: var(--color-bg-card); color: var(--color-text); padding: 8px 10px; border-radius: var(--radius-sm); }
.visor-hueco { display: flex; align-items: center; justify-content: center; height: clamp(280px, 52vh, 640px);
  color: var(--color-text-soft); font-size: var(--texto-sm); background: var(--color-bg-card); }
</style>
