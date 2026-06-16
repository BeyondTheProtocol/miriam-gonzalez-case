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
  title: () =>
    lang.value === 'en'
      ? 'Metastasis map — dual-tracer PET'
      : 'Mapa de metástasis — PET doble trazador',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content:
        'Mapa interactivo de las lesiones óseas con doble trazador (Galio-68 DOTATOC y FDG) sobre los informes propios de la paciente.',
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
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne', size: '14 × 10',
    img: 'les05',
    level: { es: 'D5 (T5) · cuerpo vertebral', en: 'T5 · vertebral body' },
    region: { es: 'Columna dorsal media', en: 'Mid-thoracic spine' },
    what: { es: 'Cuerpo de una vértebra de la mitad de la espalda. Captación moderada-alta del receptor (Galio), sin azúcar (FDG).', en: 'Body of a mid-back vertebra. Moderate-high receptor (gallium) uptake, no sugar (FDG).' },
    tech: { es: 'DOTATOC SUVmáx 6.17, sin FDG. Capta solo el receptor (Galio), de intensidad moderada.', en: 'DOTATOC SUVmax 6.17, no FDG. Takes up only the receptor (gallium), moderate intensity.' },
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
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, pheno: 'ne', size: '13 × 10',
    level: { es: 'D11 (T11) · pedículo izquierdo', en: 'T11 · left pedicle' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'En la MISMA vértebra que la #7 pero en el pedículo izquierdo (el puente óseo lateral): aquí solo capta el receptor, no azúcar. Misma vértebra, dos comportamientos distintos.', en: 'In the SAME vertebra as #7 but in the left pedicle (the lateral bony bridge): here only the receptor lights up, no sugar. Same vertebra, two different behaviours.' },
    tech: { es: 'DOTATOC SUVmáx 11.63, sin FDG. Receptor-puro intenso. Ilustra la heterogeneidad intra-vértebra junto a la #7.', en: 'DOTATOC SUVmax 11.63, no FDG. Intense receptor-only. Illustrates intra-vertebral heterogeneity alongside #7.' },
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
    level: { es: 'Ilíaco derecho', en: 'Right iliac bone' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    img: 'crop_iliac',
    what: { es: 'Hueso de la pelvis (ala ilíaca) derecho. Capta los dos trazadores, con más azúcar que receptor.', en: 'Right pelvic bone (iliac wing). Takes up both tracers, more sugar than receptor.' },
    tech: { es: 'DOTATOC 4.32 / FDG 7.71 (previo 7.0, ligero aumento). Mixto, más azúcar que receptor.', en: 'DOTATOC 4.32 / FDG 7.71 (prior 7.0, slight rise). Mixed, more sugar than receptor.' },
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
    level: { es: 'Pélvico / ilíaco-femoral', en: 'Pelvic / iliac-femoral' },
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

/* procedencia del dato de cada foco (la IA = tabla medida sobre los DICOM, por
   confirmar). `c` = relleno/punto (tono vivo) · `tc` = color de TEXTO (AA sobre cream). */
const SOURCE: Record<'informe' | 'ambos' | 'ia-david', { es: string; en: string; c: string; tc: string }> = {
  informe: { es: 'Informe', en: 'Report', c: '#1f5a3a', tc: '#1f5a3a' },
  ambos: { es: 'Ambos', en: 'Both', c: '#9d44ab', tc: '#9d44ab' },
  'ia-david': { es: 'Detectado por IA · por confirmar', en: 'AI-detected · to confirm', c: '#bf7d2c', tc: '#8a4a1a' },
}
/* si no tiene fuente explícita: con tamaño = en ambos (casó con el PDF); sin tamaño = solo informe */
function sourceOf(le: Lesion): 'informe' | 'ambos' | 'ia-david' {
  return le.source ?? (le.size ? 'ambos' : 'informe')
}
function sourceMeta(le: Lesion) { return SOURCE[sourceOf(le)] }

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
const filter = ref<'all' | Pheno | 'load'>('all')
const sel = computed(() => LES.find((l) => l.id === selected.value)!)

function visible(le: Lesion): boolean {
  if (filter.value === 'all') return true
  if (filter.value === 'load') return !!le.load
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
const onlyNew = ref(false)
function isNewFocus(l: Lesion): boolean { return isNewAt(l, 1) }   // foco que enciende por primera vez (FDG)
const newCount = computed(() => LES.filter(isNewFocus).length)
function groupVisible(g: LesGroup): boolean {
  return g.foci.some(visible) && (!onlyNew.value || g.foci.some(isNewFocus))
}
function gPresentAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => presentAt(l, f)) }
function gRadius(g: LesGroup, f: number): number {
  const rs = g.foci.filter((l) => presentAt(l, f)).map((l) => frameRadius(l, f))
  return (rs.length ? Math.max(...rs) : 5) + (g.multi ? 1.5 : 0)
}
function gNewAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => isNewAt(l, f) && presentAt(l, f)) }
function gSelected(g: LesGroup): boolean { return g.foci.some((l) => l.id === selected.value) }
function pickGroup(g: LesGroup) { selected.value = g.primary.id }
const selGroup = computed<LesGroup>(() => GROUPS.find((g) => g.foci.some((l) => l.id === selected.value)) ?? GROUPS[0])
/* sub-localización del foco dentro de la vértebra (cuerpo, pedículo, espinosa…) para los chips */
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
  const W = 300, H = 116, padL = 26, padR = 16, padT = 12, padB = 22
  const mx = Math.max(8, Math.ceil(Math.max(prev, cur)))
  const X = (f: number) => padL + f * (W - padL - padR)
  const Y = (v: number) => H - padB - (v / mx) * (H - padT - padB)
  const step = Math.ceil(mx / 4)
  let g = ''
  for (let yy = 0; yy <= mx; yy += step) {
    g += `<line x1="${padL}" y1="${Y(yy).toFixed(1)}" x2="${W - padR}" y2="${Y(yy).toFixed(1)}" stroke="#eee6da"/><text x="${padL - 4}" y="${(Y(yy) + 3).toFixed(1)}" text-anchor="end" font-family="monospace" font-size="8" fill="#9b95a0">${yy}</text>`
  }
  for (let f = 0; f < 2; f++) {
    g += `<text x="${X(f).toFixed(1)}" y="${H - 7}" text-anchor="middle" font-family="monospace" font-size="8" fill="#9b95a0">${FDATES[f][lang.value].split(' ')[0]}</text>`
  }
  g += `<line x1="${X(0).toFixed(1)}" y1="${Y(prev).toFixed(1)}" x2="${X(1).toFixed(1)}" y2="${Y(cur).toFixed(1)}" stroke="#e8633a" stroke-width="1.4"/>`
  const pts: [number, number][] = [[0, prev], [1, cur]]
  pts.forEach(([f, vv]) => {
    const x = X(f), y = Y(vv)
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${f === 1 ? 3.2 : 2.6}" fill="#e8633a" stroke="#fff" stroke-width="0.8"/><text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b6470">${vv.toFixed(1)}</text>`
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
])

/* resumen */
const counts = computed(() => ({
  total: LES.length,
  ne: LES.filter((l) => l.fdg == null).length,
  mix: LES.filter((l) => l.fdg != null && l.dota != null).length,
  agg: LES.filter((l) => l.dota == null).length,
}))

/* ------------------------------------------------------------------ */
/*  Modo de densidad: «En claro» (por defecto) · «Clínico».            */
/*  NO oculta datos: fija si el detalle técnico/cuantificación/         */
/*  procedencia/apéndice van colapsados (claro) o abiertos (clínico).   */
/*  Una sola página, en capas.                                          */
/* ------------------------------------------------------------------ */
const density = ref<'plain' | 'clinical'>('plain')
const isClinical = computed(() => density.value === 'clinical')
/* A11y: anuncia el cambio de modo a lectores de pantalla (igual que /ciencia
   con su selector) — ningún cambio de contenido debe ser silencioso. */
const densityAnnounce = computed(() =>
  isClinical.value
    ? L('Modo clínico: detalle técnico, cuantificación y tabla abiertos.', 'Clinical mode: technical detail, quantification and table open.')
    : L('Modo en claro: detalle técnico, cuantificación y tabla plegados.', 'Plain mode: technical detail, quantification and table folded.'))

/* ------------------------------------------------------------------ */
/*  Panel-cockpit — KPIs SOLO descriptivos (sin verbos de acción).      */
/*  Separa los focos del informe de los 3 «detectados por IA» (por      */
/*  confirmar). Todo derivado del array LES; no añade interpretación.   */
/* ------------------------------------------------------------------ */
function isAiDavid(le: Lesion): boolean { return sourceOf(le) === 'ia-david' }
const confirmedFoci = computed(() => LES.filter((l) => !isAiDavid(l)))
const aiFoci = computed(() => LES.filter(isAiDavid))
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
/* rango de SUVmáx por trazador (solo focos del informe) */
function suvRange(vals: (number | null | undefined)[]): { min: number; max: number } | null {
  const xs = vals.filter((v): v is number => v != null)
  return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null
}
const dotaRange = computed(() => suvRange(confirmedFoci.value.map((l) => l.dota)))
const fdgRange = computed(() => suvRange(confirmedFoci.value.map((l) => l.fdg)))
const dotaRangeLabel = computed(() => (dotaRange.value ? dotaRange.value.min.toFixed(1) + '–' + dotaRange.value.max.toFixed(1) : '—'))
const fdgRangeLabel = computed(() => (fdgRange.value ? fdgRange.value.min.toFixed(1) + '–' + fdgRange.value.max.toFixed(1) : '—'))

/* pestañas de imagen real reconstruida de los DICOM */
const imgTab = ref<'mip' | 'pet' | 'rmn'>('mip')

/* ------------------------------------------------------------------ */
/*  Mapa de fenotipo — dispersión SUV FDG (x) vs SUV Galio/receptor (y) */
/*  Cuadrantes orientativos; los SUV son los de los informes.          */
/* ------------------------------------------------------------------ */
const Q = { W: 440, H: 340, padL: 52, padR: 18, padT: 30, padB: 46, xmax: 10.5, ymax: 14, divx: 4, divy: 4 }
const qX = (v: number) => Q.padL + (Math.max(0, Math.min(v, Q.xmax)) / Q.xmax) * (Q.W - Q.padL - Q.padR)
const qY = (v: number) => Q.H - Q.padB - (Math.max(0, Math.min(v, Q.ymax)) / Q.ymax) * (Q.H - Q.padT - Q.padB)
const qxTicks = [0, 2, 4, 6, 8, 10]
const qyTicks = [0, 2, 4, 6, 8, 10, 12, 14]
const quadDots = computed(() =>
  LES.map((le) => {
    const mx = Math.max(le.dota || 0, le.fdg || 0)
    const r = 5.5 + Math.min(mx, 14) * 0.38
    let px = qX(le.fdg == null ? 0 : le.fdg)
    let py = qY(le.dota == null ? 0 : le.dota)
    if (le.fdg == null) px += r * 0.8
    if (le.dota == null) py -= r * 0.8
    return { le, px, py, r }
  })
)

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
/* lesiones con hueso 3D real reconstruido del CT (IA, TotalSegmentator) — frames en
   /metastasis/vertebra. Vértebras y huesos planos. Solo quedan sin reconstruir los 2
   focos «detectados por IA» no confirmados en el informe (#17 costilla, #19). */
const BONE3D_KEY: Record<number, string> = {
  1: 'C3', 2: 'C4', 3: 'ESCAPULA_R',
  4: 'D1', 5: 'D5', 6: 'D9', 7: 'D11', 8: 'D11', 9: 'L1', 10: 'L1', 11: 'L5',
  12: 'SACRO', 13: 'ILIACO_R', 14: 'ILIACO_R', 15: 'ILIACO_L', 16: 'FEMUR_R', 18: 'ILIACO_R',
}
function bone3dKeyOf(le: Lesion) { return BONE3D_KEY[le.id] }
const hasAuto = computed(() => { const a = selAuto.value; return !!a && (a.fdgAuto != null || a.gaAuto != null) })

/* Niveles afectados según el informe de RM de columna (11/06/2026). Texto del
   informe recogido en el documento de apoyo; no es una relectura de la imagen. */
const MRI_LEVELS = ['D1-D3', 'D4-D5', 'D8-D9', 'D11-D12', 'L1', 'L2-L3', 'L5', 'S1-S2']

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
    case 'size': { const m = le.size?.match(/\d+/g); return m ? Number(m[0]) * (m[1] ? Number(m[1]) : 1) : -1 }
    case 'pheno': return ['ne', 'mixNe', 'mixBal', 'mixAgg', 'agg'].indexOf(le.pheno)
    case 'source': return ['informe', 'ambos', 'ia-david'].indexOf(sourceOf(le))
    default: return le.id
  }
}
const sortedLES = computed(() => {
  const k = sortKey.value, d = sortDir.value
  return [...LES].sort((a, b) => {
    const va = sortVal(a, k), vb = sortVal(b, k)
    if (va < vb) return -d
    if (va > vb) return d
    return a.id - b.id
  })
})

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
      <div class="section-wide">
        <PageHeader
          :title="L('Mapa de metástasis', 'Metastasis map')"
          :subtitle="L(
            'Cada lesión ósea, vista con dos trazadores a la vez: el del receptor (Galio-68 DOTATOC) y el del azúcar (FDG). Sirve para ver, lesión a lesión, cuánto capta del receptor y cuánto del azúcar.',
            'Every bone lesion, seen with two tracers at once: the receptor tracer (Gallium-68 DOTATOC) and the sugar tracer (FDG). It helps see, lesion by lesion, how much it takes up the receptor and how much sugar.')"
          :tag="L('PET doble trazador · ' + confirmedFoci.length + ' focos · +' + aiFoci.length + ' por confirmar', 'Dual-tracer PET · ' + confirmedFoci.length + ' foci · +' + aiFoci.length + ' to confirm')"
        />

        <!-- Aviso -->
        <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mb-10">
          {{ L(
            'Esta página reúne y visualiza los estudios de la paciente (PET-FDG 24/03/2026, PET Galio-68 DOTATOC 26/05/2026 y la RMN de columna cervical y dorsal). Es una herramienta para entender y para apoyar la conversación con el equipo médico — no sustituye su criterio ni es consejo médico. Los SUV son los de los informes oficiales del PET; las imágenes (PET y RMN) se reconstruyeron desde los DICOM. La RMN se muestra para verla: su lectura formal corresponde al radiólogo.',
            'This page gathers and visualises the patient’s studies (FDG-PET 24/03/2026, Ga-68 DOTATOC PET 26/05/2026 and the cervical and thoracic spine MRI). It is a tool to understand and to support the conversation with the medical team — it does not replace their judgement and is not medical advice. SUVs are those of the official PET reports; the images (PET and MRI) were reconstructed from the DICOM. The MRI is shown for viewing: its formal reading belongs to the radiologist.') }}
        </div>

        <!-- ===== TOGGLE PEGAJOSO · densidad En claro / Clínico ===== -->
        <div class="sticky top-16 sm:top-[4.5rem] z-30 -mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12 py-2.5 mb-8 bg-cream border-b border-[rgba(45,27,61,0.08)]">
          <div class="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
            <span class="text-[11px] font-semibold text-tinta uppercase tracking-wide">{{ L('Nivel de detalle', 'Detail level') }}</span>
            <div class="inline-flex rounded-full border border-[rgba(45,27,61,0.18)] overflow-hidden" role="group" :aria-label="L('Nivel de detalle', 'Detail level')">
              <button type="button" @click="density = 'plain'" :aria-pressed="!isClinical"
                class="px-4 py-1.5 text-sm font-semibold transition-colors"
                :class="!isClinical ? 'bg-berenjena text-cream' : 'bg-transparent text-tinta hover:bg-[rgba(45,27,61,0.05)]'">
                {{ L('En claro', 'Plain') }}
              </button>
              <button type="button" @click="density = 'clinical'" :aria-pressed="isClinical"
                class="px-4 py-1.5 text-sm font-semibold transition-colors border-l border-[rgba(45,27,61,0.18)]"
                :class="isClinical ? 'bg-berenjena text-cream' : 'bg-transparent text-tinta hover:bg-[rgba(45,27,61,0.05)]'">
                {{ L('Clínico', 'Clinical') }}
              </button>
            </div>
            <span class="text-[11px] text-tinta leading-snug max-w-md">{{ L('No oculta nada: fija si el detalle técnico, la cuantificación y la tabla van plegados (en claro) o abiertos (clínico).', 'Hides nothing: it sets whether technical detail, quantification and the table are folded (plain) or open (clinical).') }}</span>
          </div>
          <!-- A11y: anuncia el cambio de modo a lectores de pantalla (como /ciencia). -->
          <div aria-live="polite" class="sr-only">{{ densityAnnounce }}</div>
        </div>

        <!-- ===== PANEL-COCKPIT · KPIs descriptivos ===== -->
        <section class="mb-12" aria-labelledby="cockpit">
          <p class="eyebrow mb-2 block">{{ L('Resumen de un vistazo', 'At a glance') }}</p>
          <h2 id="cockpit" class="heading-display text-2xl text-berenjena mb-2">{{ L('Panel de la enfermedad ósea', 'Bone-disease panel') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Cifras descriptivas de los dos PET, sin interpretación. Los focos del informe oficial y los detectados por IA (por confirmar) van por separado.',
                  'Descriptive figures from the two PET studies, with no interpretation. Foci from the official report and those detected by AI (to confirm) are kept separate.') }}
          </p>

          <!-- KPIs -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Carga ósea', 'Bone burden') }}</div>
              <div class="stat-readout__value tabular-nums">{{ confirmedFoci.length }} <span class="text-base text-tinta">+{{ aiFoci.length }}</span></div>
              <div class="stat-readout__unit">{{ L('focos en el informe · +' + aiFoci.length + ' por confirmar (detectados por IA)', 'foci in the report · +' + aiFoci.length + ' to confirm (AI-detected)') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('Reparto en el esqueleto', 'Skeletal distribution') }}</div>
              <div class="stat-readout__value tabular-nums">{{ skeletonSplit.axial }} · {{ skeletonSplit.append }}</div>
              <div class="stat-readout__unit">{{ L('axial (columna/sacro) · apendicular (escápula/pelvis/cadera)', 'axial (spine/sacrum) · appendicular (scapula/pelvis/hip)') }}</div>
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
              <div class="flex h-6 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" role="img"
                :aria-label="L(concordance.ne + ' solo receptor, ' + concordance.mix + ' mixtos, ' + concordance.agg + ' solo FDG', concordance.ne + ' receptor-only, ' + concordance.mix + ' mixed, ' + concordance.agg + ' FDG-only')">
                <div v-if="concordance.ne" :style="{ width: concPct(concordance.ne), background: '#9d44ab' }" class="flex items-center justify-center text-[11px] font-semibold text-white">{{ concordance.ne }}</div>
                <div v-if="concordance.mix" :style="{ width: concPct(concordance.mix), background: '#df7a44' }" class="flex items-center justify-center text-[11px] font-semibold text-berenjena">{{ concordance.mix }}</div>
                <div v-if="concordance.agg" :style="{ width: concPct(concordance.agg), background: '#bb4128' }" class="flex items-center justify-center text-[11px] font-semibold text-white">{{ concordance.agg }}</div>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-tinta">
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#9d44ab' }" />{{ L('solo receptor (Ga+/FDG−)', 'receptor-only (Ga+/FDG−)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#df7a44' }" />{{ L('mixtos (ambos)', 'mixed (both)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#bb4128' }" />{{ L('solo FDG (Ga−/FDG+)', 'FDG-only (Ga−/FDG+)') }}</span>
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

          <!-- plegable: resumen para el equipo (abre en modo Clínico) -->
          <details class="notes-disclosure mt-3" :open="isClinical">
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
          <h2 id="dos-caras" class="heading-display text-2xl text-berenjena mb-2">
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
          <h2 id="mapa" class="heading-display text-2xl text-berenjena mb-2">
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
              <button type="button" @click="onlyNew = !onlyNew"
                class="shrink-0 inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors"
                :class="onlyNew ? 'bg-berenjena text-cream border-berenjena' : 'bg-transparent text-tinta border-[rgba(45,27,61,0.25)] hover:border-[rgba(45,27,61,0.45)]'"
                :aria-pressed="onlyNew">
                <span class="w-2 h-2 rounded-full" :class="onlyNew ? '' : 'animate-pulse'" :style="{ background: onlyNew ? '#fff' : '#bb4128' }" />
                {{ onlyNew ? L('Viendo solo focos nuevos', 'Showing new foci only') : L('Solo focos nuevos', 'New foci only') }} ({{ newCount }})
              </button>
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
              <div class="flex justify-between text-[11px] text-tinta px-1 mb-1">
                <span>{{ L('Derecha del cuerpo', 'Body right') }}</span>
                <span>{{ L('Izquierda del cuerpo', 'Body left') }}</span>
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
                <!-- ticks de nivel -->
                <g font-family="JetBrains Mono, monospace" font-size="8.5" fill="#a39e93">
                  <text v-for="tk in ticks" :key="tk.t" x="358" :y="tk.y + 3" text-anchor="start">{{ tk.t }}</text>
                  <line v-for="tk in ticks" :key="'l' + tk.t" x1="346" :y1="tk.y" x2="354" :y2="tk.y" stroke="#d8d2c5" stroke-width="0.8" />
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

              <!-- conmutador de focos dentro de la misma vértebra -->
              <div v-if="selGroup.multi" class="flex flex-wrap items-center gap-1.5 mb-3">
                <span class="text-[11px] text-tinta">{{ L('Focos en esta vértebra', 'Foci in this vertebra') }}:</span>
                <button v-for="f in selGroup.foci" :key="f.id" type="button" @click="pick(f.id)"
                  class="px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors"
                  :style="selected === f.id
                    ? { background: phenoColor(f), color: '#fff', borderColor: phenoColor(f) }
                    : { background: 'transparent', color: phenoText(f), borderColor: phenoColor(f) + '55' }">
                  #{{ f.id }} · {{ focusPart(f) }}
                </button>
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

              <!-- hueso 3D + mapa de calor (científico) -->
              <div class="mb-4">
                <p class="eyebrow mb-2 block">{{ L('Anatomía y captación · paso a paso', 'Anatomy & uptake · step by step') }}</p>
                <ClientOnly>
                  <LesionBone3D :le="sel" :all="LES" :vert-key="bone3dKeyOf(sel)" />
                </ClientOnly>
              </div>

              <!-- CUANTIFICACIÓN AUTOMÁTICA medida sobre los DICOM (verificación) — abre en modo Clínico -->
              <details v-if="hasAuto" class="notes-disclosure mb-4" :open="isClinical">
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

              <!-- imagen real si existe -->
              <figure v-if="sel.img" class="mb-4">
                <img :src="`/metastasis/${sel.img}.jpg`" :alt="L('Imagen PET/TC de la lesión', 'PET/CT image of the lesion')" class="rounded-lg bg-black max-h-72 mx-auto" loading="lazy" />
                <figcaption class="text-[10px] text-tinta text-center mt-1">{{ L('Reconstruido de los DICOM · fusión PET/TC', 'Reconstructed from DICOM · PET/CT fusion') }}</figcaption>
              </figure>

              <!-- capa TÉCNICA -->
              <details class="notes-disclosure" :open="isClinical">
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
          <h2 id="fenotipo" class="heading-display text-2xl text-berenjena mb-2">
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
            <aside class="text-sm">
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2">{{ L('Cómo leerlo', 'How to read it') }}</p>
              <ul class="space-y-2 text-tinta leading-relaxed">
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#9d44ab' }" />{{ L('Arriba-izquierda: capta receptor y poco azúcar.', 'Top-left: receptor-avid, little sugar.') }}</li>
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#bb4128' }" />{{ L('Abajo-derecha: mucho azúcar y poco receptor.', 'Bottom-right: lots of sugar, little receptor.') }}</li>
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#df7a44' }" />{{ L('Arriba-derecha: las dos caras conviven (mixto).', 'Top-right: both faces coexist (mixed).') }}</li>
                <li class="pt-1 text-[12px]">{{ L('El contorno punteado marca los focos detectados por IA, por confirmar (no en el informe).', 'A dashed outline marks AI-detected foci, to confirm (not in the report).') }}</li>
              </ul>
            </aside>
          </div>
        </section>

        <!-- ===== ZONA C · IMAGEN REAL (pestañas) ===== -->
        <section class="mb-14" aria-labelledby="imagen">
          <p class="eyebrow mb-2 block">{{ L('La imagen real', 'The real imaging') }}</p>
          <h2 id="imagen" class="heading-display text-2xl text-berenjena mb-2">
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
            <div class="grid grid-cols-2 gap-4 max-w-2xl">
              <figure class="card-base !p-3 flex flex-col">
                <img src="/metastasis/gal_mip_hot.jpg" :alt="L('MIP Galio-68 DOTATOC', 'Ga-68 DOTATOC MIP')" class="w-full flex-1 min-h-0 object-contain rounded-lg bg-black" loading="lazy" />
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('receptor', 'receptor') }}</figcaption>
              </figure>
              <figure class="card-base !p-3 flex flex-col">
                <img src="/metastasis/fdg_mip_hot.jpg" :alt="L('MIP FDG', 'FDG MIP')" class="w-full flex-1 min-h-0 object-contain rounded-lg bg-black" loading="lazy" />
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</figcaption>
              </figure>
            </div>
          </div>

          <!-- panel · columna sagital en PET -->
          <div v-show="imgTab === 'pet'" role="tabpanel">
            <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
              {{ L('Corte sagital (perfil) con el TC en gris y el PET superpuesto en color. A la izquierda, el receptor (Galio); a la derecha, el azúcar (FDG). Compara qué vértebras encienden con cada trazador.',
                    'Sagittal (side) slice with CT in grey and PET overlaid in colour. Left, the receptor (gallium); right, the sugar (FDG). Compare which vertebrae light up with each tracer.') }}
            </p>
            <div class="grid grid-cols-2 gap-4 max-w-xl">
              <figure class="card-base !p-3 flex flex-col">
                <img src="/metastasis/gal_spine.jpg" :alt="L('Fusión sagital Galio', 'Gallium sagittal fusion')" class="w-full flex-1 min-h-0 object-contain rounded-lg bg-black" loading="lazy" />
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC</figcaption>
              </figure>
              <figure class="card-base !p-3 flex flex-col">
                <img src="/metastasis/fdg_spine.jpg" :alt="L('Fusión sagital FDG', 'FDG sagittal fusion')" class="w-full flex-1 min-h-0 object-contain rounded-lg bg-black" loading="lazy" />
                <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG</figcaption>
              </figure>
            </div>
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
            </div>

            <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
              {{ L('Las imágenes de la RMN se muestran para verlas; los hallazgos de arriba están transcritos del informe de RM (11/06/2026) y no son una relectura de la imagen por esta herramienta. Su lectura formal corresponde al radiólogo. Los SUV del resto de la página vienen de los informes del PET.',
                    'The MRI images are shown for viewing; the findings above are transcribed from the MRI report (11 Jun 2026) and are not a re-reading of the image by this tool. Its formal reading belongs to the radiologist. The SUVs in the rest of the page come from the PET reports.') }}
            </div>
          </div>
        </section>

        <!-- ===== ZONA D · TRAYECTORIA ===== -->
        <section class="mb-14" aria-labelledby="trayectoria">
          <p class="eyebrow mb-2 block">{{ L('Qué ha cambiado', 'What has changed') }}</p>
          <h2 id="trayectoria" class="heading-display text-2xl text-berenjena mb-2">
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
          <div v-if="loadBearingFdgFoci.length" class="alert-callout">
            <div class="alert-callout__title">{{ L('Focos en hueso de carga con FDG igual o mayor que el previo (descriptivo)', 'Weight-bearing foci with FDG equal to or above the prior study (descriptive)') }}</div>
            {{ L(
              'Focos en hueso de carga cuyo FDG iguala o supera el del estudio previo: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.es).join(' · ') + '. Oncología Radioterápica ya los revisó. Descripción de los datos, no consejo médico.',
              'Foci in weight-bearing bone whose FDG matches or exceeds the prior study: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.en).join(' · ') + '. Radiation Oncology has already reviewed them. Description of the data, not medical advice.') }}
          </div>
        </section>

        <!-- ===== ZONA E · APÉNDICE DE REFERENCIA (tabla) — abre en modo Clínico ===== -->
        <section class="mb-14" aria-labelledby="tabla">
          <p class="eyebrow mb-2 block">{{ L('Para el equipo · referencia', 'For the team · reference') }}</p>
          <h2 id="tabla" class="heading-display text-2xl text-berenjena mb-2">{{ L('Apéndice: los focos en una tabla', 'Appendix: the foci in a table') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">{{ L('Tabla completa con SUVmáx por trazador, tendencia, tamaño, patrón y procedencia, más los focos extra detectados de forma automática. Detalle clínico: se abre en el modo «Clínico».', 'Full table with SUVmax per tracer, trend, size, pattern and provenance, plus the automatically detected extra foci. Clinical detail: it opens in “Clinical” mode.') }}</p>
          <details class="notes-disclosure" :open="isClinical">
            <summary>{{ L('Abrir la tabla, la procedencia y los focos extra', 'Open the table, provenance and extra foci') }}</summary>
          <p class="text-[12px] text-tinta mt-3 mb-4 leading-relaxed max-w-3xl">
            {{ L('Pulsa una cabecera para ordenar. Fuente: «Informe» = informe oficial · «Ambos» = en el informe y en el análisis por IA · «Detectado por IA · por confirmar» = solo en el análisis por IA (medidas aproximadas sobre DICOM, a revisar).',
                  'Click a header to sort. Source: “Report” = official report · “Both” = in the report and in the AI analysis · “AI-detected · to confirm” = only in the AI analysis (approximate DICOM measurements, to review).') }}
          </p>
          <div class="data-card overflow-x-auto">
            <table class="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col" :aria-sort="ariaSort('id')"><button type="button" class="th-sort" @click="sortBy('id')"># <span class="th-arrow">{{ sortArrow('id') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('level')"><button type="button" class="th-sort" @click="sortBy('level')">{{ L('Localización', 'Location') }} <span class="th-arrow">{{ sortArrow('level') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('side')"><button type="button" class="th-sort" @click="sortBy('side')">{{ L('Lado', 'Side') }} <span class="th-arrow">{{ sortArrow('side') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('dota')"><button type="button" class="th-sort" @click="sortBy('dota')">Ga SUVmáx <span class="th-arrow">{{ sortArrow('dota') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('fdg')"><button type="button" class="th-sort" @click="sortBy('fdg')">FDG SUVmáx <span class="th-arrow">{{ sortArrow('fdg') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('prev')"><button type="button" class="th-sort" @click="sortBy('prev')">{{ L('FDG previo', 'Prior FDG') }} <span class="th-arrow">{{ sortArrow('prev') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('delta')"><button type="button" class="th-sort" @click="sortBy('delta')">Δ FDG <span class="th-arrow">{{ sortArrow('delta') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('size')"><button type="button" class="th-sort" @click="sortBy('size')">{{ L('Tamaño', 'Size') }} <span class="th-arrow">{{ sortArrow('size') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('pheno')"><button type="button" class="th-sort" @click="sortBy('pheno')">{{ L('Patrón', 'Pattern') }} <span class="th-arrow">{{ sortArrow('pheno') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('source')"><button type="button" class="th-sort" @click="sortBy('source')">{{ L('Fuente', 'Source') }} <span class="th-arrow">{{ sortArrow('source') }}</span></button></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="le in sortedLES" :key="le.id" class="cursor-pointer" :class="selected === le.id ? 'bg-[rgba(157,68,171,0.08)]' : ''" @click="pick(le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })">
                  <td><span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-semibold" :style="{ background: phenoColor(le) }">{{ le.id }}</span></td>
                  <td class="font-semibold text-berenjena">{{ le.level[lang] }}</td>
                  <td class="text-xs">{{ le.side === 'R' ? L('Dcha', 'R') : le.side === 'L' ? L('Izda', 'L') : L('Centro', 'Mid') }}</td>
                  <td class="font-mono">{{ le.dota != null ? le.dota.toFixed(1) : '—' }}</td>
                  <td class="font-mono">{{ le.fdg != null ? le.fdg.toFixed(1) : '—' }}</td>
                  <td class="font-mono text-tinta">{{ le.prevFdg != null ? le.prevFdg.toFixed(1) : '—' }}</td>
                  <td class="font-mono" :style="deltaStyle(le)">{{ deltaFdg(le) }}</td>
                  <td class="font-mono text-tinta">{{ le.size ?? '—' }}</td>
                  <td class="text-sm">
                    <span class="flex items-center gap-2">
                      <span class="inline-flex h-2.5 w-12 shrink-0 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" aria-hidden="true">
                        <span :style="{ width: (neShare(le) * 100).toFixed(0) + '%', background: '#9d44ab' }" />
                        <span :style="{ width: ((1 - neShare(le)) * 100).toFixed(0) + '%', background: '#bb4128' }" />
                      </span>
                      <span>{{ phenoLabel(le) }}</span>
                    </span>
                  </td>
                  <td><span class="pill-data whitespace-nowrap" :style="{ background: sourceMeta(le).c + '22', color: sourceMeta(le).tc }">{{ L(sourceMeta(le).es, sourceMeta(le).en) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- nota: cosas por aclarar -->
          <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
            <strong>{{ L('Por aclarar / pendiente de confirmar', 'To clarify / pending confirmation') }}</strong>
            <ul class="list-disc pl-5 mt-1.5 space-y-1">
              <li>{{ L('Faltan los tamaños de 6 focos: #1 C3, #2 C4, #3 escápula, #6 T9, #10 pedículo L1 y #15 ilíaco izquierdo.', 'Sizes missing for 6 foci: #1 C3, #2 C4, #3 scapula, #6 T9, #10 L1 pedicle and #15 left iliac.') }}</li>
              <li>{{ L('Confirmar el #12: aquí figura como sacro derecho, pero la tabla del análisis por IA lo describe como vértebra lumbar.', 'Confirm #12: shown here as right sacrum, but the AI-analysis table describes it as a lumbar vertebra.') }}</li>
              <li>{{ L('Los 3 focos marcados «Detectado por IA» (#17–#19) son medidas aproximadas sobre los DICOM, no confirmadas en el informe oficial — a revisar con Medicina Nuclear.', 'The 3 “AI-detected” foci (#17–#19) are approximate DICOM measurements, not confirmed in the official report — to review with Nuclear Medicine.') }}</li>
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
    </section>
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
@media (prefers-reduced-motion: reduce) {
  .pulse-ring { animation: none; opacity: 0.5; }
}
.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.th-sort:hover { color: #2d1b3d; }
.th-arrow { font-size: 9px; opacity: 0.55; }
.reads-vh { background: rgba(157, 68, 171, 0.07); }
</style>
