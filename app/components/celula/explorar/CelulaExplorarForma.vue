<script setup lang="ts">
/**
 * Bloque plegado «Forma 3D predicha de X (AlphaFold)» en el detalle del gen del explorador: AlphaFold como información
 * de cada proteína, no como página aparte (Miriam, 20-oct-2026). El visor (y con él three.js y el modelo) se monta solo
 * al desplegar y se desmonta al plegar.
 *
 * Componente propio para que el estado «abierto» viva y muera con el <details> (diseno, 20-oct): con ese estado en el
 * explorador, «Volver» y reabrir el mismo gen volvía a montar el bloque plegado pero con el visor dentro, pidiendo el
 * modelo sin que nadie lo desplegara. Mismo aspecto que «Cómo se lee» (.exp__porque del explorador).
 * Por eso, cuando lo abren desde fuera («Forma 3D» junto al título del detalle y «Ver la forma completa» de la vista
 * previa, 21-oct-2026), es con `abre()`: una orden, no un estado que el explorador guarde.
 */
const props = defineProps<{ gen: string; uniprot: string; proteina: string; lang: 'es' | 'en'; tema: 'claro' | 'oscuro' }>()
const emit = defineEmits<{ montado: [HTMLElement] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const abierta = ref(false)
const detalles = ref<HTMLDetailsElement | null>(null)
const sumario = ref<HTMLElement | null>(null)
/** despliega el bloque y lleva el foco a su título; el visor, al montarse, se pone a la vista (montado → aLaVista) */
function abre() {
  const d = detalles.value
  if (!d) return
  sumario.value?.focus({ preventScroll: true })
  if (!d.open) d.open = true
  else emit('montado', d)
}
defineExpose({ abre })
</script>

<template>
  <details ref="detalles" class="fo" @toggle="abierta = ($event.target as HTMLDetailsElement).open">
    <summary ref="sumario">{{ L(`Forma 3D predicha de ${proteina} (AlphaFold)`, `Predicted 3D shape of ${proteina} (AlphaFold)`) }}</summary>
    <LazyCelulaExplorarEstructura v-if="abierta" :gen="gen" :uniprot="uniprot" :proteina="proteina" :lang="lang" :tema="tema" @montado="(el: HTMLElement) => emit('montado', el)" />
  </details>
</template>

<style scoped>
/* el mismo plegado que «Cómo se lee» (.exp__porque de CelulaExplorarExplorador.vue), con un filete encima */
.fo { margin-top: var(--sp-16); padding-top: var(--sp-8); border-top: 1px solid var(--trazo-medio); }
.fo summary { cursor: pointer; list-style-position: inside; min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--identidad); }
.fo summary::-webkit-details-marker { display: none; }
.fo summary::before { content: ''; display: inline-block; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s ease; flex-shrink: 0; margin-right: var(--sp-8); }
.fo[open] summary::before { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .fo summary::before { transition: none; } }
.fo summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.fo[open] > summary { margin-bottom: var(--sp-12); }
</style>
