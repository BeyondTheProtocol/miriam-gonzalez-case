/**
 * peticiones — qué pide la web a quien puede mover el caso: el bloque «Qué buscamos» de /datos
 * (componente QueBuscamos).
 *
 * La FUENTE es `se_busca` de app/data/caso.json (Polaris, `tools/caso_publico.py`); aquí no hay ni una
 * frase clínica. Lo que sí vive aquí, del lado de la web, es lo que la fuente todavía no trae:
 *
 *   · CUÁLES se publican. Una lista blanca de huellas (el arranque del texto ES), no `slice(0, 5)`:
 *     la posición en el array no es una identidad. Si Polaris reordena `se_busca` o añade una petición,
 *     un corte por posición publicaría lo que no toca. Lo que no casa con ninguna regla NO se pinta
 *     (fail-closed). Hoy quedan fuera la 6.ª y la 7.ª (FoundationOne y anemia): son dato clínico que
 *     aún no se ha publicado y esperan su gate (rediseño, G3: verificación + comité médico + Miriam).
 *     Publicarlas es añadir una regla aquí, a propósito.
 *   · EN QUÉ ORDEN. `prioridad` es PROVISIONAL (rediseño F1, 23-oct-2026): ensayos para después de
 *     TROPION, laboratorios, radiología, HLA, IHC. Lo confirma el comité médico (gate G8). Cuando
 *     `caso_publico.py` traiga su propio `prioridad`, esta tabla desaparece.
 *   · A QUÉ ATAÑE (`tema`), para que otra página enseñe solo lo suyo (`filtro` de QueBuscamos).
 *
 * Las huellas se prueban en scripts/test-salud-estatica.ts: cada una casa con UN elemento de la fuente
 * y, si Polaris reescribe una petición, el test se pone rojo en vez de que la petición desaparezca sin
 * que nadie lo vea.
 */
import type { Texto } from './datosCaso'
import { txtCaso } from './datosCaso'

export type TemaPeticion = 'ensayo' | 'laboratorio' | 'radiologia' | 'hla' | 'ihc'

/** Un elemento de `se_busca` tal como llega de caso.json. */
export interface PeticionFuente {
  valor: Texto
  fuente?: string
  sello: string
  /** Hoy solo `celula-a-celula`: la petición lleva un enlace a los primeros resultados. */
  enlace?: string | null
}

export interface Peticion extends PeticionFuente {
  clave: string
  tema: TemaPeticion
  prioridad: number
}

interface Regla {
  clave: string
  tema: TemaPeticion
  /** Arranque del texto en español de la petición en caso.json. */
  huella: RegExp
  prioridad: number
}

export const REGLAS_PETICIONES: readonly Regla[] = [
  { clave: 'ensayo-post-tb06', tema: 'ensayo', huella: /^Ensayos o programas de acceso/, prioridad: 1 },
  { clave: 'laboratorio-neoantigenos', tema: 'laboratorio', huella: /^Laboratorios o grupos con capacidad/, prioridad: 2 },
  { clave: 'radiologia-higado', tema: 'radiologia', huella: /^Radiología:/, prioridad: 3 },
  { clave: 'hla', tema: 'hla', huella: /^Tipaje HLA/, prioridad: 4 },
  { clave: 'ihc-dianas', tema: 'ihc', huella: /^IHC de dianas/, prioridad: 5 },
]

/**
 * Las peticiones que la web publica, por prioridad. Cada regla toma el primer elemento de la fuente que
 * casa y que no se haya tomado ya; lo que ninguna regla reclama se queda fuera.
 */
export function peticionesPublicas(seBusca: readonly PeticionFuente[]): Peticion[] {
  const tomadas = new Set<number>()
  const publicas: Peticion[] = []
  for (const { clave, tema, huella, prioridad } of REGLAS_PETICIONES) {
    const i = seBusca.findIndex((b, k) => !tomadas.has(k) && huella.test(txtCaso(b.valor, 'es')))
    if (i < 0) continue
    tomadas.add(i)
    publicas.push({ ...seBusca[i]!, clave, tema, prioridad })
  }
  return publicas.sort((a, b) => a.prioridad - b.prioridad)
}

/**
 * Qué peticiones atañen a cada herramienta del índice /herramientas (tanda 2, T2a, 24-oct-2026): cada tarjeta enseña, plegado, solo
 * lo que se pide a quien puede mover ESA herramienta. Se ata por `tema` (que esta tabla ya trae) y no por un campo nuevo en
 * `caso_publico.py`: así no se toca el otro repo, y un cambio de orden de las peticiones no rompe nada.
 * · Las claves son las `key` de navegacion.ts.
 * · Una herramienta sin tema (las laminillas) no enseña peticiones: la tarjeta enlaza a la lista entera. Una petición nueva de
 *   «segunda lectura de patología» sería dato clínico nuevo y pasaría antes por la gate G3; no se inventa aquí.
 */
export const TEMAS_HERRAMIENTA: Record<string, readonly TemaPeticion[]> = {
  data: ['ensayo', 'hla'],
  lesions: ['radiologia'],
  slides: [],
  cell_by_cell: ['laboratorio'],
  cell_explorer: ['ihc'],
}

/**
 * Los temas que enseña /ciencia (tanda 2, T2c): lo que pueden mover los científicos que llegan a la capa profesional, es decir,
 * laboratorio, HLA e IHQ. El resto de peticiones (ensayos, radiología) sigue entero en /datos#que-buscamos.
 */
export const TEMAS_CIENCIA: readonly TemaPeticion[] = ['laboratorio', 'hla', 'ihc']

/** Las que enseña un sitio concreto: primero el filtro por tema y después el tope. */
export function seleccionarPeticiones(
  publicas: readonly Peticion[],
  { filtro, limite }: { filtro?: readonly TemaPeticion[]; limite?: number } = {},
): Peticion[] {
  const filtradas = filtro?.length ? publicas.filter((p) => filtro.includes(p.tema)) : [...publicas]
  return limite != null ? filtradas.slice(0, Math.max(0, limite)) : filtradas
}

/**
 * ¿Lleva el enlace «Ver todo lo que buscamos»? Si la página lo pide (`verTodas` true o false) manda lo que pida; sin valor,
 * aparece solo cuando se enseñan menos peticiones de las publicadas (en /datos salen todas y no hace falta).
 * Vive aquí y no en el componente porque una prop booleana AUSENTE llega como `false`, no como `undefined`, y `??` ya no
 * tomaba la rama por defecto: el componente lo evita con `default: undefined` y esta función se prueba sola.
 */
export function hayEnlaceTodas(verTodas: boolean | undefined, mostradas: number, publicas: number): boolean {
  return verTodas ?? mostradas < publicas
}
