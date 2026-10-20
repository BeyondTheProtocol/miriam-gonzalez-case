<script setup lang="ts">
/**
 * DianaMapaCelulas — el mapa de células (UMAP) de UNA biopsia del explorador publicado, en pequeño y quieto, con las
 * células donde se lee el ARN de un gen (≥ 1 molécula, lo que el explorador pinta fuera del gris en su modo gen).
 *
 * Sin cifras a propósito: ni recuentos ni porcentajes (esos, con su suelo ambiental y su referencia, viven en el
 * explorador, a un clic). El grupo de interés va en un tono más oscuro de la tinta para que se vea DÓNDE caen las
 * células que leen el gen; el color nunca va solo (leyenda en texto debajo). Canvas 2D: no hace falta WebGL.
 */
import type { LesionDatos } from '~/utils/celulaExplorador'
import { detectadas } from '~/utils/tresDianas'

const props = defineProps<{ d: LesionDatos; gen: string; etiqueta: string }>()

const lienzo = ref<HTMLCanvasElement | null>(null)
let ro: ResizeObserver | null = null

function dibuja() {
  const c = lienzo.value
  if (!c) return
  const lado = c.clientWidth || 200
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(lado * dpr); c.height = Math.round(lado * dpr)
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, lado, lado)

  const css = getComputedStyle(c)
  const tinta = css.getPropertyValue('--color-text-rgb').trim().split(/\s+/).join(',')
  const violeta = css.getPropertyValue('--color-miriam-rgb').trim().split(/\s+/).join(',')
  const u = props.d.celulas.umap, n = props.d.n_celulas
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (let i = 0; i < n; i++) { const x = u[2 * i]!, y = u[2 * i + 1]!; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const m = 8, esc = (lado - 2 * m) / Math.max(x1 - x0, y1 - y0 || 1)
  const ox = m + (lado - 2 * m - (x1 - x0) * esc) / 2, oy = m + (lado - 2 * m - (y1 - y0) * esc) / 2
  const px = (i: number) => ox + (u[2 * i]! - x0) * esc
  const py = (i: number) => lado - (oy + (u[2 * i + 1]! - y0) * esc)   // y hacia arriba, como en el explorador
  const r = n > 8000 ? 0.9 : 1.6
  const interes = props.d.grupos.findIndex((g) => g.rol === 'interes')

  // 1) todas las células, gris de tinta; 2) el grupo de interés, tinta más oscura; 3) encima, las que leen el gen
  ctx.fillStyle = `rgba(${tinta},0.16)`
  for (let i = 0; i < n; i++) if (props.d.celulas.grupo[i] !== interes) ctx.fillRect(px(i) - r, py(i) - r, 2 * r, 2 * r)
  ctx.fillStyle = `rgba(${tinta},0.42)`
  for (let i = 0; i < n; i++) if (props.d.celulas.grupo[i] === interes) ctx.fillRect(px(i) - r, py(i) - r, 2 * r, 2 * r)
  ctx.fillStyle = `rgb(${violeta})`
  const rd = r + 0.4
  for (const i of detectadas(props.d.expr, props.gen)) ctx.fillRect(px(i) - rd, py(i) - rd, 2 * rd, 2 * rd)
}

onMounted(() => {
  dibuja()
  if (lienzo.value) { ro = new ResizeObserver(dibuja); ro.observe(lienzo.value) }
})
watch(() => [props.d, props.gen], dibuja)
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <canvas ref="lienzo" class="dm" role="img" :aria-label="etiqueta" />
</template>

<style scoped>
.dm { display: block; width: 100%; aspect-ratio: 1 / 1; border-radius: var(--radius-btn); background: var(--superficie); border: 1px solid var(--trazo-medio); }
</style>
