// El vocabulario de los roles de contacto: UNO solo para el formulario, para los enlaces `?role=` y para Umami (T2d, 24-oct-2026).
//
// Antes cada evento hablaba el suyo: «Contacto» (las tarjetas de /colabora) decía `press`, «Contacto-enviado» (el formulario) decía
// `journalist` y, sin rol elegido, `otro`; «Contacto-clic» (el plugin, por el `?role=` del enlace) aceptaba cualquier palabra y, sin rol,
// decía `sin_rol`. Tres series que no se podían cruzar. Ahora los tres usan estos seis valores (los del selector del formulario) y
// `sin_rol` cuando no hay ninguno.
//
// Discontinuidad en Umami, a anotar: en «Contacto», `press` pasa a `journalist` (desde el 24-oct-2026, suman en el mismo valor); en
// «Contacto-enviado», `otro` (formulario enviado sin elegir perfil) pasa a `sin_rol`. `other` es el perfil «Otro» que SÍ se eligió.

export const ROLES_CONTACTO = ['oncologist', 'researcher', 'journalist', 'patient', 'tech', 'other'] as const
export type RolContacto = (typeof ROLES_CONTACTO)[number]

/** Lo que se manda a Umami cuando no hay un rol válido (enlace sin `?role=`, o con uno que no es de la lista). */
export const SIN_ROL = 'sin_rol'

export function esRolContacto(valor: unknown): valor is RolContacto {
  return typeof valor === 'string' && (ROLES_CONTACTO as readonly string[]).includes(valor)
}

/** El rol si es de la lista; `sin_rol` si no. Nunca devuelve texto libre: lo que llega de una URL no viaja a Umami. */
export function rolDeContacto(valor: unknown): RolContacto | typeof SIN_ROL {
  return esRolContacto(valor) ? valor : SIN_ROL
}
