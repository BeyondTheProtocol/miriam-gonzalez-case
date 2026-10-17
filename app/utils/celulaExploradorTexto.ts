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
  NK: t('Células NK', 'NK cells'),
  mieloide: t('Mieloides', 'Myeloid'),
  endotelio: t('Endotelio', 'Endothelium'),
  fibroblasto_estelar: t('Fibroblastos y células estrelladas', 'Fibroblasts and stellate cells'),
  T: t('Linfocitos T', 'T cells'),
  B: t('Linfocitos B', 'B cells'),
  plasmatica: t('Células plasmáticas', 'Plasma cells'),
  neutrofilo: t('Neutrófilos', 'Neutrophils'),
  mastocito: t('Mastocitos', 'Mast cells'),
  otras: t('Otras células', 'Other cells'),
}
export const ETIQUETA_TIPO: Record<string, T> = {
  luminal: t('Luminal', 'Luminal'), epitelial: t('Epitelial', 'Epithelial'), hepatocito: t('Hepatocito', 'Hepatocyte'),
  nk: t('NK', 'NK'), linfocito_t: t('Linfocito T', 'T cell'), linfocito_b: t('Linfocito B', 'B cell'), mieloide: t('Mieloide', 'Myeloid'),
  endotelio: t('Endotelio', 'Endothelium'), fibroblasto: t('Fibroblasto', 'Fibroblast'), plasmatica: t('Plasmática', 'Plasma cell'),
  neutrofilo: t('Neutrófilo', 'Neutrophil'), mastocito: t('Mastocito', 'Mast cell'), osteoclasto: t('Osteoclasto', 'Osteoclast'),
  eritroide: t('Eritroide', 'Erythroid'), estroma: t('Estroma', 'Stroma'),
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
  con_matiz: t('Se sostiene con matices', 'Holds, with caveats'),
  en_el_limite: t('En el límite', 'Borderline'),
  no_sostenido: t('No se sostiene', 'Does not hold'),
  no_resoluble: t('No se puede resolver con este diseño', 'Cannot be resolved with this design'),
  referencia_igual_o_mas: t('Se detecta igual o más en la referencia', 'Detected as much or more in the reference'),
  solo_nivel: t('Solo cuenta el nivel (se detecta en casi todas las células)', 'Only the level counts (detected in almost every cell)'),
  marcador_ne: t('Marcador neuroendocrino', 'Neuroendocrine marker'),
  no: t('No', 'No'),
  sin_veredicto: t('Sin valorar', 'Not assessed'),
}

export const nombreGen = (g: string) => (PROTEINA[g] ? `${PROTEINA[g]} (${g})` : g)
export const etiqueta = (mapa: Record<string, T>, id: string, lang: 'es' | 'en') => mapa[id]?.[lang] ?? id.replaceAll('_', ' ')

/** Etiquetas fijas del explorador (plan del 17-oct-2026): una sola fuente para la cabecera y «Cómo leerlo». */
export const ETIQUETAS_FIJAS = {
  n1: t('n=1, FFPE, exploratorio', 'n=1, FFPE, exploratory'),
  arn: t('ARN ≠ proteína; manda la IHQ', 'RNA ≠ protein; IHC decides'),
  her2: t('IHQ de HER2: 0', 'HER2 IHC: 0'),
}
