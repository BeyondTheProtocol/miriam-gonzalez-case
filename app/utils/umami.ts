// Tracking de eventos de Umami (analytics). Seguro en SSR y si el script aún
// no ha cargado (defer): si `window.umami` no existe, no hace nada. Convive con
// Plausible (ver useSupport.ts) — cada acción puede disparar ambos.
// `conEntrada` (umamiVistas.ts) añade la propiedad `entrada` solo a los eventos que la llevan.
import { conEntrada } from './umamiVistas'

export function trackUmami(event: string, data?: Record<string, string | number | boolean>) {
  if (!import.meta.client) return
  const w = window as unknown as {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
  w.umami?.track(event, conEntrada(event, data))
}

// ── Medición delegada (rediseño F0, 23-oct-2026) ─────────────────────────────────────────────
// Eventos NUEVOS que no dependen de que cada enlace llame a su `trackX`: los emite el plugin
// `umami-delegado.client.ts` mirando clics y scroll de todo el documento, así que cubren también
// los enlaces que se añadan después (hero nuevo, QueBuscamos…) y las páginas que otro PR está
// tocando. Los eventos que ya existían (Donar, Contacto, Pathway…) NO se tocan ni se renombran:
// cambiar un nombre parte la serie en Umami. Aquí solo hay lógica pura, sin DOM, para poder probarla.
//
//   Clic-gofundme   { pagina, origen }  clic a gofund.me / gofundme.com, desde cualquier enlace (y `entrada`: umamiVistas.ts)
//   VerPeticion     { origen }          clic a un enlace con el ancla #que-buscamos
//   Contacto-clic   { rol, pagina }     clic a /contacto (· /en/contact), con el rol de ?role=
//   Scroll          { pct, pagina }     recorrido de scroll alcanzado: 25 · 50 · 75 · 100
//
// `pagina` es el nombre base de la ruta (index, ciencia, datos…) y no la URL, así ES y EN suman
// juntas, igual que `destino` en «Navegar». Nunca se envía la query ni el hash.

export const EVENTO_GOFUNDME = 'Clic-gofundme'
export const EVENTO_PETICION = 'VerPeticion'
export const EVENTO_CONTACTO_CLIC = 'Contacto-clic'
export const EVENTO_SCROLL = 'Scroll'

export type EventoUmami = { evento: string; datos: Record<string, string | number> }

/** ¿`href` (absoluto) lleva a la campaña de GoFundMe? gofund.me/… o gofundme.com/… */
export function esEnlaceGoFundMe(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase()
    return host === 'gofund.me' || host === 'www.gofund.me' || host === 'gofundme.com' || host.endsWith('.gofundme.com')
  } catch {
    return false
  }
}

// Origen del último clic de apoyo: la etiqueta de `trackSupport` (home_hero, cabecera, barra_movil…).
// El manejador del propio enlace corre ANTES que el del documento, así que cuando el plugin ve el
// clic, `trackSupport` ya dejó aquí su etiqueta. Caduca enseguida: un clic a GoFundMe sin etiqueta
// (enlace que no llama a trackSupport) no debe heredar la del anterior.
let ultimoApoyo: { origen: string; t: number } | null = null
const APOYO_CADUCA_MS = 2000
export function recordarApoyo(origen: string, ahora: number = Date.now()) {
  ultimoApoyo = { origen, t: ahora }
}
export function apoyoReciente(ahora: number = Date.now()): string | null {
  return ultimoApoyo && ahora - ultimoApoyo.t <= APOYO_CADUCA_MS ? ultimoApoyo.origen : null
}

const ROL_VALIDO = /^[a-z]{2,20}$/
const RUTAS_CONTACTO = new Set(['/contacto', '/en/contact'])

/**
 * Qué evento (si alguno) corresponde a un clic en un enlace.
 * @param href    `a.href`, ya absoluto
 * @param origen  `location.origin`: solo los enlaces internos cuentan para Contacto-clic y VerPeticion
 * @param pagina  nombre base de la ruta donde se hizo el clic
 * @param apoyo   etiqueta del último `trackSupport` (o null)
 */
export function clasificarClic(href: string, origen: string, pagina: string, apoyo: string | null): EventoUmami | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (esEnlaceGoFundMe(href)) {
    return { evento: EVENTO_GOFUNDME, datos: { pagina, origen: apoyo ?? 'sin_etiqueta' } }
  }
  if (url.origin !== origen) return null
  if (url.hash === '#que-buscamos') {
    return { evento: EVENTO_PETICION, datos: { origen: pagina } }
  }
  const ruta = url.pathname.replace(/\/+$/, '')
  if (RUTAS_CONTACTO.has(ruta)) {
    const rol = url.searchParams.get('role') ?? ''
    return { evento: EVENTO_CONTACTO_CLIC, datos: { rol: ROL_VALIDO.test(rol) ? rol : 'sin_rol', pagina } }
  }
  return null
}

export const UMBRALES_SCROLL = [25, 50, 75, 100] as const
// Por debajo de este recorrido (alto de la página menos alto de la ventana) no hay nada que medir:
// una página que casi cabe en pantalla regalaría el 100 a todo el que la abre.
const RECORRIDO_MIN_PX = 200
// Llegar «al final» no exige el píxel exacto: los navegadores móviles no lo alcanzan (barras que aparecen
// y desaparecen) y las páginas crecen un poco al llegar abajo (contenido que carga al acercarse; medido en
// /ciencia: +71 px de 7.300 justo cuando la tecla Fin llegaba al pie). Vale quedarse a 8 px o al 2 % del recorrido.
const FINAL_TOLERANCIA_PX = 8
const FINAL_TOLERANCIA_FRACCION = 0.02

/**
 * Cuánto del recorrido de scroll de la página lleva hecho quien la lee: 0 arriba, 100 en el pie.
 * Devuelve null si la página no tiene recorrido suficiente. Se mide el recorrido y no el borde de la
 * ventana sobre el alto total, para que la primera pantalla no cuente como «25 %» sin haber bajado.
 */
export function profundidadScroll(scrollY: number, altoVentana: number, altoPagina: number): number | null {
  const recorrido = altoPagina - altoVentana
  if (!(recorrido >= RECORRIDO_MIN_PX)) return null
  if (recorrido - scrollY <= Math.max(FINAL_TOLERANCIA_PX, recorrido * FINAL_TOLERANCIA_FRACCION)) return 100
  return Math.max(0, Math.min(100, (scrollY / recorrido) * 100))
}

// Un scroll cuenta solo si lo ha movido quien lee: rueda o trackpad, dedo, teclado o barra de scroll.
// El que mueve el propio sitio no cuenta. Medido en el build (23-oct-2026): al saltar de un enlace del pie
// a /datos, el navegador recoloca la página con el scroll anchoring y la animación del router, y
// «Scroll» habría mandado los cuatro umbrales de una página que nadie había leído.
// Tras el último gesto el scroll sigue valiendo un rato (la inercia del dedo no emite eventos).
export const GESTO_VALE_MS = 1200
export function scrollDeUsuario(ahora: number, ultimoGesto: number, arrastrandoBarra: boolean): boolean {
  return arrastrandoBarra || (ultimoGesto > 0 && ahora - ultimoGesto <= GESTO_VALE_MS)
}

/** Umbrales que la profundidad `pct` ya ha cruzado y aún no se han enviado en esta vista. */
export function umbralesNuevos(pct: number | null, enviados: ReadonlySet<number>): number[] {
  if (pct === null) return []
  return UMBRALES_SCROLL.filter((u) => pct >= u && !enviados.has(u))
}
