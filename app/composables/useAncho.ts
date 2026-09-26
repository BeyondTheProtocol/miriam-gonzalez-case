/**
 * useAncho — ancho real del contenedor de un gráfico, en píxeles.
 *
 * Los gráficos de /datos dibujan con viewBox = ancho real, así un texto de 11 px mide 11 px en
 * un móvil de 375 y en un escritorio de 1280 (con un viewBox fijo, la letra encogía en el móvil
 * y crecía en el escritorio). En el servidor no hay ancho: se pinta a 360 (móvil primero) y el
 * cliente lo corrige al montar, sin desajuste de hidratación porque es un cambio posterior.
 */
export function useAncho(el: Ref<HTMLElement | null>, inicial = 360) {
  const ancho = ref(inicial)
  let ro: ResizeObserver | null = null
  onMounted(() => {
    if (!el.value) return
    const medir = () => { if (el.value) ancho.value = Math.max(280, Math.round(el.value.clientWidth)) }
    medir()
    ro = new ResizeObserver(medir)
    ro.observe(el.value)
  })
  onBeforeUnmount(() => ro?.disconnect())
  return ancho
}
