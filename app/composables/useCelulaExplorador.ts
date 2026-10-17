import manifiestoJson from '~~/public/celula/explorador/manifiesto.json'
import { hostPermiteDemo } from '~/utils/celulaResultados'
import { estadoPuerta, motivosLesion, sha256Hex, type Lesion, type LesionDatos, type Manifiesto } from '~/utils/celulaExplorador'

/**
 * Estado del explorador (/celula-a-celula/explorar) para toda la página: UNA puerta
 * (app/utils/celulaExplorador.ts, con test). El manifiesto se importa (viaja en el HTML) para que el
 * HTML estático sepa si la puerta está abierta; las lesiones se piden SOLO si lo está, y antes de
 * pintarlas se comprueba su sha256 contra el manifiesto y su forma (motivosLesion). `?demo=1` abre el
 * ejemplo solo fuera de producción y solo después de montar: el HTML estático nunca lo lleva.
 */
export function useCelulaExplorador() {
  const man = manifiestoJson as unknown as Manifiesto
  const route = useRoute()
  const montado = ref(false)
  onMounted(() => { montado.value = true })
  const demo = computed(() => montado.value && route.query.demo === '1' && hostPermiteDemo(window.location.hostname))
  const estado = computed(() => estadoPuerta(man, { demo: demo.value }))
  const hayReal = computed(() => estadoPuerta(man) === 'real')
  return { man, demo, estado, hayReal }
}

/** Pide una lesión, coteja su sha256 con el manifiesto y su forma. Error = no se pinta. */
export async function cargaLesion(man: Manifiesto, l: Lesion, ejemplo: boolean): Promise<LesionDatos> {
  const f = man.ficheros.find((x) => x.ruta === `${l}.json`)
  if (!f) throw new Error('fichero no declarado')
  const r = await fetch(`/celula/explorador/${f.ruta}`, { cache: 'no-cache' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const buf = await r.arrayBuffer()
  if ((await sha256Hex(buf)) !== f.sha256) throw new Error('sha256 distinto del manifiesto')
  const d = JSON.parse(new TextDecoder().decode(buf)) as LesionDatos
  const motivos = motivosLesion(d, { lesion: l, ejemplo })
  if (motivos.length) throw new Error(motivos.slice(0, 3).join('; '))
  return d
}
