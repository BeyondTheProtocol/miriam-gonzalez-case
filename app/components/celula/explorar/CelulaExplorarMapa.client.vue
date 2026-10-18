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
import { columna } from '~/utils/celulaExplorador'
import type { RGB } from '~/utils/celulaExploradorColor'

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
}>()
const emit = defineEmits<{ error: [string] }>()

const el = ref<HTMLElement | null>(null)
const cargando = ref(true)
let motor: { pinta: (e: any) => void; desmonta: () => void } | null = null

function entrada() {
  return {
    uid: `exp-${props.d.lesion}-${props.modo}-${props.gen}-${props.modo === 'coexp' ? props.genB : ''}-${props.tema}-${props.lang}`,
    tema: props.tema, alto: 520, umap: props.d.celulas.umap, lang: props.lang, rotulos: props.modo === 'grupo',
    conjuntos: props.conjuntos, colores: props.colores, colorearPor: props.colorearPor,
    gen: props.modo === 'gen' ? { simbolo: props.gen, valores: columna(props.d, props.gen) } : null,
    etiquetas: { mapa: props.lang === 'en' ? 'Cell map (UMAP)' : 'Mapa de células (UMAP)' },
  }
}

onMounted(async () => {
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
watch(() => [props.d, props.modo, props.gen, props.genB, props.conjuntos, props.colores, props.tema, props.lang], () => {
  if (!motor) return
  cargando.value = true
  motor.pinta(entrada())
  if (velo) clearTimeout(velo)
  velo = setTimeout(() => { cargando.value = false }, 1100)
})
onBeforeUnmount(() => { if (velo) clearTimeout(velo); motor?.desmonta(); motor = null })
</script>

<template>
  <div class="exp-mapa">
    <p v-if="cargando" class="exp-mapa__carga" role="status">{{ lang === 'en' ? 'Loading the map…' : 'Cargando el mapa…' }}</p>
    <div
      ref="el"
      class="exp-mapa__lienzo"
      role="group"
      :aria-label="lang === 'en'
        ? 'Visual map of the cells (UMAP). It is used with a mouse or a finger and has no keyboard version. The n per group and the per-gene figures are in the lists and tables below; the position of each cell, only here.'
        : 'Mapa visual de las células (UMAP). Se maneja con ratón o con el dedo y no tiene versión de teclado. Los n por grupo y las cifras por gen están en las listas y tablas de abajo; la posición de cada célula, solo aquí.'"
    />
  </div>
</template>

<style scoped>
.exp-mapa { position: relative; min-height: 520px; border-radius: var(--radius-card); overflow: hidden; border: 1px solid var(--trazo-medio); background: var(--fondo); }
.exp-mapa__lienzo { position: relative; height: 520px; }
.exp-mapa__carga { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; margin: 0; background: var(--fondo); font: var(--tipo-body-sm); color: var(--texto-2); }
/* Vitessce pinta sus propios fondos (blanco / #333 / negro): aquí manda el tema del sistema */
.exp-mapa :deep(.vitessce-container),
.exp-mapa :deep(.vitessce-container .card),
.exp-mapa :deep(.vitessce-container [class*="card"]),
.exp-mapa :deep(.vitessce-container .react-grid-item) { background: var(--fondo) !important; color: var(--texto-1) !important; }
/* fuera: el lazo (crearía selecciones que la página no usa), el menú de opciones y la ayuda (en inglés) */
.exp-mapa :deep(button[title="Select lasso"]),
.exp-mapa :deep([aria-label="Open plot options menu"]),
.exp-mapa :deep([aria-label="Open help info"]) { display: none !important; }
</style>
