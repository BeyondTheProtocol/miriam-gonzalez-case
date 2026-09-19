/**
 * Datos del mapa de metástasis óseas COMPARTIDOS entre /mapa-metastasis y /panorama.
 * Movidos TAL CUAL desde app/pages/mapa-metastasis.vue (19-sep-2026): una sola fuente
 * para los 19 focos, su color por trazador y la geometría del esquema del esqueleto.
 * Cambiar un dato aquí lo cambia en las dos páginas.
 */
export const TRACER = {
  ga:  { fill: '#1c969e', text: '#0c5a61', tintBg: '#e7f3f3' }, // teal · ⁶⁸Ga-DOTATOC / SSTR
  fdg: { fill: '#d66e1c', text: '#8a4a12', tintBg: '#f7ece0' }, // ámbar · ¹⁸F-FDG / glucólisis
} as const
export const GA_FILL = TRACER.ga.fill, GA_TEXT = TRACER.ga.text
export const FDG_FILL = TRACER.fdg.fill, FDG_TEXT = TRACER.fdg.text

/* ------------------------------------------------------------------ */
/*  RAMPA DIVERGING (eje CONTINUO de discordancia · NO binaria):          */
/*  SSTR-dominante ──► dual-SSTR ──► dual-EQUILIBRADO (neutro) ──►         */
/*  dual-glucolítico ──► glucolítico-dominante.                           */
/*  Extremos = teal-⁶⁸Ga ↔ ámbar-¹⁸F-FDG; punto medio NEUTRO (warm-gray   */
/*  «ni uno ni otro»). Todos los rellenos pasan 3:1 gráfico en cream Y en */
/*  oscuro #0d1117; el dígito del foco va en berenjena (ink) en los 5.    */
/* ------------------------------------------------------------------ */
export type Pheno = 'ne' | 'mixNe' | 'mixBal' | 'mixAgg' | 'agg'
export const PHENO: Record<Pheno, { c: string; es: string; en: string }> = {
  ne:     { c: GA_FILL,   es: 'SSTR-dominante (⁶⁸Ga⁺ / FDG⁻)', en: 'SSTR-dominant (⁶⁸Ga⁺ / FDG⁻)' },
  mixNe:  { c: '#3f9aa0', es: 'Dual · predominio SSTR', en: 'Dual · SSTR-predominant' },
  mixBal: { c: '#8c8678', es: 'Dual · equilibrado', en: 'Dual · balanced' },
  mixAgg: { c: '#cf7826', es: 'Dual · predominio glucolítico', en: 'Dual · glycolytic-predominant' },
  agg:    { c: FDG_FILL,  es: 'Glucolítico-dominante (FDG⁺ / SSTR⁻)', en: 'Glycolytic-dominant (FDG⁺ / SSTR⁻)' },
}
/* la rampa como CSS gradient (leyendas) — una sola fuente, sin copias divergentes */
export const PHENO_RAMP_CSS = `linear-gradient(90deg,${PHENO.ne.c},${PHENO.mixNe.c},${PHENO.mixBal.c},${PHENO.mixAgg.c},${PHENO.agg.c})`

export interface Lesion {
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


export const LES: Lesion[] = [
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
    id: 7, x: 220, y: 352, r: 14, side: 'C', dota: 13.27, fdg: 7.61, prevFdg: 10.19, scler: true, sbrt: true, pheno: 'mixNe', size: '18 × 14',
    level: { es: 'D11 (T11) · cuerpo vertebral', en: 'T11 · vertebral body' },
    region: { es: 'Unión dorsolumbar', en: 'Thoracolumbar junction' },
    what: { es: 'Una de las más intensas: la mayor captación ⁶⁸Ga-DOTATOC (SSTR) de la serie, dual con ¹⁸F-FDG que ha descendido vs el previo. Atenuación blástica en TC.', en: 'One of the most intense: the highest ⁶⁸Ga-DOTATOC (SSTR) uptake of the series, dual with ¹⁸F-FDG that has dropped vs prior. Blastic CT attenuation.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 13.27 (SSTR muy intensa) / ¹⁸F-FDG 7.61 (previo 10.19, ↓). Mixto, predominio SSTR (SSTR>FDG). Blástica.', en: '⁶⁸Ga-DOTATOC SUVmax 13.27 (very intense SSTR) / ¹⁸F-FDG 7.61 (prior 10.19, ↓). Mixed, SSTR-predominant (SSTR>FDG). Blastic.' },
    rmn: { es: 'Lesión blástica. La RM describe en D11 extensión al espacio epidural anterior y afectación del canal lateral izquierdo.', en: 'Blastic lesion. The MRI describes anterior epidural extension and left lateral canal compromise at D11.' },
    softTissue: { es: 'La RMN describe componente de partes blandas / extensión extraósea (espacio epidural anterior, canal lateral izquierdo). El tejido blando suele rentabilizar más que el hueso blástico denso, pero por su vecindad al canal y a las raíces la accesibilidad y la seguridad las valora radiología intervencionista.', en: 'The MRI describes a soft-tissue / extraosseous component (anterior epidural space, left lateral canal). Soft tissue usually yields more than dense blastic bone, but given its proximity to the canal and nerve roots, accessibility and safety are assessed by interventional radiology.' },
  },
  {
    id: 8, x: 237, y: 352, side: 'L', dota: 11.63, fdg: null, sbrt: true, pheno: 'ne', size: '13 × 10',
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
    id: 11, x: 220, y: 470, r: 13, side: 'C', dota: 12.14, fdg: 5.0, prevFdg: 4.81, pheno: 'mixNe', size: '18 × 13',
    level: { es: 'L5 · cuerpo vertebral', en: 'L5 · vertebral body' },
    region: { es: 'Columna lumbar baja', en: 'Lower lumbar spine' },
    what: { es: 'L5, hueso de alta carga. ⁶⁸Ga-DOTATOC (SSTR) intenso y ¹⁸F-FDG moderado y estable: dual, predominio SSTR.', en: 'L5, high-load bone. Intense ⁶⁸Ga-DOTATOC (SSTR) and moderate, stable ¹⁸F-FDG: dual, SSTR-predominant.' },
    tech: { es: '⁶⁸Ga-DOTATOC SUVmáx 12.14 (SSTR intensa) / ¹⁸F-FDG 5.0 (previo 4.81, estable). Mixto, predominio SSTR.', en: '⁶⁸Ga-DOTATOC SUVmax 12.14 (intense SSTR) / ¹⁸F-FDG 5.0 (prior 4.81, stable). Mixed, SSTR-predominant.' },
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


export interface LesGroup { key: string; foci: Lesion[]; primary: Lesion; x: number; y: number; multi: boolean }
export function vertLevelKey(le: Lesion): string | null {
  const m = (le.level?.es || '').match(/\b([CDL]\d{1,2})\b/)
  return m ? m[1] : null
}
export function groupKey(le: Lesion): string { return vertLevelKey(le) ?? 'solo-' + le.id }
export const GROUPS: LesGroup[] = (() => {
  const m = new Map<string, Lesion[]>()
  LES.forEach((l) => { const k = groupKey(l); if (!m.has(k)) m.set(k, []); m.get(k)!.push(l) })
  return [...m.entries()].map(([key, foci]) => {
    const primary = [...foci].sort((a, b) => Math.max(b.dota ?? 0, b.fdg ?? 0) - Math.max(a.dota ?? 0, a.fdg ?? 0))[0]
    return { key, foci, primary, multi: foci.length > 1,
      x: foci.reduce((s, l) => s + l.x, 0) / foci.length,
      y: foci.reduce((s, l) => s + l.y, 0) / foci.length }
  })
})()
export const SK_R = 9
export const SK_HIT = 14

export const BONE3D_KEY: Record<number, string> = {
  1: 'C3', 2: 'C4', 3: 'ESCAPULA_R',
  4: 'D1', 5: 'D5', 6: 'D9', 7: 'D11', 8: 'D11', 9: 'L1', 10: 'L1', 11: 'L5',
  12: 'SACRO', 13: 'ILIACO_R', 14: 'ILIACO_R', 15: 'ILIACO_L', 16: 'FEMUR_R',
  // focos IA sobre el hueso reconstruido más próximo (referencia de zona · por confirmar):
  17: 'ESCAPULA_R', 18: 'ILIACO_R', 19: 'D1',
}

export const SK_VERTEBRAS = (() => {
  const out: { x: number; y: number; w: number; h: number }[] = []
  let y = 66
  for (let i = 0; i < 7; i++) { out.push({ x: 220 - 11, y, w: 22, h: 8 }); y += 12 } // cervical
  y = 156
  for (let i = 0; i < 12; i++) { out.push({ x: 220 - 16, y, w: 32, h: 13 }); y += 19.6 } // dorsal
  y = 392
  for (let i = 0; i < 5; i++) { out.push({ x: 220 - 20, y, w: 40, h: 14 }); y += 19.5 } // lumbar
  return out
})()
export const SK_COSTILLAS = (() => {
  const out: { d: string }[] = []
  for (let i = 0; i < 9; i++) {
    const y0 = 166 + i * 20, t = i / 8
    const spread = 38 + Math.sin(t * Math.PI) * 26, drop = 24 + i * 3.2
    out.push({ d: `M214,${y0} Q${(220 - spread).toFixed(0)},${y0 + 4} ${(220 - spread + 8).toFixed(0)},${(y0 + drop).toFixed(0)}` })
    out.push({ d: `M226,${y0} Q${(220 + spread).toFixed(0)},${y0 + 4} ${(220 + spread - 8).toFixed(0)},${(y0 + drop).toFixed(0)}` })
  }
  return out
})()
export const SK_TICKS = [
  { y: 78, t: 'C1' }, { y: 138, t: 'C7' },
  { y: 156, t: 'T1' }, { y: 254, t: 'T6' }, { y: 372, t: 'T12' },
  { y: 392, t: 'L1' }, { y: 470, t: 'L5' }, { y: 505, t: 'S' },
]
