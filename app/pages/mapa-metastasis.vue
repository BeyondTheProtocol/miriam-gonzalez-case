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
    id: 4, x: 220, y: 156, side: 'C', dota: 4.23, fdg: 6.97, prevFdg: 2.8, pheno: 'mixAgg',
    level: { es: 'D1 (T1) · cuerpo vertebral', en: 'T1 · vertebral body' },
    region: { es: 'Columna dorsal alta', en: 'Upper thoracic spine' },
    what: { es: 'Primera vértebra dorsal, justo bajo el cuello. Foco nuevo: en el PET previo casi no se veía y ahora capta azúcar con fuerza. Conviene vigilarlo.', en: 'First thoracic vertebra, just below the neck. New focus: barely visible on the prior PET and now strongly sugar-avid. Worth watching.' },
    tech: { es: 'DOTATOC 4.23 / FDG 6.97 (previo 2.8, no significativo). Foco nuevo glucolítico → componente proliferativo emergente. Predominio agresivo.', en: 'DOTATOC 4.23 / FDG 6.97 (prior 2.8, non-significant). New glycolytic focus → emerging proliferative component. Aggressive-predominant.' },
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne',
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
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, pheno: 'mixNe',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    img: 'gal_spine',
    what: { es: 'Una de las lesiones más intensas. Capta muchísimo el receptor (la más “neuroendocrina” de todas) y también azúcar, aunque el azúcar ha bajado respecto al PET previo. Hueso denso (blástico).', en: 'One of the most intense lesions. Very high receptor uptake (the most “neuroendocrine” of all) plus some sugar, though sugar dropped versus the prior PET. Dense (blastic) bone.' },
    tech: { es: 'DOTATOC SUVmáx 13.27 (captación SSTR muy intensa, ≈ Krenning 3, estimado) / FDG 7.61 (previo 10.19, en descenso). Mixto con fuerte predominio del receptor. Lesión blástica.', en: 'DOTATOC SUVmax 13.27 (very intense SSTR uptake, ≈ Krenning 3, estimated) / FDG 7.61 (prior 10.19, decreasing). Mixed with strong receptor predominance. Blastic lesion.' },
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, pheno: 'ne',
    level: { es: 'D11 (T11) · pedículo izquierdo', en: 'T11 · left pedicle' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'En la MISMA vértebra que la #7 pero en el pedículo izquierdo (el puente óseo lateral): aquí solo capta el receptor, no azúcar. Misma vértebra, dos comportamientos distintos.', en: 'In the SAME vertebra as #7 but in the left pedicle (the lateral bony bridge): here only the receptor lights up, no sugar. Same vertebra, two different behaviours.' },
    tech: { es: 'DOTATOC SUVmáx 11.63, sin FDG. Receptor-puro intenso. Ilustra la heterogeneidad intra-vértebra junto a la #7.', en: 'DOTATOC SUVmax 11.63, no FDG. Intense receptor-only. Illustrates intra-vertebral heterogeneity alongside #7.' },
  },
  {
    id: 9, x: 220, y: 392, side: 'C', dota: 3.66, fdg: null, pheno: 'ne',
    level: { es: 'L1 · apófisis espinosa', en: 'L1 · spinous process' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'Punta posterior de la primera lumbar. Capta solo el receptor.', en: 'Posterior tip of the first lumbar vertebra. Receptor-only uptake.' },
    tech: { es: 'DOTATOC SUVmáx 3.66, sin FDG. Receptor-puro.', en: 'DOTATOC SUVmax 3.66, no FDG. Receptor-only.' },
  },
  {
    id: 10, x: 241, y: 399, side: 'L', dota: null, fdg: 6.84, prevFdg: 4.67, pheno: 'agg',
    level: { es: 'L1 · pedículo izquierdo', en: 'L1 · left pedicle' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'La ÚNICA lesión que capta azúcar pero NO el receptor, y va en aumento. Es la cara más agresiva de la enfermedad: la terapia dirigida al receptor no la alcanzaría.', en: 'The ONLY lesion that takes up sugar but NOT the receptor, and it is increasing. The most aggressive face of the disease: receptor-targeted therapy would not reach it.' },
    tech: { es: 'FDG SUVmáx 6.84 (previo 4.67, en aumento), SIN captación de Galio. Patrón desdiferenciado/glucolítico puro. Discordante con la #9 (misma vértebra). No candidato a terapia SSTR.', en: 'FDG SUVmax 6.84 (prior 4.67, rising), NO gallium uptake. Pure dedifferentiated/glycolytic pattern. Discordant with #9 (same vertebra). Not an SSTR-therapy target.' },
  },
  {
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe',
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'Última vértebra lumbar, zona de mucha carga. Capta intensamente el receptor y algo de azúcar (estable). Predominio neuroendocrino.', en: 'Last lumbar vertebra, a high-load zone. Intense receptor uptake plus some sugar (stable). Neuroendocrine-predominant.' },
    tech: { es: 'DOTATOC SUVmáx 12.14 (SSTR intensa) / FDG 5.0 (previo 4.81, estable). Mixto, predominio receptor.', en: 'DOTATOC SUVmax 12.14 (intense SSTR) / FDG 5.0 (prior 4.81, stable). Mixed, receptor-predominant.' },
  },
  {
    id: 12, x: 205, y: 505, side: 'R', dota: 4.27, fdg: 4.34, prevFdg: 6.26, pheno: 'mixBal',
    level: { es: 'Ala sacra derecha', en: 'Right sacral ala' },
    region: { es: 'Sacro', en: 'Sacrum' },
    what: { es: 'Parte alta y lateral del sacro (el hueso triangular bajo la columna), lado derecho. Capta los dos trazadores por igual; el azúcar ha bajado respecto al previo.', en: 'Upper-lateral part of the sacrum (the triangular bone below the spine), right side. Takes up both tracers about equally; sugar dropped versus the prior.' },
    tech: { es: 'DOTATOC 4.27 / FDG 4.34 (previo 6.26, en descenso). Mixto equilibrado, con respuesta glucolítica favorable.', en: 'DOTATOC 4.27 / FDG 4.34 (prior 6.26, decreasing). Balanced mixed, with favourable glycolytic response.' },
  },
  {
    id: 13, x: 165, y: 545, side: 'R', dota: 4.32, fdg: 7.71, prevFdg: 7.0, pheno: 'mixAgg',
    level: { es: 'Ilíaco derecho', en: 'Right iliac bone' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    img: 'crop_iliac',
    what: { es: 'Hueso de la pelvis (ala ilíaca) derecho. Capta los dos trazadores, con más azúcar que receptor. Es la lesión que se intentó biopsiar.', en: 'Right pelvic bone (iliac wing). Takes up both tracers, more sugar than receptor. This is the lesion that was biopsied.' },
    tech: { es: 'DOTATOC 4.32 / FDG 7.71 (previo 7.0, ligero aumento). Mixto, predominio agresivo. La biopsia ósea (26B585) solo halló hueso/músculo sin tumor evaluable.', en: 'DOTATOC 4.32 / FDG 7.71 (prior 7.0, slight rise). Mixed, aggressive-predominant. The bone biopsy (26B585) found only bone/muscle with no evaluable tumour.' },
  },
  {
    id: 14, x: 172, y: 585, side: 'R', dota: 3.96, fdg: 9.33, prevFdg: 4.0, load: true, pheno: 'mixAgg',
    level: { es: 'Ilíaco derecho supraacetabular', en: 'Right supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    img: 'crop_iliac',
    what: { es: 'Justo encima de la cadera derecha (el “techo” donde encaja el fémur). El azúcar se ha más que duplicado respecto al previo: zona de carga a vigilar.', en: 'Just above the right hip (the “roof” where the femur sits). Sugar has more than doubled versus the prior: a load-bearing zone to watch.' },
    tech: { es: 'DOTATOC 3.96 / FDG 9.33 (previo 4.0, en claro aumento). Mixto, predominio agresivo, hueso de carga. Valorar riesgo y tratamiento local.', en: 'DOTATOC 3.96 / FDG 9.33 (prior 4.0, clearly rising). Mixed, aggressive-predominant, weight-bearing bone. Consider risk and local therapy.' },
  },
  {
    id: 15, x: 275, y: 585, side: 'L', dota: 2.54, fdg: 3.97, prevFdg: 1.93, pheno: 'mixAgg',
    level: { es: 'Ilíaco izquierdo supraacetabular', en: 'Left supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'El reflejo del anterior en el lado izquierdo. Foco nuevo, de baja intensidad pero en aumento.', en: 'The mirror of the previous one on the left side. New focus, low intensity but increasing.' },
    tech: { es: 'FDG 3.97 (previo 1.93, nuevo) con DOTATOC 2.54. Foco mixto nuevo, de baja intensidad. (Discreta discordancia entre informes en la descripción del receptor.)', en: 'FDG 3.97 (prior 1.93, new) with DOTATOC 2.54. New low-intensity mixed focus. (Minor discordance between reports on the receptor description.)' },
  },
  {
    id: 16, x: 158, y: 628, r: 13, side: 'R', dota: 5.09, fdg: 9.43, prevFdg: 6.0, load: true, pheno: 'mixAgg',
    level: { es: 'Fémur proximal derecho', en: 'Right proximal femur' },
    region: { es: 'Cadera derecha', en: 'Right hip' },
    img: 'crop_femur',
    what: { es: 'Parte alta del fémur, en la cadera derecha. Es de las más ávidas de azúcar y va en aumento. Por estar en un hueso que soporta el peso del cuerpo, es prioritaria de vigilar.', en: 'Upper femur, at the right hip. One of the most sugar-avid and rising. Because it sits in a weight-bearing bone, it is a priority to monitor.' },
    tech: { es: 'DOTATOC 5.09 / FDG 9.43 (previo 6.0, en aumento). Mixto, predominio agresivo, hueso de carga. Confirmada en corte axial PET/TC (foco intraóseo en cuello femoral).', en: 'DOTATOC 5.09 / FDG 9.43 (prior 6.0, rising). Mixed, aggressive-predominant, weight-bearing bone. Confirmed on axial PET/CT (intra-osseous focus in the femoral neck).' },
  },
]

/* radio del marcador según avidez total */
function radius(le: Lesion): number {
  const m = Math.max(le.dota ?? 0, le.fdg ?? 0)
  return 6.5 + Math.min(m, 14) * 0.55
}
/* % del perfil que corresponde al receptor (orientativo) */
function neShare(le: Lesion): number {
  if (le.fdg == null) return 0.9
  if (le.dota == null) return 0.1
  return le.dota / (le.dota + le.fdg)
}
function phenoColor(le: Lesion) { return PHENO[le.pheno].c }
function phenoLabel(le: Lesion) { return L(PHENO[le.pheno].es, PHENO[le.pheno].en) }

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
          tag="PET doble trazador · 16 focos"
        />

        <!-- Aviso -->
        <div class="rounded-card border border-[#efb27a] bg-[#fbf0df] text-[#7a4a12] px-4 py-3 text-sm leading-relaxed mb-10">
          {{ L(
            'Esta página reúne y visualiza tus propios informes (PET-FDG 24/03/2026, PET Galio-68 DOTATOC 26/05/2026 y la revisión anatomopatológica de Vall d\'Hebron, mayo 2026). Es una herramienta para entender y para apoyar la conversación con tu equipo médico — no sustituye su criterio ni es consejo médico. Los SUV son los de los informes oficiales; las imágenes se reconstruyeron desde los DICOM de esos mismos estudios.',
            'This page gathers and visualises your own reports (FDG-PET 24/03/2026, Ga-68 DOTATOC PET 26/05/2026 and the Vall d\'Hebron pathology review, May 2026). It is a tool to understand and to support the conversation with your medical team — it does not replace their judgement and is not medical advice. SUVs are those of the official reports; images were reconstructed from the DICOM of those same studies.') }}
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
          <div class="data-card overflow-x-auto">
            <table class="data-table data-table--dense">
              <caption class="sr-only">{{ L('Fenotipo del tejido — Vall d\'Hebron', 'Tissue phenotype — Vall d\'Hebron') }}</caption>
              <thead>
                <tr>
                  <th scope="col">{{ L('Marcador', 'Marker') }}</th>
                  <th scope="col">{{ L('Resultado', 'Result') }}</th>
                  <th scope="col">{{ L('Lee', 'Reads') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="font-semibold text-berenjena">{{ L('Tipo histológico', 'Histologic type') }}</td><td>{{ L('Carcinoma infiltrante con diferenciación neuroendocrina', 'Infiltrating carcinoma with neuroendocrine differentiation') }}</td><td class="text-tinta text-sm">{{ L('Las dos caras', 'Both faces') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">{{ L('Subtipo (IHQ)', 'Subtype (IHC)') }}</td><td><span class="pill-data pill-data--warn">Luminal B · HER2 0</span></td><td class="text-tinta text-sm">{{ L('Cara mama', 'Breast face') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">RE / RP</td><td>{{ L('RE + fuerte (85%, alta) · RP + débil (20%)', 'ER + strong (85%, high) · PR + weak (20%)') }}</td><td class="text-tinta text-sm">{{ L('Hormonosensible', 'Hormone-sensitive') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">Ki-67</td><td><span class="pill-data pill-data--warn">40%</span></td><td class="text-tinta text-sm">{{ L('Proliferación alta → FDG', 'High proliferation → FDG') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">HER2</td><td><span class="pill-data pill-data--neutral">{{ L('Negativo (0)', 'Negative (0)') }}</span></td><td class="text-tinta text-sm">{{ L('No HER2-dirigido', 'Not HER2-directed') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">{{ L('Sinaptofisina / Cromogranina / INSM1', 'Synaptophysin / Chromogranin / INSM1') }}</td><td>{{ L('Heterogénea / focal + / mosaico +', 'Heterogeneous / focal + / mosaic +') }}</td><td class="text-tinta text-sm">{{ L('Cara neuroendocrina → SSTR / Galio', 'Neuroendocrine face → SSTR / gallium') }}</td></tr>
                <tr><td class="font-semibold text-berenjena">{{ L('Grado (Nottingham)', 'Grade (Nottingham)') }}</td><td>{{ L('2 (3+2+1)', '2 (3+2+1)') }}</td><td class="text-tinta text-sm">{{ L('Intermedio', 'Intermediate') }}</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-tinta mt-2 font-mono">
            {{ L('Vall d\'Hebron · Anatomía Patológica VH-26-B-17664 · Dr. V. Peg Cámara · caso Dra. C. Saura (VHIO) · 19/05/2026', 'Vall d\'Hebron · Pathology VH-26-B-17664 · Dr. V. Peg Cámara · case Dr. C. Saura (VHIO) · 19/05/2026') }}
          </p>
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
                  'Se pega a los receptores de somatostatina (SSTR). Marca la cara neuroendocrina, bien diferenciada y normalmente más indolente. Donde brilla mucho, hay diana para tratamientos dirigidos al receptor.',
                  'Binds somatostatin receptors (SSTR). It marks the neuroendocrine, well-differentiated and usually more indolent face. Where it shines, there is a target for receptor-directed therapies.') }}
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
            {{ L('Toca cualquier foco para ver su ficha. El color indica el fenotipo (de violeta = neuroendocrino a coral = agresivo) y el tamaño, la avidez. El esqueleto es un esquema orientativo.',
                  'Tap any focus to open its card. Colour shows the phenotype (violet = neuroendocrine to coral = aggressive) and size shows avidity. The skeleton is a schematic guide.') }}
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

          <div class="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
            <!-- ESQUELETO SVG -->
            <div class="card-base !p-4 lg:sticky lg:top-24">
              <div class="flex justify-between text-[11px] text-tinta px-1 mb-1">
                <span>{{ L('Derecha del cuerpo', 'Body right') }}</span>
                <span>{{ L('Izquierda del cuerpo', 'Body left') }}</span>
              </div>
              <svg viewBox="0 0 440 700" class="w-full" role="img" :aria-label="L('Esquema del esqueleto con las lesiones', 'Skeleton schematic with the lesions')">
                <!-- cráneo -->
                <ellipse cx="220" cy="40" rx="30" ry="34" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <!-- mandíbula/cuello -->
                <rect x="210" y="60" width="20" height="14" fill="#ece9df" stroke="#bdb9ab" stroke-width="1" />
                <!-- vértebras -->
                <rect v-for="(v, i) in vertebrae" :key="'v' + i" :x="v.x" :y="v.y" :width="v.w" :height="v.h" rx="3"
                  fill="#ece9df" stroke="#bdb9ab" stroke-width="1" />
                <!-- sacro -->
                <polygon points="200,485 240,485 232,540 208,540" fill="#ece9df" stroke="#bdb9ab" stroke-width="1" />
                <!-- pelvis -->
                <path d="M200,486 C150,486 120,520 128,562 C133,590 168,598 188,575 C200,560 202,520 200,486 Z" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <path d="M240,486 C290,486 320,520 312,562 C307,590 272,598 252,575 C240,560 238,520 240,486 Z" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <!-- fémures -->
                <circle cx="150" cy="600" r="13" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <rect x="150" y="606" width="13" height="92" rx="6" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <circle cx="290" cy="600" r="13" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <rect x="278" y="606" width="13" height="92" rx="6" fill="#ece9df" stroke="#bdb9ab" stroke-width="1.2" />
                <!-- escápulas -->
                <path d="M112,182 l34,8 l-6,52 z" fill="#ece9df" stroke="#bdb9ab" stroke-width="1" />
                <path d="M328,182 l-34,8 l6,52 z" fill="#ece9df" stroke="#bdb9ab" stroke-width="1" />
                <!-- ticks de nivel -->
                <g font-family="JetBrains Mono, monospace" font-size="9" fill="#908e85">
                  <text v-for="tk in ticks" :key="tk.t" x="356" :y="tk.y + 3" text-anchor="start">{{ tk.t }}</text>
                  <line v-for="tk in ticks" :key="'l' + tk.t" x1="344" :y1="tk.y" x2="352" :y2="tk.y" stroke="#cfccc0" stroke-width="1" />
                </g>
                <!-- lesiones -->
                <g v-for="le in LES" :key="le.id">
                  <circle v-if="visible(le)"
                    :cx="le.x" :cy="le.y" :r="(le.r ?? radius(le)) + (selected === le.id ? 3 : 0)"
                    :fill="phenoColor(le)"
                    :fill-opacity="selected === le.id ? 1 : 0.82"
                    :stroke="selected === le.id ? '#2d1b3d' : '#ffffff'"
                    :stroke-width="selected === le.id ? 2 : 1.2"
                    class="cursor-pointer transition-all"
                    tabindex="0" role="button"
                    :aria-label="`${le.level[lang]} — ${phenoLabel(le)}`"
                    @click="pick(le.id)" @keydown.enter="pick(le.id)" @keydown.space.prevent="pick(le.id)" />
                  <text v-if="visible(le)" :x="le.x" :y="le.y + 3.5" text-anchor="middle"
                    font-family="Source Sans 3, sans-serif" font-size="10" font-weight="700" fill="#fff"
                    class="pointer-events-none select-none">{{ le.id }}</text>
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

              <span class="pill-data mt-2 mb-3 inline-flex" :style="{ background: phenoColor(sel) + '22', color: phenoColor(sel) }">{{ phenoLabel(sel) }}</span>

              <!-- capa CLARA -->
              <p class="text-[15px] text-berenjena leading-relaxed mb-4">{{ sel.what[lang] }}</p>

              <!-- balance receptor vs azúcar -->
              <div class="mb-4">
                <div class="flex justify-between text-[11px] mb-1">
                  <span :style="{ color: '#9d44ab' }">{{ L('Receptor (Galio)', 'Receptor (gallium)') }} {{ sel.dota != null ? sel.dota.toFixed(1) : '—' }}</span>
                  <span :style="{ color: '#bb4128' }">{{ L('Azúcar (FDG)', 'Sugar (FDG)') }} {{ sel.fdg != null ? sel.fdg.toFixed(1) : '—' }}</span>
                </div>
                <div class="h-3 rounded-full overflow-hidden flex bg-[rgba(45,27,61,0.06)]">
                  <div :style="{ width: (neShare(sel) * 100) + '%', background: '#9d44ab' }" />
                  <div :style="{ width: ((1 - neShare(sel)) * 100) + '%', background: '#bb4128' }" />
                </div>
                <p class="text-[10px] text-tinta mt-1">{{ L('Perfil relativo orientativo. Los dos trazadores tienen escalas distintas: no es un porcentaje exacto de células.', 'Indicative relative profile. The two tracers use different scales: not an exact cell percentage.') }}</p>
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
                  <div v-if="sel.load"><span class="text-tinta">{{ L('Hueso de carga', 'Weight-bearing') }}</span><br><span class="font-mono" :style="{ color: '#bb4128' }">{{ L('sí — vigilar', 'yes — monitor') }}</span></div>
                </div>
              </details>
            </div>
          </div>
        </section>

        <!-- ===== COLUMNA SAGITAL ===== -->
        <section class="mb-14" aria-labelledby="columna">
          <h2 id="columna" class="heading-display text-2xl text-berenjena mb-2">
            {{ L('La columna, vértebra a vértebra', 'The spine, vertebra by vertebra') }}
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
          <h2 id="tabla" class="heading-display text-2xl text-berenjena mb-4">{{ L('Los 16 focos, en una tabla', 'The 16 foci, in one table') }}</h2>
          <div class="data-card overflow-x-auto">
            <table class="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">{{ L('Localización', 'Location') }}</th>
                  <th scope="col">DOTATOC</th>
                  <th scope="col">FDG</th>
                  <th scope="col">{{ L('Fenotipo', 'Phenotype') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="le in LES" :key="le.id" class="cursor-pointer" :class="selected === le.id ? 'bg-[rgba(157,68,171,0.08)]' : ''" @click="pick(le.id); $event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })">
                  <td><span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-semibold" :style="{ background: phenoColor(le) }">{{ le.id }}</span></td>
                  <td class="font-semibold text-berenjena">{{ le.level[lang] }}</td>
                  <td class="font-mono">{{ le.dota != null ? le.dota.toFixed(1) : '—' }}</td>
                  <td class="font-mono">{{ le.fdg != null ? le.fdg.toFixed(1) : '—' }}</td>
                  <td class="text-sm">{{ phenoLabel(le) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ===== QUÉ ORIENTA CADA PATRÓN ===== -->
        <section class="mb-14" aria-labelledby="patrones">
          <p class="eyebrow mb-2 block">{{ L('Cómo se traduce en decisiones', 'How it translates into decisions') }}</p>
          <h2 id="patrones" class="heading-display text-2xl text-berenjena mb-4">{{ L('Qué orienta cada patrón', 'What each pattern points to') }}</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="card-base border-t-4" :style="{ borderColor: '#9d44ab' }">
              <p class="font-semibold mb-1" :style="{ color: '#9d44ab' }">{{ L('Receptor + / FDG −', 'Receptor + / FDG −') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'La cara más indolente y bien diferenciada. Al expresar receptores de somatostatina, es la que abre la puerta —a discutir con tu equipo— a análogos de somatostatina y, en investigación para mama con diferenciación neuroendocrina, a radioligandos dirigidos al receptor (PRRT, ¹⁷⁷Lu-DOTATATE).',
                'The more indolent, well-differentiated face. Because it expresses somatostatin receptors, it is the one that opens the door —to discuss with your team— to somatostatin analogues and, investigationally for breast cancer with neuroendocrine differentiation, to receptor-directed radioligands (PRRT, ¹⁷⁷Lu-DOTATATE).') }}</p>
            </div>
            <div class="card-base border-t-4" :style="{ borderColor: '#df7a44' }">
              <p class="font-semibold mb-1" :style="{ color: '#df7a44' }">{{ L('Mixto (ambos)', 'Mixed (both)') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'Conviven las dos caras en la misma lesión. El componente que capta azúcar es el que marca la agresividad y el que hay que controlar; el componente receptor sigue siendo una diana posible.',
                'Both faces coexist in the same lesion. The sugar-avid component sets the aggressiveness and is the one to control; the receptor component remains a possible target.') }}</p>
            </div>
            <div class="card-base border-t-4" :style="{ borderColor: '#bb4128' }">
              <p class="font-semibold mb-1" :style="{ color: '#bb4128' }">{{ L('FDG + / Receptor −', 'FDG + / receptor −') }}</p>
              <p class="text-sm text-tinta leading-relaxed">{{ L(
                'La cara que empuja la progresión. La terapia dirigida al receptor NO la alcanza. Se aborda con tratamiento sistémico de mama (hormonoterapia ± inhibidor de CDK4/6 por ser RE+; quimioterapia o conjugados según el Ki-67 alto y la progresión) y, en huesos de carga, tratamiento local (radioterapia/cirugía).',
                'The face driving progression. Receptor-directed therapy does NOT reach it. It is addressed with systemic breast therapy (endocrine therapy ± CDK4/6 inhibitor since ER+; chemotherapy or antibody-drug conjugates depending on the high Ki-67 and progression) and, in weight-bearing bones, local therapy (radiotherapy/surgery).') }}</p>
            </div>
          </div>
          <div class="rounded-card bg-cream-card border border-[rgba(45,27,61,0.1)] px-4 py-3 mt-4 text-sm text-tinta leading-relaxed">
            <strong class="text-berenjena">{{ L('Dos avisos del propio mapa: ', 'Two flags from the map itself: ') }}</strong>
            {{ L(
              'el fémur derecho y el techo de la cadera derecha (#16, #14) son huesos de carga con FDG alto y en aumento → conviene preguntar por el riesgo de fractura y el tratamiento local. Y el pedículo izquierdo de L1 (#10) es el único foco solo-FDG y creciente → es la lesión que peor encaja con una estrategia centrada en el receptor.',
              'the right femur and the right hip roof (#16, #14) are weight-bearing bones with high and rising FDG → worth asking about fracture risk and local therapy. And the left pedicle of L1 (#10) is the only FDG-only, growing focus → the lesion that fits worst with a receptor-centred strategy.') }}
          </div>
        </section>

        <!-- fuentes -->
        <details class="notes-disclosure">
          <summary>{{ L('Fuentes y método', 'Sources and method') }}</summary>
          <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'SUV y localizaciones: informe PET-CT ¹⁸F-FDG 24/03/2026 e informe PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 (Medicina Nuclear, H. Virgen de la Arrixaca). Fenotipo: informe de Anatomía Patológica VH-26-B-17664, Vall d\'Hebron, 19/05/2026. Imágenes: MIP, fusión sagital y cortes axiales reconstruidos a partir de los DICOM de ambos estudios (PET con corrección de atenuación + TC). Los SUV calculados desde los DICOM concuerdan con el informe dentro de ~10–12% (diferencia esperable entre voxel-máx y ROI).',
              'SUV and locations: ¹⁸F-FDG PET-CT report 24/03/2026 and ⁶⁸Ga-DOTATOC PET-CT report 26/05/2026 (Nuclear Medicine, Virgen de la Arrixaca Hospital). Phenotype: Pathology report VH-26-B-17664, Vall d\'Hebron, 19/05/2026. Images: MIP, sagittal fusion and axial slices reconstructed from the DICOM of both studies (attenuation-corrected PET + CT). SUVs computed from the DICOM agree with the report within ~10–12% (expected difference between voxel-max and ROI).') }}
          </p>
        </details>
      </div>
    </section>
  </div>
</template>
