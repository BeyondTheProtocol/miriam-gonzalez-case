<script setup lang="ts">
/**
 * Tip — el readout de un punto, pegado a él (ratón en escritorio; teclado con foco). Se coloca
 * encima del punto; si no cabe, debajo DENTRO del gráfico; si tampoco, al lado. Nunca se sale del ancho
 * ni del alto del gráfico (así no tapa el texto de fuera, a 375 px tampoco).
 * No recibe el puntero (no roba el hover) y va oculto al lector de pantalla: lo que dice ya está en
 * el aria-valuetext del gráfico, que es lo que se anuncia.
 */
const props = defineProps<{ x: number; y: number; ancho: number; alto: number }>()
const caja = ref<HTMLElement | null>(null)
const tam = ref({ w: 0, h: 0 })
// solo se reasigna si cambia: un objeto nuevo en cada onUpdated re-renderizaba en bucle (stack overflow)
const medir = () => {
  if (!caja.value) return
  const w = caja.value.offsetWidth, h = caja.value.offsetHeight
  if (w !== tam.value.w || h !== tam.value.h) tam.value = { w, h }
}
onMounted(medir)
onUpdated(medir)
const pos = computed(() => {
  const { w, h } = tam.value
  const cabeX = (l: number) => Math.max(4, Math.min(props.ancho - w - 4, l))
  let left = cabeX(props.x - w / 2), top = props.y - h - 10
  if (top < 0) {
    if (props.y + 14 + h <= props.alto) top = props.y + 14 // debajo, sin salir del gráfico
    else { // al lado: donde haya sitio, centrado en vertical y dentro del alto
      left = props.x + 14 + w <= props.ancho ? props.x + 14 : cabeX(props.x - 14 - w)
      top = Math.max(0, Math.min(props.alto - h, props.y - h / 2))
    }
  }
  return { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
})
</script>

<template>
  <div ref="caja" class="tip" :style="pos" aria-hidden="true"><slot /></div>
</template>

<style scoped>
.tip { position: absolute; z-index: 5; pointer-events: none; max-width: min(260px, calc(100% - 8px)); padding: 7px 10px; border-radius: 10px;
  background: var(--viz-tooltip-bg); color: var(--viz-tooltip-text); font: 400 12px/1.4 var(--font-body); box-shadow: 0 6px 18px rgb(0 0 0 / 0.18); }
.tip :deep(.tip__n) { display: block; font: 500 11px var(--font-body); opacity: 0.75; }
.tip :deep(.tip__v) { display: block; font: 700 14px var(--font-mono); }
.tip :deep(.tip__l) { display: block; font: 500 11px var(--font-mono); opacity: 0.85; }
</style>
