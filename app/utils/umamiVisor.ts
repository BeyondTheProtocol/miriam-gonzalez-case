// Medición de Umami, tercera parte (T2d, 24-oct-2026): ¿se USÓ el visor, o se fue sin tocarlo?
//
//   Visor { herramienta, accion }   la PRIMERA vez que alguien toca un visor en esta visita; las siguientes no mandan nada
//
// Para qué sirve. En /lesiones el 97 % de las visitas acababa en la misma página y no había forma de separar «se fue» de «lo usó»: el
// recorrido no ve los clics dentro de la página y /lesiones dispara varias vistas por visita (2,5 de media, medido en Umami). Con «Visor»,
// la parte de visitas que lo tocan es `Visor ÷ visitantes de la página`, y `accion` dice por dónde empezaron.
//
// Cómo se marca un visor (nada de código en el componente; una pareja de atributos en el contenedor):
//   data-visor="lesiones"          la herramienta (minúsculas, cifras y _; 2 a 30)
//   data-visor-accion="mama"       opcional: qué parte del visor es. Sin él: `mover` (un lienzo) o `control` (un botón, una pestaña…)
// El plugin plugins/umami-visor.client.ts mira todo el documento (como el de clics y scroll), así que otra página o PR que ponga el
// atributo queda medida sin más. Pendiente: el explorador de célula a célula (pages/celula-a-celula-explorar.vue) no lo lleva todavía
// porque ese fichero lo comparte el PR #290; cuando se fusione, basta `data-visor="explorador"` en el contenedor de su visor.
//
// «UNA vez por visita» = una vez por SESIÓN del navegador (sessionStorage, o en memoria si el navegador no lo deja) y por herramienta, no
// por vista de página: volver a /lesiones tras pasar por la home no cuenta otra vez, y los refrescos de vista que hace el visor tampoco.
//
// Qué cuenta como tocarlo: un clic o toque con el botón principal, o Intro, Espacio o flechas, SOBRE algo con lo que se puede hacer algo
// (un lienzo, un botón, un selector, una pestaña, una opción…); un párrafo dentro del contenedor no cuenta. Es «lo tocó», no «lo usó con
// intención»: un dedo que empieza a desplazar la página sobre el lienzo también cuenta. Sin cookies ni identificadores.
//
// Solo lógica pura, sin DOM ni Vue, para poder probarla. El DOM está en plugins/umami-visor.client.ts.

import type { Almacen } from './umamiVistas'

export const EVENTO_VISOR = 'Visor'
// Misma familia de claves que `hm_entrada` (umamiVistas.ts). sessionStorage: por pestaña, se borra al cerrarla.
export const CLAVE_VISOR = 'hm_visor'

const NOMBRE_VALIDO = /^[a-z0-9_]{2,30}$/

/** Lo que se puede tocar dentro de un visor. Se usa con `Element.closest`. */
export const SELECTOR_TOCABLE =
  'canvas, button, select, input, textarea, summary, [role="button"], [role="option"], [role="tab"], [role="slider"], [role="switch"], [role="checkbox"], [role="radio"], [role="application"]'

const TECLAS_DE_USO: ReadonlySet<string> = new Set(['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
/** ¿Esta tecla es usar un control (activarlo, moverlo)? Tabular o escribir una letra no lo es. */
export function esTeclaDeUso(tecla: string): boolean {
  return TECLAS_DE_USO.has(tecla)
}

/** El nombre si es válido (herramienta o acción); null si no. Nada de texto libre hacia Umami. */
export function nombreDeVisor(valor: unknown): string | null {
  return typeof valor === 'string' && NOMBRE_VALIDO.test(valor) ? valor : null
}

/** La acción: la del contenedor si la declara; si no, `mover` para un lienzo (se arrastra) y `control` para lo demás. */
export function accionDeVisor(explicita: unknown, etiqueta: string): string {
  return nombreDeVisor(explicita) ?? (etiqueta.toLowerCase() === 'canvas' ? 'mover' : 'control')
}

// ── una vez por visita ──────────────────────────────────────────────────────────────────────────
let enMemoria = new Set<string>()

function almacenDeSesion(): Almacen | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null // acceder a sessionStorage puede lanzar con el almacenamiento bloqueado
  }
}

function leidos(almacen: Almacen | null): Set<string> {
  const hechos = new Set(enMemoria)
  try {
    for (const h of (almacen?.getItem(CLAVE_VISOR) ?? '').split(',')) if (nombreDeVisor(h)) hechos.add(h)
  } catch {
    /* sin almacenamiento: vale lo que haya en memoria */
  }
  return hechos
}

/**
 * Apunta que `herramienta` ya se midió en esta visita. Devuelve true la PRIMERA vez (hay que mandar el evento) y false las siguientes.
 * Una herramienta con un nombre que no vale devuelve false: no se manda nada.
 */
export function registrarVisor(herramienta: string, almacen: Almacen | null = almacenDeSesion()): boolean {
  if (!nombreDeVisor(herramienta)) return false
  const hechos = leidos(almacen)
  if (hechos.has(herramienta)) return false
  hechos.add(herramienta)
  enMemoria = hechos
  try {
    almacen?.setItem(CLAVE_VISOR, [...hechos].join(','))
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  return true
}

/** Solo para los tests: olvida lo que haya en memoria. */
export function olvidarVisores() {
  enMemoria = new Set()
}
