<template>
  <div class="card-base overflow-hidden space-y-10">
    <div>
      <h3
        id="perfil-molecular-title"
        class="font-display font-semibold text-ink-900 text-lg mb-6"
      >
        {{
          locale === 'es'
            ? 'Perfil molecular — tejido primario (TSO500, 2024)'
            : 'Molecular profile — primary tissue (TSO500, 2024)'
        }}
      </h3>

      <div class="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
        <table class="w-full text-sm" aria-labelledby="perfil-molecular-title">
          <caption class="sr-only">
            {{
              locale === 'es'
                ? 'Perfil molecular: marcadores, resultados y notas clínicas del análisis TSO500'
                : 'Molecular profile: markers, results and clinical notes from TSO500 analysis'
            }}
          </caption>
          <thead>
            <tr class="border-b-2 border-ink-200">
              <th
                scope="col"
                class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap"
              >
                {{ locale === 'es' ? 'Marcador' : 'Marker' }}
              </th>
              <th
                scope="col"
                class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap"
              >
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
              <td
                class="py-2.5 pr-4 font-mono text-xs font-medium text-ink-900 whitespace-nowrap"
              >
                {{ row.marker }}
              </td>
              <td class="py-2.5 pr-4 text-ink-700 whitespace-nowrap">
                <span v-if="row.highlight" class="tag-gold text-2xs">{{
                  row.result
                }}</span>
                <span v-else>{{ row.result }}</span>
              </td>
              <td class="py-2.5 text-ink-700 text-xs leading-relaxed">
                {{ row.note }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3
        id="perfil-liquido-title"
        class="font-display font-semibold text-ink-900 text-lg mb-2"
      >
        {{
          locale === 'es'
            ? 'Evidencia de resistencia — biopsia líquida (abril 2026)'
            : 'Resistance evidence — liquid biopsy (April 2026)'
        }}
      </h3>
      <p class="text-xs text-ink-600 leading-relaxed mb-4">
        {{
          locale === 'es'
            ? 'Guardant360 e informe conjunto VHIO/SOLTI (abril 2026). Las amplificaciones FGFR1 y CCND1 se confirman y se mantienen respecto al tejido; en plasma se cuantifican como ~6,95 y ~7,63 copias.'
            : 'Guardant360 and joint VHIO/SOLTI report (April 2026). FGFR1 and CCND1 amplifications are confirmed and persist versus tissue; in plasma these are quantified at ~6.95 and ~7.63 copies.'
        }}
      </p>
      <div class="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
        <table class="w-full text-sm" aria-labelledby="perfil-liquido-title">
          <caption class="sr-only">
            {{
              locale === 'es'
                ? 'Hallazgos en plasma: RB1, ESR1, amplificaciones y notas de resistencia'
                : 'Plasma findings: RB1, ESR1, amplifications and resistance notes'
            }}
          </caption>
          <thead>
            <tr class="border-b-2 border-ink-200">
              <th
                scope="col"
                class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap"
              >
                {{ locale === 'es' ? 'Marcador' : 'Marker' }}
              </th>
              <th
                scope="col"
                class="text-left py-2 pr-4 font-semibold text-ink-800 whitespace-nowrap"
              >
                {{ locale === 'es' ? 'Resultado' : 'Result' }}
              </th>
              <th scope="col" class="text-left py-2 font-semibold text-ink-800">
                {{ locale === 'es' ? 'Nota clínica' : 'Clinical note' }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in liquidMarkers"
              :key="i"
              class="border-b border-ink-100 last:border-0"
              :class="row.highlight ? 'bg-gold-50/50' : ''"
            >
              <td
                class="py-2.5 pr-4 font-mono text-xs font-medium text-ink-900 whitespace-nowrap"
              >
                {{ row.marker }}
              </td>
              <td class="py-2.5 pr-4 text-ink-700 whitespace-nowrap">
                <span v-if="row.highlight" class="tag-gold text-2xs">{{
                  row.result
                }}</span>
                <span v-else>{{ row.result }}</span>
              </td>
              <td class="py-2.5 text-ink-700 text-xs leading-relaxed">
                {{ row.note }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        class="mt-4 text-xs text-ink-600 leading-relaxed border-l-2 border-ocean-400 pl-3"
      >
        {{
          locale === 'es'
            ? 'Biopsia ósea 30/04/2026 (patología local): «No se observa neoplasia». Los falsos negativos histológicos en hueso son frecuentes; las decisiones de tercera línea se apoyaron en ctDNA, correlación clínica y PET-TAC de progresión (p. ej. SUVmax hasta 9,43 en diáfisis femoral).'
            : '30/04/2026 bone biopsy (local pathology): “no malignant tissue identified.” False-negative marrow sampling is frequent; decisions rely on ctDNA, clinical correlation and progressive PET findings (e.g. SUVmax up to 9.43 in femoral marrow).'
        }}
      </p>
    </div>

    <p class="text-xs text-ink-600 leading-relaxed">
      {{
        locale === 'es'
          ? '⁺ La categoría HER2-ultralow (tinción de membrana incompleta y casi imperceptible en <10% de las células) se infiere de la descripción de la segunda lectura de patología en un centro de referencia internacional (2024); los informes de origen no usan literalmente esa etiqueta.'
          : '⁺ The HER2-ultralow category (faint, incomplete membrane staining in <10% of cells) is inferred from the second-read pathology at an international reference centre (2024); the source reports do not use that exact label.'
      }}
    </p>
    <p class="mt-2 text-xs text-ink-600 leading-relaxed">
      {{
        locale === 'es'
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
        {
          marker: 'RB1',
          result: 'F226*, R661W, p.V622Yfs*33',
          note:
            'Tres alteraciones emergentes en biopsía líquida abril 2026 (panel correlacionado con informe VHIO/SOLTI). No aparecen variantes patogénicas equivalentes en el panel de tejido 2024; ver tabla siguiente para contexto longitudinal.',
          highlight: true,
        },
        {
          marker: 'ESR1',
          result: 'p.D538G (VAF 0,24%)',
          note:
            'Subclonal en plasma abril 2026; ausente del tejido 2024. Coherente con pérdida progresiva de dependencia hormonal clínica después de líneas combinadas hormonal + CDK4/6i.',
          highlight: true,
        },
        {
          marker: 'FGFR1',
          result: 'Amplificado ×13',
          note:
            'Driver principal; marcador canónico de fenotipo NE en mama además de resistencia; sensibilidad contextual a everolimus',
          highlight: true,
        },
        {
          marker: 'CCND1',
          result: 'Amplificado ×20',
          note: 'Cluster 11q13',
          highlight: true,
        },
        {
          marker: 'FGF3/4/19',
          result: 'Amplificado ×18',
          note: 'Cluster 11q13',
          highlight: true,
        },
        {
          marker: 'Dif. NE',
          result: '~80% (CgA, SYN)',
          note: 'Subtipo BC-NED: biología neuroendocrina dominante',
          highlight: true,
        },
        {
          marker: 'Ki67',
          result: '60%',
          note:
            'Índice proliferativo Ki67 60%. La AP local clasifica el tumor como G2 (Nottingham 3+2+2); en los modelos de gradación neuroendocrina (G1 <3%, G2 3–20%, G3 >20%) un 60% encajaría en NEC G3 — comportamiento biológicamente más agresivo que un carcinoma luminal convencional ⁺⁺',
          highlight: false,
        },
        {
          marker: 'TMB / MSI',
          result: 'Baja / Baja',
          note: '---',
          highlight: false,
        },
        {
          marker: 'SNVs/INDELs',
          result: 'Ninguna patogénica',
          note: 'Sin fusiones detectadas (tejido 2024)',
          highlight: false,
        },
        {
          marker: 'PIK3CA',
          result: 'No detectado en tejido',
          note:
            'ESR1 no detectado en tejido 2024; ver plasma abril 2026',
          highlight: false,
        },
        {
          marker: 'HER2',
          result: 'Negativo (0)',
          note: 'Tinción negativa',
          highlight: false,
        },
        {
          marker: 'PR',
          result: 'Positivo',
          note:
            'Discordancia histórica 5% local vs 100% externo',
          highlight: false,
        },
      ]
    : [
        {
          marker: 'RB1',
          result: 'F226*, R661W, p.V622Yfs*33',
          note:
            'Three alterations emerging April 2026 liquid biopsy (panel aligned with VHIO/SOLTI report). No comparable pathogenic RB1 variants on 2024 tissue panel; see second table for longitudinal framing.',
          highlight: true,
        },
        {
          marker: 'ESR1',
          result: 'p.D538G (VAF 0.24%)',
          note:
            'Subclonal in April 2026 plasma; absent in 2024 tissue. Fits progressive loss of strict hormonal dependence after combined endocrine plus CDK4/6 inhibitor lines.',
          highlight: true,
        },
        {
          marker: 'FGFR1',
          result: 'Amplified ×13',
          note:
            'Main driver; canonical NE-phenotype marker in breast as well as resistance; contextual everolimus sensitivity',
          highlight: true,
        },
        {
          marker: 'CCND1',
          result: 'Amplified ×20',
          note: '11q13 cluster',
          highlight: true,
        },
        {
          marker: 'FGF3/4/19',
          result: 'Amplified ×18',
          note: '11q13 cluster',
          highlight: true,
        },
        {
          marker: 'NE Diff.',
          result: '~80% (CgA, SYN)',
          note: 'BC-NED subtype: dominant neuroendocrine biology',
          highlight: true,
        },
        {
          marker: 'Ki67',
          result: '60%',
          note:
            'Ki67 60%. Local pathology reports the tumour as G2 (Nottingham 3+2+2); under neuroendocrine grading models (G1 <3%, G2 3–20%, G3 >20%) a Ki67 of 60% would fit NEC G3 — biologically more aggressive than a conventional luminal breast cancer ⁺⁺',
          highlight: false,
        },
        {
          marker: 'TMB / MSI',
          result: 'Low / Low',
          note: '---',
          highlight: false,
        },
        {
          marker: 'SNVs/INDELs',
          result: 'None pathogenic',
          note: 'No fusions detected (2024 tissue)',
          highlight: false,
        },
        {
          marker: 'PIK3CA',
          result: 'Not detected in tissue',
          note: 'ESR1 not detected in 2024 tissue; see plasma April 2026',
          highlight: false,
        },
        {
          marker: 'HER2',
          result: 'Negative (0)',
          note: 'Negative staining',
          highlight: false,
        },
        {
          marker: 'PR',
          result: 'Positive',
          note: 'Historic discordance 5% local vs 100% reference lab',
          highlight: false,
        },
      ]
)

const liquidMarkers = computed(() =>
  locale.value === 'es'
    ? [
        {
          marker: 'RB1',
          result: 'F226*, R661W, p.V622Yfs*33',
          note:
            'Alteraciones funcionales consolidadas sólo en biopsía líquida abril 2026 — firma molecular de resistencia intrínseca esperada frente a inhibición CDK4/6 repetida tras dos líneas endocrinas.',
          highlight: true,
        },
        {
          marker: 'ESR1',
          result: 'p.D538G (VAF 0,24%)',
          note:
            'Resistencia a letrozol (1L): clon capaz de crecer sin dependencia robusta de estrógeno exógeno.',
          highlight: true,
        },
        {
          marker: 'FGFR1',
          result: 'CN ~6,95',
          note:
            'Amplificación confirmada y mantenida; coherente con literatura (p. ej. Frontiers in Medicine 2025) como marcador del fenotipo neuroendocrino en mama.',
          highlight: true,
        },
        {
          marker: 'CCND1',
          result: 'CN ~7,63',
          note:
            'Amplificación confirmada y mantenida; eje 11q13 activo.',
          highlight: true,
        },
      ]
    : [
        {
          marker: 'RB1',
          result: 'F226*, R661W, p.V622Yfs*33',
          note:
            'Functional hits confirmed on April 2026 liquid biopsy — expected molecular signature limiting further CDK4/6 inhibitor benefit after two endocrine-based lines.',
          highlight: true,
        },
        {
          marker: 'ESR1',
          result: 'p.D538G (VAF 0.24%)',
          note:
            'Letrozole (1L) resistance: clone able to grow without strong dependence on exogenous estrogen.',
          highlight: true,
        },
        {
          marker: 'FGFR1',
          result: 'CN ~6.95',
          note:
            'Amplification confirmed and maintained; consistent with literature (e.g. Frontiers in Medicine 2025) as a marker of neuroendocrine phenotype in breast cancer.',
          highlight: true,
        },
        {
          marker: 'CCND1',
          result: 'CN ~7.63',
          note:
            'Amplification confirmed and maintained; active 11q13 axis.',
          highlight: true,
        },
      ]
)
</script>
