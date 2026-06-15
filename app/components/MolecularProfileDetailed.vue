<template>
  <section :aria-labelledby="'perfil-molecular-detallado-title'">
    <div class="flex items-baseline justify-between flex-wrap gap-2 mb-3">
      <p class="eyebrow">{{ locale === 'es' ? 'Perfil molecular detallado' : 'Detailed molecular profile' }}</p>
      <p class="text-[11px] text-tinta font-mono">
        {{ locale === 'es' ? 'TSO500 2024 + IHQ + ctDNA 2026 + PET Ga-68' : 'TSO500 2024 + IHC + 2026 ctDNA + Ga-68 PET' }}
      </p>
    </div>
    <h3
      id="perfil-molecular-detallado-title"
      class="heading-display text-xl text-berenjena mb-1"
    >
      {{ locale === 'es' ? 'Alteraciones, métodos e implicación clínica' : 'Alterations, methods and clinical implication' }}
    </h3>
    <p class="text-sm text-tinta leading-relaxed mb-5 max-w-2xl">
      {{
        locale === 'es'
          ? 'Cruce de todas las fuentes moleculares disponibles, sin interpretación añadida. Cada fila indica el método con el que se obtuvo el resultado.'
          : 'Cross of every available molecular source, with no added interpretation. Each row shows the method by which the result was obtained.'
      }}
    </p>

    <div class="data-card">
      <div class="overflow-x-auto">
      <table class="data-table data-table--dense data-table--cards" aria-labelledby="perfil-molecular-detallado-title">
        <caption class="sr-only">
          {{
            locale === 'es'
              ? 'Perfil molecular detallado: alteración, resultado, método/fuente, categoría e implicación clínica.'
              : 'Detailed molecular profile: alteration, result, method/source, category and clinical implication.'
          }}
        </caption>
        <colgroup>
          <col style="width: 15%" />
          <col style="width: 14%" />
          <col style="width: 19%" />
          <col style="width: 15%" />
          <col style="width: 37%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{{ locale === 'es' ? 'Alteración' : 'Alteration' }}</th>
            <th scope="col">{{ locale === 'es' ? 'Resultado' : 'Result' }}</th>
            <th scope="col" class="col-marker">{{ locale === 'es' ? 'Método / Fuente' : 'Method / Source' }}</th>
            <th scope="col" class="col-marker">{{ locale === 'es' ? 'Categoría' : 'Category' }}</th>
            <th scope="col" class="col-note">{{ locale === 'es' ? 'Implicación clínica' : 'Clinical implication' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td class="cell-head font-semibold text-berenjena" translate="no">{{ row.alteration }}</td>
            <td :data-label="headers[1]">
              <span :class="['pill-data', `pill-data--${row.tone}`]">{{ row.result }}</span>
            </td>
            <td class="col-marker" :data-label="headers[2]">{{ row.source }}</td>
            <td class="col-marker" :data-label="headers[3]">{{ row.category }}</td>
            <td class="col-note cell-block" :data-label="headers[4]">{{ row.implication }}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <details class="notes-disclosure px-4 sm:px-5 pb-4">
      <summary>
        {{ locale === 'es' ? 'Fuentes y notas metodológicas' : 'Sources and methodological notes' }}
      </summary>
      <p class="mt-3 text-xs text-tinta leading-relaxed">
        {{
          locale === 'es'
            ? 'La biopsia de la lesión ósea (ilíaca derecha, abril 2026) no contenía tumor evaluable —solo trabéculas óseas mineralizadas y tejido muscular—, así que el perfil molecular se obtiene del ctDNA. Es también la razón de dirigir la rebiopsia avanzada al componente de tejido blando, donde la NGS rinde mucho mejor que en hueso puro.'
            : 'The bone-lesion biopsy (right iliac, April 2026) contained no evaluable tumour —only mineralised bone trabeculae and muscle tissue—, so the molecular profile is read from ctDNA. It is also why the advanced rebiopsy targets the soft-tissue component, where NGS performs far better than in pure bone.'
        }}
      </p>
      <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
        {{
          locale === 'es'
            ? 'Fuentes: TSO500 sobre tejido FFPE primario (DIPCAN, MD Anderson Madrid, 2024) · IHQ sobre tejido primario · ctDNA Guardant360 / VHIO360 (abril–mayo 2026) · PET-CT Galio-68 DOTATOC (Virgen de la Arrixaca, mayo 2026).'
            : 'Sources: TSO500 on primary FFPE tissue (DIPCAN, MD Anderson Madrid, 2024) · IHC on primary tissue · Guardant360 / VHIO360 ctDNA (April–May 2026) · Ga-68 DOTATOC PET-CT (Virgen de la Arrixaca, May 2026).'
        }}
      </p>
      <p class="mt-2 text-xs text-tinta leading-relaxed">
        {{
          locale === 'es'
            ? '⁺⁺ En oncología neuroendocrina, el Ki67 es el marcador principal de gradación: G1 (<3%), G2 (3–20%), G3 (>20%). Por esa lógica, un Ki67 alto sería compatible con un componente neuroendocrino de alto grado (NEC G3): una hipótesis, no el grado asignado. El grado histológico confirmado es Grado II de Nottingham; armonizarlo queda pendiente del comité de tumores.'
            : '⁺⁺ In neuroendocrine oncology, Ki67 is the primary grading marker: G1 (<3%), G2 (3–20%), G3 (>20%). By that logic, a high Ki67 would be compatible with a high-grade neuroendocrine component (NEC G3): a hypothesis, not the assigned grade. The confirmed histological grade is Nottingham Grade II; reconciling it is pending tumour-board review.'
        }}
      </p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
type Tone = 'violet' | 'info' | 'warn' | 'positive' | 'neutral'
interface Row {
  alteration: string
  result: string
  source: string
  category: string
  implication: string
  tone: Tone
}

const { locale } = useI18n()

const headers = computed(() =>
  locale.value === 'es'
    ? ['Alteración', 'Resultado', 'Método / Fuente', 'Categoría', 'Implicación clínica']
    : ['Alteration', 'Result', 'Method / Source', 'Category', 'Clinical implication']
)

const rows = computed<Row[]>(() =>
  locale.value === 'es'
    ? [
        { alteration: 'FGFR1', result: 'Amplificado ×13', source: 'TSO500 tejido', category: 'Driver luminal', implication: 'Resistencia a CDK4/6i; sensibilidad potencial a everolimus y a inhibidores FGFR (erdafitinib, futibatinib, ponatinib).', tone: 'violet' },
        { alteration: 'CCND1', result: 'Amplificado ×20', source: 'TSO500 tejido + ctDNA', category: 'Cluster 11q13', implication: 'Co-amplificado con FGFR1; refuerza resistencia a CDK4/6i.', tone: 'violet' },
        { alteration: 'FGF3 / FGF4 / FGF19', result: 'Amplificado ×18', source: 'TSO500 tejido', category: 'Cluster 11q13', implication: 'Co-amplificación característica del 11q13; sin diana directa, marcador de biología agresiva.', tone: 'violet' },
        { alteration: 'Diferenciación NE', result: '~80% (CgA, SYN)', source: 'IHQ tejido primario', category: 'Subtipo BC-NED', implication: 'Comportamiento neuroendocrino dominante. Justifica explorar terapias propias de tumores NE (PRRT, regímenes platino).', tone: 'warn' },
        { alteration: 'SSTR2 (somatostatina)', result: 'Positivo', source: 'PET Ga-68 DOTATOC', category: 'Diana radioligando', implication: 'Sobreexpresión en metástasis óseas y captación focal en mama. Abre la puerta a PRRT (radioligandos).', tone: 'positive' },
        { alteration: 'Ki67', result: '60%', source: 'IHQ tejido primario (2024) · VHIO 2026: 40%', category: 'Grado', implication: 'Alto índice proliferativo. Un Ki67 ≥20% sería compatible con alto grado NE: hipótesis, no el grado asignado (confirmado: Grado II de Nottingham) ⁺⁺.', tone: 'warn' },
        { alteration: 'ESR1 p.D538G', result: 'Detectada', source: 'ctDNA (Guardant360 + VHIO360, 2026)', category: 'Resistencia endocrina', implication: 'Resistencia adquirida a inhibidores de aromatasa; criterio de entrada al estudio con elacestrant (ADELA).', tone: 'info' },
        { alteration: 'RB1', result: '3 variantes', source: 'ctDNA Guardant360 (abr 2026)', category: 'Resistencia / progresión', implication: 'p.V622Yfs*33 (1,58%), p.R661W (1,48%) y p.F226* (subclonal); ausentes en el tumor primario (TSO500, 2024). Pérdida de RB1 asociada a resistencia a CDK4/6i y a transformación hacia fenotipos más agresivos / neuroendocrinos.', tone: 'warn' },
        { alteration: 'SMO p.V319D', result: 'Detectada (VUS)', source: 'ctDNA (Guardant360 CDx, 26 may 2026)', category: 'Significado incierto', implication: 'Variante de significado clínico incierto, en vigilancia.', tone: 'neutral' },
        { alteration: 'TMB / MSI', result: 'Baja / Baja', source: 'TSO500 tejido', category: 'Inmunoterapia', implication: 'Sin perfil candidato a inhibidores de checkpoint.', tone: 'neutral' },
        { alteration: 'SNVs / INDELs / fusiones', result: 'Ninguna patogénica', source: 'TSO500 tejido', category: 'Resto del panel', implication: 'Sin otras dianas accionables en el panel original.', tone: 'neutral' },
        { alteration: 'PIK3CA', result: 'No detectado', source: 'TSO500 tejido', category: 'Diana PI3K', implication: 'Pendiente reanálisis sobre tejido actualizado.', tone: 'neutral' },
        { alteration: 'HER2', result: 'Negativo (0)', source: 'IHQ tejido primario', category: 'Receptor', implication: 'Tinción negativa.', tone: 'neutral' },
        { alteration: 'RE / RP', result: 'RE 95% / RP 5%', source: 'IHQ tejido primario', category: 'Receptor hormonal', implication: 'Componente luminal del tumor — base de la línea endocrina actual.', tone: 'info' },
      ]
    : [
        { alteration: 'FGFR1', result: 'Amplified ×13', source: 'TSO500 tissue', category: 'Luminal driver', implication: 'CDK4/6i resistance; potential sensitivity to everolimus and to FGFR inhibitors (erdafitinib, futibatinib, ponatinib).', tone: 'violet' },
        { alteration: 'CCND1', result: 'Amplified ×20', source: 'TSO500 tissue + ctDNA', category: '11q13 cluster', implication: 'Co-amplified with FGFR1; reinforces CDK4/6i resistance.', tone: 'violet' },
        { alteration: 'FGF3 / FGF4 / FGF19', result: 'Amplified ×18', source: 'TSO500 tissue', category: '11q13 cluster', implication: 'Characteristic 11q13 co-amplification; no direct target, marker of aggressive biology.', tone: 'violet' },
        { alteration: 'NE differentiation', result: '~80% (CgA, SYN)', source: 'IHC primary tissue', category: 'BC-NED subtype', implication: 'Dominant neuroendocrine behaviour. Justifies exploring NE-tumour therapies (PRRT, platinum regimens).', tone: 'warn' },
        { alteration: 'SSTR2 (somatostatin)', result: 'Positive', source: 'Ga-68 DOTATOC PET', category: 'Radioligand target', implication: 'Overexpression in bone metastases and focal uptake in the breast. Opens the door to PRRT (radioligand therapy).', tone: 'positive' },
        { alteration: 'Ki67', result: '60%', source: 'IHC primary tissue (2024) · VHIO 2026: 40%', category: 'Grade', implication: 'High proliferative index. Ki67 ≥20% would be compatible with high NE grade: a hypothesis, not the assigned grade (confirmed: Nottingham Grade II) ⁺⁺.', tone: 'warn' },
        { alteration: 'ESR1 p.D538G', result: 'Detected', source: 'ctDNA (Guardant360 + VHIO360, 2026)', category: 'Endocrine resistance', implication: 'Acquired resistance to aromatase inhibitors; entry criterion for the elacestrant trial (ADELA).', tone: 'info' },
        { alteration: 'RB1', result: '3 variants', source: 'ctDNA Guardant360 (Apr 2026)', category: 'Resistance / progression', implication: 'p.V622Yfs*33 (1.58%), p.R661W (1.48%) and p.F226* (subclonal); absent in the primary tumour (TSO500, 2024). RB1 loss associated with CDK4/6i resistance and transformation to more aggressive / neuroendocrine phenotypes.', tone: 'warn' },
        { alteration: 'SMO p.V319D', result: 'Detected (VUS)', source: 'ctDNA (Guardant360 CDx, May 26, 2026)', category: 'Uncertain significance', implication: 'Variant of uncertain clinical significance, under watch.', tone: 'neutral' },
        { alteration: 'TMB / MSI', result: 'Low / Low', source: 'TSO500 tissue', category: 'Immunotherapy', implication: 'No profile for checkpoint inhibitors.', tone: 'neutral' },
        { alteration: 'SNVs / INDELs / fusions', result: 'None pathogenic', source: 'TSO500 tissue', category: 'Rest of the panel', implication: 'No other actionable targets in the original panel.', tone: 'neutral' },
        { alteration: 'PIK3CA', result: 'Not detected', source: 'TSO500 tissue', category: 'PI3K target', implication: 'Pending re-analysis on updated tissue.', tone: 'neutral' },
        { alteration: 'HER2', result: 'Negative (0)', source: 'IHC primary tissue', category: 'Receptor', implication: 'Negative staining.', tone: 'neutral' },
        { alteration: 'ER / PR', result: 'ER 95% / PR 5%', source: 'IHC primary tissue', category: 'Hormone receptor', implication: 'Luminal component of the tumour — basis of the current endocrine line.', tone: 'info' },
      ]
)
</script>
