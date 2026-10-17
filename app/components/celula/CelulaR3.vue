<script setup lang="ts">
/** R3 · Qué genes están activos en el tumor. Texto aprobado (17-oct-2026). Figura: cuadrículas de «cada 100» de NY-BR-1 y 5T4 en las dos lesiones; PRAME y MAGE-A4 a 0. */
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
    <p class="blq__texto">{{ L('Cerca de la mitad de las células tumorales tienen activo el gen NY-BR-1, y una de cada cuatro el 5T4. El patrón se repite igual en el hígado y en el hueso. HER3 también aparece. Dos genes muy buscados en otros tumores, PRAME y MAGE-A4, no están, y saberlo también ayuda a elegir el camino.',
      'Around half of the tumor cells have the NY-BR-1 gene switched on, and one in four have 5T4. The pattern is the same in the liver and the bone. HER3 shows up too. Two genes much sought after in other tumors, PRAME and MAGE-A4, are not there, and knowing that also helps in choosing the path.') }}</p>
    <ul class="r3__genes">
      <li v-for="g in genes" :key="g.gen" class="r3__gen">
        <h4 class="r3__nombre">{{ g.gen }}</h4>
        <div class="r3__par">
          <figure v-for="m in MUESTRAS" :key="m" class="r3__fig" :aria-label="nombre(m)">
            <figcaption class="r3__cap"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</figcaption>
            <CelulaRejilla :por="de(m, g.gen).por_100" :base="base" />
            <p class="r3__cifra"><span v-if="de(m, g.gen).aprox" aria-hidden="true">~</span>{{ f(de(m, g.gen).por_100) }} <span class="r3__de">{{ L(`de cada ${f(base)}`, `in every ${f(base)}`) }}</span></p>
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
.r3__de { font: 400 var(--texto-xs)/1.2 var(--font-body); color: var(--texto-2); letter-spacing: 0; }
.r3__a { display: flex; align-items: center; gap: var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 1px dashed var(--trazo-medio); border-radius: var(--radius-btn); }
.r3__mini { flex: none; width: 72px; }
</style>
