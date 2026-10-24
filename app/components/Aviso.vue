<script setup lang="ts">
/**
 * Aviso (sistema v3, S4): el bloque que dice «esto no es lo que parece» o «esto es lo que no cubre». Unifica cuatro
 * implementaciones (`.alert-callout` en melocotón con hex, `.dt-aviso` de /datos, CelulaAviso y `lam__aviso`) y deja de
 * abusar de <Nota> —que es una anotación de navegación, mono de 12 px— para caveats clínicos.
 *
 * · tipo="apoyo"   la herramienta es apoyo a la decisión, no diagnóstico. Puede ir `plegable`.
 * · tipo="legal"   aviso legal o de privacidad.
 * · tipo="limites" lo que esto no dice (límites de un dato o de un método).
 * Cada tipo lleva su icono (decorativo) y un título corto; el título es obligatorio porque es lo que lo nombra para un
 * lector de pantalla. Fondo --superficie, filete izquierdo --identidad, texto de cuerpo (15 px), legible.
 * `Nota` queda solo para «Última actualización».
 *
 * `plegable` usa <details>/<summary> nativos: teclado y lector de pantalla sin JS; el resumen mide 44 px.
 */
const props = withDefaults(defineProps<{
  tipo: 'apoyo' | 'legal' | 'limites'
  titulo: string
  plegable?: boolean
  abierto?: boolean
}>(), { plegable: false, abierto: false })

const ICONO: Record<string, string> = {
  apoyo: 'ph:info',
  legal: 'ph:scales',
  limites: 'ph:warning-circle',
}
const icono = computed(() => ICONO[props.tipo])
</script>

<template>
  <details v-if="plegable" class="aviso" :class="`aviso--${tipo}`" role="note" :open="abierto">
    <summary class="aviso__titulo">
      <Icon :name="icono" class="aviso__icono" aria-hidden="true" />
      <span>{{ titulo }}</span>
    </summary>
    <div class="aviso__cuerpo"><slot /></div>
  </details>
  <div v-else class="aviso" :class="`aviso--${tipo}`" role="note">
    <p class="aviso__titulo">
      <Icon :name="icono" class="aviso__icono" aria-hidden="true" />
      <span>{{ titulo }}</span>
    </p>
    <div class="aviso__cuerpo"><slot /></div>
  </div>
</template>

<style scoped>
.aviso {
  background: var(--superficie); color: var(--texto-1); border-radius: var(--radius-btn);
  border: 1px solid var(--trazo-medio); border-left: 4px solid var(--identidad);
  padding: var(--sp-12) var(--sp-16);
}
.aviso__titulo { display: flex; align-items: center; gap: var(--sp-8); margin: 0; font: var(--tipo-h4); }
.aviso__icono { flex: none; width: 1.25rem; height: 1.25rem; color: var(--identidad); }
.aviso__cuerpo { margin-top: var(--sp-8); font: var(--tipo-body-sm); color: var(--texto-1); max-width: var(--measure); }
.aviso__cuerpo :deep(p) { margin: 0 0 var(--sp-8); }
.aviso__cuerpo :deep(p:last-child) { margin-bottom: 0; }
/* plegable: el resumen es el control (44 px) y su flecha se dibuja en CSS, como en .notes-disclosure */
details.aviso > summary { list-style: none; cursor: pointer; min-height: var(--control-min); margin: calc(-1 * var(--sp-12)) 0; }
details.aviso > summary::-webkit-details-marker { display: none; }
details.aviso > summary::after {
  content: ''; margin-left: auto; width: 7px; height: 7px; flex: none;
  border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg);
  transition: transform var(--dur-micro) var(--curva-salida);
}
details.aviso[open] > summary::after { transform: rotate(-135deg); }
details.aviso > summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { details.aviso > summary::after { transition: none; } }
</style>
