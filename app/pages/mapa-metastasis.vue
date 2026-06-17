<script setup lang="ts">
/**
 * Mapa interactivo de metástasis — doble trazador (⁶⁸Ga-DOTATOC vs ¹⁸F-FDG)
 *
 * Reúne y visualiza fuentes propias de la paciente, sin interpretación añadida
 * más allá de lo que dicen los informes:
 *  - PET-CT ¹⁸F-FDG (Virgen de la Arrixaca, 24/03/2026)
 *  - PET-CT ⁶⁸Ga-DOTATOC (Virgen de la Arrixaca, 26/05/2026)
 *  - RMN de columna cervical y dorsal (11/06/2026)
 * Las imágenes se reconstruyen a partir de los DICOM de esos mismos estudios.
 * Herramienta de comprensión y apoyo a la conversación clínica — no es consejo médico.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

useHead({
  // Panel clínico para el equipo (radiología / medicina nuclear): apoya la
  // conversación sobre qué foco rebiopsiar. Página privada (noindex): el título
  // y la meta describen el contenido con honestidad, sin objetivo SEO.
  title: () =>
    lang.value === 'en'
      ? 'Bone lesion map — dual-tracer PET (biopsy targeting)'
      : 'Mapa de lesiones óseas — PET doble trazador (elección de diana)',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content: () =>
        lang.value === 'en'
          ? 'Interactive panel of the bone lesions with dual-tracer PET (Gallium-68 DOTATOC and FDG) over the patient’s own reports, to support choosing a re-biopsy target. Describes the findings; it does not conclude.'
          : 'Panel interactivo de las lesiones óseas con PET doble trazador (Galio-68 DOTATOC y FDG) sobre los informes propios de la paciente, para apoyar la elección de la diana de rebiopsia. Describe los hallazgos; no concluye.',
    },
  ],
})

/* ------------------------------------------------------------------ */
/*  Paleta por trazador (espectro: solo receptor → mixto → solo azúcar) */
/*  violeta = Galio / receptor · coral = FDG / azúcar                    */
/* ------------------------------------------------------------------ */
type Pheno = 'ne' | 'mixNe' | 'mixBal' | 'mixAgg' | 'agg'
const PHENO: Record<Pheno, { c: string; es: string; en: string }> = {
  ne:     { c: '#9d44ab', es: 'Solo receptor (Galio)', en: 'Receptor only (Gallium)' },
  mixNe:  { c: '#8a5bb3', es: 'Mixto · más receptor', en: 'Mixed · more receptor' },
  mixBal: { c: '#c9921e', es: 'Mixto · equilibrado', en: 'Mixed · balanced' },
  mixAgg: { c: '#df7a44', es: 'Mixto · más azúcar', en: 'Mixed · more sugar' },
  agg:    { c: '#bb4128', es: 'Solo azúcar (FDG), sin receptor', en: 'Sugar only (FDG), no receptor' },
}

/* ------------------------------------------------------------------ */
/*  Las 16 focos — datos literales de los informes PET                 */
/*  dota = SUVmax ⁶⁸Ga-DOTATOC · fdg = SUVmax ¹⁸F-FDG · prevFdg = previo */
/* ------------------------------------------------------------------ */
interface Lesion {
  id: number
  x: number; y: number; r?: number
  level: { es: string; en: string }
  region: { es: string; en: string }
  side: 'R' | 'L' | 'C'
  size?: string
  dota: number | null
  fdg: number | null
  prevFdg?: number | null
  pheno: Pheno
  scler?: boolean
  load?: boolean
  what: { es: string; en: string }
  tech: { es: string; en: string }
  img?: string
  source?: 'informe' | 'ambos' | 'ia-david'
  /* lectura de la RMN de columna (cervical/dorsal) — solo donde la RMN cubre el nivel */
  rmn?: { es: string; en: string }
  /* biopsia previa de ESTE foco (hecho del caso). Honesto y neutral: informa, no concluye. */
  priorBiopsy?: { es: string; en: string }
  /* componente de partes blandas / extensión extraósea descrito por la RMN (p.ej. epidural
     de D11). Es un dato de FORMA/extensión del informe, no biología ni un trazador. Importa
     para la FACTIBILIDAD: una diana de partes blandas suele rendir más tejido que el hueso
     denso, PERO la proximidad a estructuras (canal, raíces) la valora intervencionista. */
  softTissue?: { es: string; en: string }
}

/* ------------------------------------------------------------------ */
/*  view = la MEJOR imagen real para cada foco (P0 · enlace foco↔imagen) */
/*    kind 'axial'   → recorte axial PET/TC, la lesión va centrada (sin marcador)   */
/*    kind 'sagittal'→ sagital PET del trazador dominante + diana APROXIMADA        */
/*    kind 'mip'     → MIP de cuerpo entero + diana APROXIMADA (último recurso)      */
/*  fx/fy = fracción 0-1 del marcador; approx = la posición es estimada por anatomía */
interface LesionView {
  src: string
  fx: number | null
  fy: number | null
  zoom: number
  kind: 'axial' | 'sagittal' | 'mip'
  approx: boolean
  tracer: 'ga' | 'fdg' | null
}

const LES: Lesion[] = [
  {
    id: 1, x: 220, y: 90, side: 'C', dota: 2.89, fdg: null, pheno: 'ne',
    level: { es: 'C3 · apófisis espinosa', en: 'C3 · spinous process' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Hueso de una vértebra del cuello (la espinosa, la punta que se palpa en la nuca). Solo capta el trazador del receptor; el del azúcar no la ve.', en: 'Bone of a neck vertebra (the spinous process you can feel at the back of the neck). Only the receptor tracer lights it up; the sugar tracer does not.' },
    tech: { es: 'DOTATOC SUVmáx 2.89, sin captación FDG. Capta solo el receptor (Galio); nada de azúcar (FDG).', en: 'DOTATOC SUVmax 2.89, no FDG uptake. Takes up only the receptor (gallium); no sugar (FDG).' },
  },
  {
    id: 2, x: 206, y: 104, side: 'R', dota: 3.10, fdg: null, pheno: 'ne',
    level: { es: 'C4 · lámina / arco derecho', en: 'C4 · right lamina / arch' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Parte posterior de la vértebra C4 (el arco óseo que protege la médula), lado derecho. Captación solo del receptor.', en: 'Posterior part of the C4 vertebra (the bony arch that protects the cord), right side. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.10, sin FDG. Capta solo el receptor (Galio).', en: 'DOTATOC SUVmax 3.10, no FDG. Takes up only the receptor (gallium).' },
  },
  {
    id: 3, x: 120, y: 205, side: 'R', dota: 3.84, fdg: null, pheno: 'ne',
    level: { es: 'Escápula derecha', en: 'Right scapula' },
    region: { es: 'Cintura escapular', en: 'Shoulder girdle' },
    what: { es: 'Omóplato derecho (el hueso plano de la espalda alta, bajo el hombro). No es columna. Capta solo el receptor.', en: 'Right shoulder blade (the flat bone of the upper back, below the shoulder). Not spine. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.84, sin FDG. Capta solo el receptor (Galio), fuera del eje axial.', en: 'DOTATOC SUVmax 3.84, no FDG. Takes up only the receptor (gallium), off the axial skeleton.' },
  },
  {
    id: 4, x: 220, y: 156, side: 'C', dota: 4.23, fdg: 6.97, prevFdg: 2.8, pheno: 'mixAgg', size: '14 × 10',
    level: { es: 'D1 (T1) · cuerpo vertebral', en: 'T1 · vertebral body' },
    region: { es: 'Columna dorsal alta', en: 'Upper thoracic spine' },
    what: { es: 'Primera vértebra dorsal, justo bajo el cuello. Foco nuevo: en el PET previo casi no se veía y ahora capta azúcar con fuerza.', en: 'First thoracic vertebra, just below the neck. New focus: barely visible on the prior PET and now strongly sugar-avid.' },
    tech: { es: 'DOTATOC 4.23 / FDG 6.97 (previo 2.8, no significativo). Foco nuevo: más captación de azúcar (FDG) que en el PET previo. Capta más azúcar que receptor.', en: 'DOTATOC 4.23 / FDG 6.97 (prior 2.8, non-significant). New focus: more sugar (FDG) uptake than in the prior PET. More sugar than receptor.' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: componente blástico (hueso denso) en la verificación por TC. La forma y la médula ósea se ven mejor en la RMN — míralo en el visor.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic component (dense bone) on the CT check. Shape and bone marrow are better seen on MRI — view it in the viewer.' },
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne', size: '14 × 10',
    img: 'les05',
    level: { es: 'D5 (T5) · cuerpo vertebral', en: 'T5 · vertebral body' },
    region: { es: 'Columna dorsal media', en: 'Mid-thoracic spine' },
    what: { es: 'Cuerpo de una vértebra de la mitad de la espalda. Captación moderada-alta del receptor (Galio), sin azúcar (FDG).', en: 'Body of a mid-back vertebra. Moderate-high receptor (gallium) uptake, no sugar (FDG).' },
    tech: { es: 'DOTATOC SUVmáx 6.17, sin FDG. Capta solo el receptor (Galio), de intensidad moderada.', en: 'DOTATOC SUVmax 6.17, no FDG. Takes up only the receptor (gallium), moderate intensity.' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: lesión blástica (hueso denso). Es un dato de FORMA, no un tercer color.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic lesion (dense bone). This is a SHAPE finding, not a third colour.' },
  },
  {
    id: 6, x: 212, y: 313, side: 'R', dota: 1.37, fdg: null, pheno: 'ne',
    level: { es: 'D9 (T9) · cuerpo derecho', en: 'T9 · right body' },
    region: { es: 'Columna dorsal baja', en: 'Lower thoracic spine' },
    what: { es: 'Vértebra dorsal baja, lado derecho. Captación leve solo del receptor (Galio); poca captación.', en: 'Lower thoracic vertebra, right side. Mild receptor-only (gallium) uptake; low uptake.' },
    tech: { es: 'DOTATOC SUVmáx 1.37, sin FDG. Capta solo el receptor (Galio), de baja intensidad.', en: 'DOTATOC SUVmax 1.37, no FDG. Takes up only the receptor (gallium), low intensity.' },
  },
  {
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, pheno: 'mixNe', size: '18 × 14',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    img: 'gal_spine',
    what: { es: 'Una de las lesiones más intensas. Es la que más capta el receptor (Galio) de todas, y también capta algo de azúcar, aunque el azúcar ha bajado respecto al PET previo. Hueso denso (blástico).', en: 'One of the most intense lesions. It is the one that takes up the most receptor (gallium) of all, and also takes up some sugar, though sugar dropped versus the prior PET. Dense (blastic) bone.' },
    tech: { es: 'DOTATOC SUVmáx 13.27 (captación de Galio muy intensa) / FDG 7.61 (previo 10.19, en descenso). Mixto: capta mucho más receptor (Galio) que azúcar (FDG). Lesión blástica.', en: 'DOTATOC SUVmax 13.27 (very intense gallium uptake) / FDG 7.61 (prior 10.19, decreasing). Mixed: takes up far more receptor (gallium) than sugar (FDG). Blastic lesion.' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: lesión blástica (hueso denso). El informe de RM describe en D11 extensión al espacio epidural anterior y afectación del canal lateral izquierdo. Es un dato de FORMA, no un tercer color.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic lesion (dense bone). The MRI report describes anterior epidural extension and left lateral canal compromise at D11. This is a SHAPE finding, not a third colour.' },
    softTissue: { es: 'La RMN describe componente de partes blandas / extensión extraósea (espacio epidural anterior, canal lateral izquierdo). El tejido blando suele rentabilizar más que el hueso blástico denso, pero por su vecindad al canal y a las raíces la accesibilidad y la seguridad las valora radiología intervencionista.', en: 'The MRI describes a soft-tissue / extraosseous component (anterior epidural space, left lateral canal). Soft tissue usually yields more than dense blastic bone, but given its proximity to the canal and nerve roots, accessibility and safety are assessed by interventional radiology.' },
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, pheno: 'ne', size: '13 × 10',
    level: { es: 'D11 (T11) · pedículo izquierdo', en: 'T11 · left pedicle' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'En la MISMA vértebra que la #7 pero en el pedículo izquierdo (el puente óseo lateral): aquí solo capta el receptor, no azúcar. Misma vértebra, dos comportamientos distintos.', en: 'In the SAME vertebra as #7 but in the left pedicle (the lateral bony bridge): here only the receptor lights up, no sugar. Same vertebra, two different behaviours.' },
    tech: { es: 'DOTATOC SUVmáx 11.63, sin FDG. Receptor-puro intenso. Ilustra la heterogeneidad intra-vértebra junto a la #7.', en: 'DOTATOC SUVmax 11.63, no FDG. Intense receptor-only. Illustrates intra-vertebral heterogeneity alongside #7.' },
    rmn: { es: 'Misma vértebra D11 (la RMN de columna cubre este nivel). Forma: componente blástico; el detalle de la médula ósea se ve en el visor RMN.', en: 'Same D11 vertebra (the spine MRI covers this level). Shape: blastic component; bone-marrow detail is visible in the MRI viewer.' },
  },
  {
    id: 9, x: 220, y: 392, side: 'C', dota: 3.66, fdg: null, pheno: 'ne', size: '10 × 8',
    level: { es: 'L1 · apófisis espinosa', en: 'L1 · spinous process' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'Punta posterior de la primera lumbar. Capta solo el receptor.', en: 'Posterior tip of the first lumbar vertebra. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.66, sin FDG. Receptor-puro.', en: 'DOTATOC SUVmax 3.66, no FDG. Receptor-only.' },
  },
  {
    id: 10, x: 241, y: 399, side: 'L', dota: null, fdg: 6.84, prevFdg: 4.67, pheno: 'agg',
    level: { es: 'L1 · pedículo izquierdo', en: 'L1 · left pedicle' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'La ÚNICA lesión que capta azúcar pero NO el receptor, y va en aumento. Solo azúcar: el Galio (receptor) no la ve.', en: 'The ONLY lesion that takes up sugar but NOT the receptor, and it is increasing. Sugar only: gallium (the receptor) does not see it.' },
    tech: { es: 'FDG SUVmáx 6.84 (previo 4.67, en aumento), SIN captación de Galio. Capta solo azúcar (FDG), nada de receptor. Discordante con la #9 (misma vértebra).', en: 'FDG SUVmax 6.84 (prior 4.67, rising), NO gallium uptake. Takes up only sugar (FDG), no receptor. Discordant with #9 (same vertebra).' },
  },
  {
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe', size: '18 × 13',
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'Última vértebra lumbar, zona de mucha carga. Capta intensamente el receptor y algo de azúcar (estable). Predominio del receptor.', en: 'Last lumbar vertebra, a high-load zone. Intense receptor uptake plus some sugar (stable). Receptor-predominant.' },
    tech: { es: 'DOTATOC SUVmáx 12.14 (SSTR intensa) / FDG 5.0 (previo 4.81, estable). Mixto, predominio receptor.', en: 'DOTATOC SUVmax 12.14 (intense SSTR) / FDG 5.0 (prior 4.81, stable). Mixed, receptor-predominant.' },
  },
  {
    id: 12, x: 205, y: 505, side: 'R', dota: 4.27, fdg: 4.34, prevFdg: 6.26, pheno: 'mixBal', size: '12 × 9',
    level: { es: 'Ala sacra derecha', en: 'Right sacral ala' },
    region: { es: 'Sacro', en: 'Sacrum' },
    what: { es: 'Parte alta y lateral del sacro (el hueso triangular bajo la columna), lado derecho. Capta los dos trazadores por igual; el azúcar ha bajado respecto al previo.', en: 'Upper-lateral part of the sacrum (the triangular bone below the spine), right side. Takes up both tracers about equally; sugar dropped versus the prior.' },
    tech: { es: 'DOTATOC 4.27 / FDG 4.34 (previo 6.26, en descenso). Mixto equilibrado; capta menos azúcar (FDG) que en el previo.', en: 'DOTATOC 4.27 / FDG 4.34 (prior 6.26, decreasing). Balanced mixed; takes up less sugar (FDG) than before.' },
  },
  {
    id: 13, x: 165, y: 545, side: 'R', dota: 4.32, fdg: 7.71, prevFdg: 7.0, pheno: 'mixAgg', size: '11 × 8',
    level: { es: 'Ilíaco derecho · ala ilíaca', en: 'Right iliac · iliac wing' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    img: 'crop_iliac',
    what: { es: 'Hueso de la pelvis (ala ilíaca) derecho. Capta los dos trazadores, con más azúcar que receptor.', en: 'Right pelvic bone (iliac wing). Takes up both tracers, more sugar than receptor.' },
    tech: { es: 'DOTATOC 4.32 / FDG 7.71 (previo 7.0, ligero aumento). Mixto, más azúcar que receptor.', en: 'DOTATOC 4.32 / FDG 7.71 (prior 7.0, slight rise). Mixed, more sugar than receptor.' },
    priorBiopsy: {
      es: 'Biopsia previa de este foco (26B585): solo dio hueso y músculo, sin tumor evaluable. El hueso blástico denso es difícil de rentabilizar en la biopsia (suele dar poco tejido tumoral).',
      en: 'Prior biopsy of this focus (26B585): yielded only bone and muscle, no evaluable tumour. Dense blastic bone is hard to make diagnostic on biopsy (it usually yields little tumour tissue).',
    },
  },
  {
    id: 14, x: 172, y: 585, side: 'R', dota: 3.96, fdg: 9.33, prevFdg: 4.0, load: true, pheno: 'mixAgg', size: '14 × 11',
    level: { es: 'Ilíaco derecho supraacetabular', en: 'Right supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    img: 'crop_iliac',
    what: { es: 'Justo encima de la cadera derecha (el “techo” donde encaja el fémur). El azúcar (FDG) se ha más que duplicado respecto al estudio previo. Es hueso de carga; Oncología Radioterápica ya lo revisó.', en: 'Just above the right hip (the “roof” where the femur sits). Sugar has more than doubled versus the prior study. It is weight-bearing bone; Radiation Oncology has already reviewed it.' },
    tech: { es: 'DOTATOC 3.96 / FDG 9.33 (previo 4.0, en claro aumento). Mixto, más azúcar que receptor, hueso de carga. Revisado por Oncología Radioterápica.', en: 'DOTATOC 3.96 / FDG 9.33 (prior 4.0, clearly rising). Mixed, more sugar than receptor, weight-bearing bone. Reviewed by Radiation Oncology.' },
  },
  {
    id: 15, x: 275, y: 585, side: 'L', dota: 2.54, fdg: 3.97, prevFdg: 1.93, pheno: 'mixAgg',
    level: { es: 'Ilíaco izquierdo supraacetabular', en: 'Left supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'El reflejo del anterior en el lado izquierdo. Foco nuevo, de baja intensidad pero en aumento.', en: 'The mirror of the previous one on the left side. New focus, low intensity but increasing.' },
    tech: { es: 'FDG 3.97 (previo 1.93, nuevo) con DOTATOC 2.54. Foco mixto nuevo, de baja intensidad. (Discreta discordancia entre informes en la descripción del receptor.)', en: 'FDG 3.97 (prior 1.93, new) with DOTATOC 2.54. New low-intensity mixed focus. (Minor discordance between reports on the receptor description.)' },
  },
  {
    id: 16, x: 158, y: 628, r: 13, side: 'R', dota: 5.09, fdg: 9.43, prevFdg: 6.0, load: true, pheno: 'mixAgg', size: '18 × 13',
    level: { es: 'Fémur proximal derecho', en: 'Right proximal femur' },
    region: { es: 'Cadera derecha', en: 'Right hip' },
    img: 'crop_femur',
    what: { es: 'Parte alta del fémur, en la cadera derecha. Es de las más ávidas de azúcar (FDG) y ha aumentado respecto al estudio previo. Está en un hueso que soporta el peso del cuerpo; Oncología Radioterápica ya lo revisó.', en: 'Upper femur, at the right hip. One of the most sugar-avid and has risen versus the prior study. It sits in a weight-bearing bone; Radiation Oncology has already reviewed it.' },
    tech: { es: 'DOTATOC 5.09 / FDG 9.43 (previo 6.0, en aumento). Mixto, más azúcar que receptor, hueso de carga. Confirmada en corte axial PET/TC (foco intraóseo en cuello femoral).', en: 'DOTATOC 5.09 / FDG 9.43 (prior 6.0, rising). Mixed, more sugar than receptor, weight-bearing bone. Confirmed on axial PET/CT (intra-osseous focus in the femoral neck).' },
  },
  {
    id: 17, x: 182, y: 198, side: 'C', dota: 1.6, fdg: 4.8, pheno: 'mixAgg', size: '≤ 8', source: 'ia-david',
    level: { es: 'Tórax alto / costilla', en: 'Upper thorax / rib' },
    region: { es: 'Parrilla costal', en: 'Rib cage' },
    what: { es: 'Foco en tórax alto / costilla que capta sobre todo azúcar (FDG), de baja intensidad. Lo detectó una IA sobre los DICOM (por confirmar) y el propio análisis lo marca como dudoso — a revisar en visor; no está en el informe oficial.', en: 'Upper thorax / rib focus, mainly sugar-avid (FDG), low intensity. Detected by an AI on the DICOM (to confirm) and the analysis itself marks it as uncertain — to review in a viewer; not in the official report.' },
    tech: { es: 'DOTATOC ~1.6 / FDG ~4.8 (aproximados, medidos sobre los DICOM). Patrón FDG+ con receptor bajo. No confirmado como metástasis en informe oficial; revisar con Medicina Nuclear.', en: 'DOTATOC ~1.6 / FDG ~4.8 (approximate, measured on the DICOM). FDG+ pattern with low receptor. Not confirmed as metastasis in the official report; review with Nuclear Medicine.' },
  },
  {
    id: 18, x: 178, y: 560, side: 'R', dota: 4.3, fdg: 1.7, pheno: 'mixNe', size: '8 × 6', source: 'ia-david',
    level: { es: 'Ilíaco derecho · unión ilíaco-femoral', en: 'Right iliac · iliac-femoral junction' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Foco pélvico leve (zona ilíaco-femoral) que capta sobre todo el receptor (Galio); el azúcar es bajo. Patrón favorable a la diana del receptor. Detectado por IA, por confirmar; no está en el informe oficial.', en: 'Mild pelvic focus (iliac-femoral area) taking up mainly the receptor (gallium); sugar is low. Pattern favourable to the receptor target. AI-detected, to confirm; not in the official report.' },
    tech: { es: 'DOTATOC ~4.3 / FDG ~1.7 (aproximados, sobre los DICOM). Patrón SSTR-favorable. No en informe oficial.', en: 'DOTATOC ~4.3 / FDG ~1.7 (approximate, on the DICOM). SSTR-favourable pattern. Not in the official report.' },
  },
  {
    id: 19, x: 232, y: 150, side: 'C', dota: 4.8, fdg: 3.1, pheno: 'mixBal', size: '8–10', source: 'ia-david',
    level: { es: 'Cervicotorácica / dorsal baja', en: 'Cervicothoracic / lower dorsal' },
    region: { es: 'Transición cervicotorácica', en: 'Cervicothoracic junction' },
    what: { es: 'Foco óseo leve en la zona cervicotorácica, con captación débil de los dos trazadores. Baja intensidad, a correlacionar. Detectado por IA, por confirmar; no está en el informe oficial.', en: 'Mild bone focus in the cervicothoracic area, with weak uptake of both tracers. Low intensity, to be correlated. AI-detected, to confirm; not in the official report.' },
    tech: { es: 'DOTATOC ~4.8 / FDG ~3.1 (aproximados, sobre los DICOM). Baja intensidad; correlacionar. No en informe oficial.', en: 'DOTATOC ~4.8 / FDG ~3.1 (approximate, on the DICOM). Low intensity; correlate. Not in the official report.' },
  },
]

/* % del perfil que corresponde al receptor (orientativo) */
function neShare(le: Lesion): number {
  if (le.fdg == null) return 0.9
  if (le.dota == null) return 0.1
  return le.dota / (le.dota + le.fdg)
}
function phenoColor(le: Lesion) { return PHENO[le.pheno].c }
function phenoLabel(le: Lesion) { return L(PHENO[le.pheno].es, PHENO[le.pheno].en) }
/* color del fenotipo SOLO para TEXTO: los naranjas/ámbar de relleno fallan AA
   sobre el cream, así que el texto usa tonos oscuros (b07d1e / 8a4a1a). Los
   rellenos/puntos/marcadores siguen usando phenoColor (el tono vivo). */
const PHENO_TEXT: Record<Pheno, string> = {
  ne: '#9d44ab', mixNe: '#7a4d9e', mixBal: '#b07d1e', mixAgg: '#8a4a1a', agg: '#bb4128',
}
function phenoText(le: Lesion) { return PHENO_TEXT[le.pheno] }

/* Δ FDG frente al estudio previo (rojo = sube · verde = baja) */
function deltaFdg(le: Lesion): string {
  if (le.fdg == null || le.prevFdg == null) return '—'
  const x = le.fdg - le.prevFdg
  return (x > 0 ? '+' : '') + x.toFixed(1)
}
function deltaStyle(le: Lesion) {
  if (le.fdg == null || le.prevFdg == null) return {}
  const x = le.fdg - le.prevFdg
  if (x > 0.05) return { color: '#bb4128' }
  if (x < -0.05) return { color: '#1f5a3a' }
  return {}
}

/* procedencia del dato de cada foco. Ya NO se muestra como columna en la tabla
   (la distinción informe↔IA es ahora por POSICIÓN: los focos de IA van al final,
   en su propio grupo). `sourceOf` se conserva: distingue los focos de IA (para el
   contorno punteado del esqueleto y el grupo de la tabla). Sin tamaño reportado y
   sin marca explícita → informe; con tamaño → ambos; `ia-david` → detectado por IA. */
function sourceOf(le: Lesion): 'informe' | 'ambos' | 'ia-david' {
  return le.source ?? (le.size ? 'ambos' : 'informe')
}

/* tendencia FDG */
function trend(le: Lesion): { dir: 'up' | 'down' | 'flat' | 'new'; txt: string } | null {
  if (le.fdg == null || le.prevFdg == null) return null
  if (le.prevFdg < 3 && le.fdg >= 3) return { dir: 'new', txt: L('foco nuevo', 'new focus') }
  const d = le.fdg - le.prevFdg
  if (Math.abs(d) < 0.6) return { dir: 'flat', txt: L('estable', 'stable') }
  return d > 0
    ? { dir: 'up', txt: L(`↑ subió (antes ${le.prevFdg})`, `↑ rose (was ${le.prevFdg})`) }
    : { dir: 'down', txt: L(`↓ bajó (antes ${le.prevFdg})`, `↓ fell (was ${le.prevFdg})`) }
}

/* ------------------------------------------------------------------ */
/*  Línea de tiempo del FDG: estudio previo (ene 2026) → actual         */
/*  (mar 2026, 24/03) → Galio (may 2026, 26/05). Los SUVmáx salen de    */
/*  la tabla original (los valores vetados de los informes).            */
/* ------------------------------------------------------------------ */
const FDATES = [
  { es: 'ene 2026', en: 'Jan 2026' }, // FDG previo
  { es: 'mar 2026', en: 'Mar 2026' }, // FDG actual (24/03)
  { es: 'may 2026', en: 'May 2026' }, // Galio (26/05)
]
function valAt(le: Lesion, f: number): number | null {
  if (f === 0) return le.prevFdg ?? null
  if (f === 1) return le.fdg
  return le.dota
}
/* foco que enciende por primera vez en el estudio actual (mismo criterio que trend) */
function isNewAt(le: Lesion, f: number): boolean {
  if (le.source === 'ia-david') return false // sin historial fiable: no marcar "nuevo"
  if (f !== 1 || le.fdg == null || le.fdg < 3) return false
  return le.prevFdg == null || le.prevFdg < 3
}

/* ------------------------------------------------------------------ */
/*  Estado interactivo                                                 */
/* ------------------------------------------------------------------ */
const selected = ref<number>(7)
const filter = ref<'all' | Pheno | 'load' | 'new' | 'ia'>('all')
const sel = computed(() => LES.find((l) => l.id === selected.value)!)

/* pestañas de imagen real reconstruida de los DICOM (mip · pet · rmn) */
const imgTab = ref<'mip' | 'pet' | 'rmn'>('mip')

/* ------------------------------------------------------------------ */
/*  P0 · Enlace foco ↔ imagen (la MEJOR imagen real de cada foco)      */
/*  Prioridad: (1) recorte axial centrado · (2) sagital PET del        */
/*  trazador dominante con diana APROXIMADA por nivel vertebral ·       */
/*  (3) MIP de cuerpo entero con diana aproximada (último recurso).     */
/*  Marcadores: fy calibrado sobre los propios sagitales (el foco       */
/*  gal D11 cae en fy≈0.53; vejiga FDG ≈0.85; cráneo ≈0.05); el resto   */
/*  se interpola por anatomía. fx por trazador (el sagital FDG va algo  */
/*  más a la derecha). Honesto: la posición es ESTIMADA, no medida.     */
const AXIAL_IMGS = new Set(['les05', 'crop_iliac', 'crop_femur'])
function domTracer(le: Lesion): 'ga' | 'fdg' {
  if (le.dota == null) return 'fdg'
  if (le.fdg == null) return 'ga'
  return le.dota >= le.fdg ? 'ga' : 'fdg'
}
/* clave de nivel en columna (vértebra C/D/L) o sacro */
function spineKey(le: Lesion): string | null {
  const v = vertLevelKey(le)
  if (v) return v
  if (/sacr/i.test(le.region.es) || /sacr/i.test(le.level.es)) return 'SACRO'
  return null
}
/* fy 0-1 (vertical) y fx 0-1 (horizontal) del marcador en el sagital, afinado en gal_spine */
const SPINE_XY: Record<string, { fx: number; fy: number }> = {
  C3: { fx: 0.46, fy: 0.235 },
  C4: { fx: 0.46, fy: 0.255 },
  D1: { fx: 0.52, fy: 0.33 }, // solo FDG → +0.06
  D5: { fx: 0.58, fy: 0.42 },
  D9: { fx: 0.6, fy: 0.5 },
  D11: { fx: 0.59, fy: 0.55 },
  L1: { fx: 0.56, fy: 0.6 },
  L5: { fx: 0.57, fy: 0.72 },
  SACRO: { fx: 0.52, fy: 0.78 }, // FDG dominante → +0.06
}
/* MIP (coronal): lado derecho del cuerpo → izquierda del visor (fx<0.5). Aproximado. */
const MIP_XY: Record<number, { fx: number; fy: number; tracer: 'ga' | 'fdg' }> = {
  3: { fx: 0.34, fy: 0.26, tracer: 'ga' }, // escápula derecha (cintura escapular)
  15: { fx: 0.62, fy: 0.78, tracer: 'fdg' }, // ilíaco izquierdo supraacetabular
  17: { fx: 0.55, fy: 0.33, tracer: 'fdg' }, // tórax alto / costilla
  18: { fx: 0.4, fy: 0.74, tracer: 'ga' }, // pélvico / ilíaco-femoral derecho
  19: { fx: 0.5, fy: 0.28, tracer: 'ga' }, // cervicotorácica, línea media
}
function lesionView(le: Lesion): LesionView {
  // 1) recorte axial real: la lesión ya va centrada → sin marcador
  if (le.img && AXIAL_IMGS.has(le.img))
    return { src: `/metastasis/${le.img}.jpg`, fx: null, fy: null, zoom: 1, kind: 'axial', approx: false, tracer: null }
  // 2) sagital PET del trazador dominante + diana aproximada por nivel vertebral
  const sk = spineKey(le)
  if (sk && SPINE_XY[sk]) {
    const tr = domTracer(le)
    const base = SPINE_XY[sk]
    const fx = tr === 'fdg' ? Math.min(base.fx + 0.06, 0.92) : base.fx
    return { src: tr === 'ga' ? '/metastasis/gal_spine.jpg' : '/metastasis/fdg_spine.jpg', fx, fy: base.fy, zoom: 1, kind: 'sagittal', approx: true, tracer: tr }
  }
  // 3) MIP de cuerpo entero + diana aproximada (último recurso)
  const m = MIP_XY[le.id]
  if (m)
    return { src: m.tracer === 'ga' ? '/metastasis/gal_mip_hot.jpg' : '/metastasis/fdg_mip_hot.jpg', fx: m.fx, fy: m.fy, zoom: 1, kind: 'mip', approx: true, tracer: m.tracer }
  const tr = domTracer(le)
  return { src: tr === 'ga' ? '/metastasis/gal_mip_hot.jpg' : '/metastasis/fdg_mip_hot.jpg', fx: 0.5, fy: 0.5, zoom: 1, kind: 'mip', approx: true, tracer: tr }
}
const selView = computed(() => lesionView(sel.value))
const selViewCaption = computed(() => {
  const v = selView.value
  const tr = v.tracer === 'ga' ? L('Galio-68 DOTATOC (receptor)', 'Gallium-68 DOTATOC (receptor)') : v.tracer === 'fdg' ? L('FDG (azúcar)', 'FDG (sugar)') : L('PET/TC', 'PET/CT')
  if (v.kind === 'axial')
    return L('Corte axial PET/TC reconstruido de los DICOM — la lesión va centrada.', 'Axial PET/CT slice reconstructed from the DICOM — the lesion is centered.')
  if (v.kind === 'sagittal')
    return L('Sagital PET · ' + tr + ' (reconstruido de los DICOM). La diana marca la ubicación APROXIMADA por nivel vertebral.', 'Sagittal PET · ' + tr + ' (reconstructed from the DICOM). The target marks the APPROXIMATE location by vertebral level.')
  return L('MIP de cuerpo entero · ' + tr + ' (reconstruido de los DICOM). La diana marca la ubicación APROXIMADA.', 'Whole-body MIP · ' + tr + ' (reconstructed from the DICOM). The target marks the APPROXIMATE location.')
})

/* ------------------------------------------------------------------ */
/*  KEY-IMAGES POR FOCO (decisión del comité)                          */
/*  Corte CT+PET fusionado con un anillo marcando el SUVmáx y etiqueta. */
/*  El MANIFEST se deriva de los ficheros REALES en                     */
/*  public/metastasis/foco-key/ (no referenciar imágenes inexistentes): */
/*    · axial  foco-{id}.png  → existe para los 19 focos                 */
/*    · sag    foco-{id}-sag.png → solo 01,02,04–12 (columna/sacro)      */
/*    · cor    foco-16-cor.png   → solo el fémur (#16)                   */
/*  Casos IA sin círculo fiable:                                         */
/*    · #17 → axial con anillo PUNTEADO «aprox/por confirmar»            */
/*    · #19 → panel con NOTA, sin círculo → mostramos la nota, no diana  */
type KeyPlane = 'axial' | 'sag' | 'cor'
/* ids con sagital y/o coronal disponibles (resto: solo axial) */
const FOCO_KEY_SAG = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12])
const FOCO_KEY_COR = new Set([16])
/* #17: anillo punteado (localización aproximada) · #19: panel-nota, sin círculo */
const FOCO_KEY_DOTTED = new Set([17]) // anillo «aprox/por confirmar»
const FOCO_KEY_NOTE_ONLY = new Set([19]) // panel con nota, sin círculo fiable
function fk(id: number, plane: KeyPlane): string {
  const n = String(id).padStart(2, '0')
  return plane === 'axial'
    ? `/metastasis/foco-key/foco-${n}.png`
    : `/metastasis/foco-key/foco-${n}-${plane}.png`
}
interface KeyImagePlane { plane: KeyPlane; src: string; label: { es: string; en: string } }
interface FocoKeyImage {
  hasReliable: boolean // false → solo nota (sin anillo fiable, #19)
  dotted: boolean // anillo punteado «por confirmar» (#17)
  ai: boolean // foco detectado por IA (#17/#19)
  planes: KeyImagePlane[] // planos REALES disponibles para este foco
}
const PLANE_LABEL: Record<KeyPlane, { es: string; en: string }> = {
  axial: { es: 'Axial', en: 'Axial' },
  sag: { es: 'Sagital', en: 'Sagittal' },
  cor: { es: 'Coronal', en: 'Coronal' },
}
function focoKey(le: Lesion): FocoKeyImage {
  const id = le.id
  const ai = sourceOf(le) === 'ia-david'
  if (FOCO_KEY_NOTE_ONLY.has(id))
    return { hasReliable: false, dotted: false, ai, planes: [] }
  const planes: KeyImagePlane[] = [
    { plane: 'axial', src: fk(id, 'axial'), label: PLANE_LABEL.axial },
  ]
  if (FOCO_KEY_SAG.has(id)) planes.push({ plane: 'sag', src: fk(id, 'sag'), label: PLANE_LABEL.sag })
  if (FOCO_KEY_COR.has(id)) planes.push({ plane: 'cor', src: fk(id, 'cor'), label: PLANE_LABEL.cor })
  return { hasReliable: true, dotted: FOCO_KEY_DOTTED.has(id), ai, planes }
}
const selKey = computed(() => focoKey(sel.value))
/* caption HONESTO del comité (mismo texto para miniatura y lightbox) */
function keyCaption(le: Lesion): string {
  const k = focoKey(le)
  const base = L(
    'Imagen clave reconstruida del PET/CT: el anillo señala el SUVmáx (un vóxel); fusión aproximada por resolución y co-registro. No es una relectura formal — la firman los radiólogos.',
    'Key image reconstructed from the PET/CT: the ring marks the SUVmax (a single voxel); fusion is approximate due to resolution and co-registration. Not a formal re-read — the radiologists sign it off.',
  )
  if (!k.hasReliable || k.dotted)
    return L('Localización aproximada · por confirmar. ', 'Approximate location · to confirm. ') + base
  return base
}
const selKeyCaption = computed(() => keyCaption(sel.value))

/* ---- Lightbox de la imagen clave (modal con zoom/pan + toggle de plano) ---- */
const keyLightboxOpen = ref(false)
const keyPlane = ref<KeyPlane>('axial')
const selKeyActive = computed(
  () => selKey.value.planes.find((p) => p.plane === keyPlane.value) ?? selKey.value.planes[0],
)
function openKeyLightbox(plane: KeyPlane = 'axial') {
  if (!selKey.value.hasReliable) return // #19: solo nota, sin lightbox
  // si el plano pedido no existe para este foco, cae al axial (siempre presente)
  keyPlane.value = selKey.value.planes.some((p) => p.plane === plane) ? plane : 'axial'
  keyLightboxOpen.value = true
}
function closeKeyLightbox() { keyLightboxOpen.value = false }
/* Galería contact-sheet: abre el MISMO lightbox seleccionando ese foco.
   Calcula el plano sobre el focoKey del foco destino (no sobre selKey, que
   se recalcula de forma reactiva tras cambiar `selected`). */
function openKeyLightboxFor(id: number, plane: KeyPlane = 'axial') {
  const le = LES.find((l) => l.id === id)
  if (!le) return
  const k = focoKey(le)
  if (!k.hasReliable) { selected.value = id; return } // #19: solo nota, sin lightbox
  selected.value = id
  keyPlane.value = k.planes.some((p) => p.plane === plane) ? plane : 'axial'
  keyLightboxOpen.value = true
}
/* si cambia el foco seleccionado mientras está abierto, resetea el plano al axial.
   Excepción: cuando la apertura viene de la galería ya fija el plano correcto. */
watch(selected, () => { if (!keyLightboxOpen.value) keyPlane.value = 'axial' })

/* ------------------------------------------------------------------ */
/*  LIGHTBOX de la IMAGEN REAL (pestañas MIP / PET) — petición paciente: */
/*  ampliar en popup grande con zoom y poder ver «las 4 a la vez» (las 4 */
/*  PET: MIP Galio, MIP FDG, sagital Galio, sagital FDG) en cuadrícula   */
/*  2×2 para compararlas de golpe. Reutiliza ImageZoomViewer (mismo visor */
/*  de zoom/pan) y el mismo patrón de modal/Teleport que la key-image.   */
interface PetImg { src: string; tracer: 'ga' | 'fdg'; kind: 'mip' | 'sag'; es: string; en: string }
const PET_IMGS: PetImg[] = [
  { src: '/metastasis/gal_mip_hot.jpg', tracer: 'ga', kind: 'mip', es: 'MIP · ⁶⁸Ga-DOTATOC (receptor)', en: 'MIP · ⁶⁸Ga-DOTATOC (receptor)' },
  { src: '/metastasis/fdg_mip_hot.jpg', tracer: 'fdg', kind: 'mip', es: 'MIP · ¹⁸F-FDG (azúcar)', en: 'MIP · ¹⁸F-FDG (sugar)' },
  { src: '/metastasis/gal_spine.jpg', tracer: 'ga', kind: 'sag', es: 'Columna sagital · ⁶⁸Ga-DOTATOC (receptor)', en: 'Sagittal spine · ⁶⁸Ga-DOTATOC (receptor)' },
  { src: '/metastasis/fdg_spine.jpg', tracer: 'fdg', kind: 'sag', es: 'Columna sagital · ¹⁸F-FDG (azúcar)', en: 'Sagittal spine · ¹⁸F-FDG (sugar)' },
]
function petTracerColor(p: PetImg): string { return p.tracer === 'ga' ? '#9d44ab' : '#bb4128' }
/* abierto + modo: 'single' (una ampliada) | 'grid' (las 4 PET a la vez 2×2) */
const petLightboxOpen = ref(false)
const petLightboxMode = ref<'single' | 'grid'>('single')
const petLightboxSrc = ref<string>(PET_IMGS[0].src)
const petLightboxImg = computed(() => PET_IMGS.find((p) => p.src === petLightboxSrc.value) ?? PET_IMGS[0])
function openPetLightbox(src: string) {
  petLightboxMode.value = 'single'
  petLightboxSrc.value = src
  petLightboxOpen.value = true
}
function openPetGrid() {
  petLightboxMode.value = 'grid'
  petLightboxOpen.value = true
}
function closePetLightbox() { petLightboxOpen.value = false }
/* dentro del popup: de la cuadrícula → ampliar una sola; de una sola → volver a las 4 */
function petLightboxShowSingle(src: string) { petLightboxSrc.value = src; petLightboxMode.value = 'single' }
function petLightboxShowGrid() { petLightboxMode.value = 'grid' }
function onPetLightboxEsc(e: KeyboardEvent) { if (e.key === 'Escape') closePetLightbox() }
watch(petLightboxOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) document.addEventListener('keydown', onPetLightboxEsc)
  else document.removeEventListener('keydown', onPetLightboxEsc)
})

/* ------------------------------------------------------------------ */
/*  GALERÍA "contact-sheet" de TODAS las key-images (petición paciente) */
/*  Confirmadas primero (por id), focos de IA al final con su marca.    */
/*  Etiqueta por miniatura: #id · localización · trazador SUVmáx.       */
/* ------------------------------------------------------------------ */
const keyGallery = computed<Lesion[]>(() => [...confirmedFoci.value, ...aiFoci.value])
/* trazador dominante + su SUVmáx, como etiqueta corta (FORMA/dato, no biología) */
function keyTracerLabel(le: Lesion): string {
  const tr = domTracer(le)
  const v = tr === 'ga' ? le.dota : le.fdg
  const name = tr === 'ga' ? L('Ga receptor', 'Ga receptor') : L('FDG azúcar', 'FDG sugar')
  return v != null ? `${name} ${v.toFixed(1)}` : name
}
/* color de texto del trazador dominante (AA sobre cream) */
function keyTracerColor(le: Lesion): string {
  return domTracer(le) === 'ga' ? '#7a3d86' : '#bb4128'
}
/* planos extra disponibles ("+Sag", "+Cor"), sin el axial (siempre presente) */
function keyExtraPlanes(le: Lesion): string[] {
  return focoKey(le).planes.filter((p) => p.plane !== 'axial').map((p) => '+' + p.label[lang.value])
}
/* nombre de descarga de la PNG de una key-image (el propio fichero foco-NN[-plano].png).
   Petición de la paciente: poder descargar la imagen de cada foco. */
function keyDownloadName(src: string): string {
  return src.split('/').pop() || 'foco.png'
}

/* ------------------------------------------------------------------ */
/*  P1 · La lectura RMN (forma) por foco. La RMN disponible cubre        */
/*  cervical y dorsal; en lumbar/sacro/pelvis/cadera no cubre el nivel.  */
function mriCovers(le: Lesion): boolean {
  const v = vertLevelKey(le)
  if (v) { const lvl = v[0]; return lvl === 'C' || lvl === 'D' }
  return /cervico|dorsal/i.test(le.region.es) && !/lumbar|sacro|pelvis|cadera|escapular|costal/i.test(le.region.es)
}
function rmnNote(le: Lesion): string {
  if (le.rmn) return le.rmn[lang.value]
  return L('La RMN de columna cubre este nivel (cervical/dorsal). El detalle de la forma y la médula ósea se ve en el visor.',
           'The spine MRI covers this level (cervical/thoracic). Shape and bone-marrow detail are visible in the viewer.')
}
function goToMRI() {
  imgTab.value = 'rmn'
  if (import.meta.client) nextTick(() => document.getElementById('imagen')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function visible(le: Lesion): boolean {
  if (filter.value === 'all') return true
  if (filter.value === 'load') return !!le.load
  if (filter.value === 'new') return isNewFocus(le)          // foco que enciende por primera vez (FDG)
  if (filter.value === 'ia') return sourceOf(le) === 'ia-david' // detectado por IA (por confirmar)
  return le.pheno === filter.value
}
function pick(id: number) { selected.value = id }

/* ------------------------------------------------------------------ */
/*  Agrupar focos por vértebra → un marcador por vértebra afectada     */
/*  en el esqueleto (D11: #7+#8 · L1: #9+#10). Los focos internos se    */
/*  conmutan con chips en la ficha. Solo vértebras (token C/D/L); el    */
/*  resto de huesos son su propio grupo (foco individual).              */
/* ------------------------------------------------------------------ */
interface LesGroup { key: string; foci: Lesion[]; primary: Lesion; x: number; y: number; multi: boolean }
function vertLevelKey(le: Lesion): string | null {
  const m = (le.level?.es || '').match(/\b([CDL]\d{1,2})\b/)
  return m ? m[1] : null
}
function groupKey(le: Lesion): string { return vertLevelKey(le) ?? 'solo-' + le.id }
const GROUPS: LesGroup[] = (() => {
  const m = new Map<string, Lesion[]>()
  LES.forEach((l) => { const k = groupKey(l); if (!m.has(k)) m.set(k, []); m.get(k)!.push(l) })
  return [...m.entries()].map(([key, foci]) => {
    const primary = [...foci].sort((a, b) => Math.max(b.dota ?? 0, b.fdg ?? 0) - Math.max(a.dota ?? 0, a.fdg ?? 0))[0]
    return { key, foci, primary, multi: foci.length > 1,
      x: foci.reduce((s, l) => s + l.x, 0) / foci.length,
      y: foci.reduce((s, l) => s + l.y, 0) / foci.length }
  })
})()
function isNewFocus(l: Lesion): boolean { return isNewAt(l, 1) }   // foco que enciende por primera vez (FDG)
const newCount = computed(() => LES.filter(isNewFocus).length)
/* ------------------------------------------------------------------ */
/*  Mayor avidez de azúcar (FDG) — PULSO SUTIL.                         */
/*  Criterio descriptivo, por DATO del estudio (no biología): los focos */
/*  con más captación de azúcar, FDG SUVmáx ≥ HOT_FDG. Marca avidez,    */
/*  no malignidad. Es DISTINTO del anillo de «foco nuevo» (que pulsa por */
/*  encender por primera vez en FDG): aquí pulsa el propio marcador, no  */
/*  un anillo aparte, y se explica en la leyenda. Solo focos con valor   */
/*  FDG del informe (los de IA son aproximados → no se destacan así).    */
const HOT_FDG = 7
function isHotFdg(l: Lesion): boolean {
  return l.source !== 'ia-david' && l.fdg != null && l.fdg >= HOT_FDG
}
function gHotFdgAt(g: LesGroup, f: number): boolean {
  return f === 1 && g.foci.some((l) => isHotFdg(l) && presentAt(l, f))
}
/* «foco nuevo» y «detectado por IA» son ahora chips de la fila de filtros
   (vía visible()); el grupo aparece si alguno de sus focos pasa el filtro. */
function groupVisible(g: LesGroup): boolean {
  return g.foci.some(visible)
}
function gPresentAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => presentAt(l, f)) }
function gRadius(g: LesGroup, f: number): number {
  const rs = g.foci.filter((l) => presentAt(l, f)).map((l) => frameRadius(l, f))
  return (rs.length ? Math.max(...rs) : 5) + (g.multi ? 1.5 : 0)
}
function gNewAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => isNewAt(l, f) && presentAt(l, f)) }
function gSelected(g: LesGroup): boolean { return g.foci.some((l) => l.id === selected.value) }
function pickGroup(g: LesGroup) { selected.value = g.primary.id }
/* sub-localización del foco dentro del hueso (cuerpo, pedículo, espinosa…) — se usa
   en la lista de focos co-localizados de la zona (ya no en chips conmutables). */
function focusPart(le: Lesion): string {
  const parts = (le.level[lang.value] || '').split('·')
  return (parts.length > 1 ? parts.slice(1).join('·') : (le.region[lang.value] || '')).trim()
}

/* ------------------------------------------------------------------ */
/*  Línea de tiempo                                                    */
/* ------------------------------------------------------------------ */
const frame = ref<number>(2) // arranca en may 2026 (Galio, el estudio más reciente)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
function setFrame(f: number) { frame.value = f }
function stopPlay() { if (timer) { clearInterval(timer); timer = null } playing.value = false }
function play() {
  if (playing.value) { stopPlay(); return }
  playing.value = true
  let f = frame.value >= 2 ? 0 : frame.value
  setFrame(f)
  timer = setInterval(() => { f++; if (f > 2) { stopPlay(); return } setFrame(f) }, 1000)
}
onBeforeUnmount(stopPlay)

/* lightbox de la imagen clave: bloqueo de scroll del body + Escape para cerrar */
function onKeyLightboxEsc(e: KeyboardEvent) { if (e.key === 'Escape') closeKeyLightbox() }
watch(keyLightboxOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) document.addEventListener('keydown', onKeyLightboxEsc)
  else document.removeEventListener('keydown', onKeyLightboxEsc)
})
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeyLightboxEsc)
    document.removeEventListener('keydown', onPetLightboxEsc)
  }
})

const dateLabel = computed(() => FDATES[frame.value][lang.value])
const isGalio = computed(() => frame.value === 2)

/* ¿la lesión capta en la fecha / trazador actual? */
function presentAt(le: Lesion, f: number): boolean {
  return f === 2 ? le.dota != null : valAt(le, f) != null
}
/* radio del marcador según la intensidad en la fecha actual */
function frameRadius(le: Lesion, f: number): number {
  return 6.5 + Math.min(valAt(le, f) ?? 0, 14) * 0.55
}

/* gráfica de evolución del SUVmáx para la lesión seleccionada */
/* solo FDG (el Galio tiene una única medición → no hay evolución que dibujar) */
const hasFdgEvo = computed(() => sel.value.fdg != null && sel.value.prevFdg != null)
const noEvoLabel = computed(() => {
  const le = sel.value
  if (le.fdg != null && le.prevFdg == null)
    return L('Foco nuevo en FDG: una sola medición (sin estudio FDG previo con el que comparar).', 'New FDG focus: a single measurement (no prior FDG study to compare with).')
  return L('Sin captación de FDG (receptor-puro): no hay serie temporal de FDG que mostrar.', 'No FDG uptake (receptor-only): no FDG time series to show.')
})
const evoChartSvg = computed(() => {
  const le = sel.value
  const prev = le.prevFdg, cur = le.fdg
  if (prev == null || cur == null) return ''
  // Más aire arriba/abajo: con SUV muy alto (>12) el punto rozaba el techo y
  // con SUV muy bajo (<3) la cifra chocaba con el eje de fechas. padT/padB
  // generosos + colocación inteligente de la etiqueta (arriba si hay sitio,
  // si no abajo; nunca encima de las fechas). EN HORIZONTAL: la cifra del punto
  // inicial se ancla a la derecha del punto (no centrada) para no pisar la
  // columna del eje Y; la del punto final se ancla a su izquierda para no
  // salirse por el borde derecho.
  const W = 300, H = 128, padL = 26, padR = 18, padT = 22, padB = 30
  const mx = Math.max(8, Math.ceil(Math.max(prev, cur)))
  const X = (f: number) => padL + f * (W - padL - padR)
  const Y = (v: number) => H - padB - (v / mx) * (H - padT - padB)
  const step = Math.ceil(mx / 4)
  let g = ''
  for (let yy = 0; yy <= mx; yy += step) {
    g += `<line x1="${padL}" y1="${Y(yy).toFixed(1)}" x2="${W - padR}" y2="${Y(yy).toFixed(1)}" stroke="#eee6da"/><text x="${padL - 4}" y="${(Y(yy) + 3).toFixed(1)}" text-anchor="end" font-family="monospace" font-size="8" fill="#9b95a0">${yy}</text>`
  }
  for (let f = 0; f < 2; f++) {
    g += `<text x="${X(f).toFixed(1)}" y="${H - 9}" text-anchor="middle" font-family="monospace" font-size="8" fill="#9b95a0">${FDATES[f][lang.value].split(' ')[0]}</text>`
  }
  g += `<line x1="${X(0).toFixed(1)}" y1="${Y(prev).toFixed(1)}" x2="${X(1).toFixed(1)}" y2="${Y(cur).toFixed(1)}" stroke="#e8633a" stroke-width="1.4"/>`
  const pts: [number, number][] = [[0, prev], [1, cur]]
  pts.forEach(([f, vv]) => {
    const x = X(f), y = Y(vv)
    // etiqueta arriba por defecto; si el punto está muy alto (sin aire arriba),
    // colócala debajo; si está muy bajo (rozaría las fechas), fuérzala arriba.
    const near = (a: number, b: number) => Math.abs(a - b) < 8
    const below = y - padT < 11 && !near(y, H - padB)
    const ly = below ? y + 13 : y - 7
    // HORIZONTAL: el punto inicial (f=0) cae en x=padL, justo sobre la columna
    // del eje Y (los 0/3/6…, anclados a x=padL-4) y el borde izquierdo → su
    // cifra centrada (p.ej. «10.2») los pisaba. Lo resolvemos anclando la cifra
    // a la IZQUIERDA y desplazándola a la DERECHA del punto, dentro del área del
    // gráfico. El punto final (f=1) cae en el borde derecho → la anclamos a la
    // derecha para que no se salga. Así ninguna cifra pisa el eje Y ni las fechas.
    const anchor = f === 0 ? 'start' : 'end'
    const lx = f === 0 ? x + 4 : x - 4
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${f === 1 ? 3.2 : 2.6}" fill="#e8633a" stroke="#fff" stroke-width="0.8"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-family="monospace" font-size="8.5" font-weight="600" fill="#5a4a52">${vv.toFixed(1)}</text>`
  })
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="${L('Evolución del FDG (SUVmáx) por fecha', 'FDG (SUVmax) evolution by date')}">${g}</svg>`
})

const filters = computed(() => [
  { key: 'all', label: L('Todas', 'All') },
  { key: 'ne', label: L('Solo receptor', 'Receptor only'), c: PHENO.ne.c },
  { key: 'mixNe', label: L('Mixto · receptor', 'Mixed · receptor'), c: PHENO.mixNe.c },
  { key: 'mixAgg', label: L('Mixto · azúcar', 'Mixed · sugar'), c: PHENO.mixAgg.c },
  { key: 'agg', label: L('Solo azúcar', 'Sugar only'), c: PHENO.agg.c },
  { key: 'load', label: L('Hueso de carga', 'Weight-bearing'), c: '#bb4128' },
  // Foco nuevo (enciende por primera vez en FDG) y detectado por IA (por
  // confirmar). Etiquetado por dato del estudio/procedencia, nunca biología.
  { key: 'new', label: L('Foco nuevo', 'New focus') + ` (${newCount.value})`, c: '#bb4128' },
  { key: 'ia', label: L('Detectado por IA', 'AI-detected') + ` (${aiFoci.value.length})`, c: '#6b6470' },
])

/* resumen */
const counts = computed(() => ({
  total: LES.length,
  ne: LES.filter((l) => l.fdg == null).length,
  mix: LES.filter((l) => l.fdg != null && l.dota != null).length,
  agg: LES.filter((l) => l.dota == null).length,
}))

/* ------------------------------------------------------------------ */
/*  Panel-cockpit — KPIs SOLO descriptivos (sin verbos de acción).      */
/*  Separa los focos del informe de los 3 «detectados por IA» (por      */
/*  confirmar). Todo derivado del array LES; no añade interpretación.   */
/* ------------------------------------------------------------------ */
function isAiDavid(le: Lesion): boolean { return sourceOf(le) === 'ia-david' }
const confirmedFoci = computed(() => LES.filter((l) => !isAiDavid(l)))
const aiFoci = computed(() => LES.filter(isAiDavid))
/* el foco seleccionado, ¿es uno detectado por IA (por confirmar)? — para el
   banner digno de la ficha (misma info que el resto, marcada «pendiente de
   validación por los radiólogos»). Informa, no concluye. */
const selIsAi = computed(() => isAiDavid(sel.value))
/* eje axial (columna, sacro, costillas) vs apendicular (escápula, pelvis, cadera/fémur) */
function isAxial(le: Lesion): boolean { return !/escapular|pelvis|cadera/i.test(le.region.es) }
const skeletonSplit = computed(() => {
  const axial = confirmedFoci.value.filter(isAxial).length
  return { axial, append: confirmedFoci.value.length - axial }
})
/* concordancia receptor↔glucólisis sobre los focos del informe */
const concordance = computed(() => {
  const c = confirmedFoci.value
  const ne = c.filter((l) => l.fdg == null).length   // receptor-puro (Ga+/FDG−)
  const agg = c.filter((l) => l.dota == null).length // FDG-puro (Ga−/FDG+)
  return { ne, mix: c.length - ne - agg, agg, total: c.length }
})
function concPct(n: number): string {
  const t = concordance.value.total || 1
  return ((n / t) * 100).toFixed(1) + '%'
}
/* un segmento es «estrecho» si su cifra no cabe legible dentro de la barra
   (<8% del total) → la etiqueta va FUERA (encima), no embutida dentro. */
function concNarrow(n: number): boolean {
  const t = concordance.value.total || 1
  return (n / t) * 100 < 8
}
/* rango de SUVmáx por trazador (solo focos del informe) */
function suvRange(vals: (number | null | undefined)[]): { min: number; max: number } | null {
  const xs = vals.filter((v): v is number => v != null)
  return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null
}
const dotaRange = computed(() => suvRange(confirmedFoci.value.map((l) => l.dota)))
const fdgRange = computed(() => suvRange(confirmedFoci.value.map((l) => l.fdg)))
const dotaRangeLabel = computed(() => (dotaRange.value ? dotaRange.value.min.toFixed(1) + '–' + dotaRange.value.max.toFixed(1) : '—'))
const fdgRangeLabel = computed(() => (fdgRange.value ? fdgRange.value.min.toFixed(1) + '–' + fdgRange.value.max.toFixed(1) : '—'))

/* ------------------------------------------------------------------ */
/*  Mapa de fenotipo — dispersión SUV FDG (x) vs SUV Galio/receptor (y) */
/*  Cuadrantes orientativos; los SUV son los de los informes.          */
/* ------------------------------------------------------------------ */
const Q = { W: 440, H: 340, padL: 52, padR: 18, padT: 30, padB: 46, xmax: 10.5, ymax: 14, divx: 4, divy: 4 }
const qX = (v: number) => Q.padL + (Math.max(0, Math.min(v, Q.xmax)) / Q.xmax) * (Q.W - Q.padL - Q.padR)
const qY = (v: number) => Q.H - Q.padB - (Math.max(0, Math.min(v, Q.ymax)) / Q.ymax) * (Q.H - Q.padT - Q.padB)
const qxTicks = [0, 2, 4, 6, 8, 10]
const qyTicks = [0, 2, 4, 6, 8, 10, 12, 14]
/* jitter determinista (±px por id) — desempata posiciones idénticas de forma
   reproducible (el mismo id da SIEMPRE el mismo valor; no salta entre renders). */
function jitter(id: number, axis: 0 | 1): number {
  const s = Math.sin(id * (axis ? 78.233 : 12.9898)) * 43758.5453
  return ((s - Math.floor(s)) - 0.5) * 2 // ±1px
}
/* Posiciones de los puntos del scatter. Los focos solo-receptor de bajo SUV caen
   casi todos en la misma esquina inferior-izquierda (FDG nulo → x≈0, receptor
   bajo → y similar) y se MONTAN. Tras situarlos por su dato, una pasada de
   separación DETERMINISTA (orden estable por id) empuja los que se solapan hasta
   dejar un hueco mínimo entre centros → los números no se pisan. No altera el
   dato (los SUV siguen siendo los del informe): solo desencima los marcadores. */
const quadDots = computed(() => {
  const dots = LES.map((le) => {
    const mx = Math.max(le.dota || 0, le.fdg || 0)
    const r = 5.5 + Math.min(mx, 14) * 0.38
    let px = qX(le.fdg == null ? 0 : le.fdg) + jitter(le.id, 0)
    let py = qY(le.dota == null ? 0 : le.dota) + jitter(le.id, 1)
    if (le.fdg == null) px += r * 0.8
    if (le.dota == null) py -= r * 0.8
    return { le, px, py, r }
  })
  // separación: si dos centros quedan más cerca que (r1+r2)*0.9, sepáralos por
  // igual a lo largo de su eje. Orden estable + iteraciones fijas = determinista.
  for (let pass = 0; pass < 24; pass++) {
    let moved = false
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j]
        let dx = b.px - a.px, dy = b.py - a.py
        let dist = Math.hypot(dx, dy)
        const minD = (a.r + b.r) * 0.9
        if (dist < minD) {
          if (dist < 0.01) { dx = (a.le.id - b.le.id) || 1; dy = 0.5; dist = Math.hypot(dx, dy) }
          const push = (minD - dist) / 2
          const ux = dx / dist, uy = dy / dist
          a.px -= ux * push; a.py -= uy * push
          b.px += ux * push; b.py += uy * push
          moved = true
        }
      }
    }
    if (!moved) break
  }
  // mantén los puntos dentro del área de dibujo (no se salgan por los ejes)
  const minX = qX(0) + 2, maxX = Q.W - 2, minY = Q.padT + 2, maxY = qY(0) - 2
  dots.forEach((d) => {
    d.px = Math.max(minX + d.r * 0.4, Math.min(maxX, d.px))
    d.py = Math.max(minY, Math.min(maxY - d.r * 0.4, d.py))
  })
  return dots
})

/* ------------------------------------------------------------------ */
/*  Trayectoria vs estudio previo (todo derivado del array LES)        */
/* ------------------------------------------------------------------ */
const trajectory = computed(() => {
  let up = 0, down = 0, stable = 0, neu = 0, withPrev = 0
  const rising: Lesion[] = []
  LES.forEach((l) => {
    const t = trend(l)
    if (!t) return
    withPrev++
    if (t.dir === 'up') { up++; rising.push(l) }
    else if (t.dir === 'new') { neu++; rising.push(l) }
    else if (t.dir === 'down') down++
    else stable++
  })
  return { up, down, stable, neu, withPrev, rising }
})
/* focos en hueso de carga con FDG igual o mayor que el previo (descriptivo) */
const loadBearingFdgFoci = computed(() => LES.filter((l) => l.load && l.fdg != null && (l.prevFdg == null || l.fdg >= l.prevFdg)))

/* ------------------------------------------------------------------ */
/*  Hallazgos por lesión — describe LO QUE MUESTRA el propio foco.      */
/*  Solo refleja los datos del foco (SUV, tendencia, morfología,        */
/*  procedencia). No interpreta, no triaja, no sugiere tratamiento.     */
/* ------------------------------------------------------------------ */
function focusObservations(l: Lesion): { tone: string; es: string; en: string }[] {
  const out: { tone: string; es: string; en: string }[] = []
  const t = trend(l)
  if (l.dota != null && l.dota >= 6)
    out.push({ tone: 'violet', es: 'Captación de receptor (SSTR) intensa.', en: 'Intense receptor (SSTR) uptake.' })
  else if (l.dota != null && l.dota >= 2)
    out.push({ tone: 'violet', es: 'Captación de receptor (SSTR) de intensidad baja-moderada.', en: 'Low-to-moderate receptor (SSTR) uptake.' })
  if (l.fdg != null && l.fdg >= 6)
    out.push({ tone: 'warn', es: 'Capta mucho azúcar (FDG).', en: 'High sugar (FDG) uptake.' })
  if (t && t.dir === 'new')
    out.push({ tone: 'warn', es: 'Foco nuevo respecto al estudio previo (antes no se veía).', en: 'New focus versus the prior study (not seen before).' })
  else if (t && t.dir === 'up')
    out.push({ tone: 'warn', es: `FDG mayor que en el estudio previo (antes ${l.prevFdg}).`, en: `FDG higher than in the prior study (was ${l.prevFdg}).` })
  else if (t && t.dir === 'down')
    out.push({ tone: 'positive', es: `FDG menor que en el estudio previo (antes ${l.prevFdg}).`, en: `FDG lower than in the prior study (was ${l.prevFdg}).` })
  if (l.dota == null && l.fdg != null)
    out.push({ tone: 'warn', es: 'Discordante: capta azúcar (FDG) pero no receptor (Galio).', en: 'Discordant: sugar-avid (FDG) but no receptor (gallium).' })
  if (l.load)
    out.push({ tone: 'neutral', es: 'Hueso de carga (soporta peso). Revisado por Oncología Radioterápica.', en: 'Weight-bearing bone. Reviewed by Radiation Oncology.' })
  if (l.scler)
    out.push({ tone: 'neutral', es: 'Morfología blástica (hueso denso).', en: 'Blastic morphology (dense bone).' })
  if (sourceOf(l) === 'ia-david')
    out.push({ tone: 'neutral', es: 'No consta en el informe oficial (medida aproximada sobre DICOM).', en: 'Not in the official report (approximate DICOM measurement).' })
  return out
}
function observationTone(tone: string): string {
  return tone === 'violet' ? '#9d44ab' : tone === 'warn' ? '#bb4128' : tone === 'positive' ? '#1f5a3a' : '#6b6470'
}

/* ------------------------------------------------------------------ */
/*  Cuantificación automática (verificación, NO diagnóstico).          */
/*  Medida automática sobre los DICOM: SUV con corrección de decaim.,  */
/*  máscara ósea del CT, componentes conectados anclados a la tabla.   */
/*  FDG (24/03, 1.65 mm) es fina; Galio (26/05, 4 mm) es más gruesa.   */
/*  "—" = no medido automáticamente (vale el dato de la tabla).        */
/* ------------------------------------------------------------------ */
const AUTO: Record<number, { gaAuto: number | null; gaMtv: number | null; gaMorph: string; fdgAuto: number | null; fdgMtv: number | null; fdgTlg: number | null; fdgMorph: string }> = {
  1: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  2: { gaAuto: 3.08, gaMtv: 0.19, gaMorph: 'mixta', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  3: { gaAuto: 3.82, gaMtv: 0.45, gaMorph: 'blástica', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  4: { gaAuto: 4.24, gaMtv: 0.96, gaMorph: 'blástica', fdgAuto: 6.97, fdgMtv: 0.52, fdgTlg: 1.9, fdgMorph: 'blástica' },
  5: { gaAuto: 6.13, gaMtv: 3.33, gaMorph: 'blástica', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  6: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  7: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 7.61, fdgMtv: 14.24, fdgTlg: 58.4, fdgMorph: 'blástica' },
  8: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  9: { gaAuto: 3.64, gaMtv: 0.96, gaMorph: 'blástica', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  10: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 6.84, fdgMtv: 1.12, fdgTlg: 3.7, fdgMorph: 'blástica' },
  11: { gaAuto: 12.06, gaMtv: 12.86, gaMorph: 'blástica', fdgAuto: 4.53, fdgMtv: 0.34, fdgTlg: 1.1, fdgMorph: 'blástica' },
  12: { gaAuto: 4.2, gaMtv: 0.83, gaMorph: 'blástica', fdgAuto: 4.66, fdgMtv: 0.4, fdgTlg: 1.3, fdgMorph: 'lítica/medular' },
  13: { gaAuto: 4.3, gaMtv: 0.7, gaMorph: 'mixta', fdgAuto: 7.71, fdgMtv: 3.0, fdgTlg: 12.5, fdgMorph: 'mixta' },
  14: { gaAuto: 3.93, gaMtv: 1.41, gaMorph: 'mixta', fdgAuto: 9.33, fdgMtv: 0.93, fdgTlg: 3.7, fdgMorph: 'blástica' },
  15: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 4.34, fdgMtv: 0.44, fdgTlg: 1.4, fdgMorph: 'blástica' },
  16: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 9.43, fdgMtv: 6.83, fdgTlg: 29.3, fdgMorph: 'mixta' },
  17: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 4.7, fdgMtv: 1.8, fdgTlg: 5.3, fdgMorph: 'blástica' },
  18: { gaAuto: 4.3, gaMtv: 5.18, gaMorph: 'blástica', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  19: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 3.54, fdgMtv: 0.33, fdgTlg: 0.9, fdgMorph: 'mixta' },
}
const AUTO_NEW_FDG: { suvmax: number; mtv: number; hu: number; morph: string; size: string; side: string; flag: string }[] = [
  { suvmax: 8.6, mtv: 0.37, hu: 1, morph: 'lítica/medular', size: '13×16×12', side: 'Dcha', flag: 'revisar: HU baja (¿partes blandas?)' },
  { suvmax: 6.23, mtv: 0.35, hu: 100, morph: 'lítica/medular', size: '10×8×10', side: 'Dcha', flag: '' },
  { suvmax: 5.84, mtv: 0.89, hu: 76, morph: 'lítica/medular', size: '25×18×18', side: 'Dcha', flag: '' },
  { suvmax: 5.82, mtv: 4.14, hu: 704, morph: 'blástica', size: '35×36×18', side: 'Izq', flag: 'foco blástico no listado' },
  { suvmax: 3.98, mtv: 0.53, hu: 76, morph: 'lítica/medular', size: '12×12×40', side: 'Dcha', flag: '' },
  { suvmax: 3.88, mtv: 0.56, hu: 93, morph: 'lítica/medular', size: '13×26×32', side: 'Dcha', flag: '' },
  { suvmax: 3.22, mtv: 0.69, hu: 228, morph: 'mixta', size: '26×26×20', side: 'Dcha', flag: '' },
  { suvmax: 3.15, mtv: 0.42, hu: 350, morph: 'blástica', size: '15×21×8', side: 'Izq', flag: '' },
]
function autoOf(le: Lesion) { return AUTO[le.id] || null }
const selAuto = computed(() => autoOf(sel.value))

/* ------------------------------------------------------------------ */
/*  EXTENSIÓN METABÓLICA medida sobre el DICOM nativo (P1 «mídelas      */
/*  todas»). Por foco: eje mayor (mm) y MTV (ml) de la región que capta */
/*  por ENCIMA del umbral (41% del SUVmáx local), confinada a hueso.    */
/*  HONESTO: es lo que capta sobre el umbral, NO el tamaño anatómico    */
/*  exacto; el efecto de volumen parcial subestima los focos <~10 mm.   */
/*    · reliable  → medida fiable                                       */
/*    · unreliable→ captación ≈ fondo óseo, no separable → «— · no fiable» */
/*    · pending   → foco de IA no medible aquí → «— · por confirmar»    */
/*  Es un factor de FACTIBILIDAD de la biopsia (mayor = más fácil de    */
/*  acertar) → alimenta el factor de tamaño de la lente de idoneidad.   */
/* ------------------------------------------------------------------ */
type SizeState = 'reliable' | 'unreliable' | 'pending'
interface MetExtent { mm: number | null; mtv: number | null; state: SizeState }
const SIZE: Record<number, MetExtent> = {
  1:  { mm: 15.1, mtv: 1.17, state: 'reliable' },
  2:  { mm: null, mtv: null, state: 'unreliable' }, // C4 · captación ≈ fondo óseo
  3:  { mm: 35.0, mtv: 2.62, state: 'reliable' },
  4:  { mm: 10.5, mtv: 0.50, state: 'reliable' },
  5:  { mm: 22.8, mtv: 3.59, state: 'reliable' },
  6:  { mm: null, mtv: null, state: 'unreliable' }, // D9 · captación ≈ fondo óseo
  7:  { mm: 26.9, mtv: 3.31, state: 'reliable' },
  8:  { mm: 25.1, mtv: 2.73, state: 'reliable' },
  9:  { mm: 22.1, mtv: 2.04, state: 'reliable' },
  10: { mm: 21.3, mtv: 0.73, state: 'reliable' },
  11: { mm: 28.0, mtv: 2.64, state: 'reliable' },
  12: { mm: 18.1, mtv: 0.98, state: 'reliable' },
  13: { mm: 21.3, mtv: 2.25, state: 'reliable' },
  14: { mm: 10.1, mtv: 0.32, state: 'reliable' },
  15: { mm: 13.7, mtv: 0.62, state: 'reliable' },
  16: { mm: 32.6, mtv: 3.49, state: 'reliable' },
  18: { mm: 16.2, mtv: 1.04, state: 'reliable' },
  17: { mm: null, mtv: null, state: 'pending' }, // IA · costilla, no medible
  19: { mm: null, mtv: null, state: 'pending' }, // IA · cervicotorácica, no medible
}
function metExtentOf(le: Lesion): MetExtent { return SIZE[le.id] ?? { mm: null, mtv: null, state: 'pending' } }
/* texto «eje mayor mm · MTV ml», o el estado honesto cuando no es medible */
function metExtentLabel(le: Lesion): string {
  const s = metExtentOf(le)
  if (s.state === 'unreliable') return L('— · no fiable', '— · not reliable')
  if (s.mm == null) return L('— · por confirmar', '— · to confirm')
  const ext = s.mm.toFixed(1) + ' mm'
  return s.mtv != null ? ext + ' · ' + s.mtv.toFixed(2) + ' ml' : ext
}

/* ------------------------------------------------------------------ */
/*  Morfología (FORMA del hueso) + MTV — dato de PRIMERA CLASE en la    */
/*  ficha. La morfología (lítico/blástico/mixto) es el predictor clave  */
/*  del RENDIMIENTO de la biopsia: el hueso blástico denso suele rendir */
/*  menos tejido. Es FORMA (densidad CT), no biología ni trazador. Se   */
/*  deriva de la morfología medida sobre el CT (bloque AUTO) + scler.   */
/* ------------------------------------------------------------------ */
type Morph = 'blástica' | 'lítica' | 'mixta'
function morphCat(le: Lesion): Morph | null {
  const cats = new Set<Morph>()
  const push = (s?: string) => {
    if (!s) return
    if (/blást/i.test(s)) cats.add('blástica')
    else if (/lít/i.test(s)) cats.add('lítica')
    else if (/mixt/i.test(s)) cats.add('mixta')
  }
  const a = autoOf(le)
  push(a?.gaMorph); push(a?.fdgMorph)
  if (le.scler) cats.add('blástica')
  if (cats.size === 0) return null
  if (cats.size === 1) return [...cats][0]
  return 'mixta'   // las dos pruebas ven forma distinta → mixta (honesto)
}
function morphLabel(le: Lesion): string {
  const m = morphCat(le)
  if (m === 'blástica') return L('blástica (hueso denso)', 'blastic (dense bone)')
  if (m === 'lítica') return L('lítica (partes blandas / medular)', 'lytic (soft tissue / marrow)')
  if (m === 'mixta') return L('mixta (densa y lítica a la vez)', 'mixed (dense and lytic at once)')
  return L('— · por confirmar', '— · to confirm')
}
/* nota neutral de rendimiento de tejido por morfología (es FORMA, no biología; informa, no concluye) */
function morphYieldNote(le: Lesion): string {
  const m = morphCat(le)
  if (m === 'blástica') return L('Blástico / escleroso = hueso denso; suele rendir menos tejido tumoral.', 'Blastic / sclerotic = dense bone; usually yields less tumour tissue.')
  if (m === 'lítica') return L('Lítico / partes blandas; suele rendir más tejido.', 'Lytic / soft tissue; usually yields more tissue.')
  if (m === 'mixta') return L('Mixta: conviven zonas densas (rinden menos) y líticas (rinden más).', 'Mixed: dense areas (yield less) and lytic areas (yield more) coexist.')
  return L('Forma por confirmar.', 'Shape to confirm.')
}
/* MTV (volumen tumoral metabólico, ml) medido sobre los DICOM, por trazador presente.
   Orientativo: «cantidad de tumor metabólico». */
function mtvList(le: Lesion): { tr: string; v: number }[] {
  const a = autoOf(le)
  const out: { tr: string; v: number }[] = []
  if (a?.fdgMtv != null) out.push({ tr: 'FDG', v: a.fdgMtv })
  if (a?.gaMtv != null) out.push({ tr: 'Ga', v: a.gaMtv })
  return out
}
const hasMtv = computed(() => mtvList(sel.value).length > 0)
/* lesiones con hueso 3D real reconstruido del CT (IA, TotalSegmentator) — frames en
   /metastasis/vertebra. Vértebras y huesos planos. Solo quedan sin reconstruir los 2
   focos «detectados por IA» no confirmados en el informe (#17 costilla, #19). */
const BONE3D_KEY: Record<number, string> = {
  1: 'C3', 2: 'C4', 3: 'ESCAPULA_R',
  4: 'D1', 5: 'D5', 6: 'D9', 7: 'D11', 8: 'D11', 9: 'L1', 10: 'L1', 11: 'L5',
  12: 'SACRO', 13: 'ILIACO_R', 14: 'ILIACO_R', 15: 'ILIACO_L', 16: 'FEMUR_R', 18: 'ILIACO_R',
}
function bone3dKeyOf(le: Lesion) { return BONE3D_KEY[le.id] }
/* focos CO-LOCALIZADOS en la MISMA malla 3D (mismo hueso reconstruido del CT). Se
   muestran JUNTOS, como un solo hueso, con un rótulo de «N focos» — SIN selector (la
   paciente: el selector hace que la gente se pierda). Cubre las zonas con 2+ focos en
   una sola malla: D11 (#7+#8), L1 (#9+#10) e ILÍACO derecho (#13+#14+#18). No tenemos
   posición 3D fiable por foco dentro del hueso, así que no clavamos varios marcadores:
   un solo realce de zona + el rótulo «N focos» (honestidad: informa, no concluye). */
const coFoci = computed<Lesion[]>(() => {
  const k = bone3dKeyOf(sel.value)
  if (!k) return [sel.value]
  return LES.filter((l) => bone3dKeyOf(l) === k)
})
const isMultiFocusBone = computed(() => coFoci.value.length > 1)
/* ¿algún foco de ESTE hueso 3D fue biopsiado? (hecho del caso: #13 ilíaco derecho, 26B585). Si sí,
   el visor 3D ofrece el toggle de la aguja ILUSTRATIVA. El código (26B585) alimenta el rótulo;
   devuelve null si no hay biopsia previa en el hueso en pantalla. */
const BIOPSY_CODE = '26B585'
const bonePriorBiopsy = computed<string | null>(() =>
  coFoci.value.some((l) => l.priorBiopsy) ? BIOPSY_CODE : null,
)
const hasAuto = computed(() => { const a = selAuto.value; return !!a && (a.fdgAuto != null || a.gaAuto != null) })

/* ------------------------------------------------------------------ */
/*  Selector de MODO del visor 3D (segmented control · tablist a11y).   */
/*  UN SOLO visor WebGL (misma geometría, mismo PLY); cada modo deriva  */
/*  su color del MISMO RGB por vértice (no recarga la malla):           */
/*   · «Área» (por defecto) → huella de captación umbralizada del croma */
/*     (región contigua en el color del trazador; el resto marfil mate).*/
/*   · «Mapa de calor»      → intensidad continua → rampa térmica.       */
/*   · «Morfología»         → densidad del CT → rampa SIN blanco arriba  */
/*     (blástico = azul oscuro; resuelve el "todo blanco").             */
/*  Fallback sin-WebGL (dentro del visor): fotogramas vertebra/ (área y  */
/*  calor) y morfo/ realzado (morfología). #17/#19 (sin malla) no salen. */
/* ------------------------------------------------------------------ */
type Bone3dView = 'area' | 'heat' | 'morpho'
const BONE3D_VIEWS: { id: Bone3dView; es: string; en: string }[] = [
  { id: 'area', es: 'Área', en: 'Area' },
  { id: 'heat', es: 'Mapa de calor', en: 'Heat map' },
  { id: 'morpho', es: 'Morfología', en: 'Morphology' },
]
/* Por defecto «Área»: la huella/extensión de la captación sobre el hueso (dónde y
   cuánto), no un punto. Los tres modos comparten el MISMO visor y geometría; cambiar
   de modo sólo reescribe el color por vértice. */
const bone3dView = ref<Bone3dView>('area')
const bone3dTablist = ref<HTMLElement | null>(null)
const bone3dViewAnnounce = computed(() => {
  const v = bone3dView.value
  if (v === 'area') return L('Modo área: la huella de la captación sobre el hueso, como región de color del trazador; el resto del hueso en marfil mate.', 'Area mode: the uptake footprint on the bone, as a coloured tracer region; the rest of the bone in matte ivory.')
  if (v === 'heat') return L('Modo mapa de calor: la intensidad de captación en una rampa térmica de frío a caliente, con el punto más caliente marcado.', 'Heat-map mode: uptake intensity on a cool-to-hot thermal ramp, with the hottest point marked.')
  return L('Modo morfología: la densidad del CT realzada, con el hueso blástico (denso) en azul oscuro para que se distinga.', 'Morphology mode: enhanced CT density, with blastic (dense) bone in dark blue so it stands out.')
})
/* teclado del tablist: ←/→ (y ↑/↓, Inicio/Fin) mueven la selección y el foco */
function bone3dTabKey(e: KeyboardEvent) {
  const order = BONE3D_VIEWS.map((v) => v.id)
  const i = order.indexOf(bone3dView.value)
  let n = i
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % order.length
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + order.length) % order.length
  else if (e.key === 'Home') n = 0
  else if (e.key === 'End') n = order.length - 1
  else return
  e.preventDefault()
  bone3dView.value = order[n]
  nextTick(() => { bone3dTablist.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n]?.focus() })
}

/* Niveles afectados según el informe de RM de columna (11/06/2026). Texto del
   informe recogido en el documento de apoyo; no es una relectura de la imagen. */
const MRI_LEVELS = ['D1-D3', 'D4-D5', 'D8-D9', 'D11-D12', 'L1', 'L2-L3', 'L5', 'S1-S2']

/* ================================================================== */
/*  LENTE · IDONEIDAD COMO DIANA (orientativa, transparente)           */
/*  Ordena los focos por las SEÑALES que importan para elegir dónde    */
/*  rebiopsiar: tumor viable (FDG/Galio) y rendimiento tisular esperado */
/*  (lítico/partes blandas rinde; blástico denso rinde poco). EQUIPA la */
/*  decisión del equipo; NO indica dónde biopsiar ni concluye nada.    */
/*                                                                      */
/*  No es una caja negra: la puntuación es el PRODUCTO de tres factores */
/*  visibles, etiquetados por trazador/forma (nunca por biología):     */
/*    idoneidad(0-100) = 100 · viable · rendimiento · tamaño           */
/*    · viable   (0-1) = 0.78·(FDG/10) + 0.22·(Ga/14)  → tumor activo;  */
/*                        el FDG manda, el Ga confirma tumor/receptor.  */
/*    · rendimiento(0-1)= forma (morfología): lítico 1 · mixto 0.6 ·    */
/*                        blástico denso 0.3 · sin dato 0.5.            */
/*    · tamaño  (0.6-1) = eje mayor (≥18 mm → 1; ~8 mm → 0.6); s/d 0.75.*/
/*  Antecedente (biopsia 26B585 fallida en #13) y accesibilidad NO se   */
/*  meten en el número: se MUESTRAN como avisos que el equipo pondera.  */
/*  Accesibilidad/seguridad no la tenemos → «a valorar por radiología   */
/*  intervencionista»; no se inventa.                                   */
/* ================================================================== */
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)) }

/* eje mayor del tamaño (mm) para el factor de tamaño: prioriza la EXTENSIÓN
   METABÓLICA medida sobre el DICOM (umbral 41% del SUVmáx local). Si no es
   medible/fiable, cae al tamaño reportado del informe (p.ej. «18 × 13» → 18). */
function sizeMajorMm(le: Lesion): number | null {
  const m = metExtentOf(le)
  if (m.mm != null) return m.mm
  const nums = (le.size?.match(/\d+(?:[.,]\d+)?/g) || []).map((s) => Number(s.replace(',', '.')))
  return nums.length ? Math.max(...nums) : null
}
/* factor de tumor viable (0-1): FDG (tumor metabólicamente activo) manda; Ga confirma */
function viableFactor(le: Lesion): number {
  return clamp01(0.78 * ((le.fdg ?? 0) / 10) + 0.22 * ((le.dota ?? 0) / 14))
}
/* factor de rendimiento tisular esperado (0-1) por FORMA del hueso (morfología CT).
   Ancla al fallo 26B585: el blástico denso suele rendir poco tejido tumoral. */
function yieldFactor(le: Lesion): number {
  const m = morphCat(le)
  if (m === 'lítica') return 1
  if (m === 'mixta') return 0.6
  if (m === 'blástica') return 0.3
  return 0.5 // forma sin confirmar
}
/* factor de tamaño (0.6-1): el eje mayor; más grande = más fácil/más tejido. s/d = 0.75 */
function sizeFactor(le: Lesion): number {
  const mm = sizeMajorMm(le)
  if (mm == null) return 0.75
  return Math.max(0.6, Math.min(1, 0.6 + ((mm - 8) / 10) * 0.4))
}
/* idoneidad compuesta 0-100 (orientativa). Producto de los tres factores visibles. */
function suitabilityScore(le: Lesion): number {
  return Math.round(100 * viableFactor(le) * yieldFactor(le) * sizeFactor(le))
}
/* palabra corta de forma (para las mini-barras de rendimiento) */
function morphShort(le: Lesion): string {
  const m = morphCat(le)
  if (m === 'lítica') return L('lítico · rinde', 'lytic · yields')
  if (m === 'mixta') return L('mixto', 'mixed')
  if (m === 'blástica') return L('blástico denso · rinde poco', 'dense blastic · low yield')
  return L('forma s/c', 'shape n/c')
}
/* los factores explícitos por foco (para mostrarlos, no solo el número) */
function suitabilityFactors(le: Lesion) {
  return {
    score: suitabilityScore(le),
    viable: viableFactor(le),
    yieldF: yieldFactor(le),
    sizeF: sizeFactor(le),
    fdg: le.fdg,
    ga: le.dota,
    morph: morphCat(le),
    morphLabel: morphLabel(le),
    sizeMm: sizeMajorMm(le),
    mtv: mtvList(le),
    priorFail: !!le.priorBiopsy,
    isAi: isAiDavid(le),
  }
}
/* candidatos CONFIRMADOS ordenados por idoneidad (los focos del informe).
   Los detectados por IA quedan fuera del orden → lista aparte, marcados. */
const rankedFoci = computed(() =>
  [...confirmedFoci.value].sort((a, b) => suitabilityScore(b) - suitabilityScore(a) || a.id - b.id),
)
/* focos detectados por IA (por confirmar): candidatos sí, peso real no */
const aiCandidates = computed(() =>
  [...aiFoci.value].sort((a, b) => suitabilityScore(b) - suitabilityScore(a) || a.id - b.id),
)
const suitMax = computed(() => Math.max(1, ...LES.map(suitabilityScore)))
/* ancho 0-100% de una barra de factor (para las mini-barras inline) */
function pct01(x: number): string { return (clamp01(x) * 100).toFixed(0) + '%' }

/* ¿este foco tiene un componente de partes blandas / extensión extraósea descrito
   por la RMN? Es una señal de FACTIBILIDAD para el radiólogo: una diana de tejido
   blando suele rentabilizar más que el hueso blástico denso. NO entra en el número
   (la accesibilidad/seguridad las valora intervencionista); se MUESTRA como aviso. */
function hasSoftTissue(le: Lesion): boolean { return !!le.softTissue }
/* primeros 3 candidatos confirmados (resumen «de un vistazo» de la lente, para que el
   radiólogo compare las mejores dianas sin desplegar toda la lista). Orientativo. */
const topCandidates = computed(() => rankedFoci.value.slice(0, 3))

/* ------------------------------------------------------------------ */
/*  Orden de la tabla                                                  */
/* ------------------------------------------------------------------ */
const sortKey = ref<string>('id')
const sortDir = ref<1 | -1>(1)
function sortBy(key: string) {
  if (sortKey.value === key) sortDir.value = (sortDir.value * -1) as 1 | -1
  else { sortKey.value = key; sortDir.value = 1 }
}
function ariaSort(key: string): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 1 ? 'ascending' : 'descending'
}
function sortArrow(key: string): string {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 1 ? '↑' : '↓'
}
function sortVal(le: Lesion, key: string): number | string {
  switch (key) {
    case 'level': return le.level.es
    case 'side': return le.side
    case 'dota': return le.dota ?? -1
    case 'fdg': return le.fdg ?? -1
    case 'prev': return le.prevFdg ?? -1
    case 'delta': return le.fdg != null && le.prevFdg != null ? le.fdg - le.prevFdg : -999
    case 'size': return sizeMajorMm(le) ?? -1
    case 'suit': return suitabilityScore(le)
    case 'pheno': return ['ne', 'mixNe', 'mixBal', 'mixAgg', 'agg'].indexOf(le.pheno)
    default: return le.id
  }
}
/* ordena un subconjunto por la cabecera activa (sin mezclar confirmados/IA) */
function sortRows(rows: Lesion[]): Lesion[] {
  const k = sortKey.value, d = sortDir.value
  return [...rows].sort((a, b) => {
    const va = sortVal(a, k), vb = sortVal(b, k)
    if (va < vb) return -d
    if (va > vb) return d
    return a.id - b.id
  })
}
/* la DISTINCIÓN informe↔IA ahora es por POSICIÓN: los confirmados (del informe)
   primero y los detectados por IA SIEMPRE al final, en su propio grupo rotulado
   (ya no hay columna «Fuente»). El orden de cada grupo sigue la cabecera activa.
   Una sola lista de filas con un divisor de subtítulo entre los dos grupos. */
type TableRow = { kind: 'lesion'; le: Lesion } | { kind: 'aiHeader' }
const tableRows = computed<TableRow[]>(() => {
  const out: TableRow[] = sortRows(confirmedFoci.value).map((le) => ({ kind: 'lesion', le } as TableRow))
  const ai = sortRows(aiFoci.value)
  if (ai.length) {
    out.push({ kind: 'aiHeader' })
    ai.forEach((le) => out.push({ kind: 'lesion', le }))
  }
  return out
})
/* nº de columnas de la tabla (para el colspan del subtítulo de grupo) */
const tableCols = 10

/* esquema esqueleto: vértebras dibujadas */
const vertebrae = computed(() => {
  const out: { x: number; y: number; w: number; h: number }[] = []
  let y = 66
  for (let i = 0; i < 7; i++) { out.push({ x: 220 - 11, y, w: 22, h: 8 }); y += 12 } // cervical
  y = 156
  for (let i = 0; i < 12; i++) { out.push({ x: 220 - 16, y, w: 32, h: 13 }); y += 19.6 } // dorsal
  y = 392
  for (let i = 0; i < 5; i++) { out.push({ x: 220 - 20, y, w: 40, h: 14 }); y += 19.5 } // lumbar
  return out
})
/* caja torácica esquemática: 9 pares de costillas que curvan desde la columna dorsal */
const ribs = computed(() => {
  const out: { d: string }[] = []
  for (let i = 0; i < 9; i++) {
    const y0 = 166 + i * 20, t = i / 8
    const spread = 38 + Math.sin(t * Math.PI) * 26, drop = 24 + i * 3.2
    out.push({ d: `M214,${y0} Q${(220 - spread).toFixed(0)},${y0 + 4} ${(220 - spread + 8).toFixed(0)},${(y0 + drop).toFixed(0)}` })
    out.push({ d: `M226,${y0} Q${(220 + spread).toFixed(0)},${y0 + 4} ${(220 + spread - 8).toFixed(0)},${(y0 + drop).toFixed(0)}` })
  }
  return out
})
const ticks = [
  { y: 78, t: 'C1' }, { y: 138, t: 'C7' },
  { y: 156, t: 'T1' }, { y: 254, t: 'T6' }, { y: 372, t: 'T12' },
  { y: 392, t: 'L1' }, { y: 470, t: 'L5' }, { y: 505, t: 'S' },
]
</script>

<template>
  <div>
    <section class="section-spacing" aria-label="Mapa de metástasis">
      <!-- MODO WIKI · pantalla completa: el panel (radiología) aprovecha TODO el
           ancho del viewport dentro del shell del sitio, no la columna centrada
           estrecha (section-wide = 1200px). Sin max-width; padding lateral cómodo
           (px-4 → lg:px-8 → 2xl:px-12). La cabecera/nav/footer del shell siguen
           con su propio ancho canónico; aquí el cuerpo va full-bleed. -->
      <div class="px-4 sm:px-6 lg:px-8 2xl:px-12">
        <!-- Layout wiki: ÍNDICE como barra lateral izquierda pegajosa (lg+) +
             contenido que ocupa el RESTO del ancho; la cabecera va DENTRO de la
             columna de contenido para que el título alinee con el cuerpo, no con
             el índice (mismo patrón que /ciencia). La columna de contenido es
             minmax(0,1fr) → se expande a todo el espacio disponible a ≥1440. -->
        <div class="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:gap-14 lg:items-start">
          <MapaSectionNav
            variant="rail"
            class="hidden lg:block lg:sticky lg:top-24 lg:self-start"
          />
          <div class="min-w-0">
        <PageHeader
          :title="L('Mapa de metástasis', 'Metastasis map')"
          :subtitle="L(
            'Cada lesión ósea, vista con dos trazadores a la vez: el del receptor (Galio-68 DOTATOC) y el del azúcar (FDG). Sirve para ver, lesión a lesión, cuánto capta del receptor y cuánto del azúcar.',
            'Every bone lesion, seen with two tracers at once: the receptor tracer (Gallium-68 DOTATOC) and the sugar tracer (FDG). It helps see, lesion by lesion, how much it takes up the receptor and how much sugar.')"
          :tag="L('PET doble trazador · ' + confirmedFoci.length + ' focos · +' + aiFoci.length + ' por confirmar', 'Dual-tracer PET · ' + confirmedFoci.length + ' foci · +' + aiFoci.length + ' to confirm')"
        />

        <!-- Aviso -->
        <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mb-6">
          {{ L(
            'Esta página reúne y visualiza los estudios de la paciente (PET-FDG 24/03/2026, PET Galio-68 DOTATOC 26/05/2026 y la RMN de columna cervical y dorsal). Es una herramienta para entender y para apoyar la conversación con el equipo médico — no sustituye su criterio ni es consejo médico. Los SUV son los de los informes oficiales del PET; las imágenes (PET y RMN) se reconstruyeron desde los DICOM. La RMN se muestra para verla: su lectura formal corresponde al radiólogo.',
            'This page gathers and visualises the patient’s studies (FDG-PET 24/03/2026, Ga-68 DOTATOC PET 26/05/2026 and the cervical and thoracic spine MRI). It is a tool to understand and to support the conversation with the medical team — it does not replace their judgement and is not medical advice. SUVs are those of the official PET reports; the images (PET and MRI) were reconstructed from the DICOM. The MRI is shown for viewing: its formal reading belongs to the radiologist.') }}
        </div>

        <!-- Índice móvil: desplegable «Saltar a…» en el flujo, tras la cabecera
             (solo <lg). El rail de escritorio va arriba, junto al título. -->
        <MapaSectionNav variant="mobile" class="lg:hidden mb-10" />

        <!-- ===== PANEL-COCKPIT · KPIs descriptivos ===== -->
        <section class="mb-12" aria-labelledby="cockpit">
          <p class="eyebrow mb-2 block">{{ L('Resumen de un vistazo', 'At a glance') }}</p>
          <h2 id="cockpit" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">{{ L('Panel de la enfermedad ósea', 'Bone-disease panel') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Cifras descriptivas de los dos PET, sin interpretación. Los focos del informe oficial y los detectados por IA (por confirmar) van por separado.',
                  'Descriptive figures from the two PET studies, with no interpretation. Foci from the official report and those detected by AI (to confirm) are kept separate.') }}
          </p>

          <!-- KPIs -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Carga ósea', 'Bone burden') }}</div>
              <div class="stat-readout__value tabular-nums">{{ confirmedFoci.length }} <span class="font-body font-semibold text-[15px] text-tinta align-middle">+{{ aiFoci.length }}</span></div>
              <div class="stat-readout__unit">{{ L('focos en el informe · +' + aiFoci.length + ' por confirmar (IA)', 'foci in the report · +' + aiFoci.length + ' to confirm (AI)') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Reparto en el esqueleto', 'Skeletal distribution') }}</div>
              <div class="stat-readout__value tabular-nums">{{ skeletonSplit.axial }} <span class="font-body text-[15px] text-tinta align-middle">·</span> {{ skeletonSplit.append }}</div>
              <div class="stat-readout__unit">{{ L('axial (columna/sacro) · apendicular (pelvis/cadera)', 'axial (spine/sacrum) · appendicular (pelvis/hip)') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label" :style="{ color: '#9d44ab' }">{{ L('SUVmáx ⁶⁸Ga-DOTATOC', '⁶⁸Ga-DOTATOC SUVmax') }}</div>
              <div class="stat-readout__value tabular-nums" :style="{ color: '#9d44ab' }">{{ dotaRangeLabel }}</div>
              <div class="stat-readout__unit">{{ L('rango del receptor (informe)', 'receptor range (report)') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label" :style="{ color: '#bb4128' }">{{ L('SUVmáx ¹⁸F-FDG', '¹⁸F-FDG SUVmax') }}</div>
              <div class="stat-readout__value tabular-nums" :style="{ color: '#bb4128' }">{{ fdgRangeLabel }}</div>
              <div class="stat-readout__unit">{{ L('rango del azúcar (informe)', 'sugar range (report)') }}</div>
            </div>
          </div>

          <!-- concordancia (barra apilada) + trayectoria FDG -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card-base !p-4">
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2">{{ L('Concordancia receptor ↔ azúcar', 'Receptor ↔ sugar concordance') }}</p>
              <!-- barra apilada. Las cifras de los segmentos ANCHOS van dentro;
                   las de los segmentos ESTRECHOS (<8%) no caben → van fuera, en
                   una fila superior con una pequeña marca y el número. Toda cifra
                   se repite además en la leyenda inferior (siempre legible, AA). -->
              <div class="relative">
                <!-- etiquetas externas para los segmentos que no admiten la cifra dentro -->
                <div class="flex h-4 mb-0.5 text-[10px] font-semibold leading-none">
                  <div v-if="concordance.ne" :style="{ width: concPct(concordance.ne) }" class="flex items-end justify-center">
                    <span v-if="concNarrow(concordance.ne)" :style="{ color: '#7a2e85' }">{{ concordance.ne }}</span>
                  </div>
                  <div v-if="concordance.mix" :style="{ width: concPct(concordance.mix) }" class="flex items-end justify-center">
                    <span v-if="concNarrow(concordance.mix)" :style="{ color: '#8a4a1a' }">{{ concordance.mix }}</span>
                  </div>
                  <div v-if="concordance.agg" :style="{ width: concPct(concordance.agg) }" class="flex items-end justify-center">
                    <span v-if="concNarrow(concordance.agg)" :style="{ color: '#bb4128' }">{{ concordance.agg }}</span>
                  </div>
                </div>
                <div class="flex h-7 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" role="img"
                  :aria-label="L(concordance.ne + ' solo receptor, ' + concordance.mix + ' mixtos, ' + concordance.agg + ' solo FDG', concordance.ne + ' receptor-only, ' + concordance.mix + ' mixed, ' + concordance.agg + ' FDG-only')">
                  <div v-if="concordance.ne" :style="{ width: concPct(concordance.ne), background: '#9d44ab' }" class="flex items-center justify-center text-[12px] font-semibold text-white">{{ concNarrow(concordance.ne) ? '' : concordance.ne }}</div>
                  <div v-if="concordance.mix" :style="{ width: concPct(concordance.mix), background: '#df7a44' }" class="flex items-center justify-center text-[12px] font-semibold text-berenjena">{{ concNarrow(concordance.mix) ? '' : concordance.mix }}</div>
                  <div v-if="concordance.agg" :style="{ width: concPct(concordance.agg), background: '#bb4128' }" class="flex items-center justify-center text-[12px] font-semibold text-white">{{ concNarrow(concordance.agg) ? '' : concordance.agg }}</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-tinta">
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#9d44ab' }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.ne }}</span> {{ L('solo receptor (Ga+/FDG−)', 'receptor-only (Ga+/FDG−)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#df7a44' }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.mix }}</span> {{ L('mixtos (ambos)', 'mixed (both)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#bb4128' }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.agg }}</span> {{ L('solo FDG (Ga−/FDG+)', 'FDG-only (Ga−/FDG+)') }}</span>
              </div>
            </div>
            <div class="card-base !p-4">
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2">{{ L('Azúcar (FDG) vs estudio previo', 'Sugar (FDG) vs prior study') }}</p>
              <div class="grid grid-cols-4 gap-2 text-center">
                <div><div class="font-display text-2xl" :style="{ color: '#bb4128' }">{{ trajectory.neu }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('nuevos', 'new') }}</div></div>
                <div><div class="font-display text-2xl" :style="{ color: '#bb4128' }">↑ {{ trajectory.up }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('más FDG', 'more FDG') }}</div></div>
                <div><div class="font-display text-2xl" :style="{ color: '#1f5a3a' }">↓ {{ trajectory.down }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('menos FDG', 'less FDG') }}</div></div>
                <div><div class="font-display text-2xl text-berenjena">{{ trajectory.stable }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('estables', 'stable') }}</div></div>
              </div>
              <p class="text-[11px] text-tinta mt-2">{{ L('sobre ' + trajectory.withPrev + ' focos con valor en el PET previo (ene 2026)', 'over ' + trajectory.withPrev + ' foci with a value in the prior PET (Jan 2026)') }}</p>
            </div>
          </div>

          <!-- resumen para el equipo · abierto por defecto (vista clínica) -->
          <details class="notes-disclosure mt-3" open>
            <summary>{{ L('Resumen para el equipo médico', 'Summary for the medical team') }}</summary>
            <p class="mt-3 text-sm text-tinta leading-relaxed">
              {{ L(
                'Enfermedad ósea multinivel. ' + confirmedFoci.length + ' focos en el informe oficial (' + skeletonSplit.axial + ' axiales — columna y sacro — y ' + skeletonSplit.append + ' apendiculares — escápula, pelvis y cadera), más ' + aiFoci.length + ' focos por confirmar detectados por IA. Reparto receptor↔azúcar: ' + concordance.ne + ' captan solo receptor (Ga+/FDG−), ' + concordance.mix + ' son mixtos (ambos trazadores) y ' + concordance.agg + ' capta solo azúcar (Ga−/FDG+). Rango de SUVmáx: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Frente al PET previo (sobre ' + trajectory.withPrev + ' focos con valor previo): ' + trajectory.neu + ' nuevos, ' + trajectory.up + ' con más FDG, ' + trajectory.down + ' con menos y ' + trajectory.stable + ' estables. Las cifras son las de los informes oficiales del PET; el detalle por foco está en la ficha y en la tabla. Descripción, no consejo médico.',
                'Multilevel bone disease. ' + confirmedFoci.length + ' foci in the official report (' + skeletonSplit.axial + ' axial — spine and sacrum — and ' + skeletonSplit.append + ' appendicular — scapula, pelvis and hip), plus ' + aiFoci.length + ' foci to confirm detected by AI. Receptor↔sugar split: ' + concordance.ne + ' receptor-only (Ga+/FDG−), ' + concordance.mix + ' mixed (both tracers) and ' + concordance.agg + ' sugar-only (Ga−/FDG+). SUVmax range: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Versus the prior PET (over ' + trajectory.withPrev + ' foci with a prior value): ' + trajectory.neu + ' new, ' + trajectory.up + ' with more FDG, ' + trajectory.down + ' with less and ' + trajectory.stable + ' stable. Figures are those of the official PET reports; the per-focus detail is in the card and the table. Description, not medical advice.') }}
            </p>
          </details>
        </section>

        <!-- ===== EXPLICADOR · una lesión, dos trazadores ===== -->
        <section class="mb-14" aria-labelledby="dos-caras">
          <p class="eyebrow mb-2 block">{{ L('Cómo se lee', 'How to read it') }}</p>
          <h2 id="dos-caras" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Una lesión, dos trazadores', 'One lesion, two tracers') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-3xl">
            {{ L(
              'Cada foco óseo se mira con dos trazadores PET a la vez, y cada uno marca algo distinto del mismo punto: uno se pega al receptor y el otro al azúcar. Comparar las dos captaciones es lo que da las «dos caras» de cada lesión.',
              'Each bone focus is imaged with two PET tracers at once, and each one marks something different about the same spot: one binds the receptor and the other binds sugar. Comparing the two uptakes is what gives each lesion its “two faces”.') }}
          </p>

          <!-- cada trazador, qué marca -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card-base border-l-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold mb-1" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('el trazador del receptor', 'the receptor tracer') }}</p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'El Galio-68 DOTATOC se pega al receptor de somatostatina (SSTR). Donde brilla, ese foco capta el receptor.',
                  'Gallium-68 DOTATOC binds the somatostatin receptor (SSTR). Where it shines, that focus takes up the receptor.') }}
              </p>
            </div>
            <div class="card-base border-l-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold mb-1" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('el trazador del azúcar', 'the sugar tracer') }}</p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'El FDG es glucosa marcada y se acumula donde hay más consumo de energía. Donde brilla, ese foco capta azúcar.',
                  'FDG is labelled glucose that builds up where energy use is highest. Where it shines, that focus takes up sugar.') }}
              </p>
            </div>
          </div>

          <!-- leyenda de la barra dual receptor ↔ azúcar (codificación canónica) -->
          <div class="card-base !p-4 mt-4">
            <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2">{{ L('La barra receptor ↔ azúcar', 'The receptor ↔ sugar bar') }}</p>
            <div class="flex items-center gap-3">
              <div class="flex-1 flex h-3.5 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]">
                <div style="width: 58%; background: #9d44ab" />
                <div style="width: 42%; background: #bb4128" />
              </div>
            </div>
            <div class="flex justify-between text-[11px] mt-1.5">
              <span class="font-semibold" :style="{ color: '#9d44ab' }">{{ L('receptor · ⁶⁸Ga', 'receptor · ⁶⁸Ga') }}</span>
              <span class="font-semibold" :style="{ color: '#bb4128' }">{{ L('azúcar · ¹⁸F-FDG', 'sugar · ¹⁸F-FDG') }}</span>
            </div>
            <p class="text-[12px] text-tinta leading-relaxed mt-2">
              {{ L('La verás en cada ficha y en cada fila: la parte violeta frente a la coral resume cuánto capta el receptor (Galio) frente al azúcar (FDG) en ese foco. En el mapa, el color va del violeta (solo receptor) al coral (solo azúcar) y el tamaño del marcador refleja el SUVmáx (la avidez).',
                    'You’ll see it on every card and row: the violet versus coral share sums up how much that focus takes up the receptor (gallium) versus sugar (FDG). On the map, colour runs from violet (receptor only) to coral (sugar only) and marker size reflects SUVmax (avidity).') }}
            </p>
          </div>

          <!-- los tres patrones (por trazador) -->
          <div class="grid sm:grid-cols-3 gap-3 mt-4">
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#9d44ab' }">{{ L('Receptor + / FDG −', 'Receptor + / FDG −') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta el receptor (Galio) y poco o nada de azúcar.', 'Takes up the receptor (gallium) and little or no sugar.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#df7a44' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#b07d1e' }">{{ L('Mixto (ambos)', 'Mixed (both)') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta los dos trazadores: receptor y azúcar a la vez.', 'Takes up both tracers: receptor and sugar at once.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#bb4128' }">{{ L('FDG + / Receptor −', 'FDG + / receptor −') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta azúcar (FDG) pero no el receptor, así que el Galio no lo ve.', 'Takes up sugar (FDG) but not the receptor, so gallium does not see it.') }}</p>
            </div>
          </div>
        </section>

        <!-- ===== ZONA B · NÚCLEO INTERACTIVO ===== -->
        <section class="mb-14" aria-labelledby="mapa">
          <p class="eyebrow mb-2 block">{{ L('Dónde · de qué tipo · cada foco', 'Where · what type · each focus') }}</p>
          <h2 id="mapa" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('El mapa, lesión a lesión', 'The map, lesion by lesion') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Tres vistas enlazadas del MISMO foco: el esqueleto (dónde está), el mapa de tipo (de qué cara es) y la ficha (el detalle). Toca un punto en cualquiera de ellas —o una fila de la tabla— y las demás se sincronizan. El color va del violeta (solo receptor) al coral (solo azúcar); el tamaño refleja la avidez. Desliza la línea de tiempo para ver la evolución; el esqueleto es un esquema orientativo.',
                  'Three linked views of the SAME focus: the skeleton (where it is), the type map (which face it is) and the card (the detail). Tap a point in any of them —or a table row— and the others sync. Colour runs from violet (receptor only) to coral (sugar only); size reflects avidity. Slide the timeline to see the evolution; the skeleton is a schematic guide.') }}
          </p>

          <!-- filtros -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button v-for="f in filters" :key="f.key" type="button"
              @click="filter = f.key as any"
              class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors"
              :class="filter === f.key ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.2)] hover:border-[rgba(45,27,61,0.4)]'">
              <span v-if="f.c" class="w-2.5 h-2.5 rounded-full" :style="{ background: f.c }" />
              {{ f.label }}
            </button>
          </div>

          <!-- ===== LÍNEA DE TIEMPO ===== -->
          <div class="card-base !p-4 mb-6">
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" @click="play()"
                class="shrink-0 w-10 h-10 rounded-full bg-berenjena text-cream flex items-center justify-center text-sm hover:opacity-90 transition-opacity"
                :aria-label="playing ? L('Pausar', 'Pause') : L('Reproducir la evolución', 'Play the evolution')">
                {{ playing ? '❚❚' : '▶' }}
              </button>
              <div class="font-display text-xl text-berenjena w-24 tabular-nums">{{ dateLabel }}</div>
              <input type="range" min="0" max="2" step="1" :value="frame"
                @input="setFrame(+($event.target as HTMLInputElement).value)"
                class="flex-1 min-w-[140px] accent-berenjena"
                :aria-label="L('Línea de tiempo', 'Timeline')" />
            </div>
            <div class="flex justify-between mt-3 px-1">
              <button v-for="(d, i) in FDATES" :key="i" type="button" @click="setFrame(i)"
                class="text-[10px] font-mono transition-colors"
                :class="frame === i ? 'text-berenjena font-bold' : 'text-tinta hover:text-berenjena'">{{ d[lang].split(' ')[0] }}</button>
            </div>
            <p class="text-[11px] text-tinta mt-2 leading-relaxed">
              {{ L('Desliza o pulsa ▶ para ver la evolución del azúcar (FDG): del estudio previo (ene 2026) al actual (mar 2026). El último paso (may 2026) muestra el receptor (Galio). Un anillo pulsante marca un foco que enciende por primera vez.',
                    'Slide or press ▶ to watch the sugar (FDG) evolution: from the prior study (Jan 2026) to the current one (Mar 2026). The last step (May 2026) shows the receptor (gallium). A pulsing ring marks a focus lighting up for the first time.') }}
            </p>
          </div>

          <div class="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
            <!-- ESQUELETO SVG -->
            <div class="card-base !p-4 lg:sticky lg:top-24">
              <!-- ORIENTACIÓN · vista anterior (criterio radiológico/PET, el
                   mismo de las MIP): se mira a la persona DE FRENTE, así que la
                   DERECHA del cuerpo se dibuja a la IZQUIERDA de la imagen. La
                   banda lo dice explícito para que un médico lo lea como
                   convención estándar y un lego no lo malinterprete. -->
              <p class="text-[10px] text-tinta leading-snug px-1 mb-1.5">
                {{ L('Vista de frente · la derecha del cuerpo queda a tu izquierda', 'Front view · the body’s right is on your left') }}
              </p>
              <div class="flex justify-between text-[11px] font-semibold text-berenjena px-1 mb-1">
                <span>{{ L('Dcha. del cuerpo', 'Body’s right') }}</span>
                <span>{{ L('Izq. del cuerpo', 'Body’s left') }}</span>
              </div>
              <svg viewBox="0 0 440 700" class="w-full" role="img" :aria-label="L('Esquema del esqueleto con las lesiones', 'Skeleton schematic with the lesions')">
                <defs>
                  <linearGradient id="skBone" x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stop-color="#efe8da" /><stop offset="48%" stop-color="#e3dac8" /><stop offset="100%" stop-color="#d2c7b1" />
                  </linearGradient>
                  <linearGradient id="skBoneV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f1ebde" /><stop offset="50%" stop-color="#e6ddcc" /><stop offset="100%" stop-color="#d6ccb7" />
                  </linearGradient>
                  <radialGradient id="skBoneHi" cx="36%" cy="20%" r="75%">
                    <stop offset="0%" stop-color="#fffdf8" stop-opacity="0.7" /><stop offset="55%" stop-color="#fffdf8" stop-opacity="0" />
                  </radialGradient>
                  <filter id="skBoneShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1.2" stdDeviation="3.2" flood-color="#2d1b3d" flood-opacity="0.10" />
                  </filter>
                  <radialGradient id="skPanel" cx="50%" cy="38%" r="80%">
                    <stop offset="0%" stop-color="#f7f2ea" /><stop offset="100%" stop-color="#efe8dc" />
                  </radialGradient>
                  <radialGradient v-for="(c, k) in PHENO" :key="'h' + k" :id="'skHalo-' + k" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" :stop-color="c.c" stop-opacity="0.42" /><stop offset="50%" :stop-color="c.c" stop-opacity="0.16" /><stop offset="100%" :stop-color="c.c" stop-opacity="0" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="440" height="700" rx="18" fill="url(#skPanel)" />
                <g filter="url(#skBoneShadow)">
                <!-- cráneo -->
                <path d="M192,44 Q192,10 220,10 Q248,10 248,44 Q248,66 233,72 Q220,77 207,72 Q192,66 192,44 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <path d="M192,44 Q192,10 220,10 Q248,10 248,44 Q248,66 233,72 Q220,77 207,72 Q192,66 192,44 Z" fill="url(#skBoneHi)" />
                <!-- maxilar/cuello -->
                <path d="M210,66 Q220,75 230,66 L228,76 Q220,82 212,76 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <!-- caja torácica sutil (contexto dorsal / costal) -->
                <path v-for="(rb, i) in ribs" :key="'rib' + i" :d="rb.d" fill="none" stroke="#d9d0bd" stroke-width="2.2" opacity="0.5" stroke-linecap="round" />
                <!-- vértebras (discos refinados) -->
                <g v-for="(v, i) in vertebrae" :key="'v' + i">
                  <rect :x="v.x" :y="v.y" :width="v.w" :height="v.h" :rx="Math.min(v.h / 2, 7)" fill="url(#skBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                  <rect :x="v.x + 1.5" :y="v.y + 1" :width="v.w - 3" :height="v.h * 0.4" :rx="Math.min(v.h / 2, 7) * 0.7" fill="#fffdf8" opacity="0.35" />
                </g>
                <!-- sacro -->
                <path d="M202,485 Q220,483 238,485 L231,538 Q220,547 209,538 Z" fill="url(#skBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <!-- pelvis -->
                <path d="M201,487 C152,485 122,520 130,560 C135,588 168,596 187,574 C200,558 203,520 201,487 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <path d="M239,487 C288,485 318,520 310,560 C305,588 272,596 253,574 C240,558 237,520 239,487 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <path d="M201,487 C152,485 122,520 130,560 C135,588 168,596 187,574 C200,558 203,520 201,487 Z" fill="url(#skBoneHi)" />
                <!-- fémures -->
                <circle cx="151" cy="600" r="12.5" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <rect x="150" y="606" width="13" height="92" rx="6.5" fill="url(#skBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <circle cx="289" cy="600" r="12.5" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <rect x="277" y="606" width="13" height="92" rx="6.5" fill="url(#skBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <!-- escápulas -->
                <path d="M114,182 Q146,188 146,192 L141,242 Q138,246 134,240 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                <path d="M326,182 Q294,188 294,192 L299,242 Q302,246 306,240 Z" fill="url(#skBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
                </g>
                <!-- ticks de nivel (contraste AA para orientación rápida) -->
                <g font-family="JetBrains Mono, monospace" font-size="9" fill="#5a5550" font-weight="600">
                  <text v-for="tk in ticks" :key="tk.t" x="358" :y="tk.y + 3" text-anchor="start">{{ tk.t }}</text>
                  <line v-for="tk in ticks" :key="'l' + tk.t" x1="346" :y1="tk.y" x2="354" :y2="tk.y" stroke="#9b8f7c" stroke-width="1" />
                </g>
                <!-- lesiones: un marcador por grupo (vértebra con 1+ focos, o hueso) -->
                <g v-for="g in GROUPS" :key="g.key" v-show="groupVisible(g)">
                  <!-- halo PET: brillo del foco en el color del fenotipo -->
                  <circle v-if="gPresentAt(g, frame)" :cx="g.x" :cy="g.y"
                    :r="gRadius(g, frame) + 8" :fill="`url(#skHalo-${g.primary.pheno})`"
                    class="pointer-events-none" />
                  <!-- anillo pulsante: algún foco aparece por primera vez -->
                  <circle v-if="gNewAt(g, frame) && gPresentAt(g, frame)"
                    :cx="g.x" :cy="g.y" :r="gRadius(g, frame) + 4"
                    fill="none" :stroke="phenoColor(g.primary)" stroke-width="2"
                    class="pulse-ring pointer-events-none" />
                  <!-- parpadeo SUTIL = mayor avidez de azúcar (FDG alto). Distinto
                       del anillo «foco nuevo»: aquí late el propio relleno del
                       marcador (sin anillo extra). Solo en el frame FDG. -->
                  <circle v-if="gHotFdgAt(g, frame) && !gSelected(g)"
                    :cx="g.x" :cy="g.y" :r="gRadius(g, frame)"
                    :fill="phenoColor(g.primary)"
                    class="pulse-hot pointer-events-none" />
                  <circle
                    :cx="g.x" :cy="g.y"
                    :r="(gPresentAt(g, frame) ? gRadius(g, frame) : 5) + (gSelected(g) ? 3 : 0)"
                    :fill="gPresentAt(g, frame) ? phenoColor(g.primary) : 'none'"
                    :fill-opacity="gSelected(g) ? 1 : 0.82"
                    :stroke="gSelected(g) ? '#2d1b3d' : (gPresentAt(g, frame) ? '#ffffff' : phenoColor(g.primary))"
                    :stroke-width="gSelected(g) ? 2 : 1.4"
                    :stroke-dasharray="sourceOf(g.primary) === 'ia-david' ? '2 1.6' : (gPresentAt(g, frame) ? undefined : '3 2')"
                    :opacity="gPresentAt(g, frame) ? 1 : 0.4"
                    class="cursor-pointer transition-all"
                    tabindex="0" role="button"
                    :aria-label="g.multi ? `${g.foci[0].level[lang]} — ${g.foci.length} ${L('focos', 'foci')}` : `${g.primary.level[lang]} — ${phenoLabel(g.primary)}`"
                    @click="pickGroup(g)" @keydown.enter="pickGroup(g)" @keydown.space.prevent="pickGroup(g)" />
                  <!-- foco único: id dentro; varios focos: insignia de recuento -->
                  <text v-if="!g.multi && gPresentAt(g, frame)" :x="g.x" :y="g.y + 3.5" text-anchor="middle"
                    font-family="Source Sans 3, sans-serif" font-size="10" font-weight="700" fill="#fff"
                    class="pointer-events-none select-none">{{ g.primary.id }}</text>
                  <g v-if="g.multi && gPresentAt(g, frame)" class="pointer-events-none select-none">
                    <circle :cx="g.x + gRadius(g, frame) + 1.5" :cy="g.y - gRadius(g, frame) - 1.5" r="6.5"
                      fill="#2d1b3d" stroke="#fff" stroke-width="1.2" />
                    <text :x="g.x + gRadius(g, frame) + 1.5" :y="g.y - gRadius(g, frame) + 1.3" text-anchor="middle"
                      font-family="Source Sans 3, sans-serif" font-size="9" font-weight="700" fill="#fff">{{ g.foci.length }}</text>
                  </g>
                </g>
              </svg>
              <!-- leyenda gradiente -->
              <div class="mt-3 px-1">
                <div class="h-2.5 rounded-full" :style="{ background: 'linear-gradient(90deg,#9d44ab,#8a5bb3,#c9921e,#df7a44,#bb4128)' }" />
                <div class="flex justify-between text-[10px] text-tinta mt-1">
                  <span>{{ L('Solo receptor (Galio)', 'Receptor only (gallium)') }}</span>
                  <span>{{ L('Solo azúcar (FDG)', 'Sugar only (FDG)') }}</span>
                </div>
                <p class="text-[10px] text-tinta mt-1.5 leading-snug">{{ L('El contorno punteado marca los focos detectados por IA, por confirmar (no en el informe).', 'A dashed outline marks AI-detected foci, to confirm (not in the report).') }}</p>
                <p class="text-[10px] text-tinta mt-1 leading-snug flex items-start gap-1.5">
                  <span class="legend-pulse-dot shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{{ L('En la vista de azúcar (FDG), los focos que parpadean son los de mayor avidez de azúcar (FDG SUVmáx ≥ ' + HOT_FDG + '). Descriptivo, no es una conclusión.', 'In the sugar (FDG) view, the blinking foci are the most sugar-avid ones (FDG SUVmax ≥ ' + HOT_FDG + '). Descriptive, not a conclusion.') }}</span>
                </p>
              </div>
            </div>

            <!-- FICHA DE LESIÓN -->
            <div class="card-base">
              <div class="flex items-start gap-3 mb-1">
                <span class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-base text-white"
                  :style="{ background: phenoColor(sel) }">{{ sel.id }}</span>
                <div>
                  <h3 class="heading-display text-xl text-berenjena leading-tight">{{ sel.level[lang] }}</h3>
                  <p class="text-xs text-tinta">{{ sel.region[lang] }} ·
                    {{ sel.side === 'R' ? L('lado derecho', 'right side') : sel.side === 'L' ? L('lado izquierdo', 'left side') : L('línea media', 'midline') }}</p>
                </div>
              </div>

              <!-- ===== BANNER · foco DETECTADO POR IA, pendiente de validación =====
                   Foco #17/#18/#19: se muestra con la MISMA información que el resto
                   para que el equipo pueda corroborarlo, marcado con claridad (sin
                   alarmismo) como pendiente de validación radiológica. Informa, no
                   concluye: no afirma que sea maligno. -->
              <div v-if="selIsAi" class="mb-4 rounded-card border-l-4 px-3.5 py-3" style="border-left-color:#bf7d2c;background:#fbf5ea">
                <p class="text-[11px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap" style="color:#8a4a1a">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" style="background:#bf7d2c" aria-hidden="true" />
                  {{ L('Detectado por IA · pendiente de validación por los radiólogos', 'AI-detected · pending validation by the radiologists') }}
                </p>
                <p class="text-[13px] leading-snug" style="color:#7a4a12">
                  {{ L('Este foco lo detectó una herramienta de IA sobre los DICOM y no consta en el informe oficial. Se muestra con la MISMA información que el resto de focos —las tres lecturas, la forma, la extensión y la idoneidad— para que el equipo pueda corroborarlo. Aún no está confirmado: los valores son aproximados (medidos sobre el DICOM) y, donde el dato no es fiable, se indica «— · por confirmar». No es una relectura formal ni afirma que sea una metástasis: a validar con Medicina Nuclear.',
                        'This focus was detected by an AI tool on the DICOM and is not in the official report. It is shown with the SAME information as every other focus —the three readings, the shape, the extent and the suitability— so the team can corroborate it. It is not yet confirmed: the values are approximate (measured on the DICOM) and, where the datum is not reliable, it reads “— · to confirm”. It is not a formal re-read and does not claim it is a metastasis: to validate with Nuclear Medicine.') }}
                </p>
              </div>

              <!-- zona con 2+ focos co-localizados: se muestran JUNTOS, como un solo
                   hueso, con un rótulo de «N focos» — SIN selector (la paciente: el
                   selector hace que la gente se pierda). Lista breve, etiquetada por
                   trazador; el realce 3D señala la zona, no cada foco. -->
              <div v-if="isMultiFocusBone" class="mb-3 rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card p-3">
                <p class="text-[11px] font-semibold text-berenjena leading-snug">
                  {{ L('Esta zona aloja ' + coFoci.length + ' focos', 'This area hosts ' + coFoci.length + ' foci') }}
                  <span class="font-normal text-tinta">· {{ L('se muestran como un solo hueso', 'shown as a single bone') }}</span>
                </p>
                <ul class="mt-2 space-y-1.5">
                  <li v-for="f in coFoci" :key="f.id" class="text-[12px] leading-snug flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span class="font-mono text-berenjena">#{{ f.id }}</span>
                    <span class="text-tinta">{{ focusPart(f) }}</span>
                    <span class="text-tinta">·</span>
                    <span :style="{ color: '#9d44ab' }">{{ L('receptor · ⁶⁸Ga', 'receptor · ⁶⁸Ga') }} <span class="font-mono">{{ f.dota != null ? f.dota.toFixed(2) : '—' }}</span></span>
                    <span :style="{ color: '#bb4128' }">{{ L('azúcar · FDG', 'sugar · FDG') }} <span class="font-mono">{{ f.fdg != null ? f.fdg.toFixed(2) : '—' }}</span></span>
                  </li>
                </ul>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('El detalle ampliado de abajo corresponde al foco principal de la zona; el resto está en la tabla. Describe los hallazgos; no concluye.', 'The expanded detail below is for the area’s main focus; the rest is in the table. It describes the findings; it does not conclude.') }}</p>
              </div>

              <span class="pill-data mt-2 mb-3 inline-flex" :style="{ background: phenoColor(sel) + '22', color: phenoText(sel) }">{{ phenoLabel(sel) }}</span>

              <!-- barra «dos caras»: proporción receptor (violeta) ↔ azúcar (coral) -->
              <div class="mb-4">
                <div class="flex h-3 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" role="img"
                  :aria-label="L('Proporción receptor frente a azúcar', 'Receptor versus sugar share')">
                  <div :style="{ width: (neShare(sel) * 100).toFixed(0) + '%', background: '#9d44ab' }" />
                  <div :style="{ width: ((1 - neShare(sel)) * 100).toFixed(0) + '%', background: '#bb4128' }" />
                </div>
                <div class="flex justify-between text-[10px] mt-1">
                  <span :style="{ color: '#9d44ab' }">{{ L('receptor · ⁶⁸Ga', 'receptor · ⁶⁸Ga') }}{{ sel.dota != null ? ' ' + sel.dota.toFixed(1) : ' —' }}</span>
                  <span :style="{ color: '#bb4128' }">{{ L('azúcar · FDG', 'sugar · FDG') }}{{ sel.fdg != null ? ' ' + sel.fdg.toFixed(1) : ' —' }}</span>
                </div>
              </div>

              <!-- ===== LAS TRES LECTURAS · una por prueba (etiquetadas por prueba) ===== -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.12)] overflow-hidden">
                <div class="px-3 py-2 bg-[rgba(45,27,61,0.04)] border-b border-[rgba(45,27,61,0.08)]">
                  <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide">{{ L('Las tres lecturas · una por prueba', 'The three readings · one per test') }}</p>
                  <p class="text-[11px] text-tinta leading-snug mt-0.5">{{ L('Tres pruebas miran el mismo foco. Etiquetadas por la prueba, no por la biología.', 'Three tests look at the same focus. Labelled by the test, not the biology.') }}</p>
                </div>
                <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(45,27,61,0.08)]">
                  <!-- 1 · Receptor (Galio) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#9d44ab' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#9d44ab' }">{{ L('Receptor', 'Receptor') }} · ⁶⁸Ga-DOTATOC</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('el trazador del receptor (SSTR)', 'the receptor tracer (SSTR)') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">{{ sel.dota != null ? sel.dota.toFixed(2) : '—' }}</p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.dota != null ? L('SUVmáx SSTR', 'SSTR SUVmax') : L('sin captación del receptor', 'no receptor uptake') }}</p>
                  </div>
                  <!-- 2 · Azúcar (FDG) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#bb4128' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#bb4128' }">{{ L('Azúcar', 'Sugar') }} · ¹⁸F-FDG</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('el trazador del azúcar (glucosa)', 'the sugar tracer (glucose)') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">
                      {{ sel.fdg != null ? sel.fdg.toFixed(2) : '—' }}<span v-if="trend(sel)" class="text-[12px] ml-1" :style="deltaStyle(sel)">({{ deltaFdg(sel) }})</span>
                    </p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.fdg != null ? (trend(sel) ? L('SUVmáx · Δ vs previo', 'SUVmax · Δ vs prior') : L('SUVmáx', 'SUVmax')) : L('sin captación de azúcar', 'no sugar uptake') }}</p>
                  </div>
                  <!-- 3 · RMN (forma) — color distinto, NO violeta/coral: no es un trazador -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#1f6b57' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#1f6b57' }">{{ L('RMN', 'MRI') }} · {{ L('forma', 'shape') }}</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('morfología — canal de forma, no un 3er color', 'morphology — a shape channel, not a 3rd colour') }}</p>
                    <template v-if="mriCovers(sel)">
                      <p class="text-[12px] text-berenjena leading-snug">{{ rmnNote(sel) }}</p>
                      <button type="button" @click="goToMRI()" class="link-action text-miriam text-[12px] mt-1.5 inline-flex items-center gap-1">
                        {{ L('Ver en el visor RMN', 'Open the MRI viewer') }} <span aria-hidden="true">→</span>
                      </button>
                    </template>
                    <p v-else class="text-[12px] text-tinta leading-snug">{{ L('La RMN de columna mostrada (cervical y dorsal) no cubre este nivel.', 'The spine MRI shown (cervical and thoracic) does not cover this level.') }}</p>
                  </div>
                </div>
                <p class="px-3 py-2 text-[10px] text-tinta leading-relaxed border-t border-[rgba(45,27,61,0.08)]">{{ L('«Blástico/escleroso» describe la FORMA del hueso (denso); no es un tercer trazador ni un tercer color. Describe los hallazgos; no concluye.', '“Blastic/sclerotic” describes the SHAPE of the bone (dense); it is not a third tracer or a third colour. It describes the findings; it does not conclude.') }}</p>
              </div>

              <!-- ===== MORFOLOGÍA (forma del hueso) + MTV · dato de PRIMERA CLASE =====
                   La morfología (lítico/blástico/mixto) es el predictor clave del
                   RENDIMIENTO de la biopsia; se promueve aquí desde la verificación.
                   Es FORMA del hueso (densidad CT), no biología ni trazador. -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card p-3">
                <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#1f6b57' }" />
                  {{ L('Forma del hueso y cantidad de tumor', 'Bone shape and tumour amount') }}
                  <span class="status-badge" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('morfología · CT', 'morphology · CT') }}</span>
                </p>
                <div class="grid sm:grid-cols-3 gap-3">
                  <!-- morfología (forma) -->
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#1f6b57' }">
                    <p class="text-[11px] text-tinta">{{ L('Morfología (forma)', 'Morphology (shape)') }}</p>
                    <p class="font-semibold text-berenjena leading-snug">{{ morphLabel(sel) }}</p>
                    <p class="text-[12px] text-tinta leading-snug mt-1">{{ morphYieldNote(sel) }}</p>
                  </div>
                  <!-- extensión metabólica medida (mm) · MTV (ml) -->
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#6b6470' }">
                    <p class="text-[11px] text-tinta">{{ L('Extensión metabólica (mm) · MTV (ml)', 'Metabolic extent (mm) · MTV (ml)') }}</p>
                    <p class="font-mono font-semibold text-berenjena leading-snug mt-0.5">{{ metExtentLabel(sel) }}</p>
                    <p class="text-[12px] text-tinta leading-snug mt-1">{{ L('lo que capta por encima del umbral (41% del SUVmáx local), confinado a hueso — no el tamaño anatómico exacto.', 'what it takes up above the threshold (41% of local SUVmax), confined to bone — not the exact anatomical size.') }}</p>
                  </div>
                  <!-- MTV por trazador (verificación) -->
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#6b6470' }">
                    <p class="text-[11px] text-tinta">{{ L('MTV por trazador', 'MTV by tracer') }}</p>
                    <p v-if="hasMtv" class="leading-snug mt-0.5">
                      <span v-for="(m, i) in mtvList(sel)" :key="i" class="font-mono text-berenjena mr-2">{{ m.tr }} {{ m.v }} ml</span>
                    </p>
                    <p v-else class="font-semibold text-tinta mt-0.5">{{ L('— · no medido', '— · not measured') }}</p>
                    <p class="text-[12px] text-tinta leading-snug mt-1">{{ L('volumen metabólico por trazador (verificación, orientativo)', 'metabolic volume per tracer (verification, indicative)') }}</p>
                  </div>
                </div>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('La FORMA del hueso se mide sobre el CT (densidad) y la extensión metabólica sobre el PET (umbral 41% del SUVmáx local); no son la biología ni un trazador. La extensión metabólica es lo que capta sobre el umbral, no el tamaño anatómico exacto: el volumen parcial subestima los focos < ~10 mm. Orientativo; describe, no concluye.', 'Bone SHAPE is measured on the CT (density) and the metabolic extent on the PET (41% of the local SUVmax threshold); neither is the biology or a tracer. The metabolic extent is what is taken up above the threshold, not the exact anatomical size: partial volume underestimates foci < ~10 mm. Indicative; it describes, it does not conclude.') }}</p>
              </div>

              <!-- ===== BIOPSIA PREVIA del foco (hecho del caso · honesto, neutral) ===== -->
              <div v-if="sel.priorBiopsy" class="mb-4 rounded-card border-l-4 px-3 py-3" :style="{ borderLeftColor: '#8a5a1a', background: '#fbf6ec' }">
                <p class="text-[11px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap" :style="{ color: '#8a5a1a' }">
                  {{ L('Biopsia previa de este foco', 'Prior biopsy of this focus') }}
                  <span class="status-badge" :style="{ background: '#f0e2c8', color: '#8a5a1a' }">26B585</span>
                </p>
                <p class="text-[13px] text-tinta leading-snug">{{ sel.priorBiopsy[lang] }}</p>
              </div>

              <!-- ===== PARTES BLANDAS / EXTENSIÓN EXTRAÓSEA (RMN → factibilidad) ===== -->
              <div v-if="sel.softTissue" class="mb-4 rounded-card border-l-4 px-3 py-3" :style="{ borderLeftColor: '#1f6b57', background: '#eef6f2' }">
                <p class="text-[11px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap" :style="{ color: '#1f6b57' }">
                  {{ L('Partes blandas / extensión extraósea', 'Soft tissue / extraosseous extension') }}
                  <span class="status-badge" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('factibilidad · RMN', 'feasibility · MRI') }}</span>
                </p>
                <p class="text-[13px] text-tinta leading-snug">{{ sel.softTissue[lang] }}</p>
              </div>

              <!-- capa CLARA -->
              <p class="text-[15px] text-berenjena leading-relaxed mb-4">{{ sel.what[lang] }}</p>

              <!-- HALLAZGOS: lo que muestra este foco (descripción, no triaje) -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.1)] bg-cream-card p-3">
                <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: phenoColor(sel) }" />
                  {{ L('Lo que muestra este foco', 'What this focus shows') }}
                </p>
                <ul class="space-y-1.5">
                  <li v-for="(tg, i) in focusObservations(sel)" :key="i" class="flex gap-2 text-[13px] leading-snug">
                    <span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: observationTone(tg.tone) }" />
                    <span class="text-tinta">{{ lang === 'en' ? tg.en : tg.es }}</span>
                  </li>
                </ul>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Descripción de los hallazgos del foco a partir de los SUV, la tendencia y la morfología del propio foco. No es consejo médico ni una indicación de tratamiento.', 'A description of the focus’s findings from its own SUVs, trend and morphology. Not medical advice or a treatment indication.') }}</p>
              </div>

              <!-- hueso reconstruido del CT (real) · 3 vistas conmutables -->
              <div class="mb-4">
                <p class="eyebrow mb-2 block">{{ L('Hueso reconstruido del CT · captación co-registrada', 'Bone reconstructed from the CT · co-registered uptake') }}</p>

                <!-- zona con varios focos: rótulo junto al visor. El realce marca la
                     ZONA (no cada foco: no hay posición 3D fiable por foco). -->
                <p v-if="isMultiFocusBone" class="text-[11px] text-tinta leading-snug mb-2">
                  {{ L('Esta zona tiene ' + coFoci.length + ' focos co-localizados (receptor/azúcar); el realce señala la zona. Detalle de cada foco arriba y en la tabla.', 'This area has ' + coFoci.length + ' co-localized foci (receptor/sugar); the highlight marks the area. Each focus is detailed above and in the table.') }}
                </p>

                <!-- foco con reconstrucción: selector de vista + visor -->
                <template v-if="bone3dKeyOf(sel)">
                  <!-- selector de vista (segmented control · tablist accesible) -->
                  <div
                    ref="bone3dTablist"
                    class="inline-flex rounded-full border border-[rgba(45,27,61,0.18)] overflow-hidden mb-2.5"
                    role="tablist"
                    :aria-label="L('Forma de ver el hueso', 'How to view the bone')"
                    @keydown="bone3dTabKey"
                  >
                    <button
                      v-for="(v, i) in BONE3D_VIEWS" :key="v.id"
                      type="button" role="tab"
                      :id="'bone3dtab-' + v.id"
                      :aria-selected="bone3dView === v.id"
                      :aria-controls="'bone3dpanel'"
                      :tabindex="bone3dView === v.id ? 0 : -1"
                      class="px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                      :class="[
                        bone3dView === v.id ? 'bg-berenjena text-cream' : 'bg-transparent text-tinta hover:bg-[rgba(45,27,61,0.05)]',
                        i > 0 ? 'border-l border-[rgba(45,27,61,0.18)]' : ''
                      ]"
                      @click="bone3dView = v.id"
                    >{{ L(v.es, v.en) }}</button>
                  </div>

                  <div id="bone3dpanel" role="tabpanel" :aria-labelledby="'bone3dtab-' + bone3dView">
                    <ClientOnly>
                      <!-- UN SOLO visor WebGL para los 3 modos: cambiar de modo sólo
                           reescribe el color por vértice (no recarga la malla). El caption
                           honesto por modo lo pinta el propio visor. -->
                      <BoneViewer3D
                        :mesh-key="bone3dKeyOf(sel)" :mode="bone3dView"
                        :dota="sel.dota" :fdg="sel.fdg" :pheno="sel.pheno" :focus-id="sel.id"
                        :n-foci="coFoci.length"
                        :biopsied="bonePriorBiopsy != null"
                        :biopsy-label="bonePriorBiopsy ?? undefined"
                      />

                      <template #fallback>
                        <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:5/4;background:#0d1117;color:#aeb6c2">
                          {{ L('cargando visor…', 'loading viewer…') }}
                        </div>
                      </template>
                    </ClientOnly>
                  </div>
                  <!-- A11y: anuncia el cambio de vista (ningún cambio debe ser silencioso) -->
                  <div aria-live="polite" class="sr-only">{{ bone3dViewAnnounce }}</div>
                </template>

                <!-- foco SIN reconstrucción individual (#17 costilla, #19): estado honesto -->
                <ClientOnly v-else>
                  <BoneViewer3D :mesh-key="undefined" :dota="sel.dota" :fdg="sel.fdg" :pheno="sel.pheno" :focus-id="sel.id" />
                  <template #fallback>
                    <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:5/4;background:#0d1117;color:#aeb6c2">
                      {{ L('cargando visor 3D…', 'loading 3D viewer…') }}
                    </div>
                  </template>
                </ClientOnly>
              </div>

              <!-- CUANTIFICACIÓN AUTOMÁTICA medida sobre los DICOM (verificación) — abierta por defecto (vista clínica) -->
              <details v-if="hasAuto" class="notes-disclosure mb-4" open>
                <summary>{{ L('Medido sobre los DICOM (verificación automática)', 'Measured from the DICOM (automatic verification)') }}</summary>
                <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mt-3 mb-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#1f5a3a' }" />
                  {{ L('SUV automático frente a tabla', 'Automatic SUV versus table') }}
                  <span class="status-badge" :style="{ background: 'rgba(31,90,58,0.12)', color: '#1f5a3a' }">{{ L('automático · verificación', 'automatic · verification') }}</span>
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#bb4128' }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ sel.fdg != null ? sel.fdg.toFixed(2) : '—' }}</span>
                        <template v-if="selAuto?.fdgAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.fdgAuto?.toFixed(2) }}</span>
                          <span v-if="sel.fdg != null" class="font-semibold" :style="{ color: Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? '#1f5a3a' : '#b07d1e' }">{{ Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? ' ✓' : ' ≈' }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.fdgAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.fdgMtv }} ml</span> · TLG <span class="font-mono text-berenjena">{{ selAuto?.fdgTlg }}</span> · <span class="text-berenjena">{{ selAuto?.fdgMorph }}</span></div>
                    </div>
                  </div>
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#9d44ab' }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('receptor', 'receptor') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ sel.dota != null ? sel.dota.toFixed(2) : '—' }}</span>
                        <template v-if="selAuto?.gaAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.gaAuto?.toFixed(2) }}</span>
                          <span v-if="sel.dota != null" class="font-semibold" :style="{ color: Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? '#1f5a3a' : '#b07d1e' }">{{ Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? ' ✓' : ' ≈' }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.gaAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.gaMtv }} ml</span> · <span class="text-berenjena">{{ selAuto?.gaMorph }}</span></div>
                      <div v-else class="text-tinta">{{ L('auto: no medido — vale la tabla', 'auto: not measured — table stands') }}</div>
                    </div>
                  </div>
                </div>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('SUV recalculado del DICOM (corrección de decaimiento), volumen metabólico (MTV) y carga glucolítica (TLG) con máscara ósea del CT; morfología por densidad CT. El FDG (1,65 mm) es fino; el Galio (4 mm), más grueso. Verificación automática, no diagnóstico: manda la tabla y el criterio del equipo.', 'SUV recomputed from the DICOM (decay-corrected), metabolic volume (MTV) and glycolytic load (TLG) with a CT bone mask; morphology from CT density. FDG (1.65 mm) is fine; gallium (4 mm) coarser. Automatic verification, not a diagnosis: the table and the team’s judgement prevail.') }}</p>
              </details>

              <!-- evolución del FDG (solo si hay dos medidas; el Galio tiene una sola) -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('Evolución del FDG (azúcar)', 'FDG (sugar) evolution') }}</span>
                  <span v-if="hasFdgEvo" class="text-[10px] text-tinta">{{ L('ene → mar 2026', 'Jan → Mar 2026') }}</span>
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-if="hasFdgEvo" v-html="evoChartSvg" />
                <div v-else class="rounded-card border px-3 py-2 text-[12.5px] leading-snug flex items-start gap-2"
                  :style="sel.fdg != null
                    ? { borderColor: '#efb27a', background: '#fbf0df', color: '#7a4a12' }
                    : { borderColor: 'rgba(45,27,61,0.12)', background: 'rgba(45,27,61,0.04)', color: '#3a3340' }">
                  <span v-if="sel.fdg != null" class="status-badge shrink-0" style="background:#fde4cc;color:#8a4a1a">{{ L('NUEVO', 'NEW') }}</span>
                  <span>{{ noEvoLabel }}</span>
                </div>
              </div>

              <!-- imagen real del foco · visor con zoom/pan + diana (P0) -->
              <figure class="mb-4">
                <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('La imagen de este foco', 'This focus’s image') }}</span>
                  <span v-if="selView.approx" class="status-badge" style="background:#fde4cc;color:#8a4a1a">{{ L('ubicación aproximada', 'approximate location') }}</span>
                  <span v-else class="status-badge" style="background:rgba(31,90,58,0.12);color:#1f5a3a">{{ L('lesión centrada', 'lesion centered') }}</span>
                </div>
                <ClientOnly>
                  <ImageZoomViewer
                    :src="selView.src"
                    :alt="L('Imagen PET de la lesión #' + sel.id + ' · ' + sel.level.es, 'PET image of lesion #' + sel.id + ' · ' + sel.level.en)"
                    :marker-x="selView.fx"
                    :marker-y="selView.fy"
                    :approx="selView.approx"
                    :max-width="selView.kind === 'axial' ? '320px' : '380px'" />
                  <template #fallback>
                    <img :src="selView.src" :alt="L('Imagen PET de la lesión', 'PET image of the lesion')" class="rounded-lg bg-black mx-auto block" :style="{ maxWidth: selView.kind === 'axial' ? '320px' : '380px' }" loading="lazy" />
                  </template>
                </ClientOnly>
                <figcaption class="text-[10px] text-tinta text-center mt-1.5 leading-relaxed max-w-md mx-auto">
                  <template v-if="selView.approx"><strong>{{ L('Ubicación aproximada — referencia, no medición.', 'Approximate location — reference, not a measurement.') }}</strong> </template>{{ selViewCaption }}
                </figcaption>
              </figure>

              <!-- IMAGEN CLAVE DEL FOCO (corte CT+PET fusionado con anillo · comité) -->
              <figure class="mb-4">
                <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('Imagen clave del foco', 'Focus key image') }}</span>
                  <span v-if="selKey.dotted || !selKey.hasReliable" class="status-badge" style="background:#fde4cc;color:#8a4a1a">{{ L('localización aproximada · por confirmar', 'approximate location · to confirm') }}</span>
                  <span v-else class="status-badge" style="background:rgba(157,68,171,0.12);color:#7a3d86">{{ L('PET/CT fusionado', 'fused PET/CT') }}</span>
                </div>

                <!-- foco con imagen fiable → miniatura pulsable que abre el lightbox -->
                <template v-if="selKey.hasReliable">
                  <button
                    type="button"
                    class="foco-key-thumb"
                    :aria-label="L('Ampliar la imagen clave del foco #' + sel.id, 'Enlarge the key image of focus #' + sel.id)"
                    @click="openKeyLightbox('axial')">
                    <img
                      :src="fk(sel.id, 'axial')"
                      :alt="L('Imagen clave (axial) del foco #' + sel.id + ' · ' + sel.level.es, 'Key image (axial) of focus #' + sel.id + ' · ' + sel.level.en)"
                      class="foco-key-thumb__img"
                      loading="lazy" />
                    <span class="foco-key-thumb__zoom" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                    </span>
                    <span v-if="selKey.planes.length > 1" class="foco-key-thumb__planes" aria-hidden="true">{{ selKey.planes.map((p) => p.label[lang]).join(' · ') }}</span>
                  </button>
                  <figcaption class="text-[10px] text-tinta text-center mt-1.5 leading-relaxed max-w-md mx-auto">
                    {{ selKeyCaption }}
                  </figcaption>
                </template>

                <!-- foco sin círculo fiable (#19) → NOTA en vez de diana falsa -->
                <div v-else class="rounded-card border-l-4 px-3 py-3 text-[12.5px] leading-snug flex items-start gap-2"
                  style="border-left-color:#8a5a1a;background:#fbf6ec;color:#7a4a12">
                  <span class="status-badge shrink-0" style="background:#fde4cc;color:#8a4a1a">{{ L('por confirmar', 'to confirm') }}</span>
                  <span>{{ L('Foco detectado por IA sobre los DICOM, de baja intensidad: la localización es aproximada y aún no hay un círculo fiable que marcarlo. No es una relectura formal — a correlacionar con Medicina Nuclear.', 'AI-detected focus on the DICOM, low intensity: the location is approximate and there is no reliable ring to mark it yet. Not a formal re-read — to correlate with Nuclear Medicine.') }}</span>
                </div>
              </figure>

              <!-- capa TÉCNICA · abierta por defecto (vista clínica) -->
              <details class="notes-disclosure" open>
                <summary>{{ L('Detalle técnico (para el equipo médico)', 'Technical detail (for the medical team)') }}</summary>
                <p class="mt-3 text-sm text-tinta leading-relaxed">{{ sel.tech[lang] }}</p>
                <div class="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                  <div><span class="text-tinta">DOTATOC SUVmáx</span><br><span class="font-mono text-berenjena">{{ sel.dota != null ? sel.dota.toFixed(2) : L('sin captación', 'no uptake') }}</span></div>
                  <div><span class="text-tinta">FDG SUVmáx</span><br><span class="font-mono text-berenjena">{{ sel.fdg != null ? sel.fdg.toFixed(2) : L('sin captación', 'no uptake') }}</span></div>
                  <div v-if="trend(sel)"><span class="text-tinta">{{ L('Tendencia FDG', 'FDG trend') }}</span><br><span class="font-mono" :style="{ color: trend(sel)!.dir === 'up' || trend(sel)!.dir === 'new' ? '#bb4128' : trend(sel)!.dir === 'down' ? '#1f5a3a' : '#3a3340' }">{{ trend(sel)!.txt }}</span></div>
                  <div v-if="sel.scler"><span class="text-tinta">{{ L('Morfología', 'Morphology') }}</span><br><span class="font-mono text-berenjena">{{ L('blástica / esclerótica', 'blastic / sclerotic') }}</span></div>
                  <div v-if="sel.load"><span class="text-tinta">{{ L('Hueso de carga', 'Weight-bearing') }}</span><br><span class="font-mono" :style="{ color: '#1f5a3a' }">{{ L('sí · revisado (Oncología RT), OK', 'yes · reviewed (Radiation Oncology), OK') }}</span></div>
                </div>
              </details>
            </div>
          </div>
        </section>

        <!-- ===== MAPA DE FENOTIPO (CUADRANTES) ===== -->
        <section class="mb-14" aria-labelledby="fenotipo">
          <p class="eyebrow mb-2 block">{{ L('La misma selección, por tipo', 'The same selection, by type') }}</p>
          <h2 id="fenotipo" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Mapa de fenotipo — la tercera vista enlazada', 'Phenotype map — the third linked view') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Cada lesión situada por sus dos trazadores a la vez: el eje horizontal es el azúcar (FDG) y el vertical el receptor (Galio). Arriba-izquierda = solo receptor; abajo-derecha = solo azúcar; arriba-derecha = mixtas. Toca un punto para abrir su ficha. Las divisiones son orientativas y los SUV son los de los informes.',
              'Each lesion placed by both tracers at once: the horizontal axis is sugar (FDG) and the vertical axis is the receptor (gallium). Top-left = receptor only; bottom-right = sugar only; top-right = mixed. Tap a dot to open its card. The dividers are orientative and the SUVs are those of the reports.') }}
          </p>
          <div class="grid lg:grid-cols-[1fr_240px] gap-6 items-start">
            <div class="card-base !p-3">
              <svg viewBox="0 0 440 340" class="w-full" role="img" :aria-label="L('Diagrama de fenotipo: receptor frente a FDG', 'Phenotype scatter: receptor versus FDG')">
                <!-- tintes de cuadrante -->
                <rect :x="qX(0)" :y="qY(Q.ymax)" :width="qX(Q.divx) - qX(0)" :height="qY(Q.divy) - qY(Q.ymax)" fill="#9d44ab" opacity="0.07" />
                <rect :x="qX(Q.divx)" :y="qY(Q.ymax)" :width="qX(Q.xmax) - qX(Q.divx)" :height="qY(Q.divy) - qY(Q.ymax)" fill="#c9921e" opacity="0.07" />
                <rect :x="qX(Q.divx)" :y="qY(Q.divy)" :width="qX(Q.xmax) - qX(Q.divx)" :height="qY(0) - qY(Q.divy)" fill="#bb4128" opacity="0.08" />
                <rect :x="qX(0)" :y="qY(Q.divy)" :width="qX(Q.divx) - qX(0)" :height="qY(0) - qY(Q.divy)" fill="#6b6470" opacity="0.05" />
                <!-- divisiones orientativas -->
                <line :x1="qX(Q.divx)" :y1="qY(Q.ymax)" :x2="qX(Q.divx)" :y2="qY(0)" stroke="#b7ad9c" stroke-width="0.8" stroke-dasharray="4 3" />
                <line :x1="qX(0)" :y1="qY(Q.divy)" :x2="qX(Q.xmax)" :y2="qY(Q.divy)" stroke="#b7ad9c" stroke-width="0.8" stroke-dasharray="4 3" />
                <!-- ejes -->
                <line :x1="qX(0)" :y1="qY(0)" :x2="qX(Q.xmax)" :y2="qY(0)" stroke="#2d1b3d" stroke-width="1" />
                <line :x1="qX(0)" :y1="qY(Q.ymax)" :x2="qX(0)" :y2="qY(0)" stroke="#2d1b3d" stroke-width="1" />
                <!-- marcas -->
                <g font-family="JetBrains Mono, monospace" font-size="9" fill="#6b6470">
                  <g v-for="tx in qxTicks" :key="'qx' + tx">
                    <line :x1="qX(tx)" :y1="qY(0)" :x2="qX(tx)" :y2="qY(0) + 4" stroke="#2d1b3d" stroke-width="0.8" />
                    <text :x="qX(tx)" :y="qY(0) + 16" text-anchor="middle">{{ tx }}</text>
                  </g>
                  <g v-for="ty in qyTicks" :key="'qy' + ty">
                    <line :x1="qX(0) - 4" :y1="qY(ty)" :x2="qX(0)" :y2="qY(ty)" stroke="#2d1b3d" stroke-width="0.8" />
                    <text :x="qX(0) - 7" :y="qY(ty) + 3" text-anchor="end">{{ ty }}</text>
                  </g>
                </g>
                <!-- etiquetas de cuadrante -->
                <text :x="qX(0) + 8" :y="qY(Q.ymax) + 15" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#9d44ab">{{ L('Solo receptor', 'Receptor only') }}</text>
                <text :x="qX(Q.xmax) - 6" :y="qY(Q.ymax) + 15" text-anchor="end" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#b07d1e">{{ L('Mixto', 'Mixed') }}</text>
                <text :x="qX(Q.xmax) - 6" :y="qY(0) - 9" text-anchor="end" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#bb4128">{{ L('Solo azúcar', 'Sugar only') }}</text>
                <text :x="qX(0) + 8" :y="qY(0) - 9" font-family="Source Sans 3, sans-serif" font-size="9" fill="#8a8088">{{ L('Baja avidez', 'Low avidity') }}</text>
                <!-- títulos de eje -->
                <text :x="(qX(0) + qX(Q.xmax)) / 2" :y="Q.H - 6" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" fill="#2d1b3d">{{ L('FDG SUVmáx · azúcar →', 'FDG SUVmax · sugar →') }}</text>
                <text :transform="`translate(13,${(qY(Q.ymax) + qY(0)) / 2}) rotate(-90)`" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" fill="#2d1b3d">{{ L('⁶⁸Ga SUVmáx · receptor (↑)', '⁶⁸Ga SUVmax · receptor (↑)') }}</text>
                <!-- puntos = lesiones -->
                <g v-for="d in quadDots" :key="'qd' + d.le.id" v-show="visible(d.le)">
                  <!-- parpadeo sutil = mayor avidez de azúcar (FDG alto) -->
                  <circle v-if="isHotFdg(d.le)" :cx="d.px" :cy="d.py" :r="d.r" :fill="phenoColor(d.le)" class="pulse-hot pointer-events-none" />
                  <circle :cx="d.px" :cy="d.py" :r="d.r + 5" :fill="phenoColor(d.le)" opacity="0.16" class="pointer-events-none" />
                  <circle :cx="d.px" :cy="d.py" :r="d.r + (selected === d.le.id ? 2.5 : 0)"
                    :fill="phenoColor(d.le)"
                    :stroke="selected === d.le.id ? '#2d1b3d' : '#ffffff'"
                    :stroke-width="selected === d.le.id ? 2 : 1.2"
                    :stroke-dasharray="sourceOf(d.le) === 'ia-david' ? '2 1.6' : undefined"
                    class="cursor-pointer transition-all" tabindex="0" role="button"
                    :aria-label="`#${d.le.id} ${d.le.level[lang]} — Ga ${d.le.dota ?? '—'} / FDG ${d.le.fdg ?? '—'}`"
                    @click="pick(d.le.id)" @keydown.enter="pick(d.le.id)" @keydown.space.prevent="pick(d.le.id)" />
                  <text :x="d.px" :y="d.py + 3" text-anchor="middle" font-family="Source Sans 3, sans-serif" :font-size="d.le.id > 9 ? 8.5 : 9.5" font-weight="700" fill="#fff" class="pointer-events-none select-none">{{ d.le.id }}</text>
                </g>
              </svg>
            </div>
            <!-- LEYENDA · qué significa cada cosa del marcador (petición de la
                 paciente). Pensada para que un radiólogo y un lego lean cada
                 símbolo: qué es el tamaño, el color/relleno, el halo, el
                 contorno punteado, el anillo de selección, el parpadeo y los
                 cuadrantes. Etiquetado por trazador/forma, nunca biología. -->
            <aside class="text-sm" aria-labelledby="scatter-legend-title">
              <p id="scatter-legend-title" class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2">{{ L('Qué significa cada círculo', 'What each circle means') }}</p>

              <!-- 1 · LOS SÍMBOLOS del marcador -->
              <ul class="space-y-2.5 text-tinta leading-snug">
                <!-- tamaño ∝ SUVmáx -->
                <li class="flex items-start gap-2.5">
                  <svg width="34" height="22" viewBox="0 0 34 22" class="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="8" cy="11" r="4" :fill="PHENO.mixAgg.c" /><circle cx="25" cy="11" r="9" :fill="PHENO.mixAgg.c" />
                  </svg>
                  <span><strong class="text-berenjena">{{ L('Tamaño', 'Size') }}</strong> {{ L('— a mayor círculo, mayor SUVmáx (más avidez del trazador dominante).', '— the larger the circle, the higher the SUVmax (more avidity of the dominant tracer).') }}</span>
                </li>
                <!-- color/relleno -->
                <li class="flex items-start gap-2.5">
                  <svg width="34" height="22" viewBox="0 0 34 22" class="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="8" cy="11" r="6" :fill="PHENO.ne.c" /><circle cx="25" cy="11" r="6" :fill="PHENO.agg.c" />
                  </svg>
                  <span><strong class="text-berenjena">{{ L('Color / relleno', 'Colour / fill') }}</strong> {{ L('— el del trazador dominante: violeta = receptor (Galio); naranja-coral = azúcar (FDG). Los tonos intermedios = mixto.', '— that of the dominant tracer: violet = receptor (gallium); orange-coral = sugar (FDG). Intermediate tones = mixed.') }}</span>
                </li>
                <!-- halo / aura -->
                <li class="flex items-start gap-2.5">
                  <svg width="34" height="22" viewBox="0 0 34 22" class="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="17" cy="11" r="10" :fill="PHENO.mixNe.c" opacity="0.16" /><circle cx="17" cy="11" r="6" :fill="PHENO.mixNe.c" />
                  </svg>
                  <span><strong class="text-berenjena">{{ L('Halo (aura)', 'Halo (aura)') }}</strong> {{ L('— un brillo suave alrededor en el mismo color; ayuda a localizar el foco, no añade dato.', '— a soft glow around it in the same colour; it helps spot the focus, it adds no data.') }}</span>
                </li>
                <!-- contorno punteado = IA por confirmar -->
                <li class="flex items-start gap-2.5">
                  <svg width="34" height="22" viewBox="0 0 34 22" class="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="17" cy="11" r="6.5" fill="#8a4a1a" fill-opacity="0.18" stroke="#8a4a1a" stroke-width="1.4" stroke-dasharray="2 1.6" />
                  </svg>
                  <span><strong class="text-berenjena">{{ L('Contorno punteado', 'Dashed outline') }}</strong> {{ L('= foco detectado por IA, por confirmar (no consta en el informe). Focos #17, #18 y #19.', '= AI-detected focus, to confirm (not in the report). Foci #17, #18 and #19.') }}</span>
                </li>
                <!-- anillo grueso/oscuro = seleccionado -->
                <li class="flex items-start gap-2.5">
                  <svg width="34" height="22" viewBox="0 0 34 22" class="shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="17" cy="11" r="7" :fill="PHENO.mixBal.c" stroke="#2d1b3d" stroke-width="2" />
                  </svg>
                  <span><strong class="text-berenjena">{{ L('Anillo grueso oscuro', 'Thick dark ring') }}</strong> {{ L('= el foco seleccionado ahora (el de la ficha). Toca otro círculo para cambiarlo.', '= the focus selected now (the one in the card). Tap another circle to change it.') }}</span>
                </li>
                <!-- parpadeo = FDG alto -->
                <li class="flex items-start gap-2.5">
                  <span class="legend-pulse-dot shrink-0 mt-1 ml-3" aria-hidden="true" />
                  <span><strong class="text-berenjena">{{ L('Parpadeo', 'Blink') }}</strong> {{ L('= mayor avidez de azúcar (FDG SUVmáx ≥ ' + HOT_FDG + '). Es descriptivo, no una conclusión.', '= most sugar-avid (FDG SUVmax ≥ ' + HOT_FDG + '). It is descriptive, not a conclusion.') }}</span>
                </li>
              </ul>

              <!-- 2 · LOS CUADRANTES (posición en los ejes) -->
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mt-4 mb-2 pt-3 border-t border-[rgba(45,27,61,0.1)]">{{ L('Y los cuadrantes (la posición)', 'And the quadrants (the position)') }}</p>
              <ul class="space-y-1.5 text-[12.5px] text-tinta leading-snug">
                <li class="flex items-start gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1" :style="{ background: '#9d44ab' }" /><span><strong class="text-berenjena">{{ L('Arriba-izquierda · Solo receptor', 'Top-left · Receptor only') }}</strong> — {{ L('capta receptor (Galio) y poco o ningún azúcar.', 'receptor-avid (gallium), little or no sugar.') }}</span></li>
                <li class="flex items-start gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1" :style="{ background: '#df7a44' }" /><span><strong class="text-berenjena">{{ L('Arriba-derecha · Mixto', 'Top-right · Mixed') }}</strong> — {{ L('capta los dos trazadores a la vez (receptor y azúcar).', 'takes up both tracers at once (receptor and sugar).') }}</span></li>
                <li class="flex items-start gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1" :style="{ background: '#bb4128' }" /><span><strong class="text-berenjena">{{ L('Abajo-derecha · Solo azúcar', 'Bottom-right · Sugar only') }}</strong> — {{ L('mucho azúcar (FDG) y poco o ningún receptor.', 'lots of sugar (FDG), little or no receptor.') }}</span></li>
                <li class="flex items-start gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1" :style="{ background: '#6b6470' }" /><span><strong class="text-berenjena">{{ L('Abajo-izquierda · Baja avidez', 'Bottom-left · Low avidity') }}</strong> — {{ L('poca captación de los dos trazadores.', 'low uptake of both tracers.') }}</span></li>
              </ul>
              <p class="text-[10.5px] text-tinta leading-relaxed mt-3">{{ L('El eje horizontal es el azúcar (FDG) y el vertical el receptor (Galio); ambos SUVmáx de los informes. Las divisiones son orientativas. Etiquetado por trazador y forma, no por biología; describe, no concluye.', 'The horizontal axis is sugar (FDG) and the vertical the receptor (gallium); both SUVmax from the reports. The dividers are orientative. Labelled by tracer and shape, not by biology; it describes, it does not conclude.') }}</p>
            </aside>
          </div>
        </section>

        <!-- ===== ZONA C · IMAGEN REAL (pestañas) ===== -->
        <section class="mb-14" aria-labelledby="imagen">
          <p class="eyebrow mb-2 block">{{ L('La imagen real', 'The real imaging') }}</p>
          <h2 id="imagen" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('La imagen real, reconstruida de los DICOM', 'The real imaging, reconstructed from the DICOM') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Tres vistas de los estudios, todas reconstruidas a partir de los DICOM: el cuerpo entero (MIP), la columna en el PET y la columna en resonancia (RMN). Cambia de pestaña para compararlas.',
                  'Three views of the studies, all reconstructed from the DICOM: the whole body (MIP), the spine on PET and the spine on MRI. Switch tabs to compare them.') }}
          </p>

          <!-- pestañas -->
          <div class="flex flex-wrap gap-2 mb-5" role="tablist" :aria-label="L('Vistas de imagen', 'Imaging views')">
            <button type="button" role="tab" :aria-selected="imgTab === 'mip'" @click="imgTab = 'mip'"
              class="text-sm px-4 py-1.5 rounded-full border transition-colors"
              :class="imgTab === 'mip' ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.2)] hover:border-[rgba(45,27,61,0.4)]'">
              {{ L('Cuerpo entero (MIP)', 'Whole body (MIP)') }}
            </button>
            <button type="button" role="tab" :aria-selected="imgTab === 'pet'" @click="imgTab = 'pet'"
              class="text-sm px-4 py-1.5 rounded-full border transition-colors"
              :class="imgTab === 'pet' ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.2)] hover:border-[rgba(45,27,61,0.4)]'">
              {{ L('Columna en PET', 'Spine on PET') }}
            </button>
            <button type="button" role="tab" :aria-selected="imgTab === 'rmn'" @click="imgTab = 'rmn'"
              class="text-sm px-4 py-1.5 rounded-full border transition-colors"
              :class="imgTab === 'rmn' ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.2)] hover:border-[rgba(45,27,61,0.4)]'">
              {{ L('Columna en RMN', 'Spine on MRI') }}
            </button>
          </div>

          <!-- panel · MIP cuerpo entero -->
          <div v-show="imgTab === 'mip'" role="tabpanel">
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Proyección de máxima intensidad (todo el cuerpo de un vistazo). Lo intenso fuera del esqueleto es captación normal de cada trazador (cerebro y corazón en FDG; riñones, bazo e hígado en Galio); las metástasis son los focos del esqueleto.',
                    'Maximum-intensity projection (the whole body at a glance). The intense areas outside the skeleton are normal uptake of each tracer (brain and heart on FDG; kidneys, spleen and liver on gallium); the metastases are the skeletal foci.') }}
            </p>
            <!-- botón «ver las 4 PET a la vez» (MIP + sagital, los dos trazadores) -->
            <button type="button" class="pet-grid-cta" @click="openPetGrid()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              {{ L('Ver las 4 PET a la vez', 'View all 4 PET at once') }}
            </button>
            <div class="grid grid-cols-2 gap-4 max-w-2xl mt-3">
              <figure class="card-base !p-3 flex flex-col">
                <div class="pet-fig">
                  <ClientOnly>
                    <ImageZoomViewer src="/metastasis/gal_mip_hot.jpg" :alt="L('MIP Galio-68 DOTATOC', 'Ga-68 DOTATOC MIP')" max-width="100%" />
                    <template #fallback><img src="/metastasis/gal_mip_hot.jpg" :alt="L('MIP Galio-68 DOTATOC', 'Ga-68 DOTATOC MIP')" class="w-full object-contain rounded-lg bg-black" loading="lazy" /></template>
                  </ClientOnly>
                  <button type="button" class="pet-fig__open" :aria-label="L('Ampliar el MIP de Galio en un popup grande', 'Enlarge the gallium MIP in a large popup')" @click="openPetLightbox('/metastasis/gal_mip_hot.jpg')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg> {{ L('ampliar', 'enlarge') }}
                  </button>
                </div>
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('receptor', 'receptor') }}</figcaption>
              </figure>
              <figure class="card-base !p-3 flex flex-col">
                <div class="pet-fig">
                  <ClientOnly>
                    <ImageZoomViewer src="/metastasis/fdg_mip_hot.jpg" :alt="L('MIP FDG', 'FDG MIP')" max-width="100%" />
                    <template #fallback><img src="/metastasis/fdg_mip_hot.jpg" :alt="L('MIP FDG', 'FDG MIP')" class="w-full object-contain rounded-lg bg-black" loading="lazy" /></template>
                  </ClientOnly>
                  <button type="button" class="pet-fig__open" :aria-label="L('Ampliar el MIP de FDG en un popup grande', 'Enlarge the FDG MIP in a large popup')" @click="openPetLightbox('/metastasis/fdg_mip_hot.jpg')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg> {{ L('ampliar', 'enlarge') }}
                  </button>
                </div>
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</figcaption>
              </figure>
            </div>
            <p class="text-[11px] text-tinta mt-3 max-w-2xl">{{ L('Rueda o pinza para acercar, arrastra para mover, doble clic para restablecer. Pulsa «ampliar» para abrirla en grande, o «ver las 4 PET a la vez» para compararlas.', 'Wheel or pinch to zoom, drag to pan, double-click to reset. Press “enlarge” to open it large, or “view all 4 PET at once” to compare them.') }}</p>
          </div>

          <!-- panel · columna sagital en PET -->
          <div v-show="imgTab === 'pet'" role="tabpanel">
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Corte sagital (perfil) con el TC en gris y el PET superpuesto en color. A la izquierda, el receptor (Galio); a la derecha, el azúcar (FDG). Compara qué vértebras encienden con cada trazador.',
                    'Sagittal (side) slice with CT in grey and PET overlaid in colour. Left, the receptor (gallium); right, the sugar (FDG). Compare which vertebrae light up with each tracer.') }}
            </p>
            <!-- botón «ver las 4 PET a la vez» (MIP + sagital, los dos trazadores) -->
            <button type="button" class="pet-grid-cta" @click="openPetGrid()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              {{ L('Ver las 4 PET a la vez', 'View all 4 PET at once') }}
            </button>
            <div class="grid grid-cols-2 gap-4 max-w-xl mt-3">
              <figure class="card-base !p-3 flex flex-col">
                <div class="pet-fig">
                  <ClientOnly>
                    <ImageZoomViewer src="/metastasis/gal_spine.jpg" :alt="L('Fusión sagital Galio', 'Gallium sagittal fusion')" max-width="100%" />
                    <template #fallback><img src="/metastasis/gal_spine.jpg" :alt="L('Fusión sagital Galio', 'Gallium sagittal fusion')" class="w-full object-contain rounded-lg bg-black" loading="lazy" /></template>
                  </ClientOnly>
                  <button type="button" class="pet-fig__open" :aria-label="L('Ampliar la columna sagital de Galio en un popup grande', 'Enlarge the gallium sagittal spine in a large popup')" @click="openPetLightbox('/metastasis/gal_spine.jpg')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg> {{ L('ampliar', 'enlarge') }}
                  </button>
                </div>
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC</figcaption>
              </figure>
              <figure class="card-base !p-3 flex flex-col">
                <div class="pet-fig">
                  <ClientOnly>
                    <ImageZoomViewer src="/metastasis/fdg_spine.jpg" :alt="L('Fusión sagital FDG', 'FDG sagittal fusion')" max-width="100%" />
                    <template #fallback><img src="/metastasis/fdg_spine.jpg" :alt="L('Fusión sagital FDG', 'FDG sagittal fusion')" class="w-full object-contain rounded-lg bg-black" loading="lazy" /></template>
                  </ClientOnly>
                  <button type="button" class="pet-fig__open" :aria-label="L('Ampliar la columna sagital de FDG en un popup grande', 'Enlarge the FDG sagittal spine in a large popup')" @click="openPetLightbox('/metastasis/fdg_spine.jpg')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg> {{ L('ampliar', 'enlarge') }}
                  </button>
                </div>
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG</figcaption>
              </figure>
            </div>
            <p class="text-[11px] text-tinta mt-3 max-w-xl">{{ L('Rueda o pinza para acercar, arrastra para mover, doble clic para restablecer. Pulsa «ampliar» para abrirla en grande, o «ver las 4 PET a la vez» para compararlas.', 'Wheel or pinch to zoom, drag to pan, double-click to reset. Press “enlarge” to open it large, or “view all 4 PET at once” to compare them.') }}</p>
          </div>

          <!-- panel · columna en RMN -->
          <div v-show="imgTab === 'rmn'" role="tabpanel">
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Imágenes reales de la resonancia de columna (cervical y dorsal). La RMN ve el hueso y la médula ósea con mucho más detalle que el CT de baja dosis del PET. Cambia de región y de secuencia, y desliza para recorrer los cortes.',
                    'Real images from the spine MRI (cervical and thoracic). MRI shows bone and bone marrow in far more detail than the low-dose CT of the PET. Switch region and sequence, and slide to scroll through the slices.') }}
            </p>
            <div class="card-base">
              <ClientOnly>
                <SpineMRIViewer />
              </ClientOnly>
            </div>

            <!-- hallazgos del informe de RM (citados, descriptivos) -->
            <div class="card-base mt-4">
              <p class="eyebrow mb-2 block">{{ L('Lectura del informe · citada', 'Report findings · cited') }}</p>
              <h3 class="heading-display text-lg text-berenjena mb-2">{{ L('Lo que dice la RM de columna (11/06/2026)', 'What the spine MRI says (11 Jun 2026)') }}</h3>
              <p class="text-sm text-tinta leading-relaxed mb-4">
                {{ L('Texto transcrito del informe de RM, recogido en el documento de apoyo (12/06/2026). Es el texto del informe, no una relectura de la imagen por esta herramienta.',
                      'Text transcribed from the MRI report, captured in the supportive document (12 Jun 2026). It is the report’s text, not a re-reading of the image by this tool.') }}
              </p>
              <p class="text-[12px] font-semibold text-berenjena mb-1.5">{{ L('Niveles con metástasis (multinivel):', 'Levels with metastasis (multilevel):') }}</p>
              <div class="flex flex-wrap gap-1.5 mb-4">
                <span v-for="lv in MRI_LEVELS" :key="lv" class="pill-data pill-data--violet">{{ lv }}</span>
              </div>
              <ul class="space-y-1.5 text-[13px] text-tinta leading-snug">
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#bb4128' }" /><span><strong class="text-berenjena">D11</strong> — {{ L('extensión al espacio epidural anterior y compromiso del canal lateral izquierdo.', 'anterior epidural extension and left lateral canal compromise.') }}</span></li>
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#c9921e' }" /><span>{{ L('Fracturas patológicas crónicas (desde 2024) de L1 y L3.', 'Chronic pathological fractures (since 2024) of L1 and L3.') }}</span></li>
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#1f5a3a' }" /><span>{{ L('Médula espinal de señal normal.', 'Spinal cord with normal signal.') }}</span></li>
              </ul>
              <!-- la RMN, conectada a la FACTIBILIDAD de la biopsia (descriptivo, no concluye) -->
              <div class="mt-3 rounded-card border-l-4 px-3 py-2.5" :style="{ borderLeftColor: '#1f6b57', background: '#eef6f2' }">
                <p class="text-[12.5px] text-tinta leading-snug">
                  <strong :style="{ color: '#1f6b57' }">{{ L('La RMN y la factibilidad de la biopsia:', 'MRI and biopsy feasibility:') }}</strong>
                  {{ L('la forma (blástico denso = rinde poco; lítico / partes blandas = rinde más) y el componente de partes blandas que describe la RMN son señales de RENDIMIENTO tisular. El componente epidural de D11 es una diana de tejido blando accesible (su vecindad al canal y a las raíces la valora intervencionista). Es FORMA/extensión del informe; alimenta los avisos de factibilidad de la lente, no la biología.',
                        'shape (dense blastic = low yield; lytic / soft tissue = higher yield) and the soft-tissue component the MRI describes are tissue-YIELD signals. The D11 epidural component is an accessible soft-tissue target (its proximity to the canal and roots is assessed by interventional radiology). It is SHAPE/extent from the report; it feeds the lens’s feasibility flags, not the biology.') }}
                  <button type="button" @click="pick(7); $event.currentTarget.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })" class="link-action text-miriam inline-flex items-center gap-1">{{ L('ver el foco D11 (#7)', 'see the D11 focus (#7)') }} <span aria-hidden="true">→</span></button>
                </p>
              </div>
            </div>

            <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
              {{ L('Las imágenes de la RMN se muestran para verlas; los hallazgos de arriba están transcritos del informe de RM (11/06/2026) y no son una relectura de la imagen por esta herramienta. Su lectura formal corresponde al radiólogo. Los SUV del resto de la página vienen de los informes del PET.',
                    'The MRI images are shown for viewing; the findings above are transcribed from the MRI report (11 Jun 2026) and are not a re-reading of the image by this tool. Its formal reading belongs to the radiologist. The SUVs in the rest of the page come from the PET reports.') }}
            </div>
          </div>

          <!-- ===== GALERÍA "contact-sheet" · TODAS las key-images por foco ===== -->
          <!-- Petición de la paciente: las imágenes construidas con DICOM, todas en
               fila/cuadrícula y poder abrirlas en grande. Reutiliza el MISMO lightbox
               (openKeyLightboxFor → selecciona el foco + abre el modal con zoom/planos). -->
          <div class="mt-10 pt-8 border-t border-[rgba(45,27,61,0.1)]">
            <p class="eyebrow mb-2 block">{{ L('Una por foco · todas en fila', 'One per focus · all in a row') }}</p>
            <h3 class="heading-display text-xl text-berenjena mb-2">
              {{ L('Imágenes clave por foco · PET/CT', 'Key images per focus · PET/CT') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Cada foco confirmado, con su corte axial PET/CT y el anillo del SUVmáx. Pulsa cualquiera para abrirla en grande (zoom, arrastre y los planos que tenga: sagital o coronal). Los focos detectados por IA van al final, por confirmar.',
                    'Each confirmed focus, with its axial PET/CT slice and the SUVmax ring. Tap any to open it large (zoom, drag and the planes it has: sagittal or coronal). AI-detected foci are at the end, to confirm.') }}
            </p>

            <ul class="foco-key-grid" role="list">
              <li v-for="le in keyGallery" :key="'gal-' + le.id" class="foco-key-cell">
                <!-- foco con imagen fiable → miniatura pulsable que abre el lightbox grande -->
                <template v-if="focoKey(le).hasReliable">
                  <button
                    type="button"
                    class="foco-key-tile"
                    :class="{ 'is-ai': focoKey(le).ai }"
                    :aria-label="L('Ampliar la imagen clave del foco #' + le.id + ' · ' + le.level.es, 'Enlarge the key image of focus #' + le.id + ' · ' + le.level.en)"
                    @click="openKeyLightboxFor(le.id, 'axial')">
                    <span class="foco-key-tile__frame">
                      <img
                        :src="fk(le.id, 'axial')"
                        :alt="L('Imagen clave (axial) del foco #' + le.id + ' · ' + le.level.es, 'Key image (axial) of focus #' + le.id + ' · ' + le.level.en)"
                        class="foco-key-tile__img"
                        loading="lazy" />
                      <span class="foco-key-tile__zoom" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                      </span>
                      <span v-if="keyExtraPlanes(le).length" class="foco-key-tile__planes" aria-hidden="true">{{ keyExtraPlanes(le).join(' ') }}</span>
                      <span v-if="focoKey(le).dotted || focoKey(le).ai" class="foco-key-tile__flag">{{ L('IA · aprox.', 'AI · approx.') }}</span>
                    </span>
                    <span class="foco-key-tile__meta">
                      <span class="foco-key-tile__id">#{{ le.id }}</span>
                      <span class="foco-key-tile__loc">{{ le.level[lang] }}</span>
                      <span class="foco-key-tile__suv" :style="{ color: keyTracerColor(le) }">{{ keyTracerLabel(le) }}</span>
                      <span v-if="focoKey(le).ai" class="foco-key-tile__confirm">{{ L('detectado por IA · aproximado · por confirmar', 'AI-detected · approximate · to confirm') }}</span>
                    </span>
                  </button>
                  <!-- DESCARGA · la PNG del foco (axial). Va FUERA del botón (no se
                       puede anidar un <a> en un <button>) y se superpone en la esquina. -->
                  <a
                    class="foco-key-dl"
                    :href="fk(le.id, 'axial')"
                    :download="keyDownloadName(fk(le.id, 'axial'))"
                    :aria-label="L('Descargar la imagen clave del foco #' + le.id + ' (PNG)', 'Download the key image of focus #' + le.id + ' (PNG)')"
                    @click.stop>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  </a>
                </template>

                <!-- foco SIN círculo fiable (#19) → celda-nota, sin lightbox -->
                <div v-else class="foco-key-tile foco-key-tile--note is-ai">
                  <span class="foco-key-tile__noteframe">
                    <span class="status-badge" style="background:#fde4cc;color:#8a4a1a">{{ L('por confirmar', 'to confirm') }}</span>
                  </span>
                  <span class="foco-key-tile__meta">
                    <span class="foco-key-tile__id">#{{ le.id }}</span>
                    <span class="foco-key-tile__loc">{{ le.level[lang] }}</span>
                    <span class="foco-key-tile__suv" :style="{ color: keyTracerColor(le) }">{{ keyTracerLabel(le) }}</span>
                    <span class="foco-key-tile__confirm">{{ L('detectado por IA · sin círculo fiable · por confirmar', 'AI-detected · no reliable ring · to confirm') }}</span>
                  </span>
                </div>
              </li>
            </ul>

            <p class="text-[11px] text-tinta mt-3 leading-relaxed max-w-3xl">
              {{ L('Imágenes reconstruidas del PET/CT; el anillo marca el SUVmáx (un vóxel), aproximado por resolución/co-registro; no sustituye la lectura formal.',
                    'Images reconstructed from the PET/CT; the ring marks the SUVmax (a single voxel), approximate due to resolution/co-registration; it does not replace the formal reading.') }}
            </p>
          </div>
        </section>

        <!-- ===== ZONA D · TRAYECTORIA ===== -->
        <section class="mb-14" aria-labelledby="trayectoria">
          <p class="eyebrow mb-2 block">{{ L('Qué ha cambiado', 'What has changed') }}</p>
          <h2 id="trayectoria" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Trayectoria desde el estudio previo', 'Trajectory since the prior study') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Comparación del azúcar (FDG) entre el estudio previo (ene 2026) y el actual (mar 2026), sobre los ' + trajectory.withPrev + ' focos con valor previo. El receptor (Galio) es del estudio de mayo 2026, sin previo con el que comparar.',
              'Sugar (FDG) comparison between the prior study (Jan 2026) and the current one (Mar 2026), over the ' + trajectory.withPrev + ' foci with a prior value. The receptor (gallium) is from the May 2026 study, with no prior to compare.') }}
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('FDG en aumento', 'FDG rising') }}</div>
              <div class="stat-readout__value" :style="{ color: '#bb4128' }">{{ trajectory.up + trajectory.neu }}</div>
              <div class="stat-readout__unit">{{ L('incluye focos nuevos', 'includes new foci') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('FDG en descenso', 'FDG decreasing') }}</div>
              <div class="stat-readout__value" :style="{ color: '#1f5a3a' }">{{ trajectory.down }}</div>
              <div class="stat-readout__unit">{{ L('menos FDG que el previo', 'less FDG than prior') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Estable', 'Stable') }}</div>
              <div class="stat-readout__value">{{ trajectory.stable }}</div>
              <div class="stat-readout__unit">{{ L('sin cambio relevante', 'no relevant change') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Focos nuevos', 'New foci') }}</div>
              <div class="stat-readout__value" :style="{ color: '#bb4128' }">{{ trajectory.neu }}</div>
              <div class="stat-readout__unit">{{ L('encienden ahora', 'lighting up now') }}</div>
            </div>
          </div>
          <div v-if="loadBearingFdgFoci.length" class="rounded-card border border-[rgba(45,27,61,0.1)] bg-[rgba(45,27,61,0.04)] text-[#3a3340] px-4 py-3.5 text-sm leading-relaxed">
            <div class="font-semibold text-berenjena mb-1.5 flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full" :style="{ background: '#6b6470' }" aria-hidden="true" />
              {{ L('Focos en hueso de carga con FDG igual o mayor que el previo (descriptivo)', 'Weight-bearing foci with FDG equal to or above the prior study (descriptive)') }}
            </div>
            {{ L(
              'Focos en hueso de carga cuyo FDG iguala o supera el del estudio previo: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.es).join(' · ') + '. Oncología Radioterápica ya los revisó. Descripción de los datos, no consejo médico.',
              'Foci in weight-bearing bone whose FDG matches or exceeds the prior study: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.en).join(' · ') + '. Radiation Oncology has already reviewed them. Description of the data, not medical advice.') }}
          </div>
        </section>

        <!-- ===== LENTE · IDONEIDAD COMO DIANA (pieza central del panel) ===== -->
        <section class="mb-14" aria-labelledby="idoneidad">
          <p class="eyebrow mb-2 block">{{ L('La lente · elegir dónde rebiopsiar', 'The lens · choosing where to rebiopsy') }}</p>
          <h2 id="idoneidad" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Idoneidad como diana de biopsia', 'Suitability as a biopsy target') }}
          </h2>

          <!-- TARJETA-LENTE · marco ético (equipa, no indica) -->
          <div class="rounded-card border-l-4 px-4 py-4 mb-6" :style="{ borderLeftColor: '#9d44ab', background: '#f7eef9' }">
            <p class="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: '#7a2f86' }">
              <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#9d44ab' }" />
              {{ L('Cómo leer esta lente', 'How to read this lens') }}
              <span class="status-badge" :style="{ background: '#e8d4ed', color: '#5a2466' }">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
            </p>
            <p class="text-[14px] text-berenjena leading-relaxed">
              {{ L(
                'Esta vista ordena los focos por las señales que importan para elegir dónde rebiopsiar — tumor viable (FDG/Galio) y rendimiento tisular esperado (lítico/partes blandas rinde; blástico denso rinde poco). EQUIPA la decisión del equipo médico; NO indica dónde biopsiar ni concluye tratamiento o pronóstico. La accesibilidad y seguridad las valora radiología intervencionista.',
                'This view orders the foci by the signals that matter for choosing where to rebiopsy — viable tumour (FDG/gallium) and expected tissue yield (lytic/soft tissue yields; dense blastic yields little). It EQUIPS the medical team’s decision; it does NOT indicate where to biopsy nor conclude treatment or prognosis. Accessibility and safety are assessed by interventional radiology.') }}
            </p>
          </div>

          <!-- DE UN VISTAZO · los 3 candidatos mejor situados por las señales de imagen.
               Comparación rápida para el radiólogo (orden orientativo, no una orden). -->
          <div class="mb-6">
            <div class="flex items-baseline justify-between flex-wrap gap-2 mb-2">
              <h3 class="heading-display text-lg text-berenjena">{{ L('De un vistazo · mejor situados por imagen', 'At a glance · best placed by imaging') }}</h3>
              <span class="text-[11px] text-tinta">{{ L('orden orientativo · toca para abrir la ficha', 'indicative order · tap to open the card') }}</span>
            </div>
            <div class="grid sm:grid-cols-3 gap-3">
              <button v-for="(le, i) in topCandidates" :key="le.id" type="button"
                @click="pick(le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                class="text-left rounded-card border-2 px-3.5 py-3 transition-colors"
                :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.14)] bg-cream-card hover:border-[#9d44ab]'">
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-2 min-w-0">
                    <span class="inline-flex w-6 h-6 shrink-0 rounded-full items-center justify-center text-white text-[11px] font-semibold" :style="{ background: phenoColor(le) }">{{ le.id }}</span>
                    <span class="font-semibold text-berenjena text-[13px] leading-tight truncate">{{ le.level[lang] }}</span>
                  </span>
                  <span class="text-right shrink-0">
                    <span class="font-display text-xl text-berenjena tabular-nums leading-none block">{{ suitabilityScore(le) }}</span>
                    <span class="text-[8.5px] text-tinta uppercase tracking-wide">{{ L('idoneidad', 'suitability') }}</span>
                  </span>
                </div>
                <p class="text-[10.5px] text-tinta leading-snug mt-1.5">{{ L('orden', 'rank') }} {{ i + 1 }} · FDG {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · Ga {{ le.dota != null ? le.dota.toFixed(1) : '—' }} · {{ morphShort(le) }}</p>
                <div v-if="hasSoftTissue(le) || le.priorBiopsy" class="mt-2 flex flex-wrap gap-1">
                  <span v-if="hasSoftTissue(le)" class="pill-data !px-1.5 !py-0 !text-[9.5px]" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas (RMN)', '+ soft tissue (MRI)') }}</span>
                  <span v-if="le.priorBiopsy" class="pill-data !px-1.5 !py-0 !text-[9.5px]" :style="{ background: '#f0e2c8', color: '#8a5a1a' }">{{ L('⚑ 26B585 falló', '⚑ 26B585 failed') }}</span>
                </div>
              </button>
            </div>
            <p class="text-[11px] text-tinta leading-snug mt-2 max-w-3xl">{{ L('Un resumen para comparar de un vistazo; el orden completo y los factores están abajo. No es una orden de qué biopsiar — equipa, no indica.', 'A summary to compare at a glance; the full order and the factors are below. Not an instruction on what to biopsy — it equips, it does not indicate.') }}</p>
          </div>

          <!-- LOS FACTORES que componen la idoneidad (explícitos, etiquetados por trazador/forma) -->
          <p class="text-sm text-tinta leading-relaxed mb-3 max-w-3xl">
            {{ L('La idoneidad no es una caja negra: es el producto de tres factores visibles, más tres avisos de FACTIBILIDAD que el equipo pondera (no van en el número).',
                  'Suitability is not a black box: it is the product of three visible factors, plus three FEASIBILITY flags the team weighs (they are not in the number).') }}
          </p>
          <!-- GRUPO A · los 3 factores que MULTIPLICAN el número → grid de 3 col (llena exacto). -->
          <div class="grid sm:grid-cols-3 gap-3 mb-3">
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#bb4128' }">{{ L('1 · Tumor viable', '1 · Viable tumour') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('FDG SUVmáx: cuanto más alto, más tumor metabólicamente activo que muestrear. El Galio confirma tumor / receptor (teranóstico).', 'FDG SUVmax: the higher, the more metabolically active tumour to sample. Gallium confirms tumour / receptor (theranostic).') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#1f6b57' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#1f6b57' }">{{ L('2 · Rendimiento esperado', '2 · Expected yield') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Forma del hueso: lítico / partes blandas suele rendir más tejido; blástico denso rinde poco (como falló la biopsia ilíaca 26B585). Es FORMA, no biología.', 'Bone shape: lytic / soft tissue usually yields more tissue; dense blastic yields little (as the 26B585 iliac biopsy failed). It is SHAPE, not biology.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#6b6470' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#3a3340' }">{{ L('3 · Tamaño / cantidad', '3 · Size / amount') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Eje mayor de la lesión (más grande = más fácil y más tejido) y, donde se midió, el MTV (volumen tumoral metabólico).', 'Lesion major axis (larger = easier and more tissue) and, where measured, the MTV (metabolic tumour volume).') }}</p>
            </div>
          </div>
          <!-- GRUPO B · 3 avisos de factibilidad + «La fórmula» = 4 tarjetas → grid que LLENA parejo
               a cada ancho (2 col en sm, 4 col en xl), sin tarjeta huérfana ni hueco a la derecha.
               «La fórmula» deja de quedar aislada al final: cierra la fila de cuatro a lo ancho del
               modo wiki. En móvil apila en 1 col. -->
          <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#8a5a1a' }">
              <p class="text-[12px] font-semibold mb-1 flex items-center gap-1.5 flex-wrap" :style="{ color: '#8a5a1a' }">{{ L('Aviso · antecedente 26B585', 'Flag · prior history 26B585') }}<span class="status-badge" :style="{ background: '#f0e2c8', color: '#8a5a1a' }">{{ L('lección', 'lesson') }}</span></p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('La biopsia previa 26B585 (ilíaco derecho, #13) FALLÓ: solo dio hueso y músculo, sin tumor evaluable. La lección: ese foco era blástico denso, que rinde poco — por eso el rendimiento (forma) pesa en la lente y conviene priorizar focos con tejido lítico / partes blandas. Se muestra como aviso; no entra en el número.', 'The prior 26B585 biopsy (right iliac, #13) FAILED: only bone and muscle, no evaluable tumour. The lesson: that focus was dense blastic, which yields little — that is why yield (shape) weighs in the lens and lytic / soft-tissue targets are worth prioritising. Shown as a flag; not part of the number.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#1f6b57' }">
              <p class="text-[12px] font-semibold mb-1 flex items-center gap-1.5 flex-wrap" :style="{ color: '#1f6b57' }">{{ L('Aviso · partes blandas (RMN)', 'Flag · soft tissue (MRI)') }}<span class="status-badge" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('factibilidad', 'feasibility') }}</span></p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Donde la RMN describe componente de partes blandas / extensión extraósea (p.ej. epidural de D11, #7), hay una diana de tejido blando que suele rentabilizar más que el hueso blástico denso. La RMN conecta así con la FACTIBILIDAD. Es FORMA/extensión del informe, no biología; la cercanía al canal/raíces la valora intervencionista. No entra en el número.', 'Where the MRI describes a soft-tissue / extraosseous component (e.g. D11 epidural, #7), there is a soft-tissue target that usually yields more than dense blastic bone. This is how the MRI connects to FEASIBILITY. It is SHAPE/extent from the report, not biology; proximity to the canal/roots is assessed by interventional radiology. Not part of the number.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#6b6470' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#3a3340' }">{{ L('Aviso · accesibilidad', 'Flag · accessibility') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('La accesibilidad y la seguridad no las tenemos como dato fiable: las valora radiología intervencionista. No se inventan ni se puntúan.', 'Accessibility and safety are not available to us as a reliable datum: interventional radiology assesses them. They are neither invented nor scored.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#9d44ab' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#7a2f86' }">{{ L('La fórmula', 'The formula') }}</p>
              <p class="text-[12px] text-tinta leading-snug font-mono">idoneidad = 100 · viable · rendimiento · tamaño</p>
              <p class="text-[11px] text-tinta leading-snug mt-1">{{ L('viable = 0.78·(FDG/10) + 0.22·(Ga/14) · rendimiento = lítico 1 / mixto 0.6 / blástico 0.3 · tamaño = 0.6–1 por el eje mayor de la extensión metabólica medida. Orientativa.', 'viable = 0.78·(FDG/10) + 0.22·(Ga/14) · yield = lytic 1 / mixed 0.6 / blastic 0.3 · size = 0.6–1 by the major axis of the measured metabolic extent. Indicative.') }}</p>
              <p class="text-[10.5px] text-tinta leading-snug mt-1">{{ L('Extensión metabólica = lo que cada foco capta por encima del umbral (41% del SUVmáx local), confinada a hueso, medida sobre el DICOM. Es lo que se ve por imagen, no el tamaño anatómico exacto; el volumen parcial subestima los focos < ~10 mm.', 'Metabolic extent = what each focus takes up above the threshold (41% of the local SUVmax), confined to bone, measured on the DICOM. It is what imaging shows, not the exact anatomical size; partial-volume effect underestimates foci < ~10 mm.') }}</p>
            </div>
          </div>

          <!-- ORDEN ORIENTATIVO · candidatos confirmados (los focos del informe) -->
          <div class="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h3 class="heading-display text-lg text-berenjena">{{ L('Focos del informe, ordenados por idoneidad', 'Report foci, ordered by suitability') }}</h3>
            <span class="text-[11px] text-tinta">{{ L('orden orientativo · toca un foco para abrir su ficha', 'indicative order · tap a focus to open its card') }}</span>
          </div>
          <ul class="space-y-2 mb-3">
            <li v-for="(le, i) in rankedFoci" :key="le.id">
              <button type="button" @click="pick(le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                class="w-full text-left rounded-card border px-3.5 py-3 transition-colors"
                :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.12)] bg-cream-card hover:border-[rgba(45,27,61,0.3)]'">
                <div class="flex items-center gap-3">
                  <span class="w-5 shrink-0 text-right font-mono text-[13px] text-tinta tabular-nums">{{ i + 1 }}</span>
                  <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center text-white text-xs font-semibold" :style="{ background: phenoColor(le) }">{{ le.id }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-berenjena text-sm leading-tight">{{ le.level[lang] }}</p>
                    <p class="text-[11px] text-tinta leading-tight">{{ le.region[lang] }} · {{ le.side === 'R' ? L('dcha', 'R') : le.side === 'L' ? L('izda', 'L') : L('centro', 'mid') }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-display text-2xl text-berenjena tabular-nums leading-none">{{ suitabilityScore(le) }}</div>
                    <div class="text-[9px] text-tinta uppercase tracking-wide">{{ L('idoneidad', 'suitability') }}</div>
                  </div>
                </div>
                <!-- los tres factores que componen el número (visibles, no solo el total) -->
                <div class="mt-3 grid sm:grid-cols-3 gap-x-4 gap-y-2">
                  <div>
                    <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                      <span class="text-tinta">{{ L('Tumor viable (FDG/Ga)', 'Viable tumour (FDG/Ga)') }}</span>
                      <span class="font-mono" :style="{ color: '#bb4128' }">FDG {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · Ga {{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                      <div class="h-full rounded-full" :style="{ width: pct01(viableFactor(le)), background: '#bb4128' }" />
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                      <span class="text-tinta">{{ L('Rendimiento (forma)', 'Yield (shape)') }}</span>
                      <span class="font-mono" :style="{ color: '#1f6b57' }">{{ morphShort(le) }}</span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                      <div class="h-full rounded-full" :style="{ width: pct01(yieldFactor(le)), background: '#1f6b57' }" />
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                      <span class="text-tinta">{{ L('Extensión metabólica', 'Metabolic extent') }}</span>
                      <span class="font-mono text-tinta">{{ metExtentLabel(le) }}</span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                      <div class="h-full rounded-full" :style="{ width: pct01(sizeFactor(le)), background: '#6b6470' }" />
                    </div>
                  </div>
                </div>
                <!-- avisos de factibilidad (no van en el número): partes blandas / antecedente / hueso de carga -->
                <div v-if="hasSoftTissue(le) || le.priorBiopsy || le.load" class="mt-2.5 flex flex-wrap gap-1.5">
                  <span v-if="hasSoftTissue(le)" class="pill-data" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas (RMN) · diana accesible', '+ soft tissue (MRI) · accessible target') }}</span>
                  <span v-if="le.priorBiopsy" class="pill-data" :style="{ background: '#f0e2c8', color: '#8a5a1a' }">{{ L('⚑ biopsia previa 26B585 FALLÓ aquí', '⚑ prior biopsy 26B585 FAILED here') }}</span>
                  <span v-if="le.load" class="pill-data" :style="{ background: 'rgba(45,27,61,0.06)', color: '#3a3340' }">{{ L('hueso de carga · revisado (Oncología RT)', 'weight-bearing · reviewed (Radiation Oncology)') }}</span>
                </div>
              </button>
            </li>
          </ul>
          <p class="text-[12px] text-tinta leading-relaxed mb-8 max-w-3xl">
            {{ L('Recordatorio: es un ORDEN ORIENTATIVO por las señales de imagen, no una orden de qué biopsiar. La decisión —incluida la accesibilidad y la seguridad— es del equipo médico con radiología intervencionista.',
                  'Reminder: this is an INDICATIVE ORDER by imaging signals, not an instruction on what to biopsy. The decision — including accessibility and safety — belongs to the medical team with interventional radiology.') }}
          </p>

          <!-- FOCOS DETECTADOS POR IA · separados del orden (candidatos sí, peso real no) -->
          <div class="rounded-card border px-4 py-4" :style="{ borderColor: '#efb27a', background: '#fbf5ea' }">
            <p class="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: '#8a4a1a' }">
              <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#bf7d2c' }" />
              {{ L('Detectados por IA · fuera del orden', 'AI-detected · outside the order') }}
              <span class="status-badge" :style="{ background: '#fde4cc', color: '#8a4a1a' }">{{ L('sin confirmar', 'unconfirmed') }}</span>
            </p>
            <p class="text-[12.5px] text-tinta leading-relaxed mb-3">
              {{ L('Estos focos los detectó una IA sobre los DICOM y no constan en el informe oficial. Candidatos sí, peso real no: requieren correlación de imagen con Medicina Nuclear antes de considerarse diana. Por eso quedan fuera del orden de arriba.',
                    'These foci were detected by an AI on the DICOM and are not in the official report. Candidates yes, real weight no: they require imaging correlation with Nuclear Medicine before being considered a target. That is why they stay outside the order above.') }}
            </p>
            <ul class="space-y-2">
              <li v-for="le in aiCandidates" :key="le.id">
                <button type="button" @click="pick(le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                  class="w-full text-left rounded-card border px-3.5 py-3 transition-colors"
                  :class="selected === le.id ? 'border-[#bf7d2c] bg-[rgba(191,125,44,0.08)]' : 'border-[rgba(138,74,26,0.25)] bg-cream hover:border-[rgba(138,74,26,0.5)]'">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center text-white text-xs font-semibold ai-dot" :style="{ background: phenoColor(le) }">{{ le.id }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-berenjena text-sm leading-tight">{{ le.level[lang] }}</p>
                      <p class="text-[11px] text-tinta leading-tight">{{ le.region[lang] }} · {{ le.side === 'R' ? L('dcha', 'R') : le.side === 'L' ? L('izda', 'L') : L('centro', 'mid') }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="font-display text-2xl tabular-nums leading-none" :style="{ color: '#8a4a1a' }">{{ suitabilityScore(le) }}</div>
                      <div class="text-[9px] uppercase tracking-wide" :style="{ color: '#8a4a1a' }">{{ L('idoneidad · s/c', 'suitability · n/c') }}</div>
                    </div>
                  </div>
                  <!-- los MISMOS tres factores que un foco confirmado (visibles, no solo el total) -->
                  <div class="mt-3 grid sm:grid-cols-3 gap-x-4 gap-y-2">
                    <div>
                      <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                        <span class="text-tinta">{{ L('Tumor viable (FDG/Ga)', 'Viable tumour (FDG/Ga)') }}</span>
                        <span class="font-mono" :style="{ color: '#bb4128' }">FDG ~{{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · Ga ~{{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span>
                      </div>
                      <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                        <div class="h-full rounded-full" :style="{ width: pct01(viableFactor(le)), background: '#bb4128' }" />
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                        <span class="text-tinta">{{ L('Rendimiento (forma)', 'Yield (shape)') }}</span>
                        <span class="font-mono" :style="{ color: '#1f6b57' }">{{ morphShort(le) }}</span>
                      </div>
                      <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                        <div class="h-full rounded-full" :style="{ width: pct01(yieldFactor(le)), background: '#1f6b57' }" />
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                        <span class="text-tinta">{{ L('Extensión metabólica', 'Metabolic extent') }}</span>
                        <span class="font-mono text-tinta">{{ metExtentLabel(le) }}</span>
                      </div>
                      <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                        <div class="h-full rounded-full" :style="{ width: pct01(sizeFactor(le)), background: '#6b6470' }" />
                      </div>
                    </div>
                  </div>
                  <!-- marca digna, no en el número: pendiente de validación radiológica -->
                  <div class="mt-2.5 flex flex-wrap gap-1.5">
                    <span class="pill-data" :style="{ background: '#fde4cc', color: '#8a4a1a' }">{{ L('detectado por IA · pendiente de validación', 'AI-detected · pending validation') }}</span>
                    <span class="pill-data" :style="{ background: 'rgba(138,74,26,0.08)', color: '#8a4a1a' }">{{ L('requiere correlación (Medicina Nuclear)', 'needs correlation (Nuclear Medicine)') }}</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </section>

        <!-- ===== ZONA E · APÉNDICE DE REFERENCIA (tabla) — abierta por defecto (vista clínica) ===== -->
        <section class="mb-14" aria-labelledby="tabla">
          <p class="eyebrow mb-2 block">{{ L('Para el equipo · referencia', 'For the team · reference') }}</p>
          <h2 id="tabla" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">{{ L('Apéndice: los focos en una tabla', 'Appendix: the foci in a table') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">{{ L('Tabla completa con la idoneidad orientativa como diana, SUVmáx por trazador, tendencia, extensión metabólica medida y patrón, más los focos extra detectados de forma automática. Pulsa una cabecera para ordenar; los focos detectados por IA van siempre al final, en su propio grupo, sin confirmar.', 'Full table with the indicative suitability as a target, SUVmax per tracer, trend, measured metabolic extent and pattern, plus the automatically detected extra foci. Click a header to sort; AI-detected foci always go last, in their own group, unconfirmed.') }}</p>
          <details class="notes-disclosure" open>
            <summary>{{ L('Abrir la tabla y los focos extra', 'Open the table and extra foci') }}</summary>
          <p class="text-[12px] text-tinta mt-3 mb-4 leading-relaxed max-w-3xl">
            {{ L('Pulsa una cabecera para ordenar. Primero van los focos del informe oficial y, al final, en su propio grupo, los detectados por IA (medidas aproximadas sobre los DICOM, por confirmar con Medicina Nuclear). La extensión metabólica es lo que cada foco capta por encima del umbral (41% del SUVmáx local), confinado a hueso; no es el tamaño anatómico exacto y el volumen parcial subestima los focos < ~10 mm.',
                  'Click a header to sort. Report foci come first and, at the end, in their own group, the AI-detected ones (approximate DICOM measurements, to confirm with Nuclear Medicine). The metabolic extent is what each focus takes up above the threshold (41% of the local SUVmax), confined to bone; it is not the exact anatomical size and partial volume underestimates foci < ~10 mm.') }}
          </p>
          <div class="data-card overflow-x-auto tabla-focos">
            <table class="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col" :aria-sort="ariaSort('id')"><button type="button" class="th-sort" @click="sortBy('id')"># <span class="th-arrow">{{ sortArrow('id') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('level')"><button type="button" class="th-sort" @click="sortBy('level')">{{ L('Localización', 'Location') }} <span class="th-arrow">{{ sortArrow('level') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('side')"><button type="button" class="th-sort" @click="sortBy('side')">{{ L('Lado', 'Side') }} <span class="th-arrow">{{ sortArrow('side') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('suit')"><button type="button" class="th-sort" @click="sortBy('suit')">{{ L('Idoneidad', 'Suitability') }} <span class="th-arrow">{{ sortArrow('suit') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('dota')"><button type="button" class="th-sort" @click="sortBy('dota')">Ga SUVmáx <span class="th-arrow">{{ sortArrow('dota') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('fdg')"><button type="button" class="th-sort" @click="sortBy('fdg')">FDG SUVmáx <span class="th-arrow">{{ sortArrow('fdg') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('prev')"><button type="button" class="th-sort" @click="sortBy('prev')">{{ L('FDG previo', 'Prior FDG') }} <span class="th-arrow">{{ sortArrow('prev') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('delta')"><button type="button" class="th-sort" @click="sortBy('delta')">Δ FDG <span class="th-arrow">{{ sortArrow('delta') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('size')"><button type="button" class="th-sort" @click="sortBy('size')">{{ L('Extensión metab. (mm · ml)', 'Metabolic extent (mm · ml)') }} <span class="th-arrow">{{ sortArrow('size') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('pheno')"><button type="button" class="th-sort" @click="sortBy('pheno')">{{ L('Patrón', 'Pattern') }} <span class="th-arrow">{{ sortArrow('pheno') }}</span></button></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="row in tableRows" :key="row.kind === 'lesion' ? 'l' + row.le.id : 'aih'">
                <!-- subtítulo de grupo: separa los focos detectados por IA (al final) -->
                <tr v-if="row.kind === 'aiHeader'" class="ai-group-head">
                  <td :colspan="tableCols" class="font-semibold" :style="{ background: '#fbf5ea', color: '#8a4a1a', borderTop: '2px solid #efb27a' }">
                    <span class="inline-flex items-center gap-2 flex-wrap">
                      <span class="inline-block w-2 h-2 rounded-full" :style="{ background: '#bf7d2c' }" aria-hidden="true" />
                      {{ L('Detectados por IA · posibles focos nuevos · por confirmar', 'AI-detected · possible new foci · to confirm') }}
                    </span>
                  </td>
                </tr>
                <tr v-else class="cursor-pointer" :class="selected === row.le.id ? 'bg-[rgba(157,68,171,0.08)]' : (isAiDavid(row.le) ? 'ai-row' : '')" @click="pick(row.le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })">
                  <template v-if="row.kind === 'lesion'">
                  <td><span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-semibold" :class="isAiDavid(row.le) ? 'ai-dot' : ''" :style="{ background: phenoColor(row.le) }">{{ row.le.id }}</span></td>
                  <td class="font-semibold text-berenjena">{{ row.le.level[lang] }}</td>
                  <td class="text-xs">{{ row.le.side === 'R' ? L('Dcha', 'R') : row.le.side === 'L' ? L('Izda', 'L') : L('Centro', 'Mid') }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-semibold text-berenjena tabular-nums w-6 shrink-0" :style="isAiDavid(row.le) ? { color: '#8a4a1a', opacity: 0.85 } : {}">{{ suitabilityScore(row.le) }}</span>
                      <span class="inline-flex h-2 w-12 shrink-0 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }" aria-hidden="true">
                        <span class="h-full rounded-full" :style="{ width: ((suitabilityScore(row.le) / suitMax) * 100).toFixed(0) + '%', background: isAiDavid(row.le) ? '#bf7d2c' : '#2d1b3d' }" />
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span v-if="hasSoftTissue(row.le)" class="pill-data !px-1.5 !py-0 !text-[10px]" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas', '+ soft tissue') }}</span>
                      <span v-if="row.le.priorBiopsy" class="pill-data !px-1.5 !py-0 !text-[10px]" :style="{ background: '#f0e2c8', color: '#8a5a1a' }">{{ L('⚑ 26B585 falló', '⚑ 26B585 failed') }}</span>
                      <span v-if="isAiDavid(row.le)" class="pill-data !px-1.5 !py-0 !text-[10px]" :style="{ background: '#fde4cc', color: '#8a4a1a' }">{{ L('sin confirmar', 'unconfirmed') }}</span>
                    </div>
                  </td>
                  <td class="font-mono">{{ row.le.dota != null ? row.le.dota.toFixed(1) : '—' }}</td>
                  <td class="font-mono">{{ row.le.fdg != null ? row.le.fdg.toFixed(1) : '—' }}</td>
                  <td class="font-mono text-tinta">{{ row.le.prevFdg != null ? row.le.prevFdg.toFixed(1) : '—' }}</td>
                  <td class="font-mono" :style="deltaStyle(row.le)">{{ deltaFdg(row.le) }}</td>
                  <td class="font-mono text-tinta whitespace-nowrap">{{ metExtentLabel(row.le) }}</td>
                  <td class="text-sm">
                    <span class="flex items-center gap-2">
                      <span class="inline-flex h-2.5 w-12 shrink-0 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" aria-hidden="true">
                        <span :style="{ width: (neShare(row.le) * 100).toFixed(0) + '%', background: '#9d44ab' }" />
                        <span :style="{ width: ((1 - neShare(row.le)) * 100).toFixed(0) + '%', background: '#bb4128' }" />
                      </span>
                      <span>{{ phenoLabel(row.le) }}</span>
                    </span>
                  </td>
                  </template>
                </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- nota: cosas por aclarar -->
          <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
            <strong>{{ L('Por aclarar', 'To clarify') }}</strong>
            <p class="mt-1 mb-1.5">{{ L('Los datos de este panel provienen de una re-lectura cuantitativa sobre el DICOM nativo (validada): es una medición asistida, no sustituye la lectura formal de Medicina Nuclear. Quedan estas incertidumbres reales:', 'The data in this panel come from a quantitative re-reading of the native DICOM (validated): it is an assisted measurement, it does not replace the formal Nuclear Medicine reading. These genuine uncertainties remain:') }}</p>
            <ul class="list-disc pl-5 mt-1.5 space-y-1">
              <li>{{ L('La extensión metabólica del #2 (C4) y del #6 (D9) no es fiable: su captación es ≈ el fondo óseo y no se separa del hueso normal.', 'The metabolic extent of #2 (C4) and #6 (D9) is not reliable: their uptake is ≈ bone background and cannot be separated from normal bone.') }}</li>
              <li>{{ L('Los focos #17 (costilla) y #19 (cervicotorácica), detectados por IA, son medidas aproximadas sobre el DICOM y no constan en el informe oficial — a revisar con Medicina Nuclear.', 'Foci #17 (rib) and #19 (cervicothoracic), AI-detected, are approximate measurements on the DICOM and are not in the official report — to review with Nuclear Medicine.') }}</li>
            </ul>
          </div>

          <!-- FOCOS EXTRA detectados automáticamente (no en la tabla) -->
          <div class="data-card mt-4">
            <div class="px-4 py-3">
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap">
                {{ L('Focos extra detectados (automático, no en la tabla)', 'Extra foci detected (automatic, not in the table)') }}
                <span class="status-badge" :style="{ background: 'rgba(31,90,58,0.12)', color: '#1f5a3a' }">{{ L('verificación', 'verification') }}</span>
              </p>
              <p class="text-[12px] text-tinta leading-relaxed mb-2">{{ L('Focos FDG que la detección automática halló sobre el DICOM y que NO están en la tabla. No es diagnóstico: es para que el equipo decida si añadir alguno. El primero (HU 1) probablemente es captación de partes blandas; el blástico de SUVmáx 5,82 (HU 704, lado izq.) es el más sugestivo de lesión real no listada.', 'FDG foci the automatic detection found on the DICOM that are NOT in the table. Not a diagnosis: for the team to decide whether to add any. The first (HU 1) is likely soft-tissue uptake; the blastic SUVmax 5.82 (HU 704, left) is the most suggestive of a real unlisted lesion.') }}</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(c, i) in AUTO_NEW_FDG" :key="i" class="pill-data" :style="{ background: c.flag ? '#fde4cc' : 'rgba(45,27,61,0.06)', color: c.flag ? '#8a4a1a' : '#3a3340' }">
                  SUVmáx {{ c.suvmax }} · {{ c.morph }} · {{ c.size }} mm · {{ c.side }}<template v-if="c.flag"> · {{ c.flag }}</template>
                </span>
              </div>
            </div>
          </div>
          </details>
        </section>

        <!-- «Qué significa cada patrón» fundido en el héroe (Zona A) -->

        <!-- fuentes -->
        <details class="notes-disclosure">
          <summary>{{ L('Fuentes y método', 'Sources and method') }}</summary>
          <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'SUV y localizaciones: informe PET-CT ¹⁸F-FDG 24/03/2026 e informe PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 (Medicina Nuclear, H. Virgen de la Arrixaca). Imágenes PET: MIP, fusión sagital y cortes axiales reconstruidos a partir de los DICOM de ambos estudios (PET con corrección de atenuación + TC). Los SUV calculados desde los DICOM concuerdan con el informe dentro de ~10–12% (diferencia esperable entre voxel-máx y ROI). RMN: cortes sagitales de columna cervical y dorsal (secuencias STIR y T1) exportados de los DICOM de RM; se muestran solo para visualización y están pendientes de lectura radiológica formal.',
              'SUV and locations: ¹⁸F-FDG PET-CT report 24/03/2026 and ⁶⁸Ga-DOTATOC PET-CT report 26/05/2026 (Nuclear Medicine, Virgen de la Arrixaca Hospital). PET images: MIP, sagittal fusion and axial slices reconstructed from the DICOM of both studies (attenuation-corrected PET + CT). SUVs computed from the DICOM agree with the report within ~10–12% (expected difference between voxel-max and ROI). MRI: sagittal slices of the cervical and thoracic spine (STIR and T1 sequences) exported from the MR DICOM; shown for visualisation only and pending formal radiology reading.') }}
          </p>
        </details>

        <!-- retorno a /ciencia (coherencia de sitio) -->
        <div class="mt-10 pt-6 border-t border-[rgba(45,27,61,0.1)]">
          <NuxtLink :to="localePath('ciencia')" class="link-action text-miriam">
            {{ L('El tejido y la biología molecular, en La ciencia', 'Tissue and molecular biology, in The science') }}
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== LIGHTBOX · IMAGEN CLAVE DEL FOCO (zoom/pan + toggle de plano) ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="keyLightboxOpen && selKeyActive"
          class="foco-key-lb"
          role="dialog"
          aria-modal="true"
          :aria-label="L('Imagen clave del foco #' + sel.id, 'Key image of focus #' + sel.id)"
          @click.self="closeKeyLightbox">
          <div class="foco-key-lb__panel">
            <div class="foco-key-lb__bar">
              <div class="min-w-0">
                <p class="foco-key-lb__title">{{ L('Imagen clave · foco', 'Key image · focus') }} #{{ sel.id }}</p>
                <p class="foco-key-lb__sub">{{ sel.level[lang] }} · {{ sel.region[lang] }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- toggle de plano: SOLO los planos que existen para este foco -->
                <div v-if="selKey.planes.length > 1" class="foco-key-lb__planes" role="group" :aria-label="L('Plano de la imagen', 'Image plane')">
                  <button
                    v-for="p in selKey.planes"
                    :key="p.plane"
                    type="button"
                    class="foco-key-lb__plane"
                    :class="{ 'is-active': keyPlane === p.plane }"
                    :aria-pressed="keyPlane === p.plane"
                    @click="keyPlane = p.plane">{{ p.label[lang] }}</button>
                </div>
                <!-- DESCARGA · la PNG del plano activo (foco-NN[-plano].png) -->
                <a
                  v-if="selKeyActive"
                  class="foco-key-lb__dl"
                  :href="selKeyActive.src"
                  :download="keyDownloadName(selKeyActive.src)"
                  :aria-label="L('Descargar esta imagen clave (PNG)', 'Download this key image (PNG)')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  <span class="foco-key-lb__dl-txt">{{ L('Descargar', 'Download') }}</span>
                </a>
                <button
                  type="button"
                  class="foco-key-lb__close"
                  :aria-label="L('Cerrar', 'Close')"
                  @click="closeKeyLightbox">×</button>
              </div>
            </div>

            <div class="foco-key-lb__stage">
              <ImageZoomViewer
                :key="selKeyActive.src"
                :src="selKeyActive.src"
                :alt="L('Imagen clave (' + selKeyActive.label.es.toLowerCase() + ') del foco #' + sel.id + ' · ' + sel.level.es, 'Key image (' + selKeyActive.label.en.toLowerCase() + ') of focus #' + sel.id + ' · ' + sel.level.en)"
                max-width="100%" />
            </div>

            <p class="foco-key-lb__cap">{{ selKeyCaption }}</p>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== LIGHTBOX · IMAGEN REAL PET (zoom) · una ampliada o las 4 a la vez =====
         Petición de la paciente: ampliar las imágenes PET en un popup grande con
         zoom, y poder ver «las 4 a la vez» (MIP Galio, MIP FDG, columna sagital
         Galio, columna sagital FDG) en cuadrícula 2×2 para compararlas de golpe,
         todas ampliables. Reutiliza ImageZoomViewer (mismo visor de zoom/pan). -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="petLightboxOpen"
          class="foco-key-lb"
          role="dialog"
          aria-modal="true"
          :aria-label="petLightboxMode === 'grid' ? L('Las 4 imágenes PET a la vez', 'All 4 PET images at once') : L('Imagen PET ampliada', 'Enlarged PET image')"
          @click.self="closePetLightbox">
          <div class="foco-key-lb__panel foco-key-lb__panel--wide">
            <div class="foco-key-lb__bar">
              <div class="min-w-0">
                <p class="foco-key-lb__title">{{ petLightboxMode === 'grid' ? L('Las 4 PET a la vez', 'All 4 PET at once') : petLightboxImg[lang] }}</p>
                <p class="foco-key-lb__sub">{{ petLightboxMode === 'grid' ? L('MIP y columna sagital · receptor (Galio) y azúcar (FDG)', 'MIP and sagittal spine · receptor (gallium) and sugar (FDG)') : L('reconstruida de los DICOM · rueda/pinza para acercar, arrastra para mover', 'reconstructed from the DICOM · wheel/pinch to zoom, drag to pan') }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- conmutar: las 4 ↔ una ampliada -->
                <div class="foco-key-lb__planes" role="group" :aria-label="L('Vista del popup', 'Popup view')">
                  <button type="button" class="foco-key-lb__plane" :class="{ 'is-active': petLightboxMode === 'grid' }" :aria-pressed="petLightboxMode === 'grid'" @click="petLightboxShowGrid()">{{ L('Las 4', 'All 4') }}</button>
                  <button type="button" class="foco-key-lb__plane" :class="{ 'is-active': petLightboxMode === 'single' }" :aria-pressed="petLightboxMode === 'single'" @click="petLightboxShowSingle(petLightboxSrc)">{{ L('Una', 'One') }}</button>
                </div>
                <button type="button" class="foco-key-lb__close" :aria-label="L('Cerrar', 'Close')" @click="closePetLightbox">×</button>
              </div>
            </div>

            <div class="foco-key-lb__stage">
              <!-- las 4 PET en cuadrícula 2×2, cada una con su propio zoom -->
              <div v-if="petLightboxMode === 'grid'" class="pet-lb-grid">
                <figure v-for="p in PET_IMGS" :key="p.src" class="pet-lb-grid__cell">
                  <ImageZoomViewer :src="p.src" :alt="L(p.es, p.en)" max-width="100%" />
                  <figcaption class="pet-lb-grid__cap" :style="{ color: petTracerColor(p) }">{{ L(p.es, p.en) }}</figcaption>
                </figure>
              </div>
              <!-- una sola, ampliada al máximo -->
              <ImageZoomViewer v-else :key="petLightboxSrc" :src="petLightboxSrc" :alt="L(petLightboxImg.es, petLightboxImg.en)" max-width="100%" />
            </div>

            <p class="foco-key-lb__cap">{{ L('Imágenes reconstruidas de los DICOM (PET-FDG 24/03/2026 y PET ⁶⁸Ga-DOTATOC 26/05/2026). Lo intenso fuera del esqueleto es captación normal de cada trazador. Para verlas y compararlas; su lectura formal corresponde al radiólogo.', 'Images reconstructed from the DICOM (FDG-PET 24/03/2026 and ⁶⁸Ga-DOTATOC PET 26/05/2026). The intense areas outside the skeleton are normal uptake of each tracer. For viewing and comparing; their formal reading belongs to the radiologist.') }}</p>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
@keyframes pulsering {
  0% { opacity: 0.7; transform: scale(0.7); }
  70% { opacity: 0; transform: scale(1.7); }
  100% { opacity: 0; transform: scale(1.7); }
}
.pulse-ring {
  transform-box: fill-box;
  transform-origin: center;
  animation: pulsering 1.6s ease-out infinite;
}
/* Parpadeo SUTIL = mayor avidez de azúcar (FDG alto). Reutiliza el patrón de
   pulsering pero sobre el RELLENO del marcador (un halo que late suave), no un
   anillo expansivo: así se distingue del anillo de «foco nuevo». */
@keyframes pulsehot {
  0%   { opacity: 0.55; transform: scale(1); }
  50%  { opacity: 0;    transform: scale(1.45); }
  100% { opacity: 0;    transform: scale(1.45); }
}
.pulse-hot {
  transform-box: fill-box;
  transform-origin: center;
  animation: pulsehot 2.2s ease-in-out infinite;
}
/* punto de leyenda que late igual que los focos FDG altos (sin escala, solo
   opacidad — un viñetado dentro del texto). */
.legend-pulse-dot {
  display: inline-block;
  width: 9px; height: 9px;
  border-radius: 9999px;
  background: #bb4128;
  animation: legendpulse 2.2s ease-in-out infinite;
}
@keyframes legendpulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(187, 65, 40, 0.5); }
  50%      { opacity: 0.55; box-shadow: 0 0 0 3px rgba(187, 65, 40, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .pulse-ring { animation: none; opacity: 0.5; }
  .pulse-hot { animation: none; opacity: 0; }
  .legend-pulse-dot { animation: none; }
}
/* ── Tabla de focos · cabecera pegajosa ──────────────────────────────
   El contenedor scrollea (vertical + horizontal) y el <thead> se queda fijo
   en su borde superior mientras se escanea/ordena las ~19 filas. Stick DENTRO
   del propio contenedor (no contra el viewport) → evita el conflicto con la
   cabecera pegajosa del sitio.
   Fondo OPACO (#f5efe6, ya en .data-table) para que las filas no se
   transparenten al pasar por debajo. */
.tabla-focos {
  max-height: min(70vh, 640px);
  overflow: auto;
  overscroll-behavior: contain;
}
.tabla-focos thead th {
  position: sticky;
  top: 0;
  z-index: 6;
  background: #f5efe6; /* refuerza la opacidad del thead global */
}
.tabla-focos thead th:first-child { border-top-left-radius: 0; }
.tabla-focos thead th:last-child { border-top-right-radius: 0; }
/* el subtítulo del grupo de IA (un <td> dentro del tbody) queda por debajo
   del thead pegajoso al pasar bajo él */
.tabla-focos .ai-group-head td { position: relative; z-index: 1; }
/* al saltar a una fila (scrollIntoView block:center) deja hueco bajo el thead */
.tabla-focos tbody tr { scroll-margin-top: 3.25rem; }

.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
  /* WCAG 2.2 (2.5.8) — área táctil cómoda (≥24px, aquí 44px de alto) sin
     descuadrar la cabecera: el padding negativo recupera el hueco visual. */
  min-height: 44px;
  padding: 4px 6px;
  margin: -4px -6px;
  border-radius: 6px;
}
.th-sort:hover { color: #2d1b3d; }
.th-sort:focus-visible { outline: 2px solid #9d44ab; outline-offset: 1px; }
.th-arrow { font-size: 9px; opacity: 0.55; }
.reads-vh { background: rgba(157, 68, 171, 0.07); }
/* grupo de focos detectados por IA (al final de la tabla) — fila de subtítulo
   + tinte cálido sutil en las filas; el marcado fuerte es la POSICIÓN + rótulo. */
.ai-group-head td { padding-top: 0.4rem; padding-bottom: 0.4rem; }
.ai-row { background: rgba(191, 125, 44, 0.05); }
.ai-row:hover { background: rgba(191, 125, 44, 0.1); }
/* contorno punteado sutil del marcador de los focos de IA (conserva el matiz) */
.ai-dot { outline: 1.5px dotted rgba(138, 74, 26, 0.7); outline-offset: 1px; }

/* ---- Miniatura de la imagen clave del foco (pulsable → lightbox) ---- */
.foco-key-thumb {
  position: relative;
  display: block;
  width: 100%;
  max-width: 260px;
  margin: 0 auto;
  padding: 0;
  border: 1px solid rgba(45, 27, 61, 0.16);
  border-radius: 0.6rem;
  overflow: hidden;
  background: #000;
  cursor: zoom-in;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
}
.foco-key-thumb:hover { border-color: rgba(157, 68, 171, 0.55); box-shadow: 0 4px 16px rgba(45, 27, 61, 0.18); }
.foco-key-thumb:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }
.foco-key-thumb__img { display: block; width: 100%; height: auto; }
.foco-key-thumb__zoom {
  position: absolute;
  right: 7px;
  bottom: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.foco-key-thumb__planes {
  position: absolute;
  left: 7px;
  bottom: 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.7);
  color: #f1e7f5;
}

/* ---- Galería contact-sheet de TODAS las key-images ---- */
.foco-key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.85rem;
}
/* móvil estrecho: 2 columnas como mínimo cómodas */
@media (max-width: 420px) {
  .foco-key-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
}
.foco-key-cell { margin: 0; position: relative; }
/* botón de DESCARGA de la key-image (PNG): superpuesto en la esquina superior
   derecha del tile, fuera del botón que abre el lightbox. */
.foco-key-dl {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: background 0.15s;
}
.foco-key-dl:hover { background: rgba(45, 27, 61, 0.95); }
.foco-key-dl:focus-visible { outline: 2px solid #ffd166; outline-offset: 1px; }
.foco-key-tile {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: zoom-in;
}
.foco-key-tile--note { cursor: default; }
.foco-key-tile__frame,
.foco-key-tile__noteframe {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(45, 27, 61, 0.16);
  border-radius: 0.55rem;
  overflow: hidden;
  background: #000;
  transition: box-shadow 0.18s, border-color 0.18s;
}
.foco-key-tile__noteframe {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a1f30;
  border-style: dashed;
  border-color: rgba(138, 90, 26, 0.6);
}
.foco-key-tile.is-ai .foco-key-tile__frame { border-style: dashed; border-color: rgba(138, 90, 26, 0.6); }
.foco-key-tile:hover .foco-key-tile__frame { border-color: rgba(157, 68, 171, 0.6); box-shadow: 0 4px 14px rgba(45, 27, 61, 0.18); }
.foco-key-tile:focus-visible { outline: 2px solid #9d44ab; outline-offset: 3px; border-radius: 0.55rem; }
.foco-key-tile__img { display: block; width: 100%; height: 100%; object-fit: cover; }
.foco-key-tile__zoom {
  position: absolute;
  right: 5px;
  bottom: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.foco-key-tile__planes {
  position: absolute;
  left: 5px;
  bottom: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  line-height: 1;
  padding: 2.5px 5px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.72);
  color: #f1e7f5;
}
.foco-key-tile__flag {
  position: absolute;
  left: 5px;
  top: 5px;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 1;
  padding: 2.5px 5px;
  border-radius: 9999px;
  background: #fde4cc;
  color: #8a4a1a;
}
.foco-key-tile__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.4rem 0.1rem 0;
}
.foco-key-tile__id { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #2d1b3d; }
.foco-key-tile__loc { font-size: 11.5px; line-height: 1.25; color: #3a3340; }
.foco-key-tile__suv { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; }
.foco-key-tile__confirm { font-size: 9.5px; line-height: 1.3; color: #8a4a1a; margin-top: 1px; }

/* ---- Imagen real PET: botón «ver las 4 a la vez» + botón «ampliar» por figura ---- */
.pet-grid-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fff;
  color: #2d1b3d;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.pet-grid-cta:hover { border-color: rgba(157, 68, 171, 0.55); box-shadow: 0 2px 10px rgba(45, 27, 61, 0.12); }
.pet-grid-cta:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }
.pet-fig { position: relative; }
/* botón «ampliar»: superpuesto en la esquina, NO envuelve el visor de zoom (así
   el zoom/pan del ImageZoomViewer sigue funcionando). */
.pet-fig__open {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 5px 9px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  cursor: zoom-in;
  transition: background 0.15s;
}
.pet-fig__open:hover { background: rgba(45, 27, 61, 0.95); }
.pet-fig__open:focus-visible { outline: 2px solid #ffd166; outline-offset: 1px; }

/* ---- Lightbox de la imagen clave ---- */
.foco-key-lb {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 3vw, 2rem);
  background: rgba(20, 14, 22, 0.82);
  backdrop-filter: blur(2px);
}
.foco-key-lb__panel {
  width: min(860px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #fbf7f0;
  border-radius: 0.9rem;
  overflow: hidden;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
}
/* popup más ancho para las 4 PET en 2×2 */
.foco-key-lb__panel--wide { width: min(1100px, 100%); }
/* cuadrícula 2×2 de las 4 PET, cada una con su zoom */
.pet-lb-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
@media (max-width: 560px) {
  .pet-lb-grid { grid-template-columns: 1fr; }
}
.pet-lb-grid__cell { margin: 0; display: flex; flex-direction: column; }
.pet-lb-grid__cap {
  margin-top: 0.4rem;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}
.foco-key-lb__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid rgba(45, 27, 61, 0.12);
}
.foco-key-lb__title { font-weight: 700; color: #2d1b3d; font-size: 0.95rem; line-height: 1.1; }
.foco-key-lb__sub { color: #6b6470; font-size: 0.72rem; margin-top: 1px; }
.foco-key-lb__planes { display: inline-flex; border: 1px solid rgba(45, 27, 61, 0.2); border-radius: 9999px; overflow: hidden; }
.foco-key-lb__plane {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.28rem 0.7rem;
  color: #6b6470;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.foco-key-lb__plane + .foco-key-lb__plane { border-left: 1px solid rgba(45, 27, 61, 0.2); }
.foco-key-lb__plane:hover { color: #2d1b3d; }
.foco-key-lb__plane.is-active { background: #2d1b3d; color: #fdf6ef; }
.foco-key-lb__plane:focus-visible { outline: 2px solid #9d44ab; outline-offset: -2px; }
.foco-key-lb__dl {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  height: 34px;
  padding: 0 0.7rem;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fff;
  color: #2d1b3d;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.foco-key-lb__dl:hover { background: #f0e7f3; border-color: rgba(157, 68, 171, 0.5); }
.foco-key-lb__dl:focus-visible { outline: 2px solid #9d44ab; outline-offset: 1px; }
@media (max-width: 420px) { .foco-key-lb__dl-txt { display: none; } }
.foco-key-lb__close {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fff;
  color: #2d1b3d;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.foco-key-lb__close:hover { background: #f0e7f3; }
.foco-key-lb__close:focus-visible { outline: 2px solid #9d44ab; outline-offset: 1px; }
.foco-key-lb__stage { padding: 0.75rem; overflow: auto; flex: 1 1 auto; min-height: 0; }
.foco-key-lb__cap {
  padding: 0.5rem 0.9rem 0.85rem;
  font-size: 0.72rem;
  line-height: 1.45;
  color: #6b6470;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
}
</style>
