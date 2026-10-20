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
 *
 * Rediseño «visor con galería» (20-oct): el visor LLENA su contenedor (la página le da la altura de
 * la pantalla) y la rejilla la orienta la página (en móvil, comparar apila los paneles). Con un
 * solo panel lleva minimapa (`minimapa`). La barra flota arriba a la derecha: zoom, encuadrar,
 * mover a la par, pantalla completa y «Más» (las flechas de mover, alternativa al arrastre de WCAG
 * 2.5.7, y la ayuda). Al cambiar de laminilla se encuadra: en una galería, cada imagen entra entera.
 */
import type OpenSeadragonNS from 'openseadragon'
import { fuenteDzi, grupoPaneo, reglaRedonda, type Idioma, type Laminilla, type Manifest } from '~/utils/laminillas'

const props = defineProps<{
  manifest: Manifest
  rejilla: (Laminilla | null)[][]
  idioma: Idioma
  /** Raíz de teselas (permite apuntar a un servidor local en pruebas). */
  teselas?: string
  /** Rótulo de cada panel, por posición en la rejilla aplanada. */
  rotulos: string[]
  /** Nombre accesible completo de cada panel (marcador · muestra), por posición. */
  nombres: string[]
  /** Minimapa (navigator de OpenSeadragon) cuando hay un solo panel. */
  minimapa?: boolean
}>()

const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
const caja = ref<HTMLDivElement | null>(null)
const nodos = ref<HTMLDivElement[]>([])
const reglas = reactive<Record<number, { px: number; texto: string }>>({})
const fallos = reactive<Record<number, boolean>>({})
const enlazado = ref(true)
const pantallaCompleta = ref(false)
const fsDisponible = ref(false)
const mas = ref(false)
const idAyuda = useId()
const idMas = useId()

type Panel = { v: OpenSeadragonNS.Viewer; l: Laminilla; grupo: string; ultimo: { x: number; y: number } | null }
let OSD: typeof OpenSeadragonNS | null = null
let paneles: Panel[] = []
let sincronizando = false
let generacion = 0

const celdas = computed(() => props.rejilla.flat())
const columnas = computed(() => Math.max(1, ...props.rejilla.map((f) => f.length)))
const conLamina = computed(() => celdas.value.map((l, i) => (l ? i : -1)).filter((i) => i >= 0))
const hayGrupoComun = computed(() => {
  const g = celdas.value.filter(Boolean).map((l) => grupoPaneo(props.manifest, l!.muestra))
  return new Set(g).size < g.length
})

const reducido = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const abierto = (p: Panel | undefined): p is Panel => !!p && p.v.world.getItemCount() > 0

/** µm por píxel de pantalla del panel. */
function umPorPx(p: Panel) {
  const vp = p.v.viewport
  return p.l.mpp / vp.viewportToImageZoom(vp.getZoom(true))
}

/** Centro del panel en µm desde el origen de su imagen. */
function centroUm(p: Panel) {
  const c = p.v.viewport.viewportToImageCoordinates(p.v.viewport.getCenter(true))
  return { x: c.x * p.l.mpp, y: c.y * p.l.mpp }
}

function pintaRegla(i: number) {
  const p = paneles[i]
  if (!abierto(p)) return
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
  if (!abierto(src)) return
  sincronizando = true
  try {
    const escala = umPorPx(src)
    const ahora = centroUm(src)
    const delta = src.ultimo ? { x: ahora.x - src.ultimo.x, y: ahora.y - src.ultimo.y } : { x: 0, y: 0 }
    for (const [j, d] of paneles.entries()) {
      if (j === i || !abierto(d)) continue
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

/** Todos a la escala `escala` (µm por píxel de pantalla), cada uno centrado en su imagen. */
function aEscala(escala: number) {
  const abiertos = paneles.filter(abierto)
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
  for (const p of abiertos) p.ultimo = centroUm(p)
  paneles.forEach((_, i) => pintaRegla(i))
}

/** Todos enteros y a la MISMA escala física: la del panel cuya imagen mide más. */
function encuadra() {
  const abiertos = paneles.filter(abierto)
  if (!abiertos.length) return
  aEscala(Math.max(...abiertos.map((p) => p.l.mpp / p.v.viewport.viewportToImageZoom(p.v.viewport.getHomeZoom()))))
}

function abrePanel(i: number, el: HTMLDivElement, l: Laminilla, gen: number) {
  if (!OSD) return
  const v = OSD({
    element: el,
    tileSources: fuenteDzi(props.manifest, l, props.teselas || props.manifest.teselas),
    drawer: 'canvas',
    showNavigationControl: false,
    showNavigator: !!props.minimapa && conLamina.value.length === 1,
    navigatorPosition: 'TOP_LEFT',
    navigatorSizeRatio: 0.16,
    navigatorAutoFade: false,
    // Minimapa claro, con el recuadro en el violeta de la marca (por defecto es negro y rojo).
    navigatorBackground: '#ffffff',
    navigatorBorderColor: '#cfc6d4',
    navigatorDisplayRegionColor: '#9d44ab',
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
    if (gen !== generacion) return
    panel.ultimo = centroUm(panel)
    pintaRegla(i)
    // Cuando han abierto todos, encuadre común: cada laminilla entra entera, a la misma escala física.
    if (paneles.filter(abierto).length === conLamina.value.length) encuadra()
  })
  v.addHandler('open-failed', () => { fallos[i] = true })
  // Con la fuente en línea OpenSeadragon abre aunque el bucket no responda: lo que falla son las
  // teselas, una a una. Si fallan varias y no ha cargado ninguna, el panel lo dice.
  let cargadas = 0
  let fallidas = 0
  v.addHandler('tile-loaded', () => { cargadas++; fallos[i] = false })
  v.addHandler('tile-load-failed', () => { fallidas++; if (!cargadas && fallidas >= 4) fallos[i] = true })
  v.addHandler('viewport-change', () => alCambiar(i))
  v.addHandler('resize', () => pintaRegla(i))
  // Teclas de OpenSeadragon: «0» encuadraba SOLO este panel (y los demás copiaban su escala);
  // r/R rotan, f voltea y j/k cambian de página, y la sincronía y la regla asumen ejes sin girar.
  v.addHandler('canvas-key', (e: { originalEvent: Event; preventDefaultAction?: boolean }) => {
    const ev = e.originalEvent as KeyboardEvent
    if (ev.key === '0') {
      e.preventDefaultAction = true
      ev.preventDefault()
      encuadra()
    } else if ('rRfFjJkK'.includes(ev.key)) {
      e.preventDefaultAction = true
    }
  })
  const lienzo = v.canvas as HTMLElement
  lienzo.setAttribute('role', 'application')
  lienzo.setAttribute('aria-roledescription', L('visor de laminilla', 'slide viewer'))
  lienzo.setAttribute('aria-label', props.nombres[i] ?? l.id)
  lienzo.setAttribute('aria-describedby', idAyuda)
}

function cierra() {
  for (const p of paneles) p?.v.destroy()
  paneles = []
  for (const k of Object.keys(reglas)) delete reglas[+k]
}

async function monta() {
  // Dos montajes seguidos (el de onMounted y el de la query aplicada tras hidratar) no se pisan:
  // los eventos de una generación vieja no tocan el estado.
  const gen = ++generacion
  cierra()
  await nextTick()
  if (!OSD) OSD = (await import('openseadragon')).default
  if (gen !== generacion) return
  celdas.value.forEach((l, i) => {
    const el = nodos.value[i]
    if (l && el) abrePanel(i, el, l, gen)
  })
}

// Otras laminillas (galería, comparar, HE al lado): se reabren y se encuadran.
watch(() => [celdas.value.map((l) => l?.id ?? '-').join('|'), columnas.value, !!props.minimapa], () => monta())

function zoom(f: number) {
  const p = paneles.find(abierto)
  if (!p) return
  p.v.viewport.zoomBy(f)
  p.v.viewport.applyConstraints()
}
/** Mover sin arrastrar (WCAG 2.5.7): desplaza el primer panel; el paneo enlazado hace el resto. */
function desplaza(dx: number, dy: number) {
  const p = paneles.find(abierto)
  if (!p || !OSD) return
  const w = (p.v.container as HTMLElement).clientWidth
  const h = (p.v.container as HTMLElement).clientHeight
  p.v.viewport.panBy(p.v.viewport.deltaPointsFromPixels(new OSD.Point(dx * w * 0.25, dy * h * 0.25)))
  p.v.viewport.applyConstraints()
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
  fsDisponible.value = !!document.fullscreenEnabled
  monta()
  document.addEventListener('fullscreenchange', alPantalla)
})
onBeforeUnmount(() => {
  generacion++
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
      <button type="button" class="visor-boton" :aria-label="L('Encuadrar', 'Fit')" :title="L('Encuadrar', 'Fit')" @click="encuadra">
        <Icon name="ph:corners-out-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        v-if="hayGrupoComun"
        type="button"
        class="visor-boton visor-boton--texto"
        :aria-pressed="enlazado"
        @click="alternaEnlace"
      >
        <Icon :name="enlazado ? 'ph:link-bold' : 'ph:link-break-bold'" class="w-4 h-4" aria-hidden="true" /><span class="visor-boton__texto">{{ L('Mover a la par', 'Move together') }}</span>
      </button>
      <button v-if="fsDisponible" type="button" class="visor-boton" :aria-label="L('Pantalla completa', 'Full screen')" :title="L('Pantalla completa', 'Full screen')" :aria-pressed="pantallaCompleta" @click="alternaPantalla">
        <Icon :name="pantallaCompleta ? 'ph:arrows-in-bold' : 'ph:arrows-out-bold'" class="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" class="visor-boton" :aria-label="L('Más controles', 'More controls')" :title="L('Más controles', 'More controls')" :aria-expanded="mas" :aria-controls="idMas" @click="mas = !mas">
        <Icon name="ph:dots-three-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
      <div v-show="mas" :id="idMas" class="visor-mas">
        <div class="visor-grupo" role="group" :aria-label="L('Mover', 'Move')">
          <button type="button" class="visor-boton" :aria-label="L('Mover a la izquierda', 'Move left')" @click="desplaza(-1, 0)">
            <Icon name="ph:arrow-left-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" class="visor-boton" :aria-label="L('Mover arriba', 'Move up')" @click="desplaza(0, -1)">
            <Icon name="ph:arrow-up-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" class="visor-boton" :aria-label="L('Mover abajo', 'Move down')" @click="desplaza(0, 1)">
            <Icon name="ph:arrow-down-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" class="visor-boton" :aria-label="L('Mover a la derecha', 'Move right')" @click="desplaza(1, 0)">
            <Icon name="ph:arrow-right-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p :id="idAyuda" class="visor-ayuda">
          {{ hayGrupoComun
            ? L('El zoom va a la par en micras en todos los paneles. Mover a la par solo enlaza cortes del mismo bloque de tejido: suéltalo para alinearlos y vuelve a activarlo. Con el teclado, dentro de la imagen: flechas para mover, más y menos para el zoom, 0 para encuadrar. Colores tal como los dio cada escáner, sin normalizar.',
                'Zoom is matched in microns across all panels. Move together only links sections of the same tissue block: turn it off to line them up, then on again. Keyboard, inside the image: arrows to move, plus and minus to zoom, 0 to fit. Colours as each scanner captured them, not normalised.')
            : L('Con el teclado, dentro de la imagen: flechas para mover, más y menos para el zoom, 0 para encuadrar. Colores tal como los dio cada escáner, sin normalizar.',
                'Keyboard, inside the image: arrows to move, plus and minus to zoom, 0 to fit. Colours as each scanner captured them, not normalised.') }}
        </p>
      </div>
    </div>
    <div class="visor-rejilla" :style="{ '--cols': columnas, '--filas': rejilla.length }">
      <figure v-for="(l, i) in celdas" :key="i + '-' + (l?.id ?? 'hueco')" class="visor-panel">
        <template v-if="l">
          <figcaption v-if="rotulos[i]" class="visor-rotulo">{{ rotulos[i] }}</figcaption>
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
/* Llena el contenedor que le da la página (la altura de la pantalla, menos cabecera y barras). */
.visor-caja { position: relative; height: 100%; min-height: 0; }
.visor-caja--completa { background: var(--color-bg); }
.visor-barra { position: absolute; z-index: 4; top: 8px; right: 8px; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; max-width: calc(100% - 16px); }
.visor-grupo { display: inline-flex; gap: 4px; }
.visor-boton {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 44px; min-height: 44px; padding: 0 10px; border-radius: var(--radius-md);
  border: 1px solid var(--trazo-interactivo); background: color-mix(in srgb, var(--color-bg-card) 94%, transparent);
  color: var(--color-text); font-weight: 600; font-size: var(--texto-sm);
}
@media (hover: hover) and (pointer: fine) {
  .visor-boton:hover { background: var(--secundario-hover); }
}
.visor-boton[aria-pressed='true'], .visor-boton[aria-expanded='true'] { background: var(--seleccionado-bg); border-color: var(--color-miriam); }
.visor-boton:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.visor-mas { flex-basis: 100%; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.visor-ayuda { margin: 0; max-width: 34ch; font-size: var(--texto-xs); line-height: 1.45; color: var(--color-text); background: var(--color-bg-card);
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent); border-radius: var(--radius-md); padding: 8px 10px; }
.visor-rejilla { height: 100%; display: grid; gap: 6px; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); grid-template-rows: repeat(var(--filas), minmax(0, 1fr)); }
.visor-panel { position: relative; margin: 0; min-height: 0; border-radius: var(--radius-md); overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent); background: #fff; }
.visor-rotulo { position: absolute; z-index: 2; bottom: 40px; left: 8px; pointer-events: none;
  font-size: var(--texto-xs); font-weight: 600; color: var(--color-text);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent); padding: 4px 8px; border-radius: var(--radius-sm); width: fit-content; max-width: calc(100% - 16px); }
.visor-lienzo { position: absolute; inset: 0; }
.visor-lienzo :deep(.openseadragon-canvas:focus-visible) { outline: 3px solid var(--anillo-foco); outline-offset: -3px; }
.visor-regla { position: absolute; z-index: 2; left: 8px; bottom: 8px; pointer-events: none;
  display: flex; flex-direction: column; gap: 2px; padding: 4px 6px 3px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent); }
.visor-regla__barra { display: block; height: 4px; background: var(--color-text);
  border-left: 2px solid var(--color-text); border-right: 2px solid var(--color-text); }
.visor-regla__texto { font-family: var(--font-mono); font-size: 12px; color: var(--color-text); }
.visor-fallo { position: absolute; inset: auto 8px 48px 8px; z-index: 2; font-size: var(--texto-sm);
  background: var(--color-bg-card); color: var(--color-text); padding: 8px 10px; border-radius: var(--radius-sm); }
.visor-hueco { display: flex; align-items: center; justify-content: center; height: 100%;
  color: var(--color-text-soft); font-size: var(--texto-sm); background: var(--color-bg-card); }
/* En móvil «Mover a la par» queda en el icono (con su nombre accesible): la barra cabe en una fila. */
@media (max-width: 767px) {
  .visor-boton__texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
</style>
