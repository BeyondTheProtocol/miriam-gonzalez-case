/**
 * Movimiento que respeta `prefers-reduced-motion` (WCAG 2.3.3) para los desplazamientos de JS. Lo usan todos menos el
 * explorador de /celula-a-celula/explorar, que lleva su propia comprobación (`quieto`) por estar compartido con otra rama.
 *
 * El CSS ya lo respeta (`scroll-behavior: smooth` solo con `no-preference`, en main.css), pero un
 * `scrollIntoView` con comportamiento suave escrito a mano lo pisa: el comportamiento explícito gana al de la hoja de estilos. Por eso
 * cada desplazamiento suave de JS pide aquí su comportamiento: `'auto'` (salto) si el lector pide menos movimiento,
 * `'smooth'` si no. Antes vivía solo dentro de pages/mapa-metastasis.vue (R20 del repaso de guardados, 21-oct-2026).
 *
 * Fuera del navegador (prerender) no hay preferencia que leer: devuelve `'smooth'`, que allí nadie usa.
 */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function smoothOrAuto(): ScrollBehavior {
  return prefiereMenosMovimiento() ? 'auto' : 'smooth'
}
