import dinero from '../data/dinero.json'

/**
 * LA fuente de las cifras de dinero de la web (rediseño T2b, 24-oct-2026). Norma de Miriam: «somos transparentes: no detallamos
 * ciertas cosas, pero sí mostramos algunas cifras y el desglose de gastos por categorías». Esas cifras viven en
 * `app/data/dinero.json`, con su fecha de corte, y en ningún otro sitio: ni escritas a mano en las claves de i18n ni en una
 * plantilla (lo vigila scripts/test-dinero-fuente.ts). Al hacer un corte nuevo se edita el JSON y se cambia `corte`.
 *
 * Lo recaudado en GoFundMe NO está aquí: viene en vivo de `useFundraiser()`. Este fichero es lo GASTADO y lo DISPONIBLE a una
 * fecha, que es otra cosa y por eso /gastos lo dice (`expenses.cuadre`). Lo único de GoFundMe que sí vive aquí es su cuadre
 * (`gofundme`: donado, comisiones, transferido y lo que aún queda en la plataforma), con SU fecha, que no es la del corte: las
 * comisiones se acumulan hasta una fecha posterior y no se prorratean. Las comisiones no entran en `comprometido`: GoFundMe las
 * descuenta antes de transferir, así que `ingresado` ya viene sin ellas.
 *
 * `disponible` es una ESTIMACIÓN (descuenta el impuesto de donaciones pendiente, calculado por estimación) y /gastos
 * la rotula así (`expenses.report_available_desc`). Si un corte futuro la confirma, se cambia ese texto a la vez que la cifra.
 * `correccion` enciende la nota genérica de que el informe corrige un cargo duplicado del anterior; sin importe, sin proveedor y
 * sin partida (nota acordada el 24-oct-2026). Al siguiente corte se quita.
 *
 * LISTA BLANCA: aquí NO va nada más que lo que /gastos pinta. Ni saldos, ni deuda, ni bancos, ni proveedores, ni movimientos, ni
 * importes personales. La fuente privada del corte trae todo eso a su lado y se queda donde está: de ella se copian cifras sueltas,
 * nunca el fichero. Lo vigila scripts/test-dinero-fuente.ts.
 *
 * `fases` es el estado de las tres fases de la campaña, DECLARADO aquí y no calculado desde el dinero: una barra contra una meta
 * que se va a mover es justo lo que se quitó (decisión de Miriam, 24-oct-2026).
 *
 * PENDIENTE DE MIRIAM: Miriam dijo «las cubiertas, hecho» y «terapia personalizada, presupuesto en curso»; el estado del banco de
 * tejido (`en_curso`) es una inferencia del constructor, no una decisión suya. `hecho` queda refutado por app/data/caso.json
 * («Sin fresco ni congelado»), y `en_curso` solo se sostiene en la secuenciación. Hasta que lo
 * confirme ella, o el comité médico valide otra cosa contra caso.json, no se pasa a `hecho` (lo vigila test-dinero-fuente).
 *
 * Los nombres de los exports son ÚNICOS entre app/utils y app/composables: Nuxt los auto-importa y, si dos ficheros exportan el
 * mismo, descarta uno en silencio y las piezas que lo usan sin importarlo cambian de formato (pasó con `fechaCorta`, que existe en
 * datosCaso.ts: /en/data escribía «1 Oct 2023» y «Oct 7, 2026» en la misma página). test-dinero-fuente lo vigila.
 */
export type EstadoFase = 'hecha' | 'hecho' | 'en_curso' | 'presupuesto'

export const DINERO = dinero as {
  corte: string
  moneda: string
  comprometido: number
  ingresado: number
  disponible: number
  correccion: boolean
  partidas: { clave: string; importe: number }[]
  gofundme: { fecha: string; donado: number; comisiones: number; transferido: number; aun: number }
  rebiopsia: { fecha: string; ejecutado: number; biopsia: number; secuenciacion: number; imagen: number }
  fases: { clave: 'rebiopsy' | 'bank' | 'treatment'; estado: EstadoFase }[]
}

/** Importe con céntimos y miles siempre agrupados (en es-ES el separador se omite en cuatro cifras y descuadraría una columna). */
export const euros = (importe: number, locale: string) =>
  new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: DINERO.moneda,
    useGrouping: 'always',
  }).format(importe)

/** «17 de agosto de 2026» / «17 August 2026». Zona fija: el servidor y el navegador deben escribir el mismo día. */
export const fechaDeCorte = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date(iso))

const MES_CORTO = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const

/**
 * «24 oct 2026» / «24 Oct 2026»: la fecha corta de una cifra sembrada (hero y tarjeta de la campaña). No se llama `fechaCorta`
 * porque ese nombre ya es el de app/utils/datosCaso.ts («Oct 7, 2026») y el auto-import se quedaría con uno solo.
 * Los meses abreviados NO salen de Intl: cada versión de ICU puede abreviar el español a su manera (medido el 24-oct-2026:
 * Node 26.3.1, con ICU 78.3 y CLDR 48, escribe «sept»). Si el servidor y el navegador no comparten versión, la hidratación podría
 * discrepar justo en septiembre. Solo el día y el año (cifras, iguales en todas partes) se piden a Intl, en la zona fija de Madrid.
 * Las tres piezas van unidas con espacios duros (U+00A0): la fecha nunca se parte, y una línea que no cabe solo puede saltar entre
 * «cifra a» y la fecha. Es lo que permite NO usar `white-space: nowrap`, que sacaba el texto de su caja con la letra ampliada
 * (WCAG 1.4.4 y 1.4.10, revisión de T2b2). Quien compare con el texto de la página debe normalizar U+00A0 a espacio.
 */
export const fechaDeCifra = (iso: string, locale: string) => {
  const partes = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Madrid' }).formatToParts(new Date(iso))
  const de = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value)
  return `${de('day')}\u00a0${MES_CORTO[locale === 'es' ? 'es' : 'en'][de('month') - 1]}\u00a0${de('year')}`
}
