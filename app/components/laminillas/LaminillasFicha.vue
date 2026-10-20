<script setup lang="ts">
/**
 * Ficha de una laminilla para /laminillas. Cada dato clínico lleva su sello de verificación
 * (verificado / inferido / sin verificar), tal como lo dejó el agente `verificacion` al cotejarlo
 * con los informes originales. Lo que no tiene fuente se dice; no se rellena.
 */
import type { Idioma, Laminilla, Manifest, Sello } from '~/utils/laminillas'

const props = defineProps<{ manifest: Manifest; laminilla: Laminilla; idioma: Idioma; titulo: string }>()
const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
const t = (x: { es: string; en: string } | null | undefined) => (x ? x[props.idioma] : null)

const muestra = computed(() => props.manifest.muestras.find((m) => m.id === props.laminilla.muestra))
const marcador = computed(() => props.manifest.marcadores.find((m) => m.id === props.laminilla.marcador))
const mppTexto = computed(() => props.laminilla.mpp.toLocaleString(props.idioma === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 5 }))

const SELLOS: Record<Sello, { es: string; en: string; icono: string }> = {
  verificado: { es: 'Verificado contra el informe original', en: 'Checked against the original report', icono: 'ph:seal-check-fill' },
  // «inferido» con resultado: el resultado SÍ está en un informe verificado; lo deducido es que este
  // escaneo sea esa laminilla. Sin resultado no se usa (eso es «sin verificar»).
  inferido: { es: 'Resultado del informe; que sea este escaneo se deduce', en: 'Result from the report; that it is this scan is deduced', icono: 'ph:seal-question' },
  'sin-verificar': { es: 'Sin verificar: ningún informe da resultado', en: 'Not verified: no report gives a result', icono: 'ph:seal-warning' },
}
const sello = computed(() => SELLOS[props.laminilla.ficha.sello])
</script>

<template>
  <article class="ficha" :aria-label="L('Ficha de ', 'Record for ') + titulo">
    <h3 class="ficha__titulo">{{ titulo }}</h3>
    <!-- El resultado primero (21-oct, diseno: quedaba bajo el pliegue, tras datos que repiten el título).
         «Marcador» solo si trae nota (p. ej. «SNF»); el nombre ya está en el título. -->
    <dl class="ficha__datos">
      <div class="ficha__resultado">
        <dt>{{ L('Lo que dice el informe', 'What the report says') }}</dt>
        <dd>
          <template v-if="laminilla.ficha.resultado">{{ t(laminilla.ficha.resultado) }}</template>
          <template v-else>{{ L('Ningún informe da un resultado para esta tinción.', 'No report gives a result for this stain.') }}</template>
          <span v-if="laminilla.ficha.fuente" class="ficha__fuente">{{ L('Fuente: ', 'Source: ') }}{{ t(laminilla.ficha.fuente) }}</span>
          <span class="ficha__sello" :data-sello="laminilla.ficha.sello">
            <Icon :name="sello.icono" class="w-4 h-4 shrink-0" aria-hidden="true" />{{ sello[idioma] }}
          </span>
          <span v-if="laminilla.ficha.nota" class="ficha__nota ficha__nota--bloque">{{ t(laminilla.ficha.nota) }}</span>
        </dd>
      </div>
      <div v-if="marcador?.nota"><dt>{{ L('Marcador', 'Marker') }}</dt><dd>{{ t(marcador?.nombre) }}<span class="ficha__nota"> · {{ t(marcador.nota) }}</span></dd></div>
      <div><dt>{{ L('Muestra', 'Sample') }}</dt><dd>{{ t(muestra?.largo) }}<span v-if="laminilla.variante"> · {{ t(laminilla.variante) }}</span></dd></div>
      <div><dt>{{ L('Laboratorio', 'Laboratory') }}</dt><dd>{{ t(laminilla.ficha.laboratorio) ?? L('No consta', 'Not stated') }}</dd></div>
      <div><dt>{{ L('Fecha', 'Date') }}</dt><dd>{{ t(laminilla.ficha.fecha) ?? L('No consta', 'Not stated') }}</dd></div>
      <div><dt>{{ L('Escáner', 'Scanner') }}</dt><dd>{{ muestra?.escaner }} · {{ muestra?.aumento }} · {{ mppTexto }} µm/px</dd></div>
    </dl>
  </article>
</template>

<style scoped>
.ficha { background: var(--color-bg-card); border: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  border-radius: var(--radius-md); padding: var(--sp-16); }
.ficha__titulo { font-family: var(--font-display); font-weight: 600; font-size: var(--texto-lg); color: var(--color-text); margin: 0 0 var(--sp-8); }
.ficha__datos { display: grid; gap: var(--sp-8); margin: 0; }
.ficha__datos > div { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr); gap: var(--sp-8); }
@media (max-width: 480px) { .ficha__datos > div { grid-template-columns: 1fr; gap: 0; } }
.ficha dt { font-size: var(--texto-xs); color: var(--color-text-soft); font-weight: 600; }
.ficha dd { margin: 0; font-size: var(--texto-sm); color: var(--color-text); line-height: 1.5; }
.ficha__fuente { display: block; margin-top: 4px; font-size: var(--texto-xs); color: var(--color-text-soft); }
.ficha__sello { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 2px 8px;
  border-radius: 999px; font-size: var(--texto-xs); font-weight: 600; color: var(--color-text);
  border: 1px solid color-mix(in srgb, var(--color-text) 30%, transparent); }
.ficha__sello[data-sello='verificado'] { background: var(--color-miriam-soft); border-color: transparent; }
/* Misma gramática que el sello de /datos (datos/Sello.vue): verificado = violeta suave, inferido =
   tinte gris, sin verificar = borde discontinuo. Quien la aprendió allí la lee igual aquí. */
.ficha__sello[data-sello='inferido'] { background: rgb(var(--color-text-rgb) / .06); border-color: transparent; }
.ficha__sello[data-sello='sin-verificar'] { background: transparent; border: 1px dashed rgb(var(--color-text-rgb) / .45); }
.ficha__nota { color: var(--color-text-soft); }
.ficha__nota--bloque { display: block; margin-top: 6px; font-size: var(--texto-xs); }
</style>
