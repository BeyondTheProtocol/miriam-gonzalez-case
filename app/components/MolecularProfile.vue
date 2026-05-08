<template>
  <div class="card-base overflow-hidden">
    <h3 id="perfil-molecular-title" class="font-display font-semibold text-ink-900 text-lg mb-6">
      {{ locale === 'es' ? 'Perfil molecular (TSO500, tejido primario 2024)' : 'Molecular profile (TSO500, primary tissue 2024)' }}
    </h3>

    <div class="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
      <table class="w-full text-sm" aria-labelledby="perfil-molecular-title">
        <caption class="sr-only">{{ locale === 'es' ? 'Perfil molecular: marcadores, resultados y notas clínicas del análisis TSO500' : 'Molecular profile: markers, results and clinical notes from TSO500 analysis' }}</caption>
        <thead>
          <tr class="border-b-2 border-ink-200">
            <th scope="col" class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap">
              {{ locale === 'es' ? 'Marcador' : 'Marker' }}
            </th>
            <th scope="col" class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap">
              {{ locale === 'es' ? 'Resultado' : 'Result' }}
            </th>
            <th scope="col" class="text-left py-2 font-semibold text-ink-800">
              {{ locale === 'es' ? 'Nota clínica' : 'Clinical note' }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in markers"
            :key="i"
            class="border-b border-ink-100 last:border-0"
            :class="row.highlight ? 'bg-gold-50/50' : ''"
          >
            <td class="py-2.5 pr-4 font-mono text-xs font-medium text-ink-900 whitespace-nowrap">
              {{ row.marker }}
            </td>
            <td class="py-2.5 pr-4 text-ink-700 whitespace-nowrap">
              <span v-if="row.highlight" class="tag-gold text-2xs">{{ row.result }}</span>
              <span v-else>{{ row.result }}</span>
            </td>
            <td class="py-2.5 text-ink-700 text-xs leading-relaxed">
              {{ row.note }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-ink-600 leading-relaxed">
      {{ locale === 'es'
        ? '⁺ La categoría HER2-ultralow (tinción de membrana en <10% de las células) está presente en este caso según los datos del estudio DIPCAN / MD Anderson Madrid.'
        : '⁺ The HER2-ultralow category (membrane staining in <10% of cells) is present in this case according to data from the DIPCAN study / MD Anderson Madrid.'
      }}
    </p>
    <p class="mt-2 text-xs text-ink-600 leading-relaxed">
      {{ locale === 'es'
        ? '⁺⁺ En oncología neuroendocrina, el Ki67 es el marcador principal de gradación: G1 (<3%), G2 (3–20%), G3 (>20%). Un Ki67 del 60% corresponde a un carcinoma neuroendocrino de alto grado (NEC G3), con un comportamiento biológico mucho más agresivo que el cáncer de mama luminal convencional.'
        : '⁺⁺ In neuroendocrine oncology, Ki67 is the primary grading marker: G1 (<3%), G2 (3–20%), G3 (>20%). A Ki67 of 60% corresponds to a high-grade neuroendocrine carcinoma (NEC G3), with a biologically far more aggressive behaviour than conventional luminal breast cancer.'
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

const markers = computed(() =>
  locale.value === 'es'
    ? [
        { marker: 'FGFR1', result: 'Amplificado ×13', note: 'Driver principal; resistencia a CDK4/6i, sensibilidad a everolimus', highlight: true },
        { marker: 'CCND1', result: 'Amplificado ×20', note: 'Cluster 11q13', highlight: true },
        { marker: 'FGF3/4/19', result: 'Amplificado ×18', note: 'Cluster 11q13', highlight: true },
        { marker: 'Dif. NE', result: '~80% (CgA, SYN)', note: 'Subtipo BC-NED: biología neuroendocrina dominante', highlight: true },
        { marker: 'Ki67', result: '60%', note: 'Alto índice proliferativo en mama. En tumores neuroendocrinos, Ki67 ≥20% define el grado de agresividad: un 60% sitúa este tumor en grado 3 (NEC) ⁺⁺', highlight: false },
        { marker: 'TMB / MSI', result: 'Baja / Baja', note: '---', highlight: false },
        { marker: 'SNVs/INDELs', result: 'Ninguna patogénica', note: 'Sin fusiones detectadas', highlight: false },
        { marker: 'PIK3CA / ESR1', result: 'No detectados en tejido', note: 'Pendiente análisis complementario', highlight: false },
        { marker: 'HER2', result: 'Negativo (0)', note: 'Tinción negativa', highlight: false },
        { marker: 'RP', result: 'Positivo', note: 'En evaluación', highlight: false },
      ]
    : [
        { marker: 'FGFR1', result: 'Amplified ×13', note: 'Main driver; CDK4/6i resistance, everolimus sensitivity', highlight: true },
        { marker: 'CCND1', result: 'Amplified ×20', note: '11q13 cluster', highlight: true },
        { marker: 'FGF3/4/19', result: 'Amplified ×18', note: '11q13 cluster', highlight: true },
        { marker: 'NE Diff.', result: '~80% (CgA, SYN)', note: 'BC-NED subtype: dominant neuroendocrine biology', highlight: true },
        { marker: 'Ki67', result: '60%', note: 'High proliferative index in breast cancer. In neuroendocrine tumours, Ki67 ≥20% defines aggressiveness grade: 60% places this tumour at grade 3 (NEC) ⁺⁺', highlight: false },
        { marker: 'TMB / MSI', result: 'Low / Low', note: '---', highlight: false },
        { marker: 'SNVs/INDELs', result: 'None pathogenic', note: 'No fusions detected', highlight: false },
        { marker: 'PIK3CA / ESR1', result: 'Not detected in tissue', note: 'Pending complementary analysis', highlight: false },
        { marker: 'HER2', result: 'Negative (0)', note: 'Negative staining', highlight: false },
        { marker: 'PR', result: 'Positive', note: 'Under evaluation', highlight: false },
      ]
)
</script>
