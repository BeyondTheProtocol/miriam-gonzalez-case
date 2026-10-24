/**
 * casoCiencia — lo que /ciencia lee de app/data/caso.json (tanda 2, T2c, 24-oct-2026).
 *
 * /ciencia queda como la capa profesional (interpretación y literatura) y NO escribe a mano el estado clínico: la ficha, el
 * material, la fecha de actualización y «en cuarta línea desde…» salen de aquí, del mismo caso.json que lee /datos. El estado
 * clínico tiene así UNA sola casa (`caso.json`, que genera Polaris con `tools/caso_publico.py`): si cambia, cambia en los dos sitios.
 *
 * Es una función pura sobre el JSON (se prueba con tsx, sin Nuxt) y devuelve solo lo que la página pinta, ya en el idioma que se
 * pide: así el payload de la página no arrastra los ~230 KB del JSON (mismo patrón que `useCasoHome`).
 *
 * Qué NO se lee, a propósito:
 *   · `receptores[].detalle`: el de la sinaptofisina contaba la revisión de la laminilla como hecho verificado y la corrección C4
 *     la pasa a «dicho» (sin informe escrito). La ficha enseña `valor` y su sello, no la prosa del detalle.
 *   · `ficha.estado_actual`: lleva el sello «inferido» y es un párrafo largo de cribado. La línea de hoy sale de `lineas` (4L,
 *     sello verificado) con `tratamientoHoy`, la misma cuenta que la cifra «Tratamiento» de /datos y la línea «Ahora» de la home.
 */
import type { LineaCaso, Texto } from './datosCaso'
import { msFecha, tratamientoHoy, txtCaso } from './datosCaso'
import type { PeticionFuente } from './peticiones'
import { peticionesPublicas } from './peticiones'

export type Lang = 'es' | 'en'

export interface FilaCiencia {
  clave: 'diagnostico' | 'histologia' | 'estadio'
  valor: string
  sello: string | null
}
export interface ReceptorCiencia {
  marcador: string
  valor: string
  sello: string | null
}
export interface MuestraCiencia {
  muestra: string
  donde: string
  sello: string | null
}
export interface CuartaLinea {
  /** «7-oct-2026» · «7 Oct 2026» */
  corta: string
  /** «7 de octubre de 2026» · «7 October 2026» */
  larga: string
}
export interface CasoCiencia {
  /** AAAA-MM-DD: la fecha de `actualizado` de caso.json */
  actualizado: string
  cuartaLinea: CuartaLinea | null
  filas: FilaCiencia[]
  receptores: ReceptorCiencia[]
  material: MuestraCiencia[]
  /** las peticiones públicas (lista blanca de utils/peticiones.ts), sin filtrar por tema */
  peticiones: PeticionFuente[]
}

/** Las muestras que la ficha enseña, por su arranque en español (la posición en el array no es una identidad). Lo que no casa no se pinta. */
export const HUELLAS_MATERIAL: readonly RegExp[] = [/^Hueso, ilion derecho/, /^Hígado, segmento IVa/, /^Mama, primario/]
/** Los receptores de la ficha, por su marcador en español. */
export const MARCADORES_FICHA: readonly string[] = ['RE', 'RP', 'HER2 IHC', 'Ki67']

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_ES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MESES_EN_CORTO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Un día AAAA-MM-DD en sus dos formas. Solo días completos: un mes o un año sueltos no son «desde el …». */
export function fechaDia(iso: string, lang: Lang): CuartaLinea | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [, a, mes, d] = m
  const i = Number(mes) - 1
  const dia = Number(d)
  if (i < 0 || i > 11 || dia < 1 || dia > 31) return null
  return lang === 'en'
    ? { corta: `${dia} ${MESES_EN_CORTO[i]} ${a}`, larga: `${dia} ${MESES_EN[i]} ${a}` }
    : { corta: `${dia}-${MESES_ES_CORTO[i]}-${a}`, larga: `${dia} de ${MESES_ES[i]} de ${a}` }
}

/**
 * ¿Está el caso en cuarta línea hoy, y desde qué día? `hoyMs` es la fecha de `generado` de caso.json y no la del reloj (el HTML
 * prerenderizado no caduca a medianoche). Si la línea sistémica en curso NO es la 4L (porque llegó una 5L, o el ensayo terminó),
 * devuelve null y la página no pinta la frase: sin dato no hay línea, y la frase escrita no sigue diciendo lo que ya no es verdad.
 */
export function cuartaLineaDe(lineas: readonly LineaCaso[], hoyMs: number, lang: Lang): CuartaLinea | null {
  const hoy = tratamientoHoy(lineas, hoyMs, lang)
  if (!hoy.enCurso || hoy.valor !== '4L') return null
  const l = lineas.find((x) => x.id === '4L')
  return l ? fechaDia(l.inicio, lang) : null
}

type Sellada = { valor?: Texto; sello?: string }
const sello = (s: Sellada | undefined) => s?.sello ?? null

/** Lo que /ciencia pinta de caso.json, en el idioma pedido. */
export function leerCasoCiencia(caso: any, lang: Lang): CasoCiencia {
  const f = caso.ficha ?? {}
  const T = (v: Texto | null | undefined) => txtCaso(v as Texto, lang)
  const generado = String(caso.generado ?? '').slice(0, 10)
  const filas: FilaCiencia[] = (['diagnostico', 'histologia', 'estadio'] as const)
    .filter((k) => f[k]?.valor)
    .map((k) => ({ clave: k, valor: T(f[k].valor), sello: sello(f[k]) }))
  const receptores: ReceptorCiencia[] = MARCADORES_FICHA
    .map((m) => (f.receptores ?? []).find((r: any) => txtCaso(r.marcador, 'es') === m))
    .filter((r: any) => !!r)
    .map((r: any) => ({ marcador: T(r.marcador), valor: T(r.valor), sello: sello(r) }))
  const material: MuestraCiencia[] = HUELLAS_MATERIAL
    .map((h) => (caso.material ?? []).find((m: any) => h.test(txtCaso(m.muestra, 'es'))))
    .filter((m: any) => !!m)
    .map((m: any) => ({ muestra: T(m.muestra).split(/ \(|\. |: /)[0]!, donde: T(m.donde), sello: sello(m) }))
  return {
    actualizado: String(caso.actualizado ?? ''),
    cuartaLinea: generado ? cuartaLineaDe(caso.lineas ?? [], msFecha(generado), lang) : null,
    filas,
    receptores,
    material,
    peticiones: peticionesPublicas(caso.se_busca ?? []),
  }
}
