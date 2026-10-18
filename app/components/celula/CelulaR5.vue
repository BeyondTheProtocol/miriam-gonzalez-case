<script setup lang="ts">
/** R5 · Hígado y hueso, el mismo tumor. Texto aprobado (17-oct-2026). Figura: dos lesiones gemelas con FGFR1 activo, sin ninguna cifra. */
import { MUESTRAS, type Bloque, type R5 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque }>()
const d = computed(() => props.b.datos as R5)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
</script>

<template>
  <CelulaBloque clave="R5" :titulo="L('Hígado y hueso, el mismo tumor', 'Liver and bone, the same tumor')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__texto">{{ L('Las dos metástasis comparten los mismos genes principales, y la amplificación del gen FGFR1, ya conocida por ADN, se ve activa en las dos. El perfil de copias que se lee en el ARN es compatible con que las dos vengan del mismo clon; la secuenciación del exoma del hígado podrá confirmarlo.',
      'Both metastases share the same main genes, and the amplification of the FGFR1 gene, already known from DNA, shows up as active in both. The copy-number profile read in the RNA is consistent with both coming from the same clone; sequencing the exome of the liver will be able to confirm it.') }}</p>
    <div class="blq__par">
      <figure v-for="m in MUESTRAS" :key="m" class="r5__fig">
        <figcaption class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</figcaption>
        <CelulaLesion halo :alt="L(`Esquema de la lesión de ${nombre(m).toLowerCase()} con ${d.gen} activo.`, `Diagram of the ${nombre(m).toLowerCase()} lesion with ${d.gen} active.`)" />
        <p class="r5__gen"><svg class="r5__aro" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><rect x="1" y="1" width="10" height="10" rx="3" /></svg>{{ d.gen }} <span class="r5__act">{{ L('activo', 'active') }}</span></p>
      </figure>
    </div>
    <p class="blq__nota">{{ L('Esquema ilustrativo: los puntos no son células reales ni su posición un dato.', 'Illustrative diagram: the dots are not real cells and their position is not data.') }}</p>
  </CelulaBloque>
</template>

<style scoped>
.r5__fig { margin: 0; min-width: 0; }
.r5__fig :deep(.les) { max-width: 360px; }
.r5__gen { display: flex; align-items: center; gap: var(--sp-8); margin: var(--sp-8) 0 0; font: 700 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); }
.r5__act { font: 600 var(--texto-sm)/1 var(--font-body); color: var(--texto-2); }
.r5__aro { width: 20px; height: 20px; flex: none; }
.r5__aro rect { fill: none; stroke: var(--cta-texto); stroke-width: 1.6; stroke-dasharray: 2.6 1.8; }
</style>
