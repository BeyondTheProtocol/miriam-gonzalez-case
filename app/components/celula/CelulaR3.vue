<script setup lang="ts">
/** R3 · Qué genes están activos en el tumor. Texto aprobado (17-oct-2026) y corregido tras la auditoría del 18-oct: las cifras son del GRUPO SELECCIONADO de cada lesión (993 en el hígado, 68 en el hueso), no «% de células tumorales»; son detección bruta (parte es fondo); HER3 lo tienen igual las células sanas del hígado; 5T4 del hueso en el límite frente al fondo. Figura: cuadrículas de «cada 100» del grupo, con su n; PRAME y MAGE-A4 a 0. */
import { fmtN, MUESTRAS, type Bloque, type R3 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number }>()
const d = computed(() => props.b.datos as R3)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const f = (n: number) => fmtN(n, lang.value)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
// los genes salen del JSON del hígado; el hueso trae los mismos (lo comprueba la puerta)
const genes = computed(() => d.value.muestras.higado.dianas)
const de = (m: 'higado' | 'hueso', gen: string) => d.value.muestras[m].dianas.find((q) => q.gen === gen)!
</script>

<template>
  <CelulaBloque clave="R3" :titulo="L('Qué genes están activos en el tumor', 'Which genes are active in the tumor')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__texto">{{ L('En las dos biopsias destacan dos genes del tumor: NY-⁠BR-⁠1 y 5T4. Se miden en las células tumorales que se pueden identificar con más claridad, un grupo seleccionado y no el tumor entero. En ese grupo, NY-⁠BR-⁠1 se lee en algo más de la mitad de las células y 5T4 en una de cada cuatro.',
      'Two tumor genes stand out in both biopsies: NY-⁠BR-⁠1 and 5T4. They are measured in the tumor cells that can be identified most clearly, a selected group rather than the whole tumor. In that group, NY-⁠BR-⁠1 is detected in just over half of the cells and 5T4 in one in four.') }}</p>
    <p class="blq__texto">{{ L('Parte de esa señal es ruido de fondo de la muestra, así que la cifra real es bastante menor. En el hueso, el 5T4 está todavía en el límite frente a las células no tumorales de la misma muestra. HER3 también aparece, pero las células sanas del hígado lo tienen igual o más.',
      'Part of that signal is background noise from the sample, so the real figure is a good deal lower. In the bone, 5T4 is still borderline against the non-tumor cells from the same sample. HER3 shows up too, but healthy liver cells have it just as much or more.') }}</p>
    <p class="blq__texto">{{ L('Dos genes muy buscados en otros tumores, PRAME y MAGE-⁠A4, no aparecen en el ARN por encima del fondo en ninguna de las dos biopsias, y saberlo también ayuda a elegir el camino.',
      'Two genes much sought after in other tumors, PRAME and MAGE-⁠A4, do not appear in the RNA above background in either biopsy, and knowing that also helps in choosing the path.') }}</p>
    <ul class="r3__genes">
      <li v-for="g in genes" :key="g.gen" class="r3__gen">
        <h4 class="r3__nombre">{{ g.gen }}</h4>
        <div class="r3__par">
          <figure v-for="m in MUESTRAS" :key="m" class="r3__fig" :aria-label="nombre(m)">
            <figcaption class="r3__cap"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</figcaption>
            <CelulaRejilla :por="de(m, g.gen).por_100" :base="base" />
            <p class="r3__cifra"><span v-if="de(m, g.gen).aprox" aria-hidden="true">~</span>{{ f(de(m, g.gen).por_100) }} <span class="r3__de">{{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }}</span></p>
            <p v-if="d.muestras[m].n_grupo" class="r3__n">{{ L(`del grupo de ${f(d.muestras[m].n_grupo!)}\u00a0células`, `of the group of ${f(d.muestras[m].n_grupo!)}\u00a0cells`) }}</p>
          </figure>
        </div>
      </li>
    </ul>
    <ul class="r3__aus">
      <li v-for="a in d.ausentes" :key="a.gen" class="r3__a">
        <div class="r3__mini"><CelulaRejilla :por="a.por_100" :base="base" /></div>
        <div>
          <p class="r3__nombre r3__nombre--a">{{ a.gen }}</p>
          <p class="r3__cifra r3__cifra--a">{{ f(a.por_100) }} <span class="r3__de">{{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }}</span></p>
        </div>
      </li>
    </ul>
  </CelulaBloque>
</template>

<style scoped>
.r3__genes, .r3__aus { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--sp-16); }
@media (min-width: 900px) { .r3__genes, .r3__aus { grid-template-columns: 1fr 1fr; gap: var(--sp-24); } }
.r3__aus { margin-top: var(--sp-16); }
.r3__gen { padding: var(--sp-12) var(--sp-16) var(--sp-16); border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.r3__nombre { font: 700 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.r3__nombre--a { font-size: var(--texto-base); margin: 0 0 var(--sp-4); }
.r3__par { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-16); }
.r3__fig { margin: 0; min-width: 0; }
.r3__cap { display: flex; align-items: center; gap: var(--sp-8); font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-2); margin-bottom: var(--sp-8); }
.r3__cap svg { width: 18px; height: 18px; flex: none; color: var(--identidad); }
.r3__fig :deep(.rej) { max-width: 180px; }
.r3__cifra { margin: var(--sp-8) 0 0; font: 700 var(--texto-xl)/1.1 var(--font-display); letter-spacing: var(--track-cifra); color: var(--texto-1); }
.r3__cifra--a { margin: 0; }
.r3__de { white-space: nowrap; font: 400 var(--texto-xs)/1.2 var(--font-body); color: var(--texto-2); letter-spacing: 0; }
.r3__n { margin: var(--sp-4) 0 0; font: 400 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.r3__a { display: flex; align-items: center; gap: var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 1px dashed var(--trazo-medio); border-radius: var(--radius-btn); }
.r3__mini { flex: none; width: 72px; }
</style>
