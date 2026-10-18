/**
 * Etiquetas del explorador (ES/EN). Vocabulario cerrado: los ids vienen del fichero de datos y aquí
 * solo se traducen. Ninguna etiqueta lleva cifras (el n sale siempre del fichero) ni léxico vetado (ver el test).
 */
type T = { es: string; en: string }
const t = (es: string, en: string): T => ({ es, en })

export const ETIQUETA_GRUPO: Record<string, T> = {
  luminal_alta_confianza: t('Luminal de alta confianza', 'High-confidence luminal'),
  malignas_limpias: t('Malignas, asignación limpia', 'Malignant, clean call'),
  hepatocito: t('Hepatocitos', 'Hepatocytes'),
  // Auditoría 18-oct: el clúster de 281 es T/NK, mayoritariamente T (la salida T9 ya lo llamaba T_NK).
  NK: t('Linfocitos T y NK', 'T and NK cells'),
  mieloide: t('Mieloides', 'Myeloid'),
  endotelio: t('Endotelio', 'Endothelium'),
  fibroblasto_estelar: t('Fibroblastos y células estrelladas', 'Fibroblasts and stellate cells'),
  T: t('Linfocitos T', 'T cells'),
  B: t('Linfocitos B', 'B cells'),
  plasmatica: t('Células plasmáticas', 'Plasma cells'),
  neutrofilo: t('Neutrófilos', 'Neutrophils'),
  mastocito: t('Mastocitos', 'Mast cells'),
  otras: t('Otras, sin asignar a un grupo', 'Other, not assigned to a group'),
}
export const ETIQUETA_TIPO: Record<string, T> = {
  luminal: t('Luminal', 'Luminal'), epitelial: t('Epitelial', 'Epithelial'), hepatocito: t('Hepatocito', 'Hepatocyte'),
  nk: t('Linfocito T o NK', 'T or NK cell'), linfocito_t: t('Linfocito T', 'T cell'), linfocito_b: t('Linfocito B', 'B cell'), mieloide: t('Mieloide', 'Myeloid'),
  endotelio: t('Endotelio', 'Endothelium'), fibroblasto: t('Fibroblasto', 'Fibroblast'), plasmatica: t('Plasmática', 'Plasma cell'),
  neutrofilo: t('Neutrófilo', 'Neutrophil'), mastocito: t('Mastocito', 'Mast cell'), osteoclasto: t('Osteoclasto', 'Osteoclast'),
  eritroide: t('Eritroide', 'Erythroid'), estroma: t('Estroma', 'Stroma'),
  // el vocabulario cerrado de Polaris (_contrato.TIPOS) entero: ningún tipo del fichero sin su rótulo
  colangiocito: t('Colangiocito', 'Cholangiocyte'), fibroblasto_estelar: t('Fibroblasto o célula estrellada', 'Fibroblast or stellate cell'),
  osteoblasto: t('Osteoblasto', 'Osteoblast'), megacariocito: t('Megacariocito', 'Megakaryocyte'), no_asignado: t('Sin asignar', 'Unassigned'),
}
export const ETIQUETA_LESION: Record<string, T> = { higado: t('Hígado', 'Liver'), hueso: t('Hueso', 'Bone') }

/** Nombre de proteína con el que lo conoce un clínico. El símbolo del gen va siempre al lado. */
export const PROTEINA: Record<string, string> = {
  ANKRD30A: 'NY-BR-1', TPBG: '5T4', ERBB3: 'HER3', SLC39A6: 'LIV-1', ERBB2: 'HER2', TACSTD2: 'TROP2', CD276: 'B7-H3', NECTIN4: 'Nectin-4',
}
/** Los diez genes de la tabla «Genes de interés», en este orden (plan del 17-oct-2026). */
export const PANEL_INTERES = ['ANKRD30A', 'TPBG', 'ERBB3', 'SLC39A6', 'ERBB2', 'TACSTD2', 'CD276', 'NECTIN4', 'MUC1', 'FGFR1']

export const ETIQUETA_VEREDICTO: Record<string, T> = {
  sostenido: t('Se sostiene', 'Holds'),
  /** la revisión lo da por sostenido, con matices (HER3 del hígado) */
  sostenido_con_matiz: t('Se sostiene con matices', 'Holds, with caveats'),
  /** la revisión lo matiza y NO lo da por sostenido: nunca «se sostiene» aquí (revisión de cifras, 17-oct-2026) */
  con_matiz: t('Con matices; no se da por sostenido', 'With caveats; not counted as holding'),
  en_el_limite: t('En el límite', 'Borderline'),
  no_sostenido: t('No se sostiene', 'Does not hold'),
  no_resoluble: t('No se puede resolver con este diseño', 'Cannot be resolved with this design'),
  referencia_igual_o_mas: t('Se detecta igual o más en la referencia', 'Detected as much or more in the reference'),
  solo_nivel: t('Solo cuenta el nivel (se detecta en casi todas las células)', 'Only the level counts (detected in almost every cell)'),
  marcador_ne: t('Marcador neuroendocrino', 'Neuroendocrine marker'),
  no: t('No', 'No'),
  /** el porqué va en el motivo, que cambia por biopsia: en el hígado no hay positivos (verificacion, 18-oct-2026: la
   * etiqueta decía «los positivos son ADN de núcleos no tumorales» también en el hígado, donde el acta da 0) */
  cerrado_por_arn: t('Cerrado por ARN', 'Ruled out by RNA'),
  sin_veredicto: t('No valorado en esa fila de la revisión', 'Not assessed in that row of the review'),
}
/** Motivo de cada lectura, entre paréntesis tras ella (comité médico, 18-oct-2026: TROP2 del hígado supera el suelo y la
 * referencia que se ven y la lectura dice «No se sostiene»). Ids de Polaris (_contrato.MOTIVOS, con la línea del acta de
 * la que sale cada uno). Sin cifras: las del caso viajan en el fichero. */
export const ETIQUETA_MOTIVO: Record<string, T> = {
  hepatocitos_igual_o_mas: t('los hepatocitos sanos lo detectan igual o más', 'healthy hepatocytes detect it as much or more'),
  seleccion_por_er: t('el grupo se eligió por el programa de estrógeno', 'the group was chosen by its estrogen program'),
  arn_no_es_her2_low: t('en ARN no equivale a HER2-low; manda la IHQ', 'in RNA it does not mean HER2-low; IHC decides'),
  minoria: t('solo en una minoría de células', 'only in a minority of cells'),
  /** el suelo calculado con el ARN del propio tumor suelto en la muestra, que la tabla no pinta (auditoría, 18-oct-2026) */
  fondo_arn_tumoral: t('no supera el fondo del ARN tumoral suelto, más alto que el suelo que se muestra', 'does not clear the background from loose tumor RNA, higher than the floor shown'),
  parecido_en_todas: t('se detecta parecido en todas las células no tumorales', 'detected at a similar rate in every non-tumor cell type'),
  disperso_en_el_tumor: t('disperso por el tumor luminal', 'scattered through the luminal tumor'),
  casi_no_se_detecta: t('se detecta en muy pocas células', 'detected in very few cells'),
  cero_en_posibles_tumorales: t('cero en las células que podrían ser tumor, con sondas que sí funcionan', 'zero in the cells that could be tumor, with probes that do work'),
  adn_de_nucleos_no_tumorales: t('los positivos son ADN de núcleos no tumorales', 'the positives are DNA from non-tumor nuclei'),
  referencia_poco_precisa: t('la referencia tiene pocas células efectivas y la diferencia apenas se separa de cero', 'the reference has few effective cells and the difference barely clears zero'),
  supera_por_poco: t('supera a la referencia por muy poco', 'clears the reference by very little'),
  depende_del_conjunto: t('supera a la referencia solo en un conjunto algo más amplio de células malignas', 'clears the reference only in a slightly wider set of malignant cells'),
}

/** De quién es la lectura por gen, y en qué estado está: va en la cabecera de la columna y en su pie. */
export const LECTURA = {
  columna: t('Lectura de Polaris (borrador)', 'Polaris reading (draft)'),
  pie: t('Lectura de Polaris, borrador, pendiente de la lectura humana del laboratorio.', 'Polaris reading, draft, pending the laboratory’s human reading.'),
}

/** Por qué la cifra de un gen en el grupo de interés es circular: el gen participa en la selección del grupo. */
export const PAPEL_SELECCION: Record<string, T> = {
  identidad: t('participa en la selección de este grupo (marcador de identidad): su cifra aquí es circular, sale alta por construcción',
    'takes part in selecting this group (identity marker): its figure here is circular, high by construction'),
  fgfr1_alto: t('participa en la selección de este grupo (se eligieron células con FGFR1 alto): su nivel aquí sale alto por construcción',
    'takes part in selecting this group (cells were chosen for high FGFR1): its level here is high by construction'),
  exclusion: t('participa en la selección de este grupo (marcador de exclusión): su cifra aquí sale baja por construcción',
    'takes part in selecting this group (exclusion marker): its figure here is low by construction'),
  ligado_er: t('va ligado al programa con el que se seleccionó este grupo: su cifra aquí sale favorecida',
    'is tied to the program used to select this group: its figure here is favored'),
}

/** Nombres clínicos que un médico teclea, solo para el BUSCADOR (comité médico, 18-oct: «ER» no llevaba a ESR1 ni
 * «PD-L1» a CD274). Equivalencias estándar de HGNC (cotejadas por verificacion, 18-oct); no se usan como rótulo. Sin
 * isoformas: «CLDN18.2» NO lleva a CLDN18, porque las sondas cuentan el gen entero y no distinguen la 18.2. */
export const ALIAS_BUSCA: Record<string, string> = {
  ER: 'ESR1', PR: 'PGR', 'Ki-67': 'MKI67', 'PD-L1': 'CD274', 'PD-1': 'PDCD1', p53: 'TP53', 'E-cadherina': 'CDH1', 'E-cadherin': 'CDH1',
  CK7: 'KRT7', CK8: 'KRT8', CK18: 'KRT18', CK19: 'KRT19', CK20: 'KRT20', 'c-MET': 'MET', HER4: 'ERBB4',
  'B7-H4': 'VTCN1', CEA: 'CEACAM5', mamaglobina: 'SCGB2A2', mammaglobin: 'SCGB2A2', 'GCDFP-15': 'PIP',
}
/** nombre clínico por idioma, para avisar de que el % del explorador es ARN y no el resultado de la IHQ (comité médico) */
export const NOMBRE_CLINICO: Record<string, T> = {
  ESR1: t('ER', 'ER'), PGR: t('PR', 'PR'), MKI67: t('Ki-67', 'Ki-67'), CD274: t('PD-L1', 'PD-L1'), PDCD1: t('PD-1', 'PD-1'), TP53: t('p53', 'p53'),
  CDH1: t('E-cadherina', 'E-cadherin'), KRT7: t('CK7', 'CK7'), KRT8: t('CK8', 'CK8'), KRT18: t('CK18', 'CK18'), KRT19: t('CK19', 'CK19'), KRT20: t('CK20', 'CK20'),
  MET: t('c-MET', 'c-MET'), ERBB4: t('HER4', 'HER4'), VTCN1: t('B7-H4', 'B7-H4'), CEACAM5: t('CEA', 'CEA'), SCGB2A2: t('mamaglobina', 'mammaglobin'), PIP: t('GCDFP-15', 'GCDFP-15'),
  ERBB2: t('HER2', 'HER2'), ERBB3: t('HER3', 'HER3'), TACSTD2: t('TROP2', 'TROP2'), CD276: t('B7-H3', 'B7-H3'), NECTIN4: t('Nectin-4', 'Nectin-4'),
}
export const nombreGen = (g: string) => (PROTEINA[g] ? `${PROTEINA[g]} (${g})` : g)
export const etiqueta = (mapa: Record<string, T>, id: string, lang: 'es' | 'en') => mapa[id]?.[lang] ?? id.replaceAll('_', ' ')

/** Etiquetas fijas del explorador (plan del 17-oct-2026): una sola fuente para la cabecera y «Cómo leerlo». */
export const ETIQUETAS_FIJAS = {
  n1: t('n=1, FFPE, exploratorio', 'n=1, FFPE, exploratory'),
  arn: t('ARN ≠ proteína; manda la IHQ', 'RNA ≠ protein; IHC decides'),
  /** con su muestra (verificacion, 18-oct): la IHQ 0 es del primario (3 lecturas) y de la biopsia hepática; en el hueso,
   * sin muestra nombrada, daba a entender una IHQ que no consta */
  her2: t('IHQ de HER2: 0 (primario e hígado)', 'HER2 IHC: 0 (primary and liver)'),
  /** etiqueta de la lectura por gen: completa en el detalle; corta en cada fila de la lista, cuyo pie dice de quién es y
   * que está pendiente (diseño, 18-oct: la completa repetida diez veces pesaba más que las cifras) */
  lectura: t('Lectura de Polaris (borrador, pendiente del laboratorio):', 'Polaris reading (draft, pending the laboratory’s reading):'),
  lecturaCorta: t('Lectura (borrador):', 'Reading (draft):'),
  /** auditoría 18-oct: el ARN del programa de estrógeno está activo, pero la tinción del hígado salió negativa */
  re: t('IHQ de RE: negativa (hígado)', 'ER IHC: negative (liver)'),
  /** auditoría 18-oct: del hueso no consta IHQ de HER2 (solo ADN, FoundationOne) */
  her2Hueso: t('IHQ de HER2 (hueso): no consta', 'HER2 IHC (bone): none reported'),
  /** auditoría 18-oct: HER3 lo tienen igual o más los hepatocitos sanos. Con el motivo en el fichero ya va en el paréntesis
   * de la lectura (hepatocitos_igual_o_mas); solo se pinta con datos que aún no lo traen */
  her3Higado: t('En los hepatocitos sanos se detecta igual o más', 'Detected as much or more in healthy hepatocytes'),
  /** qué matriz es: la estándar, con el ADN genómico que eso arrastra en el hueso */
  matriz: t('Matriz estándar de Cell Ranger, todas las sondas; en el hueso incluye ADN genómico', 'Standard Cell Ranger matrix, all probes; in the bone it includes genomic DNA'),
  /** el número de copias del hueso es una inferencia por expresión, no una lectura de ADN */
  cnv: t('Inferido de la expresión (ARN) frente a la referencia; no es lectura de ADN', 'Inferred from expression (RNA) against the reference; not a DNA readout'),
  /** el nivel que pinta la página no es el de la revisión */
  mediana: t('Mediana por célula detectada; la revisión da pseudobulk, así que las cifras de nivel no tienen por qué coincidir', 'Median per detected cell; the review gives pseudobulk, so level figures need not match'),
}

/** Circularidad de GRUPO (18-oct, diseño y verificacion con datos reales). En el hueso el grupo de interés se eligió por
 * número de copias inferido de la expresión y por identidad epitelial: los genes de las regiones con más copias
 * inferidas salen favorecidos por construcción, gen a gen no se puede rotular. Sin nombrar genes ni posiciones. */
export const CIRC_HUESO = t('En el hueso, las células malignas se eligieron por número de copias inferido de la propia expresión y por identidad epitelial: los genes de las regiones con más copias inferidas salen favorecidos en ese grupo por construcción, así que su diferencia con el resto no es una medida independiente.',
  'In the bone, malignant cells were chosen by copy number inferred from expression itself and by epithelial identity: genes in regions with more inferred copies come out favored in that group by construction, so their difference from the rest is not an independent measurement.')
/** Los tipos de referencia se anotaron por clúster con marcadores canónicos: sus marcadores salen arriba en parte por eso. */
export const CIRC_REFERENCIA = t('Los tipos celulares se anotaron por clúster con marcadores canónicos: que esos marcadores encabecen su grupo es, en parte, por construcción.',
  'Cell types were annotated per cluster with canonical markers: those markers topping their own group is partly by construction.')
