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

/* Pieza divulgativa PÚBLICA (decisión de la paciente, 19/06/2026): el caso de
   Miriam, abierto como HERRAMIENTA DE APOYO a la decisión — no es diagnóstico ni
   consejo médico. Título y meta honestos, dignos al compartir en redes, con el
   encuadre de «apoyo» explícito. */
const seoTitle = () =>
  lang.value === 'en'
    ? 'Metastasis map — Miriam’s case, a decision-support tool'
    : 'Mapa de metástasis — el caso de Miriam, una herramienta de apoyo'
const seoDescription = () =>
  lang.value === 'en'
    ? 'A support tool, not a diagnosis. Miriam’s bone lesions seen with dual-tracer PET (Gallium-68 DOTATOC and FDG) over her own reports, to help her decide the next steps with her medical team.'
    : 'Una herramienta de apoyo, no un diagnóstico. Las lesiones óseas de Miriam vistas con PET doble trazador (Galio-68 DOTATOC y FDG) sobre sus propios informes, para ayudarle a decidir con su equipo médico.'

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
})

defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () =>
    lang.value === 'en'
      ? 'A support tool, not a diagnosis. Miriam’s case, to decide better with her team.'
      : 'Una herramienta de apoyo, no un diagnóstico. El caso de Miriam, para decidir mejor con su equipo.',
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
/*  Las 19 lesiones (16 del informe PET + 3 detectadas por IA: #17/#18/#19)        */
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
  /* en tratamiento con SBRT (radioterapia) → tejido irradiado, menos representativo para muestreo */
  sbrt?: boolean
  what: { es: string; en: string }
  tech: { es: string; en: string }
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


const LES: Lesion[] = [
  {
    id: 1, x: 220, y: 90, side: 'C', dota: 2.89, fdg: null, pheno: 'ne',
    level: { es: 'C3 · apófisis espinosa', en: 'C3 · spinous process' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Hueso de una vértebra del cuello (la espinosa, la punta que se palpa en la nuca). Solo capta el trazador del receptor; el del azúcar no la ve.', en: 'Bone of a neck vertebra (the spinous process you can feel at the back of the neck). Only the receptor tracer lights it up; the sugar tracer does not.' },
    tech: { es: 'DOTATOC SUVmáx 2.89; FDG negativo. SSTR+ / FDG−.', en: 'DOTATOC SUVmax 2.89; FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 2, x: 206, y: 104, side: 'R', dota: 3.10, fdg: null, pheno: 'ne',
    level: { es: 'C4 · lámina / arco derecho', en: 'C4 · right lamina / arch' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Parte posterior de la vértebra C4 (el arco óseo que protege la médula), lado derecho. Captación solo del receptor.', en: 'Posterior part of the C4 vertebra (the bony arch that protects the cord), right side. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.10; FDG negativo. SSTR+ / FDG−.', en: 'DOTATOC SUVmax 3.10; FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 3, x: 120, y: 205, side: 'R', dota: 3.84, fdg: null, pheno: 'ne',
    level: { es: 'Escápula derecha', en: 'Right scapula' },
    region: { es: 'Cintura escapular', en: 'Shoulder girdle' },
    what: { es: 'Omóplato derecho (el hueso plano de la espalda alta, bajo el hombro). No es columna. Capta solo el receptor.', en: 'Right shoulder blade (the flat bone of the upper back, below the shoulder). Not spine. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.84; FDG negativo. SSTR+ / FDG−, fuera del eje axial.', en: 'DOTATOC SUVmax 3.84; FDG negative. SSTR+ / FDG−, off the axial skeleton.' },
  },
  {
    id: 4, x: 220, y: 156, side: 'C', dota: 4.23, fdg: 6.97, prevFdg: 2.8, pheno: 'mixAgg', size: '14 × 10',
    level: { es: 'D1 (T1) · cuerpo vertebral', en: 'T1 · vertebral body' },
    region: { es: 'Columna dorsal alta', en: 'Upper thoracic spine' },
    what: { es: 'Primera vértebra dorsal, justo bajo el cuello. Foco nuevo: en el PET previo casi no se veía y ahora capta azúcar con fuerza.', en: 'First thoracic vertebra, just below the neck. New focus: barely visible on the prior PET and now strongly sugar-avid.' },
    tech: { es: 'DOTATOC 4.23 / FDG 6.97 (previo 2.8, no significativo). Foco nuevo, FDG-dominante (FDG>SSTR).', en: 'DOTATOC 4.23 / FDG 6.97 (prior 2.8, non-significant). New focus, FDG-dominant (FDG>SSTR).' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: componente blástico (hueso denso) en la verificación por TC. La forma y la médula ósea se ven mejor en la RMN — míralo en el visor.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic component (dense bone) on the CT check. Shape and bone marrow are better seen on MRI — view it in the viewer.' },
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne', size: '14 × 10',
    level: { es: 'D5 (T5) · cuerpo vertebral', en: 'T5 · vertebral body' },
    region: { es: 'Columna dorsal media', en: 'Mid-thoracic spine' },
    what: { es: 'Cuerpo de una vértebra de la mitad de la espalda. Captación moderada-alta del receptor (Galio), sin azúcar (FDG).', en: 'Body of a mid-back vertebra. Moderate-high receptor (gallium) uptake, no sugar (FDG).' },
    tech: { es: 'DOTATOC SUVmáx 6.17 (moderada); FDG negativo. SSTR+ / FDG−.', en: 'DOTATOC SUVmax 6.17 (moderate); FDG negative. SSTR+ / FDG−.' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: lesión blástica (hueso denso). Es un dato de FORMA, no un tercer color.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic lesion (dense bone). This is a SHAPE finding, not a third color.' },
  },
  {
    id: 6, x: 212, y: 313, side: 'R', dota: 1.37, fdg: null, pheno: 'ne',
    level: { es: 'D9 (T9) · cuerpo derecho', en: 'T9 · right body' },
    region: { es: 'Columna dorsal baja', en: 'Lower thoracic spine' },
    what: { es: 'Vértebra dorsal baja, lado derecho. Captación leve solo del receptor (Galio); poca captación.', en: 'Lower thoracic vertebra, right side. Mild receptor-only (gallium) uptake; low uptake.' },
    tech: { es: 'DOTATOC SUVmáx 1.37 (baja); FDG negativo. SSTR+ / FDG−.', en: 'DOTATOC SUVmax 1.37 (low); FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, pheno: 'mixNe', size: '18 × 14',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'Una de las lesiones más intensas. Es la que más capta el receptor (Galio) de todas, y también capta algo de azúcar, aunque el azúcar ha bajado respecto al PET previo. Hueso denso (blástico).', en: 'One of the most intense lesions. It is the one that takes up the most receptor (gallium) of all, and also takes up some sugar, though sugar dropped versus the prior PET. Dense (blastic) bone.' },
    tech: { es: 'DOTATOC SUVmáx 13.27 (SSTR muy intensa) / FDG 7.61 (previo 10.19, ↓). Mixto, predominio SSTR (SSTR>FDG). Blástica.', en: 'DOTATOC SUVmax 13.27 (very intense SSTR) / FDG 7.61 (prior 10.19, ↓). Mixed, SSTR-predominant (SSTR>FDG). Blastic.' },
    rmn: { es: 'Nivel dorsal: la RMN de columna cubre esta zona. Forma: lesión blástica (hueso denso). El informe de RM describe en D11 extensión al espacio epidural anterior y afectación del canal lateral izquierdo. Es un dato de FORMA, no un tercer color.', en: 'Thoracic level: the spine MRI covers this area. Shape: blastic lesion (dense bone). The MRI report describes anterior epidural extension and left lateral canal compromise at D11. This is a SHAPE finding, not a third color.' },
    softTissue: { es: 'La RMN describe componente de partes blandas / extensión extraósea (espacio epidural anterior, canal lateral izquierdo). El tejido blando suele rentabilizar más que el hueso blástico denso, pero por su vecindad al canal y a las raíces la accesibilidad y la seguridad las valora radiología intervencionista.', en: 'The MRI describes a soft-tissue / extraosseous component (anterior epidural space, left lateral canal). Soft tissue usually yields more than dense blastic bone, but given its proximity to the canal and nerve roots, accessibility and safety are assessed by interventional radiology.' },
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, pheno: 'ne', size: '13 × 10',
    level: { es: 'D11 (T11) · pedículo izquierdo', en: 'T11 · left pedicle' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'En la MISMA vértebra que la #7 pero en el pedículo izquierdo (el puente óseo lateral): aquí solo capta el receptor, no azúcar. Misma vértebra, dos comportamientos distintos.', en: 'In the SAME vertebra as #7 but in the left pedicle (the lateral bony bridge): here only the receptor lights up, no sugar. Same vertebra, two different behaviors.' },
    tech: { es: 'DOTATOC SUVmáx 11.63; FDG negativo. SSTR+ intenso / FDG−. Ilustra la heterogeneidad intra-vértebra junto a la #7.', en: 'DOTATOC SUVmax 11.63; FDG negative. Intense SSTR+ / FDG−. Illustrates intra-vertebral heterogeneity alongside #7.' },
    rmn: { es: 'Misma vértebra D11 (la RMN de columna cubre este nivel). Forma: componente blástico; el detalle de la médula ósea se ve en el visor RMN.', en: 'Same D11 vertebra (the spine MRI covers this level). Shape: blastic component; bone-marrow detail is visible in the MRI viewer.' },
  },
  {
    id: 9, x: 220, y: 392, side: 'C', dota: 3.66, fdg: null, pheno: 'ne', size: '10 × 8',
    level: { es: 'L1 · apófisis espinosa', en: 'L1 · spinous process' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'Punta posterior de la primera lumbar. Capta solo el receptor.', en: 'Posterior tip of the first lumbar vertebra. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.66; FDG negativo. SSTR+ / FDG−.', en: 'DOTATOC SUVmax 3.66; FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 10, x: 241, y: 399, side: 'L', dota: null, fdg: 6.84, prevFdg: 4.67, pheno: 'agg',
    level: { es: 'L1 · pedículo izquierdo', en: 'L1 · left pedicle' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'La ÚNICA lesión que capta azúcar pero NO el receptor, y va en aumento. Solo azúcar: el Galio (receptor) no la ve.', en: 'The ONLY lesion that takes up sugar but NOT the receptor, and it is increasing. Sugar only: gallium (the receptor) does not see it.' },
    tech: { es: 'FDG SUVmáx 6.84 (previo 4.67, ↑); DOTATOC negativo. FDG+ / SSTR−. Discordante con #9 (misma vértebra).', en: 'FDG SUVmax 6.84 (prior 4.67, ↑); DOTATOC negative. FDG+ / SSTR−. Discordant with #9 (same vertebra).' },
  },
  {
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe', size: '18 × 13', sbrt: true,
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'Última vértebra lumbar, zona de mucha carga. Capta intensamente el receptor y algo de azúcar (estable). Predominio del receptor.', en: 'Last lumbar vertebra, a high-load zone. Intense receptor uptake plus some sugar (stable). Receptor-predominant.' },
    tech: { es: 'DOTATOC SUVmáx 12.14 (SSTR intensa) / FDG 5.0 (previo 4.81, estable; re-medido sobre el DICOM ~+16%). Mixto, predominio SSTR (SSTR>FDG). En tratamiento con SBRT (tejido tratado).', en: 'DOTATOC SUVmax 12.14 (intense SSTR) / FDG 5.0 (prior 4.81, stable; re-measured on the DICOM ~+16%). Mixed, SSTR-predominant (SSTR>FDG). Under SBRT treatment (treated tissue).' },
  },
  {
    id: 12, x: 205, y: 505, side: 'R', dota: 4.27, fdg: 4.34, prevFdg: 6.26, pheno: 'mixBal', size: '12 × 9',
    level: { es: 'Ala sacra derecha', en: 'Right sacral ala' },
    region: { es: 'Sacro', en: 'Sacrum' },
    what: { es: 'Parte alta y lateral del sacro (el hueso triangular bajo la columna), lado derecho. Capta los dos trazadores por igual; el azúcar ha bajado respecto al previo.', en: 'Upper-lateral part of the sacrum (the triangular bone below the spine), right side. Takes up both tracers about equally; sugar dropped versus the prior.' },
    tech: { es: 'DOTATOC 4.27 / FDG 4.34 (previo 6.26, ↓). Mixto equilibrado (SSTR≈FDG).', en: 'DOTATOC 4.27 / FDG 4.34 (prior 6.26, ↓). Balanced mixed (SSTR≈FDG).' },
  },
  {
    id: 13, x: 165, y: 545, side: 'R', dota: 4.32, fdg: 7.71, prevFdg: 7.0, pheno: 'mixAgg', size: '11 × 8',
    level: { es: 'Ilíaco derecho · ala ilíaca', en: 'Right iliac · iliac wing' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Hueso de la pelvis (ala ilíaca) derecho. Capta los dos trazadores, con más azúcar que receptor.', en: 'Right pelvic bone (iliac wing). Takes up both tracers, more sugar than receptor.' },
    tech: { es: 'DOTATOC 4.32 / FDG 7.71 (previo 7.0, leve ↑). Mixto, FDG>SSTR.', en: 'DOTATOC 4.32 / FDG 7.71 (prior 7.0, slight ↑). Mixed, FDG>SSTR.' },
    priorBiopsy: {
      es: 'Biopsia previa de este foco (26B585): solo dio hueso y músculo, sin tumor evaluable. Es un foco mixto, pero la zona muestreada fue hueso denso (blástico); el hueso denso suele rentabilizar poco en la biopsia (poco tejido tumoral).',
      en: 'Prior biopsy of this focus (26B585): yielded only bone and muscle, no evaluable tumor. It is a mixed focus, but the sampled zone was dense (blastic) bone; dense bone usually yields little on biopsy (little tumor tissue).',
    },
  },
  {
    id: 14, x: 172, y: 585, side: 'R', dota: 3.96, fdg: 9.33, prevFdg: 4.0, load: true, pheno: 'mixAgg', size: '14 × 11',
    level: { es: 'Ilíaco derecho supraacetabular', en: 'Right supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'Justo encima de la cadera derecha (el “techo” donde encaja el fémur). El azúcar (FDG) se ha más que duplicado respecto al estudio previo. Es hueso de carga; Oncología Radioterápica ya lo revisó.', en: 'Just above the right hip (the “roof” where the femur sits). Sugar has more than doubled versus the prior study. It is weight-bearing bone; Radiation Oncology has already reviewed it.' },
    tech: { es: 'DOTATOC 3.96 / FDG 9.33 (previo 4.0, claro ↑). Mixto, FDG>SSTR, hueso de carga. en seguimiento por Oncología Radioterápica.', en: 'DOTATOC 3.96 / FDG 9.33 (prior 4.0, clearly rising). Mixed, FDG>SSTR, weight-bearing bone. under follow-up by Radiation Oncology.' },
  },
  {
    id: 15, x: 275, y: 585, side: 'L', dota: 2.54, fdg: 3.97, prevFdg: 1.93, pheno: 'mixAgg',
    level: { es: 'Ilíaco izquierdo supraacetabular', en: 'Left supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'El reflejo del anterior en el lado izquierdo. Foco nuevo, de baja intensidad pero en aumento.', en: 'The mirror of the previous one on the left side. New focus, low intensity but increasing.' },
    tech: { es: 'FDG 3.97 (previo 1.93, nuevo) con DOTATOC 2.54. Foco mixto nuevo, de baja intensidad. (FDG re-medido sobre el DICOM bastante más alto, ~6,7 vs 3,97 del informe; posible contaminación pélvica vecina —intestino/vejiga—, a correlacionar en el DICOM; no se reescala con esta sola medición.)', en: 'FDG 3.97 (prior 1.93, new) with DOTATOC 2.54. New low-intensity mixed focus. (FDG re-measured on the DICOM is markedly higher, ~6.7 vs 3.97 in the report; possible neighboring pelvic contamination —bowel/bladder—, to correlate on the DICOM; not rescaled on this single measurement.)' },
  },
  {
    id: 16, x: 158, y: 628, r: 13, side: 'R', dota: 5.09, fdg: 9.43, prevFdg: 6.0, load: true, pheno: 'mixAgg', size: '18 × 13',
    level: { es: 'Fémur proximal derecho', en: 'Right proximal femur' },
    region: { es: 'Cadera derecha', en: 'Right hip' },
    what: { es: 'Parte alta del fémur, en la cadera derecha. Es de las más ávidas de azúcar (FDG) y ha aumentado respecto al estudio previo. Está en un hueso que soporta el peso del cuerpo; Oncología Radioterápica ya lo revisó.', en: 'Upper femur, at the right hip. One of the most sugar-avid and has risen versus the prior study. It sits in a weight-bearing bone; Radiation Oncology has already reviewed it.' },
    tech: { es: 'DOTATOC 5.09 / FDG 9.43 (previo 6.0, ↑). Mixto, FDG>SSTR, hueso de carga. Confirmada en corte axial PET-CT (foco intraóseo en cuello femoral). en seguimiento por Oncología Radioterápica.', en: 'DOTATOC 5.09 / FDG 9.43 (prior 6.0, ↑). Mixed, FDG>SSTR, weight-bearing bone. Confirmed on axial PET-CT (intra-osseous focus in the femoral neck). under follow-up by Radiation Oncology.' },
  },
  {
    id: 17, x: 182, y: 198, side: 'C', dota: 1.6, fdg: 4.8, pheno: 'mixAgg', size: '≤ 8', source: 'ia-david',
    level: { es: 'Tórax alto / costilla', en: 'Upper thorax / rib' },
    region: { es: 'Parrilla costal', en: 'Rib cage' },
    what: { es: 'Foco en tórax alto / costilla que capta sobre todo azúcar (FDG), de baja intensidad. Lo detectó una IA sobre los DICOM (por confirmar) y el propio análisis lo marca como dudoso — a revisar en visor; no está en el informe oficial.', en: 'Upper thorax / rib focus, mainly sugar-avid (FDG), low intensity. Detected by an AI on the DICOM (to confirm) and the analysis itself marks it as uncertain — to review in a viewer; not in the official report.' },
    tech: { es: 'DOTATOC ~1.6 / FDG ~4.8 (aproximados, sobre los DICOM). FDG+ / SSTR bajo. No confirmado en informe oficial; revisar con Medicina Nuclear.', en: 'DOTATOC ~1.6 / FDG ~4.8 (approximate, on the DICOM). FDG+ / low SSTR. Not confirmed in the official report; review with Nuclear Medicine.' },
  },
  {
    id: 18, x: 178, y: 560, side: 'R', dota: 4.3, fdg: 1.7, pheno: 'mixNe', size: '8 × 6', source: 'ia-david',
    level: { es: 'Ilíaco derecho · unión ilíaco-femoral', en: 'Right iliac · iliac-femoral junction' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Foco pélvico leve (zona ilíaco-femoral) que capta sobre todo el receptor (Galio); el azúcar es bajo. Detectado por IA, por confirmar; no está en el informe oficial.', en: 'Mild pelvic focus (iliac-femoral area) taking up mainly the receptor (gallium); sugar is low. AI-detected, to confirm; not in the official report.' },
    tech: { es: 'DOTATOC ~4.3 / FDG ~1.7 (aproximados, sobre los DICOM). SSTR+ / FDG bajo. No en informe oficial.', en: 'DOTATOC ~4.3 / FDG ~1.7 (approximate, on the DICOM). SSTR+ / low FDG. Not in the official report.' },
  },
  {
    id: 19, x: 232, y: 150, side: 'C', dota: 4.2, fdg: 3.1, pheno: 'mixNe', size: '8–10', source: 'ia-david',
    level: { es: 'C7–D2 · transición cervicotorácica', en: 'C7–D2 · cervicothoracic junction' },
    region: { es: 'Transición cervicotorácica', en: 'Cervicothoracic junction' },
    what: { es: 'Foco óseo leve en la transición cervicotorácica (C7–D2), con captación débil de los dos trazadores. Baja intensidad, a correlacionar; el FDG en esta zona puede corresponder a captación cervical fisiológica. Detectado por IA, por confirmar; no está en el informe oficial.', en: 'Mild bone focus at the cervicothoracic junction (C7–D2), with weak uptake of both tracers. Low intensity, to be correlated; FDG here may reflect physiological cervical uptake. AI-detected, to confirm; not in the official report.' },
    tech: { es: 'DOTATOC ~4.8 / FDG ~3.1 (aproximados, sobre los DICOM). Baja intensidad; el FDG puede ser captación cervical fisiológica, a correlacionar. No en informe oficial.', en: 'DOTATOC ~4.8 / FDG ~3.1 (approximate, on the DICOM). Low intensity; FDG may be physiological cervical uptake, to correlate. Not in the official report.' },
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
/* TINTA del número de foco según la luminancia del relleno (WCAG AA): los rellenos
   CLAROS (mixBal ámbar #c9921e, mixAgg naranja #df7a44) no dan contraste con el
   blanco (2.8–3.0:1) → el dígito va en berenjena oscuro; en los rellenos oscuros
   (violetas y coral) va en blanco. Mantiene los rellenos vivos del degradado. */
function markerInk(le: Lesion): string {
  return le.pheno === 'mixBal' || le.pheno === 'mixAgg' ? '#2d1b3d' : '#ffffff'
}
/* color del fenotipo SOLO para TEXTO: los naranjas/ámbar de relleno fallan AA
   sobre el cream, así que el texto usa tonos oscuros que SÍ pasan AA (≥4.5:1):
   8a5a1a (5.5:1) / 8a4a1a (5.8:1). Los rellenos/puntos/marcadores siguen usando
   phenoColor (el tono vivo). NO usar b07d1e como texto: solo da 3.37:1 (falla AA). */
const PHENO_TEXT: Record<Pheno, string> = {
  ne: '#7a2f86', mixNe: '#7a4d9e', mixBal: '#8a5a1a', mixAgg: '#8a4a1a', agg: '#9e3620',
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
/* «Detalle del foco» plegado por defecto (zona análisis más limpia); el enlace de la
   ficha lo expande. Se sincroniza con el toggle nativo del <details>. */
const detalleOpen = ref(false)
/* Abre el detalle profundo (OCULTO por defecto) y baja a él. Petición de la paciente:
   que NO haya una barra «Detalle del foco» permanente abajo; aparece solo al pulsar el
   enlace «Ver el detalle completo» de la ficha. El comité lo mantiene a ANCHO COMPLETO
   (sus tablas de 3 columnas lo necesitan), pero ya no como barra plegada visible. */
function openDetalle() {
  detalleOpen.value = true
  if (import.meta.client) nextTick(() => document.getElementById('detalle-foco')?.scrollIntoView({ behavior: smoothOrAuto(), block: 'start' }))
}
type FilterKey = 'all' | Pheno | 'new' | 'ia' | 'mix'
const filter = ref<FilterKey>('all')
const sel = computed(() => LES.find((l) => l.id === selected.value)!)
/* (#13) parte el nombre del foco en CÓDIGO de nivel (la coordenada mnemónica, p.ej.
   «C3», «D11 (T11)») + resto descriptivo, para que el código lidere como tag escaneable. */
const selLevelCode = computed(() => sel.value.level[lang.value].split(' · ')[0])
const selLevelRest = computed(() => sel.value.level[lang.value].split(' · ').slice(1).join(' · '))

/* (BIOPSIA · web pública) Vía de punción sugerida por foco — síntesis de los comités
   sobre el caso del propio paciente. EQUIPA, no indica: describe acceso/anatomía/
   seguridad/rendimiento para que el radiólogo intervencionista + el comité de tumores
   decidan sobre la imagen en vivo. SIN ranking ni «diana primaria» (eso vive en el doc
   del equipo). Focos no puncionables (#16 fémur de carga; IA #17-19): la seguridad
   describe el porqué y remite a quien corresponde, sin verbo-orden. */
type BiTxt = { es: string; en: string }
const BIOPSY: Record<number, { zone: BiTxt; approach: BiTxt; safety: BiTxt; rend: BiTxt }> = {
  1: { zone: { es: 'Apófisis espinosa pequeña, receptor-solo; sin buena zona.', en: 'Small spinous process, receptor-only; no good zone.' }, approach: { es: 'Posterior a la apófisis espinosa C3 (prono).', en: 'Posterior to the C3 spinous process (prone).' }, safety: { es: 'Cervical y pequeño; el rendimiento esperado no compensa el riesgo.', en: 'Cervical and small; expected yield does not offset the risk.' }, rend: { es: 'Bajo / riesgo de no-diagnóstico.', en: 'Low / non-diagnostic risk.' } },
  2: { zone: { es: 'Arco posterior, receptor-solo; sin buena zona.', en: 'Posterior arch, receptor-only; no good zone.' }, approach: { es: 'Posterolateral a la lámina C4.', en: 'Posterolateral to the C4 lamina.' }, safety: { es: 'Junto al cordón y la arteria vertebral; bajo rendimiento.', en: 'Next to the cord and vertebral artery; low yield.' }, rend: { es: 'Bajo / riesgo de no-diagnóstico.', en: 'Low / non-diagnostic risk.' } },
  3: { zone: { es: 'Zona medular más ávida del cuerpo escapular (no la placa cortical).', en: 'Most avid marrow zone of the scapular body (not the cortical plate).' }, approach: { es: 'Posterior al cuerpo de la escápula (prono o decúbito lateral).', en: 'Posterior to the scapular body (prone or lateral decubitus).' }, safety: { es: 'Hueso plano accesible; cuidar el borde escapular medial (neumotórax).', en: 'Accessible flat bone; mind the medial scapular border (pneumothorax).' }, rend: { es: 'Bajo-moderado (receptor-solo, FDG−).', en: 'Low-moderate (receptor-only, FDG−).' } },
  4: { zone: { es: 'Subvolumen FDG-ávido, evitando la matriz blástica.', en: 'FDG-avid subvolume, avoiding the blastic matrix.' }, approach: { es: 'Transpedicular torácico alto (prono); fusión TC+PET para centrar.', en: 'Upper-thoracic transpedicular (prone); CT+PET fusion to center it.' }, safety: { es: 'Entre cordón y pleura; hueso blástico; corredor difícil.', en: 'Between cord and pleura; blastic bone; difficult corridor.' }, rend: { es: 'Moderado, con la reserva del hueso blástico.', en: 'Moderate, with the blastic-bone caveat.' } },
  5: { zone: { es: 'Pobre: receptor/SSTR solo, hueso blástico (FDG−).', en: 'Poor: receptor/SSTR only, blastic bone (FDG−).' }, approach: { es: 'Transpedicular torácico (prono).', en: 'Thoracic transpedicular (prone).' }, safety: { es: 'Cordón y pleura; baja prioridad para este objetivo.', en: 'Cord and pleura; low priority for this objective.' }, rend: { es: 'Bajo.', en: 'Low.' } },
  6: { zone: { es: 'Señal mínima; nada concreto a muestrear.', en: 'Minimal signal; nothing concrete to sample.' }, approach: { es: 'Transpedicular derecho.', en: 'Right transpedicular.' }, safety: { es: 'Cordón y pleura; señal demasiado baja.', en: 'Cord and pleura; signal too low.' }, rend: { es: 'Bajo (el menor).', en: 'Low (the lowest).' } },
  7: { zone: { es: 'El componente blando epidural sería el mejor tejido — nunca el core blástico.', en: 'The epidural soft-tissue component would be the best tissue — never the blastic core.' }, approach: { es: 'El tejido que rinde es epidural/canal.', en: 'The yielding tissue is epidural/canal.' }, safety: { es: 'Pegado al cordón y a las raíces: el radiólogo intervencionista marca D11 como nivel a evitar por la extensión epidural anterior.', en: 'Against the cord and roots: interventional radiology marks D11 as a level to avoid due to the anterior epidural extension.' }, rend: { es: 'Alto si el tejido blando fuera accesible; el acceso lo veta la seguridad.', en: 'High if the soft tissue were reachable; access is vetoed by safety.' } },
  8: { zone: { es: 'Pedículo blástico estrecho; sin buena zona.', en: 'Narrow blastic pedicle; no good zone.' }, approach: { es: 'Transpedicular al pedículo izquierdo de T11.', en: 'Transpedicular to the left T11 pedicle.' }, safety: { es: 'Junto a la enfermedad epidural de #7.', en: 'Adjacent to the epidural disease of #7.' }, rend: { es: 'Bajo.', en: 'Low.' } },
  9: { zone: { es: 'Apófisis espinosa pequeña; sin zona útil.', en: 'Small spinous process; no useful zone.' }, approach: { es: 'Posterior a la apófisis espinosa L1.', en: 'Posterior to the L1 spinous process.' }, safety: { es: 'Lumbar (más seguro) pero pequeño y posterior.', en: 'Lumbar (safer) but small and posterior.' }, rend: { es: 'Bajo / riesgo de no-diagnóstico.', en: 'Low / non-diagnostic risk.' } },
  10: { zone: { es: 'El propio foco FDG-ávido (el clon glucolítico único).', en: 'The FDG-avid focus itself (the unique glycolytic clone).' }, approach: { es: 'Transpedicular izquierdo de L1; fusión TC+PET (señal solo FDG).', en: 'Left L1 transpedicular; CT+PET fusion (FDG-only signal).' }, safety: { es: 'Lumbar, bajo el cono (más seguro); pedículo pequeño → diana técnicamente difícil.', en: 'Lumbar, below the conus (safer); small pedicle → technically hard target.' }, rend: { es: 'Moderado; biología ortogonal de alto valor.', en: 'Moderate; high-value orthogonal biology.' } },
  11: { zone: { es: 'Subvolumen mixto/ávido del cuerpo grande (sin componente blástico marcado).', en: 'Mixed/avid subvolume of the large body (no marked blastic component).' }, approach: { es: 'Transpedicular bajo el cono, si la trayectoria libra la cresta ilíaca.', en: 'Transpedicular below the conus, if the trajectory clears the iliac crest.' }, safety: { es: 'En tratamiento con SBRT (radioterapia): el tejido irradiado es menos representativo para el muestreo molecular → baja prioridad pese a la señal. Acceso: alta carga, pero el cuerpo grande lo tolera mejor que el cuello femoral.', en: 'Under SBRT (radiotherapy): irradiated tissue is less representative for molecular sampling → low priority despite the signal. Access: high load, but the large body tolerates it better than the femoral neck.' }, rend: { es: 'Baja por la SBRT (tejido irradiado), aunque el cuerpo sea grande.', en: 'Low due to SBRT (irradiated tissue), despite the large body.' } },
  12: { zone: { es: 'Zona mixta-ávida del ala sacra esponjosa.', en: 'Mixed-avid zone of the cancellous sacral ala.' }, approach: { es: 'Corredor sacro-posterior (prono).', en: 'Posterior sacral corridor (prone).' }, safety: { es: 'Vigilar los forámenes sacros y los vasos presacros; sin cordón.', en: 'Watch the sacral foramina and presacral vessels; no cord.' }, rend: { es: 'Moderado (accesible).', en: 'Moderate (accessible).' } },
  13: { zone: { es: 'Solo una zona LÍTICA DIFERENTE verificada en TC; la zona blástica previa falló.', en: 'Only a DIFFERENT lytic zone verified on CT; the prior blastic zone failed.' }, approach: { es: 'Posterolateral al ala ilíaca (corredor conocido del 26B585); fusión PET a zona más ávida/menos esclerótica.', en: 'Posterolateral to the iliac wing (the known 26B585 corridor); PET fusion to a more avid/less sclerotic zone.' }, safety: { es: 'Acceso seguro y familiar; aquí el riesgo es de no-diagnóstico, no de lesión.', en: 'Safe, familiar access; here the risk is non-diagnostic, not injury.' }, rend: { es: 'Riesgo de no-diagnóstico probado en la zona previa.', en: 'Proven non-diagnostic risk at the prior zone.' } },
  14: { zone: { es: 'Subvolumen FDG-ávido, verificando en TC que NO es la placa esclerótica (lo que falló en el 26B585).', en: 'FDG-avid subvolume, verifying on CT it is NOT the sclerotic plate (what failed in 26B585).' }, approach: { es: 'Posterolateral supra-acetabular respetando el techo de carga; fusión PET para centrar el foco.', en: 'Posterolateral supra-acetabular sparing the load-bearing dome; PET fusion to center the focus.' }, safety: { es: 'Corredor accesible y conocido; verificar densidad TC antes de puncionar.', en: 'Accessible, known corridor; verify CT density before puncturing.' }, rend: { es: 'Alto esperado (FDG alto creciente, tamaño, sin blástico marcado).', en: 'High expected (high rising FDG, size, no marked blastic).' } },
  15: { zone: { es: 'En espera de correlación; señal posiblemente contaminada.', en: 'Awaiting correlation; signal possibly contaminated.' }, approach: { es: 'Espejo de #14, posterolateral supra-acetabular izquierdo.', en: 'Mirror of #14, left posterolateral supra-acetabular.' }, safety: { es: 'Posible contaminación intestino/vejiga → validar primero; el #14 (derecho) está mejor respaldado.', en: 'Possible bowel/bladder contamination → validate first; #14 (right) is better supported.' }, rend: { es: 'Bajo / incierto (señal no fiable).', en: 'Low / uncertain (unreliable signal).' } },
  16: { zone: { es: 'Subvolumen intraóseo ávido (sin asa extraósea).', en: 'Avid intra-osseous subvolume (no extraosseous handle).' }, approach: { es: '—', en: '—' }, safety: { es: 'Cuello femoral de carga crítica: extraer cores conlleva riesgo de fractura patológica. El abordaje y la indicación los valoran RadOnc/ortopedia.', en: 'Critical weight-bearing femoral neck: taking cores carries pathologic-fracture risk. Approach and indication are assessed by RadOnc/orthopedics.' }, rend: { es: 'Metabolismo alto, condicionado por la seguridad estructural.', en: 'High metabolism, gated by structural safety.' } },
  17: { zone: { es: 'Sin zona accionable (IA, no localizable, ≤8 mm).', en: 'No actionable zone (AI, not localizable, ≤8 mm).' }, approach: { es: '—', en: '—' }, safety: { es: 'IA sin confirmar; costilla con riesgo de neumotórax; validar primero (Medicina Nuclear).', en: 'Unconfirmed AI; rib with pneumothorax risk; validate first (Nuclear Medicine).' }, rend: { es: 'No evaluable.', en: 'Not assessable.' } },
  18: { zone: { es: 'Sin zona fiable (IA, solapa la región de #13).', en: 'No reliable zone (AI, overlaps the #13 region).' }, approach: { es: '—', en: '—' }, safety: { es: 'IA sin confirmar; FDG bajo; validar o evitar.', en: 'Unconfirmed AI; low FDG; validate or avoid.' }, rend: { es: 'Bajo / no-diagnóstico.', en: 'Low / non-diagnostic.' } },
  19: { zone: { es: 'Sin zona fiable (IA, FDG quizá fisiológico cervical).', en: 'No reliable zone (AI, FDG perhaps physiologic cervical).' }, approach: { es: '—', en: '—' }, safety: { es: 'IA sin confirmar; corredor cervicotorácico difícil; validar primero.', en: 'Unconfirmed AI; difficult cervicothoracic corridor; validate first.' }, rend: { es: 'Bajo / no-diagnóstico.', en: 'Low / non-diagnostic.' } },
}
const selBiopsy = computed(() => BIOPSY[selected.value])

/* ------------------------------------------------------------------ */
/*  NAVEGADOR · dos modos conmutables (segmented control)              */
/*  'skeleton' → el esqueleto SVG compacto (+ tiempo + filtros)         */
/*  'table'    → la lista/tabla de focos compacta y clicable            */
/*  La SELECCIÓN (`selected`) es la misma en ambos modos → persiste al  */
/*  cambiar de modo; los dos actualizan al instante el 3D + el resumen. */
const navMode = ref<'skeleton' | 'table'>('skeleton')

/* trazador dominante de un foco (el de más SUVmáx). Es FORMA/dato, no biología. */
function domTracer(le: Lesion): 'ga' | 'fdg' {
  if (le.dota == null) return 'fdg'
  if (le.fdg == null) return 'ga'
  return le.dota >= le.fdg ? 'ga' : 'fdg'
}

/* ------------------------------------------------------------------ */
/*  KEY-IMAGES POR FOCO (decisión del comité)                          */
/*  Corte CT+PET fusionado con un anillo marcando el SUVmáx y etiqueta. */
/*  El MANIFEST se deriva de los ficheros REALES en                     */
/*  public/metastasis/foco-key/ (no referenciar imágenes inexistentes): */
/*    · axial  foco-{id}.png  → existe para los 19 focos                 */
/*    · sag    foco-{id}-sag.png → solo 01,02,04–12 (columna/sacro)      */
/*    · cor    foco-16-cor.png   → solo el fémur (#16)                   */
/*  Casos IA sin círculo fiable:                                         */
/*    · #17 → axial con ANILLO punteado «aprox/por confirmar» (foco puntual) */
/*    · #19 → sagital cervicotorácico con ELIPSE punteada grande sobre la    */
/*           zona candidata de la IA (región aprox. C7-D2; no localizable     */
/*           con fiabilidad por z) «aprox/por confirmar». La paciente pidió    */
/*           enseñar su imagen aunque no haya círculo fiable, no una nota.     */
type KeyPlane = 'axial' | 'sag' | 'cor'
/* ids con sagital y/o coronal disponibles (resto: solo axial) */
const FOCO_KEY_SAG = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12])
const FOCO_KEY_COR = new Set([16])
/* #17 y #19: marca PUNTEADA (localización aproximada · por confirmar). La PNG
   ya lleva la marca aproximada dibujada (anillo en #17, elipse en #19); aquí
   solo se muestra su miniatura pulsable + el flag «IA · aprox.». Ningún foco
   queda como celda-nota vacía. */
const FOCO_KEY_DOTTED = new Set([17, 19]) // marca «aprox/por confirmar»
const FOCO_KEY_NOTE_ONLY = new Set<number>() // (vacío) — todos los focos IA muestran imagen
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
    'Imagen clave reconstruida del PET-CT: el anillo señala el SUVmáx (un vóxel); fusión aproximada por resolución y co-registro. No es una relectura formal — la firman los radiólogos.',
    'Key image reconstructed from the PET-CT: the ring marks the SUVmax (a single voxel); fusion is approximate due to resolution and co-registration. Not a formal re-read — the radiologists sign it off.',
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
  petLightboxOpen.value = false; bone3dFullscreen.value = false // exclusividad: un modal a la vez
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
  petLightboxOpen.value = false; bone3dFullscreen.value = false // exclusividad: un modal a la vez
  keyLightboxOpen.value = true
}
/* si cambia el foco seleccionado mientras está abierto, resetea el plano al axial.
   Excepción: cuando la apertura viene de la galería ya fija el plano correcto. */
watch(selected, () => { if (!keyLightboxOpen.value) keyPlane.value = 'axial' })

/* ---- GALERÍA navegable del lightbox de key-images (petición paciente:
   «al abrir una, poder RECORRER TODAS»). El conjunto ordenado son los focos
   con imagen fiable, en el orden de la lista de idoneidad (focusListItems).
   Pasar de uno al siguiente salta foco a foco con openKeyLightboxFor. */
const keyLbList = computed<Lesion[]>(() => focusListItems.value.filter((l) => focoKey(l).hasReliable))
const keyLbIndex = computed<number>(() => keyLbList.value.findIndex((l) => l.id === selected.value))
const keyLbCount = computed<number>(() => keyLbList.value.length)
function keyLbStep(delta: number) {
  const list = keyLbList.value
  if (!list.length) return
  const i = keyLbIndex.value
  const ni = ((((i < 0 ? 0 : i) + delta) % list.length) + list.length) % list.length
  openKeyLightboxFor(list[ni].id, 'axial')
}

/* ------------------------------------------------------------------ */
/*  LIGHTBOX de la IMAGEN REAL (pestañas MIP / PET) — petición paciente: */
/*  ampliar en popup grande con zoom y poder ver «las 4 a la vez» (las 4 */
/*  PET: MIP Galio, MIP FDG, sagital Galio, sagital FDG) en cuadrícula   */
/*  2×2 para compararlas de golpe. Reutiliza ImageZoomViewer (mismo visor */
/*  de zoom/pan) y el mismo patrón de modal/Teleport que la key-image.   */
interface PetImg { src: string; tracer: 'ga' | 'fdg'; kind: 'mip' | 'sag'; es: string; en: string }
const PET_IMGS: PetImg[] = [
  { src: '/metastasis/gal_mip_gray.jpg', tracer: 'ga', kind: 'mip', es: 'MIP · ⁶⁸Ga-DOTATOC (receptor)', en: 'MIP · ⁶⁸Ga-DOTATOC (receptor)' },
  { src: '/metastasis/fdg_mip_gray.jpg', tracer: 'fdg', kind: 'mip', es: 'MIP · ¹⁸F-FDG (azúcar)', en: 'MIP · ¹⁸F-FDG (sugar)' },
  { src: '/metastasis/gal_spine.jpg', tracer: 'ga', kind: 'sag', es: 'Columna sagital · ⁶⁸Ga-DOTATOC (receptor)', en: 'Sagittal spine · ⁶⁸Ga-DOTATOC (receptor)' },
  { src: '/metastasis/fdg_spine.jpg', tracer: 'fdg', kind: 'sag', es: 'Columna sagital · ¹⁸F-FDG (azúcar)', en: 'Sagittal spine · ¹⁸F-FDG (sugar)' },
]
function petTracerColor(p: PetImg): string { return p.tracer === 'ga' ? '#9d44ab' : '#bb4128' }
/* abierto + modo: 'single' (una ampliada) | 'grid' (las 4 PET a la vez 2×2) */
const petLightboxOpen = ref(false)
const petLightboxMode = ref<'single' | 'grid'>('single')
const petLightboxSrc = ref<string>(PET_IMGS[0].src)
/* escala de color de las MIP: GRIS por defecto (más diagnóstica, menos dramática:
   en «hot» lo más brillante es biodistribución fisiológica y se lee mal como tumor);
   «hot» como toggle opcional. Solo afecta a las 2 MIP (las sagitales no tienen variante). */
const mipHot = ref(false)
function petDisplaySrc(src: string): string {
  return mipHot.value && src.includes('_mip_gray') ? src.replace('_mip_gray', '_mip_hot') : src
}
const petLightboxImg = computed(() => PET_IMGS.find((p) => p.src === petLightboxSrc.value) ?? PET_IMGS[0])
function openPetLightbox(src: string) {
  petLightboxMode.value = 'single'
  petLightboxSrc.value = src
  keyLightboxOpen.value = false; bone3dFullscreen.value = false // exclusividad: un modal a la vez
  petLightboxOpen.value = true
}
/* (auditoría) openPetGrid eliminado junto al botón «Ver las 4»: la cuadrícula se
   alcanza DENTRO del lightbox (petLightboxShowGrid), al ampliar una imagen. */
function closePetLightbox() { petLightboxOpen.value = false }
/* dentro del popup: de la cuadrícula → ampliar una sola; de una sola → volver a las 4 */
function petLightboxShowSingle(src: string) { petLightboxSrc.value = src; petLightboxMode.value = 'single' }
function petLightboxShowGrid() { petLightboxMode.value = 'grid' }
/* GALERÍA navegable de las imágenes de estudio (las 4 PET) — recorrer todas con
   flechas + contador «n / N». Solo en modo «una» (en cuadrícula se ven todas). */
const petLbIndex = computed<number>(() => PET_IMGS.findIndex((p) => p.src === petLightboxSrc.value))
function petLbStep(delta: number) {
  const n = PET_IMGS.length
  const i = petLbIndex.value
  const ni = ((((i < 0 ? 0 : i) + delta) % n) + n) % n
  petLightboxSrc.value = PET_IMGS[ni].src
}
function onPetLightboxEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') { closePetLightbox(); return }
  if (e.key === 'Tab') { trapTab(e, petLbEl.value); return }
  if (petLightboxMode.value !== 'single') return
  if (e.key === 'ArrowRight') { petLbStep(1); e.preventDefault() }
  else if (e.key === 'ArrowLeft') { petLbStep(-1); e.preventDefault() }
}
watch(petLightboxOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) { document.addEventListener('keydown', onPetLightboxEsc); openDialogA11y(petLbEl) }
  else { document.removeEventListener('keydown', onPetLightboxEsc); closeDialogA11y() }
})

/* ------------------------------------------------------------------ */
/*  OVERLAY «VER EN GRANDE» del visor 3D — petición paciente: el visor  */
/*  en línea va contenido y un botón lo abre a pantalla completa con los */
/*  3 mapas grandes. Reutiliza BoneTriView TAL CUAL (otra instancia con  */
/*  el mismo `mesh-key`); rotación sincronizada DENTRO de cada instancia. */
/*  Cierre Esc/botón/backdrop, bloqueo de scroll, role=dialog (a11y).    */
const bone3dFullscreen = ref(false)
function openBone3dFullscreen() { keyLightboxOpen.value = false; petLightboxOpen.value = false; bone3dFullscreen.value = true } // exclusividad: un modal a la vez
function closeBone3dFullscreen() { bone3dFullscreen.value = false }
function onBone3dEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') { closeBone3dFullscreen(); return }
  if (e.key === 'Tab') trapTab(e, bone3dLbEl.value)
}
watch(bone3dFullscreen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) { document.addEventListener('keydown', onBone3dEsc); openDialogA11y(bone3dLbEl) }
  else { document.removeEventListener('keydown', onBone3dEsc); closeDialogA11y() }
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
/* desplazamiento que respeta prefers-reduced-motion (a11y): 'auto' si el usuario
   pide menos movimiento, 'smooth' si no. Se usa en todos los scrollIntoView de JS. */
function smoothOrAuto(): ScrollBehavior {
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto'
  return 'smooth'
}
function goToMRI() {
  // sin pestañas: la RMN vive bajo la sección «imagen real» → desplaza a ella
  if (import.meta.client) nextTick(() => document.getElementById('imagen')?.scrollIntoView({ behavior: smoothOrAuto(), block: 'start' }))
}
// Resumen «Dianas idóneas» (Zona 1, arriba) → ancla al cálculo completo (#idoneidad,
// en la wiki). Respeta prefers-reduced-motion y lleva el foco al título (a11y).
function jumpToIdoneidad(e: Event) {
  if (!import.meta.client) return
  const el = document.getElementById('idoneidad')
  if (!el) return
  e.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function visible(le: Lesion): boolean {
  if (filter.value === 'all') return true
  if (filter.value === 'new') return isNewFocus(le)          // foco que enciende por primera vez (FDG)
  if (filter.value === 'ia') return sourceOf(le) === 'ia-david' // detectado por IA (por confirmar)
  if (filter.value === 'mix') return le.pheno === 'mixNe' || le.pheno === 'mixBal' || le.pheno === 'mixAgg' // mixtos fundidos
  return le.pheno === filter.value
}
function pick(id: number) { selected.value = id }
/* (ficha resumen) ir directo al DETALLE del comité de ese foco: selecciona + abre el
   <details id="detalle-foco"> (que ya hace scroll). */
function pickAndShowDetalle(id: number) { pick(id); openDetalle() }
/* marca de diana en la ficha: ◆ cian (mismo color que el anillo del 3D) si es puncionable;
   ⊘ gris si no procede como punto de punción (fémur de carga, epidural, IA o a validar). */
function dianaMk(le: Lesion): { mk: string; color: string } {
  const blocked = le.id === 16 || le.id === 7 || le.id === 15 || isAiDavid(le)
  return blocked ? { mk: '⊘', color: '#6b6470' } : { mk: '◆', color: '#39c0e0' }
}
/* selección DESDE LA WIKI (Zona 2: idoneidad, fenotipo, tabla, enlaces): además de
   seleccionar, trae el visor/ficha (#mapa, Zona 1) a la vista — sin él, el único
   sitio donde el foco se ve en 3D queda fuera de pantalla y se rompe el bucle
   «elijo diana → la veo». Respeta prefers-reduced-motion. */
function pickAndShow(id: number) {
  pick(id)
  if (import.meta.client) nextTick(() => document.getElementById('mapa')?.scrollIntoView({ behavior: smoothOrAuto(), block: 'start' }))
}

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
/* (multi-foco · plan web+DS) nº de focos que comparten VÉRTEBRA con `le` (D11 #7+#8,
   L1 #9+#10). Solo vértebra (NO la malla 3D del ilíaco, que vive en el panel 3D).
   Drive del chip «N focos» (pill-data--berenjena) para identificarlo en toda la herramienta. */
function coCount(le: Lesion): number {
  const k = groupKey(le)
  return LES.filter((l) => groupKey(l) === k).length
}
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
/* «foco nuevo» y «detectado por IA» son ahora chips de la fila de filtros
   (vía visible()); el grupo aparece si alguno de sus focos pasa el filtro. */
function groupVisible(g: LesGroup): boolean {
  return g.foci.some(visible)
}
function gPresentAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => presentAt(l, f)) }
/* TAMAÑO UNIFORME del marcador del esqueleto: un solo radio para todos los grupos.
   El SUVmáx ya está en el scatter, en la tabla y en la ficha; aquí el marcador solo
   localiza el foco (color = trazador, número = id). Sin tamaño ∝ SUVmáx. */
const SK_R = 9
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

/* ── A11y de los lightbox (patrón ARIA dialog): al abrir, mover el foco dentro del
   panel; atrapar Tab/Shift+Tab; al cerrar, devolver el foco al disparador. Lo
   comparten los 3 modales (imagen clave, PET, visor 3D a pantalla completa). ── */
const keyLbEl = ref<HTMLElement | null>(null)
const petLbEl = ref<HTMLElement | null>(null)
const bone3dLbEl = ref<HTMLElement | null>(null)
let lastFocusedEl: HTMLElement | null = null
const LB_FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
function lbFocusables(el: HTMLElement | null): HTMLElement[] {
  return el ? [...el.querySelectorAll<HTMLElement>(LB_FOCUSABLE)].filter((n) => n.offsetParent !== null) : []
}
function openDialogA11y(elRef: { value: HTMLElement | null }) {
  if (!import.meta.client) return
  lastFocusedEl = document.activeElement as HTMLElement | null
  nextTick(() => { const f = lbFocusables(elRef.value); (f[0] ?? elRef.value)?.focus() })
}
function closeDialogA11y() {
  if (import.meta.client) lastFocusedEl?.focus?.()
}
function trapTab(e: KeyboardEvent, el: HTMLElement | null) {
  if (e.key !== 'Tab') return
  const items = lbFocusables(el)
  if (!items.length) return
  const first = items[0], last = items[items.length - 1], a = document.activeElement
  if (e.shiftKey && (a === first || !el?.contains(a))) { last.focus(); e.preventDefault() }
  else if (!e.shiftKey && (a === last || !el?.contains(a))) { first.focus(); e.preventDefault() }
}

/* lightbox de la imagen clave: bloqueo de scroll del body + Escape para cerrar +
   flechas ←/→ para recorrer la galería + Tab atrapado dentro (a11y). */
function onKeyLightboxEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') { closeKeyLightbox(); return }
  if (e.key === 'Tab') { trapTab(e, keyLbEl.value); return }
  if (e.key === 'ArrowRight') { keyLbStep(1); e.preventDefault() }
  else if (e.key === 'ArrowLeft') { keyLbStep(-1); e.preventDefault() }
}
watch(keyLightboxOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) { document.addEventListener('keydown', onKeyLightboxEsc); openDialogA11y(keyLbEl) }
  else { document.removeEventListener('keydown', onKeyLightboxEsc); closeDialogA11y() }
})
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeyLightboxEsc)
    document.removeEventListener('keydown', onPetLightboxEsc)
    document.removeEventListener('keydown', onBone3dEsc)
  }
})

const dateLabel = computed(() => FDATES[frame.value][lang.value])

/* ¿la lesión capta en la fecha / trazador actual? */
function presentAt(le: Lesion, f: number): boolean {
  return f === 2 ? le.dota != null : valAt(le, f) != null
}

/* gráfica de evolución del SUVmáx para la lesión seleccionada */
/* solo FDG (el Galio tiene una única medición → no hay evolución que dibujar) */
const hasFdgEvo = computed(() => sel.value.fdg != null && sel.value.prevFdg != null)
const noEvoLabel = computed(() => {
  const le = sel.value
  if (isAiDavid(le) && le.fdg != null)
    return L('Detectado por IA: medición única aproximada sobre el DICOM, sin serie temporal con la que comparar (no se marca «nuevo»).', 'AI-detected: a single approximate DICOM measurement, with no time series to compare (not marked “new”).')
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
    g += `<line x1="${padL}" y1="${Y(yy).toFixed(1)}" x2="${W - padR}" y2="${Y(yy).toFixed(1)}" stroke="#eee6da"/><text x="${padL - 4}" y="${(Y(yy) + 3).toFixed(1)}" text-anchor="end" font-family="monospace" font-size="8" fill="#6b6470">${yy}</text>`
  }
  for (let f = 0; f < 2; f++) {
    g += `<text x="${X(f).toFixed(1)}" y="${H - 9}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b6470">${FDATES[f][lang.value].split(' ')[0]}</text>`
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

/* Filtros mínimos (de más a menos útil para elegir diana). Los tres fenotipos
   (solo receptor · mixto · solo azúcar) mapean al degradado; «Mixto» funde los
   dos mixtos. Más los dos FLAGS no obvios: nuevo y detectado por IA. Quitado
   «Hueso de carga» (no decide diana; sigue en la ficha y en idoneidad). */
const filters = computed<{ key: FilterKey; label: string; c?: string }[]>(() => [
  { key: 'all', label: L('Todas', 'All') },
  { key: 'ne', label: L('Solo receptor', 'Receptor only'), c: PHENO.ne.c },
  { key: 'mix', label: L('Mixto', 'Mixed'), c: PHENO.mixBal.c },
  { key: 'agg', label: L('Solo azúcar', 'Sugar only'), c: PHENO.agg.c },
  { key: 'new', label: L('Nuevo', 'New') + ` (${newCount.value})`, c: '#bb4128' },
  { key: 'ia', label: L('IA · por confirmar', 'AI · to confirm') + ` (${aiFoci.value.length})`, c: '#6b6470' },
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
/* (auditoría fidelidad) SUV honesto: los focos detectados por IA (#17/#18/#19) NO son
   medibles con fiabilidad según la re-medición DICOM → se muestran como aproximación «~»
   con 1 decimal, nunca con 2 (que sugieren una precisión cuantitativa que la fuente no da). */
function fmtSuv(le: Lesion, v: number | null | undefined): string {
  if (v == null) return '—'
  return (isAiDavid(le) ? '~' : '') + v.toFixed(isAiDavid(le) ? 1 : 2)
}
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
/* TAMAÑO UNIFORME del marcador del scatter: la POSICIÓN ya codifica los dos SUV
   (eje X = FDG, eje Y = Galio); el tamaño NO añade dato → todos los puntos iguales.
   El SUVmáx se lee en los ejes, en la tabla y en la ficha. */
const DOT_R = 8.5
const quadDots = computed(() => {
  const dots = LES.map((le) => {
    const r = DOT_R
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
  // mantén los puntos dentro del área de dibujo (no se salgan por los ejes) y
  // REDONDEA a 2 decimales: jitter() usa Math.sin y el desencimado Math.hypot,
  // que NO están garantizados bit-a-bit idénticos entre el V8 del servidor y el
  // del navegador (difieren en el último ULP) → cx/cy distintos por ~1e-13 →
  // desajuste de hidratación. Redondear (sub-píxel, idéntico a la vista) hace
  // que el string del atributo sea el mismo en SSR y cliente y elimina el error.
  const minX = qX(0) + 2, maxX = Q.W - 2, minY = Q.padT + 2, maxY = qY(0) - 2
  const r2 = (n: number) => Math.round(n * 100) / 100
  dots.forEach((d) => {
    d.px = r2(Math.max(minX + d.r * 0.4, Math.min(maxX, d.px)))
    d.py = r2(Math.max(minY, Math.min(maxY - d.r * 0.4, d.py)))
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
    out.push({ tone: 'neutral', es: `FDG menor que en el estudio previo (antes ${l.prevFdg}).`, en: `FDG lower than in the prior study (was ${l.prevFdg}).` })
  if (l.dota == null && l.fdg != null)
    out.push({ tone: 'warn', es: 'Discordante: capta azúcar (FDG) pero no receptor (Galio).', en: 'Discordant: sugar-avid (FDG) but no receptor (gallium).' })
  if (l.load)
    out.push({ tone: 'neutral', es: 'Hueso de carga (soporta peso). en seguimiento por Oncología Radioterápica.', en: 'Weight-bearing bone. under follow-up by Radiation Oncology.' })
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
  11: { gaAuto: 12.07, gaMtv: 12.86, gaMorph: 'blástica', fdgAuto: 5.82, fdgMtv: 0.34, fdgTlg: 1.1, fdgMorph: 'blástica' },
  12: { gaAuto: 4.2, gaMtv: 0.83, gaMorph: 'blástica', fdgAuto: 4.66, fdgMtv: 0.4, fdgTlg: 1.3, fdgMorph: 'lítica/medular' },
  13: { gaAuto: 4.3, gaMtv: 0.7, gaMorph: 'mixta', fdgAuto: 7.71, fdgMtv: 3.0, fdgTlg: 12.5, fdgMorph: 'mixta' },
  14: { gaAuto: 3.93, gaMtv: 1.41, gaMorph: 'mixta', fdgAuto: 9.33, fdgMtv: 0.93, fdgTlg: 3.7, fdgMorph: 'blástica' },
  15: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 6.71, fdgMtv: 0.44, fdgTlg: 1.4, fdgMorph: 'blástica' },
  16: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: 9.43, fdgMtv: 6.83, fdgTlg: 29.3, fdgMorph: 'mixta' },
  17: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  18: { gaAuto: 4.3, gaMtv: 5.18, gaMorph: 'blástica', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
  19: { gaAuto: null, gaMtv: null, gaMorph: '', fdgAuto: null, fdgMtv: null, fdgTlg: null, fdgMorph: '' },
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
  // (auditoría fidelidad) si las DOS llamadas automáticas discrepan y NADA las confirma
  // (sin scler ni informe/RMN), la "mixta" sería un artefacto de segmentación, no una
  // forma establecida → se degrada a «s/c · por confirmar», no se afirma morfología.
  const autoDiscordant = cats.size > 1
  if (le.scler) cats.add('blástica')
  if (cats.size === 0) return null
  if (autoDiscordant && !le.scler) return null
  if (cats.size === 1) return [...cats][0]
  return 'mixta'   // confirmada (scler + otra forma) → mixta
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
  if (m === 'blástica') return L('Blástico / escleroso = hueso denso; suele rendir menos tejido tumoral.', 'Blastic / sclerotic = dense bone; usually yields less tumor tissue.')
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
/* lesiones con hueso 3D reconstruido del CT (IA, TotalSegmentator) — frames en
   /metastasis/vertebra. Vértebras y huesos planos. Los 3 focos «detectados por IA»
   (#17 costilla, #18 ilíaco, #19 cervicotorácico) NO tienen malla propia de su
   localización exacta; para que TODOS se vean en el visor 3D se montan sobre el hueso
   reconstruido más cercano como REFERENCIA DE ZONA (escápula der. · ilíaco der. · D1/T1),
   con su estatus IA visible bajo el visor (no es localización fina, es por confirmar). */
const BONE3D_KEY: Record<number, string> = {
  1: 'C3', 2: 'C4', 3: 'ESCAPULA_R',
  4: 'D1', 5: 'D5', 6: 'D9', 7: 'D11', 8: 'D11', 9: 'L1', 10: 'L1', 11: 'L5',
  12: 'SACRO', 13: 'ILIACO_R', 14: 'ILIACO_R', 15: 'ILIACO_L', 16: 'FEMUR_R',
  // focos IA sobre el hueso reconstruido más próximo (referencia de zona · por confirmar):
  17: 'ESCAPULA_R', 18: 'ILIACO_R', 19: 'D1',
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
/*  Visor 3D «small multiples» (BoneTriView): el MISMO hueso mostrado    */
/*  3 VECES en paralelo y sincronizadas, cada vista un mapa LIMPIO de UNA */
/*  variable por vértice — Galio (teal) · FDG (ámbar) · Blástico (sepia). */
/*  Una sola cámara → rotar/zoom mueve las 3 a la vez. Ya NO hay selector */
/*  de modo: las 3 lecturas se ven a la vez (se sustituyen área/calor/    */
/*  morfología + gradiente/contorno del visor anterior, ya retirados).    */
/* ------------------------------------------------------------------ */

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
/* factor de captación de trazador (0-1): FDG (captación de azúcar) manda; Ga aporta la del receptor (SSTR) */
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
/* idoneidad compuesta 0-100 (orientativa). Producto de los tres factores de SEÑAL/forma ×
   penalización por SBRT (tejido irradiado). La biopsia previa fallida (#13) NO penaliza el
   score: falló por muestrear la zona densa equivocada (técnica/diana), no porque el foco sea
   malo — su señal es real. El aviso «ya falló aquí → re-orientar a zona lítica» lo lleva la
   tarjeta/ficha, no el número. */
function suitabilityScore(le: Lesion): number {
  return Math.round(100 * viableFactor(le) * yieldFactor(le) * sizeFactor(le) * (le.sbrt ? 0.4 : 1))
}
/* (ficha resumen) «por qué» de UNA línea por foco — describe SEÑAL + FORMA, nunca
   «tumor/viable». Bloqueantes primero; si no, captación + rendimiento. Equipa, no indica. */
function whyOneLiner(le: Lesion): string {
  if (le.priorBiopsy) return L('Biopsia previa fallida (26B585) por muestrear hueso denso, no la lesión; re-orientable a una zona lítica distinta.', 'Prior biopsy failed (26B585) by sampling dense bone, not the lesion; re-targetable to a different lytic zone.')
  if (le.id === 7) return L('La zona que rinde es epidural/canal — la seguridad la valora intervencionista.', 'The yielding zone is epidural/canal — safety judged by interventional radiology.')
  if (le.id === 16) return L('Hueso de carga crítico: extraer cores conlleva riesgo de fractura.', 'Critical weight-bearing bone: taking cores carries fracture risk.')
  if (isAiDavid(le)) return L('Detectado por IA, no consta en el informe — a validar antes.', 'AI-detected, not in the report — to validate first.')
  if (le.id === 15) return L('Señal posiblemente contaminada (vejiga/intestino) — a correlacionar.', 'Signal possibly contaminated (bladder/bowel) — to correlate.')
  if (le.sbrt) return L('En tratamiento con SBRT: tejido irradiado, menos representativo.', 'Under SBRT: irradiated tissue, less representative.')
  const t = trend(le)?.dir
  let cap: string
  if (le.fdg != null && le.fdg >= 8) cap = L('Capta mucho azúcar (FDG)', 'Takes up a lot of sugar (FDG)')
  else if (t === 'new') cap = L('Foco nuevo, capta azúcar', 'New focus, takes up sugar')
  else if (t === 'up') cap = L('El azúcar va a más', 'Sugar is rising')
  else if (le.dota != null && le.dota >= 10 && (le.fdg == null || le.fdg < le.dota)) cap = L('Máxima señal de receptor (Galio)', 'Top receptor signal (gallium)')
  else if (le.fdg != null && le.dota == null) cap = L('Discordante: solo azúcar, sin receptor', 'Discordant: sugar only, no receptor')
  else if (le.fdg != null && le.dota != null) cap = L('Señal mixta moderada', 'Moderate mixed signal')
  else cap = L('Señal baja, solo receptor', 'Low signal, receptor only')
  const m = morphCat(le)
  const yld = m === 'lítica' ? L('hueso no denso, suele rendir tejido', 'non-dense bone, usually yields tissue')
    : m === 'mixta' ? L('hueso mixto', 'mixed bone')
    : m === 'blástica' ? L('hueso denso (blástico), suele rendir poco', 'dense (blastic) bone, usually low yield')
    : L('forma por confirmar', 'shape to confirm')
  return cap + ' · ' + yld + '.'
}
/* palabra corta de forma (para las mini-barras de rendimiento) */
function morphShort(le: Lesion): string {
  const m = morphCat(le)
  if (m === 'lítica') return L('lítico · suele rendir', 'lytic · usually yields')
  if (m === 'mixta') return L('mixto', 'mixed')
  if (m === 'blástica') return L('blástico denso · suele rendir poco', 'dense blastic · usually low yield')
  return L('forma s/c', 'shape n/c')
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
/* (ficha resumen) los 19 ORDENADOS por idoneidad (confirmados primero, IA al final) para el
   grid de fichas-resumen «de un vistazo». No se filtra (la galería nunca se filtra). */
const fichaGrid = computed<Lesion[]>(() => [...rankedFoci.value, ...aiCandidates.value])
/* lista plana para el MODO TABLA del navegador: confirmados por idoneidad,
   luego los de IA (por confirmar) al final. Reutiliza rankedFoci/aiCandidates. */
const focusListItems = computed<Lesion[]>(() => [...rankedFoci.value, ...aiCandidates.value])
/* lista del navegador YA FILTRADA: el filtro (Solo receptor/Mixto/Solo azúcar/Nuevo/IA)
   gobierna el esqueleto, el scatter Y la lista del modo Tabla y las flechas prev/next,
   para que el alcance del filtro sea COHERENTE en todo el navegador (no una acción
   fantasma al cambiar a «Tabla»). La galería/lightbox de imágenes NO se filtra. */
const visibleFocusList = computed<Lesion[]>(() => focusListItems.value.filter(visible))
/* (D · plan comité web) búsqueda por nombre/zona en la lista del navegador: hace
   ENCONTRABLES los focos co-localizados (#8/#10) que en el esqueleto quedan bajo el
   marcador de su vértebra. Filtra por level+region, sin acentos. Solo la lista Tabla. */
const focoQuery = ref('')
function normTxt(s: string): string { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }
const filteredFocusList = computed<Lesion[]>(() => {
  const q = normTxt(focoQuery.value.trim())
  if (!q) return visibleFocusList.value
  return visibleFocusList.value.filter((le) => normTxt(le.level[lang.value] + ' ' + le.region[lang.value]).includes(q))
})
/* si el filtro deja fuera al foco seleccionado, autoselecciona el primero visible
   (evita que el visor muestre un foco que ya no está en el navegador). */
watch(filter, () => {
  const list = visibleFocusList.value
  if (list.length && !list.some((l) => l.id === selected.value)) pick(list[0].id)
})
/* paso prev/next entre focos VISIBLES en el ORDEN de la lista (flechas de la barra).
   Da la vuelta al llegar a los extremos. Posición actual = focoPos / visibles. */
function pickStep(delta: number) {
  const list = visibleFocusList.value
  if (!list.length) return
  const i = list.findIndex((l) => l.id === selected.value)
  const ni = ((((i < 0 ? 0 : i) + delta) % list.length) + list.length) % list.length
  pick(list[ni].id)
}
const focoPos = computed(() => visibleFocusList.value.findIndex((l) => l.id === selected.value) + 1)

/* ── (A · plan comité web) TOOLTIP de marcadores (esqueleto + scatter) ──────────────
   UN solo popover compartido, clonado del mecanismo de Term.vue (Teleport a <body>,
   posición fija con clamp al viewport + caret). El padre fija qué marcador está activo.
   La info ya vive en el aria-label de cada marcador → el tooltip es solo ACELERADOR
   visual (hover/focus); en táctil no se abre (gobierna el tap → selección + ficha). */
const tipOpen = ref(false)
const tipText = ref('')
const tipPositioned = ref(false)
const tipPlacement = ref<'top' | 'bottom'>('top')
const tipCaretLeft = ref(16)
const tipRef = ref<HTMLElement | null>(null)
let tipAnchor: Element | null = null
const tipStyle = reactive({ top: '0px', left: '0px', width: 'auto' })
const canHoverFine = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
function lesionTipText(le: Lesion): string {
  const ga = le.dota != null ? `⁶⁸Ga ${le.dota.toFixed(1)}` : '⁶⁸Ga —'
  const fdg = le.fdg != null ? `FDG ${le.fdg.toFixed(1)}` : 'FDG —'
  const ai = sourceOf(le) === 'ia-david' ? ` · ${L('por confirmar', 'to confirm')}` : ''
  return `${le.level[lang.value]} · ${ga} / ${fdg} · ${phenoLabel(le)}${ai}`
}
function groupTipText(g: LesGroup): string {
  if (g.multi) return `${g.primary.level[lang.value]} · ${g.foci.length} ${L('focos', 'foci')}`
  return lesionTipText(g.primary)
}
function positionTip() {
  const pop = tipRef.value
  if (!tipAnchor || !pop) return
  const margin = 8
  const r = tipAnchor.getBoundingClientRect()
  const popW = Math.min(280, window.innerWidth - margin * 2)
  tipStyle.width = `${popW}px`
  const left = Math.max(margin, Math.min(r.left + r.width / 2 - popW / 2, window.innerWidth - popW - margin))
  let top = r.top - pop.offsetHeight - 10
  tipPlacement.value = 'top'
  if (top < margin) { top = r.bottom + 10; tipPlacement.value = 'bottom' }
  tipStyle.top = `${top}px`
  tipStyle.left = `${left}px`
  tipCaretLeft.value = Math.max(14, Math.min(r.left + r.width / 2 - left, popW - 14))
  tipPositioned.value = true
}
async function showTip(e: Event, text: string) {
  if (!text) return
  tipAnchor = e.currentTarget as Element
  tipText.value = text
  tipOpen.value = true
  tipPositioned.value = false
  await nextTick()
  positionTip()
}
function hideTip() { tipOpen.value = false; tipAnchor = null }
watch(tipOpen, (o) => {
  if (typeof window === 'undefined') return
  if (o) { window.addEventListener('scroll', positionTip, true); window.addEventListener('resize', positionTip) }
  else { window.removeEventListener('scroll', positionTip, true); window.removeEventListener('resize', positionTip) }
})
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', positionTip, true)
  window.removeEventListener('resize', positionTip)
})
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
  <!-- overflow-x-clip: blinda el full-bleed de la zona wiki (calc(50%-50vw) puede asomar
       ~½ barra de scroll en navegadores con scrollbar persistente). `clip` NO crea
       contenedor de scroll → el sticky del rail sigue funcionando. -->
  <div class="overflow-x-clip">
    <section class="section-spacing" aria-label="Mapa de metástasis">
      <!-- ANCHO CENTRADO (ya no full-bleed tipo wiki): el panel se centra en una
           columna ancha pero ACOTADA (max-w 1280px + mx-auto). En monitores grandes
           queda centrado y la lectura no se dispersa; de paso la columna del visor
           3D se estrecha un poco. Padding lateral cómodo (px-4 → lg:px-8). -->
      <div class="px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <!-- Layout wiki · SIN ÍNDICE (petición paciente: «quitamos el índice,
             maquetamos bien»). El contenido (foci↔3D) usa TODO el ancho del
             viewport; las anclas (id/scroll-mt) de las secciones se conservan
             para los enlaces internos. La maqueta primaria pone NAVEGAR a la
             izquierda y el VISOR DE LA LESIÓN siempre a la derecha. -->
        <div class="min-w-0">
        <PageHeader
          :title="L('Mapa de metástasis', 'Metastasis map')"
          :subtitle="L(
            'Cada lesión ósea, vista con dos trazadores a la vez: el del receptor (Galio-68 DOTATOC) y el del azúcar (FDG). Una herramienta para que el equipo compare los focos, lesión a lesión, como candidatos a diana de rebiopsia — equipa, no indica.',
            'Every bone lesion, seen with two tracers at once: the receptor tracer (Gallium-68 DOTATOC) and the sugar tracer (FDG). A tool for the team to compare the foci, lesion by lesion, as rebiopsy-target candidates — it equips, it does not indicate.')"
          :tag="L('PET doble trazador · ' + confirmedFoci.length + ' focos · +' + aiFoci.length + ' por confirmar', 'Dual-tracer PET · ' + confirmedFoci.length + ' foci · +' + aiFoci.length + ' to confirm')"
        />

        <!-- Aviso PERSISTENTE · herramienta de APOYO (petición de la paciente:
             que se diga «todo el rato»). El titular del disclaimer va SIEMPRE
             visible con el callout canónico del DS (.alert-callout, migrado en
             #111). El detalle de método (estudios, SUV, reconstrucción) queda
             plegado debajo para no empujar lo primario, pero el encuadre
             «apoyo, no diagnóstico» no se esconde nunca. role=note → el lector
             de pantalla lo anuncia. -->
        <div class="alert-callout mb-6" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
          {{ L(
            'Es el caso de Miriam, abierto para entender su enfermedad y decidir mejor con su equipo médico — no sustituye su criterio. Deciden sus médicos.',
            'This is Miriam’s case, opened to understand her disease and to decide better with her medical team — it does not replace their judgment. Her doctors decide.') }}
          <details class="mt-2.5 group">
            <summary class="cursor-pointer font-semibold list-none inline-flex items-center gap-1.5">
              <Icon name="ph:caret-right" class="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
              {{ L('De dónde salen los datos', 'Where the data comes from') }}
            </summary>
            <p class="mt-2">
            {{ L(
              'Esta página reúne y visualiza los estudios propios de Miriam (PET-FDG 24/03/2026, PET Galio-68 DOTATOC 26/05/2026 y la RMN de columna cervical y dorsal). Los SUV son los de los informes oficiales del PET; las imágenes (PET y RMN) se reconstruyeron desde los DICOM. La RMN se muestra para verla: su lectura formal corresponde al radiólogo.',
              'This page gathers and visualizes Miriam’s own studies (FDG-PET 24/03/2026, Ga-68 DOTATOC PET 26/05/2026 and the cervical and thoracic spine MRI). SUVs are those of the official PET reports; the images (PET and MRI) were reconstructed from the DICOM. The MRI is shown for viewing: its formal reading belongs to the radiologist.') }}
            </p>
          </details>
        </div>

        <!-- ╔══════════════ ZONA 1 · «Análisis de la lesión» (la herramienta, SIN menú) ══════════════╗
             La herramienta limpia: el cintillo de contexto (cockpit, order-1) y el
             héroe navegar-focos ↔ ver-en-3D (mapa, order-2). NADA de índice aquí: la
             herramienta queda despejada. Debajo, una DIVISIÓN CLARA abre la Zona 2. -->

        <!-- CONTEXTO PRIMERO · el panorama (enfermedad ósea + evolución) abre la
             página; luego «Dianas idóneas» (order-1) y el héroe navegar-focos ↔ 3D
             (order-2). Petición de la paciente: contexto general arriba, foco a foco
             debajo, el desglose a fondo en la wiki. El cintillo va CONDENSADO y con
             título de sección LIMPIO (sin caja); el desglose completo vive en #cockpit. -->
        <div class="flex flex-col">

        <!-- ===== CONTEXTO GENERAL · el caso de un vistazo (order-0: abre la página) =====
             Cuánta enfermedad hay y cómo evoluciona, antes de entrar foco a foco.
             Reusa los computeds del cockpit/trayectoria (mismas cifras, sin recalcular);
             el desglose a fondo sigue abajo. Título limpio, sin eyebrow ni badge. -->
        <section class="mb-14" aria-labelledby="contexto-general">
          <p class="eyebrow mb-2 block">{{ L('Contexto · el panorama', 'Context · the big picture') }}</p>
          <h2 id="contexto-general" class="heading-display text-2xl text-berenjena mb-1.5 scroll-mt-[7.5rem]">{{ L('Enfermedad ósea — el caso de un vistazo', 'Bone disease — the case at a glance') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">{{ L('Cuánta enfermedad hay y cómo evoluciona, antes de entrar foco a foco. Cifras descriptivas de los dos PET; describe, no concluye.', 'How much disease there is and how it is evolving, before going focus by focus. Descriptive figures from the two PET; it describes, it does not conclude.') }}</p>
          <!-- enfermedad · KPIs -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
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
          <!-- (auditoría) evolución condensada a UNA línea aquí (panorama); el detalle de los
               4 KPIs + el matiz «solo FDG, sin previo de Galio» viven en la sección «trayectoria»
               (antes se duplicaba el mismo grid en los dos sitios). -->
          <p class="text-sm text-tinta mt-1 leading-relaxed max-w-3xl">
            <span class="eyebrow--sm text-berenjena mr-1">{{ L('Evolución (FDG)', 'Evolution (FDG)') }}</span>{{ L((trajectory.up + trajectory.neu) + ' focos con azúcar al alza (incl. ' + trajectory.neu + ' nuevos), ' + trajectory.down + ' a la baja, ' + trajectory.stable + ' estables — solo FDG (ene→mar 2026). ', (trajectory.up + trajectory.neu) + ' foci with rising sugar (incl. ' + trajectory.neu + ' new), ' + trajectory.down + ' falling, ' + trajectory.stable + ' stable — FDG only (Jan→Mar 2026). ') }}<a href="#trayectoria" class="link-action text-miriam font-semibold whitespace-nowrap">{{ L('Ver la trayectoria ↓', 'See the trajectory ↓') }}</a>
          </p>
        </section>

        <!-- ===== DIANAS IDÓNEAS · RESUMEN (la respuesta primero · order-1) =====
             BLUF: al entrar, los focos mejor situados como diana de biopsia. Es el
             RESUMEN (las tarjetas «de un vistazo» que antes vivían en la idoneidad);
             cada tarjeta es CLICABLE → selecciona ese foco (pick) para que el
             navegador + 3D de abajo lo muestren al instante. El cálculo, los
             factores y el ranking completo viven en la wiki (#idoneidad). -->
        <section class="order-1 mb-14" aria-labelledby="dianas-resumen">
          <div class="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-2 mb-2">
            <div>
              <p class="eyebrow mb-1 block">{{ L('La respuesta primero · dónde mirar', 'The answer first · where to look') }}</p>
              <h2 id="dianas-resumen" class="heading-display text-2xl text-berenjena scroll-mt-[7.5rem]">{{ L('Dianas idóneas', 'Suitable targets') }}</h2>
            </div>
            <span class="status-badge status-badge--firma self-start mt-1">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
          </div>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L('Los focos mejor situados como diana de biopsia por las señales de imagen — captación (FDG/Ga), rendimiento del tejido y tamaño. Toca uno para verlo en el navegador y en 3D, justo abajo. Es un orden orientativo que EQUIPA al equipo médico; no es una orden de qué biopsiar.',
                  'The foci best placed as a biopsy target by the imaging signals — tracer uptake (FDG/Ga), tissue yield and size. Tap one to see it in the navigator and in 3D, right below. It is an indicative order that EQUIPS the medical team; it is not an instruction on what to biopsy.') }}
          </p>
          <div class="grid sm:grid-cols-3 gap-3">
            <button v-for="(le, i) in topCandidates" :key="le.id" type="button"
              @click="pickAndShow(le.id)"
              :aria-pressed="selected === le.id"
              class="text-left rounded-card border-2 px-3.5 py-3 transition-colors"
              :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.14)] bg-cream-card hover:border-[#9d44ab]'">
              <span v-if="focoKey(le).hasReliable" class="block rounded-lg overflow-hidden mb-2 bg-[#0d1117]" style="aspect-ratio:16/10"><img :src="fk(le.id, 'axial')" :alt="L('Imagen clave del foco #' + le.id, 'Key image of focus #' + le.id)" class="w-full h-full object-cover" loading="lazy" /></span>
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="w-3 h-3 shrink-0 rounded-full" :style="{ background: phenoColor(le), boxShadow: sourceOf(le) === 'ia-david' ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(le) : 'none' }" aria-hidden="true" />
                  <span class="font-semibold text-berenjena text-[13px] leading-tight truncate">{{ le.level[lang] }}</span>
                  <span class="font-mono text-[10px] text-tinta shrink-0">#{{ le.id }}</span>
                  <span v-if="coCount(le) > 1" class="pill-data pill-data--berenjena text-[10px] !px-1.5 !py-0 shrink-0" role="img" :aria-label="coCount(le) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(le) }} {{ L('focos', 'foci') }}</span>
                </span>
                <span class="text-right shrink-0">
                  <span class="font-display text-xl text-berenjena tabular-nums leading-none block">{{ suitabilityScore(le) }}</span>
                  <span class="eyebrow--sm">{{ L('idoneidad', 'suitability') }}</span>
                </span>
              </div>
              <p class="text-[10.5px] text-tinta leading-snug mt-1.5">{{ L('orden', 'rank') }} {{ i + 1 }} · FDG {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · Ga {{ le.dota != null ? le.dota.toFixed(1) : '—' }} · {{ morphShort(le) }}</p>
              <p class="text-[11px] text-tinta leading-snug mt-1"><span class="font-bold" :style="{ color: dianaMk(le).color }">{{ dianaMk(le).mk }}</span> <span class="font-semibold text-berenjena">{{ L('Diana', 'Target') }}:</span> {{ BIOPSY[le.id]?.zone[lang] }}</p>
              <p class="text-[11px] text-tinta leading-snug italic mt-0.5">«{{ whyOneLiner(le) }}»</p>
              <!-- aviso PROMINENTE si una biopsia ya falló aquí (no repetir el error de diana) -->
              <div v-if="le.priorBiopsy" class="mt-2 rounded-card px-2 py-1 text-[10px] font-semibold leading-snug flex items-start gap-1" :style="{ background: '#f6d9b8', color: '#8a4a1a' }">
                <span aria-hidden="true">⚑</span><span>{{ L('Aquí ya falló una biopsia (26B585): solo dio hueso y músculo', 'A biopsy already failed here (26B585): only bone and muscle') }}</span>
              </div>
              <div v-if="hasSoftTissue(le)" class="mt-1.5 flex flex-wrap gap-1">
                <span class="pill-data !px-1.5 !py-0 !text-[10px]" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas (RMN)', '+ soft tissue (MRI)') }}</span>
              </div>
            </button>
          </div>
          <div class="mt-2.5 flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
            <p class="text-[11px] text-tinta leading-snug max-w-xl">{{ L('Un resumen para empezar; toca una diana para abrirla en el navegador de abajo.', 'A summary to start; tap a target to open it in the navigator below.') }}</p>
            <a href="#idoneidad" @click="jumpToIdoneidad" class="link-action text-miriam text-[12.5px] inline-flex items-center gap-1 font-semibold shrink-0">
              {{ L('Ver cómo se calcula · ranking completo', 'See how it is computed · full ranking') }} <span aria-hidden="true">↓</span>
            </a>
          </div>

          <!-- (BIOPSIA · por qué el ilíaco y no el fémur) — explica el cambio de criterio
               (señal cruda → mejor tejido del clon adecuado, de forma segura), para que no parezca arbitrario. -->
          <details class="alert-callout mt-5 leading-relaxed">
            <summary class="cursor-pointer font-semibold">{{ L('Por qué estas son de las mejores dianas para el muestreo (y el aviso del fémur)', 'Why these are among the best sampling targets (and the femur caveat)') }}</summary>
            <p class="mt-2">{{ L('El criterio no es el SUV más alto, sino el mejor tejido del clon adecuado —con ARN de buena calidad— de forma razonablemente segura. Por eso destacan el ilíaco supra-acetabular (#14, clon agresivo en progresión, acceso seguro) y, según el clon a capturar, el pedículo L1 (#10, el clon glucolítico discordante único). El fémur (#16) es el de más señal (FDG): es un objetivo válido —su biología interesa y se contempla—, pero está en el cuello femoral, hueso de carga, y extraer cores conlleva riesgo de fractura, que valoran Oncología Radioterápica/ortopedia; se indica para tenerlo en cuenta, no para descartarlo. (El L5 #11 está en tratamiento con SBRT, así que su tejido queda menos representativo.) Describe; no concluye — la diana la elige el equipo.', 'The criterion is not the highest SUV, but the best tissue from the right clone — with good-quality RNA — reasonably safely. That is why the supra-acetabular iliac (#14, a progressing aggressive clone, safe access) stands out and, depending on the clone to capture, the L1 pedicle (#10, the unique discordant glycolytic clone). The femur (#16) has the most signal (FDG): it is a valid target — its biology is of interest and is considered — but it sits in the femoral neck, weight-bearing bone, and taking cores carries fracture risk, assessed by Radiation Oncology/orthopedics; it is flagged to be taken into account, not to rule it out. (L5 #11 is under SBRT treatment, so its tissue is less representative.) It describes; it does not conclude — the team chooses the target.') }}</p>
          </details>
        </section>

        <!-- ===== HÉROE · NAVEGAR FOCOS ↔ VER LA LESIÓN EN 3D (lo PRIMARIO) =====
             El flujo primario y de un vistazo: el esqueleto navegador (con sus
             controles de tiempo+filtros) + el resumen compacto + el visor 3D small
             multiples del foco seleccionado, todo en el primer pliegue. Clicar un
             foco (esqueleto/scatter/tabla) cambia AL INSTANTE el 3D + el resumen,
             sin scroll. Arriba va el resumen «Dianas idóneas»; el contexto general
             (cockpit, cómo se lee) bajó a la wiki; el detalle profundo va debajo. -->
        <section class="order-2 mb-14" aria-labelledby="mapa">
          <p class="eyebrow mb-2 block">{{ L('Navega los focos · míralos en 3D', 'Navigate the foci · see them in 3D') }}</p>
          <h2 id="mapa" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('El mapa, lesión a lesión', 'The map, lesion by lesion') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L('Elige un foco —en el esqueleto o en la tabla— y, sin moverte, cambian al instante el resumen y el hueso en 3D. El color va del violeta (solo receptor) al coral (solo azúcar) y el número es el id del foco. El esqueleto es un esquema orientativo; la tabla, una lista compacta y ordenable.',
                  'Pick a focus —on the skeleton or in the table— and, without moving, the summary and the 3D bone update instantly. Colour runs from violet (receptor only) to coral (sugar only) and the number is the focus id. The skeleton is a schematic guide; the table, a compact, sortable list.') }}
          </p>

          <!-- ===== MAQUETA PRIMARIA · 2 columnas, alineadas y consistentes =====
               IZQUIERDA = NAVEGAR (sticky): toggle Esqueleto/Tabla + el navegador
               elegido (esqueleto SVG con sus controles, o la lista de focos).
               DERECHA = VER LA LESIÓN (siempre a la derecha): el visor 3D del foco
               a ancho completo de la columna + el resumen compacto debajo. Elegir
               un foco a la izquierda cambia AL INSTANTE el visor + el resumen.
               El sticky lo da el WRAPPER de cada columna (no las cards internas,
               para no anidar dos sticky y descuadrar). items-start + gap-6 común. -->
          <div class="grid lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] gap-6 items-start">

            <!-- ===== COLUMNA IZQUIERDA · NAVEGAR (sticky) ===== -->
            <!-- NAVEGADOR STICKY (esqueleto + controles): se fija al hacer scroll de la
                 ficha. Solo en lg+; en móvil apila normal. (Sin scroll interno: la
                 paciente prefería el sticky simple, sin barra de scroll en el navegador.) -->
            <div class="lg:sticky lg:top-24">

            <!-- BARRA DE NAVEGACIÓN · horizontal y compacta (no gasta espacio): toggle
                 Esqueleto/Tabla a la izquierda y flechas prev/next (paso entre focos)
                 a la derecha, alineadas. Sin rótulo «Navegar por». Ambos modos comparten
                 `selected` → la selección persiste al cambiar de modo. -->
            <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div class="seg" role="group" :aria-label="L('Modo del navegador de focos', 'Foci navigator mode')">
                <button type="button" class="seg__btn" :class="{ 'is-active': navMode === 'skeleton' }"
                  :aria-pressed="navMode === 'skeleton'" @click="navMode = 'skeleton'">
                  <span aria-hidden="true">⏿</span> {{ L('Esqueleto', 'Skeleton') }}
                </button>
                <button type="button" class="seg__btn" :class="{ 'is-active': navMode === 'table' }"
                  :aria-pressed="navMode === 'table'" @click="navMode = 'table'">
                  <span aria-hidden="true">☰</span> {{ L('Lista', 'List') }}
                </button>
              </div>
              <!-- flechas prev/next entre focos (sencillas; ayudan a ir pinchando de un vistazo) -->
              <div class="flex items-center gap-1 text-tinta shrink-0">
                <button type="button" @click="pickStep(-1)"
                  class="w-7 h-7 rounded-full border border-[rgba(45,27,61,0.2)] flex items-center justify-center hover:border-[rgba(45,27,61,0.45)] hover:text-berenjena transition-colors"
                  :aria-label="L('Foco anterior', 'Previous focus')">‹</button>
                <span class="font-mono text-[11px] tabular-nums w-11 text-center select-none">{{ focoPos || '–' }}<span class="text-[10px] text-tinta">/{{ visibleFocusList.length }}</span></span>
                <button type="button" @click="pickStep(1)"
                  class="w-7 h-7 rounded-full border border-[rgba(45,27,61,0.2)] flex items-center justify-center hover:border-[rgba(45,27,61,0.45)] hover:text-berenjena transition-colors"
                  :aria-label="L('Foco siguiente', 'Next focus')">›</button>
              </div>
            </div>

            <!-- ===== MODO ESQUELETO · esqueleto SVG + sus controles (tiempo+filtros).
                 v-show (no v-if): conserva el estado del slider/filtros al alternar.
                 ESQUELETO SVG + SUS CONTROLES (línea de tiempo + filtros) ·
                 la barra de tiempo (frames PET) y los filtros son MODIFICADORES
                 del mapa del esqueleto, así que viven DENTRO de su misma card,
                 encima del esquema, rotulados como tales. -->
            <div v-show="navMode === 'skeleton'" class="card-base !p-4">
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
              <svg viewBox="0 0 440 700" class="w-full" role="group" :aria-label="L('Esquema del esqueleto con las lesiones (toca un foco para seleccionarlo)', 'Skeleton schematic with the lesions (tap a focus to select it)')">
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
                <!-- lesiones: un marcador por grupo (vértebra con 1+ focos, o hueso).
                     ESQUEMA SIMPLE: círculo relleno del color del trazador, TAMAÑO
                     UNIFORME, + número del foco (o recuento si la vértebra aloja varios)
                     + contorno punteado (IA por confirmar) + borde oscuro si está
                     seleccionado. Sin halo, sin parpadeo, sin anillo de «foco nuevo»,
                     sin tamaño ∝ SUVmáx. Si no capta en la fecha actual → solo opacidad. -->
                <g v-for="g in GROUPS" :key="g.key" v-show="groupVisible(g)">
                  <circle
                    :cx="g.x" :cy="g.y"
                    :r="SK_R + (gSelected(g) ? 2.5 : 0)"
                    :fill="gPresentAt(g, frame) ? phenoColor(g.primary) : 'none'"
                    :stroke="gSelected(g) ? '#2d1b3d' : (gPresentAt(g, frame) ? '#ffffff' : phenoColor(g.primary))"
                    :stroke-width="gSelected(g) ? 2.5 : 1.4"
                    :stroke-dasharray="sourceOf(g.primary) === 'ia-david' ? '2 1.6' : undefined"
                    :opacity="gPresentAt(g, frame) ? 1 : 0.4"
                    class="cursor-pointer transition-all"
                    tabindex="0" role="button" :aria-pressed="gSelected(g)"
                    :aria-label="g.multi ? `${g.foci[0].level[lang]} — ${g.foci.length} ${L('focos', 'foci')}` : `${g.primary.level[lang]} — ${phenoLabel(g.primary)}`"
                    @click="pickGroup(g)" @keydown.enter="pickGroup(g)" @keydown.space.prevent="pickGroup(g)"
                    @mouseenter="canHoverFine() && showTip($event, groupTipText(g))" @mouseleave="hideTip" @focus="showTip($event, groupTipText(g))" @blur="hideTip" @keydown.escape="hideTip" />
                  <!-- foco único: id dentro; varios focos: insignia de recuento -->
                  <!-- (auditoría) el número arbitrario sale del esqueleto: el nombre lo da el
                       tooltip y el color el fenotipo; el #N se queda en lista/tabla para cruzar.
                       Foco único = bolita de color; vértebra con varios = insignia de recuento. -->
                  <g v-if="g.multi && gPresentAt(g, frame)" class="pointer-events-none select-none">
                    <circle :cx="g.x + SK_R + 1.5" :cy="g.y - SK_R - 1.5" r="6.5"
                      fill="#2d1b3d" stroke="#fff" stroke-width="1.2" />
                    <text :x="g.x + SK_R + 1.5" :y="g.y - SK_R + 1.3" text-anchor="middle"
                      font-family="Source Sans 3, sans-serif" font-size="9" font-weight="700" fill="#fff">{{ g.foci.length }}</text>
                  </g>
                </g>
              </svg>
              <!-- LEYENDA MÍNIMA · el degradado ya dice color = trazador; una sola
                   línea para lo no obvio (número = foco · punteado = IA). Sin "borde
                   oscuro = seleccionado" (obvio al clicar). De un vistazo, sin más. -->
              <div class="mt-3 px-1">
                <div class="h-2.5 rounded-full" :style="{ background: 'linear-gradient(90deg,#9d44ab,#8a5bb3,#c9921e,#df7a44,#bb4128)' }" />
                <div class="flex justify-between text-[10px] text-tinta mt-1">
                  <span>{{ L('Solo receptor (Galio)', 'Receptor only (gallium)') }}</span>
                  <span>{{ L('Solo azúcar (FDG)', 'Sugar only (FDG)') }}</span>
                </div>
                <p class="mt-1.5 text-[10.5px] text-tinta leading-snug">
                  {{ L('Color = trazador · insignia = nº de focos en esa vértebra · contorno punteado = detectado por IA (por confirmar).', 'Color = tracer · badge = nº of foci in that vertebra · dashed outline = AI-detected (to confirm).') }}
                </p>
              </div>

              <!-- ===== CONTROLES (abajo) · timeline + filtros, modificadores del
                   esqueleto. Separador mínimo, sin cabecera verbosa: cada bloque ya
                   se rotula solo. ===== -->
              <p class="eyebrow--sm mb-2 mt-5 pt-4 border-t border-[rgba(45,27,61,0.1)]">
                {{ L('Controles', 'Controls') }}
              </p>

              <!-- filtros: qué focos muestra el esqueleto (y las demás vistas) -->
              <div class="rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card !p-3 mb-2.5">
                <p class="text-[10px] font-semibold text-tinta mb-1.5">{{ L('Filtrar focos del mapa', 'Filter map foci') }}</p>
                <div class="flex flex-wrap gap-1.5" role="group" :aria-label="L('Filtrar focos del mapa', 'Filter map foci')">
                  <button v-for="f in filters" :key="f.key" type="button"
                    @click="filter = f.key"
                    :aria-pressed="filter === f.key"
                    class="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border transition-colors"
                    :class="filter === f.key ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.2)] hover:border-[rgba(45,27,61,0.4)]'">
                    <span v-if="f.c" class="w-2 h-2 rounded-full" :style="{ background: f.c }" aria-hidden="true" />
                    {{ f.label }}
                  </button>
                </div>
              </div>

              <!-- línea de tiempo (frames PET): anima qué focos encienden en el
                   esqueleto. Va DEBAJO de los filtros (lo menos crítico para elegir diana). -->
              <div class="rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card !p-3">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <button type="button" @click="play()"
                    class="shrink-0 w-8 h-8 rounded-full bg-berenjena text-cream flex items-center justify-center text-[12px] hover:opacity-90 transition-opacity"
                    :aria-label="playing ? L('Pausar', 'Pause') : L('Recorrer los estudios', 'Step through the studies')">
                    {{ playing ? '❚❚' : '▶' }}
                  </button>
                  <div class="font-display text-lg text-berenjena w-[4.5rem] tabular-nums leading-none">{{ dateLabel }}</div>
                  <input type="range" min="0" max="2" step="1" :value="frame"
                    @input="setFrame(+($event.target as HTMLInputElement).value)"
                    class="flex-1 min-w-[110px] accent-berenjena"
                    :aria-label="L('Recorrer los estudios PET (FDG ene→mar · Galio may)', 'Step through the PET studies (FDG Jan→Mar · gallium May)')" />
                </div>
                <div class="flex justify-between mt-2 px-0.5">
                  <button v-for="(d, i) in FDATES" :key="i" type="button" @click="setFrame(i)"
                    class="text-[10px] font-mono transition-colors"
                    :class="frame === i ? 'text-berenjena font-bold' : 'text-tinta hover:text-berenjena'">{{ d[lang].split(' ')[0] }}</button>
                </div>
                <!-- (B · plan comité web) nota larga → PLEGABLE (notes-disclosure, patrón
                     de /ciencia): se pliega para aligerar el navegador sticky, pero NO
                     desaparece (accesible por teclado, sin JS). -->
                <details class="notes-disclosure mt-2">
                  <summary>{{ L('Cómo leer esta línea de tiempo', 'How to read this timeline') }}</summary>
                  <p class="mt-2 text-[10px] text-tinta leading-snug">{{ L('Compara solo el FDG (ene→mar 2026). El paso de mayo es el ⁶⁸Ga-DOTATOC, estudio único (26/05): no comparable en el tiempo.', 'Compares FDG only (Jan→Mar 2026). The May step is the ⁶⁸Ga-DOTATOC, a single study (26 May): not comparable over time.') }}</p>
                </details>
              </div>
            </div>

            <!-- ===== MODO TABLA · lista de focos compacta y clicable =====
                 Cada item: #id · localización · chips de trazador (⁶⁸Ga/FDG) +
                 mini-idoneidad. Ordenada: confirmados primero (por idoneidad), los
                 de IA al final con su anillo punteado. Clicar → cambia AL INSTANTE
                 el 3D + el resumen (mismo `selected` que el esqueleto → persiste).
                 Reutiliza focusListItems, phenoColor, los SUV y suitabilityScore. -->
            <div v-show="navMode === 'table'" class="card-base !p-2">
              <p class="eyebrow--sm text-berenjena px-1.5 pt-1 pb-1.5 flex items-center justify-between gap-2">
                <span>{{ L('Focos · elige uno', 'Foci · pick one') }}</span>
                <span class="font-normal normal-case tracking-normal text-tinta">{{ confirmedFoci.length }}<span v-if="aiFoci.length">+{{ aiFoci.length }}</span></span>
              </p>
              <!-- (D · plan comité web) búsqueda por nombre/zona: hace ENCONTRABLES los
                   focos dobles (#8/#10) que en el esqueleto quedan bajo el marcador de su
                   vértebra. Estilo de control de la casa; aria-label para lector. -->
              <input
                v-model="focoQuery"
                type="search"
                :placeholder="L('Buscar por nombre o zona…', 'Search by name or area…')"
                :aria-label="L('Buscar foco por nombre o zona', 'Search focus by name or area')"
                class="w-full mb-1.5 rounded-card border border-[rgba(45,27,61,0.14)] bg-cream-card px-2.5 py-1.5 text-[12px] text-berenjena placeholder:text-tinta focus:outline-none focus:border-[#9d44ab]" />
              <ul data-foco-list class="space-y-1 overflow-y-auto pr-0.5" style="max-height:600px">
                <li v-if="!filteredFocusList.length" class="px-2 py-3 text-[11px] text-tinta text-center">{{ L('Sin focos que coincidan.', 'No matching foci.') }}</li>
                <li v-for="le in filteredFocusList" :key="le.id">
                  <button type="button" @click="pick(le.id)"
                    class="w-full text-left rounded-card border px-2 py-1.5 transition-colors flex items-center gap-2"
                    :class="le.id === selected ? 'border-berenjena bg-[rgba(45,27,61,0.05)]' : 'border-transparent hover:bg-[rgba(45,27,61,0.035)]'"
                    :aria-pressed="le.id === selected"
                    :aria-label="`#${le.id} ${le.level[lang]} — ${phenoLabel(le)}`">
                    <span class="shrink-0 w-3 h-3 rounded-full" :style="{ background: phenoColor(le), boxShadow: sourceOf(le) === 'ia-david' ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(le) : 'none' }" aria-hidden="true" />
                    <span class="min-w-0 flex-1">
                      <span class="flex items-center gap-1.5"><span class="text-[12px] font-semibold text-berenjena leading-tight truncate">{{ le.level[lang] }}</span><span class="font-mono text-[10px] text-tinta shrink-0">#{{ le.id }}</span><span v-if="coCount(le) > 1" class="pill-data pill-data--berenjena !text-[10px] !px-1.5 !py-0 shrink-0" role="img" :aria-label="coCount(le) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(le) }}</span></span>
                      <span class="flex flex-wrap items-center gap-1 mt-0.5">
                        <span v-if="le.dota != null" class="inline-flex items-center text-[10px] font-semibold leading-none px-1 py-0.5 rounded-full" style="background:#9d44ab1a;color:#7a3d86">⁶⁸Ga {{ le.dota.toFixed(1) }}</span>
                        <span v-if="le.fdg != null" class="inline-flex items-center text-[10px] font-semibold leading-none px-1 py-0.5 rounded-full" style="background:#bb41281a;color:#bb4128">FDG {{ le.fdg.toFixed(1) }}</span>
                        <span v-if="sourceOf(le) === 'ia-david'" class="text-[10px] text-tinta">{{ L('IA·conf.', 'AI·conf.') }}</span>
                      </span>
                    </span>
                    <span class="shrink-0 w-10 text-right" :aria-label="L('idoneidad ' + suitabilityScore(le) + ' sobre 100', 'suitability ' + suitabilityScore(le) + ' out of 100')">
                      <span class="block font-mono text-[11px] text-berenjena leading-none">{{ suitabilityScore(le) }}</span>
                      <span class="block h-1 rounded-full mt-0.5 bg-[rgba(45,27,61,0.08)] overflow-hidden">
                        <span class="block h-full rounded-full" :style="{ width: suitabilityScore(le) + '%', background: 'linear-gradient(90deg,#9d44ab,#df7a44)' }" />
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
              <p class="text-[10px] text-tinta leading-snug px-1.5 pt-1.5 mt-1 border-t border-[rgba(45,27,61,0.08)]">
                {{ L('Confirmados primero (por idoneidad), IA al final (anillo punteado). Color = trazador · ⁶⁸Ga receptor / FDG azúcar · nº = idoneidad orientativa. Describe, no concluye.', 'Confirmed first (by suitability), AI last (dashed ring). Colour = tracer · ⁶⁸Ga receptor / FDG sugar · nº = indicative suitability. Describes, does not conclude.') }}
              </p>
            </div>

            </div><!-- /COLUMNA IZQUIERDA · NAVEGAR -->

            <!-- ===== COLUMNA DERECHA · VER LA LESIÓN (siempre a la derecha) =====
                 ORDEN DELIBERADO (herramienta de DECISIÓN, mantra «elegir diana»):
                   order-1 título + lectura técnica · order-2 MÉTRICAS comparables
                   (idoneidad/SUV/forma/extensión) · order-3 visor 3D + imagen.
                 Las cifras que sirven para COMPARAR candidatos van primero (decisión);
                 el 3D «ver la lesión» va debajo, a un golpe de vista. flex+order fija
                 ese orden con independencia del orden de fuente. Elegir un foco a la
                 izquierda cambia AL INSTANTE las cifras + el visor. min-w-0 para que el
                 visor no rompa el grid en pantallas estrechas. -->
            <div class="flex flex-col gap-6 min-w-0">

            <!-- VISOR 3D = order-3 (debajo de las métricas, por decisión-primero). Small
                 multiples: el MISMO hueso en 3 mapas limpios y sincronizados. Al clicar
                 un foco cambia al instante. NO se toca su interior (centrado retina). -->
            <!-- ===== 1 · TÍTULO + LECTURA ===== nombre, zona, fenotipo y la
                 lectura TÉCNICA primero; las palabras llanas, a un clic. -->
            <div v-if="sel">
              <div class="flex items-start gap-2.5 mb-2">
                <span class="shrink-0 w-3.5 h-3.5 mt-1.5 rounded-full" :style="{ background: phenoColor(sel), boxShadow: selIsAi ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(sel) : 'none' }" aria-hidden="true" />
                <div class="min-w-0">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="font-mono font-bold text-base leading-none text-berenjena bg-miriam-soft rounded px-2 py-1 tracking-tight">{{ selLevelCode }}</span>
                    <h3 v-if="selLevelRest" class="heading-display text-lg text-berenjena leading-tight">{{ selLevelRest }}</h3>
                    <span class="font-mono text-[12px] text-tinta">#{{ sel.id }}</span>
                    <span v-if="coCount(sel) > 1" class="pill-data pill-data--berenjena text-[10px] !px-1.5 !py-0" role="img" :aria-label="coCount(sel) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(sel) }} {{ L('focos', 'foci') }}</span>
                  </div>
                  <p class="text-xs text-tinta">{{ sel.region[lang] }} ·
                    {{ sel.side === 'R' ? L('lado derecho', 'right side') : sel.side === 'L' ? L('lado izquierdo', 'left side') : L('línea media', 'midline') }}</p>
                </div>
                <span class="pill-data ml-auto shrink-0 self-start" :style="{ background: phenoColor(sel) + '22', color: phenoText(sel) }">{{ phenoLabel(sel) }}</span>
              </div>
              <p v-if="selIsAi" class="mb-2 text-[11px] font-semibold leading-snug flex items-center gap-1.5 flex-wrap" style="color:#8a4a1a">
                <span class="inline-block w-2 h-2 rounded-full" style="background:#bf7d2c" aria-hidden="true" />
                {{ L('Detectado por IA · por confirmar', 'AI-detected · to confirm') }}
              </p>
              <p v-if="isMultiFocusBone" class="mb-2 text-[11px] text-tinta leading-snug">
                {{ L('Zona con ' + coFoci.length + ' focos · resumen del principal', 'Area with ' + coFoci.length + ' foci · summary of the main one') }}
              </p>
              <!-- LECTURA TÉCNICA primero (registro para el equipo médico); el texto
                   en palabras llanas queda a un clic, para paciente/familia. -->
              <p class="text-[13.5px] text-berenjena leading-snug">{{ sel.tech[lang] }}</p>
              <details class="notes-disclosure mt-1.5">
                <summary>{{ L('En palabras llanas', 'In plain words') }}</summary>
                <p class="text-[12.5px] text-tinta leading-snug">{{ sel.what[lang] }}</p>
              </details>
            </div>

            <!-- ===== 2 · IDONEIDAD + MÉTRICAS ===== ENCIMA del visor (decisión primero):
                 idoneidad como diana, proporción de trazadores y las cifras clave, al
                 instante y sin scroll. El detalle profundo (3 lecturas, técnico) va más
                 abajo. Orden del DOM = orden visual (título → métricas → visor): así el
                 recorrido de teclado/lector de pantalla NO retrocede. -->
            <div v-if="sel" class="card-base">
              <!-- IDONEIDAD como diana (orientativa) · primero -->
              <div class="rounded-card bg-cream-card px-3 py-2 mb-3 border border-[rgba(45,27,61,0.1)]">
                <div class="flex items-center justify-between mb-1">
                  <span class="eyebrow--sm text-berenjena">{{ L('Idoneidad como diana', 'Suitability as a target') }}</span>
                  <span class="font-mono text-sm font-semibold text-berenjena">{{ suitabilityScore(sel) }}<span class="text-[10px] text-tinta">/100</span></span>
                </div>
                <div class="h-2 rounded-full overflow-hidden bg-[rgba(45,27,61,0.08)]" role="img"
                  :aria-label="L('Idoneidad ' + suitabilityScore(sel) + ' sobre 100', 'Suitability ' + suitabilityScore(sel) + ' out of 100')">
                  <div class="h-full rounded-full" :style="{ width: suitabilityScore(sel) + '%', background: 'linear-gradient(90deg,#9d44ab,#df7a44)' }" />
                </div>
                <p class="text-[10px] text-tinta mt-1 leading-snug">{{ L('orientativa · viable × rendimiento × tamaño. Etiqueta por trazador/forma; describe, no concluye.', 'indicative · viable × yield × size. Labelled by tracer/shape; describes, does not conclude.') }}</p>
              </div>

              <!-- barra «dos caras»: proporción receptor (violeta) ↔ azúcar (coral) -->
              <div class="mb-3">
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

              <!-- NÚMEROS CLAVE · 4 cifras a ancho completo (la imagen clave subió a «Imágenes») -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#9d44ab' }">
                  <p class="text-[10px] text-tinta leading-none">{{ L('Receptor ⁶⁸Ga', 'Receptor ⁶⁸Ga') }}</p>
                  <p class="font-mono text-base leading-tight text-berenjena">{{ fmtSuv(sel, sel.dota) }}</p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#bb4128' }">
                  <p class="text-[10px] text-tinta leading-none">{{ L('Azúcar FDG', 'Sugar FDG') }}</p>
                  <p class="font-mono text-base leading-tight text-berenjena">{{ fmtSuv(sel, sel.fdg) }}<span v-if="trend(sel)" class="text-[11px] ml-1" :style="deltaStyle(sel)">({{ deltaFdg(sel) }})</span></p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#1f6b57' }">
                  <p class="text-[10px] text-tinta leading-none">{{ L('Forma (CT)', 'Shape (CT)') }}</p>
                  <p class="text-[12px] font-semibold leading-tight text-berenjena">{{ morphLabel(sel) }}</p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#6b6470' }">
                  <p class="text-[10px] text-tinta leading-none">{{ L('Extensión metab.', 'Metabolic extent') }}</p>
                  <p class="font-mono text-[12px] font-semibold leading-tight text-berenjena">{{ metExtentLabel(sel) }}</p>
                </div>
              </div>

              <!-- ENLACE al detalle profundo (sin scroll para navegar; scroll opcional) -->
              <a href="#detalle-foco" @click.prevent="openDetalle" class="link-action text-miriam text-[13px] inline-flex items-center gap-1 font-semibold">
                {{ L('Ver el detalle completo del foco (abajo, a ancho completo)', 'See the full focus detail (full-width, below)') }} <span aria-hidden="true">↓</span>
              </a>
            </div>

            <!-- ===== 3 · IMÁGENES · 3D + imagen ===== bajo las métricas (decisión primero) -->

            <div v-if="sel">
              <div v-if="bone3dKeyOf(sel)" class="flex items-center justify-between gap-3 flex-wrap mb-2">
                <p class="eyebrow block !mb-0">{{ L('Hueso reconstruido del CT · captación co-registrada', 'Bone reconstructed from the CT · co-registered uptake') }}</p>
                <!-- VER EN GRANDE · abre el visor 3D a pantalla completa (los 3 mapas
                     grandes, rotación sincronizada). El visor en línea va contenido. -->
                <button v-if="bone3dKeyOf(sel)" type="button" class="btn-expand3d" @click="openBone3dFullscreen">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                  {{ L('Ver en grande', 'View larger') }}
                </button>
              </div>
              <p v-if="isMultiFocusBone && bone3dKeyOf(sel)" class="text-[12px] text-tinta leading-snug mb-2 max-w-3xl">
                {{ L('Esta zona tiene ' + coFoci.length + ' focos co-localizados (receptor/azúcar); el realce señala la zona. Detalle de cada foco abajo y en la tabla.', 'This area has ' + coFoci.length + ' co-localized foci (receptor/sugar); the highlight marks the area. Each focus is detailed below and in the table.') }}
              </p>
              <!-- visor en línea a ANCHO COMPLETO de la columna; el botón de arriba lo abre grande -->
              <div class="min-w-0">
              <template v-if="bone3dKeyOf(sel)">
                <!-- Cuando el visor está a PANTALLA COMPLETA, DESMONTAMOS el visor en
                     línea (v-if) para no mantener dos contextos WebGL + dos bucles de
                     render a la vez (el overlay ya muestra el mismo hueso en grande). -->
                <ClientOnly v-if="!bone3dFullscreen">
                  <BoneTriView
                    :mesh-key="bone3dKeyOf(sel)"
                    :biopsied="bonePriorBiopsy != null" :no-target="isAiDavid(sel)"
                    :biopsy-label="bonePriorBiopsy ?? undefined"
                  />
                  <template #fallback>
                    <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:15/4;background:#0d1117;color:#aeb6c2">
                      {{ L('cargando visor…', 'loading viewer…') }}
                    </div>
                  </template>
                </ClientOnly>
                <div v-else class="rounded-lg flex items-center justify-center text-center text-[12px] px-4" style="aspect-ratio:15/4;background:#0d1117;color:#aeb6c2">
                  {{ L('Visor abierto a pantalla completa', 'Viewer open in full screen') }}
                </div>
              </template>
              <!-- FALLBACK · foco SIN hueso 3D anfitrión. HOY no se da (los 3 focos IA
                   #17/#18/#19 se montan sobre el hueso reconstruido más cercano, ver
                   BONE3D_KEY). Se conserva por robustez: si en el futuro se añade un foco
                   sin malla, en vez de un hueco se planta el corte del estudio con la
                   ubicación aproximada (marca punteada, por confirmar). -->
              <div v-else>
                <button v-if="selKey.hasReliable" type="button"
                  class="block w-full rounded-lg overflow-hidden border border-[rgba(45,27,61,0.18)] bg-[#0d1117] relative"
                  :aria-label="L('Ampliar la imagen del foco #' + sel.id, 'Enlarge the image of focus #' + sel.id)"
                  @click="openKeyLightbox('axial')">
                  <img :src="fk(sel.id, 'axial')"
                    :alt="L('Imagen del estudio (axial) con la ubicación aproximada del foco #' + sel.id, 'Study image (axial) with the approximate location of focus #' + sel.id)"
                    class="block w-full max-h-[380px] object-contain mx-auto" loading="lazy" />
                  <span class="absolute top-2 right-2 w-7 h-7 rounded-full bg-[rgba(13,17,23,0.72)] text-white flex items-center justify-center" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                  </span>
                </button>
                <div v-else class="rounded-lg border border-dashed border-[rgba(45,27,61,0.28)] bg-cream-card flex items-center justify-center text-center px-5 py-10 text-[12px] text-tinta">
                  {{ L('Imagen por confirmar', 'Image to confirm') }}
                </div>
                <p class="text-[11px] text-tinta leading-snug mt-2">
                  <span class="font-semibold" style="color:#8a4a1a">{{ L('Propuesta · por confirmar.', 'Proposal · to confirm.') }}</span>
                  {{ L(' Foco detectado por IA y no localizable con fiabilidad en esta zona, así que no se reconstruye en 3D. Se muestra el corte del estudio con la ubicación aproximada (marca punteada) para que el equipo la valore.', ' AI-detected focus that cannot be reliably localized in this area, so it is not reconstructed in 3D. The study slice is shown with the approximate location (dashed marker) for the team to assess.') }}
                </p>
              </div>
              </div>
              <!-- Foco IA en el visor 3D: no hay malla propia de su localización exacta,
                   así que se muestra sobre el hueso reconstruido más cercano como referencia
                   de zona. Aviso de honestidad para que no se lea como localización fina. -->
              <p v-if="selIsAi && bone3dKeyOf(sel)" class="text-[11px] leading-snug mt-2" style="color:#8a4a1a">
                <span class="font-semibold">{{ L('Detectado por IA · por confirmar.', 'AI-detected · to confirm.') }}</span>
                {{ L(' Sin malla propia de esta localización: se muestra sobre el hueso reconstruido más cercano (referencia de zona, no localización fina); a validar con Medicina Nuclear.', ' No dedicated mesh for this location: shown on the nearest reconstructed bone (a zone reference, not a fine localization); to be validated with Nuclear Medicine.') }}
              </p>
              <!-- (La miniatura «imagen clave» NO se repite aquí: el corte axial PET-CT
                   con el anillo del SUVmáx vive en el detalle profundo, en la galería
                   «una por foco» y en el lightbox. Aquí, el 3D es la imagen.) -->
            </div>

            </div><!-- /COLUMNA DERECHA · VER LA LESIÓN -->
          </div><!-- /grid primario (navegar | visor) -->

          <!-- ===== DETALLE PROFUNDO DEL FOCO (secundario · para quien quiera profundizar) =====
               Las 3 lecturas extendidas, observaciones, cuantificación automática y
               detalle técnico. Va DEBAJO del héroe (esqueleto + resumen + 3D), de modo
               que la navegación de un vistazo no exija scroll, pero el detalle siga ahí. -->
          <!-- DETALLE PLEGADO por defecto (zona análisis limpia); se expande al pulsar
               el summary o el enlace «Ver el detalle completo» de la ficha. -->
          <!-- «Detalle del foco» PLEGABLE: la info NUNCA desaparece, solo se PLIEGA
               (una cosa es plegar, otra ocultar/hacer desaparecer información). Plegado
               por defecto; se expande con «Ver el detalle completo» o con el propio
               summary; el contenido sigue siempre ahí, a un clic. -->
          <details id="detalle-foco" :open="detalleOpen"
            @toggle="detalleOpen = ($event.target as HTMLDetailsElement).open"
            class="foco-detalle card-base mt-10 scroll-mt-[7.5rem]">
            <summary class="foco-detalle__sum flex items-start gap-3 cursor-pointer">
              <span class="shrink-0 w-2.5 h-2.5 mt-2 rounded-full" :style="{ background: phenoColor(sel) }" aria-hidden="true" />
              <div class="min-w-0">
                <h3 class="heading-display text-xl text-berenjena leading-tight">{{ L('Detalle completo del foco', 'Full focus detail') }} #{{ sel.id }}</h3>
                <p class="text-xs text-tinta">{{ L('Las 3 lecturas, la forma del hueso, la extensión y la cuantificación', 'The 3 readings, bone shape, extent and quantification') }}</p>
              </div>
              <span class="ml-auto shrink-0 self-center inline-flex items-center gap-1 text-[12px] font-semibold text-miriam">
                <span class="foco-detalle__open">{{ L('Ampliar', 'Expand') }}</span>
                <span class="foco-detalle__close">{{ L('Contraer', 'Collapse') }}</span>
                <svg class="foco-detalle__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </summary>

            <!-- ===== BANNER · foco DETECTADO POR IA, pendiente de validación =====
                 Foco #17/#18/#19: se muestra con la MISMA información que el resto
                 para que el equipo pueda corroborarlo, marcado con claridad (sin
                 alarmismo) como pendiente de validación radiológica. Informa, no
                 concluye: no afirma que sea maligno. -->
            <div v-if="selIsAi" class="mb-4 rounded-card border-l-4 px-3.5 py-3" style="border-left-color:#bf7d2c;background:#fbf5ea">
              <p class="eyebrow--sm mb-1 flex items-center gap-2 flex-wrap" style="color:#8a4a1a">
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
                  <span :style="{ color: '#9d44ab' }">{{ L('receptor · ⁶⁸Ga', 'receptor · ⁶⁸Ga') }} <span class="font-mono">{{ fmtSuv(f, f.dota) }}</span></span>
                  <span :style="{ color: '#bb4128' }">{{ L('azúcar · FDG', 'sugar · FDG') }} <span class="font-mono">{{ fmtSuv(f, f.fdg) }}</span></span>
                </li>
              </ul>
              <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('El detalle ampliado de abajo corresponde al foco principal de la zona; el resto está en la tabla. Describe los hallazgos; no concluye.', 'The expanded detail below is for the area’s main focus; the rest is in the table. It describes the findings; it does not conclude.') }}</p>
            </div>

              <!-- ===== LAS TRES LECTURAS · una por prueba (etiquetadas por prueba) ===== -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.12)] overflow-hidden">
                <div class="px-3 py-2 bg-[rgba(45,27,61,0.04)] border-b border-[rgba(45,27,61,0.08)]">
                  <p class="eyebrow--sm text-berenjena">{{ L('Las tres lecturas · una por prueba', 'The three readings · one per test') }}</p>
                  <p class="text-[11px] text-tinta leading-snug mt-0.5">{{ L('Tres pruebas miran el mismo foco. Etiquetadas por la prueba, no por la biología.', 'Three tests look at the same focus. Labelled by the test, not the biology.') }}</p>
                </div>
                <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(45,27,61,0.08)]">
                  <!-- 1 · Receptor (Galio) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#9d44ab' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#9d44ab' }">{{ L('Receptor', 'Receptor') }} · ⁶⁸Ga-DOTATOC</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('el trazador del receptor (SSTR)', 'the receptor tracer (SSTR)') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">{{ fmtSuv(sel, sel.dota) }}</p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.dota != null ? L('SUVmáx SSTR', 'SSTR SUVmax') : L('sin captación del receptor', 'no receptor uptake') }}</p>
                  </div>
                  <!-- 2 · Azúcar (FDG) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#bb4128' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#bb4128' }">{{ L('Azúcar', 'Sugar') }} · ¹⁸F-FDG</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('el trazador del azúcar (glucosa)', 'the sugar tracer (glucose)') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">
                      {{ fmtSuv(sel, sel.fdg) }}<span v-if="trend(sel)" class="text-[12px] ml-1" :style="deltaStyle(sel)">({{ deltaFdg(sel) }})</span>
                    </p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.fdg != null ? (trend(sel) ? L('SUVmáx · Δ vs previo', 'SUVmax · Δ vs prior') : L('SUVmáx', 'SUVmax')) : L('sin captación de azúcar', 'no sugar uptake') }}</p>
                  </div>
                  <!-- 3 · RMN (forma) — color distinto, NO violeta/coral: no es un trazador -->
                  <div class="p-3 border-l-4" :style="{ borderColor: '#1f6b57' }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: '#1f6b57' }">{{ L('RMN', 'MRI') }} · {{ L('forma', 'shape') }}</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('morfología — canal de forma, no un 3er color', 'morphology — a shape channel, not a 3rd color') }}</p>
                    <template v-if="mriCovers(sel)">
                      <p class="text-[12px] text-berenjena leading-snug">{{ rmnNote(sel) }}</p>
                      <button type="button" @click="goToMRI()" class="link-action text-miriam text-[12px] mt-1.5 inline-flex items-center gap-1">
                        {{ L('Ver en el visor RMN', 'Open the MRI viewer') }} <span aria-hidden="true">→</span>
                      </button>
                    </template>
                    <p v-else class="text-[12px] text-tinta leading-snug">{{ L('La RMN de columna mostrada (cervical y dorsal) no cubre este nivel.', 'The spine MRI shown (cervical and thoracic) does not cover this level.') }}</p>
                  </div>
                </div>
                <p class="px-3 py-2 text-[10px] text-tinta leading-relaxed border-t border-[rgba(45,27,61,0.08)]">{{ L('«Blástico/escleroso» describe la FORMA del hueso (denso); no es un tercer trazador ni un tercer color. Describe los hallazgos; no concluye.', '“Blastic/sclerotic” describes the SHAPE of the bone (dense); it is not a third tracer or a third color. It describes the findings; it does not conclude.') }}</p>
              </div>

              <!-- ===== MORFOLOGÍA (forma del hueso) + MTV · dato de PRIMERA CLASE =====
                   La morfología (lítico/blástico/mixto) es el predictor clave del
                   RENDIMIENTO de la biopsia; se promueve aquí desde la verificación.
                   Es FORMA del hueso (densidad CT), no biología ni trazador. -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card p-3">
                <p class="eyebrow--sm text-berenjena mb-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#1f6b57' }" />
                  {{ L('Forma del hueso y cantidad de tumor', 'Bone shape and tumor amount') }}
                  <span class="status-badge status-badge--shape">{{ L('morfología · CT', 'morphology · CT') }}</span>
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
                <p class="eyebrow--sm mb-1 flex items-center gap-2 flex-wrap" :style="{ color: '#8a5a1a' }">
                  {{ L('Biopsia previa de este foco', 'Prior biopsy of this focus') }}
                  <span class="status-badge status-badge--candidate">26B585</span>
                </p>
                <p class="text-[13px] text-tinta leading-snug">{{ sel.priorBiopsy[lang] }}</p>
              </div>

              <!-- ===== PARTES BLANDAS / EXTENSIÓN EXTRAÓSEA (RMN → factibilidad) ===== -->
              <div v-if="sel.softTissue" class="mb-4 rounded-card border-l-4 px-3 py-3" :style="{ borderLeftColor: '#1f6b57', background: '#eef6f2' }">
                <p class="eyebrow--sm mb-1 flex items-center gap-2 flex-wrap" :style="{ color: '#1f6b57' }">
                  {{ L('Partes blandas / extensión extraósea', 'Soft tissue / extraosseous extension') }}
                  <span class="status-badge status-badge--shape">{{ L('factibilidad · RMN', 'feasibility · MRI') }}</span>
                </p>
                <p class="text-[13px] text-tinta leading-snug">{{ sel.softTissue[lang] }}</p>
              </div>

              <!-- ===== VÍA DE PUNCIÓN SUGERIDA · SEGURIDAD (equipa, no indica) ===== -->
              <div v-if="selBiopsy" class="mb-4 rounded-card border-l-4 px-3 py-3" :style="{ borderLeftColor: '#2d5f8a', background: '#eef3f8' }">
                <p class="eyebrow--sm mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: '#2d5f8a' }">
                  {{ L('Vía de punción sugerida · seguridad', 'Suggested puncture approach · safety') }}
                  <span class="status-badge status-badge--firma">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
                </p>
                <dl class="text-[13px] text-tinta leading-snug space-y-1">
                  <div><dt class="inline font-semibold text-berenjena">{{ L('Zona', 'Zone') }}: </dt><dd class="inline">{{ selBiopsy.zone[lang] }}</dd></div>
                  <div><dt class="inline font-semibold text-berenjena">{{ L('Vía de acceso', 'Approach') }}: </dt><dd class="inline">{{ selBiopsy.approach[lang] }}</dd></div>
                  <div><dt class="inline font-semibold text-berenjena">{{ L('Seguridad', 'Safety') }}: </dt><dd class="inline">{{ selBiopsy.safety[lang] }}</dd></div>
                  <div><dt class="inline font-semibold text-berenjena">{{ L('Rendimiento esperado', 'Expected yield') }}: </dt><dd class="inline">{{ selBiopsy.rend[lang] }}</dd></div>
                </dl>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Acceso y anatomía del propio caso, para que el radiólogo intervencionista y el comité de tumores decidan sobre la imagen en vivo. Describe; no concluye.', 'Access and anatomy from the case itself, for the interventional radiologist and the tumor board to decide on live imaging. It describes; it does not conclude.') }}</p>
              </div>

              <!-- (Las «palabras llanas» (what) no se repiten aquí: viven en el toggle
                   «En palabras llanas» de la ficha compacta de arriba.) -->

              <!-- HALLAZGOS: lo que muestra este foco (descripción, no triaje) -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.1)] bg-cream-card p-3">
                <p class="eyebrow--sm text-berenjena mb-2 flex items-center gap-1.5">
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

              <!-- CUANTIFICACIÓN AUTOMÁTICA medida sobre los DICOM (verificación) — abierta por defecto (vista clínica) -->
              <details v-if="hasAuto" class="notes-disclosure mb-4" open>
                <summary>{{ L('Medido sobre los DICOM (verificación automática)', 'Measured from the DICOM (automatic verification)') }}</summary>
                <p class="eyebrow--sm text-berenjena mt-3 mb-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#1f5a3a' }" />
                  {{ L('SUV automático frente a tabla', 'Automatic SUV versus table') }}
                  <span class="status-badge status-badge--active">{{ L('automático · verificación', 'automatic · verification') }}</span>
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#bb4128' }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ fmtSuv(sel, sel.fdg) }}</span>
                        <template v-if="selAuto?.fdgAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.fdgAuto?.toFixed(2) }}</span>
                          <span v-if="sel.fdg != null" class="font-semibold" :style="{ color: '#8a5a1a' }">{{ isAiDavid(sel) ? ' · IA' : (Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? ' ✓' : ' ≈') }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.fdgAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.fdgMtv }} ml</span> · TLG <span class="font-mono text-berenjena">{{ selAuto?.fdgTlg }}</span> · <span class="text-berenjena">{{ selAuto?.fdgMorph }}</span></div>
                    </div>
                  </div>
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#9d44ab' }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('receptor', 'receptor') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ fmtSuv(sel, sel.dota) }}</span>
                        <template v-if="selAuto?.gaAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.gaAuto?.toFixed(2) }}</span>
                          <span v-if="sel.dota != null" class="font-semibold" :style="{ color: isAiDavid(sel) ? '#8a5a1a' : (Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? '#1f5a3a' : '#8a5a1a') }">{{ isAiDavid(sel) ? ' · IA' : (Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? ' ✓' : ' ≈') }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.gaAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.gaMtv }} ml</span> · <span class="text-berenjena">{{ selAuto?.gaMorph }}</span></div>
                      <div v-else class="text-tinta">{{ L('auto: no medido — vale la tabla', 'auto: not measured — table stands') }}</div>
                    </div>
                  </div>
                </div>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('SUV recalculado del DICOM (corrección de decaimiento), volumen metabólico (MTV) y carga glucolítica (TLG) con máscara ósea del CT; morfología por densidad CT. El FDG (1,65 mm) es fino; el Galio (4 mm), más grueso. Verificación automática, no diagnóstico: manda la tabla y el criterio del equipo.', 'SUV recomputed from the DICOM (decay-corrected), metabolic volume (MTV) and glycolytic load (TLG) with a CT bone mask; morphology from CT density. FDG (1.65 mm) is fine; gallium (4 mm) coarser. Automatic verification, not a diagnosis: the table and the team’s judgment prevail.') }}</p>
              </details>

              <!-- EVOLUCIÓN FDG + IMAGEN CLAVE · 2 columnas (la gráfica a ancho completo
                   quedaba GIGANTE; al lado de la imagen ocupa la mitad y se equilibra). -->
              <div class="grid md:grid-cols-2 gap-5 mb-4 items-start">
              <!-- evolución del FDG (solo si hay dos medidas; el Galio tiene una sola) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('Evolución del FDG (azúcar)', 'FDG (sugar) evolution') }}</span>
                  <span v-if="hasFdgEvo" class="text-[10px] text-tinta">{{ L('ene → mar 2026', 'Jan → Mar 2026') }}</span>
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-if="hasFdgEvo" v-html="evoChartSvg" class="max-w-[460px]" />
                <div v-else class="rounded-card border px-3 py-2 text-[12.5px] leading-snug flex items-start gap-2"
                  :style="sel.fdg != null
                    ? { borderColor: '#efb27a', background: '#fbf0df', color: '#7a4a12' }
                    : { borderColor: 'rgba(45,27,61,0.12)', background: 'rgba(45,27,61,0.04)', color: '#3a3340' }">
                  <span v-if="sel.fdg != null" class="status-badge status-badge--candidate shrink-0">{{ isAiDavid(sel) ? L('IA · por confirmar', 'AI · to confirm') : L('NUEVO', 'NEW') }}</span>
                  <span>{{ noEvoLabel }}</span>
                </div>
              </div>

              <!-- IMAGEN CLAVE DEL FOCO (corte CT+PET fusionado con anillo · comité) ·
                   única imagen del foco: el círculo va SOBRE el hueso (no un marcador
                   aproximado anterior que parecía víscera y restaba confianza).
                   Columna derecha del grid (al lado de la gráfica de evolución). -->
              <figure class="!mb-0">
                <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('Imagen clave del foco', 'Focus key image') }}</span>
                  <span v-if="selKey.dotted || !selKey.hasReliable" class="status-badge status-badge--candidate">{{ L('localización aproximada · por confirmar', 'approximate location · to confirm') }}</span>
                  <span v-else class="status-badge status-badge--firma">{{ L('PET-CT fusionado', 'fused PET-CT') }}</span>
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

                <!-- fallback (sin imagen fiable) → NOTA. Hoy ningún foco lo usa:
                     todos los focos IA (#17/#19) muestran su imagen con marca punteada. -->
                <div v-else class="rounded-card border-l-4 px-3 py-3 text-[12.5px] leading-snug flex items-start gap-2"
                  style="border-left-color:#8a5a1a;background:#fbf6ec;color:#7a4a12">
                  <span class="status-badge status-badge--candidate shrink-0">{{ L('por confirmar', 'to confirm') }}</span>
                  <span>{{ L('Foco detectado por IA sobre los DICOM, de baja intensidad: la localización es aproximada y aún no hay un círculo fiable que marcarlo. No es una relectura formal — a correlacionar con Medicina Nuclear.', 'AI-detected focus on the DICOM, low intensity: the location is approximate and there is no reliable ring to mark it yet. Not a formal re-read — to correlate with Nuclear Medicine.') }}</span>
                </div>
              </figure>
              </div><!-- /grid · evolución FDG + imagen clave (2 columnas) -->

              <!-- capa TÉCNICA · abierta por defecto (vista clínica) -->
              <details class="notes-disclosure" open>
                <summary>{{ L('Detalle técnico (para el equipo médico)', 'Technical detail (for the medical team)') }}</summary>
                <!-- (la lectura técnica en prosa ya es el texto principal de la ficha
                     compacta de arriba; aquí no se repite — solo el desglose de cifras.) -->
                <div class="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                  <div><span class="text-tinta">DOTATOC SUVmáx</span><br><span class="font-mono text-berenjena">{{ sel.dota != null ? sel.dota.toFixed(2) : L('sin captación', 'no uptake') }}</span></div>
                  <div><span class="text-tinta">FDG SUVmáx</span><br><span class="font-mono text-berenjena">{{ sel.fdg != null ? sel.fdg.toFixed(2) : L('sin captación', 'no uptake') }}</span></div>
                  <div v-if="trend(sel)"><span class="text-tinta">{{ L('Tendencia FDG', 'FDG trend') }}</span><br><span class="font-mono" :style="{ color: trend(sel)!.dir === 'up' || trend(sel)!.dir === 'new' ? '#bb4128' : trend(sel)!.dir === 'down' ? '#1f5a3a' : '#3a3340' }">{{ trend(sel)!.txt }}</span></div>
                  <div v-if="sel.scler"><span class="text-tinta">{{ L('Morfología', 'Morphology') }}</span><br><span class="font-mono text-berenjena">{{ L('blástica / esclerótica', 'blastic / sclerotic') }}</span></div>
                  <div v-if="sel.load"><span class="text-tinta">{{ L('Hueso de carga', 'Weight-bearing') }}</span><br><span class="font-mono text-berenjena">{{ L('sí · revisado por Oncología Radioterápica', 'yes · reviewed by Radiation Oncology') }}</span></div>
                </div>
              </details>
          </details>
        </section>
        </div>
        <!-- /flex flex-col (lo primario order-1, el contexto order-2) -->
        <!-- ╚══════════════ FIN ZONA 1 · «Análisis de la lesión» ══════════════╝ -->

        <!-- ━━━━━━━━━━━━━━━━ DIVISIÓN CLARA ENTRE LAS DOS ZONAS ━━━━━━━━━━━━━━━━
             Banda a TODO el ancho del contenedor (no una rayita): cierra la
             herramienta (Zona 1) y abre la sección general en modo wiki (Zona 2).
             Se lee SIN DUDA «a partir de aquí, lo general». Tokens del DS
             (berenjena/cream), borde + regla gruesa + título display. -->
        <!-- ZONA WIKI · FONDO SUTIL (opción A): un tinte muy tenue detrás de TODA la
             sección general la separa de la herramienta de arriba. Lee como «zona de
             referencia», no como caja. -mx + px re-encajan el contenido al ancho de la
             columna (banda a todo el ancho de 1280, no un recuadro inset). El tinte es
             el divisor; el header va dentro, sin regla ni caja. -->
        <!-- (#15) Zona wiki a PANTALLA COMPLETA (full-bleed al viewport) con fondo del DS
             (cream-card). El margen calc(50%-50vw) saca la banda al borde del viewport sin
             scroll horizontal (en flujo, sin transform → la barra sticky del rail sigue ok);
             el contenido se RE-ACOTA a 1280 con el contenedor interior. -->
        <div class="ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] bg-cream-card py-10 lg:py-12 mt-4">
          <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <!-- (homogeneidad) divisor del sitio en el corte herramienta→wiki, como home/ciencia. -->
          <EcgDivider class="mb-10" />
          <!-- Header de la sección general (eyebrow + h2 a la izquierda, sin caja). -->
          <div class="mb-6">
          <p class="eyebrow mb-2 block">{{ L('Sección general', 'General section') }}</p>
          <h2 class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">{{ L('Visión general del caso', 'Case overview') }}</h2>
          <p class="text-sm text-tinta leading-relaxed max-w-3xl">{{ L(
            'Lo general del caso, de más a menos relevante para decidir: idoneidad (cómo se calcula), fenotipo, imágenes, evolución, la tabla y la visión general. Usa el índice para navegarlo.',
            'The general view of the case, from most to least relevant for deciding: suitability (how it is computed), phenotype, imaging, evolution, the table and the case overview. Use the index to navigate it.') }}</p>
        </div>

        <!-- ╔══════════════ ZONA 2 · «Wiki / visión general» (CON menú) ══════════════╗
             RAIL LATERAL (mismo patrón que /ciencia): rejilla de 2 columnas en lg+
             — índice vertical pegajoso a la IZQUIERDA (MapaSectionNav variant="rail",
             scroll-spy + anclas + a11y) y el contenido de la wiki a la DERECHA
             (1fr, que absorbe la tabla ancha). En <lg el rail se oculta y se usa el
             desplegable «Saltar a una sección» (variant="mobile") arriba del contenido.
             SOLO la Zona 2 va en esta rejilla; la división «Visión general» y la
             Zona 1 quedan a todo el ancho por ENCIMA. -->
        <div class="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <MapaSectionNav
            variant="rail"
            class="hidden lg:block lg:sticky lg:top-24 lg:self-start"
          />
          <div class="min-w-0">
            <!-- Índice móvil: desplegable «Saltar a…» en el flujo (solo <lg). El rail
                 de escritorio va en la columna izquierda; aquí NADA de rail. -->
            <MapaSectionNav variant="mobile" class="lg:hidden mb-8" />

        <!-- ===== LENTE · IDONEIDAD COMO DIANA (pieza central del panel) ===== -->
        <section class="mb-14" aria-labelledby="idoneidad">
          <p class="eyebrow mb-2 block">{{ L('La lente · elegir dónde rebiopsiar', 'The lens · choosing where to rebiopsy') }}</p>
          <h2 id="idoneidad" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Idoneidad como diana de biopsia', 'Suitability as a biopsy target') }}
          </h2>

          <!-- TARJETA-LENTE · marco ético (equipa, no indica) -->
          <div class="rounded-card border-l-4 px-4 py-4 mb-6" :style="{ borderLeftColor: '#9d44ab', background: '#f7eef9' }">
            <p class="eyebrow--sm mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: '#7a2f86' }">
              <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#9d44ab' }" />
              {{ L('Cómo leer esta lente', 'How to read this lens') }}
              <span class="status-badge status-badge--firma">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
            </p>
            <p class="text-[14px] text-berenjena leading-relaxed">
              {{ L(
                'Esta vista ordena los focos por las señales que importan para elegir dónde rebiopsiar — captación del trazador (FDG/Galio) y rendimiento tisular esperado (lítico/partes blandas suele rendir más; blástico denso, poco). EQUIPA la decisión del equipo médico; NO indica dónde biopsiar ni concluye tratamiento o pronóstico. La accesibilidad y seguridad las valora radiología intervencionista.',
                'This view orders the foci by the signals that matter for choosing where to rebiopsy — tracer uptake (FDG/gallium) and expected tissue yield (lytic/soft tissue usually yields more; dense blastic, little). It EQUIPS the medical team’s decision; it does NOT indicate where to biopsy nor conclude treatment or prognosis. Accessibility and safety are assessed by interventional radiology.') }}
            </p>
          </div>

          <!-- NOTA · el «de un vistazo» (las 3 dianas mejor situadas) vive ARRIBA del
               todo, como resumen (sección «Dianas idóneas»). Aquí NO se repite: esta
               sección es el cómo-se-calcula completo — factores, fórmula y ranking. -->
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-3xl">
            {{ L('Aquí está el cálculo completo: qué factores componen la idoneidad, la fórmula y el orden de TODOS los focos. El resumen con las dianas mejor situadas está arriba del todo, en «Dianas idóneas».',
                  'Here is the full calculation: which factors make up suitability, the formula and the order of ALL foci. The summary with the best-placed targets is at the very top, in “Suitable targets”.') }}
          </p>

          <!-- LOS FACTORES que componen la idoneidad (explícitos, etiquetados por trazador/forma) -->
          <p class="text-sm text-tinta leading-relaxed mb-3 max-w-3xl">
            {{ L('La idoneidad no es una caja negra: es el producto de tres factores visibles, más tres avisos de FACTIBILIDAD que el equipo pondera (no van en el número).',
                  'Suitability is not a black box: it is the product of three visible factors, plus three FEASIBILITY flags the team weighs (they are not in the number).') }}
          </p>
          <!-- GRUPO A · los 3 factores que MULTIPLICAN el número → grid de 3 col (llena exacto). -->
          <div class="grid sm:grid-cols-3 gap-3 mb-3">
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#bb4128' }">{{ L('1 · Captación (FDG/Ga)', '1 · Uptake (FDG/Ga)') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('FDG SUVmáx: a más captación de azúcar, más señal metabólica que muestrear; el Galio aporta la captación del receptor (SSTR).', 'FDG SUVmax: the more sugar uptake, the more metabolic signal to sample; gallium adds the receptor (SSTR) uptake.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#1f6b57' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#1f6b57' }">{{ L('2 · Rendimiento esperado', '2 · Expected yield') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Forma del hueso: lítico / partes blandas suele rendir más tejido; blástico denso rinde poco (como falló la biopsia ilíaca 26B585). Es FORMA, no biología.', 'Bone shape: lytic / soft tissue usually yields more tissue; dense blastic yields little (as the 26B585 iliac biopsy failed). It is SHAPE, not biology.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#6b6470' }">
              <p class="text-[12px] font-semibold mb-1 text-tinta">{{ L('3 · Tamaño / cantidad', '3 · Size / amount') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Eje mayor de la lesión (más grande = más fácil y más tejido) y, donde se midió, el MTV (volumen tumoral metabólico).', 'Lesion major axis (larger = easier and more tissue) and, where measured, the MTV (metabolic tumor volume).') }}</p>
            </div>
          </div>
          <!-- GRUPO B · 3 avisos de factibilidad + «La fórmula» = 4 tarjetas → grid que LLENA parejo
               a cada ancho (2 col en sm, 4 col en xl), sin tarjeta huérfana ni hueco a la derecha.
               «La fórmula» deja de quedar aislada al final: cierra la fila de cuatro a lo ancho del
               modo wiki. En móvil apila en 1 col. -->
          <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#8a5a1a' }">
              <p class="text-[12px] font-semibold mb-1 flex items-center gap-1.5 flex-wrap" :style="{ color: '#8a5a1a' }">{{ L('Aviso · antecedente 26B585', 'Flag · prior history 26B585') }}<span class="status-badge status-badge--candidate">{{ L('lección', 'lesson') }}</span></p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('La biopsia previa 26B585 (ilíaco derecho, #13) FALLÓ: solo dio hueso y músculo, sin tumor evaluable. La lección: la zona biopsiada era hueso denso (blástico), que rinde poco — por eso el rendimiento (forma) pesa en la lente: el tejido lítico / partes blandas suele rendir más tumor evaluable que el hueso denso. Se muestra como aviso; no entra en el número.', 'The prior 26B585 biopsy (right iliac, #13) FAILED: only bone and muscle, no evaluable tumor. The lesson: the sampled zone was dense (blastic) bone, which yields little — that is why yield (shape) weighs in the lens: lytic / soft-tissue tissue usually yields more evaluable tumor than dense bone. Shown as a flag; not part of the number.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#1f6b57' }">
              <p class="text-[12px] font-semibold mb-1 flex items-center gap-1.5 flex-wrap" :style="{ color: '#1f6b57' }">{{ L('Aviso · partes blandas (RMN)', 'Flag · soft tissue (MRI)') }}<span class="status-badge status-badge--shape">{{ L('factibilidad', 'feasibility') }}</span></p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Donde la RMN describe componente de partes blandas / extensión extraósea (p.ej. epidural de D11, #7), hay una diana de tejido blando que suele rentabilizar más que el hueso blástico denso. La RMN conecta así con la FACTIBILIDAD. Es FORMA/extensión del informe, no biología; la cercanía al canal/raíces la valora intervencionista. No entra en el número.', 'Where the MRI describes a soft-tissue / extraosseous component (e.g. D11 epidural, #7), there is a soft-tissue target that usually yields more than dense blastic bone. This is how the MRI connects to FEASIBILITY. It is SHAPE/extent from the report, not biology; proximity to the canal/roots is assessed by interventional radiology. Not part of the number.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#6b6470' }">
              <p class="text-[12px] font-semibold mb-1 text-tinta">{{ L('Aviso · accesibilidad', 'Flag · accessibility') }}</p>
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
              <button type="button" :aria-pressed="selected === le.id" @click="pickAndShow(le.id)"
                class="w-full text-left rounded-card border px-3.5 py-3 transition-colors"
                :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.12)] bg-cream-card hover:border-[rgba(45,27,61,0.3)]'">
                <div class="flex items-center gap-3">
                  <span class="w-5 shrink-0 text-right font-mono text-[13px] text-tinta tabular-nums">{{ i + 1 }}</span>
                  <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center text-white text-xs font-semibold" :style="{ background: phenoColor(le), color: markerInk(le) }">{{ le.id }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-berenjena text-sm leading-tight">{{ le.level[lang] }}</p>
                    <p class="text-[11px] text-tinta leading-tight">{{ le.region[lang] }} · {{ le.side === 'R' ? L('dcha', 'R') : le.side === 'L' ? L('izda', 'L') : L('centro', 'mid') }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-display text-2xl text-berenjena tabular-nums leading-none">{{ suitabilityScore(le) }}</div>
                    <div class="eyebrow--sm">{{ L('idoneidad', 'suitability') }}</div>
                  </div>
                </div>
                <!-- los tres factores que componen el número (visibles, no solo el total) -->
                <div class="mt-3 grid sm:grid-cols-3 gap-x-4 gap-y-2">
                  <div>
                    <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                      <span class="text-tinta">{{ L('Captación (FDG/Ga)', 'Uptake (FDG/Ga)') }}</span>
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
                  <span v-if="hasSoftTissue(le)" class="pill-data" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas (RMN) · suele rendir más tejido', '+ soft tissue (MRI) · usually yields more tissue') }}</span>
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
            <p class="eyebrow--sm mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: '#8a4a1a' }">
              <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#bf7d2c' }" />
              {{ L('Detectados por IA · fuera del orden', 'AI-detected · outside the order') }}
              <span class="status-badge status-badge--candidate">{{ L('sin confirmar', 'unconfirmed') }}</span>
            </p>
            <p class="text-[12.5px] text-tinta leading-relaxed mb-3">
              {{ L('Estos focos los detectó una IA sobre los DICOM y no constan en el informe oficial. Candidatos sí, peso real no: requieren correlación de imagen con Medicina Nuclear antes de considerarse diana. Por eso quedan fuera del orden de arriba.',
                    'These foci were detected by an AI on the DICOM and are not in the official report. Candidates yes, real weight no: they require imaging correlation with Nuclear Medicine before being considered a target. That is why they stay outside the order above.') }}
            </p>
            <ul class="space-y-2">
              <li v-for="le in aiCandidates" :key="le.id">
                <button type="button" :aria-pressed="selected === le.id" @click="pickAndShow(le.id)"
                  class="w-full text-left rounded-card border px-3.5 py-3 transition-colors"
                  :class="selected === le.id ? 'border-[#bf7d2c] bg-[rgba(191,125,44,0.08)]' : 'border-[rgba(138,74,26,0.25)] bg-cream hover:border-[rgba(138,74,26,0.5)]'">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center text-white text-xs font-semibold ai-dot" :style="{ background: phenoColor(le), color: markerInk(le) }">{{ le.id }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-berenjena text-sm leading-tight">{{ le.level[lang] }}</p>
                      <p class="text-[11px] text-tinta leading-tight">{{ le.region[lang] }} · {{ le.side === 'R' ? L('dcha', 'R') : le.side === 'L' ? L('izda', 'L') : L('centro', 'mid') }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="font-display text-2xl tabular-nums leading-none" :style="{ color: '#8a4a1a' }">{{ suitabilityScore(le) }}</div>
                      <div class="eyebrow--sm" :style="{ color: '#8a4a1a' }">{{ L('idoneidad · s/c', 'suitability · n/c') }}</div>
                    </div>
                  </div>
                  <!-- los MISMOS tres factores que un foco confirmado (visibles, no solo el total) -->
                  <div class="mt-3 grid sm:grid-cols-3 gap-x-4 gap-y-2">
                    <div>
                      <div class="flex justify-between items-baseline text-[10.5px] mb-0.5">
                        <span class="text-tinta">{{ L('Captación (FDG/Ga)', 'Uptake (FDG/Ga)') }}</span>
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
        <!-- ===== MAPA DE FENOTIPO (CUADRANTES) ===== -->
        <section class="mb-14" aria-labelledby="fenotipo">
          <p class="eyebrow mb-2 block">{{ L('La misma selección, por tipo', 'The same selection, by type') }}</p>
          <h2 id="fenotipo" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('Mapa de fenotipo — la tercera vista enlazada', 'Phenotype map — the third linked view') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Cada lesión situada por sus dos trazadores a la vez: el eje horizontal es el azúcar (FDG) y el vertical el receptor (Galio). Cada cuadrante está rotulado en el propio gráfico. Toca un punto para abrir su ficha; las divisiones son orientativas.',
              'Each lesion placed by both tracers at once: the horizontal axis is sugar (FDG) and the vertical the receptor (gallium). Each quadrant is labelled on the chart itself. Tap a dot to open its card; the dividers are indicative.') }}
          </p>
          <!-- contenedor CONTENIDO: el scatter ya no ocupa todo el ancho (se veía
               «gigante»); leyenda mínima como banda fina DEBAJO, no muro lateral. -->
          <div class="card-base !p-3">
              <svg viewBox="0 0 440 340" class="w-full" role="group" :aria-label="L('Diagrama de fenotipo: receptor frente a FDG (toca un punto para abrir su ficha)', 'Phenotype scatter: receptor versus FDG (tap a point to open its card)')">
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
                <!-- etiquetas de cuadrante · sutiles (uppercase, tracking, peso medio):
                     orientan sin gritar; el dato vivo son los puntos. -->
                <g font-family="Source Sans 3, sans-serif" font-size="8.5" font-weight="600" letter-spacing="0.6">
                  <text :x="qX(0) + 8" :y="qY(Q.ymax) + 14" fill="#7a2f86">{{ L('SOLO RECEPTOR', 'RECEPTOR ONLY') }}</text>
                  <text :x="qX(Q.xmax) - 6" :y="qY(Q.ymax) + 14" text-anchor="end" fill="#8a5a1a">{{ L('MIXTO', 'MIXED') }}</text>
                  <text :x="qX(Q.xmax) - 6" :y="qY(0) - 9" text-anchor="end" fill="#9e3620">{{ L('SOLO AZÚCAR', 'SUGAR ONLY') }}</text>
                  <text :x="qX(0) + 8" :y="qY(0) - 9" fill="#57525c">{{ L('BAJA AVIDEZ', 'LOW AVIDITY') }}</text>
                </g>
                <!-- títulos de eje -->
                <text :x="(qX(0) + qX(Q.xmax)) / 2" :y="Q.H - 6" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" fill="#2d1b3d">{{ L('FDG SUVmáx · azúcar →', 'FDG SUVmax · sugar →') }}</text>
                <text :transform="`translate(13,${(qY(Q.ymax) + qY(0)) / 2}) rotate(-90)`" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" fill="#2d1b3d">{{ L('⁶⁸Ga SUVmáx · receptor (↑)', '⁶⁸Ga SUVmax · receptor (↑)') }}</text>
                <!-- puntos = lesiones · ESQUEMA SIMPLE: círculo relleno del color del
                     trazador + número + contorno punteado (IA por confirmar) + borde
                     oscuro si está seleccionado. Tamaño UNIFORME (la posición ya codifica
                     los dos SUV). Sin halo, sin parpadeo, sin tamaño ∝ SUVmáx. -->
                <g v-for="d in quadDots" :key="'qd' + d.le.id" v-show="visible(d.le)">
                  <circle :cx="d.px" :cy="d.py" :r="DOT_R"
                    :fill="phenoColor(d.le)"
                    :stroke="selected === d.le.id ? '#2d1b3d' : '#ffffff'"
                    :stroke-width="selected === d.le.id ? 2.5 : 1.2"
                    :stroke-dasharray="sourceOf(d.le) === 'ia-david' ? '2 1.6' : undefined"
                    class="cursor-pointer transition-all" tabindex="0" role="button" :aria-pressed="selected === d.le.id"
                    :aria-label="`#${d.le.id} ${d.le.level[lang]} — Ga ${d.le.dota ?? '—'} / FDG ${d.le.fdg ?? '—'}`"
                    @click="pickAndShow(d.le.id)" @keydown.enter="pickAndShow(d.le.id)" @keydown.space.prevent="pickAndShow(d.le.id)"
                    @mouseenter="canHoverFine() && showTip($event, lesionTipText(d.le))" @mouseleave="hideTip" @focus="showTip($event, lesionTipText(d.le))" @blur="hideTip" @keydown.escape="hideTip" />
                  <text :x="d.px" :y="d.py + 3" text-anchor="middle" font-family="Source Sans 3, sans-serif" :font-size="d.le.id > 9 ? 8.5 : 9.5" font-weight="700" :fill="markerInk(d.le)" class="pointer-events-none select-none">{{ d.le.id }}</text>
                </g>
              </svg>

              <!-- MICRO-NOTA DE HONESTIDAD · color=trazador y número=id ya se explican
                   en el esqueleto y los cuadrantes están rotulados DENTRO del gráfico;
                   aquí solo queda la distinción confirmado↔IA (la única no obvia) + el
                   encuadre. La leyenda "qué significa cada círculo" se retiró (redundante). -->
              <div class="mt-2.5 pt-2.5 border-t border-[rgba(45,27,61,0.08)]">
                <p class="inline-flex items-center gap-1.5 text-[11.5px] text-tinta">
                  <svg width="14" height="14" viewBox="0 0 14 14" class="shrink-0" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" :fill="PHENO.mixAgg.c" stroke="#fff" stroke-width="1.1" stroke-dasharray="2 1.6" />
                  </svg>
                  <span><strong class="text-berenjena font-semibold">{{ L('contorno punteado', 'dashed outline') }}</strong> {{ L('= detectado por IA, por confirmar (#17/#18/#19)', '= AI-detected, to confirm (#17/#18/#19)') }}</span>
                </p>
                <p class="text-[10.5px] text-tinta leading-relaxed mt-2">{{ L('Etiquetado por trazador y forma, no por biología; describe, no concluye. SUVmáx de los informes.', 'Labelled by tracer and shape, not by biology; it describes, it does not conclude. SUVmax from the reports.') }}</p>
              </div>
          </div>
        </section>
        <!-- ===== ZONA C · IMAGEN REAL (pestañas) ===== -->
        <section class="mb-14" aria-labelledby="imagen">
          <p class="eyebrow mb-2 block">{{ L('La imagen real', 'The real imaging') }}</p>
          <h2 id="imagen" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">
            {{ L('La imagen real, reconstruida de los DICOM', 'The real imaging, reconstructed from the DICOM') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Reconstruido de los DICOM. Lo valioso de un vistazo: cuerpo entero (MIP) y columna en PET, con los dos trazadores. Pulsa cualquiera para abrirla en grande y recorrerlas todas con las flechas. La resonancia (RMN), debajo.',
                  'Reconstructed from the DICOM. The valuable bits at a glance: whole body (MIP) and the spine on PET, with both tracers. Tap any to open it large and browse them all with the arrows. The MRI is below.') }}
          </p>

          <!-- DE UN VISTAZO · las 4 imágenes de estudio (MIP + columna, ambos trazadores)
               como miniaturas etiquetadas, sin pestañas: cada una abre el lightbox-galería
               navegable (flechas + contador) y «ver las 4 a la vez». -->
          <ul class="study-thumbs" role="list">
            <li v-for="p in PET_IMGS" :key="'st-' + p.src" class="study-thumb">
              <button
                type="button"
                class="study-thumb__btn"
                :aria-label="L('Ampliar ' + p.es + ' y recorrer las imágenes de estudio', 'Enlarge ' + p.en + ' and browse the study images')"
                @click="openPetLightbox(p.src)">
                <span class="study-thumb__frame">
                  <img :src="petDisplaySrc(p.src)" :alt="L(p.es, p.en)" class="study-thumb__img" loading="lazy" />
                  <span class="study-thumb__zoom" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                  </span>
                  <span class="study-thumb__kind">{{ p.kind === 'mip' ? L('Cuerpo entero (MIP)', 'Whole body (MIP)') : L('Columna · sagital', 'Spine · sagittal') }}</span>
                </span>
                <span class="study-thumb__meta" :style="{ color: petTracerColor(p) }">
                  {{ p.tracer === 'ga' ? '⁶⁸Ga-DOTATOC · 26/05/2026 · ' + L('receptor', 'receptor') : '¹⁸F-FDG · 24/03/2026 · ' + L('azúcar', 'sugar') }}
                </span>
              </button>
            </li>
          </ul>
          <!-- (auditoría de propósito) fuera el botón «Ver las 4» (la cuadrícula vive dentro del
               lightbox al ampliar una imagen) y el toggle Gris/Calor (el propio «calor» se lee
               peor; gris por defecto, más diagnóstico). Queda el caption honesto. -->
          <p class="text-[11px] text-tinta leading-snug max-w-3xl mt-3">{{ L('MIP cualitativa (el SUVmáx está en la tabla y la ficha). Lo más intenso es biodistribución fisiológica: en ¹⁸F-FDG (24/03/2026), encéfalo, miocardio (variable), sistema excretor y vejiga; en ⁶⁸Ga-DOTATOC (26/05/2026), hipófisis, bazo, hígado, riñones, suprarrenales y vejiga. Las metástasis son los focos del esqueleto.', 'Qualitative MIP (SUVmax is in the table and card). The most intense areas are physiological biodistribution: on ¹⁸F-FDG (24/03/2026), brain, myocardium (variable), excretory system and bladder; on ⁶⁸Ga-DOTATOC (26/05/2026), pituitary, spleen, liver, kidneys, adrenals and bladder. The metastases are the skeletal foci.') }}</p>

          <!-- columna en RMN · debajo (su propio visor de cortes; los hallazgos son cita del informe) -->
          <div class="mt-8 pt-6 border-t border-[rgba(45,27,61,0.1)]">
            <p class="eyebrow mb-2 block">{{ L('La columna en resonancia', 'The spine on MRI') }}</p>
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('La RMN ve el hueso y la médula ósea con más detalle que el CT del PET. Desliza para recorrer los cortes.',
                    'The MRI shows bone and bone marrow in more detail than the PET-CT. Slide to scroll through the slices.') }}
            </p>
            <!-- el visor RMN se autolimita a ~520px y se centra; sin acotar el card,
                 dejaba ~700px de aire muerto a los lados en escritorio. Acotamos el
                 contenedor para que abrace el visor (sin huecos), centrado. -->
            <div class="card-base max-w-xl mx-auto">
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
                  {{ L('la forma (blástico denso = rinde poco; lítico / partes blandas = rinde más) y el componente de partes blandas que describe la RMN son señales de RENDIMIENTO tisular. El componente epidural de D11 es una diana de tejido blando que suele rentabilizar más que el hueso denso (su vecindad al canal y a las raíces la valora radiología intervencionista). Es FORMA/extensión del informe; alimenta los avisos de factibilidad de la lente, no la biología.',
                        'shape (dense blastic = low yield; lytic / soft tissue = higher yield) and the soft-tissue component the MRI describes are tissue-YIELD signals. The D11 epidural component is a soft-tissue target that usually yields more than dense bone (its proximity to the canal and roots is assessed by interventional radiology). It is SHAPE/extent from the report; it feeds the lens’s feasibility flags, not the biology.') }}
                  <button type="button" @click="pickAndShow(7)" class="link-action text-miriam inline-flex items-center gap-1">{{ L('ver el foco D11 (#7)', 'see the D11 focus (#7)') }} <span aria-hidden="true">→</span></button>
                </p>
              </div>
            </div>

            <div class="alert-callout leading-relaxed mt-4">
              {{ L('Las imágenes de la RMN se muestran para verlas; los hallazgos de arriba están transcritos del informe de RM (11/06/2026) y no son una relectura de la imagen por esta herramienta. Su lectura formal corresponde al radiólogo. Los SUV del resto de la página vienen de los informes del PET.',
                    'The MRI images are shown for viewing; the findings above are transcribed from the MRI report (11 Jun 2026) and are not a re-reading of the image by this tool. Its formal reading belongs to the radiologist. The SUVs in the rest of the page come from the PET reports.') }}
            </div>
          </div>

          <!-- ===== GALERÍA "contact-sheet" · TODAS las key-images por foco ===== -->
          <!-- Petición de la paciente: las imágenes construidas con DICOM, todas en
               fila/cuadrícula y poder abrirlas en grande. Reutiliza el MISMO lightbox
               (openKeyLightboxFor → selecciona el foco + abre el modal con zoom/planos). -->
        </section>

        <!-- ===== SECCIÓN PROPIA · «Imágenes clave por foco» (petición: que sea sección).
             Una imagen-corte PET-CT por foco con el anillo del SUVmáx → confirmar que el
             foco es real y ver su anatomía. Reutiliza el MISMO lightbox. ===== -->
        <section class="mb-14" aria-labelledby="imagenes-clave">
            <p class="eyebrow mb-2 block">{{ L('Una por foco · todas en fila', 'One per focus · all in a row') }}</p>
            <h2 id="imagenes-clave" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[7.5rem]">{{ L('Imágenes clave por foco · PET-CT', 'Key images per focus · PET-CT') }}</h2>
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Cada foco confirmado, con su corte axial PET-CT y el anillo del SUVmáx. Pulsa cualquiera para abrirla en grande (zoom, arrastre y los planos que tenga: sagital o coronal). Los focos detectados por IA van al final, por confirmar.',
                    'Each confirmed focus, with its axial PET-CT slice and the SUVmax ring. Tap any to open it large (zoom, drag and the planes it has: sagittal or coronal). AI-detected foci are at the end, to confirm.') }}
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

                <!-- fallback celda-nota (sin lightbox). Hoy sin uso: todos los focos
                     IA muestran su miniatura con marca punteada y abren el lightbox. -->
                <div v-else class="foco-key-tile foco-key-tile--note is-ai">
                  <span class="foco-key-tile__noteframe">
                    <span class="status-badge status-badge--candidate">{{ L('por confirmar', 'to confirm') }}</span>
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
              {{ L('Imágenes reconstruidas del PET-CT; el anillo marca el SUVmáx (un vóxel), aproximado por resolución/co-registro; no sustituye la lectura formal.',
                    'Images reconstructed from the PET-CT; the ring marks the SUVmax (a single voxel), approximate due to resolution/co-registration; it does not replace the formal reading.') }}
            </p>
        </section>
        <!-- ===== ZONA D · TRAYECTORIA (movida TRAS idoneidad: primero se decide la
             diana, y la evolución temporal queda como contexto antes del apéndice) ===== -->
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
        <!-- ===== ZONA E · APÉNDICE DE REFERENCIA (tabla) — abierta por defecto (vista clínica) ===== -->
        <!-- (homogeneidad) regla de capítulo antes del apéndice, como /ciencia. -->
        <hr class="chapter-rule" aria-hidden="true" />
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
                <tr v-else class="cursor-pointer" :class="selected === row.le.id ? 'bg-[rgba(157,68,171,0.08)]' : (isAiDavid(row.le) ? 'ai-row' : '')" @click="pickAndShow(row.le.id)">
                  <template v-if="row.kind === 'lesion'">
                  <td><span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-semibold" :class="isAiDavid(row.le) ? 'ai-dot' : ''" :style="{ background: phenoColor(row.le), color: markerInk(row.le) }">{{ row.le.id }}</span></td>
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
          <div class="alert-callout leading-relaxed mt-4">
            <strong>{{ L('Por aclarar', 'To clarify') }}</strong>
            <p class="mt-1 mb-1.5">{{ L('Los datos de este panel provienen de una re-lectura cuantitativa sobre el DICOM nativo (validada): es una medición asistida, no sustituye la lectura formal de Medicina Nuclear. Quedan estas incertidumbres reales:', 'The data in this panel come from a quantitative re-reading of the native DICOM (validated): it is an assisted measurement, it does not replace the formal Nuclear Medicine reading. These genuine uncertainties remain:') }}</p>
            <ul class="list-disc pl-5 mt-1.5 space-y-1">
              <li>{{ L('La extensión metabólica del #2 (C4) y del #6 (D9) no es fiable: su captación es ≈ el fondo óseo y no se separa del hueso normal.', 'The metabolic extent of #2 (C4) and #6 (D9) is not reliable: their uptake is ≈ bone background and cannot be separated from normal bone.') }}</li>
              <li>{{ L('Los focos detectados por IA #17 (costilla), #18 (ilíaco-femoral) y #19 (cervicotorácica) no constan en el informe oficial — a revisar con Medicina Nuclear (#17 y #19 además con medida poco fiable / no medible).', 'AI-detected foci #17 (rib), #18 (iliac-femoral) and #19 (cervicothoracic) are not in the official report — to review with Nuclear Medicine (#17 and #19 also with unreliable / non-measurable values).') }}</li>
            </ul>
          </div>

          <!-- FOCOS EXTRA detectados automáticamente (no en la tabla) -->
          <div class="data-card mt-4">
            <div class="px-4 py-3">
              <p class="eyebrow--sm text-berenjena mb-1 flex items-center gap-2 flex-wrap">
                {{ L('Focos extra detectados (automático, no en la tabla)', 'Extra foci detected (automatic, not in the table)') }}
                <span class="status-badge status-badge--active">{{ L('verificación', 'verification') }}</span>
              </p>
              <p class="text-[12px] text-tinta leading-relaxed mb-2">{{ L('Focos FDG que la detección automática halló sobre el DICOM y que NO están en la tabla. No es diagnóstico: es para que el equipo decida si añadir alguno. El primero (HU 1) probablemente es captación de partes blandas; el blástico de SUVmáx 5,82 (HU 704, lado izq.) es el más sugestivo de lesión real no listada.', 'FDG foci the automatic detection found on the DICOM that are NOT in the table. Not a diagnosis: for the team to decide whether to add any. The first (HU 1) is likely soft-tissue uptake; the blastic SUVmax 5.82 (HU 704, left) is the most suggestive of a real unlisted lesion.') }}</p>
              <!-- pills-wrap: estos chips son frases largas (SUVmáx·forma·tamaño·lado·aviso),
                   no etiquetas cortas → el nowrap global de .pill-data los recortaba en móvil.
                   Aquí permitimos que su texto se ajuste (solo en este contenedor) para que
                   ningún dato quede cortado. -->
              <div class="flex flex-wrap gap-2 pills-wrap">
                <span v-for="(c, i) in AUTO_NEW_FDG" :key="i" class="pill-data" :style="{ background: c.flag ? '#fde4cc' : 'rgba(45,27,61,0.06)', color: c.flag ? '#8a4a1a' : '#3a3340' }">
                  SUVmáx {{ c.suvmax }} · {{ c.morph }} · {{ c.size }} mm · {{ c.side }}<template v-if="c.flag"> · {{ c.flag }}</template>
                </span>
              </div>
            </div>
          </div>
          </details>
        </section>
        <!-- ===== VISIÓN GENERAL · enfermedad ósea de un vistazo (referencia, al FINAL) =====
             Contexto general del caso: KPIs descriptivos de los dos PET + el desglose
             plegado (concordancia, trayectoria, cómo se lee, resumen para el equipo).
             Va al final de la wiki como REFERENCIA — la respuesta (dianas idóneas) ya
             está arriba; esto es el «todo el tocho» ordenado, de menos a más detalle. -->
        <section class="mb-14" aria-labelledby="cockpit">
          <p class="eyebrow mb-2 block">{{ L('Referencia · cómo se lee y desglose', 'Reference · how to read it and the breakdown') }}</p>
          <div class="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-1 mb-3">
            <h2 id="cockpit" class="heading-display text-2xl text-berenjena scroll-mt-[7.5rem]">{{ L('Cómo se lee · desglose del caso', 'How to read it · case breakdown') }}</h2>
            <p class="text-[11px] text-tinta">{{ L('la leyenda de los dos trazadores y la concordancia · sin interpretación', 'the two-tracer legend and concordance · no interpretation') }}</p>
          </div>
          <!-- Las cifras del caso (carga, reparto, rangos SUV, evolución) viven ARRIBA en
               la banda de contexto (#contexto-general); aquí NO se repiten. Esta sección
               conserva lo único: concordancia receptor↔azúcar, resumen para el equipo y la
               leyenda «cómo se lee» (#dos-caras), clave de color de toda la página. -->

          <!-- DESGLOSE secundario plegado: concordancia + trayectoria + resumen +
               «cómo se lee» (los dos trazadores). Es contexto, no debe apelotonar el
               héroe → se abre a demanda. -->
          <details class="notes-disclosure">
            <summary>{{ L('Ver el desglose: concordancia, trayectoria, cómo se lee y resumen para el equipo', 'See the breakdown: concordance, trajectory, how to read it and summary for the team') }}</summary>

          <!-- concordancia (barra apilada) + trayectoria FDG -->
          <div class="grid md:grid-cols-2 gap-4 mt-4">
            <div class="card-base !p-4">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('Concordancia receptor ↔ azúcar', 'Receptor ↔ sugar concordance') }}</p>
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
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('Azúcar (FDG) vs estudio previo', 'Sugar (FDG) vs prior study') }}</p>
              <div class="grid grid-cols-4 gap-2 text-center">
                <div><div class="font-display text-2xl" :style="{ color: '#bb4128' }">{{ trajectory.neu }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('nuevos', 'new') }}</div></div>
                <div><div class="font-display text-2xl" :style="{ color: '#bb4128' }">↑ {{ trajectory.up }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('más FDG', 'more FDG') }}</div></div>
                <div><div class="font-display text-2xl" :style="{ color: '#1f5a3a' }">↓ {{ trajectory.down }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('menos FDG', 'less FDG') }}</div></div>
                <div><div class="font-display text-2xl text-berenjena">{{ trajectory.stable }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('estables', 'stable') }}</div></div>
              </div>
              <p class="text-[11px] text-tinta mt-2">{{ L('sobre ' + trajectory.withPrev + ' focos con valor en el PET previo (ene 2026)', 'over ' + trajectory.withPrev + ' foci with a value in the prior PET (Jan 2026)') }}</p>
            </div>
          </div>

          <!-- resumen para el equipo médico -->
          <div class="mt-4 rounded-card border border-[rgba(45,27,61,0.12)] bg-cream-card p-4">
            <p class="eyebrow--sm text-berenjena mb-2">{{ L('Resumen para el equipo médico', 'Summary for the medical team') }}</p>
            <p class="text-sm text-tinta leading-relaxed">
              {{ L(
                'Enfermedad ósea multinivel. ' + confirmedFoci.length + ' focos en el informe oficial (' + skeletonSplit.axial + ' axiales — columna y sacro — y ' + skeletonSplit.append + ' apendiculares — escápula, pelvis y cadera), más ' + aiFoci.length + ' focos por confirmar detectados por IA. Reparto receptor↔azúcar: ' + concordance.ne + ' captan solo receptor (Ga+/FDG−), ' + concordance.mix + ' son mixtos (ambos trazadores) y ' + concordance.agg + ' capta solo azúcar (Ga−/FDG+). Rango de SUVmáx: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Frente al PET previo (sobre ' + trajectory.withPrev + ' focos con valor previo): ' + trajectory.neu + ' nuevos, ' + trajectory.up + ' con más FDG, ' + trajectory.down + ' con menos y ' + trajectory.stable + ' estables. Las cifras son las de los informes oficiales del PET; el detalle por foco está en la ficha y en la tabla. Descripción, no consejo médico.',
                'Multilevel bone disease. ' + confirmedFoci.length + ' foci in the official report (' + skeletonSplit.axial + ' axial — spine and sacrum — and ' + skeletonSplit.append + ' appendicular — scapula, pelvis and hip), plus ' + aiFoci.length + ' foci to confirm detected by AI. Receptor↔sugar split: ' + concordance.ne + ' receptor-only (Ga+/FDG−), ' + concordance.mix + ' mixed (both tracers) and ' + concordance.agg + ' sugar-only (Ga−/FDG+). SUVmax range: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Versus the prior PET (over ' + trajectory.withPrev + ' foci with a prior value): ' + trajectory.neu + ' new, ' + trajectory.up + ' with more FDG, ' + trajectory.down + ' with less and ' + trajectory.stable + ' stable. Figures are those of the official PET reports; the per-focus detail is in the card and the table. Description, not medical advice.') }}
            </p>
          </div>

          <!-- ===== CÓMO SE LEE · una lesión, dos trazadores (referencia) =====
               Antes era una sección propia que apelotonaba el intro; ahora vive
               dentro de este desglose plegado, como material de referencia. -->
          <div id="dos-caras" class="mt-6 pt-5 border-t border-[rgba(45,27,61,0.1)] scroll-mt-[7.5rem]">
          <p class="eyebrow mb-2 block">{{ L('Cómo se lee · una lesión, dos trazadores', 'How to read it · one lesion, two tracers') }}</p>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
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
            <p class="eyebrow--sm text-berenjena mb-2">{{ L('La barra receptor ↔ azúcar', 'The receptor ↔ sugar bar') }}</p>
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
              {{ L('La verás en cada ficha y en cada fila: la parte violeta frente a la coral resume cuánto capta el receptor (Galio) frente al azúcar (FDG) en ese foco. En el mapa, el color va del violeta (solo receptor) al coral (solo azúcar); el SUVmáx se lee en los ejes del diagrama, en la tabla y en la ficha.',
                    'You’ll see it on every card and row: the violet versus coral share sums up how much that focus takes up the receptor (gallium) versus sugar (FDG). On the map, color runs from violet (receptor only) to coral (sugar only); the SUVmax is read off the scatter axes, the table and the card.') }}
            </p>
          </div>

          <!-- los tres patrones (por trazador) -->
          <div class="grid sm:grid-cols-3 gap-3 mt-4">
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#9d44ab' }">{{ L('Receptor + / FDG −', 'Receptor + / FDG −') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta el receptor (Galio) y poco o nada de azúcar.', 'Takes up the receptor (gallium) and little or no sugar.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#df7a44' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#8a5a1a' }">{{ L('Mixto (ambos)', 'Mixed (both)') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta los dos trazadores: receptor y azúcar a la vez.', 'Takes up both tracers: receptor and sugar at once.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#bb4128' }">{{ L('FDG + / Receptor −', 'FDG + / receptor −') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta azúcar (FDG) pero no el receptor, así que el Galio no lo ve.', 'Takes up sugar (FDG) but not the receptor, so gallium does not see it.') }}</p>
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
              'SUV y localizaciones: informe PET-CT ¹⁸F-FDG 24/03/2026 e informe PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 (Medicina Nuclear, H. Virgen de la Arrixaca). Imágenes PET: MIP, fusión sagital y cortes axiales reconstruidos a partir de los DICOM de ambos estudios (PET con corrección de atenuación + TC). Los SUV calculados desde los DICOM concuerdan con el informe dentro de ~10–12% (diferencia esperable entre voxel-máx y ROI). RMN: cortes sagitales de columna cervical y dorsal (secuencias STIR y T1) exportados de los DICOM de RM; se muestran solo para visualización y están pendientes de lectura radiológica formal. Ambos PET se administraron por reservorio (port-a-cath); si quedó actividad residual, todos los SUV podrían estar globalmente algo subestimados (no recalculable). No afecta a las comparaciones relativas entre focos.',
              'SUV and locations: ¹⁸F-FDG PET-CT report 24/03/2026 and ⁶⁸Ga-DOTATOC PET-CT report 26/05/2026 (Nuclear Medicine, Virgen de la Arrixaca Hospital). PET images: MIP, sagittal fusion and axial slices reconstructed from the DICOM of both studies (attenuation-corrected PET + CT). SUVs computed from the DICOM agree with the report within ~10–12% (expected difference between voxel-max and ROI). MRI: sagittal slices of the cervical and thoracic spine (STIR and T1 sequences) exported from the MR DICOM; shown for visualization only and pending formal radiology reading. Both PET tracers were given via a port (port-a-cath); if residual activity remained, all SUVs could be slightly underestimated globally (not recalculable). This does not affect relative comparisons between foci.') }}
          </p>
        </details>

        <!-- retorno a /ciencia (coherencia de sitio) -->
        <div class="mt-10 pt-6 border-t border-[rgba(45,27,61,0.1)]">
          <NuxtLink :to="localePath('ciencia')" class="link-action text-miriam">
            {{ L('El tejido y la biología molecular, en La ciencia', 'Tissue and molecular biology, in The science') }}
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
          </div><!-- /columna derecha (contenido wiki, 1fr) -->
        </div><!-- /rejilla rail+contenido (solo Zona 2) -->
          </div><!-- /contenedor centrado · re-acota el contenido a 1280 -->
        </div><!-- /zona wiki · full-bleed · fondo cream-card del DS -->
        <!-- ╚══════════════ FIN ZONA 2 · «Visión general del caso» ══════════════╝ -->
          </div>
      </div>
    </section>

    <!-- (A · plan comité web) TOOLTIP único de marcadores (esqueleto + scatter),
         teletransportado a <body> para que NO lo recorte el overflow del navegador
         sticky. La info ya está en el aria-label de cada marcador; esto solo la muestra
         visualmente en hover/focus. -->
    <Teleport to="body">
      <div v-if="tipOpen && tipText" ref="tipRef" role="tooltip"
        class="marker-tip" :class="['marker-tip--' + tipPlacement, { 'is-positioned': tipPositioned }]"
        :style="tipStyle">
        {{ tipText }}
        <span class="marker-tip__caret" :style="{ left: tipCaretLeft + 'px' }" aria-hidden="true" />
      </div>
    </Teleport>

    <!-- ===== LIGHTBOX · IMAGEN CLAVE DEL FOCO (zoom/pan + toggle de plano) ===== -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="keyLightboxOpen && selKeyActive"
          ref="keyLbEl"
          class="foco-key-lb"
          role="dialog"
          aria-modal="true"
          :aria-label="L('Imagen clave del foco #' + sel.id, 'Key image of focus #' + sel.id)"
          @click.self="closeKeyLightbox">
          <div class="foco-key-lb__panel">
            <div class="foco-key-lb__bar">
              <div class="min-w-0">
                <p class="foco-key-lb__title">
                  {{ L('Imagen clave · foco', 'Key image · focus') }} #{{ sel.id }}
                  <span v-if="keyLbCount > 1" class="foco-key-lb__count tabular-nums" aria-live="polite">{{ keyLbIndex + 1 }} / {{ keyLbCount }}</span>
                </p>
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

            <div class="foco-key-lb__stage foco-key-lb__stage--nav">
              <!-- GALERÍA: recorrer todas las imágenes clave (foco a foco) -->
              <button v-if="keyLbCount > 1" type="button" class="foco-key-lb__nav foco-key-lb__nav--prev" :aria-label="L('Imagen anterior', 'Previous image')" @click="keyLbStep(-1)">‹</button>
              <ImageZoomViewer
                :key="selKeyActive.src"
                :src="selKeyActive.src"
                :alt="L('Imagen clave (' + selKeyActive.label.es.toLowerCase() + ') del foco #' + sel.id + ' · ' + sel.level.es, 'Key image (' + selKeyActive.label.en.toLowerCase() + ') of focus #' + sel.id + ' · ' + sel.level.en)"
                max-width="100%"
                max-height="74vh" />
              <button v-if="keyLbCount > 1" type="button" class="foco-key-lb__nav foco-key-lb__nav--next" :aria-label="L('Imagen siguiente', 'Next image')" @click="keyLbStep(1)">›</button>
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
          ref="petLbEl"
          class="foco-key-lb"
          role="dialog"
          aria-modal="true"
          :aria-label="petLightboxMode === 'grid' ? L('Las 4 imágenes PET a la vez', 'All 4 PET images at once') : L('Imagen PET ampliada', 'Enlarged PET image')"
          @click.self="closePetLightbox">
          <div class="foco-key-lb__panel foco-key-lb__panel--wide">
            <div class="foco-key-lb__bar">
              <div class="min-w-0">
                <p class="foco-key-lb__title">
                  {{ petLightboxMode === 'grid' ? L('Las 4 PET a la vez', 'All 4 PET at once') : L(petLightboxImg.es, petLightboxImg.en) }}
                  <span v-if="petLightboxMode === 'single'" class="foco-key-lb__count tabular-nums" aria-live="polite">{{ petLbIndex + 1 }} / {{ PET_IMGS.length }}</span>
                </p>
                <p class="foco-key-lb__sub">{{ petLightboxMode === 'grid' ? L('MIP y columna sagital · receptor (Galio) y azúcar (FDG)', 'MIP and sagittal spine · receptor (gallium) and sugar (FDG)') : L('reconstruida de los DICOM · flechas ‹ › para recorrerlas · rueda/pinza para acercar', 'reconstructed from the DICOM · arrows ‹ › to browse · wheel/pinch to zoom') }}</p>
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

            <div class="foco-key-lb__stage" :class="{ 'foco-key-lb__stage--nav': petLightboxMode === 'single' }">
              <!-- las 4 PET en cuadrícula 2×2, cada una con su propio zoom -->
              <div v-if="petLightboxMode === 'grid'" class="pet-lb-grid">
                <figure v-for="p in PET_IMGS" :key="p.src" class="pet-lb-grid__cell">
                  <ImageZoomViewer :key="petDisplaySrc(p.src)" :src="petDisplaySrc(p.src)" :alt="L(p.es, p.en)" max-width="100%" max-height="42vh" />
                  <figcaption class="pet-lb-grid__cap" :style="{ color: petTracerColor(p) }">{{ L(p.es, p.en) }}</figcaption>
                </figure>
              </div>
              <!-- una sola, ampliada al máximo + GALERÍA (recorrer las 4 con flechas) -->
              <template v-else>
                <button type="button" class="foco-key-lb__nav foco-key-lb__nav--prev" :aria-label="L('Imagen anterior', 'Previous image')" @click="petLbStep(-1)">‹</button>
                <ImageZoomViewer :key="petDisplaySrc(petLightboxSrc)" :src="petDisplaySrc(petLightboxSrc)" :alt="L(petLightboxImg.es, petLightboxImg.en)" max-width="100%" max-height="80vh" />
                <button type="button" class="foco-key-lb__nav foco-key-lb__nav--next" :aria-label="L('Imagen siguiente', 'Next image')" @click="petLbStep(1)">›</button>
              </template>
            </div>

            <p class="foco-key-lb__cap">{{ L('Imágenes reconstruidas de los DICOM (PET-FDG 24/03/2026 y PET ⁶⁸Ga-DOTATOC 26/05/2026). Lo intenso fuera del esqueleto es captación normal de cada trazador. Para verlas y compararlas; su lectura formal corresponde al radiólogo.', 'Images reconstructed from the DICOM (FDG-PET 24/03/2026 and ⁶⁸Ga-DOTATOC PET 26/05/2026). The intense areas outside the skeleton are normal uptake of each tracer. For viewing and comparing; their formal reading belongs to the radiologist.') }}</p>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <!-- ===== OVERLAY · VISOR 3D A PANTALLA COMPLETA («Ver en grande») =====
         Petición de la paciente: el visor en línea va pequeño/contenido y un botón
         lo abre a pantalla completa con los 3 mapas grandes. Reutiliza BoneTriView
         TAL CUAL (otra instancia con el mismo `mesh-key` del foco seleccionado);
         la rotación se sincroniza DENTRO de cada instancia (una cámara, 3 viewports).
         Cierre Esc/botón/backdrop, bloqueo de scroll, role=dialog (a11y). -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="bone3dFullscreen && sel && bone3dKeyOf(sel)"
          ref="bone3dLbEl"
          class="foco-key-lb"
          role="dialog"
          aria-modal="true"
          :aria-label="L('Visor 3D del hueso a pantalla completa · foco #' + sel.id, 'Full-screen 3D bone viewer · focus #' + sel.id)"
          @click.self="closeBone3dFullscreen">
          <div class="foco-key-lb__panel foco-key-lb__panel--wide bone3d-lb__panel">
            <div class="foco-key-lb__bar">
              <div class="min-w-0">
                <p class="foco-key-lb__title">{{ L('Hueso en 3D · foco', '3D bone · focus') }} #{{ sel.id }} · {{ sel.level[lang] }}</p>
                <p class="foco-key-lb__sub">{{ L('reconstruido del CT · captación co-registrada · arrastra para girar (los 3 mapas giran a la vez), rueda/pinza para acercar', 'reconstructed from the CT · co-registered uptake · drag to rotate (all 3 maps rotate together), wheel/pinch to zoom') }}</p>
              </div>
              <button type="button" class="foco-key-lb__close" :aria-label="L('Cerrar', 'Close')" @click="closeBone3dFullscreen">×</button>
            </div>
            <div class="foco-key-lb__stage bone3d-lb__stage">
              <BoneTriView
                :mesh-key="bone3dKeyOf(sel)"
                :biopsied="bonePriorBiopsy != null" :no-target="isAiDavid(sel)"
                :biopsy-label="bonePriorBiopsy ?? undefined"
              />
            </div>
            <p class="foco-key-lb__cap">{{ L('Hueso reconstruido a partir del CT con la captación PET co-registrada (los 3 mapas). Herramienta de visualización; su lectura formal corresponde al radiólogo. Describe, no concluye.', 'Bone reconstructed from the CT with co-registered PET uptake (all 3 maps). A visualization tool; its formal reading belongs to the radiologist. Describes, does not conclude.') }}</p>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Anillo de FOCO de teclado para los marcadores SVG navegables (esqueleto + scatter):
   en <circle> el outline no se pinta de forma fiable en WebKit y box-shadow/
   border-radius no aplican a SVG, así que la regla global de foco no se ve. Usamos
   un stroke de foco (propiedad SÍ soportada en SVG). */
svg [role="button"]:focus-visible {
  outline: none;
  stroke: #9d44ab;
  stroke-width: 3;
}
/* ── «Detalle del foco» PLEGABLE (reducido por defecto, se expande) ───────── */
.foco-detalle > summary { list-style: none; }
.foco-detalle > summary::-webkit-details-marker { display: none; }
.foco-detalle__sum:hover .foco-detalle__open,
.foco-detalle__sum:hover .foco-detalle__close { text-decoration: underline; }
.foco-detalle .foco-detalle__close { display: none; }
.foco-detalle[open] .foco-detalle__open { display: none; }
.foco-detalle[open] .foco-detalle__close { display: inline; }
.foco-detalle[open] .foco-detalle__sum { margin-bottom: 0.85rem; }
.foco-detalle__chev { transition: transform 0.2s ease; }
.foco-detalle[open] .foco-detalle__chev { transform: rotate(180deg); }

/* ── DIVISIÓN CLARA entre Zona 1 (herramienta) y Zona 2 (wiki) ───────────
   Banda a TODO el ancho del contenedor centrado: cierra la herramienta y abre
   la «Visión general del caso». No es una rayita: es un bloque con fondo sutil
   (berenjena muy tenue), una regla gruesa superior y un título display, para
   que se lea sin duda «a partir de aquí, lo general». Tokens del DS. */
/* (refactor homogeneidad) .zone-divider* eliminado: era CSS MUERTO (ninguna plantilla
   lo usa; el divisor en vivo es eyebrow + heading-display, alineado a la izquierda). */

/* ── Índice de la wiki (Zona 2) · RAIL LATERAL ────────────────────────────
   El índice ya NO es una barra horizontal: es un rail vertical pegajoso en la
   columna izquierda de la rejilla de la Zona 2 (mismo patrón que /ciencia). El
   sticky/posición los aportan las utilidades de Tailwind en el propio
   MapaSectionNav (lg:sticky lg:top-24); el estilo del rail vive en el componente
   (variant="rail"). En <lg el rail se oculta y el desplegable «Saltar a…»
   (variant="mobile") va en el flujo, arriba del contenido. */

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

/* ── Chips de «Focos extra detectados» · texto largo que SÍ se ajusta ──────
   .pill-data global es `white-space: nowrap` (correcto para etiquetas cortas);
   estos chips concatenan una frase (SUVmáx·forma·tamaño·lado·aviso) y en móvil
   se recortaban. Solo en este contenedor permitimos el ajuste de línea para que
   no se pierda ningún dato. No afecta a ningún otro pill del sitio. */
.pills-wrap :deep(.pill-data) {
  white-space: normal;
  max-width: 100%;
  line-height: 1.35;
}

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

/* ---- Tira COMPACTA de la imagen clave (bajo el visor 3D) · miniatura + una línea,
   integrada en un contenedor coherente, sin huecos muertos. Pulsable → lightbox. ---- */
.foco-key-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
  padding: 6px 10px 6px 6px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  border-radius: 0.6rem;
  background: #f5efe6;
  text-align: left;
  cursor: zoom-in;
  transition: box-shadow 0.18s, border-color 0.18s;
}
.foco-key-strip:hover { border-color: rgba(157, 68, 171, 0.5); box-shadow: 0 3px 14px rgba(45, 27, 61, 0.14); }
.foco-key-strip:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }
.foco-key-strip__thumb {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 0.45rem;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(45, 27, 61, 0.12);
}
.foco-key-strip__img { display: block; width: 100%; height: 100%; object-fit: cover; }
.foco-key-strip__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
  color: #3a3340;
  font-weight: 500;
}
.foco-key-strip__zoom {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.06);
  border: 1px solid rgba(45, 27, 61, 0.18);
  color: #6b4a78;
}
.foco-key-strip:hover .foco-key-strip__zoom { background: rgba(157, 68, 171, 0.12); color: #4a2f55; }

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

/* ---- Imagen real PET: botón «ampliar» por figura ---- */
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

/* ---- DE UN VISTAZO · miniaturas de las imágenes de estudio (sin pestañas) ---- */
.study-thumbs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 720px;
}
@media (max-width: 640px) {
  .study-thumbs { grid-template-columns: repeat(2, 1fr); }
}
.study-thumb { margin: 0; }
.study-thumb__btn {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  text-align: left;
}
.study-thumb__frame {
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(45, 27, 61, 0.18);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.study-thumb__btn:hover .study-thumb__frame { border-color: rgba(157, 68, 171, 0.6); box-shadow: 0 4px 14px rgba(45, 27, 61, 0.18); }
.study-thumb__btn:focus-visible { outline: 2px solid #9d44ab; outline-offset: 3px; border-radius: 0.6rem; }
.study-thumb__img { display: block; width: 100%; height: 100%; object-fit: contain; }
.study-thumb__zoom {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.study-thumb__kind {
  position: absolute;
  left: 6px;
  top: 6px;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 9999px;
  background: rgba(20, 14, 22, 0.78);
  color: #fff;
}
.study-thumb__meta {
  display: block;
  margin-top: 0.4rem;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
}

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
/* contador «n / N» de la galería navegable (en la barra del título) */
.foco-key-lb__count {
  margin-left: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b6470;
}
.foco-key-lb__stage { padding: 0.75rem; overflow: auto; flex: 1 1 auto; min-height: 0; }
/* escenario con flechas de galería: las flechas flotan sobre los bordes del visor */
.foco-key-lb__stage--nav { position: relative; }
.foco-key-lb__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(20, 14, 22, 0.82);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s;
}
.foco-key-lb__nav:hover { background: rgba(45, 27, 61, 0.95); }
.foco-key-lb__nav:focus-visible { outline: 2px solid #ffd166; outline-offset: 2px; }
.foco-key-lb__nav--prev { left: 0.6rem; }
.foco-key-lb__nav--next { right: 0.6rem; }
.foco-key-lb__cap {
  padding: 0.5rem 0.9rem 0.85rem;
  font-size: 0.72rem;
  line-height: 1.45;
  color: #6b6470;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
}

/* ── Segmented control · toggle Esqueleto ↔ Tabla del navegador ──────── */
.seg {
  display: inline-flex;
  border: 1px solid rgba(45, 27, 61, 0.2);
  border-radius: 9999px;
  overflow: hidden;
  background: #fbf7f0;
}
.seg__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.32rem 0.85rem;
  color: #6b6470;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.seg__btn + .seg__btn { border-left: 1px solid rgba(45, 27, 61, 0.2); }
.seg__btn:hover { color: #2d1b3d; }
.seg__btn.is-active { background: #2d1b3d; color: #fdf6ef; }
.seg__btn:focus-visible { outline: 2px solid #9d44ab; outline-offset: -2px; }

/* ── Botón «Ver en grande» del visor 3D ─────────────────────────────── */
.btn-expand3d {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fbf7f0;
  color: #2d1b3d;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-expand3d:hover { background: #f0e7f3; border-color: rgba(157, 68, 171, 0.5); }
.btn-expand3d:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }

/* ── Overlay 3D a pantalla completa ─────────────────────────────────── */
.bone3d-lb__panel { width: min(1280px, 100%); max-height: 94vh; }
.bone3d-lb__stage {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bone3d-lb__stage > :deep(*) { width: 100%; }

@media (prefers-reduced-motion: reduce) {
  .seg__btn,
  .btn-expand3d { transition: none; }
}
/* (A · plan comité web) tooltip de marcadores (esqueleto + scatter), clon de Term.vue */
.marker-tip {
  position: fixed;
  z-index: 60;
  padding: 8px 11px;
  border-radius: 10px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 12.5px;
  line-height: 1.45;
  white-space: normal;
  pointer-events: none;
  box-shadow: 0 14px 34px -12px rgba(45, 27, 61, 0.55);
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.marker-tip.is-positioned { opacity: 1; transform: none; }
.marker-tip__caret {
  position: absolute;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  background: #2d1b3d;
  transform: rotate(45deg);
}
.marker-tip--top .marker-tip__caret { bottom: -4px; }
.marker-tip--bottom .marker-tip__caret { top: -4px; }
@media (prefers-reduced-motion: reduce) {
  .marker-tip {
    transition: none;
    transform: none;
  }
}
</style>
