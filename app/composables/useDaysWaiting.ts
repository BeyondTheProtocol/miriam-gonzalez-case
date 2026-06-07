/**
 * Días esperando una nueva línea de tratamiento.
 * Día 0 = 30/03/2026, suspensión de abemaciclib (fin de la 2ª línea).
 * Compartido por la nota de estado de la cronología en todas sus variantes.
 */
export const WAITING_DAY_ZERO = '2026-03-30'

export function useDaysWaiting() {
  const days = computed(() =>
    Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(`${WAITING_DAY_ZERO}T00:00:00`).getTime()) / 86400000
      )
    )
  )
  return { days }
}
