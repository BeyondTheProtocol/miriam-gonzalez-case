/**
 * Categorías de la cronología (DS: solo colores del sistema).
 * Se derivan del `tag` existente de cada entrada — sin tocar el YAML ni el
 * esquema, para que quien edite el contenido siga añadiendo entradas igual.
 *
 *  - clinical  → la columna clínica (diagnóstico, líneas, progresión) · berenjena
 *  - molecular → el perfil del tumor (DIPCAN, ctDNA, PET)              · miriam (violeta)
 *  - network   → equipo, IA y difusión (la parte humana/movimiento)   · coral
 */
export type TimelineCategory = 'clinical' | 'molecular' | 'network'

const TAG_CATEGORY: Record<string, TimelineCategory> = {
  // clinical
  antecedentes: 'clinical',
  background: 'clinical',
  'síntomas': 'clinical',
  symptoms: 'clinical',
  'diagnóstico': 'clinical',
  diagnosis: 'clinical',
  'primera línea': 'clinical',
  'first line': 'clinical',
  'ingreso urgente': 'clinical',
  'urgent admission': 'clinical',
  'segunda línea': 'clinical',
  'second line': 'clinical',
  'progresión': 'clinical',
  progression: 'clinical',
  'tercera línea': 'clinical',
  'third line': 'clinical',
  'ensayos clínicos': 'clinical',
  'clinical trials': 'clinical',
  tratamiento: 'clinical',
  treatment: 'clinical',
  'clínico': 'clinical',
  clinical: 'clinical',
  // molecular
  dipcan: 'molecular',
  molecular: 'molecular',
  // network
  equipo: 'network',
  team: 'network',
  ia: 'network',
  ai: 'network',
  'divulgación': 'network',
  outreach: 'network',
}

export function categoryForTag(tag?: string): TimelineCategory {
  if (!tag) return 'clinical'
  return TAG_CATEGORY[tag.trim().toLowerCase()] ?? 'clinical'
}

/** Acentos por categoría — todos dentro de la paleta del sistema. */
export const CATEGORY_META: Record<
  TimelineCategory,
  { accent: string; soft: string; ring: string }
> = {
  clinical: { accent: '#2d1b3d', soft: 'rgba(45,27,61,0.10)', ring: 'rgba(45,27,61,0.30)' },
  molecular: { accent: '#9d44ab', soft: 'rgba(157,68,171,0.14)', ring: 'rgba(157,68,171,0.45)' },
  network: { accent: '#ff6b47', soft: 'rgba(255,107,71,0.14)', ring: 'rgba(255,107,71,0.50)' },
}
