<script setup lang="ts">
/**
 * Ruta de pasos (sistema v3, S4): una barra de pasos y la lista de lo que hay en cada uno, con UN solo mapa de estado a
 * insignia (utils/estadoInsignia.ts, que usa los --estado-* del canon). Sustituye a `.pp__seg` (/ciencia), `.hpp__seg`
 * (home) y a la lista de CelulaProximosPasos: dos implementaciones y dos significados de «en curso».
 *
 * · Solo los pasos `hecho` cuentan como dados; `curso` se dice aparte y no suma.
 * · El estado nunca es solo color: cada tramo de la barra tiene forma propia (lleno, medio, vacío, a rayas, discontinuo)
 *   y cada fila lleva insignia con icono y palabra. Sin animaciones.
 * · Barra con role="progressbar" y el mismo texto a la vista (`progreso`).
 * · Las palabras de los estados las pone quien lo usa (`etiquetas`): el componente no trae copy.
 */
import { ESTADO_A_SISTEMA, insigniaDe, pasosHechos, type PasoRuta } from '~/utils/estadoInsignia'
const props = defineProps<{
  pasos: PasoRuta[]
  /** el texto de la barra, p. ej. «2 de 5 pasos dados» (viene de i18n) */
  progreso: string
  /** palabra de cada estado de proceso que aparece en `pasos` */
  etiquetas: Record<string, string>
}>()

const hechos = computed(() => pasosHechos(props.pasos))
const sistema = (estado: string) => ESTADO_A_SISTEMA[estado] ?? 'pendiente'
const idBarra = useId()
</script>

<template>
  <div class="ruta-pasos">
    <p :id="idBarra" class="ruta-pasos__progreso h4-tarjeta">{{ progreso }}</p>
    <div
      class="ruta-pasos__barra"
      role="progressbar"
      :aria-labelledby="idBarra"
      aria-valuemin="0"
      :aria-valuemax="pasos.length"
      :aria-valuenow="hechos"
      :aria-valuetext="progreso"
    >
      <span v-for="p in pasos" :key="p.id" class="ruta-pasos__tramo" :class="`ruta-pasos__tramo--${sistema(p.estado)}`" aria-hidden="true" />
    </div>
    <ol class="ruta-pasos__lista">
      <li v-for="(p, i) in pasos" :key="p.id" class="ruta-pasos__paso">
        <span class="ruta-pasos__num" aria-hidden="true">{{ i + 1 }}</span>
        <Icon v-if="p.icono" :name="p.icono" class="ruta-pasos__icono" aria-hidden="true" />
        <span class="ruta-pasos__texto">
          <span class="ruta-pasos__titulo">{{ p.titulo }}</span>
          <span v-if="p.detalle" class="ruta-pasos__detalle">{{ p.detalle }}</span>
        </span>
        <span class="status-badge" :class="insigniaDe(p.estado)">{{ etiquetas[p.estado] ?? p.estado }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ruta-pasos__progreso { margin: 0; }
.ruta-pasos__barra { display: flex; gap: var(--sp-4); margin-top: var(--sp-12); }
.ruta-pasos__tramo {
  flex: 1 1 0; height: 12px; border-radius: var(--radius-sm); box-sizing: border-box;
  border: 2px solid var(--trazo-interactivo); /* >= 3:1 sobre el fondo (WCAG 1.4.11) */
}
.ruta-pasos__tramo--hecho { background: var(--identidad); border-color: var(--identidad); }
.ruta-pasos__tramo--curso { background: linear-gradient(90deg, var(--identidad) 50%, transparent 50%); border-color: var(--identidad); }
.ruta-pasos__tramo--pendiente { background: transparent; }
.ruta-pasos__tramo--nopuede { background: repeating-linear-gradient(135deg, var(--trazo-interactivo) 0 2px, transparent 2px 6px); }
.ruta-pasos__tramo--atencion { background: transparent; border-style: dashed; border-color: var(--texto-1); }
@media (forced-colors: active) {
  .ruta-pasos__tramo { border-color: CanvasText; }
  .ruta-pasos__tramo--hecho { background: CanvasText; }
  .ruta-pasos__tramo--curso { background: linear-gradient(90deg, CanvasText 50%, transparent 50%); }
}
.ruta-pasos__lista { list-style: none; margin: var(--sp-16) 0 0; padding: 0; display: grid; gap: var(--sp-8); }
.ruta-pasos__paso { display: flex; align-items: center; gap: var(--sp-12); min-height: var(--control-min); }
.ruta-pasos__num {
  flex: none; width: 1.75rem; height: 1.75rem; display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--radius-pill); background: var(--trazo-sutil); color: var(--texto-1); font: 600 var(--texto-xs)/1 var(--font-mono);
}
.ruta-pasos__icono { flex: none; width: 1.125rem; height: 1.125rem; color: var(--texto-1); }
.ruta-pasos__texto { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.ruta-pasos__titulo { font: var(--tipo-body-sm); color: var(--texto-1); }
.ruta-pasos__detalle { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
</style>
