/**
 * «Muestra y contexto» del explorador (decisión D5 del plan «muy útil a científicos»; OK de Miriam al contenido el
 * 19-oct-2026). Cifras de inmunohistoquímica y de tratamiento cotejadas una a una contra los informes originales (AP
 * del primario: tres lecturas; AP del hígado; histología del hueso; cursos clínicos), con la identidad comprobada, y
 * vueltas a cotejar a la contra por `verificacion` (0 cifras erróneas en 33 datos). Fuente y tabla de procedencia:
 * 00_FUENTE-DE-VERDAD/01 · Tratamiento/borrador-d5-bloque-muestra-y-contexto-del-explorador-cotejad-2026-10-19.md
 * (Polaris, privado). Aquí viven como DATOS, no en el texto: el test del explorador prohíbe porcentajes escritos a mano
 * en el copy. Sin fechas, hospitales ni nombres (N1).
 */

/** Tres lecturas del tumor primario (al diagnóstico, segunda opinión, revisión posterior). null = no consta. */
export const PRIMARIO_LECTURAS: { id: 'diagnostico' | 'segunda' | 'revision'; re: number; rp: number; ki67: number | null; her2Debil: boolean }[] = [
  { id: 'diagnostico', re: 95, rp: 5, ki67: 60, her2Debil: false },
  { id: 'segunda', re: 100, rp: 100, ki67: null, her2Debil: true },
  { id: 'revision', re: 85, rp: 20, ki67: 40, her2Debil: false },
]
/** Segunda opinión: HER2 0 con «tinción de membrana incompleta y casi imperceptible en menos del 10 % de las células». */
export const HER2_DEBIL_MENOS_DE = 10
/** Cromogranina y sinaptofisina al diagnóstico. */
export const PRIMARIO_NE_PCT = 80
/** Metástasis del hígado (el mismo bloque que el single-cell). Sin Ki-67 en el informe. */
export const HIGADO = { re: 0, rp: 5, rpIntensidad: '2+' } as const
/** Metástasis del hueso: Ki-67 «ca.» 15 %. RE, RP y HER2 no informados. */
export const HUESO_KI67_APROX = 15
/** Intervalos (aritmética sobre las fechas de los originales, redondeada; sin fechas en la web). */
export const INTERVALOS = {
  ribociclibDias: 15,
  huesoTrasCdk46Semanas: 14,
  huesoTrasFulvestrantSemanas: 6,
  higadoEn3lSemanas: 5,
  fulvestrant2lMeses: 16,
  /** semivida aparente tras 250 mg IM (ficha de la FDA, vigente desde el 17-jun-2024) */
  semividaFulvestrantDias: 40,
  /** ensayos con biopsias antes y durante el tratamiento: de días a 16 semanas (PMID 8932874, 22286314) */
  ventanaMaxSemanas: 16,
} as const
/** Proteínas que la página pinta en ARN sin inmunohistoquímica en ningún informe. */
export const SIN_IHQ_PAGINA = ['TROP2', 'HER3', 'NY-BR-1', '5T4'] as const

/** RE del primario: mínimo y máximo de las tres lecturas. */
export function rangoRePrimario(): [number, number] {
  const v = PRIMARIO_LECTURAS.map((l) => l.re)
  return [Math.min(...v), Math.max(...v)]
}
/** «95 %» (ES, espacio duro) / «95%» (EN). */
export const pc = (x: number, lang: 'es' | 'en') => (lang === 'en' ? `${x}%` : `${x} %`)
