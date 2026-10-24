/**
 * Las cinco puertas (rediseño de arquitectura, F3, 23-oct-2026; las pinta la home desde F5, 23-oct-2026; la quinta, «Tecnología,
 * IA y marcas», entra en la tanda 2, T2a, 24-oct-2026): la taxonomía ÚNICA de «qué quiere hacer quien llega». Sustituye a los dos
 * enrutadores que había (las 7 tarjetas de la home, con sus accesos directos, y el selector «por perfil» del pie y de /colabora):
 * ni minutos ni pasos, un nombre y un destino. La home las pinta con Puertas.vue; /colabora lo hará en F10 (hasta entonces
 * conserva sus chips «por perfil»).
 *
 * Por qué la quinta: en los 60 días medidos, «tech» fue la ruta más pulsada de las tarjetas viejas (287 de 712 «Pathway», el
 * 40 %) y el rol de la mayoría de los contactos (90 de 159 «Contacto»). Metida en «Otras formas» desaparecía.
 *
 * Antes de F5 este fichero también tenía ACCESOS (los accesos directos de «Elige tu camino», plan del 20-oct-2026) y
 * accesosDe(): se fueron con las tarjetas. Se queda REPO_URL, que lee el schema.org del layout.
 *
 * · `etiqueta` → clave i18n (`puertas.*`).
 * · `destino` → la campaña (`apoyo`: quien pinta resuelve GOFUNDME_URL y mide con trackSupport) o una ruta por NOMBRE, con su
 *   ancla. «Clínico o laboratorio» aterriza en «Qué buscamos» (/datos#que-buscamos), la petición concreta. «Tecnología, IA y
 *   marcas» aterriza en la tarjeta «Tech & IA» de /colabora (#tech-ia: el repo, el pipeline abierto y el contacto con el rol
 *   tech ya marcado): es el sitio donde ya iban esos contactos, y un ancla que existe.
 */
// El repo público, el mismo que enlazan el layout (schema.org) y /colabora.
export const REPO_URL = 'https://github.com/beyondtheprotocol/miriam-gonzalez-case'

export type PuertaId = 'apoyar' | 'clinico' | 'tecnologia' | 'prensa' | 'otras'
export type DestinoPuerta = { tipo: 'apoyo' } | { tipo: 'ruta'; name: string; hash?: string }
export interface Puerta {
  id: PuertaId
  etiqueta: string
  destino: DestinoPuerta
}

export const PUERTAS: Puerta[] = [
  { id: 'apoyar', etiqueta: 'puertas.apoyar', destino: { tipo: 'apoyo' } },
  { id: 'clinico', etiqueta: 'puertas.clinico', destino: { tipo: 'ruta', name: 'datos', hash: '#que-buscamos' } },
  { id: 'tecnologia', etiqueta: 'puertas.tecnologia', destino: { tipo: 'ruta', name: 'colabora', hash: '#tech-ia' } },
  { id: 'prensa', etiqueta: 'puertas.prensa', destino: { tipo: 'ruta', name: 'prensa' } },
  { id: 'otras', etiqueta: 'puertas.otras', destino: { tipo: 'ruta', name: 'colabora' } },
]
