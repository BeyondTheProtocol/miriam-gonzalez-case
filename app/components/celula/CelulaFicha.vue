<script setup lang="ts">
/**
 * Bloque 7 · Ficha técnica, plegada (<details class="notes-disclosure">, patrón del sistema).
 * Sin ninguna cifra del experimento: ni número de células ni calidad de las muestras.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const { hayReales } = useCelulaResultados()
const filas = computed<[string, string][]>(() => [
  [L('Técnica', 'Technique'), L('10x Genomics Flex: lectura de ARN por sondas, célula a célula.', '10x Genomics Flex: probe-based RNA reading, cell by cell.')],
  [L('Muestras', 'Samples'), L('Dos: una metástasis de hígado y una de hueso, ambas incluidas en parafina.', 'Two: a liver metastasis and a bone metastasis, both embedded in paraffin.')],
  [L('Qué mide', 'What it measures'), L('Qué genes del panel de sondas están expresados en cada célula.', 'Which genes in the probe panel are expressed in each cell.')],
  [L('Qué no mide', 'What it does not measure'), L('Mutaciones, receptores de linfocitos T, genes sin sonda (por ejemplo HLA-\u2060A, -\u2060B y -\u2060C) ni proteínas.', 'Mutations, T-cell receptors, genes without a probe (for example HLA-\u2060A, -\u2060B and -\u2060C) or proteins.')],
  [L('Pruebas que lo complementan', 'Tests that complement it'), L('Secuenciación del exoma (mutaciones y neoantígenos) e inmunohistoquímica (proteínas).', 'Exome sequencing (mutations and neoantigens) and immunohistochemistry (proteins).')],
  [L('Estado', 'Status'), hayReales.value
    ? L(`Primeros resultados publicados por bloques, con su sello (a ${fechaEstado('es')}).`, `First results published block by block, each with its seal (as of ${fechaEstado('en')}).`)
    : L(`Análisis en marcha. Sin resultados a ${fechaEstado('es')}.`, `Analysis under way. No results as of ${fechaEstado('en')}.`)],
])
</script>

<template>
  <details class="notes-disclosure cel-ficha">
    <summary>{{ L('Ficha técnica', 'Technical sheet') }}</summary>
    <dl class="cel-ficha__dl">
      <div v-for="f in filas" :key="f[0]" class="cel-ficha__f">
        <dt>{{ f[0] }}</dt>
        <dd>{{ f[1] }}</dd>
      </div>
    </dl>
  </details>
</template>

<style scoped>
.cel-ficha__dl { margin: var(--sp-12) 0 var(--sp-4); display: grid; gap: var(--sp-12); }
.cel-ficha__f { display: grid; gap: 2px; }
@media (min-width: 640px) { .cel-ficha__f { grid-template-columns: 200px 1fr; gap: var(--sp-16); } }
.cel-ficha dt { font: 500 var(--texto-xs)/1.5 var(--font-mono); letter-spacing: 0.04em; color: var(--color-text-soft); text-transform: uppercase; }
.cel-ficha dd { margin: 0; color: var(--color-text); font: var(--tipo-body-sm); }
</style>
