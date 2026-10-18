<script setup lang="ts">
/** R4 · ¿Lo ve el sistema inmune? Texto aprobado (17-oct-2026). Figura: cuadrícula de «cada 100» del hígado, sin ningún punto relleno y con un contorno rotulado «menos de 1». */
import { fmtN, type Bloque, type R4 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number }>()
const d = computed(() => props.b.datos as R4)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
</script>

<template>
  <CelulaBloque clave="R4" :titulo="L('¿Lo ve el sistema inmune?', 'Can the immune system see it?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__texto">{{ L('Hay muy pocos linfocitos T, las células de defensa que reconocen al tumor: en torno a 1 de cada 100 células del hígado, o menos. Es lo que se llama un tumor «frío». La prueba también muestra que la maquinaria con la que el tumor enseña sus proteínas a las defensas sale más baja en el ARN que en las células sanas. Saberlo orienta qué tipo de tratamiento inmune tiene más sentido.',
      'There are very few T cells, the defense cells that recognize the tumor: around 1 in 100 liver cells, or fewer. This is what is called a “cold” tumor. The test also shows that the machinery the tumor uses to show its proteins to the defenses comes out lower in the RNA than in healthy cells. Knowing this helps point to which type of immune treatment makes the most sense.') }}</p>
    <figure class="r4" :aria-label="L('Hígado: linfocitos T', 'Liver: T cells')">
      <div class="r4__rej"><CelulaRejilla :por="d.higado.por_100" :base="base" :menos="d.higado.menos_de" /></div>
      <figcaption class="r4__cap">
        <span class="r4__lg"><Icon name="ph:drop-half-fill" aria-hidden="true" />{{ L('Hígado, linfocitos T', 'Liver, T cells') }}</span>
        <span class="r4__cifra">
          <svg class="r4__aro" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><rect x="1" y="1" width="10" height="10" rx="3" /></svg>
          <template v-if="d.higado.menos_de">{{ L('menos de', 'fewer than') }} </template><template v-else-if="d.higado.o_menos">{{ L('en torno a', 'around') }} </template>{{ f(d.higado.por_100) }}
          <span class="r4__de">{{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }}<template v-if="d.higado.o_menos">{{ L(', o menos', ', or fewer') }}</template></span>
        </span>
      </figcaption>
    </figure>
  </CelulaBloque>
</template>

<style scoped>
.r4 { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-16) var(--sp-32); }
.r4__rej { flex: 0 1 200px; min-width: 140px; }
.r4__cap { display: grid; gap: var(--sp-8); }
.r4__lg { display: flex; align-items: center; gap: var(--sp-8); font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-2); }
.r4__lg svg { width: 18px; height: 18px; flex: none; color: var(--identidad); }
.r4__cifra { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); font: 700 var(--texto-xl)/1.1 var(--font-display); letter-spacing: var(--track-cifra); color: var(--texto-1); }
.r4__aro { width: 26px; height: 26px; flex: none; }
.r4__aro rect { fill: none; stroke: var(--cta-texto); stroke-width: 1.6; stroke-dasharray: 2.6 1.8; }
.r4__de { font: 400 var(--texto-xs)/1.2 var(--font-body); color: var(--texto-2); letter-spacing: 0; }
</style>
