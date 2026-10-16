import resultadosJson from '~~/public/celula/resultados.json'
import { bloquesVisibles, hostPermiteDemo, type ClaveBloque, type Resultados } from '~/utils/celulaResultados'

/**
 * Estado de los resultados de /celula-a-celula para toda la página (una sola puerta, ver
 * app/utils/celulaResultados.ts). `reales`: lo que pasa la puerta (verificado + OK de Miriam).
 * `visibles`: lo que se pinta, que con `?demo=1` (solo fuera de producción y solo con datos
 * marcados `ejemplo: true`) incluye el ejemplo. Antes de montar, `demo` es siempre false: el HTML
 * estático nunca lleva el ejemplo.
 */
export function useCelulaResultados() {
  const res = resultadosJson as unknown as Resultados
  const route = useRoute()
  const montado = ref(false)
  onMounted(() => { montado.value = true })
  const demo = computed(() => montado.value && route.query.demo === '1' && res.ejemplo === true && hostPermiteDemo(window.location.hostname))
  const reales = computed<ClaveBloque[]>(() => bloquesVisibles(res))
  const visibles = computed<ClaveBloque[]>(() => bloquesVisibles(res, { demo: demo.value }))
  return { res, demo, reales, visibles, hayReales: computed(() => reales.value.length > 0) }
}
