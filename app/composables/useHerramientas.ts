import { HERRAMIENTAS, type EnlaceNav } from '~/utils/navegacion'

/**
 * Las herramientas que se enseñan (índice, banda de la home y pie): HERRAMIENTAS menos las que tienen
 * puerta y la tienen cerrada. Hoy solo el explorador de células: sale si su puerta está en `real`
 * (useCelulaExplorador), la misma regla que su tarjeta de «Próximos pasos». Así no hay enlace a una
 * página que diría «todavía no está abierto».
 */
export function useHerramientas() {
  const { hayReal } = useCelulaExplorador()
  const visible = (h: EnlaceNav) => h.key !== 'cell_explorer' || hayReal.value
  const herramientas = computed(() => HERRAMIENTAS.filter(visible))
  return { herramientas, visible }
}
