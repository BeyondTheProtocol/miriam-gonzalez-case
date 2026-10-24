// Medición de Umami, segunda parte (23-oct-2026): lo que se VE y desde dónde se entró.
//
// app/utils/umami.ts tiene los eventos de clic y de scroll (rediseño F0). Aquí van tres cosas más, todas
// medición: ninguna cambia nada de lo que se ve.
//
//   Hero-visto        { pagina, conEuros }   el hero de la home se vio (≥ la mitad de lo que cabe en pantalla)
//   Campana-visible   { pagina, conEuros }   una tarjeta de la campaña (GoFundMeProgress) se vio, una vez por vista
//   Prensa-visible    { pagina }             la tira de medios de la home se vio
//   entrada                                   propiedad que viaja en Donar, Clic-gofundme y Contacto-enviado
//
// Para qué sirven. «Donar» y «Clic-gofundme» cuentan clics, pero un porcentaje de conversión necesita el
// denominador: cuántas veces se vio lo que se pulsó. Y «conEuros» deja comparar, con la misma medida, la
// página con cifras de dinero y la que no las lleve: sin ella, un cambio en el hero se juzgaría contra
// el tráfico de otra semana. `entrada` (la primera página de la sesión) separa a quien llega a la home de
// quien llega a /lesiones o a /ciencia y dona después: el último clic no cuenta cómo llegó.
//
// Los nombres de estos eventos y de la propiedad son un CONTRATO: el rediseño (PR #329) los reutiliza
// tal cual, y cambiar una letra parte la serie en Umami entre antes y después. Solo lógica pura, sin DOM
// ni Vue, para poder probarla; el DOM está en composables/useUmamiVisto.ts y plugins/umami-vistas.client.ts.

export const EVENTO_HERO_VISTO = 'Hero-visto'
export const EVENTO_CAMPANA_VISIBLE = 'Campana-visible'
export const EVENTO_PRENSA_VISIBLE = 'Prensa-visible'

export const PROP_ENTRADA = 'entrada'
// Misma familia de claves que `hm_support_ts` (useSupport.ts). sessionStorage: por pestaña, se borra al cerrarla.
export const CLAVE_ENTRADA = 'hm_entrada'

/** Eventos que llevan `entrada`. Para añadir uno (p. ej. «Puerta», en el rediseño) basta con ponerlo aquí. */
export const EVENTOS_CON_ENTRADA: ReadonlySet<string> = new Set(['Donar', 'Clic-gofundme', 'Contacto-enviado'])

export type DatosUmami = Record<string, string | number | boolean>

/**
 * Nombre base de una ruta, sin el sufijo de idioma que añade i18n (`ciencia___es` y `ciencia___en` → `ciencia`),
 * como `destino` en «Navegar»: ES y EN suman juntas. Nunca la URL: ni query ni hash viajan a Umami.
 */
export function paginaBase(nombreRuta: unknown): string {
  return String(nombreRuta ?? '').split('___')[0] || 'desconocida'
}

// ── entrada ──────────────────────────────────────────────────────────────────────────────────────
// La primera página de la sesión, fijada UNA vez. Va a sessionStorage; si el navegador no lo deja
// (modo privado, almacenamiento bloqueado) queda en memoria, que vale mientras no se recargue.
let entradaEnMemoria: string | null = null
const ENTRADA_VALIDA = /^[a-z0-9_-]{1,60}$/i

export type Almacen = Pick<Storage, 'getItem' | 'setItem'>

function almacenDeSesion(): Almacen | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null // acceder a sessionStorage puede lanzar con el almacenamiento bloqueado
  }
}

/** Fija la entrada si aún no hay una. Devuelve la que vale (la ya fijada, si la había). */
export function fijarEntrada(pagina: string, almacen: Almacen | null = almacenDeSesion()): string {
  const previa = entradaDeSesion(almacen)
  if (previa) return previa
  const nueva = ENTRADA_VALIDA.test(pagina) ? pagina : 'desconocida'
  entradaEnMemoria = nueva
  try {
    almacen?.setItem(CLAVE_ENTRADA, nueva)
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  return nueva
}

/** La entrada de la sesión, o null si todavía no se sabe (la ruta inicial aún no se ha resuelto). */
export function entradaDeSesion(almacen: Almacen | null = almacenDeSesion()): string | null {
  try {
    const guardada = almacen?.getItem(CLAVE_ENTRADA)
    if (guardada && ENTRADA_VALIDA.test(guardada)) return guardada
  } catch {
    /* sin almacenamiento */
  }
  return entradaEnMemoria
}

/** Solo para los tests: olvida la entrada en memoria. */
export function olvidarEntrada() {
  entradaEnMemoria = null
}

/** Los datos del evento más `entrada`, si el evento la lleva y ya se sabe. Los demás eventos pasan intactos. */
export function conEntrada(evento: string, datos?: DatosUmami, almacen?: Almacen | null): DatosUmami | undefined {
  if (!EVENTOS_CON_ENTRADA.has(evento)) return datos
  const entrada = entradaDeSesion(almacen)
  return entrada ? { ...datos, [PROP_ENTRADA]: entrada } : datos
}

// ── lo que se ve ─────────────────────────────────────────────────────────────────────────────────
/**
 * ¿Se ha visto este bloque? Sí cuando la parte visible es la mitad de lo que PUEDE verse de él: la mitad del
 * bloque si cabe en pantalla, o la mitad de la pantalla si el bloque es más alto que ella (el hero en un móvil
 * mide más de una pantalla: exigirle la mitad de su alto no se cumpliría jamás y el denominador saldría vacío).
 * Un píxel de tolerancia por el redondeo de las medidas del navegador.
 */
export function esVisto(altoVisible: number, altoBloque: number, altoVentana: number, fraccion = 0.5): boolean {
  if (!(altoBloque > 0) || !(altoVentana > 0)) return false
  return altoVisible >= fraccion * Math.min(altoBloque, altoVentana) - 1
}

/** Umbrales del IntersectionObserver: cada 5 %, para que el aviso llegue cerca del punto exacto aun en bloques muy altos. */
export const UMBRALES_VISTO: number[] = Array.from({ length: 21 }, (_, i) => i / 20)

// Una vez por vista de página. Cambiar de página es otra vista (plugins/umami-vistas.client.ts lo reinicia en
// `page:start`). Sirve a /colabora, que tiene DOS tarjetas de campaña: sin esto, el denominador contaría doble.
let avisados = new Set<string>()
/** true la primera vez que se pide `clave` en esta vista; false las siguientes. */
export function avisarUnaVezPorVista(clave: string): boolean {
  if (avisados.has(clave)) return false
  avisados.add(clave)
  return true
}
export function reiniciarVistas() {
  avisados = new Set()
}

// ── enviar cuando el script de Umami ya está ────────────────────────────────────────────────────
// El script de Umami es `defer`: lo de arriba del todo (el hero, la tarjeta de /gastos) se ve antes de que
// cargue. Sin esperar, esos avisos se perderían SIEMPRE y el denominador saldría sesgado hacia lo que está abajo.
export const REINTENTOS_UMAMI = 20
export const ESPERA_UMAMI_MS = 250

export function enviarCuandoHaya(
  enviar: () => void,
  hayUmami: () => boolean,
  programar: (f: () => void, ms: number) => unknown = (f, ms) => setTimeout(f, ms)
) {
  let intentos = 0
  const probar = () => {
    if (hayUmami()) enviar()
    else if (++intentos < REINTENTOS_UMAMI) programar(probar, ESPERA_UMAMI_MS)
  }
  probar()
}
