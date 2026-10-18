<script setup lang="ts">
/**
 * Mapa de células (UMAP) con Vitessce, como isla de cliente. React y Vitessce se cargan con
 * `import()` al montar: viajan en un chunk propio que solo pide esta página, y nunca en el HTML.
 * Una sola vista (el mapa), con etiquetas sobre los grupos; la leyenda, los n y las cifras van fuera,
 * en componentes propios (ExpExplorador). Colores: los decide el padre con la paleta derivada de los
 * tokens (app/utils/celulaExploradorColor.ts). El lienzo no se maneja con teclado: hay un enlace
 * para saltarlo y todo lo que dice está también en texto debajo, salvo la posición de cada célula.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import type { RGB } from '~/utils/celulaExploradorColor'
import { hayWebGl } from '~/utils/celulaExploradorWebgl'

const props = defineProps<{
  d: LesionDatos
  modo: 'grupo' | 'tipo' | 'gen' | 'coexp'
  gen: string
  genB: string
  /** etiqueta visible por célula de cada conjunto (grupo, tipo y, si hay, co-expresión) */
  conjuntos: { nombre: string; columna: string; valores: string[] }[]
  colores: { ruta: [string, string]; rgb: RGB }[]
  colorearPor: string
  tema: 'light' | 'dark'
  lang: 'es' | 'en'
  /** orden de dibujo (con un gen, lo detectado encima) */
  orden?: number[]
  /** alto del mapa en px (lo decide el padre según la pantalla) */
  alto: number
  /** estrecho: rótulos más pequeños y encuadre con margen */
  movil: boolean
  /** táctil (estrecho o puntero grueso, p. ej. iPad apaisado): el lienzo atrapa el dedo, así que queda quieto hasta
   * pulsar «Mover el mapa» */
  tactil: boolean
}>()
const emit = defineEmits<{ error: [string] }>()

const el = ref<HTMLElement | null>(null)
const cargando = ref(true)
let motor: { pinta: (e: any) => void; desmonta: () => void } | null = null

function entrada() {
  return {
    uid: `exp-${props.d.lesion}-${props.modo}-${props.gen}-${props.modo === 'coexp' ? props.genB : ''}-${props.tema}-${props.lang}`,
    tema: props.tema, alto: props.alto, umap: props.d.celulas.umap, lang: props.lang, rotulos: props.modo === 'grupo', tamRotulo: props.movil ? 12 : 14, encuadre: props.movil ? { ancho: el.value?.clientWidth || window.innerWidth - 32, margen: 0.86 } : undefined,   // también en móvil (diseño, 18-oct: sin rótulos dos grupos de tono parecido no se distinguían), más pequeños para que no se corten en el borde
    conjuntos: props.conjuntos, colores: props.colores, colorearPor: props.colorearPor,
    // el gen se pinta por clases de nivel (conjunto «Nivel de …», lo calcula el padre): lo no detectado en gris,
    // como en Loupe. La escala continua de Vitessce (plasma) dejaba las células a 0 casi del color de las de nivel bajo.
    gen: null, orden: props.orden,
    etiquetas: { mapa: props.lang === 'en' ? 'Cell map (UMAP)' : 'Mapa de células (UMAP)' },
  }
}

// sin WebGL Vitessce deja una caja vacía sin avisar: se mira antes (una vez por página, app/utils/celulaExploradorWebgl.ts)
onMounted(async () => {
  if (!hayWebGl()) { cargando.value = false; emit('error', 'sin WebGL'); return }
  try {
    const m = await import('~/lib/explorador/motor')
    if (!el.value) return
    motor = m.montaMotor(el.value)
    motor.pinta(entrada())
  }
  catch (e) { emit('error', String((e as Error)?.message ?? e)) }
  finally { cargando.value = false }
})
// Vitessce remonta la vista al cambiar de config: un velo con el fondo del tema tapa el destello gris
let velo: ReturnType<typeof setTimeout> | null = null
watch(() => [props.d, props.modo, props.gen, props.genB, props.conjuntos, props.colores, props.tema, props.lang, props.alto, props.orden], () => {
  if (!motor) return
  cargando.value = true
  motor.pinta(entrada())
  if (velo) clearTimeout(velo)
  velo = setTimeout(() => { cargando.value = false }, 1100)
})
onBeforeUnmount(() => { if (velo) clearTimeout(velo); motor?.desmonta(); motor = null })
/** Móvil: el mapa se ve, pero no se mueve hasta pedirlo; así el dedo desplaza la página (Vitessce lleva touch-action:none). */
const mover = ref(false)
watch(() => props.tactil, (m) => { if (!m) mover.value = false })
</script>

<template>
  <div class="exp-mapa" :style="{ minHeight: `${alto}px` }">
    <p v-if="cargando" class="exp-mapa__carga" role="status">{{ lang === 'en' ? 'Loading the map…' : 'Cargando el mapa…' }}</p>
    <div
      ref="el"
      class="exp-mapa__lienzo"
      :style="{ height: `${alto}px` }"
      role="group"
      :aria-label="lang === 'en'
        ? 'Visual map of the cells (UMAP). It is used with a mouse or a finger and has no keyboard version. The n per group and the per-gene figures are in the gene and markers panel and in More analysis and Data quality; the position of each cell, only here.'
        : 'Mapa visual de las células (UMAP). Se maneja con ratón o con el dedo y no tiene versión de teclado. Los n por grupo y las cifras por gen están en el panel del gen y de los marcadores, y en «Más análisis» y «Calidad de los datos»; la posición de cada célula, solo aquí.'"
    />
    <template v-if="tactil">
      <div v-if="!mover" class="exp-mapa__velo" aria-hidden="true" />
      <button type="button" class="exp-mapa__mover" :class="{ 'exp-mapa__mover--activo': mover }" @click="mover = !mover">
        {{ mover ? (lang === 'en' ? 'Done' : 'Listo') : (lang === 'en' ? 'Move the map' : 'Mover el mapa') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.exp-mapa { position: relative; border-radius: var(--radius-card); overflow: hidden; border: 1px solid var(--trazo-medio); background: var(--fondo); }
.exp-mapa__lienzo { position: relative; }
/* velo transparente sobre el lienzo: el dedo desplaza la página hasta que se pide mover el mapa */
.exp-mapa__velo { position: absolute; inset: 0; z-index: 3; touch-action: pan-y; }
.exp-mapa__mover { position: absolute; right: var(--sp-12); bottom: var(--sp-12); z-index: 4; min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--texto-1); background: var(--fondo); color: var(--texto-1); font: 600 var(--texto-sm)/1 var(--font-body); box-shadow: 0 4px 14px color-mix(in srgb, var(--texto-1) 18%, transparent); }
.exp-mapa__mover--activo { background: var(--texto-1); color: var(--fondo); }
.exp-mapa__mover:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp-mapa__carga { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; margin: 0; background: var(--fondo); font: var(--tipo-body-sm); color: var(--texto-2); }
/* Vitessce pinta sus propios fondos (blanco / #333 / negro): aquí manda el tema del sistema */
.exp-mapa :deep(.vitessce-container),
.exp-mapa :deep(.vitessce-container .card),
.exp-mapa :deep(.vitessce-container [class*="card"]),
.exp-mapa :deep(.vitessce-container .react-grid-item) { background: var(--fondo) !important; color: var(--texto-1) !important; }
/* fuera: el tirador de redimensionar de la rejilla de Vitessce */
.exp-mapa :deep(.react-resizable-handle) { display: none !important; }
/* fuera: el puntero (es el único modo: salía pulsado y no hacía nada; diseño, 18-oct), el lazo (crearía selecciones que
   la página no usa), el menú de opciones y la ayuda (en inglés) */
.exp-mapa :deep(button[title="Mover y hacer zoom"]),
.exp-mapa :deep(button[title="Pan and zoom"]),
.exp-mapa :deep(button[title="Select lasso"]),
.exp-mapa :deep([aria-label="Open plot options menu"]),
.exp-mapa :deep([aria-label="Open help info"]) { display: none !important; }
/* «Recentrar el mapa»: a 44 px, opaco y con los colores del tema (Vitessce lo pinta blanco al 65 %) */
.exp-mapa :deep(button[title="Recentrar el mapa"] svg),
.exp-mapa :deep(button[title="Recenter the map"] svg) { fill: var(--texto-1) !important; color: var(--texto-1) !important; }   /* en oscuro el icono salía negro sobre fondo oscuro */
.exp-mapa :deep(button[title="Recentrar el mapa"]),
.exp-mapa :deep(button[title="Recenter the map"]) { width: 44px !important; height: 44px !important; opacity: 1 !important; background: var(--fondo) !important; color: var(--texto-1) !important; border: 1px solid var(--trazo-interactivo) !important; border-radius: var(--radius-btn) !important; }
</style>
