<script setup lang="ts">
/**
 * Resultados del análisis (fase 2). Es el momento «cielo» de la página, como el de /datos: la receta
 * de datos/Cielo.vue (--cielo-resplandor → berenjena) con el tema oscuro del sistema (data-tema), así
 * los roles (--texto-1, --identidad…) se remapean solos.
 *
 * SIN RESULTADOS VISIBLES NO EXISTE NADA: ni título, ni contenedor, ni hueco (v-if del conjunto).
 * Qué es visible lo decide una sola puerta (app/utils/celulaResultados.ts, con test): sello
 * «verificado» y OK de Miriam. `?demo=1` (solo fuera de producción) enseña el ejemplo con su rótulo.
 */
import { ORDEN_BLOQUES } from '~/utils/celulaResultados'
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const { res, demo, visibles } = useCelulaResultados()
const id = useId()
const mostrar = (k: string) => visibles.value.includes(k as never)
</script>

<template>
  <section v-if="visibles.length" id="resultados" class="cel-cielo" data-tema="oscuro" :aria-labelledby="id">
    <div v-if="demo" class="cel-cielo__demo" role="note">
      <strong>{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</strong>
      {{ L('Las cifras de esta vista son inventadas y solo sirven para ver cómo quedará la página. No son de Miriam.', 'The figures in this view are made up and only show how the page will look. They are not Miriam’s.') }}
    </div>
    <p class="eyebrow--sm cel-cielo__eti">{{ L('Lo que ha salido', 'What came out') }}</p>
    <h2 :id="id" class="cel-cielo__t">{{ L('Resultados', 'Results') }}</h2>
    <p class="cel-cielo__p">
      {{ L('Cada bloque se publica cuando está verificado y Miriam le ha dado el visto bueno, así que pueden ir apareciendo de uno en uno. Todo describe estas dos muestras, y cada una es un trozo pequeño de una lesión. Las cifras salen del análisis que hace Polaris, el sistema de Miriam, con los datos del laboratorio, no del informe del laboratorio. Cuando algo es opinión del laboratorio, la página lo dice.',
        'Each block is published once it has been verified and Miriam has approved it, so they may appear one at a time. Everything describes these two samples, and each one is a small piece of one lesion. The figures come from the analysis that Polaris, Miriam’s system, runs on the lab’s data, not from the lab’s report. When something is the lab’s opinion, the page says so.') }}
    </p>
    <div class="cel-cielo__bloques">
      <template v-for="k in ORDEN_BLOQUES" :key="k">
        <CelulaR0 v-if="k === 'R0' && mostrar(k)" :b="res.bloques.R0!" />
        <CelulaR3 v-else-if="k === 'R3' && mostrar(k)" :b="res.bloques.R3!" :base="res.por_cada" />
        <CelulaR4 v-else-if="k === 'R4' && mostrar(k)" :b="res.bloques.R4!" :base="res.por_cada" />
        <CelulaR5 v-else-if="k === 'R5' && mostrar(k)" :b="res.bloques.R5!" />
        <CelulaR6 v-else-if="k === 'R6' && mostrar(k)" :b="res.bloques.R6!" />
      </template>
    </div>
  </section>
</template>

<style scoped>
.cel-cielo {
  background: radial-gradient(120% 90% at 70% 0%, var(--cielo-resplandor) 0%, var(--color-text) 70%);
  color: var(--texto-1); border-radius: var(--radius-card); overflow: hidden;
  padding: var(--sp-24) var(--sp-16);
}
@media (min-width: 640px) { .cel-cielo { padding: var(--sp-48) var(--sp-32); } }
.cel-cielo__demo {
  margin: 0 0 var(--sp-24); padding: var(--sp-12) var(--sp-16); border: 2px dashed var(--cta-texto); border-radius: var(--radius-btn);
  color: var(--texto-1); font: 600 var(--texto-sm)/1.45 var(--font-body);
}
.cel-cielo__demo strong { display: block; color: var(--cta-texto); font: 700 var(--texto-sm)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); }
.cel-cielo__eti { margin: 0 0 var(--sp-8); color: var(--texto-2); }
.cel-cielo__t { font: var(--tipo-h2); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.cel-cielo__p { font: var(--tipo-body); color: var(--texto-2); max-width: var(--measure); margin: 0 0 var(--sp-24); }
.cel-cielo__bloques { display: grid; gap: var(--sp-16); }
@media (min-width: 640px) { .cel-cielo__bloques { gap: var(--sp-24); } }
</style>
