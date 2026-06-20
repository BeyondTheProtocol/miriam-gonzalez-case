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
/*  Codificación por TRAZADOR · alineada extremo-a-extremo con el visor   */
/*  3D (BoneTriView): el color encoda el TRAZADOR, nunca biología ni      */
/*  pronóstico. Constantes únicas — el resto de la página apunta aquí.    */
/*                                                                        */
/*    ⁶⁸Ga-DOTATOC (SSTR)  → TEAL   (visor: rgb 28,150,158 = #1c969e)     */
/*    ¹⁸F-FDG    (glucólisis) → ÁMBAR (visor: rgb 214,110,28 = #d66e1c)   */
/*                                                                        */
/*  La marca berenjena/miriam vive en el CHROME/UI (focos, anillos), NO   */
/*  en el dato (principio dataviz). `.fill` = relleno/punto/disco (pasa   */
/*  el mínimo gráfico 3:1 en cream y en oscuro); `.text` = variante       */
/*  oscura para TEXTO (≥4.5:1 AA en ambos fondos).                        */
/* ------------------------------------------------------------------ */
const TRACER = {
  ga:  { fill: '#1c969e', text: '#0c5a61', tintBg: '#e7f3f3' }, // teal · ⁶⁸Ga-DOTATOC / SSTR
  fdg: { fill: '#d66e1c', text: '#8a4a12', tintBg: '#f7ece0' }, // ámbar · ¹⁸F-FDG / glucólisis
} as const
const GA_FILL = TRACER.ga.fill, GA_TEXT = TRACER.ga.text
const FDG_FILL = TRACER.fdg.fill, FDG_TEXT = TRACER.fdg.text

/* ------------------------------------------------------------------ */
/*  RAMPA DIVERGING (eje CONTINUO de discordancia · NO binaria):          */
/*  SSTR-dominante ──► dual-SSTR ──► dual-EQUILIBRADO (neutro) ──►         */
/*  dual-glucolítico ──► glucolítico-dominante.                           */
/*  Extremos = teal-⁶⁸Ga ↔ ámbar-¹⁸F-FDG; punto medio NEUTRO (warm-gray   */
/*  «ni uno ni otro»). Todos los rellenos pasan 3:1 gráfico en cream Y en */
/*  oscuro #0d1117; el dígito del foco va en berenjena (ink) en los 5.    */
/* ------------------------------------------------------------------ */
type Pheno = 'ne' | 'mixNe' | 'mixBal' | 'mixAgg' | 'agg'
const PHENO: Record<Pheno, { c: string; es: string; en: string }> = {
  ne:     { c: GA_FILL,   es: 'SSTR-dominante (⁶⁸Ga⁺ / FDG⁻)', en: 'SSTR-dominant (⁶⁸Ga⁺ / FDG⁻)' },
  mixNe:  { c: '#3f9aa0', es: 'Dual · predominio SSTR', en: 'Dual · SSTR-predominant' },
  mixBal: { c: '#8c8678', es: 'Dual · equilibrado', en: 'Dual · balanced' },
  mixAgg: { c: '#cf7826', es: 'Dual · predominio glucolítico', en: 'Dual · glycolytic-predominant' },
  agg:    { c: FDG_FILL,  es: 'Glucolítico-dominante (FDG⁺ / SSTR⁻)', en: 'Glycolytic-dominant (FDG⁺ / SSTR⁻)' },
}
/* la rampa como CSS gradient (leyendas) — una sola fuente, sin copias divergentes */
const PHENO_RAMP_CSS = `linear-gradient(90deg,${PHENO.ne.c},${PHENO.mixNe.c},${PHENO.mixBal.c},${PHENO.mixAgg.c},${PHENO.agg.c})`
/* gradiente del SCORE de idoneidad: es MAGNITUD (chrome), NO un trazador → tono de
   marca berenjena→oro, deliberadamente distinto de la rampa de trazador (que es
   teal↔ámbar) para que nadie lo lea como captación. */
const SCORE_RAMP_CSS = 'linear-gradient(90deg,#6b4a78,#c9921e)'

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
    what: { es: 'Apófisis espinosa cervical. Capta solo ⁶⁸Ga-DOTATOC (SSTR); ¹⁸F-FDG negativo.', en: 'Cervical spinous process. ⁶⁸Ga-DOTATOC (SSTR) only; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 2.89; ¹⁸F-FDG negativo. SSTR+ / FDG−.', en: '⁶⁸Ga-DOTATOC SUVmax 2.89; ¹⁸F-FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 2, x: 206, y: 104, side: 'R', dota: 3.10, fdg: null, pheno: 'ne',
    level: { es: 'C4 · lámina / arco derecho', en: 'C4 · right lamina / arch' },
    region: { es: 'Columna cervical', en: 'Cervical spine' },
    what: { es: 'Lámina (arco posterior) de C4, lado derecho. Captación aislada de ⁶⁸Ga-DOTATOC (SSTR); ¹⁸F-FDG negativo.', en: 'C4 lamina (posterior arch), right side. Isolated ⁶⁸Ga-DOTATOC (SSTR) uptake; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 3.10; ¹⁸F-FDG negativo. SSTR+ / FDG−.', en: '⁶⁸Ga-DOTATOC SUVmax 3.10; ¹⁸F-FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 3, x: 120, y: 205, side: 'R', dota: 3.84, fdg: null, pheno: 'ne',
    level: { es: 'Escápula derecha', en: 'Right scapula' },
    region: { es: 'Cintura escapular', en: 'Shoulder girdle' },
    what: { es: 'Escápula derecha, fuera del eje axial. Captación aislada de ⁶⁸Ga-DOTATOC (SSTR); ¹⁸F-FDG negativo.', en: 'Right scapula, off the axial skeleton. Isolated ⁶⁸Ga-DOTATOC (SSTR) uptake; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 3.84; ¹⁸F-FDG negativo. SSTR+ / FDG−, fuera del eje axial.', en: '⁶⁸Ga-DOTATOC SUVmax 3.84; ¹⁸F-FDG negative. SSTR+ / FDG−, off the axial skeleton.' },
  },
  {
    id: 4, x: 220, y: 156, side: 'C', dota: 4.23, fdg: 6.97, prevFdg: 2.8, pheno: 'mixAgg', size: '14 × 10',
    level: { es: 'D1 (T1) · cuerpo vertebral', en: 'T1 · vertebral body' },
    region: { es: 'Columna dorsal alta', en: 'Upper thoracic spine' },
    what: { es: 'Primera vértebra dorsal (D1/T1). Foco nuevo: apenas se veía en el PET previo y ahora muestra ¹⁸F-FDG intenso.', en: 'First thoracic vertebra (T1). New focus: barely identifiable on the prior PET, now with intense ¹⁸F-FDG.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 4.23 / ¹⁸F-FDG 6.97 (previo 2.8, no significativo). Foco nuevo, FDG-dominante (FDG>SSTR).', en: '⁶⁸Ga-DOTATOC SUVmax 4.23 / ¹⁸F-FDG 6.97 (prior 2.8, non-significant). New focus, FDG-dominant (FDG>SSTR).' },
    rmn: { es: 'Componente blástico (TC). La forma y la médula ósea se ven mejor en la RMN — míralo en el visor.', en: 'Blastic component (CT). Shape and bone marrow are clearer on MRI — view it in the viewer.' },
  },
  {
    id: 5, x: 220, y: 234, side: 'C', dota: 6.17, fdg: null, pheno: 'ne', size: '14 × 10',
    level: { es: 'D5 (T5) · cuerpo vertebral', en: 'T5 · vertebral body' },
    region: { es: 'Columna dorsal media', en: 'Mid-thoracic spine' },
    what: { es: 'Cuerpo de D5/T5. Captación moderada-alta de ⁶⁸Ga-DOTATOC (SSTR); ¹⁸F-FDG negativo.', en: 'T5 vertebral body. Moderate-to-high ⁶⁸Ga-DOTATOC (SSTR) uptake; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 6.17 (moderada); ¹⁸F-FDG negativo. SSTR+ / FDG−.', en: '⁶⁸Ga-DOTATOC SUVmax 6.17 (moderate); ¹⁸F-FDG negative. SSTR+ / FDG−.' },
    rmn: { es: 'Lesión blástica (hueso denso).', en: 'Blastic lesion (dense bone).' },
  },
  {
    id: 6, x: 212, y: 313, side: 'R', dota: 1.37, fdg: null, pheno: 'ne',
    level: { es: 'D9 (T9) · cuerpo derecho', en: 'T9 · right body' },
    region: { es: 'Columna dorsal baja', en: 'Lower thoracic spine' },
    what: { es: 'D9/T9, lado derecho. Captación leve y aislada de ⁶⁸Ga-DOTATOC (SSTR), SUVmáx bajo; ¹⁸F-FDG negativo.', en: 'T9, right side. Mild, isolated ⁶⁸Ga-DOTATOC (SSTR) uptake, low SUVmax; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 1.37 (baja); ¹⁸F-FDG negativo. SSTR+ / FDG−.', en: '⁶⁸Ga-DOTATOC SUVmax 1.37 (low); ¹⁸F-FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, pheno: 'mixNe', size: '18 × 14',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'Una de las más intensas: la mayor captación ⁶⁸Ga-DOTATOC (SSTR) de la serie, dual con ¹⁸F-FDG que ha descendido vs el previo. Atenuación blástica en TC.', en: 'One of the most intense: the highest ⁶⁸Ga-DOTATOC (SSTR) uptake of the series, dual with ¹⁸F-FDG that has dropped vs prior. Blastic CT attenuation.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 13.27 (SSTR muy intensa) / ¹⁸F-FDG 7.61 (previo 10.19, ↓). Mixto, predominio SSTR (SSTR>FDG). Blástica.', en: '⁶⁸Ga-DOTATOC SUVmax 13.27 (very intense SSTR) / ¹⁸F-FDG 7.61 (prior 10.19, ↓). Mixed, SSTR-predominant (SSTR>FDG). Blastic.' },
    rmn: { es: 'Lesión blástica. La RM describe en D11 extensión al espacio epidural anterior y afectación del canal lateral izquierdo.', en: 'Blastic lesion. The MRI describes anterior epidural extension and left lateral canal compromise at D11.' },
    softTissue: { es: 'La RMN describe componente de partes blandas / extensión extraósea (espacio epidural anterior, canal lateral izquierdo). El tejido blando suele rentabilizar más que el hueso blástico denso, pero por su vecindad al canal y a las raíces la accesibilidad y la seguridad las valora radiología intervencionista.', en: 'The MRI describes a soft-tissue / extraosseous component (anterior epidural space, left lateral canal). Soft tissue usually yields more than dense blastic bone, but given its proximity to the canal and nerve roots, accessibility and safety are assessed by interventional radiology.' },
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, pheno: 'ne', size: '13 × 10',
    level: { es: 'D11 (T11) · pedículo izquierdo', en: 'T11 · left pedicle' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'Misma vértebra que la #7, pedículo izquierdo: aquí la captación es solo ⁶⁸Ga-DOTATOC (SSTR), sin ¹⁸F-FDG. Dos patrones en la misma vértebra (heterogeneidad intravertebral).', en: 'Same vertebra as #7, left pedicle: here uptake is ⁶⁸Ga-DOTATOC (SSTR) only, no ¹⁸F-FDG. Two patterns in one vertebra (intra-vertebral heterogeneity).' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 11.63; ¹⁸F-FDG negativo. SSTR+ intenso / FDG−. Ilustra la heterogeneidad intra-vértebra junto a la #7.', en: '⁶⁸Ga-DOTATOC SUVmax 11.63; ¹⁸F-FDG negative. Intense SSTR+ / FDG−. Illustrates intra-vertebral heterogeneity alongside #7.' },
    rmn: { es: 'Componente blástico; el detalle de la médula ósea se ve en el visor RMN.', en: 'Blastic component; bone-marrow detail is visible in the MRI viewer.' },
  },
  {
    id: 9, x: 220, y: 392, side: 'C', dota: 3.66, fdg: null, pheno: 'ne', size: '10 × 8',
    level: { es: 'L1 · apófisis espinosa', en: 'L1 · spinous process' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'Apófisis espinosa de L1. Captación aislada de ⁶⁸Ga-DOTATOC (SSTR); ¹⁸F-FDG negativo.', en: 'L1 spinous process. Isolated ⁶⁸Ga-DOTATOC (SSTR) uptake; ¹⁸F-FDG negative.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 3.66; ¹⁸F-FDG negativo. SSTR+ / FDG−.', en: '⁶⁸Ga-DOTATOC SUVmax 3.66; ¹⁸F-FDG negative. SSTR+ / FDG−.' },
  },
  {
    id: 10, x: 241, y: 399, side: 'L', dota: null, fdg: 6.84, prevFdg: 4.67, pheno: 'agg',
    level: { es: 'L1 · pedículo izquierdo', en: 'L1 · left pedicle' },
    region: { es: 'Columna lumbar', en: 'Lumbar spine' },
    what: { es: 'La ÚNICA lesión discordante ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻: glucólisis sin SSTR detectable, y el ¹⁸F-FDG en aumento.', en: 'The ONLY ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻ discordant lesion: glycolysis without detectable SSTR, and ¹⁸F-FDG rising.' },
    tech: { es: '¹⁸F-FDG SUVmáx 6.84 (previo 4.67, ↑); ⁶⁸Ga-DOTATOC negativo. ¹⁸F-FDG⁺ / SSTR⁻. Discordante con #9 (misma vértebra).', en: '¹⁸F-FDG SUVmax 6.84 (prior 4.67, ↑); ⁶⁸Ga-DOTATOC negative. ¹⁸F-FDG⁺ / SSTR⁻. Discordant with #9 (same vertebra).' },
  },
  {
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe', size: '18 × 13', sbrt: true,
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'L5, hueso de alta carga. ⁶⁸Ga-DOTATOC (SSTR) intenso y ¹⁸F-FDG moderado y estable: dual, predominio SSTR. En SBRT (tejido tratado).', en: 'L5, high-load bone. Intense ⁶⁸Ga-DOTATOC (SSTR) and moderate, stable ¹⁸F-FDG: dual, SSTR-predominant. Under SBRT (treated tissue).' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 12.14 (SSTR intensa) / ¹⁸F-FDG 5.0 (previo 4.81, estable). Mixto, predominio SSTR. En SBRT (tejido tratado).', en: '⁶⁸Ga-DOTATOC SUVmax 12.14 (intense SSTR) / ¹⁸F-FDG 5.0 (prior 4.81, stable). Mixed, SSTR-predominant. Under SBRT (treated tissue).' },
  },
  {
    id: 12, x: 205, y: 505, side: 'R', dota: 4.27, fdg: 4.34, prevFdg: 6.26, pheno: 'mixBal', size: '12 × 9',
    level: { es: 'Ala sacra derecha', en: 'Right sacral ala' },
    region: { es: 'Sacro', en: 'Sacrum' },
    what: { es: 'Ala sacra derecha. Captación dual equilibrada (⁶⁸Ga-DOTATOC ≈ ¹⁸F-FDG); el ¹⁸F-FDG ha descendido vs el previo.', en: 'Right sacral ala. Balanced dual uptake (⁶⁸Ga-DOTATOC ≈ ¹⁸F-FDG); ¹⁸F-FDG dropped vs prior.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 4.27 / ¹⁸F-FDG 4.34 (previo 6.26, ↓). Mixto equilibrado (SSTR≈FDG).', en: '⁶⁸Ga-DOTATOC SUVmax 4.27 / ¹⁸F-FDG 4.34 (prior 6.26, ↓). Balanced mixed (SSTR≈FDG).' },
  },
  {
    id: 13, x: 165, y: 545, side: 'R', dota: 4.32, fdg: 7.71, prevFdg: 7.0, pheno: 'mixAgg', size: '11 × 8',
    level: { es: 'Ilíaco derecho · ala ilíaca', en: 'Right iliac · iliac wing' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Ala ilíaca derecha. Captación dual, predominio glucolítico (¹⁸F-FDG > ⁶⁸Ga-DOTATOC).', en: 'Right iliac wing. Dual uptake, glycolytic-predominant (¹⁸F-FDG > ⁶⁸Ga-DOTATOC).' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 4.32 / ¹⁸F-FDG 7.71 (previo 7.0, leve ↑). Mixto, FDG>SSTR.', en: '⁶⁸Ga-DOTATOC SUVmax 4.32 / ¹⁸F-FDG 7.71 (prior 7.0, slight ↑). Mixed, FDG>SSTR.' },
    priorBiopsy: {
      es: 'Biopsia previa de este foco (26B585): solo dio hueso y músculo, sin tumor evaluable. Es un foco mixto, pero la zona muestreada fue hueso denso (blástico); el hueso denso suele rentabilizar poco en la biopsia (poco tejido tumoral).',
      en: 'Prior biopsy of this focus (26B585): yielded only bone and muscle, no evaluable tumor. It is a mixed focus, but the sampled zone was dense (blastic) bone; dense bone usually yields little on biopsy (little tumor tissue).',
    },
  },
  {
    id: 14, x: 172, y: 585, side: 'R', dota: 3.96, fdg: 9.33, prevFdg: 4.0, load: true, pheno: 'mixAgg', size: '14 × 11',
    level: { es: 'Ilíaco derecho supraacetabular', en: 'Right supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'Ilíaco supra-acetabular derecho (techo de la cadera). El ¹⁸F-FDG se ha más que duplicado vs el previo. Hueso de carga; en seguimiento por Oncología Radioterápica.', en: 'Right supra-acetabular iliac (hip roof). ¹⁸F-FDG has more than doubled vs prior. Weight-bearing bone; under Radiation Oncology follow-up.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 3.96 / ¹⁸F-FDG 9.33 (previo 4.0, claro ↑). Mixto, FDG>SSTR, hueso de carga.', en: '⁶⁸Ga-DOTATOC SUVmax 3.96 / ¹⁸F-FDG 9.33 (prior 4.0, clearly rising). Mixed, FDG>SSTR, weight-bearing bone.' },
  },
  {
    id: 15, x: 275, y: 585, side: 'L', dota: 2.54, fdg: 3.97, prevFdg: 1.93, pheno: 'mixAgg',
    level: { es: 'Ilíaco izquierdo supraacetabular', en: 'Left supra-acetabular iliac' },
    region: { es: 'Pelvis · techo de la cadera', en: 'Pelvis · hip roof' },
    what: { es: 'Espejo del #14 en el lado izquierdo (ilíaco supra-acetabular). Foco nuevo de baja intensidad pero en aumento; posible contaminación por captación pélvica fisiológica vecina, a correlacionar en el DICOM.', en: 'Mirror of #14 on the left (supra-acetabular iliac). New low-intensity focus, increasing; possible contamination from neighboring physiologic pelvic uptake, to correlate on the DICOM.' },
    tech: { es: '¹⁸F-FDG SUVmáx 3.97 (previo 1.93, nuevo) con ⁶⁸Ga-DOTATOC 2.54. Foco mixto nuevo de baja intensidad. Posible contaminación pélvica vecina (intestino/vejiga): a correlacionar en el DICOM.', en: '¹⁸F-FDG SUVmax 3.97 (prior 1.93, new) with ⁶⁸Ga-DOTATOC 2.54. New low-intensity mixed focus. Possible neighboring pelvic contamination (bowel/bladder): to correlate on the DICOM.' },
  },
  {
    id: 16, x: 158, y: 628, r: 13, side: 'R', dota: 5.09, fdg: 9.43, prevFdg: 6.0, load: true, pheno: 'mixAgg', size: '18 × 13',
    level: { es: 'Fémur proximal derecho', en: 'Right proximal femur' },
    region: { es: 'Cadera derecha', en: 'Right hip' },
    what: { es: 'Cuello femoral derecho. Uno de los focos con mayor ¹⁸F-FDG, en aumento vs el previo. Hueso de carga; en seguimiento por Oncología Radioterápica.', en: 'Right femoral neck. One of the highest ¹⁸F-FDG foci, risen vs prior. Weight-bearing bone; under Radiation Oncology follow-up.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 5.09 / ¹⁸F-FDG 9.43 (previo 6.0, ↑). Mixto, FDG>SSTR, hueso de carga. Confirmada en corte axial PET-CT.', en: '⁶⁸Ga-DOTATOC SUVmax 5.09 / ¹⁸F-FDG 9.43 (prior 6.0, ↑). Mixed, FDG>SSTR, weight-bearing bone. Confirmed on axial PET-CT.' },
  },
  {
    id: 17, x: 182, y: 198, side: 'C', dota: 1.6, fdg: 4.8, pheno: 'mixAgg', size: '≤ 8', source: 'ia-david',
    level: { es: 'Tórax alto / costilla', en: 'Upper thorax / rib' },
    region: { es: 'Parrilla costal', en: 'Rib cage' },
    what: { es: 'Foco costal / tórax alto, ¹⁸F-FDG predominante de baja intensidad. Detección por IA marcada como dudosa por el propio análisis.', en: 'Upper-thorax / rib focus, predominantly ¹⁸F-FDG, low intensity. AI detection flagged as uncertain by the analysis itself.' },
    tech: { es: '⁶⁸Ga-DOTATOC ~1.6 / ¹⁸F-FDG ~4.8 (aproximados, sobre los DICOM). ¹⁸F-FDG⁺ / SSTR bajo. No confirmado en informe oficial; revisar con Medicina Nuclear.', en: '⁶⁸Ga-DOTATOC ~1.6 / ¹⁸F-FDG ~4.8 (approximate, on the DICOM). ¹⁸F-FDG⁺ / low SSTR. Not confirmed in the official report; review with Nuclear Medicine.' },
  },
  {
    id: 18, x: 178, y: 560, side: 'R', dota: 4.3, fdg: 1.7, pheno: 'mixNe', size: '8 × 6', source: 'ia-david',
    level: { es: 'Ilíaco derecho · unión ilíaco-femoral', en: 'Right iliac · iliac-femoral junction' },
    region: { es: 'Pelvis', en: 'Pelvis' },
    what: { es: 'Foco pélvico leve (unión ilíaco-femoral), ⁶⁸Ga-DOTATOC (SSTR) predominante y ¹⁸F-FDG bajo. Detección por IA.', en: 'Mild pelvic focus (iliac-femoral junction), predominant ⁶⁸Ga-DOTATOC (SSTR), low ¹⁸F-FDG. AI detection.' },
    tech: { es: '⁶⁸Ga-DOTATOC ~4.3 / ¹⁸F-FDG ~1.7 (aproximados, sobre los DICOM). SSTR+ / FDG bajo. No en informe oficial.', en: '⁶⁸Ga-DOTATOC ~4.3 / ¹⁸F-FDG ~1.7 (approximate, on the DICOM). SSTR+ / low FDG. Not in the official report.' },
  },
  {
    id: 19, x: 232, y: 150, side: 'C', dota: 4.2, fdg: 3.1, pheno: 'mixNe', size: '8–10', source: 'ia-david',
    level: { es: 'C7–D2 · transición cervicotorácica', en: 'C7–D2 · cervicothoracic junction' },
    region: { es: 'Transición cervicotorácica', en: 'Cervicothoracic junction' },
    what: { es: 'Foco leve en la transición cervicotorácica (C7–D2), captación débil de ambos trazadores. El ¹⁸F-FDG aquí puede ser captación cervical fisiológica, a correlacionar. Detección por IA.', en: 'Mild focus at the cervicothoracic junction (C7–D2), weak uptake of both tracers. ¹⁸F-FDG here may be physiologic cervical uptake, to correlate. AI detection.' },
    tech: { es: '⁶⁸Ga-DOTATOC ~4.8 / ¹⁸F-FDG ~3.1 (aproximados, sobre los DICOM). Baja intensidad; el FDG puede ser captación cervical fisiológica, a correlacionar. No en informe oficial.', en: '⁶⁸Ga-DOTATOC ~4.8 / ¹⁸F-FDG ~3.1 (approximate, on the DICOM). Low intensity; FDG may be physiological cervical uptake, to correlate. Not in the official report.' },
  },
]

/* ══════════════════════════════════════════════════════════════════ */
/*  MANIFIESTO DE DATOS · esquema, procedencia campo a campo y export    */
/*  ────────────────────────────────────────────────────────────────    */
/*  CONTRATO CLONABLE (modelo cBioPortal/OncoKB): el dato Y su nivel de   */
/*  evidencia SON la base, no una etiqueta pintada encima. Un equipo      */
/*  externo clona esta estructura para SU caso y cada cifra queda          */
/*  trazable a su fuente, su fecha y su trazador.                          */
/*                                                                          */
/*  Cada CIFRA del manifiesto es un `Cell`:                                */
/*    { valor, unidad, fecha?, trazador?, fuente, ref?, medido }           */
/*  · valor    — número | string | null (null = no aplica / no medido)     */
/*  · unidad   — 'SUVmáx' | 'mm' | 'ml' | 'HU' | '0-100' | '' …            */
/*  · fecha    — estudio de origen (ISO): FDG 2026-03-24 · Ga 2026-05-26 · */
/*               FDG previo 2026-01 · RMN 2026-06-11 · '' = sin fecha       */
/*  · trazador — '18F-FDG' | '68Ga-DOTATOC' | '' (no aplica)               */
/*  · fuente   — PROCEDENCIA, una de:                                       */
/*       'informe'              → consta en el informe oficial de Medicina  */
/*                                Nuclear (H. Virgen de la Arrixaca).        */
/*       'dicom-medicion-david' → re-cuantificación asistida sobre el DICOM */
/*                                nativo (SUV con corrección de decaimiento, */
/*                                máscara ósea del CT). Verificación, NO     */
/*                                diagnóstico.                              */
/*       'rmn-literal'          → texto literal del informe de RMN de       */
/*                                columna (11/06/2026); no es relectura de   */
/*                                imagen.                                    */
/*       'derivado'             → calculado por esta página a partir de los  */
/*                                anteriores (heurístico/regla; p.ej. score  */
/*                                de idoneidad, fenotipo, Δ, % receptor).     */
/*       'aproximado'           → estimación sobre el DICOM de un foco NO    */
/*                                consignado en el informe oficial (los 3    */
/*                                detectados por IA #17/#18/#19) — por        */
/*                                confirmar con Medicina Nuclear.            */
/*  · ref      — referencia opcional (código de biopsia, estudio, nota)     */
/*  · medido   — boolean. true = MEDIDO (cantidad física tomada del PET/CT/ */
/*               RMN: SUVmáx, mm, ml, HU). false = INTERPRETADO (lectura/    */
/*               regla: morfología «lítica/blástica», fenotipo, anatomía de  */
/*               corredor, score). El manifiesto NO inventa precisión:       */
/*               separa la medición de su lectura.                          */
/*                                                                          */
/*  Anti-PHI: ids sintéticos #1–19; sin nombre, sin nº de historia, sin     */
/*  metadatos de paciente. El export sale igual de limpio.                  */
/* ══════════════════════════════════════════════════════════════════ */
type ProvSource = 'informe' | 'dicom-medicion-david' | 'rmn-literal' | 'derivado' | 'aproximado'
interface Cell {
  valor: number | string | null
  unidad: string
  fecha?: string
  trazador?: '18F-FDG' | '68Ga-DOTATOC' | ''
  fuente: ProvSource
  ref?: string
  medido: boolean
}
/* fechas canónicas de los estudios de origen (ISO, sin PHI) */
const STUDY_DATES = {
  fdg: '2026-03-24',       // PET-CT ¹⁸F-FDG
  ga: '2026-05-26',        // PET-CT ⁶⁸Ga-DOTATOC
  fdgPrev: '2026-01',      // PET-CT ¹⁸F-FDG previo (mes)
  rmn: '2026-06-11',       // RMN de columna cervical/dorsal
} as const

/* La PROCEDENCIA de un foco es DERIVADA de los datos existentes (LES, AUTO,
   SIZE, scler/source) — NO se duplican los valores aquí, para que el manifiesto
   tenga UNA sola fuente y no pueda mentir. Esta función construye los `Cell`
   de un foco a partir de su Lesion + sus medidas automáticas + su tamaño.
   `manifestCells(le)` devuelve el conjunto de cifras con su procedencia. */
function provSuvSource(le: Lesion): ProvSource {
  return isAiDavid(le) ? 'aproximado' : 'informe'
}
function manifestCells(le: Lesion): Record<string, Cell> {
  const a = AUTO[le.id] || null
  const s = SIZE[le.id] ?? { mm: null, mtv: null, state: 'pending' as SizeState }
  const ai = isAiDavid(le)
  const suvSrc = provSuvSource(le)
  const cells: Record<string, Cell> = {
    /* SUVmáx — MEDIDO. Del informe (focos del informe) o aproximado sobre el DICOM (IA). */
    dota: { valor: le.dota, unidad: 'SUVmáx', fecha: STUDY_DATES.ga, trazador: '68Ga-DOTATOC', fuente: suvSrc, medido: true },
    fdg: { valor: le.fdg, unidad: 'SUVmáx', fecha: STUDY_DATES.fdg, trazador: '18F-FDG', fuente: suvSrc, medido: true },
    fdgPrev: { valor: le.prevFdg ?? null, unidad: 'SUVmáx', fecha: STUDY_DATES.fdgPrev, trazador: '18F-FDG', fuente: ai ? 'aproximado' : 'informe', medido: true },
    /* SUVmáx re-cuantificado sobre el DICOM (verificación) — MEDIDO, fuente David. */
    gaAuto: { valor: a?.gaAuto ?? null, unidad: 'SUVmáx', fecha: STUDY_DATES.ga, trazador: '68Ga-DOTATOC', fuente: 'dicom-medicion-david', medido: true },
    fdgAuto: { valor: a?.fdgAuto ?? null, unidad: 'SUVmáx', fecha: STUDY_DATES.fdg, trazador: '18F-FDG', fuente: 'dicom-medicion-david', medido: true },
    /* Extensión metabólica (eje mayor + MTV) medida sobre el DICOM — MEDIDO. */
    extentMm: { valor: s.state === 'reliable' ? s.mm : null, unidad: 'mm', fecha: STUDY_DATES.fdg, trazador: '', fuente: ai ? 'aproximado' : 'dicom-medicion-david', medido: true },
    mtvMl: { valor: s.state === 'reliable' ? s.mtv : null, unidad: 'ml', fecha: STUDY_DATES.fdg, trazador: '', fuente: ai ? 'aproximado' : 'dicom-medicion-david', medido: true },
    /* Morfología (forma del hueso) — INTERPRETADO: lectura de densidad CT + scler/informe. */
    morfologia: { valor: morphCat(le) ?? 'por confirmar', unidad: '', fecha: STUDY_DATES.fdg, trazador: '', fuente: le.scler ? 'informe' : 'derivado', medido: false },
    /* Fenotipo de discordancia (eje SSTR↔glucólisis) — INTERPRETADO (regla sobre los SUV). */
    fenotipo: { valor: PHENO[le.pheno].es, unidad: '', fuente: 'derivado', medido: false },
    /* Partes blandas / extensión extraósea — INTERPRETADO, literal de la RMN. */
    partesBlandas: { valor: le.softTissue ? 'sí' : 'no', unidad: '', fecha: STUDY_DATES.rmn, trazador: '', fuente: le.softTissue ? 'rmn-literal' : 'derivado', medido: false },
    /* Score de idoneidad como diana — INTERPRETADO (heurístico, pesos a mano, NO validado). */
    idoneidad: { valor: suitabilityScore(le), unidad: '0-100', fuente: 'derivado', ref: 'heurístico-no-validado', medido: false },
  }
  if (le.priorBiopsy) cells.biopsiaPrevia = { valor: 'no diagnóstica', unidad: '', fuente: 'informe', ref: BIOPSY_CODE, medido: false }
  return cells
}
/* etiqueta humana de la PROCEDENCIA de un campo (la fuente del provenance-chip de P2).
   Hoy se usa como `title` nativo en la tabla — empieza a DERIVAR la procedencia del
   manifiesto sin tocar el render (sin chips aún, sin cambio de layout). */
const PROV_LABEL: Record<ProvSource, { es: string; en: string }> = {
  informe: { es: 'informe oficial', en: 'official report' },
  'dicom-medicion-david': { es: 'medición sobre el DICOM', en: 'DICOM measurement' },
  'rmn-literal': { es: 'RMN (literal)', en: 'MRI (verbatim)' },
  derivado: { es: 'derivado (heurístico)', en: 'derived (heuristic)' },
  aproximado: { es: 'aproximado (IA · por confirmar)', en: 'approximate (AI · to confirm)' },
}
function provTitle(le: Lesion, field: string): string {
  const c = manifestCells(le)[field]
  if (!c) return ''
  const src = L(PROV_LABEL[c.fuente].es, PROV_LABEL[c.fuente].en)
  const mi = c.medido ? L('medido', 'measured') : L('interpretado', 'interpreted')
  return `${L('Fuente', 'Source')}: ${src} · ${mi}`
}

/* ── MARCADOR de procedencia VISIBLE (P2 · «procedencia visible») ──────────
   Hasta hoy la procedencia vivía SOLO en el `title` (tooltip) de la tabla — un
   radiólogo no la podía inspeccionar de un vistazo. Aquí se hace VISIBLE con un
   sistema MUDO por celda (un glyph + un color por tipo de fuente) y una LEYENDA
   una sola vez: carga cognitiva mínima, verificabilidad externa máxima.
   La forma codifica también MEDIDO vs INTERPRETADO (la distinción que un nuclear
   usa para juzgar): glyphs RELLENOS = MEDIDO (cantidad física), glyphs ABIERTOS
   o el «~» = INTERPRETADO/aproximado. NO se duplica nada: deriva de manifestCells
   (fuente única), así el marcador no puede desincronizarse del manifiesto ni del
   export. Tonos en el safelist de Tailwind no aplica: van por estilo inline. */
const PROV_MARK: Record<ProvSource, { glyph: string; tone: string }> = {
  informe: { glyph: '●', tone: '#1f6b57' },                 // disco RELLENO · medido · informe oficial
  'dicom-medicion-david': { glyph: '◆', tone: '#2d5f8a' },  // rombo RELLENO · medido · DICOM (David)
  'rmn-literal': { glyph: '▫', tone: '#1f6b57' },           // cuadro ABIERTO · interpretado · RMN literal
  derivado: { glyph: '▽', tone: '#7a5a8a' },                // triángulo ABIERTO · interpretado · derivado
  aproximado: { glyph: '~', tone: '#bf7d2c' },              // tilde · aproximado · IA (por confirmar)
}
/* el marcador de UN campo, derivado del manifiesto (glyph + tono + medido). */
function provMark(le: Lesion, field: string) {
  const c = manifestCells(le)[field]
  if (!c) return null
  const m = PROV_MARK[c.fuente]
  return { ...m, fuente: c.fuente, medido: c.medido, cell: c }
}
/* MEDIDO vs INTERPRETADO en una palabra (para chips/leyenda/panel) */
function miLabel(medido: boolean) { return medido ? L('medido', 'measured') : L('interpretado', 'interpreted') }
/* la LEYENDA (una sola vez): los 5 tipos de fuente con su glyph y qué significan.
   Reactiva con `lang` porque L() lee lang.value; computed para no recomputar. */
const PROV_LEGEND = computed(() => (Object.keys(PROV_MARK) as ProvSource[]).map((k) => ({
  fuente: k,
  glyph: PROV_MARK[k].glyph,
  tone: PROV_MARK[k].tone,
  label: L(PROV_LABEL[k].es, PROV_LABEL[k].en),
  medido: k === 'informe' || k === 'dicom-medicion-david',
})))
/* fecha legible (sin PHI) del estudio de origen, para el panel «Procedencia». */
function provDateLabel(iso?: string): string {
  if (!iso) return ''
  const M = lang.value === 'en'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const [y, m, d] = iso.split('-')
  if (!m) return y
  const mon = M[Number(m) - 1] || m
  return d ? `${d} ${mon} ${y}` : `${mon} ${y}`
}
/* CAMPOS del panel «Procedencia» del foco, en orden de lectura, con su rótulo
   humano. Solo los campos que aportan al equipo (no los auto-duplicados). */
const PROV_PANEL_FIELDS: { field: string; es: string; en: string }[] = [
  { field: 'dota', es: 'SUVmáx ⁶⁸Ga-DOTATOC', en: '⁶⁸Ga-DOTATOC SUVmax' },
  { field: 'fdg', es: 'SUVmáx ¹⁸F-FDG', en: '¹⁸F-FDG SUVmax' },
  { field: 'fdgPrev', es: 'SUVmáx ¹⁸F-FDG previo', en: 'Prior ¹⁸F-FDG SUVmax' },
  { field: 'extentMm', es: 'Extensión metabólica (mm)', en: 'Metabolic extent (mm)' },
  { field: 'mtvMl', es: 'MTV (ml)', en: 'MTV (ml)' },
  { field: 'morfologia', es: 'Morfología (forma del hueso)', en: 'Morphology (bone shape)' },
  { field: 'partesBlandas', es: 'Partes blandas / extensión extraósea', en: 'Soft tissue / extraosseous extension' },
  { field: 'fenotipo', es: 'Fenotipo (eje SSTR ↔ glucólisis)', en: 'Phenotype (SSTR ↔ glycolysis axis)' },
  { field: 'idoneidad', es: 'Idoneidad como diana (score)', en: 'Suitability as a target (score)' },
  { field: 'biopsiaPrevia', es: 'Biopsia previa', en: 'Prior biopsy' },
]
/* referencia legible (sin PHI) de una celda: PMID/NCT/código DICOM/nota literal. */
function provRefLabel(c: Cell): string {
  if (!c.ref) return ''
  if (c.ref === BIOPSY_CODE) return L('código de biopsia ' + c.ref, 'biopsy code ' + c.ref)
  if (c.ref === 'heurístico-no-validado') return L('heurístico · no validado', 'heuristic · not validated')
  return c.ref
}
/* ProvDot · el MARCADOR de procedencia MUDO por celda (glyph + tono, derivado
   de manifestCells). Componente funcional para reutilizarlo en la ficha SIN
   repetir markup ni desincronizar la fuente. Lleva un `title` (la procedencia
   en texto, idéntica al tooltip de la tabla) + aria-label: accesible y
   verificable, pero visualmente discreto (no recarga la cifra). */
const ProvDot = (props: { le: Lesion; field: string }) => {
  const m = provMark(props.le, props.field)
  if (!m) return null
  const t = provTitle(props.le, props.field)
  return h('span', {
    class: 'prov-dot',
    style: { color: m.tone },
    title: t,
    'aria-label': t,
    role: 'img',
  }, m.glyph)
}
/* ProvLegend · la LEYENDA de los tipos de fuente, una sola vez. Los 5 glyphs con
   su rótulo + si son MEDIDO o INTERPRETADO. Reutilizable (panel del foco + junto
   al manifiesto). Deriva de PROV_MARK/PROV_LABEL: una fuente, sin desincronizar. */
const ProvLegend = (props: { compact?: boolean }) =>
  h('div', { class: ['prov-legend', props.compact ? 'prov-legend--compact' : ''] }, [
    h('p', { class: 'prov-legend__title' }, L('Marcadores de procedencia', 'Provenance markers')),
    h('ul', { class: 'prov-legend__list' }, PROV_LEGEND.value.map((it) =>
      h('li', { key: it.fuente, class: 'prov-legend__item' }, [
        h('span', { class: 'prov-dot prov-dot--lg', style: { color: it.tone }, 'aria-hidden': 'true' }, it.glyph),
        h('span', { class: 'prov-legend__label' }, it.label),
        h('span', { class: 'prov-legend__sep', 'aria-hidden': 'true' }, '·'),
        h('span', {
          class: ['prov-mi', it.medido ? 'prov-mi--measured' : 'prov-mi--interp'],
        }, miLabel(it.medido)),
      ]),
    )),
    h('p', { class: 'prov-legend__note' }, L(
      'Relleno = MEDIDO (cantidad física: SUVmáx, mm, ml). Abierto o «~» = INTERPRETADO o aproximado (lectura/regla).',
      'Filled = MEASURED (physical quantity: SUVmax, mm, ml). Open or “~” = INTERPRETED or approximate (reading/rule).',
    )),
  ])
/* filas del panel «Procedencia» de UN foco: cada cifra → su origen completo
   (valor, fuente, fecha, trazador, medido/interpretado, ref). Deriva del
   manifiesto (no se reescribe a mano → no se desincroniza del export). */
function provRows(le: Lesion) {
  const cells = manifestCells(le)
  return PROV_PANEL_FIELDS
    .filter((f) => cells[f.field])
    .map((f) => {
      const c = cells[f.field]!
      const m = PROV_MARK[c.fuente]
      const val = c.valor == null
        ? '—'
        : (typeof c.valor === 'number' ? c.valor.toFixed(c.unidad === 'SUVmáx' ? 1 : (c.unidad === 'ml' ? 1 : 0)) : String(c.valor))
      return {
        field: f.field,
        label: L(f.es, f.en),
        glyph: m.glyph,
        tone: m.tone,
        valor: val,
        unidad: c.unidad,
        trazador: c.trazador || '',
        fecha: provDateLabel(c.fecha),
        fuente: L(PROV_LABEL[c.fuente].es, PROV_LABEL[c.fuente].en),
        medido: c.medido,
        ref: provRefLabel(c),
      }
    })
}

/* % del perfil que corresponde al receptor (orientativo) */
function neShare(le: Lesion): number {
  if (le.fdg == null) return 0.9
  if (le.dota == null) return 0.1
  return le.dota / (le.dota + le.fdg)
}
function phenoColor(le: Lesion) { return PHENO[le.pheno].c }
function phenoLabel(le: Lesion) { return L(PHENO[le.pheno].es, PHENO[le.pheno].en) }
/* TINTA del número de foco (WCAG AA): con la rampa diverging, los CINCO rellenos
   (teal, teal-lean, warm-gray neutro, ámbar-lean, ámbar) tienen luminancia media
   → el berenjena oscuro (#2d1b3d) pasa AA contra los 5 (4.34–4.77:1) y el blanco
   NO (3.4–3.6:1). Dígito uniforme en berenjena = legible y coherente. */
function markerInk(_le: Lesion): string { return '#2d1b3d' }
/* color del fenotipo SOLO para TEXTO: el relleno de la rampa pasa el mínimo gráfico
   (3:1) pero no el de texto (4.5:1) sobre cream. El texto usa la variante oscura del
   trazador en los extremos (teal #0c5a61 7.4:1 · ámbar #8a4a12 6.4:1) y tonos
   intermedios AA para los duales (≥4.5:1). Los rellenos/discos usan phenoColor. */
const PHENO_TEXT: Record<Pheno, string> = {
  ne: GA_TEXT, mixNe: '#176069', mixBal: '#6b6457', mixAgg: '#8a4f15', agg: FDG_TEXT,
}
function phenoText(le: Lesion) { return PHENO_TEXT[le.pheno] }

/* ------------------------------------------------------------------ */
/*  GLYPH SPLIT-DISC bivariado · oro de exquisitez del doble trazador.    */
/*  El marcador es un disco PARTIDO: semicírculo IZQUIERDO = ⁶⁸Ga-DOTATOC */
/*  (teal), semicírculo DERECHO = ¹⁸F-FDG (ámbar). Cada mitad lleva su    */
/*  intensidad/saturación según SU SUVmáx → la ASIMETRÍA ES la            */
/*  discordancia (muestra los DOS valores sin inventar un eje).           */
/*  Misma normalización que el visor (SUVmáx/9, gamma suave): un foco se  */
/*  ve igual de «ávido» en el disco y en el hueso 3D. UNA fuente única.   */
/* ------------------------------------------------------------------ */
const GLYPH_GA_MAX = 9, GLYPH_FDG_MAX = 9        // = GA_MAX/FDG_MAX del visor
const GLYPH_NEUTRAL = [222, 221, 214] as const   // marfil-gris «sin captación» del visor
const GLYPH_GA_PEAK = [28, 150, 158] as const    // teal saturado (rgb del visor)
const GLYPH_FDG_PEAK = [214, 110, 28] as const   // ámbar saturado (rgb del visor)
/* relleno de media-luna: marfil-neutro (SUV bajo) → pico saturado del trazador (SUV
   alto). gamma 0.80 igual que el visor para que coincida la percepción de avidez. */
function halfFill(suv: number | null, peak: readonly number[]): string {
  if (suv == null) return `rgb(${GLYPH_NEUTRAL.join(',')})`           // trazador NEGATIVO → neutro
  const max = peak === GLYPH_GA_PEAK ? GLYPH_GA_MAX : GLYPH_FDG_MAX
  const t = Math.min(Math.max(suv / max, 0), 1) ** 0.80
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${GLYPH_NEUTRAL.map((n, i) => mix(n, peak[i])).join(',')})`
}
function gaHalf(le: Lesion): string { return halfFill(le.dota, GLYPH_GA_PEAK) }
function fdgHalf(le: Lesion): string { return halfFill(le.fdg, GLYPH_FDG_PEAK) }
/* path de un semicírculo de radio r centrado en (cx,cy). side 'L' = izquierda (Ga),
   'R' = derecha (FDG). Disco partido por un diámetro VERTICAL. */
function halfDiscPath(cx: number, cy: number, r: number, side: 'L' | 'R'): string {
  const sweep = side === 'R' ? 1 : 0           // R: top→bottom horario · L: top→bottom antihorario
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r} Z`
}

/* Δ FDG frente al estudio previo (rojo = sube · verde = baja) */
function deltaFdg(le: Lesion): string {
  if (le.fdg == null || le.prevFdg == null) return '—'
  const x = le.fdg - le.prevFdg
  return (x > 0 ? '+' : '') + x.toFixed(1)
}
function deltaStyle(le: Lesion) {
  if (le.fdg == null || le.prevFdg == null) return {}
  const x = le.fdg - le.prevFdg
  if (x > 0.05) return { color: FDG_TEXT }
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
  1: { zone: { es: 'Apófisis espinosa de pequeño tamaño, captación SSTR aislada (⁶⁸Ga-DOTATOC) sin ¹⁸F-FDG; sin subvolumen idóneo.', en: 'Small spinous process, isolated SSTR uptake (⁶⁸Ga-DOTATOC) without ¹⁸F-FDG; no suitable subvolume.' }, approach: { es: 'Posterior a la apófisis espinosa C3 (decúbito prono).', en: 'Posterior to the C3 spinous process (prone).' }, safety: { es: 'Localización cervical y diana de pequeño calibre; la estimación orientativa (heurística) de rendimiento no compensa el riesgo del acceso.', en: 'Cervical location and small-caliber target; the indicative (heuristic) yield estimate does not offset the access risk.' }, rend: { es: 'Estimación orientativa (heurística): bajo / riesgo de muestra no diagnóstica.', en: 'Indicative (heuristic) estimate: low / non-diagnostic-sample risk.' } },
  2: { zone: { es: 'Arco posterior, captación SSTR aislada (⁶⁸Ga-DOTATOC) sin ¹⁸F-FDG; sin subvolumen idóneo.', en: 'Posterior arch, isolated SSTR uptake (⁶⁸Ga-DOTATOC) without ¹⁸F-FDG; no suitable subvolume.' }, approach: { es: 'Posterolateral a la lámina de C4.', en: 'Posterolateral to the C4 lamina.' }, safety: { es: 'Contiguo a la médula espinal y a la arteria vertebral; estimación orientativa (heurística) de rendimiento: bajo.', en: 'Contiguous to the spinal cord and vertebral artery; indicative (heuristic) yield estimate: low.' }, rend: { es: 'Estimación orientativa (heurística): bajo / riesgo de muestra no diagnóstica.', en: 'Indicative (heuristic) estimate: low / non-diagnostic-sample risk.' } },
  3: { zone: { es: 'Subvolumen medular de mayor captación del cuerpo escapular (no la cortical).', en: 'Marrow subvolume of highest uptake in the scapular body (not the cortex).' }, approach: { es: 'Posterior al cuerpo de la escápula (prono o decúbito lateral).', en: 'Posterior to the scapular body (prone or lateral decubitus).' }, safety: { es: 'Hueso plano accesible; vigilar el borde escapular medial (riesgo de neumotórax).', en: 'Accessible flat bone; watch the medial scapular border (pneumothorax risk).' }, rend: { es: 'Bajo-moderado (captación SSTR aislada, ¹⁸F-FDG⁻).', en: 'Low-moderate (isolated SSTR uptake, ¹⁸F-FDG⁻).' } },
  4: { zone: { es: 'Subvolumen ¹⁸F-FDG-ávido, evitando la matriz esclerótica.', en: '¹⁸F-FDG-avid subvolume, avoiding the sclerotic matrix.' }, approach: { es: 'Transpedicular torácico alto (prono); fusión TC+PET para centrar.', en: 'Upper-thoracic transpedicular (prone); CT+PET fusion to center it.' }, safety: { es: 'Entre la médula espinal y la pleura; matriz esclerótica; corredor técnicamente difícil.', en: 'Between the spinal cord and the pleura; sclerotic matrix; technically difficult corridor.' }, rend: { es: 'Moderado, con la salvedad de la matriz esclerótica.', en: 'Moderate, with the sclerotic-matrix caveat.' } },
  5: { zone: { es: 'Subóptimo: captación SSTR aislada (⁶⁸Ga-DOTATOC), atenuación esclerótica (¹⁸F-FDG⁻).', en: 'Suboptimal: isolated SSTR uptake (⁶⁸Ga-DOTATOC), sclerotic attenuation (¹⁸F-FDG⁻).' }, approach: { es: 'Transpedicular torácico (prono).', en: 'Thoracic transpedicular (prone).' }, safety: { es: 'Médula espinal y pleura; prioridad baja para este objetivo.', en: 'Spinal cord and pleura; low priority for this objective.' }, rend: { es: 'Bajo.', en: 'Low.' } },
  6: { zone: { es: 'Captación mínima; sin subvolumen concreto a muestrear.', en: 'Minimal uptake; no concrete subvolume to sample.' }, approach: { es: 'Transpedicular derecho.', en: 'Right transpedicular.' }, safety: { es: 'Médula espinal y pleura; captación demasiado baja.', en: 'Spinal cord and pleura; uptake too low.' }, rend: { es: 'Bajo (el menor de la serie).', en: 'Low (the lowest of the series).' } },
  7: { zone: { es: 'El componente de partes blandas epidural ofrecería el mayor rendimiento tisular — no el core esclerótico intraóseo.', en: 'The epidural soft-tissue component would offer the highest tissue yield — not the intra-osseous sclerotic core.' }, approach: { es: 'El tejido de mayor rendimiento es epidural/intracanal.', en: 'The highest-yield tissue is epidural/intracanal.' }, safety: { es: 'Contiguo a la médula espinal y las raíces: radiología intervencionista señala D11 (T11) como nivel a evitar por la extensión epidural anterior.', en: 'Contiguous to the spinal cord and roots: interventional radiology flags D11 (T11) as a level to avoid given the anterior epidural extension.' }, rend: { es: 'Alto si el componente de partes blandas fuera accesible; el acceso queda vetado por la seguridad.', en: 'High if the soft-tissue component were accessible; access is vetoed on safety grounds.' } },
  8: { zone: { es: 'Pedículo de atenuación esclerótica y calibre estrecho; sin subvolumen idóneo.', en: 'Sclerotic, narrow-caliber pedicle; no suitable subvolume.' }, approach: { es: 'Transpedicular al pedículo izquierdo de T11.', en: 'Transpedicular to the left T11 pedicle.' }, safety: { es: 'Contiguo a la extensión epidural de #7.', en: 'Contiguous to the epidural extension of #7.' }, rend: { es: 'Bajo.', en: 'Low.' } },
  9: { zone: { es: 'Apófisis espinosa de pequeño tamaño; sin subvolumen útil.', en: 'Small spinous process; no usable subvolume.' }, approach: { es: 'Posterior a la apófisis espinosa de L1.', en: 'Posterior to the L1 spinous process.' }, safety: { es: 'Localización lumbar (corredor más seguro) pero diana pequeña y posterior.', en: 'Lumbar location (safer corridor) but a small, posterior target.' }, rend: { es: 'Bajo / riesgo de muestra no diagnóstica.', en: 'Low / non-diagnostic-sample risk.' } },
  10: { zone: { es: 'El propio subvolumen ¹⁸F-FDG-ávido (foco con discordancia ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻).', en: 'The ¹⁸F-FDG-avid subvolume itself (focus with ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻ discordance).' }, approach: { es: 'Transpedicular izquierdo de L1; fusión TC+PET para centrar (captación solo en ¹⁸F-FDG).', en: 'Left L1 transpedicular; CT+PET fusion to center it (uptake on ¹⁸F-FDG only).' }, safety: { es: 'Lumbar, infraconal (corredor más seguro); pedículo de pequeño calibre → diana técnicamente exigente.', en: 'Lumbar, infraconal (safer corridor); small-caliber pedicle → technically demanding target.' }, rend: { es: 'Moderado; perfil molecular complementario de alto valor por la discordancia de trazadores.', en: 'Moderate; high-value complementary molecular profile given the tracer discordance.' } },
  11: { zone: { es: 'Subvolumen de atenuación mixta y captación elevada del cuerpo vertebral (sin componente esclerótico marcado).', en: 'Mixed-attenuation, high-uptake subvolume of the vertebral body (no marked sclerotic component).' }, approach: { es: 'Transpedicular infraconal, si la trayectoria libra la cresta ilíaca.', en: 'Infraconal transpedicular, if the trajectory clears the iliac crest.' }, safety: { es: 'SBRT concurrente: el tejido irradiado puede no ser representativo para la caracterización molecular → prioridad baja pese a la captación. Acceso: hueso de carga, pero el cuerpo vertebral lo tolera mejor que el cuello femoral.', en: 'Concurrent SBRT: irradiated tissue may not be representative for molecular characterization → low priority despite the uptake. Access: weight-bearing bone, but the vertebral body tolerates it better than the femoral neck.' }, rend: { es: 'Reducido por la SBRT (tejido irradiado), pese al volumen del cuerpo vertebral.', en: 'Reduced by SBRT (irradiated tissue), despite the vertebral-body volume.' } },
  12: { zone: { es: 'Subvolumen de atenuación mixta y captación elevada del ala sacra esponjosa.', en: 'Mixed-attenuation, high-uptake subvolume of the cancellous sacral ala.' }, approach: { es: 'Corredor sacro posterior (prono).', en: 'Posterior sacral corridor (prone).' }, safety: { es: 'Vigilar los forámenes sacros y los vasos presacros; sin médula espinal en el corredor.', en: 'Watch the sacral foramina and presacral vessels; no spinal cord in the corridor.' }, rend: { es: 'Moderado (corredor accesible).', en: 'Moderate (accessible corridor).' } },
  13: { zone: { es: 'Únicamente un subvolumen LÍTICO DISTINTO verificado en TC; el subvolumen esclerótico muestreado previamente resultó no diagnóstico.', en: 'Only a DIFFERENT lytic subvolume verified on CT; the previously sampled sclerotic subvolume was non-diagnostic.' }, approach: { es: 'Posterolateral al ala ilíaca (corredor conocido del 26B585); fusión PET hacia el subvolumen de mayor captación y menor esclerosis.', en: 'Posterolateral to the iliac wing (the known 26B585 corridor); PET fusion toward the subvolume of highest uptake and least sclerosis.' }, safety: { es: 'Corredor accesible y conocido; el riesgo predominante es de muestra no diagnóstica, no de complicación.', en: 'Accessible, familiar corridor; the predominant risk is a non-diagnostic sample, not a complication.' }, rend: { es: 'Riesgo de no diagnóstico demostrado en el subvolumen previo (matriz esclerótica).', en: 'Demonstrated non-diagnostic risk at the prior subvolume (sclerotic matrix).' } },
  14: { zone: { es: 'Subvolumen ¹⁸F-FDG-ávido, verificando en TC que NO corresponde a la placa esclerótica (matriz que resultó no diagnóstica en el 26B585).', en: '¹⁸F-FDG-avid subvolume, verifying on CT it does NOT correspond to the sclerotic plate (the matrix that proved non-diagnostic in 26B585).' }, approach: { es: 'Posterolateral supra-acetabular preservando el techo de carga acetabular; fusión PET para centrar el foco.', en: 'Posterolateral supra-acetabular sparing the load-bearing acetabular roof; PET fusion to center the focus.' }, safety: { es: 'Corredor accesible y conocido; confirmar la atenuación TC del punto diana antes de la punción.', en: 'Accessible, known corridor; confirm CT attenuation of the target point before puncture.' }, rend: { es: 'Estimación orientativa (heurística): alto (¹⁸F-FDG SUVmáx elevado y en aumento, tamaño favorable, sin componente esclerótico marcado).', en: 'Indicative (heuristic) estimate: high (elevated and rising ¹⁸F-FDG SUVmax, favorable size, no marked sclerotic component).' } },
  15: { zone: { es: 'Pendiente de correlación; captación posiblemente contaminada por actividad fisiológica.', en: 'Pending correlation; uptake possibly contaminated by physiologic activity.' }, approach: { es: 'Espejo de #14, posterolateral supra-acetabular izquierdo.', en: 'Mirror of #14, left posterolateral supra-acetabular.' }, safety: { es: 'Posible contaminación por captación fisiológica intestinal/vesical → validar primero; el #14 (derecho) está mejor respaldado.', en: 'Possible contamination from physiologic bowel/bladder uptake → validate first; #14 (right) is better supported.' }, rend: { es: 'Bajo / incierto (captación no fiable).', en: 'Low / uncertain (unreliable uptake).' } },
  16: { zone: { es: 'Subvolumen intraóseo de captación elevada (sin componente extraóseo abordable).', en: 'High-uptake intra-osseous subvolume (no extraosseous component to target).' }, approach: { es: '—', en: '—' }, safety: { es: 'Cuello femoral, hueso de carga: la obtención de cores conlleva riesgo de fractura patológica. Indicación y abordaje los valoran Oncología Radioterápica/Ortopedia.', en: 'Femoral neck, weight-bearing bone: core sampling carries pathologic-fracture risk. Indication and approach are assessed by Radiation Oncology/Orthopedics.' }, rend: { es: 'Hipermetabolismo glucolítico elevado, condicionado por la seguridad estructural.', en: 'High glycolytic hypermetabolism, gated by structural safety.' } },
  17: { zone: { es: 'Sin subvolumen accionable (detección por IA, no localizable, ≤8 mm).', en: 'No actionable subvolume (AI detection, not localizable, ≤8 mm).' }, approach: { es: '—', en: '—' }, safety: { es: 'Detección por IA sin confirmar; localización costal con riesgo de neumotórax; validar primero (Medicina Nuclear).', en: 'Unconfirmed AI detection; costal location with pneumothorax risk; validate first (Nuclear Medicine).' }, rend: { es: 'No evaluable.', en: 'Not assessable.' } },
  18: { zone: { es: 'Sin subvolumen fiable (detección por IA, solapa la región de #13).', en: 'No reliable subvolume (AI detection, overlaps the #13 region).' }, approach: { es: '—', en: '—' }, safety: { es: 'Detección por IA sin confirmar; ¹⁸F-FDG bajo; validar o evitar.', en: 'Unconfirmed AI detection; low ¹⁸F-FDG; validate or avoid.' }, rend: { es: 'Bajo / no diagnóstico.', en: 'Low / non-diagnostic.' } },
  19: { zone: { es: 'Sin subvolumen fiable (detección por IA, captación ¹⁸F-FDG posiblemente fisiológica cervical).', en: 'No reliable subvolume (AI detection, ¹⁸F-FDG uptake possibly physiologic cervical).' }, approach: { es: '—', en: '—' }, safety: { es: 'Detección por IA sin confirmar; corredor cervicotorácico difícil; validar primero.', en: 'Unconfirmed AI detection; difficult cervicothoracic corridor; validate first.' }, rend: { es: 'Bajo / no diagnóstico.', en: 'Low / non-diagnostic.' } },
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
  { src: '/metastasis/gal_mip_gray.jpg', tracer: 'ga', kind: 'mip', es: 'MIP · ⁶⁸Ga-DOTATOC (SSTR)', en: 'MIP · ⁶⁸Ga-DOTATOC (SSTR)' },
  { src: '/metastasis/fdg_mip_gray.jpg', tracer: 'fdg', kind: 'mip', es: 'MIP · ¹⁸F-FDG (glucólisis)', en: 'MIP · ¹⁸F-FDG (glycolysis)' },
  { src: '/metastasis/gal_spine.jpg', tracer: 'ga', kind: 'sag', es: 'Columna sagital · ⁶⁸Ga-DOTATOC (SSTR)', en: 'Sagittal spine · ⁶⁸Ga-DOTATOC (SSTR)' },
  { src: '/metastasis/fdg_spine.jpg', tracer: 'fdg', kind: 'sag', es: 'Columna sagital · ¹⁸F-FDG (glucólisis)', en: 'Sagittal spine · ¹⁸F-FDG (glycolysis)' },
]
function petTracerColor(p: PetImg): string { return p.tracer === 'ga' ? GA_TEXT : FDG_TEXT }
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
  const name = tr === 'ga' ? L('⁶⁸Ga SSTR', '⁶⁸Ga SSTR') : L('¹⁸F-FDG', '¹⁸F-FDG')
  return v != null ? `${name} ${v.toFixed(1)}` : name
}
/* color de texto del trazador dominante (AA sobre cream) */
function keyTracerColor(le: Lesion): string {
  return domTracer(le) === 'ga' ? GA_TEXT : FDG_TEXT
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

/* ════════════════════════════════════════════════════════════════════════
   BRUSHING & LINKING DE ESTADO (principio Becker/Cleveland: de 4 gráficos a
   UN instrumento). Un solo estado compartido de HOVER y un solo criterio de
   FILTRO que las 3 vistas de navegación (esqueleto SVG · scatter de fenotipo ·
   tabla/lista) leen para RESALTAR y ATENUAR la MISMA entidad — sin OCULTAR,
   sin CONCLUIR (solo enlaza el mismo foco; no afirma mérito).

   · hoveredFoco  → id bajo el ratón/foco-de-teclado en CUALQUIERA de las 3
     vistas; resalta ese foco en las otras dos y atenúa ligeramente el resto.
   · El FILTRO atenúa (no oculta): el no-coincidente baja de opacidad pero
     se queda en su sitio → el comité conserva el contexto de dónde están los
     demás focos. NO toca la SELECCIÓN (`selected`/`pick`/`pickAndShow`).
   ════════════════════════════════════════════════════════════════════════ */
const hoveredFoco = ref<number | null>(null)
function setHover(id: number) { hoveredFoco.value = id }
function clearHover() { hoveredFoco.value = null }

/* OPACIDAD de linking de un foco, combinando hover compartido + filtro.
   Reglas (la más restrictiva manda): si hay hover activo, el foco con hover y
   el seleccionado van a plena presencia y el resto se atenúa; el filtro atenúa
   los no coincidentes en todo momento. La SELECCIÓN nunca se atenúa (es el
   foco que se está viendo en 3D). Devuelve 1 (pleno), valor medio o bajo. */
const DIM_FILTER = 0.28   // no coincide con el filtro → contexto, no foco
const DIM_HOVER = 0.45    // hay otro foco con hover → se cede el protagonismo
function focoOpacity(le: Lesion): number {
  const isSel = le.id === selected.value
  const matches = visible(le)
  const h = hoveredFoco.value
  // el foco con hover y el seleccionado mandan: presencia plena aunque el filtro
  // no los marque (el comité los está mirando AHORA).
  if (h === le.id || isSel) return 1
  if (h != null) return matches ? DIM_HOVER : Math.min(DIM_HOVER, DIM_FILTER)
  return matches ? 1 : DIM_FILTER
}
/* ¿este foco es el que tiene el hover compartido? (énfasis sutil extra: anillo). */
function focoHovered(le: Lesion): boolean { return hoveredFoco.value === le.id }
/* versiones por GRUPO del esqueleto (un marcador agrupa 1+ focos por vértebra):
   el grupo está "con hover"/atenuado si su foco primario lo está. */
function gHovered(g: LesGroup): boolean { return g.foci.some((l) => l.id === hoveredFoco.value) }
function gOpacity(g: LesGroup): number {
  // el grupo toma la MAYOR presencia de sus focos (si alguno coincide/seleccionado/hover, no se atenúa)
  return Math.max(...g.foci.map(focoOpacity))
}
function setHoverGroup(g: LesGroup) { setHover(g.primary.id) }

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
/*  ESTADO-EN-URL · permalink por foco (sin backend · compatible       */
/*  `nuxt generate`)                                                    */
/*                                                                      */
/*  ANTI-PHI (no opcional): el hash sólo transporta el id SINTÉTICO    */
/*  del foco (#foco-1 … #foco-19). NUNCA viaja por la URL ningún        */
/*  identificador DICOM, número de estudio, accession ni metadato del  */
/*  paciente. Los ids 1-19 son etiquetas internas de esta herramienta, */
/*  no claves clínicas. Si en el futuro se reflejasen más cosas en el   */
/*  hash (trazador, plano de corte…), VERSIONAR el esquema y revisar    */
/*  de nuevo esta garantía; por ahora basta el foco.                    */
/* ------------------------------------------------------------------ */
const FOCO_HASH_RE = /^#foco-(\d+)$/
function isValidFocoId(id: number): boolean {
  return Number.isInteger(id) && LES.some((l) => l.id === id)
}
/** URL canónica citable del foco seleccionado (dominio público fijo). */
const focoPermalink = computed(() => 'https://helpmiriam.com' + localePath('/mapa-metastasis') + '#foco-' + selected.value)

/* Selección → hash: replaceState (NO pushState) para no ensuciar el historial
   en cada clic ni recargar. Guard cliente. */
watch(selected, (id) => {
  if (!import.meta.client) return
  const hash = '#foco-' + id
  if (window.location.hash === hash) return
  const url = window.location.pathname + window.location.search + hash
  window.history.replaceState(window.history.state, '', url)
})

/* feedback temporal del botón «Copiar enlace» (sin librerías) */
const linkCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null
async function copyFocoLink() {
  if (!import.meta.client) return
  const url = focoPermalink.value
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // degradación elegante si la Clipboard API no está disponible / sin permiso
    const ta = document.createElement('textarea')
    ta.value = url
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* sin clipboard: no rompemos nada */ }
    document.body.removeChild(ta)
  }
  linkCopied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { linkCopied.value = false }, 1800)
}

/* Restaurar al cargar: si el hash es #foco-N válido, seleccionar ese foco y
   bajar suave a la herramienta. Degrada con elegancia si es inválido/ausente. */
onMounted(() => {
  const m = window.location.hash.match(FOCO_HASH_RE)
  if (!m) return
  const id = Number(m[1])
  if (!isValidFocoId(id)) return // hash inválido → se ignora, queda la vista por defecto
  pickAndShow(id)
})

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
   (vía visible()); el grupo coincide con el filtro si alguno de sus focos lo hace.
   Ya no OCULTA (el filtro atenúa, no esconde) → la presencia la modula gOpacity. */
function gPresentAt(g: LesGroup, f: number): boolean { return g.foci.some((l) => presentAt(l, f)) }
/* TAMAÑO UNIFORME del marcador del esqueleto: un solo radio para todos los grupos.
   El SUVmáx ya está en el scatter, en la tabla y en la ficha; aquí el marcador solo
   localiza el foco (color = trazador, número = id). Sin tamaño ∝ SUVmáx. */
const SK_R = 9
/* radio del ÁREA TÁCTIL invisible del marcador del esqueleto (móvil): mayor que el
   marcador visible (≈22px en pantalla) para acertar con el dedo, pero MENOR que el
   espacio entre vértebras con foco (≥19.6 u) para no robar el toque al vecino. */
const SK_HIT = 14
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
   (SSTR-dominante · captación dual · glucolítico-dominante) mapean al degradado;
   «Dual» funde los dos patrones mixtos. Más los dos FLAGS no obvios: nuevo y
   detectado por IA. Quitado «Hueso de carga» (no decide diana; sigue en la ficha). */
const filters = computed<{ key: FilterKey; label: string; c?: string }[]>(() => [
  { key: 'all', label: L('Todas', 'All') },
  { key: 'ne', label: L('SSTR-dominante', 'SSTR-dominant'), c: PHENO.ne.c },
  { key: 'mix', label: L('Captación dual', 'Dual uptake'), c: PHENO.mixBal.c },
  { key: 'agg', label: L('Glucolítico-dominante', 'Glycolytic-dominant'), c: PHENO.agg.c },
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
/* área táctil invisible del punto del scatter (móvil): mayor que el punto visible pero
   menor que la separación mínima entre centros tras el desencimado ((r1+r2)·0.9 ≈ 15.3 u)
   → no roba el toque al punto vecino. */
const DOT_HIT = 12
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
    out.push({ tone: 'warn', es: 'Captación glucolítica (¹⁸F-FDG) elevada.', en: 'High glycolytic (¹⁸F-FDG) uptake.' })
  if (t && t.dir === 'new')
    out.push({ tone: 'warn', es: 'Foco nuevo respecto al estudio previo (antes no se veía).', en: 'New focus versus the prior study (not seen before).' })
  else if (t && t.dir === 'up')
    out.push({ tone: 'warn', es: `FDG mayor que en el estudio previo (antes ${l.prevFdg}).`, en: `FDG higher than in the prior study (was ${l.prevFdg}).` })
  else if (t && t.dir === 'down')
    out.push({ tone: 'neutral', es: `FDG menor que en el estudio previo (antes ${l.prevFdg}).`, en: `FDG lower than in the prior study (was ${l.prevFdg}).` })
  if (l.dota == null && l.fdg != null)
    out.push({ tone: 'warn', es: 'Discordancia de trazadores: ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻.', en: 'Tracer discordance: ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻.' })
  if (l.load)
    out.push({ tone: 'neutral', es: 'Hueso de carga, en seguimiento por Oncología Radioterápica.', en: 'Weight-bearing bone, under Radiation Oncology follow-up.' })
  if (l.scler)
    out.push({ tone: 'neutral', es: 'Morfología blástica (hueso denso).', en: 'Blastic morphology (dense bone).' })
  if (sourceOf(l) === 'ia-david')
    out.push({ tone: 'neutral', es: 'No consta en el informe oficial (medida aproximada sobre DICOM).', en: 'Not in the official report (approximate DICOM measurement).' })
  return out
}
function observationTone(tone: string): string {
  return tone === 'violet' ? GA_FILL : tone === 'warn' ? FDG_FILL : tone === 'positive' ? '#1f5a3a' : '#6b6470'
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
/* ── STRESS-TEST DE PESOS (P1 «el score es una HEURÍSTICA, no una verdad») ──
   Tres pesos editables —uno por factor— que el usuario mueve para VER cómo el
   orden de los focos cambia ante sus ojos. La honestidad es el movimiento: si
   mover los pesos reordena, el número es un CRITERIO, no una medida.
   El peso entra como EXPONENTE del factor (modelo multiplicativo): peso 1 = el
   factor cuenta como hoy; peso 0 = el factor se ignora (^0 = 1, neutro); peso 2
   = el factor pesa el doble. CLAVE: con los tres pesos = 1 (por defecto) el
   producto es idéntico al original (x^1 = x), así que el score y el orden NO
   cambian hasta que el usuario toca. NO es «ajusta hasta que salga lo que
   quieres»: el copy lo encuadra como demostración de arbitrariedad. */
const W_DEFAULT = { viable: 1, yield: 1, size: 1 } as const
const wViable = ref(W_DEFAULT.viable)
const wYield = ref(W_DEFAULT.yield)
const wSize = ref(W_DEFAULT.size)
/* ¿el usuario ha tocado los pesos? (para la etiqueta «pesos modificados» y el reset) */
const weightsDirty = computed(() =>
  wViable.value !== W_DEFAULT.viable || wYield.value !== W_DEFAULT.yield || wSize.value !== W_DEFAULT.size,
)
function resetWeights() {
  wViable.value = W_DEFAULT.viable
  wYield.value = W_DEFAULT.yield
  wSize.value = W_DEFAULT.size
}
/* factor^peso, clampado a [0,1] (x∈[0,1], peso≥0 ⇒ x^peso∈[0,1]; x=0,peso=0 ⇒ 1) */
function weighted(factor: number, w: number): number {
  return w === 1 ? factor : clamp01(Math.pow(clamp01(factor), w))
}
/* idoneidad compuesta 0-100 (orientativa). Producto de los tres factores de SEÑAL/forma,
   cada uno elevado a su PESO del stress-test (default 1 → comportamiento idéntico al
   original), × penalización por SBRT (tejido irradiado). La biopsia previa fallida (#13)
   NO penaliza el score: falló por muestrear la zona densa equivocada (técnica/diana), no
   porque el foco sea malo — su señal es real. El aviso «ya falló aquí → re-orientar a zona
   lítica» lo lleva la tarjeta/ficha, no el número. */
function suitabilityScore(le: Lesion): number {
  return Math.round(
    100
    * weighted(viableFactor(le), wViable.value)
    * weighted(yieldFactor(le), wYield.value)
    * weighted(sizeFactor(le), wSize.value)
    * (le.sbrt ? 0.4 : 1),
  )
}
/* (ficha resumen) «por qué» de UNA línea por foco — describe SEÑAL + FORMA, nunca
   «tumor/viable». Bloqueantes primero; si no, captación + rendimiento. Equipa, no indica. */
function whyOneLiner(le: Lesion): string {
  if (le.priorBiopsy) return L('Biopsia percutánea previa no diagnóstica (26B585) por muestreo de matriz esclerótica, no de la lesión; re-orientable a un subvolumen lítico distinto verificado en TC.', 'Prior percutaneous biopsy non-diagnostic (26B585) due to sampling of the sclerotic matrix, not the lesion; re-targetable to a different lytic subvolume verified on CT.')
  if (le.id === 7) return L('El tejido con mayor rendimiento es el componente de partes blandas epidural/intracanal — la viabilidad del acceso la valora radiología intervencionista.', 'The highest-yield tissue is the epidural/intracanal soft-tissue component — access feasibility is assessed by interventional radiology.')
  if (le.id === 16) return L('Hueso de carga (cuello femoral): la obtención de cores conlleva riesgo de fractura patológica.', 'Weight-bearing bone (femoral neck): core sampling carries pathologic-fracture risk.')
  if (isAiDavid(le)) return L('Detección por IA, no consignada en el informe radiológico — requiere validación previa.', 'AI-detected, not recorded in the radiology report — requires prior validation.')
  if (le.id === 15) return L('Señal posiblemente contaminada por captación fisiológica (vejiga/intestino) — requiere correlación.', 'Signal possibly contaminated by physiologic uptake (bladder/bowel) — requires correlation.')
  if (le.sbrt) return L('SBRT concurrente: tejido irradiado, potencialmente no representativo para el análisis molecular.', 'Concurrent SBRT: irradiated tissue, potentially non-representative for molecular analysis.')
  const t = trend(le)?.dir
  let cap: string
  if (le.fdg != null && le.fdg >= 8) cap = L('Hipermetabolismo glucolítico (¹⁸F-FDG SUVmáx ↑)', 'Glycolytic hypermetabolism (¹⁸F-FDG SUVmax ↑)')
  else if (t === 'new') cap = L('Foco glucolítico ¹⁸F-FDG de novo', 'De novo ¹⁸F-FDG glycolytic focus')
  else if (t === 'up') cap = L('¹⁸F-FDG SUVmáx en aumento interestudio', 'Inter-study rise in ¹⁸F-FDG SUVmax')
  else if (le.dota != null && le.dota >= 10 && (le.fdg == null || le.fdg < le.dota)) cap = L('Alta densidad de receptores de somatostatina (⁶⁸Ga-DOTATOC SUVmáx ↑)', 'High somatostatin-receptor density (⁶⁸Ga-DOTATOC SUVmax ↑)')
  else if (le.fdg != null && le.dota == null) cap = L('Discordancia de trazadores: ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻', 'Tracer discordance: ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻')
  else if (le.fdg != null && le.dota != null) cap = L('Captación dual moderada (¹⁸F-FDG y ⁶⁸Ga-DOTATOC)', 'Moderate dual uptake (¹⁸F-FDG and ⁶⁸Ga-DOTATOC)')
  else cap = L('Captación baja, ⁶⁸Ga-DOTATOC predominante', 'Low uptake, ⁶⁸Ga-DOTATOC-predominant')
  const m = morphCat(le)
  const yld = m === 'lítica' ? L('atenuación lítica en TC, estimación orientativa (heurística) de rendimiento: favorable', 'lytic CT attenuation, indicative (heuristic) yield estimate: favorable')
    : m === 'mixta' ? L('atenuación TC mixta (lítica/esclerótica)', 'mixed CT attenuation (lytic/sclerotic)')
    : m === 'blástica' ? L('atenuación esclerótica/blástica en TC, estimación orientativa (heurística) de rendimiento: bajo', 'sclerotic/blastic CT attenuation, indicative (heuristic) yield estimate: low')
    : L('morfología por confirmar en TC', 'CT morphology to be confirmed')
  return cap + ' · ' + yld + '.'
}
/* palabra corta de forma (para las mini-barras de rendimiento) */
function morphShort(le: Lesion): string {
  const m = morphCat(le)
  if (m === 'lítica') return L('lítico · rendimiento estimado favorable (heurístico)', 'lytic · estimated favorable yield (heuristic)')
  if (m === 'mixta') return L('mixto', 'mixed')
  if (m === 'blástica') return L('esclerótico/blástico · rendimiento estimado bajo (heurístico)', 'sclerotic/blastic · estimated low yield (heuristic)')
  return L('morfología s/c', 'morphology n/c')
}
/* OFRECER, NO CONDICIONAR (matiz de Miriam): el orden POR DEFECTO es un HECHO NEUTRO
   — el nivel anatómico (id, de craneal a caudal) —, no un ranking-veredicto, para que
   nadie (ni el lector lego/público) abra con un orden que se lea como conclusión. La
   idoneidad es una LENTE OPT-IN: el usuario la ACTIVA y entonces reordena por score
   (estimación heurística orientativa, no validada). La predicción NO se borra: cambia
   cuándo gobierna el orden. */
const orderByIdoneidad = ref(false)
function neutralOrder(rows: Lesion[]): Lesion[] {
  return [...rows].sort((a, b) => a.id - b.id)
}
function suitabilityOrder(rows: Lesion[]): Lesion[] {
  return [...rows].sort((a, b) => suitabilityScore(b) - suitabilityScore(a) || a.id - b.id)
}
/* candidatos CONFIRMADOS (los focos del informe). Orden por defecto = nivel anatómico
   (neutro); con la lente activada, por idoneidad heurística. Los detectados por IA quedan
   fuera del orden → lista aparte, marcados. */
const rankedFoci = computed(() =>
  orderByIdoneidad.value ? suitabilityOrder(confirmedFoci.value) : neutralOrder(confirmedFoci.value),
)
/* focos detectados por IA (por confirmar): candidatos sí, peso real no */
const aiCandidates = computed(() =>
  orderByIdoneidad.value ? suitabilityOrder(aiFoci.value) : neutralOrder(aiFoci.value),
)
/* las 3 dianas que la lente heurística sitúa mejor (SIEMPRE por idoneidad, es su función:
   ofrecer la orientación; no depende de que el orden general esté activado). */
const topByIdoneidad = computed(() => suitabilityOrder(confirmedFoci.value).slice(0, 3))
/* (ficha resumen) los 19 en el ORDEN POR DEFECTO (nivel anatómico; idoneidad si la lente
   está activada) — confirmados primero, IA al final — para el grid de fichas-resumen «de
   un vistazo». No se filtra (la galería nunca se filtra). */
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
/* LISTA DE LA TABLA con linking de estado: el filtro de fenotipo/tiempo NO oculta
   — la fila no coincidente se queda en su sitio y se ATENÚA (focoOpacity), igual
   que el marcador del esqueleto y el punto del scatter. La BÚSQUEDA por texto sí
   oculta (es una consulta del usuario, no el filtro compartido). Así las 3 vistas
   muestran el MISMO conjunto y el filtro las modula de forma coherente. */
const tableFocusList = computed<Lesion[]>(() => {
  const q = normTxt(focoQuery.value.trim())
  if (!q) return focusListItems.value
  return focusListItems.value.filter((le) => normTxt(le.level[lang.value] + ' ' + le.region[lang.value]).includes(q))
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

/* ════════════════════════════════════════════════════════════════════════
   (A · a11y · la casa exige a11y-prevails) NAVEGACIÓN POR TECLADO del
   navegador de focos (esqueleto SVG · lista · scatter). Un solo modelo de
   teclas para los tres, sobre la MISMA lista ordenada (visibleFocusList),
   sin romper el clic/tap (pick/pickAndShow/selected siguen igual).
     · ↑/← y ↓/→  → foco anterior / siguiente (envuelve por los extremos)
     · Home/End   → primer / último foco
     · Enter/Espacio → confirma (selecciona el foco con foco de teclado)
     · escribir un número (1, 1→9, …) → salta a ese id de foco
   Anuncio discreto a lector de pantalla (aria-live polite) al cambiar.
   ════════════════════════════════════════════════════════════════════════ */
/* anuncio vivo para lector de pantalla: «Foco N de M · localización · fenotipo». */
const focoAnnounce = ref('')
function announceFoco(le: Lesion) {
  const pos = visibleFocusList.value.findIndex((l) => l.id === le.id) + 1
  const total = visibleFocusList.value.length
  const ai = sourceOf(le) === 'ia-david' ? ` · ${L('detectado por IA, por confirmar', 'AI-detected, to confirm')}` : ''
  focoAnnounce.value = `${L('Foco', 'Focus')} ${pos} ${L('de', 'of')} ${total} · ${le.level[lang.value]} · ${phenoLabel(le)}${ai}`
}
watch(selected, () => { const le = LES.find((l) => l.id === selected.value); if (le) announceFoco(le) })

/* buffer para «escribir un número y saltar» (p. ej. 1 → espera al 2 → #12). Se
   limpia tras una pausa; si el id no existe aún, espera al siguiente dígito. */
let typeBuf = ''
let typeTimer: ReturnType<typeof setTimeout> | null = null
function jumpToTypedDigit(digit: string) {
  typeBuf += digit
  if (typeTimer) clearTimeout(typeTimer)
  // si el buffer ya es un id visible, salta; si un id más largo empieza por él, espera
  const buf = parseInt(typeBuf, 10)
  const inList = (id: number) => visibleFocusList.value.some((l) => l.id === id)
  const couldExtend = visibleFocusList.value.some((l) => String(l.id).startsWith(typeBuf) && String(l.id) !== typeBuf)
  if (inList(buf) && !couldExtend) { pick(buf); typeBuf = '' }
  else if (inList(buf)) { pick(buf) } // salta ya; el siguiente dígito puede refinar
  typeTimer = setTimeout(() => { typeBuf = '' }, 900)
}
/* manejador único de teclado del navegador de focos. preventDefault solo para
   las teclas que gobernamos (no secuestra Tab ni el resto). */
function onFocoNavKey(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  // no secuestrar el teclado de los controles de formulario del propio navegador
  // (buscador de focos, slider de tiempo): allí las flechas/dígitos son suyos.
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
  const k = e.key
  let nav = true
  if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); pickStep(1) }
  else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); pickStep(-1) }
  else if (k === 'Home') { e.preventDefault(); const l = visibleFocusList.value[0]; if (l) pick(l.id) }
  else if (k === 'End') { e.preventDefault(); const l = visibleFocusList.value[visibleFocusList.value.length - 1]; if (l) pick(l.id) }
  else if (/^[0-9]$/.test(k)) { e.preventDefault(); jumpToTypedDigit(k) }
  // Enter/Espacio NO los gobierna el contenedor: los maneja cada option (en el
  // esqueleto/lista = fijar; en el scatter = abrir su ficha), así cada modo
  // conserva su acción de confirmación propia.
  else nav = false
  // el foco DOM sigue a la navegación (roving tabindex): el anillo de foco
  // se ve sobre el marcador recién seleccionado, no en el de partida.
  if (nav) focusActiveOption()
}

/* roving tabindex · registro de los <circle> option del esqueleto + de la lista,
   para mover el FOCO DOM al marcador recién seleccionado (que el foco visible
   siga a la navegación por teclado). Mapa por id del foco PRIMARIO del grupo. */
const skOptEls = new Map<number, Element>()
function registerSkOpt(id: number, el: unknown) {
  if (el) skOptEls.set(id, el as Element)
  else skOptEls.delete(id)
}
const listOptEls = new Map<number, HTMLElement>()
function registerListOpt(id: number, el: unknown) {
  if (el) listOptEls.set(id, el as HTMLElement)
  else listOptEls.delete(id)
}
/* tras un cambio de selección POR TECLADO, lleva el foco DOM al option activo del
   modo visible (esqueleto o lista). Solo si el foco estaba ya dentro del navegador
   (no robamos el foco al hacer clic en otra parte ni al cargar). */
function focusActiveOption() {
  if (!import.meta.client) return
  const active = document.activeElement
  const insideNav = active && (skOptEls.has(idOfEl(active)) || listOptEls.has(idOfEl(active)) || (active instanceof HTMLElement && active.closest('[data-foco-nav]')))
  if (!insideNav) return
  nextTick(() => {
    const grp = GROUPS.find((g) => g.foci.some((l) => l.id === selected.value))
    const target = (navMode.value === 'table'
      ? listOptEls.get(selected.value)
      : (grp ? skOptEls.get(grp.primary.id) : undefined)) as (HTMLElement | SVGElement | undefined)
    target?.focus?.()
  })
}
function idOfEl(el: Element | null): number {
  if (!el) return -1
  const m = (el.id || '').match(/-(\d+)$/)
  return m ? parseInt(m[1], 10) : -1
}

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
const topCandidates = computed(() => topByIdoneidad.value)

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

/* ══════════════════════════════════════════════════════════════════ */
/*  EXPORT DEL MANIFIESTO · CSV + JSON, client-side (Blob + download).    */
/*  Compatible con `nuxt generate` (no toca servidor). Sale el manifiesto */
/*  completo: los 19 focos con sus valores Y su procedencia campo a campo */
/*  (medido vs interpretado). Anti-PHI: solo ids #1–19, cero metadatos    */
/*  de paciente. El JSON incluye el ESQUEMA (el contrato clonable).       */
/* ══════════════════════════════════════════════════════════════════ */
/* esquema legible que viaja DENTRO del JSON — el contrato que un equipo clona */
const MANIFEST_SCHEMA = {
  version: '1.0',
  modelo: 'cBioPortal/OncoKB — el dato Y su nivel de evidencia son la base',
  antiPhi: 'ids sintéticos #1–19; sin nombre, nº de historia ni metadatos de paciente',
  celda: {
    valor: 'number | string | null',
    unidad: "'SUVmáx' | 'mm' | 'ml' | 'HU' | '0-100' | ''",
    fecha: 'ISO del estudio de origen ("" si no aplica)',
    trazador: "'18F-FDG' | '68Ga-DOTATOC' | ''",
    fuente: "'informe' | 'dicom-medicion-david' | 'rmn-literal' | 'derivado' | 'aproximado'",
    ref: 'referencia opcional (código de biopsia, nota)',
    medido: 'true = MEDIDO (cantidad física) · false = INTERPRETADO (lectura/regla)',
  },
  fuentes: {
    informe: 'informe oficial de Medicina Nuclear (H. Virgen de la Arrixaca)',
    'dicom-medicion-david': 're-cuantificación asistida sobre el DICOM nativo (verificación, no diagnóstico)',
    'rmn-literal': 'texto literal del informe de RMN de columna (11/06/2026)',
    derivado: 'calculado por la página (heurístico/regla: score, fenotipo, Δ)',
    aproximado: 'estimación sobre el DICOM de un foco NO consignado en el informe (IA #17/#18/#19), por confirmar',
  },
  estudios: STUDY_DATES,
} as const

/* construye las filas del manifiesto (una por foco) reuniendo Lesion + sus celdas
   de procedencia. Es la fuente única: la tabla y el export beben de aquí. */
function manifestRows() {
  return LES.map((le) => ({
    id: le.id,
    localizacion: le.level.es,
    region: le.region.es,
    lado: le.side,
    campos: manifestCells(le),
  }))
}

const MANIFEST_FIELDS = ['dota', 'fdg', 'fdgPrev', 'gaAuto', 'fdgAuto', 'extentMm', 'mtvMl', 'morfologia', 'fenotipo', 'partesBlandas', 'idoneidad'] as const

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/* CSV LARGO (tidy): una fila por (foco × campo), con valor + procedencia completa.
   Es el formato que un analista carga sin ambigüedad (cada cifra trazable). */
function buildManifestCsv(): string {
  const header = ['foco_id', 'localizacion', 'region', 'lado', 'campo', 'valor', 'unidad', 'trazador', 'fecha', 'fuente', 'medido', 'ref']
  const lines = [header.join(',')]
  for (const row of manifestRows()) {
    for (const f of MANIFEST_FIELDS) {
      const c = row.campos[f]
      if (!c) continue
      lines.push([
        row.id, csvEscape(row.localizacion), csvEscape(row.region), row.lado,
        f, csvEscape(c.valor), csvEscape(c.unidad), csvEscape(c.trazador || ''),
        csvEscape(c.fecha || ''), c.fuente, c.medido ? 'medido' : 'interpretado', csvEscape(c.ref || ''),
      ].join(','))
    }
  }
  return lines.join('\n')
}

function buildManifestJson(): string {
  return JSON.stringify({
    esquema: MANIFEST_SCHEMA,
    focos: manifestRows(),
  }, null, 2)
}

function downloadBlob(text: string, filename: string, mime: string) {
  if (!import.meta.client) return
  const blob = new Blob([text], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
function downloadManifestCsv() { downloadBlob(buildManifestCsv(), 'mapa-metastasis-manifiesto.csv', 'text/csv') }
function downloadManifestJson() { downloadBlob(buildManifestJson(), 'mapa-metastasis-manifiesto.json', 'application/json') }

/* ── NOTA DE VALIDACIÓN (honesta, sin sobre-prometer) ─────────────────
   El manifiesto NO recalcula los SUV: deriva de los MISMOS valores que
   alimentan toda la página (LES/AUTO/SIZE). Por tanto reproduce, por
   construcción, los números que se muestran arriba. Este check de build
   verifica esa identidad (manifiesto ⇄ tabla) y que el conteo cuadre. */
const manifestValidated = (() => {
  const rows = manifestRows()
  const okCount = rows.length === LES.length // 19 focos exactos
  // cada SUVmáx del manifiesto = el SUVmáx de la tabla (misma fuente, sin deriva)
  const okSuv = rows.every((r) => {
    const le = LES.find((l) => l.id === r.id)!
    return r.campos.dota.valor === le.dota && r.campos.fdg.valor === le.fdg && r.campos.idoneidad.valor === suitabilityScore(le)
  })
  // medido vs interpretado fiel: SUVmáx/mm/ml = medido; morfología/score/fenotipo = interpretado
  const okMI = rows.every((r) =>
    r.campos.dota.medido && r.campos.fdg.medido && r.campos.extentMm.medido &&
    !r.campos.morfologia.medido && !r.campos.idoneidad.medido && !r.campos.fenotipo.medido,
  )
  const ok = okCount && okSuv && okMI
  if (import.meta.dev && !ok) console.warn('[mapa-metastasis] manifiesto NO reproduce la tabla', { okCount, okSuv, okMI })
  return ok
})()
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
            'Cada lesión ósea, vista con doble trazador PET a la vez: ⁶⁸Ga-DOTATOC (densidad de receptores de somatostatina, SSTR) y ¹⁸F-FDG (metabolismo glucolítico). Una herramienta para que el equipo compare los focos, lesión a lesión, como candidatos a diana de rebiopsia — equipa, no indica.',
            'Every bone lesion, seen with dual-tracer PET at once: ⁶⁸Ga-DOTATOC (somatostatin-receptor density, SSTR) and ¹⁸F-FDG (glycolytic metabolism). A tool for the team to compare the foci, lesion by lesion, as rebiopsy-target candidates — it equips, it does not indicate.')"
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
              'Esta página reúne y visualiza los estudios propios de Miriam (PET-CT ¹⁸F-FDG 24/03/2026, PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 y la RMN de columna cervical y dorsal). Los SUV son los de los informes oficiales del PET; las imágenes (PET y RMN) se reconstruyeron desde los DICOM. La RMN se muestra para verla: su lectura formal corresponde al radiólogo.',
              'This page gathers and visualizes Miriam’s own studies (¹⁸F-FDG PET-CT 24/03/2026, ⁶⁸Ga-DOTATOC PET-CT 26/05/2026 and the cervical and thoracic spine MRI). SUVs are those of the official PET reports; the images (PET and MRI) were reconstructed from the DICOM. The MRI is shown for viewing: its formal reading belongs to the radiologist.') }}
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
          <h2 id="contexto-general" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">{{ L('Enfermedad ósea — el caso de un vistazo', 'Bone disease — the case at a glance') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">{{ L('Cuánta enfermedad hay y cómo evoluciona, antes de entrar foco a foco.', 'How much disease there is and how it is evolving, before going focus by focus.') }}</p>
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
              <div class="stat-readout__label" :style="{ color: GA_TEXT }">{{ L('SUVmáx ⁶⁸Ga-DOTATOC', '⁶⁸Ga-DOTATOC SUVmax') }}</div>
              <div class="stat-readout__value tabular-nums" :style="{ color: GA_TEXT }">{{ dotaRangeLabel }}</div>
              <div class="stat-readout__unit">{{ L('rango SSTR (informe)', 'SSTR range (report)') }}</div>
            </div>
            <div class="stat-readout">
              <div class="stat-readout__label" :style="{ color: FDG_TEXT }">{{ L('SUVmáx ¹⁸F-FDG', '¹⁸F-FDG SUVmax') }}</div>
              <div class="stat-readout__value tabular-nums" :style="{ color: FDG_TEXT }">{{ fdgRangeLabel }}</div>
              <div class="stat-readout__unit">{{ L('rango glucolítico (informe)', 'glycolytic range (report)') }}</div>
            </div>
          </div>
          <!-- (auditoría) evolución condensada a UNA línea aquí (panorama); el detalle de los
               4 KPIs + el matiz «solo FDG, sin previo de Galio» viven en la sección «trayectoria»
               (antes se duplicaba el mismo grid en los dos sitios). -->
          <p class="text-sm text-tinta mt-1 leading-relaxed max-w-3xl">
            <span class="eyebrow--sm text-berenjena mr-1">{{ L('Evolución (¹⁸F-FDG)', 'Evolution (¹⁸F-FDG)') }}</span>{{ L((trajectory.up + trajectory.neu) + ' focos con captación glucolítica al alza (incl. ' + trajectory.neu + ' nuevos), ' + trajectory.down + ' a la baja, ' + trajectory.stable + ' estables — solo ¹⁸F-FDG (ene→mar 2026). ', (trajectory.up + trajectory.neu) + ' foci with rising glycolytic uptake (incl. ' + trajectory.neu + ' new), ' + trajectory.down + ' falling, ' + trajectory.stable + ' stable — ¹⁸F-FDG only (Jan→Mar 2026). ') }}<a href="#trayectoria" class="link-action text-miriam font-semibold whitespace-nowrap">{{ L('Ver la trayectoria ↓', 'See the trajectory ↓') }}</a>
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
              <p class="eyebrow mb-2 block">{{ L('Una orientación para empezar · dónde mirar', 'An orientation to start · where to look') }}</p>
              <h2 id="dianas-resumen" class="heading-display text-2xl text-berenjena scroll-mt-[5.5rem]">{{ L('Dianas que la lente heurística sitúa mejor', 'Targets the heuristic lens places best') }}</h2>
            </div>
            <span class="status-badge status-badge--firma self-start mt-1">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
          </div>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L('Una orientación heurística (estimación orientativa, no validada) que EQUIPA al equipo médico: los focos que la lente sitúa mejor como diana por las señales de imagen — captación (FDG/Ga), rendimiento del tejido y tamaño. Toca uno para verlo en el navegador y en 3D, justo abajo. Ayuda a sopesar; el equipo decide qué biopsiar.',
                  'A heuristic orientation (an indicative estimate, not validated) that EQUIPS the medical team: the foci the lens places best as a target by the imaging signals — tracer uptake (FDG/Ga), tissue yield and size. Tap one to see it in the navigator and in 3D, right below. It helps to weigh; the team decides what to biopsy.') }}
          </p>
          <div class="grid sm:grid-cols-3 gap-3">
            <button v-for="le in topCandidates" :key="le.id" type="button"
              @click="pickAndShow(le.id)"
              :aria-pressed="selected === le.id"
              class="foco-card text-left rounded-card border-2 px-3.5 py-3 flex flex-col items-stretch justify-start"
              :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.14)] bg-cream-card hover:border-[#9d44ab]'">
              <span v-if="focoKey(le).hasReliable" class="block rounded-lg overflow-hidden mb-2 bg-[#0d1117]" style="aspect-ratio:16/10"><img :src="fk(le.id, 'axial')" :alt="L('Imagen clave del foco #' + le.id, 'Key image of focus #' + le.id)" class="w-full h-full object-cover" loading="lazy" /></span>
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="w-3 h-3 shrink-0 rounded-full" :style="{ background: phenoColor(le), boxShadow: sourceOf(le) === 'ia-david' ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(le) : 'none' }" aria-hidden="true" />
                  <span class="font-semibold text-berenjena text-[13px] leading-tight truncate">{{ le.level[lang] }}</span>
                  <span class="font-mono text-[10px] text-tinta shrink-0">#{{ le.id }}</span>
                  <span v-if="coCount(le) > 1" class="pill-data pill-data--berenjena !text-[10px] !px-1.5 !py-0 shrink-0" role="img" :aria-label="coCount(le) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(le) }} {{ L('focos', 'foci') }}</span>
                </span>
                <span class="text-right shrink-0">
                  <span class="font-display text-xl text-berenjena tabular-nums leading-none block">{{ suitabilityScore(le) }}</span>
                  <span class="eyebrow--sm">{{ L('idoneidad', 'suitability') }}</span>
                </span>
              </div>
              <p class="text-[10.5px] text-tinta leading-snug mt-1.5"><span class="font-mono">¹⁸F-FDG {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · ⁶⁸Ga {{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span> · {{ morphShort(le) }}</p>
              <p class="text-[11px] text-tinta leading-snug mt-1"><span class="font-bold" :style="{ color: dianaMk(le).color }">{{ dianaMk(le).mk }}</span> <span class="font-semibold text-berenjena">{{ L('Diana', 'Target') }}:</span> {{ BIOPSY[le.id]?.zone[lang] }}</p>
              <p class="text-[11px] text-tinta leading-snug italic mt-0.5">«{{ whyOneLiner(le) }}»</p>
              <!-- aviso PROMINENTE si una biopsia ya falló aquí (no repetir el error de diana) -->
              <div v-if="le.priorBiopsy" class="mt-2 rounded-card px-2 py-1 text-[10px] font-semibold leading-snug flex items-start gap-1" :style="{ background: '#f6d9b8', color: '#8a4a1a' }">
                <span aria-hidden="true">⚑</span><span>{{ L('Biopsia previa no diagnóstica en este foco (26B585): solo hueso y músculo, sin tejido tumoral', 'Prior non-diagnostic biopsy at this focus (26B585): bone and muscle only, no tumor tissue') }}</span>
              </div>
              <div v-if="hasSoftTissue(le)" class="mt-1.5 flex flex-wrap gap-1">
                <span class="pill-data !px-1.5 !py-0 !text-[10px]" :style="{ background: 'rgba(31,107,87,0.12)', color: '#1f6b57' }">{{ L('+ partes blandas (RMN)', '+ soft tissue (MRI)') }}</span>
              </div>
            </button>
          </div>
          <div class="mt-2.5 flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
            <p class="text-[11px] text-tinta leading-snug max-w-xl">{{ L('Un resumen para empezar; toca una diana para abrirla en el navegador de abajo.', 'A summary to start; tap a target to open it in the navigator below.') }}</p>
            <a href="#idoneidad" @click="jumpToIdoneidad" class="link-action text-miriam text-[12.5px] inline-flex items-center gap-1 font-semibold shrink-0">
              {{ L('Ver cómo se calcula · lista completa', 'See how it is computed · full list') }} <span aria-hidden="true">↓</span>
            </a>
          </div>

          <!-- (BIOPSIA · por qué el ilíaco y no el fémur) — explica el cambio de criterio
               (señal cruda → mejor tejido del clon adecuado, de forma segura), para que no parezca arbitrario. -->
          <details class="alert-callout mt-5 leading-relaxed">
            <summary class="cursor-pointer font-semibold">{{ L('Criterios de selección de dianas para caracterización molecular (y la salvedad del cuello femoral)', 'Target-selection criteria for molecular characterization (and the femoral-neck caveat)') }}</summary>
            <p class="mt-2">{{ L('El criterio orientativo no es el SUVmáx más alto, sino el subvolumen con mayor probabilidad de aportar celularidad tumoral viable representativa —con integridad de ARN suficiente (DV200) para WES + RNA-seq— mediante un abordaje percutáneo TC-guiado de riesgo aceptable. Bajo este criterio heurístico (estimación orientativa, no validada), el equipo podría sopesar el ilíaco supra-acetabular (#14): ¹⁸F-FDG en aumento, atenuación TC no esclerótica y corredor posterolateral accesible; y, según el clon a caracterizar, también el pedículo L1 (#10), discordante ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻. El cuello femoral (#16) tiene el ¹⁸F-FDG más alto y podría tener interés biológico, pero asienta en hueso de carga: los cores conllevan riesgo de fractura patológica, cuya indicación valoran Oncología Radioterápica/Ortopedia; se documenta como consideración, no exclusión. El L5 (#11) recibe SBRT concurrente: el tejido irradiado puede no ser representativo. Esto orienta, no decide: la selección final de la diana corresponde al comité; salvedades de cuantificación en «Fuentes, método y salvedades».', 'The indicative criterion is not the highest SUVmax, but the subvolume most likely to provide representative viable tumor cellularity — with RNA integrity sufficient (DV200) for WES + RNA-seq — via a CT-guided percutaneous approach of acceptable risk. Under this heuristic criterion (an indicative estimate, not validated), the team could weigh the supra-acetabular iliac (#14): rising ¹⁸F-FDG, non-sclerotic CT attenuation and an accessible posterolateral corridor; and, depending on the clone to be characterized, also the L1 pedicle (#10), discordant ¹⁸F-FDG⁺ / ⁶⁸Ga-DOTATOC⁻. The femoral neck (#16) has the highest ¹⁸F-FDG and may be of biological interest, but lies in weight-bearing bone: core sampling carries pathologic-fracture risk, whose indication is assessed by Radiation Oncology/Orthopedics; documented as a consideration, not an exclusion. L5 (#11) is on concurrent SBRT: irradiated tissue may not be representative. This orients, it does not decide: final target selection rests with the tumor board; quantification caveats in “Sources, method and caveats”.') }}</p>
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
          <h2 id="mapa" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">
            {{ L('El mapa, lesión a lesión', 'The map, lesion by lesion') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L('Elige un foco —en el esqueleto o en la tabla— y, sin moverte, cambian al instante el resumen y el hueso en 3D. El color recorre el eje de discordancia, del violeta (SSTR-dominante, ⁶⁸Ga⁺/FDG⁻) al coral (glucolítico-dominante, FDG⁺/SSTR⁻); el número es el id del foco. El esqueleto es un esquema orientativo; la tabla, una lista compacta y ordenable.',
                  'Pick a focus —on the skeleton or in the table— and, without moving, the summary and the 3D bone update instantly. Colour runs along the discordance axis, from violet (SSTR-dominant, ⁶⁸Ga⁺/FDG⁻) to coral (glycolytic-dominant, FDG⁺/SSTR⁻); the number is the focus id. The skeleton is a schematic guide; the table, a compact, sortable list.') }}
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
                 paciente prefería el sticky simple, sin barra de scroll en el navegador.)
                 (A · a11y) @keydown gobierna la navegación por teclado de los focos
                 (↑/↓/←/→, Home/End, escribir un número) para los TRES modos a la vez,
                 sin secuestrar Tab; las teclas se manejan cuando el foco está en un
                 marcador/option del navegador. -->
            <div class="lg:sticky lg:top-24" @keydown="onFocoNavKey">

            <!-- (A · a11y) ANUNCIO VIVO para lector de pantalla: al cambiar de foco
                 (teclado, clic o flechas) describe «Foco N de M · localización ·
                 fenotipo». aria-live polite + sr-only: no se ve, no rompe el layout. -->
            <p class="sr-only" aria-live="polite" role="status">{{ focoAnnounce }}</p>

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
                  class="nav-step w-8 h-8 rounded-full border border-[rgba(45,27,61,0.2)] flex items-center justify-center hover:border-[rgba(45,27,61,0.45)] hover:text-berenjena"
                  :aria-label="L('Foco anterior', 'Previous focus')">‹</button>
                <span class="font-mono text-[11px] tabular-nums w-11 text-center select-none">{{ focoPos || '–' }}<span class="text-[10px] text-tinta">/{{ visibleFocusList.length }}</span></span>
                <button type="button" @click="pickStep(1)"
                  class="nav-step w-8 h-8 rounded-full border border-[rgba(45,27,61,0.2)] flex items-center justify-center hover:border-[rgba(45,27,61,0.45)] hover:text-berenjena"
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
              <!-- (A · a11y) el conjunto de marcadores es un LISTBOX de focos:
                   role=listbox + cada marcador role=option + roving tabindex (solo
                   el seleccionado entra en el tab order; las flechas mueven la
                   selección Y el foco DOM). aria-activedescendant apunta al option
                   activo. La tabla de valores es su alternativa textual (describedby). -->
              <svg viewBox="0 0 440 700" class="w-full" role="listbox"
                :aria-label="L('Esquema del esqueleto con las lesiones (flechas para recorrer, Intro/Espacio para fijar, o escribe un número de foco)', 'Skeleton schematic with the lesions (arrows to step, Enter/Space to set, or type a focus number)')"
                :aria-activedescendant="'sk-opt-' + selected"
                aria-describedby="tabla-focos-alt">
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
                <!-- linking de estado: el FILTRO atenúa (no oculta) → el grupo no
                     coincidente se queda en su sitio con baja opacidad (gOpacity);
                     un foco con hover en CUALQUIER vista resalta aquí su grupo. -->
                <g v-for="g in GROUPS" :key="g.key" class="sk-foco" :style="{ opacity: gOpacity(g) * (gPresentAt(g, frame) ? 1 : 0.4) }">
                  <!-- ÁREA TÁCTIL invisible (≈ 24px en pantalla a móvil): el marcador visible
                       se mantiene UNIFORME y pequeño (no se aprietan los focos), pero el dedo
                       acierta gracias a este círculo transparente. aria-hidden: la
                       accesibilidad (foco/teclado/aria) la lleva el círculo visible de abajo. -->
                  <circle
                    :cx="g.x" :cy="g.y" :r="SK_HIT"
                    fill="transparent" class="cursor-pointer" aria-hidden="true"
                    @click="pickGroup(g)"
                    @mouseenter="canHoverFine() && (showTip($event, groupTipText(g)), setHoverGroup(g))" @mouseleave="hideTip(); clearHover()" />
                  <circle
                    :id="'sk-opt-' + g.primary.id"
                    :ref="(el) => registerSkOpt(g.primary.id, el)"
                    :cx="g.x" :cy="g.y"
                    :r="SK_R + (gSelected(g) ? 2.5 : (gHovered(g) ? 1.5 : 0))"
                    :fill="gPresentAt(g, frame) ? phenoColor(g.primary) : 'none'"
                    :stroke="gSelected(g) ? '#2d1b3d' : (gHovered(g) ? '#9d44ab' : (gPresentAt(g, frame) ? '#ffffff' : phenoColor(g.primary)))"
                    :stroke-width="gSelected(g) ? 2.5 : (gHovered(g) ? 2.2 : 1.4)"
                    :stroke-dasharray="sourceOf(g.primary) === 'ia-david' ? '2 1.6' : undefined"
                    class="cursor-pointer sk-marker"
                    :tabindex="gSelected(g) ? 0 : -1" role="option" :aria-selected="gSelected(g)"
                    :aria-label="g.multi ? `${g.foci[0].level[lang]} — ${g.foci.length} ${L('focos', 'foci')}` : `${g.primary.level[lang]} — ${phenoLabel(g.primary)}`"
                    @click="pickGroup(g)"
                    @mouseenter="canHoverFine() && (showTip($event, groupTipText(g)), setHoverGroup(g))" @mouseleave="hideTip(); clearHover()" @focus="showTip($event, groupTipText(g)); setHoverGroup(g)" @blur="hideTip(); clearHover()" @keydown.escape="hideTip" />
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
                <div class="h-2.5 rounded-full" :style="{ background: PHENO_RAMP_CSS }" />
                <div class="flex justify-between text-[10px] text-tinta mt-1">
                  <span>{{ L('SSTR-dominante (⁶⁸Ga⁺/FDG⁻)', 'SSTR-dominant (⁶⁸Ga⁺/FDG⁻)') }}</span>
                  <span>{{ L('Glucolítico-dom. (FDG⁺/SSTR⁻)', 'Glycolytic-dom. (FDG⁺/SSTR⁻)') }}</span>
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
                    class="filter-chip inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border"
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
                    class="tl-play shrink-0 w-9 h-9 rounded-full bg-berenjena text-cream flex items-center justify-center text-[12px] hover:opacity-90 transition-opacity"
                    :aria-label="playing ? L('Pausar', 'Pause') : L('Recorrer los estudios', 'Step through the studies')">
                    {{ playing ? '❚❚' : '▶' }}
                  </button>
                  <div class="font-display text-lg text-berenjena w-[4.5rem] tabular-nums leading-none">{{ dateLabel }}</div>
                  <input type="range" min="0" max="2" step="1" :value="frame"
                    @input="setFrame(+($event.target as HTMLInputElement).value)"
                    class="tl-range flex-1 min-w-[110px] accent-berenjena"
                    :aria-label="L('Recorrer los estudios PET (¹⁸F-FDG ene→mar · ⁶⁸Ga-DOTATOC may)', 'Step through the PET studies (¹⁸F-FDG Jan→Mar · ⁶⁸Ga-DOTATOC May)')" />
                </div>
                <div class="flex justify-between mt-2 px-0.5">
                  <button v-for="(d, i) in FDATES" :key="i" type="button" @click="setFrame(i)"
                    class="tl-date text-[10px] font-mono tabular-nums px-1.5 py-1 rounded"
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
              <!-- (A · a11y) la lista de focos es un LISTBOX: role=listbox + cada
                   botón role=option con roving tabindex (solo el seleccionado es
                   tabbable). Las flechas/Home/End/número los gobierna onFocoNavKey
                   del navegador; aria-activedescendant + la tabla como alternativa. -->
              <ul data-foco-list data-foco-nav role="listbox"
                :aria-label="L('Focos — flechas para recorrer, Intro para fijar, o escribe un número', 'Foci — arrows to step, Enter to set, or type a number')"
                :aria-activedescendant="'list-opt-' + selected"
                aria-describedby="tabla-focos-alt"
                class="space-y-1 overflow-y-auto pr-0.5" style="max-height:600px">
                <li v-if="!tableFocusList.length" class="px-2 py-3 text-[11px] text-tinta text-center" role="presentation">{{ L('Sin focos que coincidan.', 'No matching foci.') }}</li>
                <!-- linking de estado: el FILTRO atenúa (no oculta) → la fila no
                     coincidente se queda con baja opacidad (focoOpacity) en vez de
                     desaparecer; un foco con hover en CUALQUIER vista resalta su fila. -->
                <li v-for="le in tableFocusList" :key="le.id" role="presentation" class="list-foco" :style="{ opacity: focoOpacity(le) }">
                  <button type="button" @click="pick(le.id)"
                    :id="'list-opt-' + le.id"
                    :ref="(el) => registerListOpt(le.id, el)"
                    role="option"
                    :tabindex="le.id === selected ? 0 : -1"
                    @mouseenter="setHover(le.id)" @mouseleave="clearHover()" @focus="setHover(le.id)" @blur="clearHover()"
                    class="foco-card w-full text-left rounded-card border px-2 py-1.5 flex items-center gap-2"
                    :class="le.id === selected ? 'border-berenjena bg-[rgba(45,27,61,0.05)]' : (focoHovered(le) ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.05)]' : 'border-transparent hover:bg-[rgba(45,27,61,0.035)]')"
                    :aria-selected="le.id === selected"
                    :aria-label="`#${le.id} ${le.level[lang]} — ${phenoLabel(le)}`">
                    <span class="shrink-0 w-3 h-3 rounded-full" :style="{ background: phenoColor(le), boxShadow: sourceOf(le) === 'ia-david' ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(le) : 'none' }" aria-hidden="true" />
                    <span class="min-w-0 flex-1">
                      <span class="flex items-center gap-1.5"><span class="text-[12px] font-semibold text-berenjena leading-tight truncate">{{ le.level[lang] }}</span><span class="font-mono text-[10px] text-tinta shrink-0">#{{ le.id }}</span><span v-if="coCount(le) > 1" class="pill-data pill-data--berenjena !text-[10px] !px-1.5 !py-0 shrink-0" role="img" :aria-label="coCount(le) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(le) }}</span></span>
                      <span class="flex flex-wrap items-center gap-1 mt-0.5">
                        <span v-if="le.dota != null" class="inline-flex items-center text-[10px] font-semibold leading-none px-1 py-0.5 rounded-full" style="background:#1c969e1a;color:#0c5a61">⁶⁸Ga {{ le.dota.toFixed(1) }}</span>
                        <span v-if="le.fdg != null" class="inline-flex items-center text-[10px] font-semibold leading-none px-1 py-0.5 rounded-full" style="background:#d66e1c1a;color:#8a4a12">FDG {{ le.fdg.toFixed(1) }}</span>
                        <span v-if="sourceOf(le) === 'ia-david'" class="text-[10px] text-tinta">{{ L('IA·conf.', 'AI·conf.') }}</span>
                      </span>
                    </span>
                    <span class="shrink-0 w-10 text-right" :aria-label="L('idoneidad ' + suitabilityScore(le) + ' sobre 100', 'suitability ' + suitabilityScore(le) + ' out of 100')">
                      <span class="block font-mono text-[11px] text-berenjena leading-none data-soft">{{ suitabilityScore(le) }}</span>
                      <span class="block h-1 rounded-full mt-0.5 bg-[rgba(45,27,61,0.08)] overflow-hidden">
                        <span class="block h-full rounded-full" :style="{ width: suitabilityScore(le) + '%', background: SCORE_RAMP_CSS }" />
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
              <p class="text-[10px] text-tinta leading-snug px-1.5 pt-1.5 mt-1 border-t border-[rgba(45,27,61,0.08)]">
                {{ L('Confirmados primero (por nivel anatómico), IA al final (anillo punteado). Color = trazador · ⁶⁸Ga-DOTATOC (SSTR) / ¹⁸F-FDG (glucólisis) · nº = id del foco.', 'Confirmed first (by anatomical level), AI last (dashed ring). Colour = tracer · ⁶⁸Ga-DOTATOC (SSTR) / ¹⁸F-FDG (glycolysis) · nº = focus id.') }}
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
                 lectura TÉCNICA primero; la lectura en lenguaje llano, a un clic. -->
            <div v-if="sel">
              <!-- CABECERA de la ficha · reflow móvil: en estrecho el cluster de la
                   derecha (copiar-enlace + pill de fenotipo) BAJA a su propia fila a
                   ancho completo (flex-wrap + flex-1 en el bloque del título) → nunca
                   se solapa con el título; en ancho vuelve a su sitio (ml-auto). -->
              <div class="flex items-start gap-2.5 mb-2 flex-wrap">
                <span class="shrink-0 w-3.5 h-3.5 mt-1.5 rounded-full" :style="{ background: phenoColor(sel), boxShadow: selIsAi ? '0 0 0 1.5px #fff, 0 0 0 3px ' + phenoColor(sel) : 'none' }" aria-hidden="true" />
                <div class="min-w-0 flex-1 basis-48">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="font-mono font-bold text-base leading-none text-berenjena bg-miriam-soft rounded px-2 py-1 tracking-tight">{{ selLevelCode }}</span>
                    <h3 v-if="selLevelRest" class="heading-display text-lg text-berenjena leading-tight">{{ selLevelRest }}</h3>
                    <span class="font-mono text-[12px] text-tinta">#{{ sel.id }}</span>
                    <span v-if="coCount(sel) > 1" class="pill-data pill-data--berenjena !text-[10px] !px-1.5 !py-0" role="img" :aria-label="coCount(sel) + ' ' + L('focos co-localizados en esta vértebra', 'co-located foci in this vertebra')">{{ coCount(sel) }} {{ L('focos', 'foci') }}</span>
                  </div>
                  <p class="text-xs text-tinta">{{ sel.region[lang] }} ·
                    {{ sel.side === 'R' ? L('lado derecho', 'right side') : sel.side === 'L' ? L('lado izquierdo', 'left side') : L('línea media', 'midline') }}</p>
                </div>
                <div class="ml-auto shrink-0 self-start flex items-center gap-2 flex-wrap justify-end">
                  <!-- COPIAR ENLACE · permalink citable del foco (#foco-N). El texto
                       siempre visible (DS: nunca un botón que oculte texto); el feedback
                       «copiado» es temporal y NO sustituye al rótulo, lo precede. -->
                  <button type="button" class="btn-copylink" :class="{ 'btn-copylink--done': linkCopied }" @click="copyFocoLink"
                    :aria-label="L('Copiar enlace a este foco', 'Copy link to this focus')">
                    <svg v-if="!linkCopied" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L12.5 19.5" /></svg>
                    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                    {{ linkCopied ? L('Enlace copiado', 'Link copied') : L('Copiar enlace', 'Copy link') }}
                  </button>
                  <span class="pill-data" :style="{ background: phenoColor(sel) + '22', color: phenoText(sel) }">{{ phenoLabel(sel) }}</span>
                </div>
              </div>
              <p v-if="selIsAi" class="mb-2 text-[11px] font-semibold leading-snug flex items-center gap-1.5 flex-wrap" style="color:#8a4a1a">
                <span class="inline-block w-2 h-2 rounded-full" style="background:#bf7d2c" aria-hidden="true" />
                {{ L('Detectado por IA · por confirmar', 'AI-detected · to confirm') }}
              </p>
              <p v-if="isMultiFocusBone" class="mb-2 text-[11px] text-tinta leading-snug">
                {{ L('Zona con ' + coFoci.length + ' focos · resumen del principal', 'Area with ' + coFoci.length + ' foci · summary of the main one') }}
              </p>
              <!-- Lectura clínica (registro técnico para el equipo médico). Página
                   ESTRICTAMENTE CLÍNICA: sin capa de lenguaje llano. -->
              <p class="text-[13.5px] text-berenjena leading-snug">{{ sel.tech[lang] }}</p>
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
                  <span class="eyebrow--sm text-berenjena flex items-center gap-1">{{ L('Idoneidad como diana', 'Suitability as a target') }}<ProvDot :le="sel" field="idoneidad" /></span>
                  <span class="font-mono text-sm font-semibold text-berenjena"><span class="data-soft">{{ suitabilityScore(sel) }}</span><span class="unit">{{ L('/100 · derivado', '/100 · derived') }}</span></span>
                </div>
                <div class="h-2 rounded-full overflow-hidden bg-[rgba(45,27,61,0.08)]" role="img"
                  :aria-label="L('Idoneidad ' + suitabilityScore(sel) + ' sobre 100', 'Suitability ' + suitabilityScore(sel) + ' out of 100')">
                  <div class="h-full rounded-full" :style="{ width: suitabilityScore(sel) + '%', background: SCORE_RAMP_CSS }" />
                </div>
                <p class="text-[10px] text-tinta mt-1 leading-snug">{{ L('orientativa · viable × rendimiento × tamaño.', 'indicative · viable × yield × size.') }}</p>
              </div>

              <!-- barra de discordancia: proporción SSTR (violeta) ↔ glucólisis (coral) -->
              <div class="mb-3">
                <div class="flex h-3 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" role="img"
                  :aria-label="L('Proporción SSTR frente a captación glucolítica', 'SSTR versus glycolytic uptake share')">
                  <div :style="{ width: (neShare(sel) * 100).toFixed(0) + '%', background: GA_FILL }" />
                  <div :style="{ width: ((1 - neShare(sel)) * 100).toFixed(0) + '%', background: FDG_FILL }" />
                </div>
                <div class="flex justify-between text-[10px] mt-1">
                  <span :style="{ color: GA_TEXT }">{{ L('SSTR · ⁶⁸Ga', 'SSTR · ⁶⁸Ga') }}{{ sel.dota != null ? ' ' + sel.dota.toFixed(1) : ' —' }}</span>
                  <span :style="{ color: FDG_TEXT }">{{ L('glucólisis · FDG', 'glycolysis · FDG') }}{{ sel.fdg != null ? ' ' + sel.fdg.toFixed(1) : ' —' }}</span>
                </div>
              </div>

              <!-- NÚMEROS CLAVE · 4 cifras a ancho completo (la imagen clave subió a «Imágenes») -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: GA_FILL }">
                  <p class="text-[10px] text-tinta leading-none flex items-center gap-1">{{ L('SSTR · ⁶⁸Ga', 'SSTR · ⁶⁸Ga') }}<ProvDot :le="sel" field="dota" /></p>
                  <p class="font-mono text-base leading-tight text-berenjena"><span :class="{ 'data-soft': selIsAi }">{{ fmtSuv(sel, sel.dota) }}</span><span v-if="sel.dota != null" class="unit">{{ L('SUVmáx', 'SUVmax') }}</span></p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: FDG_FILL }">
                  <p class="text-[10px] text-tinta leading-none flex items-center gap-1">{{ L('Glucólisis · FDG', 'Glycolysis · FDG') }}<ProvDot :le="sel" field="fdg" /></p>
                  <p class="font-mono text-base leading-tight text-berenjena"><span :class="{ 'data-soft': selIsAi }">{{ fmtSuv(sel, sel.fdg) }}</span><span v-if="sel.fdg != null" class="unit">{{ L('SUVmáx', 'SUVmax') }}</span><span v-if="trend(sel)" class="text-[11px] ml-1" :style="deltaStyle(sel)">({{ deltaFdg(sel) }})</span></p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#1f6b57' }">
                  <p class="text-[10px] text-tinta leading-none flex items-center gap-1">{{ L('Forma (CT)', 'Shape (CT)') }}<ProvDot :le="sel" field="morfologia" /></p>
                  <p class="text-[12px] font-semibold leading-tight text-berenjena">{{ morphLabel(sel) }}</p>
                </div>
                <div class="rounded-card bg-cream-card px-2.5 py-1.5 border-l-4" :style="{ borderColor: '#6b6470' }">
                  <p class="text-[10px] text-tinta leading-none flex items-center gap-1">{{ L('Extensión metab.', 'Metabolic extent') }}<ProvDot :le="sel" field="extentMm" /></p>
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
                {{ L('Esta zona tiene ' + coFoci.length + ' focos co-localizados (captación SSTR/glucolítica); el realce señala la zona. Detalle de cada foco abajo y en la tabla.', 'This area has ' + coFoci.length + ' co-localized foci (SSTR/glycolytic uptake); the highlight marks the area. Each focus is detailed below and in the table.') }}
              </p>
              <!-- visor en línea a ANCHO COMPLETO de la columna; el botón de arriba lo abre grande.
                   (A · a11y) aria-describedby apunta a la TABLA de valores: es la
                   alternativa textual viva del visor 3D (todos los focos y sus cifras,
                   navegable, reflejando la selección). role=group + aria-label. -->
              <div class="min-w-0" role="group"
                :aria-label="L('Visor 3D del foco seleccionado', '3D viewer of the selected focus')"
                aria-describedby="tabla-focos-alt">
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
                    <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:12/5;background:#0d1117;color:#aeb6c2">
                      {{ L('cargando visor…', 'loading viewer…') }}
                    </div>
                  </template>
                </ClientOnly>
                <div v-else class="rounded-lg flex items-center justify-center text-center text-[12px] px-4" style="aspect-ratio:12/5;background:#0d1117;color:#aeb6c2">
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
              <!-- caveat del 3D (proyección + co-registro): remite al BLOQUE CANÓNICO, sin duplicar -->
              <p v-if="bone3dKeyOf(sel)" class="text-[10.5px] text-tinta leading-snug mt-2">
                {{ L('El color por vértice es una proyección del PET sobre la malla (indica dónde, no SUVmáx); el ¹⁸F-FDG y el ⁶⁸Ga-DOTATOC son de fechas distintas co-registrados sobre el TC (localización aproximada por co-registro). ', 'The per-vertex colour is a projection of the PET onto the mesh (it shows where, not SUVmax); ¹⁸F-FDG and ⁶⁸Ga-DOTATOC are from different dates co-registered onto the CT (approximate localization by co-registration). ') }}<a href="#metodo-caveats" class="link-action text-miriam font-semibold whitespace-nowrap">{{ L('Método y salvedades ↓', 'Method and caveats ↓') }}</a>
              </p>
              <!-- (A · a11y) alternativa textual explícita y visible: el visor 3D apunta
                   a la TABLA de valores como su equivalente en texto (mismas cifras). -->
              <p v-if="sel" class="text-[10.5px] text-tinta leading-snug mt-1">
                <a href="#tabla" class="link-action text-miriam font-semibold whitespace-nowrap">{{ L('Ver estos valores en texto, en la tabla ↓', 'See these values in text, in the table ↓') }}</a>
                {{ L(' — alternativa textual del visor (todos los focos y sus cifras).', ' — the viewer’s textual alternative (all foci and their figures).') }}
              </p>
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
            class="foco-detalle card-base mt-10 scroll-mt-[5.5rem]">
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
                {{ L('Detectado por IA sobre los DICOM, no consta en el informe oficial. Se muestra con la misma información que el resto para que el equipo lo corrobore; los valores son aproximados y, donde no son fiables, se indica «— · por confirmar». A validar con Medicina Nuclear.',
                      'AI-detected on the DICOM, not in the official report. Shown with the same information as the rest so the team can corroborate it; values are approximate and, where unreliable, read “— · to confirm”. To validate with Nuclear Medicine.') }}
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
                  <span :style="{ color: GA_TEXT }">{{ L('SSTR · ⁶⁸Ga', 'SSTR · ⁶⁸Ga') }} <span class="font-mono">{{ fmtSuv(f, f.dota) }}</span></span>
                  <span :style="{ color: FDG_TEXT }">{{ L('glucólisis · FDG', 'glycolysis · FDG') }} <span class="font-mono">{{ fmtSuv(f, f.fdg) }}</span></span>
                </li>
              </ul>
              <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('El detalle ampliado de abajo corresponde al foco principal de la zona; el resto está en la tabla.', 'The expanded detail below is for the area’s main focus; the rest is in the table.') }}</p>
            </div>

              <!-- ===== LAS TRES LECTURAS · una por prueba (etiquetadas por prueba) ===== -->
              <div class="mb-4 rounded-card border border-[rgba(45,27,61,0.12)] overflow-hidden">
                <div class="px-3 py-2 bg-[rgba(45,27,61,0.04)] border-b border-[rgba(45,27,61,0.08)]">
                  <p class="eyebrow--sm text-berenjena">{{ L('Las tres lecturas · una por prueba', 'The three readings · one per test') }}</p>
                  <p class="text-[11px] text-tinta leading-snug mt-0.5">{{ L('Tres pruebas miran el mismo foco. Etiquetadas por la prueba, no por la biología.', 'Three tests look at the same focus. Labelled by the test, not the biology.') }}</p>
                </div>
                <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(45,27,61,0.08)]">
                  <!-- 1 · SSTR (⁶⁸Ga-DOTATOC) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: GA_FILL }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: GA_TEXT }">{{ L('SSTR', 'SSTR') }} · ⁶⁸Ga-DOTATOC</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('densidad de receptores de somatostatina', 'somatostatin-receptor density') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">{{ fmtSuv(sel, sel.dota) }}</p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.dota != null ? L('SUVmáx SSTR', 'SSTR SUVmax') : L('sin captación de receptores (SSTR⁻)', 'no receptor uptake (SSTR⁻)') }}</p>
                  </div>
                  <!-- 2 · Glucólisis (¹⁸F-FDG) -->
                  <div class="p-3 border-l-4" :style="{ borderColor: FDG_FILL }">
                    <p class="text-[11px] font-semibold leading-tight" :style="{ color: FDG_TEXT }">{{ L('Glucólisis', 'Glycolysis') }} · ¹⁸F-FDG</p>
                    <p class="text-[10px] text-tinta mb-1.5">{{ L('metabolismo glucolítico (glucosa marcada)', 'glycolytic metabolism (labelled glucose)') }}</p>
                    <p class="font-mono text-lg leading-none text-berenjena">
                      {{ fmtSuv(sel, sel.fdg) }}<span v-if="trend(sel)" class="text-[12px] ml-1" :style="deltaStyle(sel)">({{ deltaFdg(sel) }})</span>
                    </p>
                    <p class="text-[11px] text-tinta mt-1">{{ sel.fdg != null ? (trend(sel) ? L('SUVmáx · Δ vs previo', 'SUVmax · Δ vs prior') : L('SUVmáx', 'SUVmax')) : L('sin captación glucolítica (FDG⁻)', 'no glycolytic uptake (FDG⁻)') }}</p>
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
              </div>

              <!-- ===== PROCEDENCIA campo a campo (P2 · «procedencia visible») =====
                   PLEGABLE, plegada por defecto (no estorba). Al abrirla, cada cifra
                   del foco → su ORIGEN completo: fuente, fecha, trazador, MEDIDO vs
                   INTERPRETADO y ref (código de biopsia / heurístico-no-validado).
                   DERIVA del manifiesto (provRows ← manifestCells): lo que se ve aquí
                   = lo que se descarga en el CSV/JSON. Verificabilidad externa
                   (modelo cBioPortal/OncoKB): el equipo inspecciona el origen de cada
                   número sin salir de la ficha. Anti-PHI: solo ids #1–19, sin
                   metadatos de paciente; cualquier ref DICOM es índice/código. -->
              <details class="notes-disclosure prov-panel mb-4">
                <summary>
                  <span class="inline-flex items-center gap-2 flex-wrap">
                    {{ L('Procedencia · de dónde sale cada cifra', 'Provenance · where each figure comes from') }}
                    <span class="status-badge status-badge--firma">{{ L('campo a campo', 'field by field') }}</span>
                  </span>
                </summary>
                <p class="text-[11px] text-tinta mt-3 mb-3 leading-relaxed max-w-2xl">
                  {{ L('Cada cifra de este foco con su origen: fuente, fecha del estudio, trazador, si es MEDIDA o INTERPRETADA y su referencia. Es la misma fuente que el manifiesto descargable (CSV/JSON) — lo que se ve aquí es lo que se descarga.', 'Each figure for this focus with its origin: source, study date, tracer, whether it is MEASURED or INTERPRETED, and its reference. It is the same source as the downloadable manifest (CSV/JSON) — what you see here is what you download.') }}
                </p>
                <ul class="prov-list">
                  <li v-for="r in provRows(sel)" :key="r.field" class="prov-list__row">
                    <span class="prov-dot prov-dot--lg shrink-0 mt-0.5" :style="{ color: r.tone }" role="img" :aria-label="r.fuente">{{ r.glyph }}</span>
                    <div class="min-w-0">
                      <p class="text-[12.5px] leading-snug">
                        <span class="font-semibold text-berenjena">{{ r.label }}</span>
                        <span class="font-mono text-berenjena ml-1.5">{{ r.valor }}<span v-if="r.unidad && r.valor !== '—'" class="text-tinta"> {{ r.unidad }}</span></span>
                      </p>
                      <p class="text-[11px] text-tinta leading-snug mt-0.5 flex flex-wrap gap-x-2 gap-y-0">
                        <span>{{ r.fuente }}</span>
                        <span class="prov-mi" :class="r.medido ? 'prov-mi--measured' : 'prov-mi--interp'">{{ miLabel(r.medido) }}</span>
                        <span v-if="r.trazador">· {{ r.trazador }}</span>
                        <span v-if="r.fecha">· {{ r.fecha }}</span>
                        <span v-if="r.ref">· {{ r.ref }}</span>
                      </p>
                    </div>
                  </li>
                </ul>
                <ProvLegend class="mt-3" />
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Anti-PHI: solo ids sintéticos #1–19; cualquier referencia a un corte DICOM es un índice/código, sin metadatos de paciente.', 'Anti-PHI: synthetic ids #1–19 only; any reference to a DICOM slice is an index/code, with no patient metadata.') }}</p>
              </details>

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
                  <div><dt class="inline font-semibold text-berenjena">{{ L('Rendimiento (estimación heurística orientativa, no validada)', 'Yield (indicative heuristic estimate, not validated)') }}: </dt><dd class="inline">{{ selBiopsy.rend[lang] }}</dd></div>
                </dl>
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Acceso y anatomía del propio caso, para que radiología intervencionista y el comité decidan sobre la imagen en vivo.', 'Access and anatomy from the case itself, for interventional radiology and the tumor board to decide on live imaging.') }}</p>
              </div>

              <!-- (Página estrictamente clínica: sin capa de lenguaje llano.) -->

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
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('Derivado de los SUV, la tendencia y la morfología del propio foco.', 'Derived from the focus’s own SUVs, trend and morphology.') }}</p>
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
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: FDG_FILL }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: FDG_TEXT }">¹⁸F-FDG · {{ L('glucólisis', 'glycolysis') }}</p>
                    <div class="text-[12.5px] text-tinta leading-relaxed">
                      <div>{{ L('Tabla', 'Table') }} <span class="font-mono text-berenjena font-semibold">{{ fmtSuv(sel, sel.fdg) }}</span>
                        <template v-if="selAuto?.fdgAuto != null"> · {{ L('auto', 'auto') }} <span class="font-mono">{{ selAuto?.fdgAuto?.toFixed(2) }}</span>
                          <span v-if="sel.fdg != null" class="font-semibold" :style="{ color: '#8a5a1a' }">{{ isAiDavid(sel) ? ' · IA' : (Math.abs((sel.fdg || 0) - (selAuto?.fdgAuto || 0)) < 0.6 ? ' ✓' : ' ≈') }}</span>
                        </template>
                      </div>
                      <div v-if="selAuto?.fdgAuto != null">MTV <span class="font-mono text-berenjena">{{ selAuto?.fdgMtv }} ml</span> · TLG <span class="font-mono text-berenjena">{{ selAuto?.fdgTlg }}</span> · <span class="text-berenjena">{{ selAuto?.fdgMorph }}</span></div>
                    </div>
                  </div>
                  <div class="rounded-card bg-cream px-3 py-2 border-l-4" :style="{ borderColor: GA_FILL }">
                    <p class="text-[11px] font-semibold mb-1" :style="{ color: GA_TEXT }">⁶⁸Ga-DOTATOC · {{ L('SSTR', 'SSTR') }}</p>
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
                <p class="text-[10px] text-tinta mt-2 leading-relaxed">{{ L('SUV recalculado del DICOM (corrección de decaimiento), MTV y TLG con máscara ósea del CT; morfología por densidad CT. El ¹⁸F-FDG (1,65 mm) tiene mayor resolución espacial que el ⁶⁸Ga-DOTATOC (4 mm). Verificación: manda la tabla.', 'SUV recomputed from the DICOM (decay-corrected), MTV and TLG with a CT bone mask; morphology from CT density. ¹⁸F-FDG (1.65 mm) has higher spatial resolution than ⁶⁸Ga-DOTATOC (4 mm). Verification: the table prevails.') }}</p>
              </details>

              <!-- EVOLUCIÓN FDG + IMAGEN CLAVE · 2 columnas (la gráfica a ancho completo
                   quedaba GIGANTE; al lado de la imagen ocupa la mitad y se equilibra). -->
              <div class="grid md:grid-cols-2 gap-5 mb-4 items-start">
              <!-- evolución del FDG (solo si hay dos medidas; el Galio tiene una sola) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] font-semibold text-berenjena">{{ L('Evolución glucolítica (¹⁸F-FDG)', 'Glycolytic (¹⁸F-FDG) evolution') }}</span>
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
                  <div><span class="text-tinta">{{ L('⁶⁸Ga-DOTATOC SUVmáx', '⁶⁸Ga-DOTATOC SUVmax') }}</span><br><span class="font-mono text-berenjena" :class="{ 'data-soft': selIsAi }">{{ sel.dota != null ? fmtSuv(sel, sel.dota) : L('sin captación', 'no uptake') }}</span></div>
                  <div><span class="text-tinta">{{ L('¹⁸F-FDG SUVmáx', '¹⁸F-FDG SUVmax') }}</span><br><span class="font-mono text-berenjena" :class="{ 'data-soft': selIsAi }">{{ sel.fdg != null ? fmtSuv(sel, sel.fdg) : L('sin captación', 'no uptake') }}</span></div>
                  <div v-if="trend(sel)"><span class="text-tinta">{{ L('Tendencia ¹⁸F-FDG', '¹⁸F-FDG trend') }}</span><br><span class="font-mono" :style="{ color: trend(sel)!.dir === 'up' || trend(sel)!.dir === 'new' ? '#bb4128' : trend(sel)!.dir === 'down' ? '#1f5a3a' : '#3a3340' }">{{ trend(sel)!.txt }}</span></div>
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
          <h2 class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">{{ L('Visión general del caso', 'Case overview') }}</h2>
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
          <h2 id="idoneidad" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">
            {{ L('Idoneidad como diana de biopsia', 'Suitability as a biopsy target') }}
          </h2>

          <!-- TARJETA-LENTE · marco ético (equipa, no indica) -->
          <div class="rounded-card border-l-4 px-4 py-4 mb-6" :style="{ borderLeftColor: GA_FILL, background: TRACER.ga.tintBg }">
            <p class="eyebrow--sm mb-1.5 flex items-center gap-2 flex-wrap" :style="{ color: GA_TEXT }">
              <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: GA_FILL }" />
              {{ L('Cómo leer esta lente', 'How to read this lens') }}
              <span class="status-badge status-badge--firma">{{ L('equipa, no indica', 'equips, does not indicate') }}</span>
            </p>
            <p class="text-[14px] text-berenjena leading-relaxed">
              {{ L(
                'Una lente OPT-IN (estimación heurística orientativa, no validada): cuando la activas, ordena los focos por las señales que importan para sopesar dónde rebiopsiar —captación de trazador (¹⁸F-FDG / ⁶⁸Ga-DOTATOC), rendimiento tisular por morfología (lítico / partes blandas rinde más; blástico denso, poco) y tamaño. Por defecto, la lista va por nivel anatómico (hecho neutro). La accesibilidad y la seguridad las valora radiología intervencionista. Ofrece, no decide.',
                'An OPT-IN lens (an indicative heuristic estimate, not validated): when you turn it on, it orders the foci by the signals that matter to weigh where to rebiopsy — tracer uptake (¹⁸F-FDG / ⁶⁸Ga-DOTATOC), tissue yield by morphology (lytic / soft tissue yields more; dense blastic, little) and size. By default, the list goes by anatomical level (a neutral fact). Accessibility and safety are assessed by interventional radiology. It offers, it does not decide.') }}
            </p>
          </div>

          <!-- LOS FACTORES que componen la idoneidad (explícitos, etiquetados por trazador/forma) -->
          <p class="text-sm text-tinta leading-relaxed mb-3 max-w-3xl">
            {{ L('El cálculo completo: la idoneidad es el producto de tres factores visibles, más tres avisos de FACTIBILIDAD que el equipo pondera (no van en el número). El resumen con las dianas que la lente sitúa mejor está arriba, en «Dianas que la lente heurística sitúa mejor».',
                  'The full calculation: suitability is the product of three visible factors, plus three FEASIBILITY flags the team weighs (not part of the number). The summary with the targets the lens places best is at the top, in “Targets the heuristic lens places best”.') }}
          </p>
          <!-- GRUPO A · los 3 factores que MULTIPLICAN el número → grid de 3 col (llena exacto). -->
          <div class="grid sm:grid-cols-3 gap-3 mb-3">
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: FDG_FILL }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: FDG_TEXT }">{{ L('1 · Captación (¹⁸F-FDG / ⁶⁸Ga)', '1 · Uptake (¹⁸F-FDG / ⁶⁸Ga)') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('¹⁸F-FDG SUVmáx: a mayor captación glucolítica, más señal metabólica viable que muestrear; el ⁶⁸Ga-DOTATOC aporta la densidad de receptores de somatostatina (SSTR).', '¹⁸F-FDG SUVmax: the higher the glycolytic uptake, the more viable metabolic signal to sample; ⁶⁸Ga-DOTATOC adds the somatostatin-receptor (SSTR) density.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#1f6b57' }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: '#1f6b57' }">{{ L('2 · Rendimiento (estimación heurística)', '2 · Yield (heuristic estimate)') }}</p>
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
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('Donde la RMN describe partes blandas / extensión extraósea (p.ej. epidural de D11, #7), hay una diana de tejido blando que suele rentabilizar más que el hueso blástico denso; la cercanía al canal/raíces la valora intervencionista. No entra en el número.', 'Where the MRI describes soft tissue / extraosseous extension (e.g. D11 epidural, #7), there is a soft-tissue target that usually yields more than dense blastic bone; proximity to the canal/roots is assessed by interventional radiology. Not part of the number.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: '#6b6470' }">
              <p class="text-[12px] font-semibold mb-1 text-tinta">{{ L('Aviso · accesibilidad', 'Flag · accessibility') }}</p>
              <p class="text-[12.5px] text-tinta leading-snug">{{ L('La accesibilidad y la seguridad no las tenemos como dato fiable: las valora radiología intervencionista. No se inventan ni se puntúan.', 'Accessibility and safety are not available to us as a reliable datum: interventional radiology assesses them. They are neither invented nor scored.') }}</p>
            </div>
            <div class="card-base !p-3.5 border-t-4" :style="{ borderColor: GA_FILL }">
              <p class="text-[12px] font-semibold mb-1" :style="{ color: GA_TEXT }">{{ L('La fórmula', 'The formula') }}</p>
              <p class="text-[12px] text-tinta leading-snug font-mono">idoneidad = 100 · viable · rendimiento · tamaño</p>
              <p class="text-[11px] text-tinta leading-snug mt-1">{{ L('viable = 0.78·(FDG/10) + 0.22·(Ga/14) · rendimiento = lítico 1 / mixto 0.6 / blástico 0.3 · tamaño = 0.6–1 por el eje mayor de la extensión metabólica medida. Orientativa.', 'viable = 0.78·(FDG/10) + 0.22·(Ga/14) · yield = lytic 1 / mixed 0.6 / blastic 0.3 · size = 0.6–1 by the major axis of the measured metabolic extent. Indicative.') }}</p>
              <p class="text-[10.5px] text-tinta leading-snug mt-1">{{ L('Los pesos de los tres factores (por defecto 1) son un CRITERIO puesto a mano: muévelos en el stress-test de abajo y verás que el orden cambia → no es una verdad medida, es una orientación.', 'The weights of the three factors (default 1) are a hand-set CRITERION: move them in the stress-test below and you will see the order change → it is not a measured truth, it is an orientation.') }}</p>
              <p class="text-[10.5px] text-tinta leading-snug mt-1">{{ L('Extensión metabólica = lo que cada foco capta por encima del umbral (41% del SUVmáx local), confinada a hueso, medida sobre el DICOM. Es lo que se ve por imagen, no el tamaño anatómico exacto; el volumen parcial subestima los focos < ~10 mm.', 'Metabolic extent = what each focus takes up above the threshold (41% of the local SUVmax), confined to bone, measured on the DICOM. It is what imaging shows, not the exact anatomical size; partial-volume effect underestimates foci < ~10 mm.') }}</p>
            </div>
          </div>

          <!-- ORDEN POR DEFECTO = NIVEL ANATÓMICO (hecho neutro). La idoneidad es una LENTE
               OPT-IN: el usuario la activa con el control y entonces reordena por score
               (estimación heurística orientativa, no validada). Ofrece, no condiciona. -->
          <div class="flex items-baseline justify-between flex-wrap gap-x-2 gap-y-1.5 mb-2">
            <h3 class="heading-display text-lg text-berenjena">{{ orderByIdoneidad ? L('Focos del informe, ordenados por idoneidad', 'Report foci, ordered by suitability') : L('Focos del informe, por nivel anatómico', 'Report foci, by anatomical level') }}</h3>
            <span class="text-[11px] text-tinta">{{ L('toca un foco para abrir su ficha', 'tap a focus to open its card') }}</span>
          </div>
          <!-- CONTROL · activa la lente de idoneidad (no es el orden por defecto). Texto SIEMPRE
               visible; nunca un botón que oculte contenido. -->
          <label class="flex items-start gap-2.5 mb-3 cursor-pointer select-none rounded-card border px-3 py-2.5"
            :class="orderByIdoneidad ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.06)]' : 'border-[rgba(45,27,61,0.14)] bg-cream-card'">
            <input type="checkbox" v-model="orderByIdoneidad" class="mt-0.5 accent-[#9d44ab] w-4 h-4 shrink-0"
              :aria-label="L('Ordenar por idoneidad (heurística orientativa, no validada)', 'Sort by suitability (indicative heuristic, not validated)')" />
            <span class="min-w-0">
              <span class="text-[13px] font-semibold text-berenjena leading-snug block">{{ L('Ordenar por idoneidad (estimación heurística orientativa, no validada)', 'Sort by suitability (indicative heuristic estimate, not validated)') }}</span>
              <span class="text-[11px] text-tinta leading-snug block mt-0.5">{{ orderByIdoneidad ? L('Activada: la lista se reordena por el score. Es una orientación que el equipo sopesa; el orden de referencia es el nivel anatómico.', 'On: the list is reordered by the score. It is an orientation the team weighs; the reference order is the anatomical level.') : L('Por defecto, los focos van por nivel anatómico (hecho neutro). Actívala para verlos reordenados por la estimación de idoneidad.', 'By default, foci go by anatomical level (a neutral fact). Turn it on to see them reordered by the suitability estimate.') }}</span>
            </span>
          </label>

          <!-- ════════ STRESS-TEST DE PESOS · «esto no es ciencia, es un criterio» ════════
               Tres deslizadores (uno por factor) que el usuario mueve y los focos se
               REORDENAN ante sus ojos. La demostración es el movimiento. Pesos por
               defecto = los actuales (no cambia nada hasta que toca). Etiqueta permanente
               de NO-VALIDACIÓN + botón de reset. Sliders táctiles ≥44px (pointer:coarse). -->
          <div class="rounded-card border px-4 py-4 mb-3" :style="{ borderColor: '#9d44ab', background: 'rgba(157,68,171,0.04)' }">
            <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
              <p class="eyebrow--sm flex items-center gap-2 flex-wrap" :style="{ color: '#7a3486' }">
                <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: '#9d44ab' }" />
                {{ L('Stress-test: mueve los pesos', 'Stress-test: move the weights') }}
                <span class="status-badge status-badge--firma">{{ L('heurística, no validada', 'heuristic, not validated') }}</span>
                <span v-if="weightsDirty" class="status-badge status-badge--candidate">{{ L('pesos modificados', 'weights modified') }}</span>
              </p>
              <button v-if="weightsDirty" type="button" @click="resetWeights"
                class="link-action text-miriam text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 min-h-[44px] sm:min-h-0">
                ↺ {{ L('restablecer pesos', 'reset weights') }}
              </button>
            </div>
            <p class="text-[12.5px] text-berenjena leading-relaxed mb-3.5 max-w-3xl">
              {{ L('Mueve los pesos de los tres factores: el orden de los focos cambia ante tus ojos. Eso es lo que demuestra: el score es una HEURÍSTICA orientativa con criterios puestos a mano, no una verdad medida. No es «ajústalo hasta que salga lo que quieres» — es ver que el orden depende de un criterio. El equipo decide.',
                    'Move the weights of the three factors: the order of the foci changes before your eyes. That is what it demonstrates: the score is an indicative HEURISTIC with hand-set criteria, not a measured truth. It is not “tune it until it says what you want” — it is seeing that the order depends on a criterion. The team decides.') }}
            </p>
            <div class="space-y-3.5">
              <!-- Slider 1 · Captación / viabilidad -->
              <div>
                <label :for="'w-viable'" class="flex items-baseline justify-between gap-2 mb-1 cursor-pointer">
                  <span class="text-[12.5px] font-semibold" :style="{ color: FDG_TEXT }">{{ L('1 · Captación / viabilidad', '1 · Uptake / viability') }}</span>
                  <span class="font-mono text-[11.5px]" :class="wViable !== 1 ? 'text-berenjena font-semibold' : 'text-tinta'">×{{ wViable.toFixed(1) }}<span class="text-[10px] text-tinta"> ({{ L('peso', 'weight') }})</span></span>
                </label>
                <input id="w-viable" type="range" min="0" max="2" step="0.1" v-model.number="wViable"
                  class="stress-slider" :style="{ '--slider-accent': FDG_FILL }"
                  :aria-label="L('Peso del factor captación / viabilidad', 'Weight of the uptake / viability factor')"
                  :aria-valuetext="L('peso ' + wViable.toFixed(1) + ', por defecto 1', 'weight ' + wViable.toFixed(1) + ', default 1')" />
              </div>
              <!-- Slider 2 · Rendimiento -->
              <div>
                <label :for="'w-yield'" class="flex items-baseline justify-between gap-2 mb-1 cursor-pointer">
                  <span class="text-[12.5px] font-semibold" :style="{ color: '#1f6b57' }">{{ L('2 · Rendimiento (forma)', '2 · Yield (shape)') }}</span>
                  <span class="font-mono text-[11.5px]" :class="wYield !== 1 ? 'text-berenjena font-semibold' : 'text-tinta'">×{{ wYield.toFixed(1) }}<span class="text-[10px] text-tinta"> ({{ L('peso', 'weight') }})</span></span>
                </label>
                <input id="w-yield" type="range" min="0" max="2" step="0.1" v-model.number="wYield"
                  class="stress-slider" :style="{ '--slider-accent': '#1f6b57' }"
                  :aria-label="L('Peso del factor rendimiento', 'Weight of the yield factor')"
                  :aria-valuetext="L('peso ' + wYield.toFixed(1) + ', por defecto 1', 'weight ' + wYield.toFixed(1) + ', default 1')" />
              </div>
              <!-- Slider 3 · Tamaño -->
              <div>
                <label :for="'w-size'" class="flex items-baseline justify-between gap-2 mb-1 cursor-pointer">
                  <span class="text-[12.5px] font-semibold text-tinta">{{ L('3 · Tamaño / cantidad', '3 · Size / amount') }}</span>
                  <span class="font-mono text-[11.5px]" :class="wSize !== 1 ? 'text-berenjena font-semibold' : 'text-tinta'">×{{ wSize.toFixed(1) }}<span class="text-[10px] text-tinta"> ({{ L('peso', 'weight') }})</span></span>
                </label>
                <input id="w-size" type="range" min="0" max="2" step="0.1" v-model.number="wSize"
                  class="stress-slider" :style="{ '--slider-accent': '#6b6470' }"
                  :aria-label="L('Peso del factor tamaño', 'Weight of the size factor')"
                  :aria-valuetext="L('peso ' + wSize.toFixed(1) + ', por defecto 1', 'weight ' + wSize.toFixed(1) + ', default 1')" />
              </div>
            </div>
            <p class="text-[11px] text-tinta leading-snug mt-3">
              {{ orderByIdoneidad
                  ? L('Con la lente de orden activada, la lista de abajo se reordena en vivo al mover un peso. Peso 0 = ese factor se ignora; peso 1 = como está hoy; peso 2 = pesa el doble.', 'With the order lens on, the list below reorders live as you move a weight. Weight 0 = that factor is ignored; weight 1 = as it is today; weight 2 = it weighs double.')
                  : L('Activa arriba «Ordenar por idoneidad» para ver la lista reordenarse en vivo al mover un peso. Peso 0 = ese factor se ignora; peso 1 = como está hoy; peso 2 = pesa el doble.', 'Turn on “Sort by suitability” above to see the list reorder live as you move a weight. Weight 0 = that factor is ignored; weight 1 = as it is today; weight 2 = it weighs double.') }}
            </p>
          </div>

          <TransitionGroup tag="ul" name="rank-flip" class="space-y-2 mb-3">
            <li v-for="le in rankedFoci" :key="le.id">
              <button type="button" :aria-pressed="selected === le.id" @click="pickAndShow(le.id)"
                class="foco-card w-full text-left rounded-card border px-3.5 py-3"
                :class="selected === le.id ? 'border-[#9d44ab] bg-[rgba(157,68,171,0.07)]' : 'border-[rgba(45,27,61,0.12)] bg-cream-card hover:border-[rgba(45,27,61,0.3)]'">
                <div class="flex items-center gap-3">
                  <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center  text-xs font-semibold" :style="{ background: phenoColor(le), color: markerInk(le) }">{{ le.id }}</span>
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
                      <span class="text-tinta">{{ L('Captación (¹⁸F-FDG/⁶⁸Ga)', 'Uptake (¹⁸F-FDG/⁶⁸Ga)') }}</span>
                      <span class="font-mono" :style="{ color: FDG_TEXT }">¹⁸F-FDG {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · ⁶⁸Ga {{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span>
                    </div>
                    <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                      <div class="h-full rounded-full" :style="{ width: pct01(viableFactor(le)), background: FDG_FILL }" />
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
          </TransitionGroup>
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
                  class="foco-card w-full text-left rounded-card border px-3.5 py-3"
                  :class="selected === le.id ? 'border-[#bf7d2c] bg-[rgba(191,125,44,0.08)]' : 'border-[rgba(138,74,26,0.25)] bg-cream hover:border-[rgba(138,74,26,0.5)]'">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex w-7 h-7 shrink-0 rounded-full items-center justify-center  text-xs font-semibold ai-dot" :style="{ background: phenoColor(le), color: markerInk(le) }">{{ le.id }}</span>
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
                        <span class="text-tinta">{{ L('Captación (¹⁸F-FDG/⁶⁸Ga)', 'Uptake (¹⁸F-FDG/⁶⁸Ga)') }}</span>
                        <span class="font-mono data-soft" :style="{ color: FDG_TEXT }">¹⁸F-FDG <span class="data-soft__approx">~</span>{{ le.fdg != null ? le.fdg.toFixed(1) : '—' }} · ⁶⁸Ga <span class="data-soft__approx">~</span>{{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span>
                      </div>
                      <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'rgba(45,27,61,0.08)' }">
                        <div class="h-full rounded-full" :style="{ width: pct01(viableFactor(le)), background: FDG_FILL }" />
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
          <h2 id="fenotipo" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">
            {{ L('Mapa de fenotipo — la tercera vista enlazada', 'Phenotype map — the third linked view') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Cada lesión situada por sus dos trazadores a la vez: el eje horizontal es la captación glucolítica (¹⁸F-FDG SUVmáx) y el vertical la densidad de receptores de somatostatina (⁶⁸Ga-DOTATOC SUVmáx). Cada cuadrante está rotulado en el propio gráfico. Toca un punto para abrir su ficha; las divisiones son orientativas.',
              'Each lesion placed by both tracers at once: the horizontal axis is glycolytic uptake (¹⁸F-FDG SUVmax) and the vertical the somatostatin-receptor density (⁶⁸Ga-DOTATOC SUVmax). Each quadrant is labelled on the chart itself. Tap a dot to open its card; the dividers are indicative.') }}
          </p>
          <!-- contenedor CONTENIDO: el scatter ya no ocupa todo el ancho (se veía
               «gigante»); leyenda mínima como banda fina DEBAJO, no muro lateral. -->
          <!-- (A · a11y) @keydown gobierna la navegación por teclado del scatter con
               las MISMAS teclas que el esqueleto/lista (flechas, Home/End, número). -->
          <div class="card-base !p-3" @keydown="onFocoNavKey">
              <svg viewBox="0 0 440 340" class="w-full" role="listbox"
                :aria-label="L('Diagrama de fenotipo: SSTR (⁶⁸Ga-DOTATOC) frente a captación glucolítica (¹⁸F-FDG) — flechas para recorrer, Intro para abrir su ficha, o escribe un número de foco', 'Phenotype scatter: SSTR (⁶⁸Ga-DOTATOC) versus glycolytic uptake (¹⁸F-FDG) — arrows to step, Enter to open its card, or type a focus number')"
                :aria-activedescendant="'sc-opt-' + selected"
                aria-describedby="tabla-focos-alt">
                <!-- tintes de cuadrante · alineados al trazador del eje -->
                <rect :x="qX(0)" :y="qY(Q.ymax)" :width="qX(Q.divx) - qX(0)" :height="qY(Q.divy) - qY(Q.ymax)" :fill="GA_FILL" opacity="0.09" />
                <rect :x="qX(Q.divx)" :y="qY(Q.ymax)" :width="qX(Q.xmax) - qX(Q.divx)" :height="qY(Q.divy) - qY(Q.ymax)" fill="#8c8678" opacity="0.10" />
                <rect :x="qX(Q.divx)" :y="qY(Q.divy)" :width="qX(Q.xmax) - qX(Q.divx)" :height="qY(0) - qY(Q.divy)" :fill="FDG_FILL" opacity="0.10" />
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
                  <text :x="qX(0) + 8" :y="qY(Q.ymax) + 14" :fill="GA_TEXT">{{ L('SSTR-DOMINANTE', 'SSTR-DOMINANT') }}</text>
                  <text :x="qX(Q.xmax) - 6" :y="qY(Q.ymax) + 14" text-anchor="end" fill="#6b6457">{{ L('CAPTACIÓN DUAL', 'DUAL UPTAKE') }}</text>
                  <text :x="qX(Q.xmax) - 6" :y="qY(0) - 9" text-anchor="end" :fill="FDG_TEXT">{{ L('GLUCOLÍTICO-DOM.', 'GLYCOLYTIC-DOM.') }}</text>
                  <text :x="qX(0) + 8" :y="qY(0) - 9" fill="#57525c">{{ L('BAJA AVIDEZ', 'LOW AVIDITY') }}</text>
                </g>
                <!-- títulos de eje -->
                <text :x="(qX(0) + qX(Q.xmax)) / 2" :y="Q.H - 6" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" :fill="FDG_TEXT">{{ L('¹⁸F-FDG SUVmáx · glucólisis →', '¹⁸F-FDG SUVmax · glycolysis →') }}</text>
                <text :transform="`translate(13,${(qY(Q.ymax) + qY(0)) / 2}) rotate(-90)`" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="10.5" font-weight="600" :fill="GA_TEXT">{{ L('⁶⁸Ga SUVmáx · SSTR (↑)', '⁶⁸Ga SUVmax · SSTR (↑)') }}</text>
                <!-- puntos = lesiones · GLYPH SPLIT-DISC bivariado: media-luna IZQ
                     teal (⁶⁸Ga-DOTATOC) + media-luna DCHA ámbar (¹⁸F-FDG), cada
                     mitad con su intensidad según SU SUVmáx → la asimetría ES la
                     discordancia. Borde punteado = IA (por confirmar); borde oscuro
                     = seleccionado. Tamaño UNIFORME (la posición ya codifica los dos
                     SUV; el disco los REPITE de forma bivariada). Sin halo/parpadeo. -->
                <!-- linking de estado: el FILTRO atenúa (no oculta) → el punto no
                     coincidente se queda en su posición con baja opacidad (focoOpacity);
                     un foco con hover en CUALQUIER vista resalta aquí su punto. -->
                <g v-for="d in quadDots" :key="'qd' + d.le.id" class="sc-foco" :style="{ opacity: focoOpacity(d.le) }">
                  <!-- área táctil invisible (móvil): el dedo acierta sin agrandar el punto -->
                  <circle :cx="d.px" :cy="d.py" :r="DOT_HIT"
                    fill="transparent" class="cursor-pointer" aria-hidden="true"
                    @click="pickAndShow(d.le.id)"
                    @mouseenter="canHoverFine() && (showTip($event, lesionTipText(d.le)), setHover(d.le.id))" @mouseleave="hideTip(); clearHover()" />
                  <!-- mitad ⁶⁸Ga (izquierda, teal) + mitad ¹⁸F-FDG (derecha, ámbar) -->
                  <path :d="halfDiscPath(d.px, d.py, DOT_R, 'L')" :fill="gaHalf(d.le)" class="pointer-events-none" />
                  <path :d="halfDiscPath(d.px, d.py, DOT_R, 'R')" :fill="fdgHalf(d.le)" class="pointer-events-none" />
                  <!-- línea de partición + borde del disco (interacción/teclado en este círculo) -->
                  <line :x1="d.px" :y1="d.py - DOT_R" :x2="d.px" :y2="d.py + DOT_R" stroke="#ffffff" stroke-width="0.9" class="pointer-events-none" />
                  <circle :cx="d.px" :cy="d.py" :r="DOT_R + (selected === d.le.id ? 0 : (focoHovered(d.le) ? 1.5 : 0))"
                    fill="none"
                    :stroke="selected === d.le.id ? '#2d1b3d' : (focoHovered(d.le) ? '#9d44ab' : '#ffffff')"
                    :stroke-width="selected === d.le.id ? 2.5 : (focoHovered(d.le) ? 2.2 : 1.2)"
                    :stroke-dasharray="sourceOf(d.le) === 'ia-david' ? '2 1.6' : undefined"
                    class="cursor-pointer sk-marker" tabindex="0" role="button" :aria-pressed="selected === d.le.id"
                    :aria-label="`#${d.le.id} ${d.le.level[lang]} — Ga ${d.le.dota ?? '—'} / FDG ${d.le.fdg ?? '—'}`"
                    @click="pickAndShow(d.le.id)" @keydown.enter="pickAndShow(d.le.id)" @keydown.space.prevent="pickAndShow(d.le.id)"
                    @mouseenter="canHoverFine() && (showTip($event, lesionTipText(d.le)), setHover(d.le.id))" @mouseleave="hideTip(); clearHover()" @focus="showTip($event, lesionTipText(d.le)); setHover(d.le.id)" @blur="hideTip(); clearHover()" @keydown.escape="hideTip" />
                  <text :x="d.px" :y="d.py + 3" text-anchor="middle" font-family="Source Sans 3, sans-serif" :font-size="d.le.id > 9 ? 8.5 : 9.5" font-weight="700" :fill="markerInk(d.le)" class="pointer-events-none select-none" paint-order="stroke" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round">{{ d.le.id }}</text>
                </g>
              </svg>

              <!-- MICRO-NOTA · el GLYPH split-disc es bivariado: hay que leer las dos
                   mitades. Leyenda mínima de UNA sola fuente (mismas fns gaHalf/fdgHalf
                   que los puntos) + la distinción confirmado↔IA + el encuadre. -->
              <div class="mt-2.5 pt-2.5 border-t border-[rgba(45,27,61,0.08)] space-y-2">
                <p class="inline-flex items-center gap-1.5 text-[11.5px] text-tinta">
                  <svg width="16" height="16" viewBox="0 0 16 16" class="shrink-0" aria-hidden="true">
                    <path d="M 8 1.5 A 6.5 6.5 0 0 0 8 14.5 Z" :fill="halfFill(7, GLYPH_GA_PEAK)" />
                    <path d="M 8 1.5 A 6.5 6.5 0 0 1 8 14.5 Z" :fill="halfFill(7, GLYPH_FDG_PEAK)" />
                    <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="#fff" stroke-width="0.9" />
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="#fff" stroke-width="1.1" />
                  </svg>
                  <span><strong class="text-berenjena font-semibold">{{ L('disco partido', 'split disc') }}</strong> {{ L('= mitad izq. ⁶⁸Ga-DOTATOC (teal) · mitad dcha. ¹⁸F-FDG (ámbar); más intenso = más SUVmáx. La asimetría es la discordancia.', '= left half ⁶⁸Ga-DOTATOC (teal) · right half ¹⁸F-FDG (amber); more intense = higher SUVmax. The asymmetry is the discordance.') }}</span>
                </p>
                <p class="inline-flex items-center gap-1.5 text-[11.5px] text-tinta">
                  <svg width="16" height="16" viewBox="0 0 16 16" class="shrink-0" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="#6b6470" stroke-width="1.3" stroke-dasharray="2 1.6" />
                  </svg>
                  <span><strong class="text-berenjena font-semibold">{{ L('contorno punteado', 'dashed outline') }}</strong> {{ L('= detectado por IA, por confirmar (#17/#18/#19)', '= AI-detected, to confirm (#17/#18/#19)') }}</span>
                </p>
                <p class="text-[10.5px] text-tinta leading-relaxed">{{ L('SUVmáx de los informes. El color encoda el TRAZADOR, no biología ni pronóstico.', 'SUVmax from the reports. Colour encodes the TRACER, not biology or prognosis.') }}</p>
              </div>
          </div>
        </section>
        <!-- ===== ZONA C · IMAGEN REAL (pestañas) ===== -->
        <section class="mb-14" aria-labelledby="imagen">
          <p class="eyebrow mb-2 block">{{ L('La imagen real', 'The real imaging') }}</p>
          <h2 id="imagen" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">
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
                  {{ p.tracer === 'ga' ? '⁶⁸Ga-DOTATOC · 26/05/2026 · ' + L('SSTR', 'SSTR') : '¹⁸F-FDG · 24/03/2026 · ' + L('glucólisis', 'glycolysis') }}
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
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: FDG_FILL }" /><span><strong class="text-berenjena">D11</strong> — {{ L('extensión al espacio epidural anterior y compromiso del canal lateral izquierdo.', 'anterior epidural extension and left lateral canal compromise.') }}</span></li>
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#c9921e' }" /><span>{{ L('Fracturas patológicas crónicas (desde 2024) de L1 y L3.', 'Chronic pathological fractures (since 2024) of L1 and L3.') }}</span></li>
                <li class="flex gap-2"><span class="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" :style="{ background: '#1f5a3a' }" /><span>{{ L('Médula espinal de señal normal.', 'Spinal cord with normal signal.') }}</span></li>
              </ul>
              <!-- la RMN, conectada a la FACTIBILIDAD de la biopsia (descriptivo, no concluye) -->
              <div class="mt-3 rounded-card border-l-4 px-3 py-2.5" :style="{ borderLeftColor: '#1f6b57', background: '#eef6f2' }">
                <p class="text-[12.5px] text-tinta leading-snug">
                  <strong :style="{ color: '#1f6b57' }">{{ L('La RMN y la factibilidad de la biopsia:', 'MRI and biopsy feasibility:') }}</strong>
                  {{ L('el componente epidural de D11 es una diana de tejido blando que suele rentabilizar más que el hueso denso; su vecindad al canal y a las raíces la valora radiología intervencionista. Alimenta los avisos de factibilidad de la lente.',
                        'the D11 epidural component is a soft-tissue target that usually yields more than dense bone; its proximity to the canal and roots is assessed by interventional radiology. It feeds the lens’s feasibility flags.') }}
                  <button type="button" @click="pickAndShow(7)" class="link-action text-miriam inline-flex items-center gap-1">{{ L('ver el foco D11 (#7)', 'see the D11 focus (#7)') }} <span aria-hidden="true">→</span></button>
                </p>
              </div>
            </div>

            <div class="alert-callout leading-relaxed mt-4">
              {{ L('Su lectura formal corresponde al radiólogo. Los SUV del resto de la página vienen de los informes del PET, no de la RMN.',
                    'Its formal reading belongs to the radiologist. The SUVs in the rest of the page come from the PET reports, not the MRI.') }}
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
            <h2 id="imagenes-clave" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">{{ L('Imágenes clave por foco · PET-CT', 'Key images per focus · PET-CT') }}</h2>
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
          <h2 id="trayectoria" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">
            {{ L('Trayectoria desde el estudio previo', 'Trajectory since the prior study') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-3xl">
            {{ L(
              'Comparación de la captación glucolítica (¹⁸F-FDG) entre el estudio previo (ene 2026) y el actual (mar 2026), sobre los ' + trajectory.withPrev + ' focos con valor previo. El ⁶⁸Ga-DOTATOC (SSTR) procede del estudio de mayo 2026, sin previo con el que comparar.',
              'Glycolytic-uptake (¹⁸F-FDG) comparison between the prior study (Jan 2026) and the current one (Mar 2026), over the ' + trajectory.withPrev + ' foci with a prior value. The ⁶⁸Ga-DOTATOC (SSTR) is from the May 2026 study, with no prior to compare.') }}
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div class="stat-readout">
              <div class="stat-readout__label">{{ L('FDG en aumento', 'FDG rising') }}</div>
              <div class="stat-readout__value" :style="{ color: FDG_TEXT }">{{ trajectory.up + trajectory.neu }}</div>
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
              <div class="stat-readout__value" :style="{ color: FDG_TEXT }">{{ trajectory.neu }}</div>
              <div class="stat-readout__unit">{{ L('encienden ahora', 'lighting up now') }}</div>
            </div>
          </div>
          <div v-if="loadBearingFdgFoci.length" class="rounded-card border border-[rgba(45,27,61,0.1)] bg-[rgba(45,27,61,0.04)] text-[#3a3340] px-4 py-3.5 text-sm leading-relaxed">
            <div class="font-semibold text-berenjena mb-1.5 flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full" :style="{ background: '#6b6470' }" aria-hidden="true" />
              {{ L('Focos en hueso de carga con FDG igual o mayor que el previo (descriptivo)', 'Weight-bearing foci with FDG equal to or above the prior study (descriptive)') }}
            </div>
            {{ L(
              'Focos en hueso de carga cuyo FDG iguala o supera el del estudio previo: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.es).join(' · ') + '. Oncología Radioterápica ya los revisó.',
              'Foci in weight-bearing bone whose FDG matches or exceeds the prior study: ' + loadBearingFdgFoci.map((l) => '#' + l.id + ' ' + l.level.en).join(' · ') + '. Radiation Oncology has already reviewed them.') }}
          </div>
        </section>
        <!-- ===== ZONA E · APÉNDICE DE REFERENCIA (tabla) — abierta por defecto (vista clínica) ===== -->
        <!-- (homogeneidad) regla de capítulo antes del apéndice, como /ciencia. -->
        <hr class="chapter-rule" aria-hidden="true" />
        <section class="mb-14" aria-labelledby="tabla">
          <p class="eyebrow mb-2 block">{{ L('Para el equipo · referencia', 'For the team · reference') }}</p>
          <h2 id="tabla" class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]">{{ L('Apéndice: los focos en una tabla', 'Appendix: the foci in a table') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-2 max-w-3xl">{{ L('Tabla completa con la idoneidad como diana (estimación heurística orientativa, no validada), SUVmáx por trazador, tendencia, extensión metabólica medida y patrón, más los focos extra detectados de forma automática. Por defecto ordena por id (nivel anatómico, hecho neutro); pulsa una cabecera para reordenar —incluida la de idoneidad. Los focos detectados por IA van siempre al final, en su propio grupo, sin confirmar.', 'Full table with suitability as a target (an indicative heuristic estimate, not validated), SUVmax per tracer, trend, measured metabolic extent and pattern, plus the automatically detected extra foci. It defaults to id order (anatomical level, a neutral fact); click a header to re-sort — including the suitability one. AI-detected foci always go last, in their own group, unconfirmed.') }}</p>
          <!-- (A · a11y) declara la tabla como ALTERNATIVA TEXTUAL del visor 3D y del
               esquema del esqueleto (la fuente-de-verdad accesible). id en su <caption>. -->
          <p id="tabla-focos-alt-note" class="text-[12px] text-tinta leading-relaxed mb-4 max-w-3xl">
            <Icon name="ph:table" class="inline w-3.5 h-3.5 -mt-0.5 mr-1" aria-hidden="true" />{{ L('Esta tabla es la alternativa textual del visor 3D y del esquema del esqueleto: las mismas cifras de cada foco, en texto y navegables. La fila del foco que tengas seleccionado arriba aparece resaltada aquí.', 'This table is the textual alternative to the 3D viewer and the skeleton schematic: the same per-focus figures, in text and navigable. The row of the focus you have selected above is highlighted here.') }}
          </p>
          <!-- ── MANIFIESTO DE DATOS · descarga (CSV/JSON) + nota de validación ──
               El dato vive en un manifiesto con procedencia campo a campo (medido
               vs interpretado) y se descarga: el activo que un equipo externo clona
               para SU caso. Anti-PHI: solo ids #1–19, sin datos de paciente. -->
          <div class="data-card manifest-card mb-5">
            <div class="px-4 py-3">
              <p class="eyebrow--sm text-berenjena mb-1 flex items-center gap-2 flex-wrap">
                {{ L('Manifiesto de datos · descargable', 'Data manifest · downloadable') }}
                <span class="status-badge status-badge--active">{{ manifestValidated ? L('validado', 'validated') : L('revisar', 'review') }}</span>
              </p>
              <p class="text-[12px] text-tinta leading-relaxed mb-3 max-w-3xl">{{ L('Los 19 focos con sus valores y su PROCEDENCIA campo a campo: de dónde sale cada cifra (informe · medición sobre el DICOM · RMN literal · derivado · aproximado-IA) y si es MEDIDA (SUVmáx, mm, ml) o INTERPRETADA (morfología, fenotipo, score). El JSON incluye el esquema (el contrato clonable). Solo ids sintéticos #1–19, sin datos de paciente.', 'The 19 foci with their values and field-by-field PROVENANCE: where each figure comes from (report · DICOM measurement · MRI verbatim · derived · AI-approximate) and whether it is MEASURED (SUVmax, mm, ml) or INTERPRETED (morphology, phenotype, score). The JSON includes the schema (the clonable contract). Synthetic ids #1–19 only, no patient data.') }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="manifest-dl" @click="downloadManifestCsv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  {{ L('Descargar CSV', 'Download CSV') }}
                </button>
                <button type="button" class="manifest-dl" @click="downloadManifestJson">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  {{ L('Descargar JSON (+ esquema)', 'Download JSON (+ schema)') }}
                </button>
              </div>
              <p class="text-[11.5px] text-tinta leading-relaxed mt-2.5">
                {{ manifestValidated
                  ? L('Validación: el manifiesto deriva de los mismos valores que la tabla y reproduce, por construcción, cada SUVmáx y score que se muestran arriba (verificado en build). No recalcula precisión: separa lo medido de lo interpretado.', 'Validation: the manifest derives from the same values as the table and reproduces, by construction, every SUVmax and score shown above (verified at build). It does not recompute precision: it separates measured from interpreted.')
                  : L('Aviso: el manifiesto no cuadra con la tabla — revisar antes de publicar.', 'Notice: the manifest does not match the table — review before publishing.') }}
              </p>
              <!-- LEYENDA de los marcadores de procedencia · UNA sola vez (aquí, junto
                   al manifiesto). En la ficha y la tabla los marcadores van MUDOS;
                   su significado se lee aquí. Deriva de PROV_MARK/PROV_LABEL → misma
                   fuente que los marcadores y que el export (no se desincroniza). -->
              <ProvLegend class="mt-3" />
            </div>
          </div>

          <details class="notes-disclosure" open>
            <summary>{{ L('Abrir la tabla y los focos extra', 'Open the table and extra foci') }}</summary>
          <p class="text-[12px] text-tinta mt-3 mb-4 leading-relaxed max-w-3xl">
            {{ L('Pulsa una cabecera para ordenar. Primero van los focos del informe oficial y, al final, en su propio grupo, los detectados por IA (medidas aproximadas sobre los DICOM, por confirmar con Medicina Nuclear). La extensión metabólica es lo que cada foco capta por encima del umbral (41% del SUVmáx local), confinado a hueso; no es el tamaño anatómico exacto y el volumen parcial subestima los focos < ~10 mm.',
                  'Click a header to sort. Report foci come first and, at the end, in their own group, the AI-detected ones (approximate DICOM measurements, to confirm with Nuclear Medicine). The metabolic extent is what each focus takes up above the threshold (41% of the local SUVmax), confined to bone; it is not the exact anatomical size and partial volume underestimates foci < ~10 mm.') }}
          </p>
          <div class="data-card overflow-x-auto tabla-focos">
            <table class="data-table data-table--dense">
              <!-- (A · a11y) CAPTION = nombre accesible de la tabla y ANCLA de la
                   alternativa textual del visor 3D (id tabla-focos-alt, referenciada
                   por aria-describedby desde el listbox del esqueleto/lista y el
                   visor). La fila del foco seleccionado se marca aria-selected. -->
              <caption id="tabla-focos-alt" class="sr-only">
                {{ L('Tabla de valores por foco: la alternativa textual del visor 3D y del esquema del esqueleto. Cada fila es un foco con su localización, lado, idoneidad (estimación heurística orientativa), SUVmáx de ⁶⁸Ga-DOTATOC y ¹⁸F-FDG, ¹⁸F-FDG previo y su cambio, extensión metabólica medida y patrón. La fila del foco seleccionado aparece marcada como seleccionada. Pulsa una cabecera para ordenar.', 'Per-focus values table: the textual alternative to the 3D viewer and the skeleton schematic. Each row is a focus with its location, side, suitability (an indicative heuristic estimate), ⁶⁸Ga-DOTATOC and ¹⁸F-FDG SUVmax, prior ¹⁸F-FDG and its change, measured metabolic extent and pattern. The selected focus row is marked as selected. Click a header to sort.') }}
              </caption>
              <thead>
                <tr>
                  <th scope="col" :aria-sort="ariaSort('id')"><button type="button" class="th-sort" @click="sortBy('id')"># <span class="th-arrow">{{ sortArrow('id') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('level')"><button type="button" class="th-sort" @click="sortBy('level')">{{ L('Localización', 'Location') }} <span class="th-arrow">{{ sortArrow('level') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('side')"><button type="button" class="th-sort" @click="sortBy('side')">{{ L('Lado', 'Side') }} <span class="th-arrow">{{ sortArrow('side') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('suit')"><button type="button" class="th-sort" @click="sortBy('suit')">{{ L('Idoneidad', 'Suitability') }} <span class="th-arrow">{{ sortArrow('suit') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('dota')"><button type="button" class="th-sort" @click="sortBy('dota')">{{ L('⁶⁸Ga SUVmáx', '⁶⁸Ga SUVmax') }} <span class="th-arrow">{{ sortArrow('dota') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('fdg')"><button type="button" class="th-sort" @click="sortBy('fdg')">{{ L('¹⁸F-FDG SUVmáx', '¹⁸F-FDG SUVmax') }} <span class="th-arrow">{{ sortArrow('fdg') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('prev')"><button type="button" class="th-sort" @click="sortBy('prev')">{{ L('¹⁸F-FDG previo', 'Prior ¹⁸F-FDG') }} <span class="th-arrow">{{ sortArrow('prev') }}</span></button></th>
                  <th scope="col" :aria-sort="ariaSort('delta')"><button type="button" class="th-sort" @click="sortBy('delta')">Δ ¹⁸F-FDG <span class="th-arrow">{{ sortArrow('delta') }}</span></button></th>
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
                <tr v-else class="cursor-pointer" :aria-selected="selected === row.le.id" :class="selected === row.le.id ? 'bg-[rgba(157,68,171,0.08)]' : (isAiDavid(row.le) ? 'ai-row' : '')" @click="pickAndShow(row.le.id)">
                  <template v-if="row.kind === 'lesion'">
                  <th scope="row" class="!font-normal !text-left"><span class="inline-flex w-6 h-6 rounded-full items-center justify-center  text-xs font-semibold" :class="isAiDavid(row.le) ? 'ai-dot' : ''" :style="{ background: phenoColor(row.le), color: markerInk(row.le) }">{{ row.le.id }}</span></th>
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
                  <td class="font-mono" :title="provTitle(row.le, 'dota')"><span :class="{ 'data-soft': isAiDavid(row.le) }">{{ row.le.dota != null ? (isAiDavid(row.le) ? '~' : '') + row.le.dota.toFixed(1) : '—' }}</span></td>
                  <td class="font-mono" :title="provTitle(row.le, 'fdg')"><span :class="{ 'data-soft': isAiDavid(row.le) }">{{ row.le.fdg != null ? (isAiDavid(row.le) ? '~' : '') + row.le.fdg.toFixed(1) : '—' }}</span></td>
                  <td class="font-mono text-tinta">{{ row.le.prevFdg != null ? row.le.prevFdg.toFixed(1) : '—' }}</td>
                  <td class="font-mono" :style="deltaStyle(row.le)">{{ deltaFdg(row.le) }}</td>
                  <td class="font-mono text-tinta whitespace-nowrap">{{ metExtentLabel(row.le) }}</td>
                  <td class="text-sm">
                    <span class="flex items-center gap-2">
                      <span class="inline-flex h-2.5 w-12 shrink-0 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" aria-hidden="true">
                        <span :style="{ width: (neShare(row.le) * 100).toFixed(0) + '%', background: GA_FILL }" />
                        <span :style="{ width: ((1 - neShare(row.le)) * 100).toFixed(0) + '%', background: FDG_FILL }" />
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
            <h2 id="cockpit" class="heading-display text-2xl text-berenjena scroll-mt-[5.5rem]">{{ L('Cómo se lee · desglose del caso', 'How to read it · case breakdown') }}</h2>
            <p class="text-[11px] text-tinta">{{ L('la codificación de los dos trazadores y la concordancia · sin interpretación', 'the two-tracer coding and concordance · no interpretation') }}</p>
          </div>
          <!-- Las cifras del caso (carga, reparto, rangos SUV, evolución) viven ARRIBA en
               la banda de contexto (#contexto-general); aquí NO se repiten. Esta sección
               conserva lo único: concordancia SSTR↔glucólisis, resumen para el equipo y la
               leyenda «cómo se lee» (#dos-caras), clave de color de toda la página. -->

          <!-- DESGLOSE secundario plegado: concordancia + trayectoria + resumen +
               «cómo se lee» (los dos trazadores). Es contexto, no debe apelotonar el
               héroe → se abre a demanda. -->
          <details class="notes-disclosure">
            <summary>{{ L('Ver el desglose: concordancia, trayectoria, cómo se lee y resumen para el equipo', 'See the breakdown: concordance, trajectory, how to read it and summary for the team') }}</summary>

          <!-- concordancia (barra apilada) + trayectoria FDG -->
          <div class="grid md:grid-cols-2 gap-4 mt-4">
            <div class="card-base !p-4">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('Concordancia SSTR ↔ glucólisis', 'SSTR ↔ glycolysis concordance') }}</p>
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
                    <span v-if="concNarrow(concordance.agg)" :style="{ color: FDG_TEXT }">{{ concordance.agg }}</span>
                  </div>
                </div>
                <div class="flex h-7 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]" role="img"
                  :aria-label="L(concordance.ne + ' SSTR-dominantes, ' + concordance.mix + ' con captación dual, ' + concordance.agg + ' glucolítico-dominante', concordance.ne + ' SSTR-dominant, ' + concordance.mix + ' dual uptake, ' + concordance.agg + ' glycolytic-dominant')">
                  <div v-if="concordance.ne" :style="{ width: concPct(concordance.ne), background: GA_FILL }" class="flex items-center justify-center text-[12px] font-semibold text-berenjena">{{ concNarrow(concordance.ne) ? '' : concordance.ne }}</div>
                  <div v-if="concordance.mix" :style="{ width: concPct(concordance.mix), background: PHENO.mixBal.c }" class="flex items-center justify-center text-[12px] font-semibold text-berenjena">{{ concNarrow(concordance.mix) ? '' : concordance.mix }}</div>
                  <div v-if="concordance.agg" :style="{ width: concPct(concordance.agg), background: FDG_FILL }" class="flex items-center justify-center text-[12px] font-semibold text-berenjena">{{ concNarrow(concordance.agg) ? '' : concordance.agg }}</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-tinta">
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: GA_FILL }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.ne }}</span> {{ L('SSTR-dominante (⁶⁸Ga⁺/FDG⁻)', 'SSTR-dominant (⁶⁸Ga⁺/FDG⁻)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: '#df7a44' }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.mix }}</span> {{ L('captación dual (ambos)', 'dual uptake (both)') }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" :style="{ background: FDG_FILL }" /><span class="font-semibold tabular-nums text-berenjena">{{ concordance.agg }}</span> {{ L('glucolítico-dominante (⁶⁸Ga⁻/FDG⁺)', 'glycolytic-dominant (⁶⁸Ga⁻/FDG⁺)') }}</span>
              </div>
            </div>
            <div class="card-base !p-4">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('Captación glucolítica (¹⁸F-FDG) vs estudio previo', 'Glycolytic uptake (¹⁸F-FDG) vs prior study') }}</p>
              <div class="grid grid-cols-4 gap-2 text-center">
                <div><div class="font-display text-2xl" :style="{ color: FDG_TEXT }">{{ trajectory.neu }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('nuevos', 'new') }}</div></div>
                <div><div class="font-display text-2xl" :style="{ color: FDG_TEXT }">↑ {{ trajectory.up }}</div><div class="text-[11px] text-tinta mt-0.5">{{ L('más FDG', 'more FDG') }}</div></div>
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
                'Enfermedad ósea multinivel. ' + confirmedFoci.length + ' focos en el informe oficial (' + skeletonSplit.axial + ' axiales — columna y sacro — y ' + skeletonSplit.append + ' apendiculares — escápula, pelvis y cadera), más ' + aiFoci.length + ' focos por confirmar detectados por IA. Reparto SSTR↔glucólisis: ' + concordance.ne + ' SSTR-dominantes (⁶⁸Ga⁺/FDG⁻), ' + concordance.mix + ' con captación dual (ambos trazadores) y ' + concordance.agg + ' glucolítico-dominante (⁶⁸Ga⁻/FDG⁺). Rango de SUVmáx: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Frente al PET previo (sobre ' + trajectory.withPrev + ' focos con valor previo): ' + trajectory.neu + ' nuevos, ' + trajectory.up + ' con mayor ¹⁸F-FDG, ' + trajectory.down + ' con menor y ' + trajectory.stable + ' estables. Las cifras son las de los informes oficiales del PET; el detalle por foco está en la ficha y en la tabla.',
                'Multilevel bone disease. ' + confirmedFoci.length + ' foci in the official report (' + skeletonSplit.axial + ' axial — spine and sacrum — and ' + skeletonSplit.append + ' appendicular — scapula, pelvis and hip), plus ' + aiFoci.length + ' foci to confirm detected by AI. SSTR↔glycolysis split: ' + concordance.ne + ' SSTR-dominant (⁶⁸Ga⁺/FDG⁻), ' + concordance.mix + ' with dual uptake (both tracers) and ' + concordance.agg + ' glycolytic-dominant (⁶⁸Ga⁻/FDG⁺). SUVmax range: ⁶⁸Ga-DOTATOC ' + dotaRangeLabel + '; ¹⁸F-FDG ' + fdgRangeLabel + '. Versus the prior PET (over ' + trajectory.withPrev + ' foci with a prior value): ' + trajectory.neu + ' new, ' + trajectory.up + ' with higher ¹⁸F-FDG, ' + trajectory.down + ' with lower and ' + trajectory.stable + ' stable. Figures are those of the official PET reports; the per-focus detail is in the card and the table.') }}
            </p>
          </div>

          <!-- ===== CÓMO SE LEE · una lesión, dos trazadores (referencia) =====
               Antes era una sección propia que apelotonaba el intro; ahora vive
               dentro de este desglose plegado, como material de referencia. -->
          <div id="dos-caras" class="mt-6 pt-5 border-t border-[rgba(45,27,61,0.1)] scroll-mt-[5.5rem]">
          <p class="eyebrow mb-2 block">{{ L('Cómo se lee · una lesión, dos trazadores', 'How to read it · one lesion, two tracers') }}</p>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L(
              'Cada foco óseo se estudia con dos trazadores PET, cada uno sensible a una propiedad distinta del mismo punto: ⁶⁸Ga-DOTATOC mide la densidad de receptores de somatostatina (SSTR) y ¹⁸F-FDG mide el metabolismo glucolítico. Comparar ambas captaciones define el patrón de discordancia de trazadores de cada lesión.',
              'Each bone focus is studied with two PET tracers, each sensitive to a different property of the same spot: ⁶⁸Ga-DOTATOC measures somatostatin-receptor (SSTR) density and ¹⁸F-FDG measures glycolytic metabolism. Comparing the two uptakes defines each lesion’s tracer-discordance pattern.') }}
          </p>

          <!-- leyenda de la barra dual SSTR ↔ glucólisis (codificación canónica) -->
          <div class="card-base !p-4">
            <p class="eyebrow--sm text-berenjena mb-2">{{ L('La barra SSTR ↔ glucólisis', 'The SSTR ↔ glycolysis bar') }}</p>
            <div class="flex items-center gap-3">
              <div class="flex-1 flex h-3.5 rounded-full overflow-hidden border border-[rgba(45,27,61,0.1)]">
                <div style="width: 58%; background: #1c969e" />
                <div style="width: 42%; background: #d66e1c" />
              </div>
            </div>
            <div class="flex justify-between text-[11px] mt-1.5">
              <span class="font-semibold" :style="{ color: GA_TEXT }">{{ L('SSTR · ⁶⁸Ga', 'SSTR · ⁶⁸Ga') }}</span>
              <span class="font-semibold" :style="{ color: FDG_TEXT }">{{ L('glucólisis · ¹⁸F-FDG', 'glycolysis · ¹⁸F-FDG') }}</span>
            </div>
            <p class="text-[12px] text-tinta leading-relaxed mt-2">
              {{ L('En cada ficha y cada fila, la proporción violeta↔coral resume la captación SSTR frente a la glucolítica del foco. El color recorre el eje de discordancia, del violeta (SSTR-dominante) al coral (glucolítico-dominante).',
                    'On every card and row, the violet↔coral share sums up the focus’s SSTR versus glycolytic uptake. Color runs along the discordance axis, from violet (SSTR-dominant) to coral (glycolytic-dominant).') }}
            </p>
          </div>

          <!-- los tres patrones (por trazador) -->
          <div class="grid sm:grid-cols-3 gap-3 mt-4">
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: GA_FILL }">
              <p class="font-semibold text-sm mb-1" :style="{ color: GA_TEXT }">{{ L('⁶⁸Ga⁺ / FDG⁻', '⁶⁸Ga⁺ / FDG⁻') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Captación SSTR con glucólisis ausente o mínima.', 'SSTR uptake with absent or minimal glycolysis.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: '#df7a44' }">
              <p class="font-semibold text-sm mb-1" :style="{ color: '#8a5a1a' }">{{ L('Captación dual (ambos)', 'Dual uptake (both)') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Capta ambos trazadores: SSTR y glucólisis a la vez.', 'Takes up both tracers: SSTR and glycolysis at once.') }}</p>
            </div>
            <div class="card-base !p-4 border-t-4" :style="{ borderColor: FDG_FILL }">
              <p class="font-semibold text-sm mb-1" :style="{ color: FDG_TEXT }">{{ L('FDG⁺ / ⁶⁸Ga⁻', 'FDG⁺ / ⁶⁸Ga⁻') }}</p>
              <p class="text-[13px] text-tinta leading-snug">{{ L('Glucólisis sin SSTR detectable: discordancia de trazadores.', 'Glycolysis without detectable SSTR: tracer discordance.') }}</p>
            </div>
          </div>
          </div>
          </details>
        </section>

        <!-- «Qué significa cada patrón» fundido en el héroe (Zona A) -->

        <!-- fuentes + SALVEDADES (bloque ÚNICO de caveats de cuantificación y encuadre) -->
        <details id="metodo-caveats" class="notes-disclosure scroll-mt-[5.5rem]">
          <summary>{{ L('Fuentes, método y salvedades', 'Sources, method and caveats') }}</summary>
          <p class="mt-3 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'Fuentes. SUV y localizaciones: informe PET-CT ¹⁸F-FDG 24/03/2026 e informe PET-CT ⁶⁸Ga-DOTATOC 26/05/2026 (Medicina Nuclear, H. Virgen de la Arrixaca). Imágenes PET: MIP, fusión sagital y cortes axiales reconstruidos de los DICOM (PET con corrección de atenuación + TC). RMN: cortes sagitales de columna cervical y dorsal (STIR y T1) exportados de los DICOM; solo para visualización, pendientes de lectura radiológica formal. Los SUV recalculados de los DICOM concuerdan con el informe dentro de ~10–12% (diferencia esperable voxel-máx ↔ ROI).',
              'Sources. SUV and locations: ¹⁸F-FDG PET-CT report 24/03/2026 and ⁶⁸Ga-DOTATOC PET-CT report 26/05/2026 (Nuclear Medicine, Virgen de la Arrixaca Hospital). PET images: MIP, sagittal fusion and axial slices reconstructed from the DICOM (attenuation-corrected PET + CT). MRI: sagittal cervical and thoracic spine slices (STIR and T1) exported from the DICOM; visualization only, pending formal radiology reading. SUVs recomputed from the DICOM agree with the report within ~10–12% (expected voxel-max ↔ ROI difference).') }}
          </p>
          <p class="mt-2 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'Qué mide cada lectura. ⁶⁸Ga-DOTATOC (SSTR) = densidad de receptores de somatostatina; ¹⁸F-FDG = metabolismo glucolítico; «blástico/lítico/mixto» = FORMA del hueso por densidad TC, no biología ni un tercer trazador. La extensión metabólica es lo que se capta por encima del umbral (41% del SUVmáx local), confinada a hueso, no el tamaño anatómico exacto.',
              'What each reading measures. ⁶⁸Ga-DOTATOC (SSTR) = somatostatin-receptor density; ¹⁸F-FDG = glycolytic metabolism; “blastic/lytic/mixed” = bone SHAPE by CT density, not biology or a third tracer. The metabolic extent is what is taken up above the threshold (41% of the local SUVmax), confined to bone, not the exact anatomical size.') }}
          </p>
          <p class="mt-2 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'Salvedades de cuantificación (válidas para TODA la página). El SUVmáx es un valor de vóxel único sujeto a efecto de volumen parcial (subestima focos < ~10 mm). Los dos PET no son simultáneos (FDG 24/03, ⁶⁸Ga 26/05). Ambos trazadores se administraron por reservorio (port-a-cath): una posible actividad residual subestimaría globalmente los SUV (no recalculable, no afecta a las comparaciones relativas). Puede haber captación fisiológica o artefacto. La página DESCRIBE hallazgos de imagen; no concluye ni es consejo médico — la lectura formal y la selección final de la diana corresponden al radiólogo y al comité de tumores.',
              'Quantification caveats (apply to the WHOLE page). SUVmax is a single-voxel value subject to partial-volume effect (underestimates foci < ~10 mm). The two PET studies are not simultaneous (FDG 24/03, ⁶⁸Ga 26/05). Both tracers were given via a port (port-a-cath): possible residual activity would underestimate SUVs globally (not recalculable; does not affect relative comparisons). Physiologic uptake or artifact may occur. The page DESCRIBES imaging findings; it does not conclude and is not medical advice — formal reading and final target selection rest with the radiologist and the tumor board.') }}
          </p>
          <!-- BLOQUE CANÓNICO · los 4 caveats que un médico nuclear usa para juzgar la página
               (consagrados aquí UNA sola vez; el resto de la página remite a este bloque). -->
          <p class="mt-2 text-xs text-tinta leading-relaxed font-mono">
            {{ L(
              'Las cuatro salvedades de método (clave para leer la página). (1) El score de idoneidad es HEURÍSTICO, con pesos puestos a mano y NO validado contra resultados de biopsia: orienta, no es una probabilidad medida. (2) La comparación inter-estudio (p. ej. ¹⁸F-FDG actual vs. previo) solo es válida con el mismo trazador, equipo y reconstrucción; entre trazadores distintos (⁶⁸Ga vs. ¹⁸F-FDG) no se restan SUV. (3) Los valores por vértice del modelo 3D son una PROYECCIÓN del PET sobre la malla, no un SUVmáx cuantificado: indican dónde, no cuánto. (4) Co-registro espacial: el ¹⁸F-FDG (24/03/2026) y el ⁶⁸Ga-DOTATOC (26/05/2026) son estudios de FECHAS DISTINTAS co-registrados sobre la malla del TC; el solapamiento tiene un error de varios milímetros (localización aproximada por co-registro), no una fusión exacta.',
              'The four method caveats (key to reading the page). (1) The suitability score is HEURISTIC, with hand-set weights and NOT validated against biopsy outcomes: it orients, it is not a measured probability. (2) Inter-study comparison (e.g. current vs. prior ¹⁸F-FDG) is only valid with the same tracer, scanner and reconstruction; SUVs are not subtracted across different tracers (⁶⁸Ga vs. ¹⁸F-FDG). (3) The per-vertex values of the 3D model are a PROJECTION of the PET onto the mesh, not a quantified SUVmax: they show where, not how much. (4) Spatial co-registration: ¹⁸F-FDG (24/03/2026) and ⁶⁸Ga-DOTATOC (26/05/2026) are studies from DIFFERENT dates co-registered onto the CT mesh; the overlay carries an error of several millimeters (approximate localization by co-registration), not an exact fusion.') }}
          </p>
        </details>

        <!-- ╔══════════════ MÉTODO · cómo se construye esto (y cómo clonarlo) ══════════════╗
             Lo que vuelve este caso un PATRÓN: el MÉTODO y el ESQUEMA publicados como un
             contrato clonable, no un efecto. Sobrio y honesto: marca lo reproducible con
             herramientas open-source frente a lo que fue medición propia sobre los DICOM;
             no inventa comandos que no se puedan verificar. Plegable para el lector casual,
             COMPLETO para quien lo clona. -->
        <section id="metodo" class="mt-12 pt-8 border-t border-[rgba(45,27,61,0.12)] scroll-mt-[5.5rem]" aria-labelledby="metodo-titulo">
          <p class="eyebrow mb-2 block">{{ L('Método · reproducible', 'Method · reproducible') }}</p>
          <div class="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-1 mb-2">
            <h2 id="metodo-titulo" class="heading-display text-2xl text-berenjena">{{ L('Cómo se construye esto (y cómo clonarlo)', 'How this is built (and how to clone it)') }}</h2>
            <p class="text-[11px] text-tinta">{{ L('el pipeline + el esquema, publicados como contrato', 'the pipeline + the schema, published as a contract') }}</p>
          </div>
          <p class="text-sm text-tinta leading-relaxed mb-4 max-w-3xl">
            {{ L(
              'Lo que hace esta página reutilizable no es el visor 3D: es que el MÉTODO y el ESQUEMA del dato están publicados como un contrato que otro caso N-of-1 rellena con LOS SUYOS. Aquí abajo, el pipeline paso a paso, las herramientas open-source que intervienen, sus límites, y el esquema descargable.',
              'What makes this page reusable is not the 3D viewer: it is that the data METHOD and SCHEMA are published as a contract that another N-of-1 case fills in with THEIRS. Below: the pipeline step by step, the open-source tools involved, their limits, and the downloadable schema.') }}
          </p>

          <details class="notes-disclosure">
            <summary>{{ L('Abrir el método completo (pipeline · esquema-contrato · fork esto · principios)', 'Open the full method (pipeline · schema-contract · fork this · principles)') }}</summary>

            <!-- 1 · EL PIPELINE PASO A PASO -->
            <div class="mt-4">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('1 · El pipeline, paso a paso', '1 · The pipeline, step by step') }}</p>
              <p class="text-[13px] text-tinta leading-relaxed mb-3 max-w-3xl">
                {{ L(
                  'De dos estudios PET-CT con trazadores distintos a un instrumento navegable. Cada paso declara qué herramienta open-source interviene y dónde está su límite.',
                  'From two PET-CT studies with different tracers to a navigable instrument. Each step declares which open-source tool is involved and where its limit lies.') }}
              </p>
              <ol class="method-steps">
                <li>
                  <span class="method-step__n">1</span>
                  <div>
                    <p class="method-step__h">{{ L('Entrada · doble trazador PET-CT', 'Input · dual-tracer PET-CT') }}</p>
                    <p class="method-step__b">{{ L(
                      'Dos PET-CT del mismo paciente: ⁶⁸Ga-DOTATOC (receptores de somatostatina, SSTR) y ¹⁸F-FDG (glucólisis), con sus informes de Medicina Nuclear. Lo que ENTRA: las series DICOM (PET con corrección de atenuación + TC) y el texto de los informes.',
                      'Two PET-CT studies of the same patient: ⁶⁸Ga-DOTATOC (somatostatin receptors, SSTR) and ¹⁸F-FDG (glycolysis), with their Nuclear Medicine reports. What ENTERS: the DICOM series (attenuation-corrected PET + CT) and the report text.') }}</p>
                  </div>
                </li>
                <li>
                  <span class="method-step__n">2</span>
                  <div>
                    <p class="method-step__h">{{ L('Co-registro sobre la malla del TC', 'Co-registration onto the CT mesh') }}</p>
                    <p class="method-step__b">{{ L(
                      'Los dos estudios se llevan a un marco espacial común: la malla del TC. Caveat declarado: son de FECHAS DISTINTAS (¹⁸F-FDG 24/03/2026, ⁶⁸Ga-DOTATOC 26/05/2026), así que el solapamiento es una localización aproximada por co-registro, con error de varios milímetros, no una fusión exacta.',
                      'The two studies are brought into a common spatial frame: the CT mesh. Declared caveat: they are from DIFFERENT dates (¹⁸F-FDG 24/03/2026, ⁶⁸Ga-DOTATOC 26/05/2026), so the overlay is an approximate localization by co-registration, with an error of several millimeters, not an exact fusion.') }}</p>
                  </div>
                </li>
                <li>
                  <span class="method-step__n">3</span>
                  <div>
                    <p class="method-step__h">{{ L('Eje de discordancia · SSTR ↔ glucólisis', 'Discordance axis · SSTR ↔ glycolysis') }}</p>
                    <p class="method-step__b">{{ L(
                      'Por foco se compara la captación de cada trazador (SUVmáx) y se sitúa la lesión en el eje SSTR-dominante (⁶⁸Ga⁺/FDG⁻) ↔ glucolítico-dominante (⁶⁸Ga⁻/FDG⁺). NO se restan SUV entre trazadores distintos: el eje es cualitativo, describe el patrón.',
                      'Per focus, each tracer’s uptake (SUVmax) is compared and the lesion is placed on the SSTR-dominant (⁶⁸Ga⁺/FDG⁻) ↔ glycolytic-dominant (⁶⁸Ga⁻/FDG⁺) axis. SUVs are NOT subtracted across different tracers: the axis is qualitative, it describes the pattern.') }}</p>
                  </div>
                </li>
                <li>
                  <span class="method-step__n">4</span>
                  <div>
                    <p class="method-step__h">{{ L('Idoneidad · heurística declarada', 'Suitability · declared heuristic') }}</p>
                    <p class="method-step__b">{{ L(
                      'Un score 0–100 de idoneidad como diana de biopsia, con pesos puestos a mano y NO validado contra resultados de biopsia. Orienta, no es una probabilidad medida: se ofrece como lente opt-in, nunca como el orden por defecto ni un veredicto.',
                      'A 0–100 score of suitability as a biopsy target, with hand-set weights and NOT validated against biopsy outcomes. It orients, it is not a measured probability: offered as an opt-in lens, never as the default order or a verdict.') }}</p>
                  </div>
                </li>
                <li>
                  <span class="method-step__n">5</span>
                  <div>
                    <p class="method-step__h">{{ L('Visor 3D · máscaras óseas + proyección del PET', '3D viewer · bone masks + PET projection') }}</p>
                    <p class="method-step__b">{{ L(
                      'La segmentación ósea del TC se obtiene con TotalSegmentator (open-source). Sobre esa malla se proyecta el PET por vértice para localizar cada foco. Caveat: el color por vértice es una PROYECCIÓN, indica dónde, no un SUVmáx cuantificado (≠ SUVmáx).',
                      'Bone segmentation from the CT is obtained with TotalSegmentator (open-source). The PET is projected per-vertex onto that mesh to localize each focus. Caveat: the per-vertex colour is a PROJECTION — it shows where, not a quantified SUVmax (≠ SUVmax).') }}</p>
                  </div>
                </li>
              </ol>
              <div class="method-tools mt-3">
                <p class="eyebrow--sm text-berenjena mb-1.5">{{ L('Herramientas open-source · y qué es medición propia', 'Open-source tools · and what is in-house measurement') }}</p>
                <ul class="text-[12.5px] text-tinta leading-relaxed space-y-1">
                  <li>{{ L(
                    '· TotalSegmentator — segmentación ósea automática del TC (open-source, reproducible públicamente sobre cualquier TC).',
                    '· TotalSegmentator — automatic bone segmentation from the CT (open-source, publicly reproducible on any CT).') }}</li>
                  <li>{{ L(
                    '· Reconstrucción / proyección PET → malla — el PET (corregido por atenuación) se proyecta sobre la malla del TC para situar los focos (pipeline propio sobre los DICOM).',
                    '· PET → mesh reconstruction / projection — the (attenuation-corrected) PET is projected onto the CT mesh to place the foci (in-house pipeline over the DICOM).') }}</li>
                  <li>{{ L(
                    '· Re-cuantificación de SUVmáx sobre el DICOM nativo — MEDICIÓN PROPIA (David) que verifica el informe; concuerda dentro de ~10–12% (voxel-máx ↔ ROI). No es el pipeline público.',
                    '· SUVmax re-quantification over the native DICOM — IN-HOUSE MEASUREMENT (David) that verifies the report; agrees within ~10–12% (voxel-max ↔ ROI). It is not the public pipeline.') }}</li>
                </ul>
              </div>
              <div class="method-limits mt-3">
                <p class="eyebrow--sm mb-1.5" style="color:#8a4a1a">{{ L('Los límites (honestos)', 'The limits (honest)') }}</p>
                <p class="text-[12.5px] text-tinta leading-relaxed max-w-3xl">{{ L(
                  'La proyección por vértice NO es un SUVmáx cuantificado (dónde, no cuánto). El score de idoneidad es heurístico, no validado. El co-registro es espacial y aproximado (fechas distintas, error de mm). El SUVmáx sufre volumen parcial (subestima focos < ~10 mm). Lo reproducible públicamente es la segmentación (TotalSegmentator) y el esquema del dato; la re-cuantificación sobre los DICOM fue medición propia, marcada como tal en cada cifra.',
                  'The per-vertex projection is NOT a quantified SUVmax (where, not how much). The suitability score is heuristic, not validated. Co-registration is spatial and approximate (different dates, mm error). SUVmax suffers partial volume (underestimates foci < ~10 mm). What is publicly reproducible is the segmentation (TotalSegmentator) and the data schema; the DICOM re-quantification was an in-house measurement, flagged as such in every figure.') }}</p>
                <p class="text-[12px] text-tinta mt-1.5"><a href="#metodo-caveats" class="link-action text-miriam font-semibold">{{ L('Las cuatro salvedades de método, en detalle ↑', 'The four method caveats, in detail ↑') }}</a></p>
              </div>
            </div>

            <!-- 2 · EL ESQUEMA-MANIFIESTO COMO CONTRATO CLONABLE -->
            <div class="mt-6 pt-5 border-t border-[rgba(45,27,61,0.1)]">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('2 · El esquema-manifiesto · un contrato clonable', '2 · The schema-manifest · a clonable contract') }}</p>
              <p class="text-[13px] text-tinta leading-relaxed mb-3 max-w-3xl">{{ L(
                'El dato vive en un manifiesto con procedencia campo a campo. Cada cifra es una celda con su esquema; otro caso rellena la misma estructura con SUS datos. El esquema viaja DENTRO del JSON descargable (es el contrato, no una etiqueta pintada encima).',
                'The data lives in a manifest with field-by-field provenance. Each figure is a cell with its schema; another case fills the same structure with THEIR data. The schema travels INSIDE the downloadable JSON (it is the contract, not a label painted on top).') }}</p>
              <pre class="method-schema" aria-label="Cell schema"><code>Cell {
  valor    : number | string | null   <span class="method-schema__c">// null = no aplica / no medido</span>
  unidad   : 'SUVmáx' | 'mm' | 'ml' | 'HU' | '0-100' | ''
  fecha    : ISO del estudio de origen ('' = sin fecha)
  trazador : '18F-FDG' | '68Ga-DOTATOC' | ''
  fuente   : 'informe' | 'dicom-medicion-david' | 'rmn-literal'
           | 'derivado' | 'aproximado'
  ref      : <span class="method-schema__c">// código de biopsia / nota (opcional)</span>
  medido   : boolean   <span class="method-schema__c">// true = MEDIDO (cantidad física) · false = INTERPRETADO</span>
}</code></pre>
              <p class="text-[12.5px] text-tinta leading-relaxed mt-3 max-w-3xl">{{ L(
                'El JSON incluye este esquema más los 19 focos. Anti-PHI: ids sintéticos #1–19, sin nombre ni nº de historia. Es la misma fuente que la tabla de arriba — lo que se ve es lo que se descarga.',
                'The JSON includes this schema plus the 19 foci. Anti-PHI: synthetic ids #1–19, no name or record number. It is the same source as the table above — what you see is what you download.') }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-3">
                <button type="button" class="manifest-dl" @click="downloadManifestJson">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  {{ L('Descargar el esquema + datos (JSON)', 'Download the schema + data (JSON)') }}
                </button>
                <button type="button" class="manifest-dl" @click="downloadManifestCsv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>
                  {{ L('Descargar el manifiesto (CSV)', 'Download the manifest (CSV)') }}
                </button>
              </div>
            </div>

            <!-- 3 · FORK ESTO -->
            <div class="mt-6 pt-5 border-t border-[rgba(45,27,61,0.1)]">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('3 · Fork esto · para otro caso N-of-1', '3 · Fork this · for another N-of-1 case') }}</p>
              <p class="text-[13px] text-tinta leading-relaxed max-w-3xl">{{ L(
                'Clona el esquema + el pipeline para tu caso: rellena la misma celda con TUS estudios (informes + DICOM), corre la segmentación con TotalSegmentator, proyecta tu PET sobre la malla, y conserva los principios. Lo que heredas no es un dato, es un MÉTODO: describe y equipa, no concluye; procedencia campo a campo; idoneidad opt-in heurística. Sin sobre-prometer: la segmentación y el esquema son reproducibles públicamente; la re-cuantificación sobre los DICOM dependerá de tu acceso a las imágenes nativas.',
                'Clone the schema + the pipeline for your case: fill the same cell with YOUR studies (reports + DICOM), run the segmentation with TotalSegmentator, project your PET onto the mesh, and keep the principles. What you inherit is not a datum, it is a METHOD: describe and equip, do not conclude; field-by-field provenance; opt-in heuristic suitability. Without over-promising: the segmentation and the schema are publicly reproducible; the DICOM re-quantification will depend on your access to the native images.') }}</p>
            </div>

            <!-- 4 · PRINCIPIOS DE HONESTIDAD (parte del método, no decoración) -->
            <div class="mt-6 pt-5 border-t border-[rgba(45,27,61,0.1)]">
              <p class="eyebrow--sm text-berenjena mb-2">{{ L('4 · Principios de honestidad · son parte del método', '4 · Honesty principles · they are part of the method') }}</p>
              <ul class="text-[12.5px] text-tinta leading-relaxed space-y-1.5 max-w-3xl">
                <li><span class="method-principle">{{ L('Describe / equipa, no concluye.', 'Describe / equip, do not conclude.') }}</span> {{ L('La página reúne la evidencia para que el equipo elija su diana; la lectura formal y la decisión son humanas.', 'The page gathers the evidence so the team can choose its target; the formal reading and the decision are human.') }}</li>
                <li><span class="method-principle">{{ L('Medido vs interpretado.', 'Measured vs interpreted.') }}</span> {{ L('Cada cifra declara si es una cantidad física medida (SUVmáx, mm, ml) o una lectura/regla (morfología, fenotipo, score). El manifiesto no inventa precisión.', 'Every figure declares whether it is a measured physical quantity (SUVmax, mm, ml) or a reading/rule (morphology, phenotype, score). The manifest does not invent precision.') }}</li>
                <li><span class="method-principle">{{ L('Idoneidad orientativa, no validada.', 'Suitability is indicative, not validated.') }}</span> {{ L('El score es heurístico (pesos a mano); se ofrece como lente, nunca se impone como veredicto ni como orden por defecto.', 'The score is heuristic (hand-set weights); offered as a lens, never imposed as a verdict or as the default order.') }}</li>
                <li><span class="method-principle">{{ L('Anti-PHI · ids sintéticos.', 'Anti-PHI · synthetic ids.') }}</span> {{ L('Solo focos #1–19; sin nombre, nº de historia ni metadatos de paciente, ni en la página, ni en la URL, ni en el export.', 'Only foci #1–19; no name, record number or patient metadata — not on the page, not in the URL, not in the export.') }}</li>
              </ul>
            </div>
          </details>
        </section>
        <!-- ╚══════════════ FIN MÉTODO ══════════════╝ -->

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
                <p class="foco-key-lb__sub">{{ petLightboxMode === 'grid' ? L('MIP y columna sagital · ⁶⁸Ga-DOTATOC (SSTR) y ¹⁸F-FDG (glucólisis)', 'MIP and sagittal spine · ⁶⁸Ga-DOTATOC (SSTR) and ¹⁸F-FDG (glycolysis)') : L('reconstruida de los DICOM · flechas ‹ › para recorrerlas · rueda/pinza para acercar', 'reconstructed from the DICOM · arrows ‹ › to browse · wheel/pinch to zoom') }}</p>
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
            <p class="foco-key-lb__cap">{{ L('Hueso reconstruido del CT con la captación PET co-registrada (los 3 mapas). Herramienta de visualización; su lectura formal corresponde al radiólogo.', 'Bone reconstructed from the CT with co-registered PET uptake (all 3 maps). A visualization tool; its formal reading belongs to the radiologist.') }}</p>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════════════════════════════════════════
   MOTION TOKENS · el movimiento del instrumento, con reglas (no ad-hoc).
   Tres curvas, una sola fuente; las transiciones de la página las citan en
   vez de inventar duración/easing sueltos. Codifican INTENCIÓN:
   · --ease-entrada  → algo APARECE / se asienta (expo-out, decidido, ~240ms)
   · --ease-salida   → algo se ATENÚA / suelta el foco (rápido, ~160ms)
   · --ease-spring   → SELECCIÓN (leve overshoot, «se engancha», ~320ms)
   Bajo prefers-reduced-motion los tres COLAPSAN a 0ms/linear: el mismo
   marcado anima o no anima sin tocar la plantilla. */
.overflow-x-clip {
  --ease-entrada: 240ms cubic-bezier(0.16, 1, 0.3, 1);
  --ease-salida: 160ms cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: 320ms cubic-bezier(0.34, 1.4, 0.64, 1);
}
@media (prefers-reduced-motion: reduce) {
  .overflow-x-clip {
    --ease-entrada: 0ms linear;
    --ease-salida: 0ms linear;
    --ease-spring: 0ms linear;
  }
}
/* Tarjeta de FOCO seleccionable (candidatas, lista del navegador, ranking, IA):
   el borde/fondo entran con el token de SELECCIÓN (spring, leve overshoot — «se
   engancha» al elegirla); al soltar el hover, salen con el token de salida. */
.foco-card {
  transition:
    border-color var(--ease-salida),
    background-color var(--ease-salida),
    box-shadow var(--ease-salida);
}
.foco-card:hover,
.foco-card[aria-pressed='true'] {
  transition:
    border-color var(--ease-spring),
    background-color var(--ease-spring),
    box-shadow var(--ease-spring);
}
/* ════════════════════════════════════════════════════════════════════════
   BRUSHING & LINKING · transición de la ATENUACIÓN (filtro) y del RESALTADO
   (hover compartido) en las 3 vistas de navegación. Una sola curva (los mismos
   motion tokens) para que esqueleto, scatter y tabla se modulen al unísono —
   un instrumento, no 3 gráficos. La opacidad va por estilo inline (focoOpacity/
   gOpacity); aquí solo se anima. El RESALTADO (anillo/escala/borde) usa
   --ease-entrada (se asienta) y la ATENUACIÓN --ease-salida (suelta el foco).
   Bajo prefers-reduced-motion los tokens ya colapsan a 0ms (sin movimiento). */
.sk-foco,
.sc-foco,
.list-foco {
  transition: opacity var(--ease-salida);
}
/* el marcador SVG (anillo del esqueleto/scatter) anima radio/trazo del resaltado
   de hover y de la selección con la curva de entrada (se engancha, sin saltos). */
.sk-marker {
  transition:
    r var(--ease-entrada),
    stroke var(--ease-entrada),
    stroke-width var(--ease-entrada);
}
/* Controles del navegador (flechas prev/next, chips de filtro, pasos de fecha):
   color/borde/fondo con los tokens — entrada al hover, salida al soltar. */
.nav-step,
.filter-chip,
.tl-date {
  transition: color var(--ease-salida), border-color var(--ease-salida), background-color var(--ease-salida);
}
.nav-step:hover,
.filter-chip:hover,
.tl-date:hover { transition: color var(--ease-entrada), border-color var(--ease-entrada), background-color var(--ease-entrada); }

/* ════════════════════════════════════════════════════════════════════════
   TIPOGRAFÍA DE INSTRUMENTO · toda cifra mono cuadra al píxel.
   font-variant-numeric: tabular-nums da a cada dígito el MISMO avance, así las
   columnas de SUVmáx/Δ/mm/ml/HU y los valores cuadran y no «bailan» al cambiar.
   En esta página el mono (JetBrains) es SIEMPRE dato o id → tabular global.
   (.data-table ya lo trae; aquí lo extendemos a las cifras fuera de la tabla.) */
.font-mono { font-variant-numeric: tabular-nums; }
/* Jerarquía de UNIDAD vs cifra: la unidad («SUVmáx», «HU», «/100») va volada,
   pequeña y atenuada; manda la cifra. El sufijo «aprox.» (≈) de un dato BLANDO. */
.unit {
  font-size: 0.66em;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #6b6470;
  vertical-align: 0.18em;
  margin-left: 0.15em;
}
/* DATO BLANDO · derivado/heurístico o aproximado (score de idoneidad, fenotipo,
   SUVmáx de los focos de IA): se lee MÁS LIGERO y algo atenuado que un dato DURO
   medido de informe. La tipografía codifica la dureza, sin falsa precisión. */
.data-soft {
  font-weight: 400;
  opacity: 0.82;
}
.data-soft__approx { opacity: 0.7; font-weight: 400; margin-right: 0.05em; }

/* ════════════════════════════════════════════════════════════════════════
   PROCEDENCIA VISIBLE (P2) · marcador MUDO por celda + leyenda + panel.
   El glyph (●◆▫▽~) y su color codifican la FUENTE; la forma rellena/abierta
   codifica MEDIDO vs INTERPRETADO. Discreto por diseño: no compite con la
   cifra, solo la acompaña. El significado se lee en la leyenda (una vez). */
.prov-dot {
  font-size: 0.74em;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0;
  /* el glyph hereda su color por estilo inline (el tono de la fuente). */
  cursor: help;
  user-select: none;
  vertical-align: 0.06em;
}
.prov-dot--lg { font-size: 0.95em; }

/* MEDIDO vs INTERPRETADO · micro-etiqueta (la distinción que un nuclear juzga).
   MEDIDO = sólido y algo más oscuro; INTERPRETADO = más ligero, en cursiva. */
.prov-mi { font-weight: 600; }
.prov-mi--measured { color: #1f6b57; }
.prov-mi--interp { color: #7a5a8a; font-style: italic; font-weight: 500; }

/* PANEL «Procedencia» del foco · lista cifra → origen (plegable, plegado). */
.prov-list { display: flex; flex-direction: column; gap: 0.5rem; }
.prov-list__row {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(45, 27, 61, 0.08);
}
.prov-list__row:last-child { border-bottom: 0; padding-bottom: 0; }

/* LEYENDA de los marcadores · una sola vez (junto al manifiesto y en el panel). */
.prov-legend {
  border: 1px solid rgba(45, 27, 61, 0.12);
  border-radius: 0.6rem;
  background: rgba(45, 27, 61, 0.03);
  padding: 0.65rem 0.8rem;
}
.prov-legend__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #2d1b3d;
  margin-bottom: 0.45rem;
}
.prov-legend__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.34rem 1.1rem;
}
@media (min-width: 560px) {
  .prov-legend__list { grid-template-columns: 1fr 1fr; }
}
.prov-legend--compact .prov-legend__list { grid-template-columns: 1fr; }
.prov-legend__item {
  display: flex;
  align-items: baseline;
  gap: 0.38rem;
  font-size: 12px;
  line-height: 1.3;
  color: #3a3340;
}
.prov-legend__label { flex: 0 1 auto; }
.prov-legend__sep { color: rgba(45, 27, 61, 0.32); flex: 0 0 auto; }
.prov-legend__note {
  font-size: 10.5px;
  line-height: 1.4;
  color: #6b6470;
  margin-top: 0.5rem;
}

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
.foco-detalle__chev { transition: transform var(--ease-entrada); }
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
  transition: box-shadow var(--ease-salida), border-color var(--ease-salida), transform var(--ease-salida);
}
.foco-key-thumb:hover { border-color: rgba(157, 68, 171, 0.55); box-shadow: 0 4px 16px rgba(45, 27, 61, 0.18); transition: box-shadow var(--ease-entrada), border-color var(--ease-entrada), transform var(--ease-entrada); }
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
  transition: box-shadow var(--ease-salida), border-color var(--ease-salida);
}
.foco-key-strip:hover { border-color: rgba(157, 68, 171, 0.5); box-shadow: 0 3px 14px rgba(45, 27, 61, 0.14); transition: box-shadow var(--ease-entrada), border-color var(--ease-entrada); }
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
  transition: box-shadow var(--ease-salida), border-color var(--ease-salida);
}
.foco-key-tile:hover .foco-key-tile__frame { transition: box-shadow var(--ease-entrada), border-color var(--ease-entrada); }
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
/* botón de descarga del manifiesto (CSV/JSON) — sobrio, misma familia que la
   descarga de imágenes clave */
.manifest-dl {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 34px;
  padding: 0 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fff;
  color: #2d1b3d;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.manifest-dl:hover { background: #f0e7f3; border-color: rgba(157, 68, 171, 0.5); }
.manifest-dl:focus-visible { outline: 2px solid #9d44ab; outline-offset: 1px; }
.manifest-card { background: #fbf7f0; }
/* ── Método · pasos del pipeline + esquema-contrato (sobrio, instrumento) ── */
.method-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.method-steps > li {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
}
.method-step__n {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #2d1b3d;
  color: #fdf6ef;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
}
.method-step__h {
  font-size: 0.82rem;
  font-weight: 600;
  color: #2d1b3d;
  line-height: 1.3;
}
.method-step__b {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #6b6470;
  margin-top: 0.1rem;
}
.method-schema {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(45, 27, 61, 0.12);
  background: #fbf7f0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  line-height: 1.6;
  color: #2d1b3d;
}
.method-schema code { font: inherit; color: inherit; }
.method-schema__c { color: #8a7f93; }
.method-principle { font-weight: 600; color: #2d1b3d; }
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
  transition: background var(--ease-salida), color var(--ease-salida);
}
.seg__btn:hover,
.seg__btn.is-active { transition: background var(--ease-entrada), color var(--ease-entrada); }
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
  transition: background var(--ease-salida), border-color var(--ease-salida);
}
.btn-expand3d:hover { background: #f0e7f3; border-color: rgba(157, 68, 171, 0.5); transition: background var(--ease-entrada), border-color var(--ease-entrada); }
.btn-expand3d:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }

/* ── Copiar enlace · permalink citable del foco ──────────────────────
   Mismo lenguaje visual que .btn-expand3d (pill, tokens DS) pero más
   compacto, para acompañar el título de la ficha sin pesar. El texto va
   SIEMPRE visible; el estado «copiado» tiñe el borde en verde. */
.btn-copylink {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.22rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.2);
  background: #fbf7f0;
  color: #2d1b3d;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--ease-salida), border-color var(--ease-salida), color var(--ease-salida);
}
.btn-copylink:hover { background: #f0e7f3; border-color: rgba(157, 68, 171, 0.5); transition: background var(--ease-entrada), border-color var(--ease-entrada), color var(--ease-entrada); }
.btn-copylink:focus-visible { outline: 2px solid #9d44ab; outline-offset: 2px; }
.btn-copylink--done { border-color: rgba(31, 107, 87, 0.55); color: #1f6b57; }
.btn-copylink--done:hover { background: #fbf7f0; border-color: rgba(31, 107, 87, 0.55); }

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
  .btn-copylink,
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

/* ════════════════════════════════════════════════════════════════════════
   MÓVIL / TÁCTIL · áreas de toque ≥44px en los CONTROLES DE NAVEGACIÓN.
   Solo en punteros gruesos (dedo): el escritorio (ratón) conserva su tamaño
   compacto. Aplica a las flechas prev/next, los chips de filtro, el play y
   los pasos de la línea de tiempo. El marcador 3D y su parpadeo NO se tocan.
   ════════════════════════════════════════════════════════════════════════ */
@media (pointer: coarse) {
  .nav-step { width: 44px; height: 44px; }
  .tl-play { width: 44px; height: 44px; }
  /* chips de filtro: alto cómodo sin reflujo del escritorio */
  .filter-chip { min-height: 38px; padding-top: 7px; padding-bottom: 7px; }
  /* pasos de fecha de la línea de tiempo: caja táctil con el padding ya puesto */
  .tl-date { min-height: 38px; display: inline-flex; align-items: center; }
  /* pulgar del slider de tiempo ≥24px (WebKit + Firefox) */
  .tl-range { height: 28px; }
  .tl-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 9999px;
    background: #2d1b3d;
    border: 2px solid #fbf7f0;
    box-shadow: 0 1px 3px rgba(45, 27, 61, 0.4);
    cursor: pointer;
  }
  .tl-range::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 9999px;
    background: #2d1b3d;
    border: 2px solid #fbf7f0;
    cursor: pointer;
  }
  /* botones de orden de la tabla: ya tienen min-height 44px (arriba); reforzar tap */
  .th-sort { min-width: 44px; }
  /* copiar-enlace de la ficha: caja táctil cómoda sin engordar el escritorio */
  .btn-copylink { min-height: 38px; padding-top: 6px; padding-bottom: 6px; }
}

/* OVERFLOW · las cadenas mono del detalle del foco (fórmulas, cifras concatenadas)
   ajustan en vez de desbordar el ancho a 320–430px. Acotado al detalle para no tocar
   las celdas tabulares de la tabla (que ya scrollean en su contenedor overflow-x-auto). */
.foco-detalle :deep(.font-mono) { overflow-wrap: anywhere; }

/* ════════════════════════════════════════════════════════════════════════
   STRESS-TEST · deslizadores de peso (uno por factor). Pista neutra + pulgar
   del color del factor (var --slider-accent). Táctil ≥44px en pointer:coarse.
   ════════════════════════════════════════════════════════════════════════ */
.stress-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  background: rgba(45, 27, 61, 0.12);
  outline: none;
  cursor: pointer;
}
.stress-slider:focus-visible { box-shadow: 0 0 0 3px rgba(157, 68, 171, 0.35); }
.stress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: var(--slider-accent, #9d44ab);
  border: 2px solid #fbf7f0;
  box-shadow: 0 1px 3px rgba(45, 27, 61, 0.4);
  cursor: pointer;
}
.stress-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: var(--slider-accent, #9d44ab);
  border: 2px solid #fbf7f0;
  box-shadow: 0 1px 3px rgba(45, 27, 61, 0.4);
  cursor: pointer;
}
@media (pointer: coarse) {
  /* caja táctil ≥44px sin engordar la pista visible (padding transparente) */
  .stress-slider {
    height: 44px;
    background: transparent;
    background-image: linear-gradient(rgba(45, 27, 61, 0.12), rgba(45, 27, 61, 0.12));
    background-size: 100% 6px;
    background-position: 0 center;
    background-repeat: no-repeat;
  }
  .stress-slider::-webkit-slider-thumb { width: 26px; height: 26px; }
  .stress-slider::-moz-range-thumb { width: 26px; height: 26px; }
}

/* REORDENAMIENTO EN VIVO · la demostración del stress-test es el MOVIMIENTO:
   al mover un peso, los focos se reubican con el token de SELECCIÓN (spring, leve
   overshoot → el reorden «se asienta»). Entrar/salir, con entrada/salida.
   (El token ya colapsa a 0ms/linear bajo prefers-reduced-motion.) */
.rank-flip-move { transition: transform var(--ease-spring); }
.rank-flip-enter-active { transition: opacity var(--ease-entrada), transform var(--ease-entrada); }
.rank-flip-leave-active { transition: opacity var(--ease-salida), transform var(--ease-salida); }
.rank-flip-enter-from,
.rank-flip-leave-to { opacity: 0; }
.rank-flip-leave-active { position: absolute; width: 100%; }
</style>
