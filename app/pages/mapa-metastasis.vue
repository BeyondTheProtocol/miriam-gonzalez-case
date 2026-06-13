<script setup lang="ts">
/**
 * Mapa interactivo de metástasis — doble trazador (⁶⁸Ga-DOTATOC vs ¹⁸F-FDG)
 *
 * Reúne y visualiza fuentes propias de la paciente, sin interpretación añadida
 * más allá de lo que dicen los informes:
 *  - PET-CT ¹⁸F-FDG (Virgen de la Arrixaca, 24/03/2026)
 *  - PET-CT ⁶⁸Ga-DOTATOC (Virgen de la Arrixaca, 26/05/2026)
 *  - Revisión anatomopatológica, Vall d'Hebron / VHIO (mayo 2026)
 * Las imágenes se reconstruyen a partir de los DICOM de esos mismos estudios.
 * Herramienta de comprensión y apoyo a la conversación clínica — no es consejo médico.
 */
const { locale } = useI18n()
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
/*  Paleta de fenotipo (espectro neuroendocrino → mixto → agresivo)    */
/* ------------------------------------------------------------------ */
type Pheno = 'ne' | 'mixNe' | 'mixBal' | 'mixAgg' | 'agg'
const PHENO: Record<Pheno, { c: string; es: string; en: string }> = {
  ne:     { c: '#9d44ab', es: 'Neuroendocrino (receptor +)', en: 'Neuroendocrine (receptor +)' },
  mixNe:  { c: '#8a5bb3', es: 'Mixto · predominio neuroendocrino', en: 'Mixed · neuroendocrine-predominant' },
  mixBal: { c: '#c9921e', es: 'Mixto · equilibrado', en: 'Mixed · balanced' },
  mixAgg: { c: '#df7a44', es: 'Mixto · predominio agresivo', en: 'Mixed · aggressive-predominant' },
  agg:    { c: '#bb4128', es: 'Agresivo (glucolítico, sin receptor)', en: 'Aggressive (glycolytic, no receptor)' },
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
    tech: { es: 'DOTATOC SUVmáx 2.89, sin captación FDG. Patrón receptor-puro: componente neuroendocrino bien diferenciado, baja actividad glucolítica.', en: 'DOTATOC SUVmax 2.89, no FDG uptake. Receptor-only pattern: well-differentiated neuroendocrine component, low glycolytic activity.' },
  },
  {
    id: 2, x: 206, y: 104, side: 'R', dota: 3.10, fdg: null, pheno: 'ne',
    level: { es: 'C4 · lámina / arco derecho', en: 'C4 · right lamina / arch' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Parte posterior de la vértebra C4 (el arco óseo que protege la médula), lado derecho. Captación solo del receptor.', en: 'Posterior part of the C4 vertebra (the bony arch that protects the cord), right side. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.10, sin FDG. Receptor-puro.', en: 'DOTATOC SUVmax 3.10, no FDG. Receptor-only.' },
  },
  {
    id: 3, x: 120, y: 205, side: 'R', dota: 3.84, fdg: null, pheno: 'ne',
    level: { es: 'Escápula derecha', en: 'Right scapula' },
    region: { es: 'Cintura escapular', en: 'Shoulder girdle' },
    what: { es: 'Omóplato derecho (el hueso plano de la espalda alta, bajo el hombro). No es columna. Capta solo el receptor.', en: 'Right shoulder blade (the flat bone of the upper back, below the shoulder). Not spine. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.84, sin FDG. Receptor-puro, fuera del eje axial.', en: 'DOTATOC SUVmax 3.84, no FDG. Receptor-only, off the axial skeleton.' },
  },
  {
    id: 4, x: 220, y: 156, side: 'C', dota: 4.23, fdg: 6.97, prevFdg: 2.8, pheno: 'mixAgg', size: '14 × 10',
    level: { es: 'D1 (T1) · cuerpo vertebral', en: 'T1 · vertebral body' },
    region: { es: 'Columna dorsal alta', en: 'Upper thoracic spine' },
    what: { es: 'Primera vértebra dorsal, justo bajo el cuello. Foco nuevo: en el PET previo casi no se veía y ahora capta azúcar con fuerza. Conviene vigilarlo.', en: 'First thoracic vertebra, just below the neck. New focus: barely visible on the prior PET and now strongly sugar-avid. Worth watching.' },
    tech: { es: 'DOTATOC 4.23 / FDG 6.97 (previo 2.8, no significativo). Foco nuevo glucolítico → componente proliferativo emergente. Predominio agresivo.', en: 'DOTATOC 4.23 / FDG 6.97 (prior 2.8, non-significant). New glycolytic focus → emerging proliferative component. Aggressive-predominant.' },
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne', size: '14 × 10',
    img: 'les05',
    level: { es: 'D5 (T5) · cuerpo vertebral', en: 'T5 · vertebral body' },
    region: { es: 'Columna dorsal media', en: 'Mid-thoracic spine' },
    what: { es: 'Cuerpo de una vértebra de la mitad de la espalda. Captación moderada-alta del receptor, sin azúcar: componente neuroendocrino.', en: 'Body of a mid-back vertebra. Moderate-high receptor uptake, no sugar: neuroendocrine component.' },
    tech: { es: 'DOTATOC SUVmáx 6.17, sin FDG. Receptor-puro de intensidad moderada.', en: 'DOTATOC SUVmax 6.17, no FDG. Moderate-intensity receptor-only.' },
  },
  {
    id: 6, x: 212, y: 313, side: 'R', dota: 1.37, fdg: null, pheno: 'ne',
    level: { es: 'D9 (T9) · cuerpo derecho', en: 'T9 · right body' },
    region: { es: 'Columna dorsal baja', en: 'Lower thoracic spine' },
    what: { es: 'Vértebra dorsal baja, lado derecho. Captación leve solo del receptor; actividad baja.', en: 'Lower thoracic vertebra, right side. Mild receptor-only uptake; low activity.' },
    tech: { es: 'DOTATOC SUVmáx 1.37, sin FDG. Receptor-puro de baja intensidad.', en: 'DOTATOC SUVmax 1.37, no FDG. Low-intensity receptor-only.' },
  },
  {
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, pheno: 'mixNe', size: '18 × 14',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    img: 'gal_spine',
    what: { es: 'Una de las lesiones más intensas. Capta muchísimo el receptor (la más “neuroendocrina” de todas) y también azúcar, aunque el azúcar ha bajado respecto al PET previo. Hueso denso (blástico).', en: 'One of the most intense lesions. Very high receptor uptake (the most “neuroendocrine” of all) plus some sugar, though sugar dropped versus the prior PET. Dense (blastic) bone.' },
    tech: { es: 'DOTATOC SUVmáx 13.27 (captación SSTR muy intensa, ≈ Krenning 3, estimado) / FDG 7.61 (previo 10.19, en descenso). Mixto con fuerte predominio del receptor. Lesión blástica.', en: 'DOTATOC SUVmax 13.27 (very intense SSTR uptake, ≈ Krenning 3, estimated) / FDG 7.61 (prior 10.19, decreasing). Mixed with strong receptor predominance. Blastic lesion.' },
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
    what: { es: 'La ÚNICA lesión que capta azúcar pero NO el receptor, y va en aumento. Es la cara más glucolítica: el Galio (receptor) no la ve.', en: 'The ONLY lesion that takes up sugar but NOT the receptor, and it is increasing. The most glycolytic face: gallium (the receptor) does not see it.' },
    tech: { es: 'FDG SUVmáx 6.84 (previo 4.67, en aumento), SIN captación de Galio. Patrón desdiferenciado/glucolítico puro. Discordante con la #9 (misma vértebra).', en: 'FDG SUVmax 6.84 (prior 4.67, rising), NO gallium uptake. Pure dedifferentiated/glycolytic pattern. Discordant with #9 (same vertebra).' },
  },
  {
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe', size: '18 × 13',
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'Última vértebra lumbar, zona de mucha carga. Capta intensamente el receptor y algo de azúcar (estable). Predominio neuroendocrino.', en: 'Last lumbar vertebra, a high-load zone. Intense receptor uptake plus some sugar (stable). Neuroendocrine-predominant.' },
    tech: { es: 'DOTATOC SUVmáx 12.14 (SSTR intensa) / FDG 5.0 (previo 4.81, estable). Mixto, predominio receptor.', en: 'DOTATOC SUVmax 12.14 (intense SSTR) / FDG 5.0 (prior 4.81, stable). Mixed, receptor-predominant.' },
  },
  {
    id: 12, x: 205, y: 505, side: 'R', dota: 4.27, fdg: 4.34, prevFdg: 6.26, pheno: 'mixBal', size: '12 × 9',
    level: { es: 'Ala sacra derecha', en: 'Right sacral ala' },
    region: { es: 'Sacro', en: 'Sacrum' },
    what: { es: 'Parte alta y lateral del sacro (el hueso triangular bajo la columna), lado derecho. Capta los dos trazadores por igual; el azúcar ha bajado respecto al previo.', en: 'Upper-lateral part of the sacrum (the triangular bone below the spine), right side. Takes up both tracers about equally; sugar dropped versus the prior.' },
    tech: { es: 'DOTATOC 4.27 / FDG 4.34 (previo 6.26, en descenso). Mixto equilibrado, con respuesta glucolítica favorable.', en: 'DOTATOC 4.27 / FDG 4.34 (prior 6.26, decreasing). Balanced mixed, with favourable glycolytic response.' },
  },
  {
    id: 13, x: 165, y: 545, side: 'R', dota: 4.32, fdg: 7.71, prevFdg: 7.0, pheno: 'mixAgg', size: '11 × 8',
    level: { es: 'Ilíaco derecho', en: 'Right iliac bone' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    img: 'crop_iliac',
    what: { es: 'Hueso de la pelvis (ala ilíaca) derecho. Capta los dos trazadores, con más azúcar que receptor. Es la lesión que se intentó biopsiar.', en: 'Right pelvic bone (iliac wing). Takes up both tracers, more sugar than receptor. This is the lesion that was biopsied.' },
    tech: { es: 'DOTATOC 4.32 / FDG 7.71 (previo 7.0, ligero aumento). Mixto, predominio agresivo. La biopsia ósea (26B585) solo halló hueso/músculo sin tumor evaluable.', en: 'DOTATOC 4.32 / FDG 7.71 (prior 7.0, slight rise). Mixed, aggressive-predominant. The bone biopsy (26B585) found only bone/muscle with no evaluable tumour.' },
  },
  {
    id: 14, x: 172, y: 585, side: 'R', dota: 3.96, fdg: 9.33, prevFdg: 4.0, load: true, pheno: 'mixAgg', size: '14 × 11',
    level: { es: 'Ilíaco derecho supraacetabular', en: 'Right supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    img: 'crop_iliac',
    what: { es: 'Justo encima de la cadera derecha (el “techo” donde encaja el fémur). El azúcar (FDG) se ha más que duplicado respecto al estudio previo. Es hueso de carga; Oncología Radioterápica ya lo revisó.', en: 'Just above the right hip (the “roof” where the femur sits). Sugar has more than doubled versus the prior study. It is weight-bearing bone; Radiation Oncology has already reviewed it.' },
    tech: { es: 'DOTATOC 3.96 / FDG 9.33 (previo 4.0, en claro aumento). Mixto, predominio agresivo, hueso de carga. Revisado por Oncología Radioterápica.', en: 'DOTATOC 3.96 / FDG 9.33 (prior 4.0, clearly rising). Mixed, aggressive-predominant, weight-bearing bone. Reviewed by Radiation Oncology.' },
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
    tech: { es: 'DOTATOC 5.09 / FDG 9.43 (previo 6.0, en aumento). Mixto, predominio agresivo, hueso de carga. Confirmada en corte axial PET/TC (foco intraóseo en cuello femoral).', en: 'DOTATOC 5.09 / FDG 9.43 (prior 6.0, rising). Mixed, aggressive-predominant, weight-bearing bone. Confirmed on axial PET/CT (intra-osseous focus in the femoral neck).' },
  },
  {
    id: 17, x: 182, y: 198, side: 'C', dota: 1.6, fdg: 4.8, pheno: 'mixAgg', size: '≤ 8', source: 'ia-david',
    level: { es: 'Tórax alto / costilla', en: 'Upper thorax / rib' },
    region: { es: 'Parrilla costal', en: 'Rib cage' },
    what: { es: 'Foco en tórax alto / costilla que capta sobre todo azúcar (FDG), de baja intensidad. Lo señaló la IA de David sobre los DICOM y el propio análisis lo marca como dudoso — a revisar en visor; no está en el informe oficial.', en: 'Upper thorax / rib focus, mainly sugar-avid (FDG), low intensity. Flagged by David’s AI on the DICOM and the analysis itself marks it as uncertain — to review in a viewer; not in the official report.' },
    tech: { es: 'DOTATOC ~1.6 / FDG ~4.8 (aproximados, medidos sobre los DICOM). Patrón FDG+ con receptor bajo. No confirmado como metástasis en informe oficial; revisar con Medicina Nuclear.', en: 'DOTATOC ~1.6 / FDG ~4.8 (approximate, measured on the DICOM). FDG+ pattern with low receptor. Not confirmed as metastasis in the official report; review with Nuclear Medicine.' },
  },
  {
    id: 18, x: 178, y: 560, side: 'R', dota: 4.3, fdg: 1.7, pheno: 'mixNe', size: '8 × 6', source: 'ia-david',
    level: { es: 'Pélvico / ilíaco-femoral', en: 'Pelvic / iliac-femoral' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Foco pélvico leve (zona ilíaco-femoral) que capta sobre todo el receptor (Galio); el azúcar es bajo. Patrón favorable a la diana del receptor. Aportado por la IA de David; no está en el informe oficial.', en: 'Mild pelvic focus (iliac-femoral area) taking up mainly the receptor (gallium); sugar is low. Pattern favourable to the receptor target. Provided by David’s AI; not in the official report.' },
    tech: { es: 'DOTATOC ~4.3 / FDG ~1.7 (aproximados, sobre los DICOM). Patrón SSTR-favorable. No en informe oficial.', en: 'DOTATOC ~4.3 / FDG ~1.7 (approximate, on the DICOM). SSTR-favourable pattern. Not in the official report.' },
  },
  {
    id: 19, x: 232, y: 150, side: 'C', dota: 4.8, fdg: 3.1, pheno: 'mixBal', size: '8–10', source: 'ia-david',
    level: { es: 'Cervicotorácica / dorsal baja', en: 'Cervicothoracic / lower dorsal' },
    region: { es: 'Transición cervicotorácica', en: 'Cervicothoracic junction' },
    what: { es: 'Foco óseo leve en la zona cervicotorácica, con captación débil de los dos trazadores. Baja intensidad, a correlacionar. Aportado por la IA de David; no está en el informe oficial.', en: 'Mild bone focus in the cervicothoracic area, with weak uptake of both tracers. Low intensity, to be correlated. Provided by David’s AI; not in the official report.' },
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

/* procedencia del dato de cada foco (la IA de David = tabla de DICOM aportada) */
const SOURCE: Record<'informe' | 'ambos' | 'ia-david', { es: string; en: string; c: string }> = {
  informe: { es: 'Informe', en: 'Report', c: '#1f5a3a' },
  ambos: { es: 'Ambos', en: 'Both', c: '#9d44ab' },
  'ia-david': { es: 'IA David', en: 'David AI', c: '#bf7d2c' },
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
function groupVisible(g: LesGroup): boolean { return g.foci.some(visible) }
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
  { key: 'ne', label: L('Neuroendocrino', 'Neuroendocrine'), c: PHENO.ne.c },
  { key: 'mixNe', label: L('Mixto · receptor', 'Mixed · receptor'), c: PHENO.mixNe.c },
  { key: 'mixAgg', label: L('Mixto · agresivo', 'Mixed · aggressive'), c: PHENO.mixAgg.c },
  { key: 'agg', label: L('Agresivo', 'Aggressive'), c: PHENO.agg.c },
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
/* focos en hueso de carga con FDG que no baja (señal para el equipo) */
const riskFoci = computed(() => LES.filter((l) => l.load && l.fdg != null && (l.prevFdg == null || l.fdg >= l.prevFdg)))

/* ------------------------------------------------------------------ */
/*  Triaje por lesión — QUÉ ORIENTA el patrón (para el comité).        */
/*  Solo refleja los datos del propio foco; no es consejo médico.      */
/* ------------------------------------------------------------------ */
function triage(l: Lesion): { tone: string; es: string; en: string }[] {
  const out: { tone: string; es: string; en: string }[] = []
  const t = trend(l)
  if (l.dota != null && l.dota >= 6)
    out.push({ tone: 'violet', es: 'Diana de receptor marcada (SSTR alta): el tipo de lesión que en comité se valora para terapias dirigidas al receptor (p. ej. PRRT/Lutecio). No es una indicación.', en: 'Strong receptor target (high SSTR): the kind of lesion tumour boards weigh for receptor-directed therapy (e.g. PRRT/Lutetium). Not an indication.' })
  else if (l.dota != null && l.dota >= 2)
    out.push({ tone: 'violet', es: 'Capta receptor (SSTR presente), de intensidad baja-moderada.', en: 'Receptor uptake present (SSTR), low-to-moderate intensity.' })
  if (l.fdg != null && l.fdg >= 6)
    out.push({ tone: 'warn', es: 'Componente glucolítico alto (FDG): actividad proliferativa marcada.', en: 'High glycolytic component (FDG): marked proliferative activity.' })
  if (t && (t.dir === 'up' || t.dir === 'new'))
    out.push({ tone: 'warn', es: t.dir === 'new' ? 'Foco nuevo respecto al estudio previo — a vigilar de cerca.' : 'FDG en aumento respecto al previo — a vigilar de cerca.', en: t.dir === 'new' ? 'New focus vs the prior study — to watch closely.' : 'FDG rising vs the prior — to watch closely.' })
  if (t && t.dir === 'down')
    out.push({ tone: 'positive', es: 'FDG en descenso respecto al previo — respuesta glucolítica favorable.', en: 'FDG decreasing vs the prior — favourable glycolytic response.' })
  if (l.dota == null && l.fdg != null)
    out.push({ tone: 'warn', es: 'Discordante: capta azúcar pero NO receptor (cara desdiferenciada; el Galio no la ve).', en: 'Discordant: sugar-avid but NO receptor (dedifferentiated face; gallium misses it).' })
  if (l.load)
    out.push({ tone: 'warn', es: 'Hueso de carga: el equipo valora el riesgo estructural / radioterapia. (Ya revisado por Oncología Radioterápica.)', en: 'Weight-bearing bone: structural risk / radiotherapy is weighed by the team. (Already reviewed by Radiation Oncology.)' })
  if (l.scler)
    out.push({ tone: 'neutral', es: 'Morfología blástica (hueso denso).', en: 'Blastic morphology (dense bone).' })
  if (sourceOf(l) === 'ia-david')
    out.push({ tone: 'neutral', es: 'No confirmada en el informe oficial (medida aproximada sobre DICOM) — revisar con Medicina Nuclear.', en: 'Not confirmed in the official report (approximate DICOM measurement) — review with Nuclear Medicine.' })
  return out
}
function triageTone(tone: string): string {
  return tone === 'violet' ? '#9d44ab' : tone === 'warn' ? '#bb4128' : tone === 'positive' ? '#1f5a3a' : '#6b6470'
}

/* ------------------------------------------------------------------ */
/*  Lectura RM (11/06/2026) + valoración SBRT por lesión.              */
/*  Transcrito del «Documento de apoyo · valoración SBRT» (12/06/2026),*/
/*  que cita el informe de RM de columna (11/06/2026, Dra. Martínez    */
/*  Fernández) y los informes PET. Es orientación para el comité, NO   */
/*  diagnóstico ni indicación. No modifica ningún SUV.                 */
/* ------------------------------------------------------------------ */
const SBRT_GROUP: Record<'A' | 'B' | 'C', { es: string; en: string; c: string }> = {
  A: { es: 'Candidata razonable a SBRT', en: 'Reasonable SBRT candidate', c: '#bb4128' },
  B: { es: 'Dominante, requiere comité', en: 'Dominant, needs tumour board', c: '#c9921e' },
  C: { es: 'No diana típica de SBRT', en: 'Not a typical SBRT target', c: '#6b6470' },
}
const SBRT: Record<number, { group: 'A' | 'B' | 'C'; es: string; en: string }> = {
  4: { group: 'A', es: 'Foco nuevo activo (D1). Candidato razonable a SBRT.', en: 'New active focus (D1). Reasonable SBRT candidate.' },
  7: { group: 'B', es: 'La más ávida, pero la RM describe extensión epidural anterior y compromiso del canal lateral izquierdo en D11 → no es SBRT simple: comité (¿cirugía de separación?, ¿RT paliativa?). La RM se pidió justo para facilitar RT paliativa.', en: 'Most avid, but the MRI describes anterior epidural extension and left lateral canal compromise at D11 → not simple SBRT: tumour board (separation surgery?, palliative RT?). The MRI was requested precisely to facilitate palliative RT.' },
  8: { group: 'B', es: 'En la misma vértebra D11 (pedículo izq.); ver la nota de D11 (extensión epidural).', en: 'In the same D11 vertebra (left pedicle); see the D11 note (epidural extension).' },
  11: { group: 'B', es: 'DOTATOC muy alto, pero en RM muy hipointensa (blástica) → suele ser más indolente; valorar.', en: 'Very high DOTATOC, but very hypointense on MRI (blastic) → usually more indolent; weigh up.' },
  10: { group: 'A', es: 'FDG+ / DOTATOC− (clon más agresivo, posible escape del fenotipo SSTR). Ojo: fractura crónica de L1 adyacente.', en: 'FDG+ / DOTATOC− (more aggressive clone, possible SSTR-phenotype escape). Note: adjacent chronic L1 fracture.' },
  13: { group: 'A', es: 'FDG en aumento, accesible. La biopsia (08/05) salió sin neoplasia → dudosa representatividad.', en: 'Rising FDG, accessible. The biopsy (8 May) found no tumour → uncertain representativeness.' },
  14: { group: 'A', es: 'Progresión marcada (FDG ↑↑). Candidato claro a SBRT.', en: 'Marked progression (FDG ↑↑). Clear SBRT candidate.' },
  16: { group: 'A', es: 'Progresa (FDG ↑↑) y es hueso de carga → valorar riesgo de fractura / fijación profiláctica.', en: 'Progressing (FDG ↑↑) and weight-bearing → weigh fracture risk / prophylactic fixation.' },
  15: { group: 'C', es: 'Discordancia temporal entre estudios; foco de baja intensidad.', en: 'Temporal discordance between studies; low-intensity focus.' },
  12: { group: 'C', es: 'FDG en descenso; no es diana típica de SBRT.', en: 'Decreasing FDG; not a typical SBRT target.' },
  1: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
  2: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
  3: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
  5: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
  6: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
  9: { group: 'C', es: 'SSTR+ sin glucólisis → manejo sistémico ± PRRT, no SBRT.', en: 'SSTR+ without glycolysis → systemic ± PRRT, not SBRT.' },
}
function sbrtOf(le: Lesion) { return SBRT[le.id] || null }
const selSbrt = computed(() => sbrtOf(sel.value))
const selSbrtMeta = computed(() => { const s = sbrtOf(sel.value); return s ? SBRT_GROUP[s.group] : null })

/* ------------------------------------------------------------------ */
/*  Cuantificación automática (verificación, NO diagnóstico).          */
/*  Medida por Claude sobre tus DICOM: SUV con corrección de decaim.,  */
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
   /metastasis/vertebra. Vértebras y huesos planos. Pendientes de otra pasada de
   segmentación: #1 C3, #2 C4, #3 escápula, #15 ilíaco izq, #17 costilla, #19. */
const BONE3D_KEY: Record<number, string> = {
  4: 'D1', 5: 'D5', 6: 'D9', 7: 'D11', 8: 'D11', 9: 'L1', 10: 'L1', 11: 'L5',
  12: 'SACRO', 13: 'ILIACO_R', 14: 'ILIACO_R', 16: 'FEMUR_R', 18: 'ILIACO_R',
}
function bone3dKeyOf(le: Lesion) { return BONE3D_KEY[le.id] }
const hasAuto = computed(() => { const a = selAuto.value; return !!a && (a.fdgAuto != null || a.gaAuto != null) })

/* Niveles afectados según el informe de RM de columna (11/06/2026). Texto del
   informe recogido en el documento de apoyo; no es una relectura de la imagen. */
const MRI_LEVELS = ['D1-D3', 'D4-D5', 'D8-D9', 'D11-D12', 'L1', 'L2-L3', 'L5', 'S1-S2']
const sbrtGroupsForList = computed(() => ({
  A: LES.filter((l) => SBRT[l.id]?.group === 'A'),
  B: LES.filter((l) => SBRT[l.id]?.group === 'B'),
}))

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
            'Cada lesión ósea, vista con dos trazadores a la vez: el del receptor (Galio-68 DOTATOC) y el del azúcar (FDG). Sirve para entender, lesión a lesión, cuánto pesa el componente neuroendocrino y cuánto el agresivo.',
            'Every bone lesion, seen with two tracers at once: the receptor tracer (Gallium-68 DOTATOC) and the sugar tracer (FDG). It helps understand, lesion by lesion, how much is neuroendocrine and how much is aggressive.')"
          :tag="L('PET doble trazador · ' + LES.length + ' focos', 'Dual-tracer PET · ' + LES.length + ' foci')"
        />

        <!-- Aviso -->
        <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mb-10">
          {{ L(
            'Esta página reúne y visualiza tus propios estudios (PET-FDG 24/03/2026, PET Galio-68 DOTATOC 26/05/2026, la revisión anatomopatológica de Vall d\'Hebron de mayo 2026 y tu RMN de columna cervical y dorsal). Es una herramienta para entender y para apoyar la conversación con tu equipo médico — no sustituye su criterio ni es consejo médico. Los SUV son los de los informes oficiales del PET; las imágenes (PET y RMN) se reconstruyeron desde tus DICOM. La RMN se muestra para verla: su lectura formal corresponde a tu radiólogo.',
            'This page gathers and visualises your own studies (FDG-PET 24/03/2026, Ga-68 DOTATOC PET 26/05/2026, the Vall d\'Hebron pathology review of May 2026 and your cervical and thoracic spine MRI). It is a tool to understand and to support the conversation with your medical team — it does not replace their judgement and is not medical advice. SUVs are those of the official PET reports; the images (PET and MRI) were reconstructed from your DICOM. The MRI is shown for viewing: its formal reading belongs to your radiologist.') }}
        </div>

        <!-- ===== LAS DOS CARAS (fenotipo del tejido, VHIO) ===== -->
        <section class="mb-14" aria-labelledby="dos-caras">
          <p class="eyebrow mb-2 block">{{ L('El porqué biológico', 'The biological why') }}</p>
          <h2 id="dos-caras" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('Un solo tumor, dos caras', 'One tumour, two faces') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-3xl">
            {{ L(
              'La revisión de los mejores patólogos de Vall d\'Hebron (VHIO) sobre la biopsia de 2024 confirma un carcinoma de mama con diferenciación neuroendocrina. Es decir: una misma enfermedad con dos componentes mezclados. Por eso tiene sentido mirarla con dos trazadores — cada uno “ve” una de las caras.',
              'The review by Vall d\'Hebron\'s (VHIO) top pathologists of the 2024 biopsy confirms a breast carcinoma with neuroendocrine differentiation. That is: a single disease with two intermingled components. That is why it makes sense to image it with two tracers — each one “sees” one of the faces.') }}
          </p>
          <div class="grid md:grid-cols-2 gap-4 mb-5">
            <div class="card-base">
              <p class="font-semibold text-berenjena mb-1" :style="{ color: '#bb4128' }">
                {{ L('Cara mama / luminal (agresiva)', 'Breast / luminal face (aggressive)') }}
              </p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'Carcinoma infiltrante, subtipo Luminal B HER2-negativo. Receptor de estrógeno muy positivo (85%, intensidad alta), progesterona débil (20%), HER2 negativo (0) y un Ki-67 del 40% (proliferación alta). Es el componente proliferativo que capta azúcar (FDG).',
                  'Infiltrating carcinoma, Luminal B HER2-negative subtype. Strongly ER-positive (85%, high intensity), weak PR (20%), HER2-negative (0) and Ki-67 of 40% (high proliferation). This is the proliferative component that takes up sugar (FDG).') }}
              </p>
            </div>
            <div class="card-base">
              <p class="font-semibold mb-1" :style="{ color: '#9d44ab' }">
                {{ L('Cara neuroendocrina (receptor)', 'Neuroendocrine face (receptor)') }}
              </p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'Diferenciación neuroendocrina confirmada: sinaptofisina heterogénea, cromogranina focal e INSM1 en mosaico. Este componente expresa receptores de somatostatina (SSTR), que es lo que capta el Galio-68 DOTATOC. Heterogénea: no está repartida por igual.',
                  'Confirmed neuroendocrine differentiation: heterogeneous synaptophysin, focal chromogranin and mosaic INSM1. This component expresses somatostatin receptors (SSTR), which is what Gallium-68 DOTATOC binds. Heterogeneous: not evenly distributed.') }}
              </p>
            </div>
          </div>
        </section>

        <!-- ===== LOS DOS TRAZADORES ===== -->
        <section class="mb-14" aria-labelledby="trazadores">
          <h2 id="trazadores" class="heading-display text-2xl text-berenjena mb-4">
            {{ L('Los dos trazadores', 'The two tracers') }}
          </h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card-base border-l-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold mb-1" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC — {{ L('el receptor', 'the receptor') }}</p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'Se pega a los receptores de somatostatina (SSTR). Marca la cara neuroendocrina, bien diferenciada y normalmente más indolente. Donde brilla mucho, predomina el componente neuroendocrino.',
                  'Binds somatostatin receptors (SSTR). It marks the neuroendocrine, well-differentiated and usually more indolent face. Where it shines, the neuroendocrine component predominates.') }}
              </p>
            </div>
            <div class="card-base border-l-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold mb-1" :style="{ color: '#bb4128' }">¹⁸F-FDG — {{ L('el azúcar', 'the sugar') }}</p>
              <p class="text-sm text-tinta leading-relaxed">
                {{ L(
                  'Es glucosa marcada: se acumula donde las células consumen mucha energía, o sea donde el tumor es más activo y agresivo. El estudio FDG de marzo concluyó progresión ósea. Donde brilla, manda el componente proliferativo.',
                  'It is labelled glucose: it builds up where cells burn a lot of energy, i.e. where the tumour is most active and aggressive. The March FDG study concluded bone progression. Where it shines, the proliferative component rules.') }}
              </p>
            </div>
          </div>
        </section>

        <!-- ===== LAS DOS CARAS EN IMAGEN (MIP) ===== -->
        <section class="mb-14" aria-labelledby="mip">
          <h2 id="mip" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('Las dos caras, en imagen real', 'The two faces, in real imaging') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Proyección de máxima intensidad (todo el cuerpo de un vistazo), reconstruida desde tus DICOM. Lo intenso fuera del esqueleto es captación normal de cada trazador (cerebro y corazón en FDG; riñones, bazo e hígado en Galio); las metástasis son los focos del esqueleto.',
              'Maximum-intensity projection (the whole body at a glance), reconstructed from your DICOM. The intense areas outside the skeleton are normal uptake of each tracer (brain and heart on FDG; kidneys, spleen and liver on gallium); the metastases are the skeletal foci.') }}
          </p>
          <div class="grid grid-cols-2 gap-4 max-w-2xl">
            <figure class="card-base !p-3">
              <img src="/metastasis/gal_mip_hot.jpg" :alt="L('MIP Galio-68 DOTATOC', 'Ga-68 DOTATOC MIP')" class="w-full rounded-lg bg-black" loading="lazy" />
              <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC · {{ L('receptor', 'receptor') }}</figcaption>
            </figure>
            <figure class="card-base !p-3">
              <img src="/metastasis/fdg_mip_hot.jpg" :alt="L('MIP FDG', 'FDG MIP')" class="w-full rounded-lg bg-black" loading="lazy" />
              <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</figcaption>
            </figure>
          </div>
        </section>

        <!-- ===== MAPA INTERACTIVO ===== -->
        <section class="mb-14" aria-labelledby="mapa">
          <h2 id="mapa" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('El mapa, lesión a lesión', 'The map, lesion by lesion') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Toca cualquier foco para ver su ficha. El color indica el fenotipo (violeta = neuroendocrino → coral = agresivo). Desliza la línea de tiempo para ver la evolución: el tamaño refleja la avidez en esa fecha y los focos huecos no captan en ese momento. El esqueleto es un esquema orientativo.',
                  'Tap any focus to open its card. Colour shows the phenotype (violet = neuroendocrine → coral = aggressive). Slide the timeline to see the evolution: marker size reflects avidity at that date and hollow markers do not take up at that moment. The skeleton is a schematic guide.') }}
          </p>

          <!-- resumen -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="card-base !p-4"><div class="text-3xl font-display text-berenjena">{{ counts.total }}</div><div class="text-xs text-tinta mt-1">{{ L('focos óseos', 'bone foci') }}</div></div>
            <div class="card-base !p-4"><div class="text-3xl font-display" :style="{ color: '#9d44ab' }">{{ counts.ne }}</div><div class="text-xs text-tinta mt-1">{{ L('solo receptor (sin FDG)', 'receptor-only (no FDG)') }}</div></div>
            <div class="card-base !p-4"><div class="text-3xl font-display" :style="{ color: '#df7a44' }">{{ counts.mix }}</div><div class="text-xs text-tinta mt-1">{{ L('mixtos (ambos)', 'mixed (both)') }}</div></div>
            <div class="card-base !p-4"><div class="text-3xl font-display" :style="{ color: '#bb4128' }">{{ counts.agg }}</div><div class="text-xs text-tinta mt-1">{{ L('solo FDG (agresivo)', 'FDG-only (aggressive)') }}</div></div>
          </div>

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
              <div class="inline-flex rounded-full border border-[rgba(45,27,61,0.2)] overflow-hidden text-xs font-semibold">
                <button type="button" @click="setFrame(1)" class="px-3 py-1.5 transition-colors"
                  :class="!isGalio ? 'text-cream' : 'text-tinta'" :style="!isGalio ? { background: '#bb4128' } : {}">FDG</button>
                <button type="button" @click="setFrame(2)" class="px-3 py-1.5 transition-colors"
                  :class="isGalio ? 'text-cream' : 'text-tinta'" :style="isGalio ? { background: '#9d44ab' } : {}">Galio</button>
              </div>
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
                    :stroke-dasharray="gPresentAt(g, frame) ? undefined : '3 2'"
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
                  <span>{{ L('Neuroendocrino', 'Neuroendocrine') }}</span>
                  <span>{{ L('Agresivo', 'Aggressive') }}</span>
                </div>
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
                    : { background: 'transparent', color: phenoColor(f), borderColor: phenoColor(f) + '55' }">
                  #{{ f.id }} · {{ focusPart(f) }}
                </button>
              </div>

              <span class="pill-data mt-2 mb-3 inline-flex" :style="{ background: phenoColor(sel) + '22', color: phenoColor(sel) }">{{ phenoLabel(sel) }}</span>

              <!-- capa CLARA -->
              <p class="text-[15px] text-berenjena leading-relaxed mb-4">{{ sel.what[lang] }}</p>

              <!-- TRIAJE: qué orienta este patrón (orientación para el comité) -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.1)] bg-cream-card p-3">
                <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: phenoColor(sel) }" />
                  {{ L('Qué orienta este patrón', 'What this pattern points to') }}
                </p>
                <ul class="space-y-1.5">
                  <li v-for="(tg, i) in triage(sel)" :key="i" class="flex gap-2 text-[13px] leading-snug">
                    <span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: triageTone(tg.tone) }" />
                    <span class="text-tinta">{{ lang === 'en' ? tg.en : tg.es }}</span>
                  </li>
                </ul>

                <!-- Valoración SBRT + correlación RM (citado) -->
                <div v-if="selSbrt" class="mt-3 pt-3 border-t border-[rgba(45,27,61,0.08)]">
                  <p class="text-[11px] font-semibold text-berenjena mb-1.5 flex items-center gap-2 flex-wrap">
                    {{ L('Valoración para SBRT', 'SBRT assessment') }}
                    <span class="status-badge" :style="{ background: (selSbrtMeta?.c || '#6b6470') + '22', color: selSbrtMeta?.c || '#6b6470' }">{{ L('Grupo', 'Group') }} {{ selSbrt?.group }} · {{ lang === 'en' ? selSbrtMeta?.en : selSbrtMeta?.es }}</span>
                  </p>
                  <p class="text-[13px] text-tinta leading-snug">{{ lang === 'en' ? selSbrt?.en : selSbrt?.es }}</p>
                  <p class="text-[10px] text-tinta mt-1.5 italic leading-relaxed">{{ L('Según el documento de apoyo para Oncología Radioterápica (12/06/2026), que cita el informe de RM de columna (11/06/2026, Dra. Martínez Fernández) y los PET. Documento de apoyo, no diagnóstico: la decisión es del radioncólogo y del comité.', 'From the supportive document for Radiation Oncology (12 Jun 2026), citing the spine MRI report (11 Jun 2026, Dr. Martínez Fernández) and the PET studies. Supportive document, not a diagnosis: the decision belongs to the radiation oncologist and the tumour board.') }}</p>
                </div>

                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Lectura orientativa derivada de tus propios SUV y morfología, para apoyar la conversación con tu equipo. No es consejo médico ni una indicación de tratamiento.', 'Orientation derived from your own SUVs and morphology, to support the conversation with your team. Not medical advice or a treatment indication.') }}</p>
              </div>

              <!-- hueso 3D + mapa de calor (científico) -->
              <div class="mb-4">
                <p class="eyebrow mb-2 block">{{ L('Anatomía y captación · paso a paso', 'Anatomy & uptake · step by step') }}</p>
                <ClientOnly>
                  <LesionBone3D :le="sel" :all="LES" :vert-key="bone3dKeyOf(sel)" />
                </ClientOnly>
              </div>

              <!-- CUANTIFICACIÓN AUTOMÁTICA medida sobre los DICOM (verificación) -->
              <div v-if="hasAuto" class="mb-4 rounded-card border border-[rgba(45,27,61,0.1)] bg-cream-card p-3">
                <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#1f5a3a' }" />
                  {{ L('Medido sobre tus DICOM', 'Measured from your DICOM') }}
                  <span class="status-badge" :style="{ background: 'rgba(31,90,58,0.12)', color: '#1f5a3a' }">{{ L('automático · verificación', 'automatic · verification') }}</span>
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: '#bb4128' }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: '#bb4128' }">¹⁸F-FDG · {{ L('azúcar', 'sugar') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ sel.fdg != null ? sel.fdg.toFixed(2) : '—' }}</span>
                        <template v-if="selAuto?.fdgAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.fdgAuto?.toFixed(2) }}</span>
                          <span v-if="sel.fdg != null" class="font-semibold" :style="{ color: Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? '#1f5a3a' : '#c9921e' }">{{ Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? ' ✓' : ' ≈' }}</span>
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
                          <span v-if="sel.dota != null" class="font-semibold" :style="{ color: Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? '#1f5a3a' : '#c9921e' }">{{ Math.abs((sel.dota || 0) - (selAuto?.gaAuto || 0)) < 1.2 ? ' ✓' : ' ≈' }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.gaAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.gaMtv }} ml</span> · <span class="text-berenjena">{{ selAuto?.gaMorph }}</span></div>
                      <div v-else class="text-tinta">{{ L('auto: no medido — vale la tabla', 'auto: not measured — table stands') }}</div>
                    </div>
                  </div>
                </div>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('SUV recalculado del DICOM (corrección de decaimiento), volumen metabólico (MTV) y carga glucolítica (TLG) con máscara ósea del CT; morfología por densidad CT. El FDG (1,65 mm) es fino; el Galio (4 mm), más grueso. Verificación automática, no diagnóstico: manda tu tabla y el criterio del equipo.', 'SUV recomputed from the DICOM (decay-corrected), metabolic volume (MTV) and glycolytic load (TLG) with a CT bone mask; morphology from CT density. FDG (1.65 mm) is fine; gallium (4 mm) coarser. Automatic verification, not a diagnosis: your table and the team’s judgement prevail.') }}</p>
              </div>

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
              <details class="notes-disclosure">
                <summary>{{ L('Detalle técnico (para tu equipo médico)', 'Technical detail (for your medical team)') }}</summary>
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
          <p class="eyebrow mb-2 block">{{ L('Para decidir, de un vistazo', 'For decisions, at a glance') }}</p>
          <h2 id="fenotipo" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('Mapa de fenotipo', 'Phenotype map') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Cada lesión situada por sus dos trazadores a la vez: el eje horizontal es el azúcar (FDG, lo glucolítico/agresivo) y el vertical el receptor (Galio, lo neuroendocrino). Arriba-izquierda = diana de receptor; abajo-derecha = glucolíticas; arriba-derecha = mixtas. Toca un punto para abrir su ficha. Las divisiones son orientativas y los SUV son los de los informes.',
              'Each lesion placed by both tracers at once: the horizontal axis is sugar (FDG, the glycolytic/aggressive face) and the vertical axis is the receptor (gallium, the neuroendocrine face). Top-left = receptor target; bottom-right = glycolytic; top-right = mixed. Tap a dot to open its card. The dividers are orientative and the SUVs are those of the reports.') }}
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
                <text :x="qX(0) + 8" :y="qY(Q.ymax) + 15" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#9d44ab">{{ L('Diana de receptor', 'Receptor target') }}</text>
                <text :x="qX(Q.xmax) - 6" :y="qY(Q.ymax) + 15" text-anchor="end" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#b07d1e">{{ L('Mixto', 'Mixed') }}</text>
                <text :x="qX(Q.xmax) - 6" :y="qY(0) - 9" text-anchor="end" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="700" fill="#bb4128">{{ L('Glucolítico / agresivo', 'Glycolytic / aggressive') }}</text>
                <text :x="qX(0) + 8" :y="qY(0) - 9" font-family="Source Sans 3, sans-serif" font-size="9" fill="#8a8088">{{ L('Baja avidez', 'Low avidity') }}</text>
                <!-- títulos de eje -->
                <text :x="(qX(0) + qX(Q.xmax)) / 2" :y="Q.H - 6" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" fill="#2d1b3d">{{ L('FDG SUVmáx · azúcar (glucolítico →)', 'FDG SUVmax · sugar (glycolytic →)') }}</text>
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
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#9d44ab' }" />{{ L('Arriba-izquierda: capta receptor y poco azúcar → la cara neuroendocrina (diana de terapias al receptor).', 'Top-left: receptor-avid, little sugar → the neuroendocrine face (target of receptor therapies).') }}</li>
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#bb4128' }" />{{ L('Abajo-derecha: mucho azúcar y poco receptor → la cara glucolítica/agresiva.', 'Bottom-right: lots of sugar, little receptor → the glycolytic/aggressive face.') }}</li>
                <li><span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-1.5" :style="{ background: '#df7a44' }" />{{ L('Arriba-derecha: las dos caras conviven (mixto).', 'Top-right: both faces coexist (mixed).') }}</li>
                <li class="pt-1 text-[12px]">{{ L('El contorno punteado marca los focos de la IA de David, no confirmados en el informe.', 'A dashed outline marks David’s-AI foci, not confirmed in the report.') }}</li>
              </ul>
            </aside>
          </div>
        </section>

        <!-- ===== TRAYECTORIA ===== -->
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
              <div class="stat-readout__unit">{{ L('respuesta favorable', 'favourable response') }}</div>
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
          <h3 class="heading-display text-lg text-berenjena mb-1">{{ L('Concordancia entre trazadores', 'Concordance between tracers') }}</h3>
          <div class="grid sm:grid-cols-3 gap-3 mb-5">
            <div class="card-base !p-4 border-l-4" :style="{ borderColor: '#9d44ab' }">
              <div class="text-3xl font-display" :style="{ color: '#9d44ab' }">{{ counts.ne }}</div>
              <div class="text-xs text-tinta mt-1">{{ L('solo receptor (Galio+/FDG−)', 'receptor-only (Ga+/FDG−)') }}</div>
            </div>
            <div class="card-base !p-4 border-l-4" :style="{ borderColor: '#df7a44' }">
              <div class="text-3xl font-display" :style="{ color: '#df7a44' }">{{ counts.mix }}</div>
              <div class="text-xs text-tinta mt-1">{{ L('mixtos (ambos trazadores)', 'mixed (both tracers)') }}</div>
            </div>
            <div class="card-base !p-4 border-l-4" :style="{ borderColor: '#bb4128' }">
              <div class="text-3xl font-display" :style="{ color: '#bb4128' }">{{ counts.agg }}</div>
              <div class="text-xs text-tinta mt-1">{{ L('solo FDG (Galio−/FDG+)', 'FDG-only (Ga−/FDG+)') }}</div>
            </div>
          </div>
          <div v-if="riskFoci.length" class="alert-callout">
            <div class="alert-callout__title">{{ L('Para revisar con el equipo', 'To review with the team') }}</div>
            {{ L(
              'Hay hueso de carga con FDG que no baja: ' + riskFoci.map((l) => '#' + l.id + ' ' + l.level.es).join(' · ') + '. Son los focos donde el equipo suele valorar el riesgo estructural y la radioterapia; Oncología Radioterápica ya los revisó. No es consejo médico.',
              'There is weight-bearing bone with FDG that is not falling: ' + riskFoci.map((l) => '#' + l.id + ' ' + l.level.en).join(' · ') + '. These are the foci where teams usually weigh structural risk and radiotherapy; Radiation Oncology has already reviewed them. This is not medical advice.') }}
          </div>
        </section>

        <!-- ===== TU COLUMNA REAL (RMN) ===== -->
        <section class="mb-14" aria-labelledby="rmn">
          <p class="eyebrow mb-2 block">{{ L('Tu anatomía real', 'Your real anatomy') }}</p>
          <h2 id="rmn" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('Tu columna en resonancia (RMN)', 'Your spine on MRI') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Estas son imágenes reales de tu resonancia de columna (cervical y dorsal), reconstruidas de los DICOM. La RMN ve el hueso y la médula ósea con mucho más detalle que el CT de baja dosis del PET: por eso es la prueba de referencia para las metástasis óseas. Cambia de región y de secuencia, y desliza para recorrer los cortes.',
              'These are real images from your spine MRI (cervical and thoracic), reconstructed from the DICOM. MRI shows bone and bone marrow in far more detail than the low-dose CT of the PET: that is why it is the reference test for bone metastases. Switch region and sequence, and slide to scroll through the slices.') }}
          </p>
          <div class="card-base">
            <ClientOnly>
              <SpineMRIViewer />
            </ClientOnly>
          </div>

          <!-- Hallazgos del informe de RM + valoración SBRT (citado, no relectura) -->
          <div class="card-base mt-4">
            <p class="eyebrow mb-2 block">{{ L('Lectura del informe · citada', 'Report findings · cited') }}</p>
            <h3 class="heading-display text-lg text-berenjena mb-2">{{ L('Lo que dice tu RM de columna (11/06/2026)', 'What your spine MRI says (11 Jun 2026)') }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-4">
              {{ L('Resumen del informe de RM (Dra. Martínez Fernández), recogido en el documento de apoyo para Oncología Radioterápica (12/06/2026). Es el texto del informe, no una relectura de la imagen por esta herramienta.',
                    'Summary of the MRI report (Dr. Martínez Fernández), as captured in the supportive document for Radiation Oncology (12 Jun 2026). It is the report’s text, not a re-reading of the image by this tool.') }}
            </p>
            <p class="text-[12px] font-semibold text-berenjena mb-1.5">{{ L('Niveles con metástasis (multinivel):', 'Levels with metastasis (multilevel):') }}</p>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span v-for="lv in MRI_LEVELS" :key="lv" class="pill-data pill-data--violet">{{ lv }}</span>
            </div>
            <ul class="space-y-1.5 text-[13px] text-tinta leading-snug mb-4">
              <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#bb4128' }" /><span><strong class="text-berenjena">D11</strong> — {{ L('extensión al espacio epidural anterior y compromiso del canal lateral izquierdo (el hallazgo más delicado; por eso D11 va a comité).', 'anterior epidural extension and left lateral canal compromise (the most delicate finding; why D11 goes to the tumour board).') }}</span></li>
              <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#c9921e' }" /><span>{{ L('Fracturas patológicas crónicas (desde 2024) de L1 y L3.', 'Chronic pathological fractures (since 2024) of L1 and L3.') }}</span></li>
              <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#1f5a3a' }" /><span>{{ L('Médula espinal de señal normal.', 'Spinal cord with normal signal.') }}</span></li>
            </ul>
            <div class="grid sm:grid-cols-2 gap-3">
              <div class="rounded-card border-l-4 bg-cream px-4 py-3" :style="{ borderColor: '#bb4128' }">
                <p class="font-semibold text-sm mb-1" :style="{ color: '#bb4128' }">{{ L('Candidatas razonables a SBRT', 'Reasonable SBRT candidates') }}</p>
                <p class="text-[13px] text-tinta leading-snug">{{ sbrtGroupsForList.A.map((l) => '#' + l.id + ' ' + l.level[lang]).join(' · ') }}</p>
              </div>
              <div class="rounded-card border-l-4 bg-cream px-4 py-3" :style="{ borderColor: '#c9921e' }">
                <p class="font-semibold text-sm mb-1" :style="{ color: '#b07d1e' }">{{ L('Dominantes · requieren comité', 'Dominant · need tumour board') }}</p>
                <p class="text-[13px] text-tinta leading-snug">{{ sbrtGroupsForList.B.map((l) => '#' + l.id + ' ' + l.level[lang]).join(' · ') }}</p>
              </div>
            </div>
            <p class="text-sm text-tinta leading-relaxed mt-3">
              {{ L('Marco del documento: la enfermedad ósea es difusa y multinivel (no oligometastásica clásica), así que la SBRT se plantea de forma selectiva sobre las lesiones dominantes que progresan (oligoprogresión), al cambiar el tratamiento sistémico. Por la carga SSTR-ávida, además se plantea considerar PRRT (Lu-177-DOTATATE) en comité. Toca cada foco arriba para ver su valoración.',
                    'Document framing: the bone disease is diffuse and multilevel (not classic oligometastatic), so SBRT is framed selectively on the dominant, progressing lesions (oligoprogression), while changing systemic therapy. Given the SSTR-avid burden, PRRT (Lu-177-DOTATATE) is also raised for the tumour board. Tap each focus above to see its assessment.') }}
            </p>
          </div>

          <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
            {{ L(
              'Las imágenes de la RMN se muestran para verlas; los hallazgos de arriba están transcritos del informe de RM (11/06/2026) tal como lo recoge el documento de apoyo, y no son una relectura de la imagen por esta herramienta. La valoración SBRT procede de ese documento de apoyo (no diagnóstico). La decisión clínica es de tu radiólogo y del comité. Los SUV del resto de la página vienen de los informes del PET.',
              'The MRI images are shown for viewing; the findings above are transcribed from the MRI report (11 Jun 2026) as captured in the supportive document, and are not a re-reading of the image by this tool. The SBRT assessment comes from that supportive document (not a diagnosis). The clinical decision belongs to your radiologist and the tumour board. The SUVs in the rest of the page come from the PET reports.') }}
          </div>
        </section>

        <!-- ===== COLUMNA SAGITAL (PET) ===== -->
        <section class="mb-14" aria-labelledby="columna">
          <h2 id="columna" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('La columna en el PET, vértebra a vértebra', 'The spine on PET, vertebra by vertebra') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L('Corte sagital (perfil) con el TC en gris y el PET superpuesto en color. A la izquierda, el receptor (Galio); a la derecha, el azúcar (FDG). Compara qué vértebras encienden con cada trazador.',
                  'Sagittal (side) slice with CT in grey and PET overlaid in colour. Left, the receptor (gallium); right, the sugar (FDG). Compare which vertebrae light up with each tracer.') }}
          </p>
          <div class="grid grid-cols-2 gap-4 max-w-xl">
            <figure class="card-base !p-3">
              <img src="/metastasis/gal_spine.jpg" :alt="L('Fusión sagital Galio', 'Gallium sagittal fusion')" class="w-full rounded-lg bg-black" loading="lazy" />
              <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#9d44ab' }">⁶⁸Ga-DOTATOC</figcaption>
            </figure>
            <figure class="card-base !p-3">
              <img src="/metastasis/fdg_spine.jpg" :alt="L('Fusión sagital FDG', 'FDG sagittal fusion')" class="w-full rounded-lg bg-black" loading="lazy" />
              <figcaption class="text-xs text-center mt-2 font-semibold" :style="{ color: '#bb4128' }">¹⁸F-FDG</figcaption>
            </figure>
          </div>
        </section>

        <!-- ===== TABLA COMPLETA ===== -->
        <section class="mb-14" aria-labelledby="tabla">
          <h2 id="tabla" class="heading-display text-2xl text-berenjena mb-2">{{ L('Los focos, en una tabla', 'The foci, in one table') }}</h2>
          <p class="text-[12px] text-tinta mb-4 leading-relaxed max-w-3xl">
            {{ L('Pulsa una cabecera para ordenar. Fuente: «Informe» = informe oficial · «Ambos» = en el informe y en el análisis de la IA de David · «IA David» = solo en el análisis de la IA de David (medidas aproximadas sobre DICOM, a revisar).',
                  'Click a header to sort. Source: “Report” = official report · “Both” = in the report and in David’s AI analysis · “David AI” = only in David’s AI analysis (approximate DICOM measurements, to review).') }}
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
                  <td class="text-sm">{{ phenoLabel(le) }}</td>
                  <td><span class="pill-data whitespace-nowrap" :style="{ background: sourceMeta(le).c + '22', color: sourceMeta(le).c }">{{ L(sourceMeta(le).es, sourceMeta(le).en) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- nota: cosas por aclarar -->
          <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mt-4">
            <strong>{{ L('Por aclarar / pendiente de confirmar', 'To clarify / pending confirmation') }}</strong>
            <ul class="list-disc pl-5 mt-1.5 space-y-1">
              <li>{{ L('Faltan los tamaños de 6 focos: #1 C3, #2 C4, #3 escápula, #6 T9, #10 pedículo L1 y #15 ilíaco izquierdo.', 'Sizes missing for 6 foci: #1 C3, #2 C4, #3 scapula, #6 T9, #10 L1 pedicle and #15 left iliac.') }}</li>
              <li>{{ L('Confirmar el #12: aquí figura como sacro derecho, pero la tabla de la IA de David lo describe como vértebra lumbar.', 'Confirm #12: shown here as right sacrum, but David’s AI table describes it as a lumbar vertebra.') }}</li>
              <li>{{ L('Los 3 focos marcados «IA David» (#17–#19) son medidas aproximadas sobre los DICOM, no confirmadas en el informe oficial — a revisar con Medicina Nuclear.', 'The 3 “David AI” foci (#17–#19) are approximate DICOM measurements, not confirmed in the official report — to review with Nuclear Medicine.') }}</li>
            </ul>
          </div>

          <!-- CANDIDATOS NUEVOS (auto, no en la tabla) -->
          <div class="data-card mt-4">
            <div class="px-4 py-3">
              <p class="text-[11px] font-semibold text-berenjena uppercase tracking-wide mb-1 flex items-center gap-2 flex-wrap">
                {{ L('Focos extra detectados (automático, no en la tabla)', 'Extra foci detected (automatic, not in the table)') }}
                <span class="status-badge" :style="{ background: 'rgba(31,90,58,0.12)', color: '#1f5a3a' }">{{ L('verificación', 'verification') }}</span>
              </p>
              <p class="text-[12px] text-tinta leading-relaxed mb-2">{{ L('Focos FDG que la detección automática halló sobre el DICOM y que NO están en tu tabla. No es diagnóstico: es para que el equipo decida si añadir alguno. El primero (HU 1) probablemente es captación de partes blandas; el blástico de SUVmáx 5,82 (HU 704, lado izq.) es el más sugestivo de lesión real no listada.', 'FDG foci the automatic detection found on the DICOM that are NOT in your table. Not a diagnosis: for the team to decide whether to add any. The first (HU 1) is likely soft-tissue uptake; the blastic SUVmax 5.82 (HU 704, left) is the most suggestive of a real unlisted lesion.') }}</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(c, i) in AUTO_NEW_FDG" :key="i" class="pill-data" :style="{ background: c.flag ? '#fde4cc' : 'rgba(45,27,61,0.06)', color: c.flag ? '#8a4a1a' : '#3a3340' }">
                  SUVmáx {{ c.suvmax }} · {{ c.morph }} · {{ c.size }} mm · {{ c.side }}<template v-if="c.flag"> · {{ c.flag }}</template>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== QUÉ ORIENTA CADA PATRÓN ===== -->
        <section class="mb-14" aria-labelledby="patrones">
          <p class="eyebrow mb-2 block">{{ L('Qué significa cada lectura', 'What each reading means') }}</p>
          <h2 id="patrones" class="heading-display text-2xl text-berenjena mb-4">{{ L('Qué significa cada patrón', 'What each pattern means') }}</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="card-base border-t-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold mb-1" :style="{ color: '#9d44ab' }">{{ L('Receptor + / FDG −', 'Receptor + / FDG −') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'La cara neuroendocrina, bien diferenciada y normalmente más indolente. Expresa receptores de somatostatina (SSTR), que es justo lo que capta el Galio-68 DOTATOC: por eso estos focos brillan con el receptor.',
                'The neuroendocrine, well-differentiated and usually more indolent face. It expresses somatostatin receptors (SSTR), which is exactly what Gallium-68 DOTATOC binds: that is why these foci light up with the receptor.') }}</p>
            </div>
            <div class="card-base border-t-4" :style="{ borderColor: '#df7a44' }">
              <p class="font-semibold mb-1" :style="{ color: '#df7a44' }">{{ L('Mixto (ambos)', 'Mixed (both)') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'Conviven las dos caras en la misma lesión. El componente que capta azúcar (FDG) refleja la actividad más proliferativa; el que capta el receptor (Galio) refleja el componente neuroendocrino.',
                'Both faces coexist in the same lesion. The sugar-avid (FDG) component reflects the more proliferative activity; the receptor-avid (gallium) component reflects the neuroendocrine one.') }}</p>
            </div>
            <div class="card-base border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold mb-1" :style="{ color: '#bb4128' }">{{ L('FDG + / Receptor −', 'FDG + / receptor −') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'La cara más glucolítica. Capta azúcar (FDG) pero no el receptor, así que el Galio no la ve.',
                'The most glycolytic face. It takes up sugar (FDG) but not the receptor, so gallium does not see it.') }}</p>
            </div>
          </div>
          <div class="rounded-card bg-cream-card border border-[rgba(45,27,61,0.1)] px-4 py-3 mt-4 text-sm text-tinta leading-relaxed">
            <strong class="text-berenjena">{{ L('Una nota del propio mapa: ', 'A note from the map itself: ') }}</strong>
            {{ L(
              'el fémur derecho y el techo de la cadera derecha (#16, #14) son huesos de carga con FDG alto, y Oncología Radioterápica (oncoradio) ya los revisó. El pedículo izquierdo de L1 (#10) es el único foco que capta azúcar (FDG) pero no el receptor (Galio), y ha aumentado respecto al estudio previo.',
              'the right femur and the right hip roof (#16, #14) are weight-bearing bones with high FDG, and Radiation Oncology (oncoradio) has already reviewed them. The left pedicle of L1 (#10) is the only focus that takes up sugar (FDG) but not the receptor (gallium), and has risen versus the prior study.') }}
          </div>
        </section>

        <!-- fuentes -->
        <details class="notes-disclosure">
          <summary>{{ L('Fuentes y método', 'Sources and method') }}</summary>
          <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'SUV y localizaciones: informe PET-CT ¹⁸F-FDG 24/03/2026 e informe PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 (Medicina Nuclear, H. Virgen de la Arrixaca). Fenotipo: informe de Anatomía Patológica VH-26-B-17664, Vall d\'Hebron, 19/05/2026. Imágenes PET: MIP, fusión sagital y cortes axiales reconstruidos a partir de los DICOM de ambos estudios (PET con corrección de atenuación + TC). Los SUV calculados desde los DICOM concuerdan con el informe dentro de ~10–12% (diferencia esperable entre voxel-máx y ROI). RMN: cortes sagitales de columna cervical y dorsal (secuencias STIR y T1) exportados de los DICOM de RM; se muestran solo para visualización y están pendientes de lectura radiológica formal.',
              'SUV and locations: ¹⁸F-FDG PET-CT report 24/03/2026 and ⁶⁸Ga-DOTATOC PET-CT report 26/05/2026 (Nuclear Medicine, Virgen de la Arrixaca Hospital). Phenotype: Pathology report VH-26-B-17664, Vall d\'Hebron, 19/05/2026. PET images: MIP, sagittal fusion and axial slices reconstructed from the DICOM of both studies (attenuation-corrected PET + CT). SUVs computed from the DICOM agree with the report within ~10–12% (expected difference between voxel-max and ROI). MRI: sagittal slices of the cervical and thoracic spine (STIR and T1 sequences) exported from the MR DICOM; shown for visualisation only and pending formal radiology reading.') }}
          </p>
        </details>
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
