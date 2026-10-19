<script setup lang="ts">
/**
 * «Muestra y contexto» (decisión D5 del plan «muy útil a científicos», con el OK de la titular al contenido; cotejado
 * contra los informes originales por Polaris y por `verificacion`; párrafo del RE del comité médico, con evidencia
 * primaria). Las cifras vienen de app/utils/celulaContexto.ts; aquí solo el texto. Sin fechas, hospitales ni nombres.
 */
import { SIN_IHQ_PAGINA, HER2_DEBIL_MENOS_DE, HIGADO, HUESO_KI67_APROX, INTERVALOS as I, PRIMARIO_LECTURAS, PRIMARIO_NE_PCT, pc, rangoRePrimario } from '~/utils/celulaContexto'

const props = defineProps<{ lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)
const P = (x: number) => pc(x, props.lang)
const LECTURA = { diagnostico: ['Al diagnóstico', 'At diagnosis'], segunda: ['Segunda opinión', 'Second opinion'], revision: ['Revisión posterior', 'Later review'] } as const
const her2 = (debil: boolean) => (debil
  ? L(`0 (tinción de membrana incompleta y casi imperceptible en menos del ${P(HER2_DEBIL_MENOS_DE)} de las células)`, `0 (incomplete, barely perceptible membrane staining in fewer than ${P(HER2_DEBIL_MENOS_DE)} of cells)`)
  : '0')
const re = computed(() => { const [a, b] = rangoRePrimario(); return props.lang === 'en' ? `${a}-${b}%` : `${a}-${b} %` })
const sinIhq = computed(() => `${SIN_IHQ_PAGINA.slice(0, -1).join(', ')} ${L('ni', 'or')} ${SIN_IHQ_PAGINA.at(-1)}`)
</script>

<template>
  <section id="contexto" class="card-base ctx" aria-labelledby="ctx-t">
    <h2 id="ctx-t" class="ctx__h">{{ L('Muestra y contexto', 'Sample and context') }}</h2>
    <p class="ctx__p">{{ L('Dos biopsias de metástasis (hígado y hueso) de una sola paciente con cáncer de mama. Los datos célula a célula de esta página salen de esas mismas biopsias: el laboratorio identificó cada muestra con el número de registro del bloque que consta en su informe.', 'Two metastasis biopsies (liver and bone) from a single patient with breast cancer. The cell-by-cell data on this page come from those same biopsies: the laboratory labeled each sample with the block registration number that appears in its report.') }}</p>

    <h3 class="ctx__sub">{{ L('Tumor primario', 'Primary tumor') }}</h3>
    <p class="ctx__p">{{ L('Carcinoma infiltrante sin tipo especial con diferenciación neuroendocrina, grado 2. Tres lecturas:', 'Invasive carcinoma of no special type with neuroendocrine differentiation, grade 2. Three readings:') }}</p>
    <div class="ctx__scroll" tabindex="0" role="region" :aria-label="L('Tres lecturas del tumor primario', 'Three readings of the primary tumor')">
      <table class="ctx__tabla">
        <thead>
          <tr>
            <th scope="col">{{ L('Lectura', 'Reading') }}</th>
            <th scope="col" class="ctx__num">{{ L('RE', 'ER') }}</th>
            <th scope="col" class="ctx__num">{{ L('RP', 'PR') }}</th>
            <th scope="col">HER2</th>
            <th scope="col" class="ctx__num">Ki-67</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in PRIMARIO_LECTURAS" :key="l.id">
            <th scope="row">{{ L(LECTURA[l.id][0], LECTURA[l.id][1]) }}</th>
            <td class="ctx__num nums">{{ P(l.re) }}</td>
            <td class="ctx__num nums">{{ P(l.rp) }}</td>
            <td>{{ her2(l.her2Debil) }}</td>
            <td class="ctx__num nums">{{ l.ki67 == null ? L('no consta', 'not reported') : P(l.ki67) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="ctx__p">{{ L(`Marcadores neuroendocrinos: al diagnóstico, cromogranina y sinaptofisina positivas (${P(PRIMARIO_NE_PCT)}); en la revisión, cromogranina focal, sinaptofisina heterogénea e INSM1 positiva.`, `Neuroendocrine markers: at diagnosis, chromogranin and synaptophysin positive (${P(PRIMARIO_NE_PCT)}); at the review, focal chromogranin, heterogeneous synaptophysin and positive INSM1.`) }}</p>

    <h3 class="ctx__sub">{{ L('Metástasis del hígado', 'Liver metastasis') }}</h3>
    <p class="ctx__p">{{ L(`Carcinoma con diferenciación neuroendocrina, compatible con metástasis de carcinoma de mama. RE ${P(HIGADO.re)}, RP ${P(HIGADO.rp)} (${HIGADO.rpIntensidad}), HER2 0; cromogranina A y sinaptofisina positivas. El informe no da Ki-67.`, `Carcinoma with neuroendocrine differentiation, consistent with metastasis of breast carcinoma. ER ${P(HIGADO.re)}, PR ${P(HIGADO.rp)} (${HIGADO.rpIntensidad}), HER2 0; chromogranin A and synaptophysin positive. Ki-67 is not reported.`) }}</p>

    <h3 class="ctx__sub">{{ L('Metástasis del hueso (ilion)', 'Bone metastasis (ilium)') }}</h3>
    <p class="ctx__p">{{ L(`El informe habla de metástasis del «tumor neuroendocrino (NET) de la mama» ya conocido: es la etiqueta que traía la petición. Sinaptofisina positiva, Ki-67 en torno al ${P(HUESO_KI67_APROX)} y poco tejido tumoral. El patólogo la describe como moderadamente diferenciada y advierte que la gradación no está establecida en biopsias pequeñas. Esta biopsia no informa RE, RP ni HER2.`, `The report refers to a metastasis of the known “neuroendocrine tumor (NET) of the breast”: that is the label on the request. Synaptophysin positive, Ki-67 around ${P(HUESO_KI67_APROX)} and little tumor tissue. The pathologist describes it as moderately differentiated and notes that grading is not established on small biopsies. ER, PR and HER2 are not reported for this biopsy.`) }}</p>

    <h3 class="ctx__sub">{{ L('Tratamiento antes de cada biopsia', 'Treatment before each biopsy') }}</h3>
    <ul class="ctx__lista" role="list">
      <li>
        <strong>{{ L('Hueso:', 'Bone:') }}</strong> {{ L('después de dos líneas hormonales, las dos con un inhibidor de CDK4/6:', 'after two lines of endocrine therapy, both with a CDK4/6 inhibitor:') }}
        <ul class="ctx__sublista" role="list">
          <li>{{ L(`1.ª: análogo de LHRH y letrozol, con ribociclib, que se suspendió a los ${I.ribociclibDias} días por toxicidad grave;`, `1st: LHRH analog and letrozole, with ribociclib, which was stopped after ${I.ribociclibDias} days for severe toxicity;`) }}</li>
          <li>{{ L('2.ª: fulvestrant con abemaciclib;', '2nd: fulvestrant with abemaciclib;') }}</li>
          <li>{{ L(`biopsia: unas ${I.huesoTrasCdk46Semanas} semanas después de la última dosis del inhibidor de CDK4/6, unas ${I.huesoTrasFulvestrantSemanas} semanas después de la última de fulvestrant y antes de empezar la 3.ª línea.`, `biopsy: about ${I.huesoTrasCdk46Semanas} weeks after the last dose of the CDK4/6 inhibitor, about ${I.huesoTrasFulvestrantSemanas} weeks after the last dose of fulvestrant and before starting the 3rd line.`) }}</li>
        </ul>
      </li>
      <li><strong>{{ L('Hígado:', 'Liver:') }}</strong> {{ L(`lo mismo y, además, la 3.ª línea en curso desde hacía unas ${I.higadoEn3lSemanas} semanas: fulvestrant con un fármaco experimental dentro de un ensayo clínico.`, `the same, plus the 3rd line, which had been under way for about ${I.higadoEn3lSemanas} weeks: fulvestrant with an experimental drug in a clinical trial.`) }}</li>
      <li><strong>{{ L('En las dos:', 'Both:') }}</strong> {{ L('ácido zoledrónico desde el diagnóstico. Radioterapia previa en dos lesiones de la columna; ninguna lesión biopsiada se irradió. Antes de las biopsias no hubo quimioterapia, inmunoterapia ni anticuerpos conjugados (ADC).', 'zoledronic acid since diagnosis. Prior radiotherapy to two spine lesions; neither biopsied lesion was irradiated. Before the biopsies there was no chemotherapy, immunotherapy or antibody-drug conjugates (ADCs).') }}</li>
    </ul>

    <h3 class="ctx__sub">{{ L('Cómo leer el RE', 'How to read ER') }}</h3>
    <p class="ctx__p">{{ L(`La inmunohistoquímica de RE fue del ${re} en el primario y del ${P(HIGADO.re)} en la metástasis del hígado. Las dos biopsias de metástasis se tomaron con fulvestrant presente: la del hígado, en tratamiento (unas ${I.higadoEn3lSemanas} semanas en la 3.ª línea, tras unos ${I.fulvestrant2lMeses} meses en la 2.ª); la del hueso, unas ${I.huesoTrasFulvestrantSemanas} semanas después de la última dosis (la semivida del fármaco es de unos ${I.semividaFulvestrantDias} días). En tumores primarios biopsiados antes y durante el tratamiento (de días a ${I.ventanaMaxSemanas} semanas), el fulvestrant baja la tinción de RE por inmunohistoquímica sin bajar el ARN de ESR1; no se han encontrado datos equivalentes en metástasis tras una exposición larga. Por eso un RE del ${P(HIGADO.re)} bajo fulvestrant no distingue por sí solo entre una pérdida real del receptor y el efecto del fármaco. El ESR1 de esta página es ARN.`,
      `ER immunohistochemistry was ${re} in the primary and ${P(HIGADO.re)} in the liver metastasis. Both metastasis biopsies were taken with fulvestrant present: the liver biopsy on treatment (about ${I.higadoEn3lSemanas} weeks into the 3rd line, after about ${I.fulvestrant2lMeses} months on the 2nd); the bone biopsy about ${I.huesoTrasFulvestrantSemanas} weeks after the last dose (the drug’s half-life is about ${I.semividaFulvestrantDias} days). In primary tumors biopsied before and during treatment (days to ${I.ventanaMaxSemanas} weeks), fulvestrant lowers ER staining by immunohistochemistry without lowering ESR1 RNA; no equivalent data have been found in metastases after long exposure. So an ER of ${P(HIGADO.re)} on fulvestrant does not, by itself, distinguish a real loss of the receptor from the drug’s effect. ESR1 on this page is RNA.`) }}</p>
    <p class="ctx__p ctx__p--sm">{{ L(`Las cifras de los marcadores son de inmunohistoquímica (proteína) y vienen de los informes de anatomía patológica; las de la página son de ARN. Ninguno de esos informes trae inmunohistoquímica de ${sinIhq}: de esas proteínas solo está el ARN de esta página.`, `The marker figures are immunohistochemistry (protein) from the pathology reports; the page’s figures are RNA. None of those reports includes immunohistochemistry for ${sinIhq}: for those proteins there is only the RNA on this page.`) }}</p>
  </section>
</template>

<style scoped>
.ctx { padding: var(--sp-16) var(--sp-24); color: var(--texto-1); }
@media (min-width: 640px) { .ctx { padding: var(--sp-24); } }
.ctx__h { font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0; }
.ctx__sub { font: 600 var(--texto-base)/1.3 var(--font-body); color: var(--texto-1); margin: var(--sp-24) 0 var(--sp-8); }
.ctx__p { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.ctx__p--sm { font-size: var(--texto-xs); }
.ctx__scroll { margin-top: var(--sp-8); max-width: 46rem; overflow-x: auto; border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); }
.ctx__scroll:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.ctx__tabla { width: 100%; border-collapse: collapse; font: var(--tipo-body-sm); color: var(--texto-1); min-width: 520px; }
.ctx__tabla th, .ctx__tabla td { padding: var(--sp-8) var(--sp-12); text-align: left; border-bottom: 1px solid var(--trazo-sutil); vertical-align: top; }
.ctx__tabla thead th { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); background: var(--superficie); }
.ctx__tabla tbody tr:last-child > * { border-bottom: 0; }
.ctx__num { text-align: right !important; white-space: nowrap; }
.ctx__lista { margin: var(--sp-8) 0 0; padding-left: 1.2em; list-style: disc; display: grid; gap: var(--sp-8); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }
.ctx__lista strong { color: var(--texto-1); }
.ctx__sublista { margin: var(--sp-4) 0 0; padding-left: 1.2em; list-style: circle; display: grid; gap: var(--sp-4); }
</style>
