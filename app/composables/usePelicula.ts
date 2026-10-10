/**
 * usePelicula — el reloj de «La película del caso» (/datos, 10-oct-2026).
 *
 * Un cabezal (ms UTC) recorre de `desde` a `fin`. Lo mueve quien mira: reproducir, arrastrar la
 * barra o saltar de capítulo. Nada arranca solo (Miriam + diseno, 26-sep: «un gráfico se anima si
 * lo pide quien mira»).
 *
 * Dos reglas que vienen del comité `diseno`:
 *  · al cruzar el inicio de CUALQUIER capítulo el cabezal se detiene el mismo tiempo (`PAUSA`). La
 *    pausa es igual para todos: no subraya una progresión más que el inicio de un tratamiento;
 *  · con «movimiento reducido» no hay barrido: reproducir avanza al capítulo siguiente, en seco.
 *
 * `seek` es la puerta determinista: el test de cifras y la grabación del vídeo colocan el cabezal
 * en un día exacto sin depender de requestAnimationFrame.
 */
import { DIA_MS } from '~/utils/datosCaso'

export interface Capitulo { k: string; t: number; nombre: string }

export const DURACION_PELICULA = 24000 // ms de `desde` a `fin` a velocidad ×1, sin contar pausas
export const PAUSA_CAPITULO = 900 // ms, la misma en todos los capítulos
export const VELOCIDADES = [0.5, 1, 2] as const

export function usePelicula(o: { desde: number; fin: number; capitulos: () => Capitulo[] }) {
  const cabezal = ref(o.desde)
  const reproduciendo = ref(false)
  const velocidad = ref<number>(1)
  const quieto = ref(false)
  let raf = 0
  let antes = 0
  let espera = 0

  const acotar = (t: number) => Math.min(o.fin, Math.max(o.desde, t))
  /** el cabezal, en un día entero: una fecha clínica no tiene hora */
  const aDia = (t: number) => Math.round(t / DIA_MS) * DIA_MS
  const alFinal = computed(() => cabezal.value >= o.fin)
  /** índice del capítulo en curso (-1: antes del primero) */
  const capitulo = computed(() => {
    let i = -1
    o.capitulos().forEach((c, j) => { if (c.t <= cabezal.value) i = j })
    return i
  })

  function seek(t: number) { cabezal.value = acotar(aDia(t)) }
  function pausar() { reproduciendo.value = false; cancelAnimationFrame(raf) }
  function paso(ahora: number) {
    if (!reproduciendo.value) return
    // una pestaña que vuelve de estar oculta no salta meses de golpe
    const dt = Math.min(100, Math.max(0, ahora - antes)) * velocidad.value
    antes = ahora
    if (espera > 0) espera -= dt
    else {
      const sig = cabezal.value + (dt / DURACION_PELICULA) * (o.fin - o.desde)
      const hito = o.capitulos().find((c) => c.t > cabezal.value && c.t <= sig && c.t < o.fin)
      if (hito) { cabezal.value = hito.t; espera = PAUSA_CAPITULO }
      else cabezal.value = Math.min(o.fin, sig)
      if (cabezal.value >= o.fin) { reproduciendo.value = false; return }
    }
    raf = requestAnimationFrame(paso)
  }
  function irCapitulo(d: 1 | -1) {
    pausar()
    const cs = o.capitulos()
    const destino = d === 1 ? cs.find((c) => c.t > cabezal.value)?.t ?? o.fin
      : [...cs].reverse().find((c) => c.t < cabezal.value)?.t ?? o.desde
    seek(destino)
  }
  function reproducir() {
    if (reproduciendo.value) { pausar(); return }
    if (quieto.value) { irCapitulo(1); return }
    if (alFinal.value) cabezal.value = o.desde // otra vez, desde el principio
    espera = 0
    reproduciendo.value = true
    antes = performance.now()
    raf = requestAnimationFrame(paso)
  }
  function otraVelocidad() {
    const i = VELOCIDADES.indexOf(velocidad.value as (typeof VELOCIDADES)[number])
    velocidad.value = VELOCIDADES[(i + 1) % VELOCIDADES.length]!
  }

  onMounted(() => { quieto.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches })
  onBeforeUnmount(() => cancelAnimationFrame(raf))
  return { cabezal, reproduciendo, velocidad, quieto, alFinal, capitulo, seek, pausar, reproducir, irCapitulo, otraVelocidad }
}
