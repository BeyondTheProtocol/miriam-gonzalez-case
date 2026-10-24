<script setup lang="ts">
/**
 * Dato (sistema v3, S4): UN valor con su fuente a la vista. Cumple la promesa de /datos, «la fuente de cada cifra».
 * Sustituye a cinco implementaciones de «valor + fuente + sello» (CifraClave, `.dt-eleg`, `.dt-funcion`,
 * `.stat-readout`, `.stat-number` —esta última sin usos—); QueCambio y LaminillasFicha lo usarán en su fila de valor.
 *
 * · etiqueta (qué es), valor (el número o la frase), unidad, fecha del dato (AAAA-MM-DD o AAAA-MM; sale formateada y
 *   con <time>), sello de evidencia (el de Sello.vue: verificado, inferido, lo dice Miriam…) y fuente (texto + enlace).
 * · `tam`: lg (cifra protagonista), md (la de una rejilla) o sm (una fila de ficha).
 * · El valor lleva tabular-nums para que no baile al cambiar. NUNCA lleva cifras inventadas: lo que se pinta es lo que
 *   se pasa. Una cifra clínica nueva pasa antes por `verificacion` y se cotea contra su fuente.
 * · Sin @container (soporte sin comprobar): `tam` hace de breakpoint.
 */
import { fechaCorta } from '~/utils/datosCaso'

const props = withDefaults(defineProps<{
  etiqueta: string
  valor: string
  unidad?: string
  /** fecha del dato: AAAA-MM-DD o AAAA-MM */
  fecha?: string
  /** sello de evidencia (utils de Sello.vue) */
  sello?: string
  fuente?: { texto: string; href?: string }
  tam?: 'lg' | 'md' | 'sm'
  lang?: 'es' | 'en'
}>(), { unidad: undefined, fecha: undefined, sello: undefined, fuente: undefined, tam: 'md', lang: 'es' })

const fechaLegible = computed(() => (props.fecha ? fechaCorta(props.fecha, props.lang) : ''))
const externa = computed(() => !!props.fuente?.href && /^https?:/.test(props.fuente.href))
</script>

<template>
  <div class="dato" :class="`dato--${tam}`">
    <p class="dato__etiqueta etiqueta">{{ etiqueta }}</p>
    <p class="dato__valor nums">
      <span>{{ valor }}</span><span v-if="unidad" class="dato__unidad"> {{ unidad }}</span>
    </p>
    <p v-if="fecha || sello || fuente" class="dato__pie">
      <time v-if="fecha" :datetime="fecha">{{ fechaLegible }}</time>
      <DatosSello v-if="sello" :s="sello" :lang="lang" />
      <template v-if="fuente">
        <a v-if="fuente.href" :href="fuente.href" class="link-inline" :target="externa ? '_blank' : undefined" :rel="externa ? 'noopener noreferrer' : undefined">{{ fuente.texto }}<span v-if="externa" class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
        <span v-else>{{ fuente.texto }}</span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.dato { display: flex; flex-direction: column; gap: var(--sp-4); min-width: 0; }
.dato__etiqueta { margin: 0; }
.dato__valor { margin: 0; font-family: var(--font-display); font-weight: 600; color: var(--texto-1); letter-spacing: var(--track-cifra); line-height: 1.05; overflow-wrap: anywhere; }
.dato--lg .dato__valor { font-size: clamp(2.5rem, 1.6rem + 3.4vw, 4.25rem); line-height: 0.98; }
.dato--md .dato__valor { font-size: 1.75rem; }
.dato--sm .dato__valor { font-size: var(--texto-lg); line-height: 1.2; }
.dato__unidad { font-family: var(--font-body); font-weight: 500; font-size: var(--texto-ui); letter-spacing: 0; color: var(--texto-2); }
.dato__pie { margin: var(--sp-4) 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-4) var(--sp-12); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
</style>
