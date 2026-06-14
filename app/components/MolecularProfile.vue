<template>
  <section :aria-labelledby="'perfil-molecular-title'">
    <div class="flex items-baseline justify-between flex-wrap gap-2 mb-3">
      <p class="eyebrow">{{ locale === 'es' ? 'Perfil molecular' : 'Molecular profile' }}</p>
      <p class="text-[11px] text-tinta font-mono">
        {{ locale === 'es' ? 'TSO500 · tejido primario 2024 + actualizaciones 2026' : 'TSO500 · primary tissue 2024 + 2026 updates' }}
      </p>
    </div>
    <h3
      id="perfil-molecular-title"
      class="heading-display text-xl text-berenjena mb-5"
    >
      {{ locale === 'es' ? 'Marcadores principales' : 'Key markers' }}
    </h3>

    <div class="data-card overflow-x-auto">
      <table class="data-table data-table--cards" aria-labelledby="perfil-molecular-title">
        <caption class="sr-only">
          {{
            locale === 'es'
              ? 'Perfil molecular: marcadores, resultados y notas clínicas del análisis TSO500'
              : 'Molecular profile: markers, results and clinical notes from TSO500 analysis'
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ locale === 'es' ? 'Marcador' : 'Marker' }}</th>
            <th scope="col">{{ locale === 'es' ? 'Resultado' : 'Result' }}</th>
            <th scope="col">{{ locale === 'es' ? 'Nota clínica' : 'Clinical note' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in markers" :key="i">
            <td class="col-marker cell-head" translate="no">{{ row.marker }}</td>
            <td :data-label="locale === 'es' ? 'Resultado' : 'Result'">
              <span :class="['pill-data', `pill-data--${row.tone}`]">{{ row.result }}</span>
            </td>
            <td class="col-note cell-block" :data-label="locale === 'es' ? 'Nota clínica' : 'Clinical note'">{{ row.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-xs text-tinta leading-relaxed">
      {{
        locale === 'es'
          ? '⁺ La categoría HER2-ultralow (tinción de membrana en <10% de las células) está presente en este caso según los datos del estudio DIPCAN / MD Anderson Madrid.'
          : '⁺ The HER2-ultralow category (membrane staining in <10% of cells) is present in this case according to data from the DIPCAN study / MD Anderson Madrid.'
      }}
    </p>
    <p class="mt-2 text-xs text-tinta leading-relaxed">
      {{
        locale === 'es'
          ? '⁺⁺ En oncología neuroendocrina, el Ki67 es el marcador principal de gradación: G1 (<3%), G2 (3–20%), G3 (>20%). Por esa lógica, un Ki67 alto sería compatible con un componente neuroendocrino de alto grado (NEC G3). Es una hipótesis sobre la biología del tumor —no el grado asignado: el grado histológico confirmado es Grado II de Nottingham (Murcia 2024; VHIO 2026)— y queda pendiente de confirmación en la rebiopsia y de valoración por el comité de tumores.'
          : '⁺⁺ In neuroendocrine oncology, Ki67 is the primary grading marker: G1 (<3%), G2 (3–20%), G3 (>20%). By that logic, a high Ki67 would be compatible with a high-grade neuroendocrine component (NEC G3). This is a hypothesis about the tumour\'s biology —not the assigned grade: the confirmed histological grade is Nottingham Grade II (Murcia 2024; VHIO 2026)— pending confirmation at rebiopsy and tumour-board review.'
      }}
    </p>
  </section>
</template>

<script setup lang="ts">
type Tone = 'violet' | 'info' | 'warn' | 'positive' | 'neutral'
interface MarkerRow { marker: string; result: string; note: string; tone: Tone }

const { locale } = useI18n()

const markers = computed<MarkerRow[]>(() =>
  locale.value === 'es'
    ? [
        { marker: 'FGFR1', result: 'Amplificado ×13', note: 'Driver principal; resistencia a CDK4/6i, sensibilidad a everolimus', tone: 'violet' },
        { marker: 'CCND1', result: 'Amplificado ×20', note: 'Cluster 11q13', tone: 'violet' },
        { marker: 'FGF3/4/19', result: 'Amplificado ×18', note: 'Cluster 11q13', tone: 'violet' },
        { marker: 'Dif. NE', result: '~80% (CgA, SYN)', note: 'Subtipo BC-NED: biología neuroendocrina dominante', tone: 'warn' },
        { marker: 'SSTR2 (PET Ga-68)', result: 'Positivo', note: 'PET-CT Galio-68 DOTATOC (mayo 2026): metástasis óseas con sobreexpresión de receptores de somatostatina — diana de terapia con radioligandos (PRRT)', tone: 'positive' },
        { marker: 'Ki67', result: '60%', note: 'Alto índice proliferativo (lectura de 2024; VHIO 2026 lo situó en 40%). En tumores NE, un Ki67 ≥20% sería compatible con alto grado: una hipótesis, no el grado asignado (confirmado: Grado II de Nottingham) ⁺⁺', tone: 'warn' },
        { marker: 'TMB / MSI', result: 'Baja / Baja', note: '—', tone: 'neutral' },
        { marker: 'SNVs/INDELs', result: 'Ninguna patogénica', note: 'Sin fusiones detectadas', tone: 'neutral' },
        { marker: 'ESR1 p.D538G', result: 'Detectada (ctDNA 2026)', note: 'Resistencia endocrina adquirida a inhibidores de aromatasa', tone: 'info' },
        { marker: 'PIK3CA', result: 'No detectado', note: 'Pendiente reanálisis sobre tejido actualizado', tone: 'neutral' },
        { marker: 'HER2', result: 'Negativo (0)', note: 'Tinción negativa ⁺', tone: 'neutral' },
        { marker: 'RP', result: 'Positivo (5%)', note: 'Receptor de progesterona', tone: 'info' },
      ]
    : [
        { marker: 'FGFR1', result: 'Amplified ×13', note: 'Main driver; CDK4/6i resistance, everolimus sensitivity', tone: 'violet' },
        { marker: 'CCND1', result: 'Amplified ×20', note: '11q13 cluster', tone: 'violet' },
        { marker: 'FGF3/4/19', result: 'Amplified ×18', note: '11q13 cluster', tone: 'violet' },
        { marker: 'NE Diff.', result: '~80% (CgA, SYN)', note: 'BC-NED subtype: dominant neuroendocrine biology', tone: 'warn' },
        { marker: 'SSTR2 (Ga-68 PET)', result: 'Positive', note: 'Ga-68 DOTATOC PET-CT (May 2026): bone metastases with somatostatin receptor overexpression — target for peptide receptor radionuclide therapy (PRRT)', tone: 'positive' },
        { marker: 'Ki67', result: '60%', note: 'High proliferative index (2024 read; VHIO 2026 read it at 40%). In NE tumours, Ki67 ≥20% would be compatible with high grade: a hypothesis, not the assigned grade (confirmed: Nottingham Grade II) ⁺⁺', tone: 'warn' },
        { marker: 'TMB / MSI', result: 'Low / Low', note: '—', tone: 'neutral' },
        { marker: 'SNVs/INDELs', result: 'None pathogenic', note: 'No fusions detected', tone: 'neutral' },
        { marker: 'ESR1 p.D538G', result: 'Detected (ctDNA 2026)', note: 'Acquired endocrine resistance to aromatase inhibitors', tone: 'info' },
        { marker: 'PIK3CA', result: 'Not detected', note: 'Pending re-analysis on updated tissue', tone: 'neutral' },
        { marker: 'HER2', result: 'Negative (0)', note: 'Negative staining ⁺', tone: 'neutral' },
        { marker: 'PR', result: 'Positive (5%)', note: 'Progesterone receptor', tone: 'info' },
      ]
)
</script>
