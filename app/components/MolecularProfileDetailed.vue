<template>
  <section :aria-labelledby="'perfil-molecular-detallado-title'">
    <div class="flex items-baseline justify-between flex-wrap gap-2 mb-3">
      <p class="eyebrow">{{ locale === 'es' ? 'Perfil molecular detallado' : 'Detailed molecular profile' }}</p>
      <p class="text-[11px] text-tinta font-mono">
        {{ locale === 'es' ? 'TSO500 2024 + FoundationOne CDx 2026 + IHQ + ctDNA + PET Ga-68' : 'TSO500 2024 + FoundationOne CDx 2026 + IHC + ctDNA + Ga-68 PET' }}
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
            ? 'La primera biopsia ósea (ilíaca derecha, abril de 2026) no tenía tumor evaluable. La segunda (Zúrich, 8 de julio de 2026) sí, y el FoundationOne CDx se hizo sobre ella, con una pureza tumoral del 61 %. La metástasis hepática (biopsia del 18 de agosto de 2026) se ha estudiado por inmunohistoquímica y todavía no tiene perfil genómico. FoundationOne no lleva normal pareado: el exoma con ADN germinal en Dana-Farber es el que podrá separar lo somático de lo heredado.'
            : 'The first bone biopsy (right iliac, April 2026) had no evaluable tumour. The second (Zurich, 8 July 2026) did, and FoundationOne CDx was run on it at 61% tumour purity. The liver metastasis (biopsy of 18 August 2026) has been studied by immunohistochemistry and has no genomic profile yet. FoundationOne has no matched normal: the exome with germline DNA at Dana-Farber is what will separate somatic from inherited.'
        }}
      </p>
      <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
        {{
          locale === 'es'
            ? 'Fuentes: TSO500 sobre tejido FFPE primario (DIPCAN, MD Anderson Madrid, 2024) · FoundationOne CDx sobre la biopsia ósea de Zúrich (julio 2026) · IHQ del primario (2024 y revisión 2026), del hueso (2026) y del hígado (Anatomía Patológica de Vall d\'Hebron, informe del 21-09-2026) · ctDNA Guardant360 / VHIO360 (abril–mayo 2026) · PET-CT Galio-68 DOTATOC (mayo 2026).'
            : 'Sources: TSO500 on primary FFPE tissue (DIPCAN, MD Anderson Madrid, 2024) · FoundationOne CDx on the Zurich bone biopsy (July 2026) · IHC of the primary (2024 and 2026 review), bone (2026) and liver (Vall d\'Hebron Pathology, report of 21-09-2026) · Guardant360 / VHIO360 ctDNA (April–May 2026) · Ga-68 DOTATOC PET-CT (May 2026).'
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
        { alteration: 'FGFR1 (8p11)', result: '×13 (2024) · 33 copias (2026)', source: 'TSO500 primario 2024 · FoundationOne CDx hueso jul 2026', category: 'Driver luminal', implication: 'Amplicón 8p11 con NSD3 y ZNF703. Se asocia a resistencia a endocrino y a CDK4/6i; diana posible de inhibidores de FGFR y de everolimus, como hipótesis. Las dos cifras vienen de plataformas y purezas distintas: la dirección es firme, el número exacto no.', tone: 'violet' },
        { alteration: 'CCND1 · FGF3/4/19 (11q13)', result: '×20 y ×18 (2024) · 37 copias (2026)', source: 'TSO500 primario 2024 · FoundationOne CDx hueso 2026 · ctDNA', category: 'Clúster 11q13', implication: 'Co-amplificado con FGFR1 en todo el tejido estudiado. FGF19 es el ligando de FGFR4. Su valor para predecir la respuesta a CDK4/6i no está establecido.', tone: 'violet' },
        { alteration: 'RE / RP', result: 'Primario RE 85–100 % · Hígado RE 0 % / RP 5 %', source: 'IHQ primario (3 lecturas) · IHQ biopsia hepática (informe 21-sep-2026)', category: 'Receptor hormonal', implication: 'Cambio de receptores: la metástasis del hígado ha perdido el receptor de estrógeno. Coincide con la progresión hepática bajo fulvestrant + inhibidor de KAT6; que sea la causa es una hipótesis. Con RP 5 % sigue siendo HR+ según la definición del ensayo TROPION-Breast06 (RE o RP ≥1 %).', tone: 'warn' },
        { alteration: 'HER2', result: '0 en todas las lecturas', source: 'IHQ primario (×3) · IHQ hígado 2026 · ERBB2 sin alteración (F1CDx)', category: 'Receptor', implication: 'HER2 IHQ 0, no HER2-low. Es el requisito de entrada del ensayo con Dato-DXd.', tone: 'neutral' },
        { alteration: 'TROP-2', result: 'No medido', source: '—', category: 'Diana del ADC', implication: 'Diana del datopotamab deruxtecan del ensayo previsto para octubre de 2026. El ensayo no exige medirla para entrar; la estudia como exploratoria.', tone: 'info' },
        { alteration: 'Diferenciación NE', result: '~80 % (2024) · presente en hueso e hígado (2026)', source: 'IHQ primario · hueso (sinaptofisina) · hígado (CgA y sinaptofisina)', category: 'Subtipo BC-NED', implication: 'El componente neuroendocrino aparece en las tres localizaciones, también en la lesión hepática que progresa. Terapias propias de tumores NE (radioligandos, platino): hipótesis.', tone: 'warn' },
        { alteration: 'SSTR (somatostatina)', result: 'Positivo en hueso, heterogéneo', source: 'PET Ga-68 DOTATOC (mayo 2026)', category: 'Diana radioligando', implication: 'Captación en metástasis óseas, con algunas lesiones sin galio, y focal en mama. En mayo el hígado no tenía lesiones: su estado SSTR no se conoce. IHQ de SSTR2 en tejido: no hecha.', tone: 'positive' },
        { alteration: 'Ki67', result: '60 % · 40 % · ~15 %', source: 'IHQ primario (2024 y revisión 2026) · hueso (2026)', category: 'Grado', implication: 'En tumores NE, un Ki67 ≥20 % sería compatible con alto grado: hipótesis, no el grado asignado (confirmado: grado II de Nottingham) ⁺⁺. El patólogo del hueso advierte que la gradación NE no está establecida en biopsias pequeñas.', tone: 'warn' },
        { alteration: 'ESR1 p.D538G', result: 'En ctDNA · no en hueso', source: 'Guardant360 + VHIO360 (2026) · FoundationOne CDx hueso', category: 'Resistencia endocrina', implication: 'Mutación de resistencia a inhibidores de aromatasa vista en sangre (0,84 % en mayo). No aparece en el tejido óseo: heterogeneidad entre lesiones o un clon en otra localización. Con RE 0 % en el hígado, su peso como diana baja.', tone: 'info' },
        { alteration: 'RB1', result: '3 variantes en ctDNA · no en tejido', source: 'Guardant360 (abr 2026) · TSO500 2024 · FoundationOne CDx 2026', category: 'Resistencia / NE', implication: 'p.V622Yfs*33 (1,58 %), p.R661W (1,48 %) y p.F226* (subclonal); en mayo solo se informa p.V622Yfs*33 (0,19 %). Ni el primario ni el hueso de 2026 las tienen. La hipótesis de transformación neuroendocrina por pérdida de RB1 se apoya en sangre, no en tejido.', tone: 'warn' },
        { alteration: 'TMB / MSI / HRD', result: 'TMB 4 · MSS · HRDsig −', source: 'FoundationOne CDx hueso 2026 (TSO500 2024: TMB y MSI bajos)', category: 'Inmunogenómica', implication: 'Pocas mutaciones, así que pocas candidatas a neoantígeno clásico; condiciona la ruta de vacuna personalizada. El TMB de FoundationOne cuenta también variantes sinónimas. Sin perfil para inhibidores de checkpoint.', tone: 'neutral' },
        { alteration: 'TP53 · PIK3CA · PTEN · AKT1 · BRCA1/2', result: 'Sin alteración reportable', source: 'FoundationOne CDx hueso 2026 (PIK3CA también negativo en TSO500 2024)', category: 'Otras vías', implication: 'Sin diana en PI3K/AKT ni de recombinación homóloga en este tejido.', tone: 'neutral' },
        { alteration: 'SMO p.V319D', result: 'Detectada (VUS)', source: 'ctDNA (Guardant360 CDx, may 2026)', category: 'Significado incierto', implication: 'Variante de significado clínico incierto, en vigilancia.', tone: 'neutral' },
      ]
    : [
        { alteration: 'FGFR1 (8p11)', result: '×13 (2024) · 33 copies (2026)', source: 'TSO500 primary 2024 · FoundationOne CDx bone Jul 2026', category: 'Luminal driver', implication: '8p11 amplicon with NSD3 and ZNF703. Associated with resistance to endocrine therapy and CDK4/6i; a possible target for FGFR inhibitors and everolimus, as a hypothesis. The two numbers come from different platforms and purities: the direction is solid, the exact number is not.', tone: 'violet' },
        { alteration: 'CCND1 · FGF3/4/19 (11q13)', result: '×20 and ×18 (2024) · 37 copies (2026)', source: 'TSO500 primary 2024 · FoundationOne CDx bone 2026 · ctDNA', category: '11q13 cluster', implication: 'Co-amplified with FGFR1 across all tissue studied. FGF19 is the FGFR4 ligand. Its value for predicting response to CDK4/6i is not established.', tone: 'violet' },
        { alteration: 'ER / PR', result: 'Primary ER 85–100% · Liver ER 0% / PR 5%', source: 'IHC primary (3 reads) · IHC liver biopsy (report 21 Sep 2026)', category: 'Hormone receptor', implication: 'Receptor change: the liver metastasis has lost the estrogen receptor. It coincides with liver progression on fulvestrant + a KAT6 inhibitor; that it is the cause is a hypothesis. With PR 5% it remains HR+ under the TROPION-Breast06 definition (ER or PR ≥1%).', tone: 'warn' },
        { alteration: 'HER2', result: '0 in every read', source: 'IHC primary (×3) · IHC liver 2026 · ERBB2 unaltered (F1CDx)', category: 'Receptor', implication: 'HER2 IHC 0, not HER2-low. It is the entry requirement for the Dato-DXd trial.', tone: 'neutral' },
        { alteration: 'TROP-2', result: 'Not measured', source: '—', category: 'ADC target', implication: 'Target of datopotamab deruxtecan in the trial expected for October 2026. The trial does not require it for entry; it studies it as exploratory.', tone: 'info' },
        { alteration: 'NE differentiation', result: '~80% (2024) · present in bone and liver (2026)', source: 'IHC primary · bone (synaptophysin) · liver (CgA and synaptophysin)', category: 'BC-NED subtype', implication: 'The neuroendocrine component appears at all three sites, including the progressing liver lesion. NE-tumour therapies (radioligands, platinum): hypothesis.', tone: 'warn' },
        { alteration: 'SSTR (somatostatin)', result: 'Positive in bone, heterogeneous', source: 'Ga-68 DOTATOC PET (May 2026)', category: 'Radioligand target', implication: 'Uptake in bone metastases, with some lesions without gallium, and focal in the breast. In May the liver had no lesions: its SSTR status is unknown. SSTR2 IHC in tissue: not done.', tone: 'positive' },
        { alteration: 'Ki67', result: '60% · 40% · ~15%', source: 'IHC primary (2024 and 2026 review) · bone (2026)', category: 'Grade', implication: 'In NE tumours, Ki67 ≥20% would be compatible with high grade: a hypothesis, not the assigned grade (confirmed: Nottingham grade II) ⁺⁺. The bone pathologist notes that NE grading is not established on small biopsies.', tone: 'warn' },
        { alteration: 'ESR1 p.D538G', result: 'In ctDNA · not in bone', source: 'Guardant360 + VHIO360 (2026) · FoundationOne CDx bone', category: 'Endocrine resistance', implication: 'Aromatase-inhibitor resistance mutation seen in blood (0.84% in May). Absent from bone tissue: inter-lesion heterogeneity or a clone at another site. With ER 0% in the liver, its weight as a target drops.', tone: 'info' },
        { alteration: 'RB1', result: '3 variants in ctDNA · not in tissue', source: 'Guardant360 (Apr 2026) · TSO500 2024 · FoundationOne CDx 2026', category: 'Resistance / NE', implication: 'p.V622Yfs*33 (1.58%), p.R661W (1.48%) and p.F226* (subclonal); in May only p.V622Yfs*33 is reported (0.19%). Neither the primary nor the 2026 bone has them. The hypothesis of neuroendocrine transformation through RB1 loss rests on blood, not tissue.', tone: 'warn' },
        { alteration: 'TMB / MSI / HRD', result: 'TMB 4 · MSS · HRDsig −', source: 'FoundationOne CDx bone 2026 (TSO500 2024: low TMB and MSI)', category: 'Immunogenomics', implication: 'Few mutations, so few classic neoantigen candidates; this shapes the personalised-vaccine route. FoundationOne TMB also counts synonymous variants. No profile for checkpoint inhibitors.', tone: 'neutral' },
        { alteration: 'TP53 · PIK3CA · PTEN · AKT1 · BRCA1/2', result: 'No reportable alteration', source: 'FoundationOne CDx bone 2026 (PIK3CA also negative on TSO500 2024)', category: 'Other pathways', implication: 'No PI3K/AKT target and no homologous-recombination target in this tissue.', tone: 'neutral' },
        { alteration: 'SMO p.V319D', result: 'Detected (VUS)', source: 'ctDNA (Guardant360 CDx, May 2026)', category: 'Uncertain significance', implication: 'Variant of uncertain clinical significance, under watch.', tone: 'neutral' },
      ]
)
</script>

<style scoped>
/* Resultados largos (dos muestras en una celda): la píldora parte línea en vez de
   cortarse en móvil. */
.pill-data {
  white-space: normal;
  border-radius: 12px;
}
</style>
