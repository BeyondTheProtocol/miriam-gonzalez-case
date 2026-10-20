<script setup lang="ts">
/**
 * /laminillas · /en/slides — las laminillas escaneadas del caso, en un visor público.
 *
 * Navegación (rehecha el 20-oct-2026: «no es intuitiva»): un selector arriba, tinción × muestra, y
 * debajo un escenario que cambia en su sitio. Al llegar, el escenario es la matriz marcador ×
 * muestra con miniaturas (prerenderizada: se lee sin JS y no carga teselas). Elegir una tinción la
 * compara en todas sus muestras (OpenSeadragon, zoom a la par en µm, movimiento enlazado solo dentro
 * del mismo bloque); elegir una muestra, o tocar una miniatura, la enseña sola. Anterior/siguiente
 * recorre las tinciones (o, con una muestra, sus laminillas). «HE de referencia» pone la HE de la
 * misma muestra junto a cada panel. Todo sale de app/data/laminillas.json (ver app/utils/laminillas.ts).
 *
 * Herramienta de apoyo, no diagnóstico. Cada dato clínico de las fichas lleva su sello de
 * verificación contra el informe original. Sin normalizar color.
 */
import datos from '~/data/laminillas.json'
import { conMarcador, deMuestra, enMuestra, filas as calculaFilas, heDe, mueveVista, queryDeVista, vistaDeQuery, type Fila, type Laminilla, type Manifest, type Vista } from '~/utils/laminillas'

const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const idioma = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (idioma.value === 'en' ? en : es)

const M = datos as unknown as Manifest
const teselas = (config.public.laminillasTeselas as string) || M.teselas
const filas = calculaFilas(M)
const total = M.laminillas.length
const nMuestras = M.muestras.length
const PALABRAS: Record<'es' | 'en', string[]> = { es: ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco'], en: ['zero', 'one', 'two', 'three', 'four', 'five'] }
const palabra = (n: number, i: 'es' | 'en') => PALABRAS[i][n] ?? String(n)

const seoTitle = () => idioma.value === 'en' ? 'The slides, under the microscope · Miriam’s case' : 'Las laminillas, al microscopio · el caso de Miriam'
const seoDescription = () => idioma.value === 'en'
  ? `${total} scanned pathology slides from ${palabra(nMuestras, 'en')} of Miriam’s samples, side by side: zoom down to the cell, a micron ruler set to each scanner and what each report says. A support tool, not a diagnosis.`
  : `${total} laminillas de anatomía patológica escaneadas de ${palabra(nMuestras, 'es')} muestras de Miriam, lado a lado: zoom hasta la célula, una regla en micras ajustada a cada escáner y lo que dice cada informe. Herramienta de apoyo, no diagnóstico.`
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
})

const t = (x: { es: string; en: string } | null | undefined) => (x ? x[idioma.value] : '')
const nombreMarcador = (id: string) => t(M.marcadores.find((m) => m.id === id)?.nombre)
const nombreMuestra = (id: string) => t(M.muestras.find((m) => m.id === id)?.corto)
const conVariante = (base: string, l: Laminilla) => base + (l.variante ? ' · ' + t(l.variante) : '')
const etiqueta = (l: Laminilla) => conVariante(`${nombreMarcador(l.marcador)} · ${nombreMuestra(l.muestra)}`, l)
// Para el lector de pantalla, comas: el «·» separa sigla y nombre y también tinción y muestra, y
// según el nivel de puntuación se calla sin pausa o se lee (pase de voz, 20-oct).
const etiquetaVoz = (l: Laminilla) => etiqueta(l).replaceAll(' · ', ', ')
const mppTexto = (mpp: number, dec: number) => mpp.toLocaleString(idioma.value === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: dec })

const grupos = computed(() => {
  const g: { id: string; titulo: string; filas: Fila[] }[] = [
    { id: 'todas', titulo: L(`En las ${nMuestras} muestras`, `In all ${nMuestras} samples`), filas: filas.filter((f) => f.n === nMuestras) },
    { id: 'varias', titulo: L('En más de una muestra', 'In more than one sample'), filas: filas.filter((f) => f.n > 1 && f.n < nMuestras) },
    { id: 'una', titulo: L('En una sola muestra', 'In a single sample'), filas: filas.filter((f) => f.n === 1) },
  ]
  return g.filter((x) => x.filas.length)
})
// Nombre corto para el selector («RE · receptor de estrógenos» → «RE»); el completo va en aria-label.
const corto = (f: Fila) => t(f.marcador.nombre).split(' · ')[0]!
const nombreChip = (f: Fila) => (corto(f) === t(f.marcador.nombre) ? undefined : t(f.marcador.nombre).replaceAll(' · ', ', '))
const tituloChip = (f: Fila) => t(f.marcador.nombre) + (f.marcador.nota ? ` (${t(f.marcador.nota)})` : '')

// La vista sale SOLO de la query (ver vistaDeQuery: también los enlaces de antes del 20-oct). En la
// página prerenderizada la query llega vacía durante la hidratación y se aplica después.
const vista = computed<Vista>(() => vistaDeQuery(M, route.query))
const filaActual = computed(() => filas.find((f) => f.marcador.id === vista.value.marcador))
const columnasFila = computed(() => M.muestras.filter((m) => filaActual.value?.celdas[m.id]))
const recorrido = computed(() => (vista.value.muestra ? deMuestra(M, vista.value.muestra) : []))
const actual = computed(() => recorrido.value[Math.min(vista.value.paso, recorrido.value.length - 1)])

// Móvil (< 768 px): el visor enseña un panel cada vez, así que la rejilla es siempre la comparación
// y la muestra elegida decide qué panel se ve (cambiar de muestra no reabre nada). En escritorio,
// una muestra sola es un panel grande.
const estrecho = ref(false)
let mq: MediaQueryList | null = null
const alMq = () => { estrecho.value = !!mq?.matches }
const muestraVisible = computed(() => vista.value.muestra ?? columnasFila.value[0]?.id ?? null)

const puedeHE = computed(() => !!vista.value.marcador && vista.value.marcador !== 'he')
const conHE = computed(() => vista.value.he && puedeHE.value)
const rejilla = computed<(Laminilla | null)[][]>(() => {
  if (!filaActual.value) return []
  if (vista.value.muestra && !estrecho.value && actual.value) {
    const he = heDe(M, actual.value.muestra)
    return [conHE.value && he ? [actual.value, he] : [actual.value]]
  }
  // La muestra elegida pone SU laminilla (p. ej. el 2.º corte de HE), no la primera de la fila.
  const arriba = columnasFila.value.map((m) => (m.id === vista.value.muestra && actual.value ? actual.value : filaActual.value!.celdas[m.id]![0]!))
  return conHE.value ? [arriba, columnasFila.value.map((m) => heDe(M, m.id) ?? null)] : [arriba]
})
const unaSola = computed(() => !!vista.value.muestra && !estrecho.value)
// Rótulo corto en cada panel (el título ya dice el resto). El nombre accesible lleva siempre las dos cosas.
const rotulos = computed(() => rejilla.value.flatMap((filaR, r) => filaR.map((l) => {
  if (!l) return ''
  if (unaSola.value) return r === 0 && l === actual.value ? conVariante(nombreMarcador(l.marcador), l) : L('HE de referencia', 'Reference H&E')
  return r === 0 ? conVariante(nombreMuestra(l.muestra), l) : `HE · ${nombreMuestra(l.muestra)}`
})))
const nombres = computed(() => rejilla.value.flat().map((l) => (l ? etiquetaVoz(l) : '')))
// En móvil solo se ve un panel: debajo, solo sus fichas.
const fichas = computed(() => rejilla.value.flat().filter((l): l is Laminilla => !!l && (!estrecho.value || l.muestra === muestraVisible.value)))
const tituloVisor = computed(() => {
  if (!filaActual.value) return ''
  const nombre = t(filaActual.value.marcador.nombre)
  if (unaSola.value && vista.value.muestra) return `${nombre} · ${nombreMuestra(vista.value.muestra)}`
  const n = columnasFila.value.length
  // Una sola muestra: se nombra (antes «en su muestra», que no decía cuál). Dos: «both» en inglés.
  if (n === 1) return `${nombre} · ${nombreMuestra(columnasFila.value[0]!.id)}`
  return L(`${nombre} en las ${n} muestras`, `${nombre} in ${n === 2 ? 'both samples' : `all ${n} samples`}`)
})
// Lo que se cuenta cambia: tinciones (en todas) o laminillas (una muestra). Se ve desde 768 px.
const queCuenta = computed(() => (vista.value.muestra ? L('Laminilla', 'Slide') : L('Tinción', 'Stain')))
const posicion = computed(() => {
  if (vista.value.muestra) return { i: Math.min(vista.value.paso, recorrido.value.length - 1) + 1, n: recorrido.value.length }
  return { i: filas.findIndex((f) => f.marcador.id === vista.value.marcador) + 1, n: filas.length }
})
// Donde se leen las cifras que no coinciden entre informes, el aviso se repite junto al visor.
const conDiscordancia = computed(() => ['re', 'rp', 'ki67'].includes(vista.value.marcador ?? ''))
const textoDiscordancia = computed(() => L(
  'Las lecturas del bloque de mama no coinciden en todas las cifras: RE 95 % en el informe de 2024 y 85 % en la revisión de 2026, RP 5 % y 20 %, Ki-67 60 % y 40 %. Cada ficha da la del informe de su propia tanda de laminillas.',
  'The readings of the breast block do not agree on every figure: ER 95% in the 2024 report and 85% in the 2026 review, PR 5% and 20%, Ki-67 60% and 40%. Each record gives the figure from the report for its own batch of slides.'))

// Abrir el visor desde la matriz entra en el historial (el «atrás» del móvil vuelve a la tabla);
// moverse dentro (tinción, muestra, anterior/siguiente, HE), no. El scroll lo lleva la página
// (router.options.ts no lo toca para estas claves).
// El foco va al título solo cuando alguien abre el visor desde la matriz, no al llegar con un enlace.
// `origen` es el botón desde el que se abrió (data-origen): al volver a la matriz (chip, botón o
// «atrás») la página vuelve a él y le devuelve el foco, en vez de dejarte arriba de la tabla.
let focoAlTitulo = false
let origen: string | null = null
function ve(v: Vista, desde?: string) {
  const desdeMatriz = !vista.value.marcador && !!v.marcador
  focoAlTitulo = desdeMatriz
  if (desdeMatriz) origen = desde ?? null
  const q = queryDeVista(v)
  return desdeMatriz || !v.marcador ? router.push({ query: q }) : router.replace({ query: q })
}
const eligeTincion = (id: string) => ve(conMarcador(M, vista.value, id), `chip:${id}`)
function eligeMuestra(id: string | null) {
  const v = enMuestra(M, vista.value, id)
  if (v) ve(v)
}
const abreFila = (id: string) => ve({ marcador: id, muestra: null, paso: 0, he: vista.value.he }, `fila:${id}`)
function abreLaminilla(l: Laminilla) {
  const paso = deMuestra(M, l.muestra).findIndex((x) => x.id === l.id)
  ve({ marcador: l.marcador, muestra: l.muestra, paso: Math.max(0, paso), he: vista.value.he }, `mini:${l.id}`)
}
function abreColumna(id: string) {
  const primera = deMuestra(M, id)[0]
  if (primera) ve({ marcador: primera.marcador, muestra: id, paso: 0, he: vista.value.he }, `col:${id}`)
}
const aMatriz = () => ve({ marcador: null, muestra: null, paso: 0, he: false })
const mueve = (d: number) => ve(mueveVista(M, vista.value, d))
const alternaHE = () => ve({ ...vista.value, he: !vista.value.he })
const tieneTincion = (id: string) => !!filaActual.value?.celdas[id]
const muestraElegida = (id: string) => (estrecho.value ? muestraVisible.value === id : vista.value.muestra === id)

// Desde 768 px se pega bajo la cabecera del sitio SOLO la fila del título del visor (título,
// anterior/siguiente, volver): el selector entero pegado fijaba 282 px y tapaba el foco (diseno,
// 20-oct). Mientras algo está pegado, scroll-padding-top evita que el foco quede debajo (WCAG 2.4.11).
const altoCabecera = ref(80)
const encabezado = ref<HTMLElement | null>(null)
const filaTitulo = ref<HTMLElement | null>(null)
const seccion = ref<HTMLElement | null>(null)
const ancla = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null
const cabecera = () => document.querySelector<HTMLElement>('[data-cabecera-fija]')
const pegada = () => !!filaTitulo.value && getComputedStyle(filaTitulo.value).position === 'sticky'
/** Alto fijo arriba: la cabecera del sitio y, si hay visor pegado, su fila del título. */
const altoFijo = (conFila = true) => (cabecera()?.getBoundingClientRect().height ?? altoCabecera.value) + (conFila && pegada() ? filaTitulo.value!.getBoundingClientRect().height : 0)
function mide() {
  altoCabecera.value = Math.ceil(cabecera()?.getBoundingClientRect().height ?? 80)
  document.documentElement.style.scrollPaddingTop = `${Math.ceil(altoFijo()) + 8}px`
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 767px)')
  alMq()
  mq.addEventListener('change', alMq)
  mide()
  ro = new ResizeObserver(mide)
  const cab = cabecera()
  if (cab) ro.observe(cab)
})
watch(filaTitulo, (el, viejo) => { if (viejo) ro?.unobserve(viejo); if (el) ro?.observe(el); nextTick(mide) })
onBeforeUnmount(() => { mq?.removeEventListener('change', alMq); ro?.disconnect(); document.documentElement.style.scrollPaddingTop = '' })

// Al cambiar lo que se ve, el título del visor (o la matriz) se lleva bajo la cabecera y el
// selector, si no está ya ahí. Al abrir desde la matriz, el foco va al título.
const suave = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** Lleva `destino` bajo la cabecera si está tapado o demasiado abajo. Se mide en el momento. */
function aLaVista(destino: HTMLElement | null, animado = true, centrado = false) {
  if (!destino) return
  // El visor se mide por su sección (la fila pegada da su posición pegada, no la natural) y se deja
  // justo donde se pega su fila del título: así anterior/siguiente no mueve la página ni un píxel.
  const esVisor = destino === seccion.value
  const fijo = esVisor ? altoFijo(false) + (pegada() ? 0 : 8) : altoFijo() + 8
  const caja = destino.getBoundingClientRect()
  if (caja.top < fijo - 1 || caja.bottom > window.innerHeight - 8 || (!centrado && caja.top > window.innerHeight * 0.4)) {
    const y = centrado ? caja.top - (window.innerHeight - caja.height) / 2 : caja.top - fijo
    window.scrollTo({ top: window.scrollY + y, behavior: animado && suave() ? 'smooth' : 'auto' })
  }
}
/** En móvil las tiras de chips se deslizan: el chip pulsado tiene que quedar dentro de su tira. */
function centraChips() {
  for (const tira of document.querySelectorAll<HTMLElement>('.selector__chips, .muestras-chips')) {
    const chip = tira.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!chip || tira.scrollWidth <= tira.clientWidth) continue
    const fuera = chip.offsetLeft < tira.scrollLeft || chip.offsetLeft + chip.offsetWidth > tira.scrollLeft + tira.clientWidth
    if (fuera) tira.scrollTo({ left: chip.offsetLeft - 16 })
  }
}
watch(() => [vista.value.marcador, vista.value.muestra, vista.value.paso] as const, async ([m, mu, p], [m0, mu0, p0]) => {
  if (m === m0 && mu === mu0 && p === p0) return
  // En móvil, cambiar de muestra con la misma tinción solo cambia el panel visible: no se mueve nada.
  if (estrecho.value && m === m0 && m0) return
  await nextTick()
  centraChips()
  mide()
  if (m) {
    aLaVista(seccion.value)
    if (!m0 && focoAlTitulo) encabezado.value?.focus({ preventScroll: true })
  } else {
    // De vuelta a la matriz: al botón desde el que se abrió, con su foco.
    const vuelta = origen ? document.querySelector<HTMLElement>(`[data-origen="${origen}"]`) : null
    if (vuelta) { aLaVista(vuelta, false, true); vuelta.focus({ preventScroll: true }) } else aLaVista(ancla.value)
    origen = null
  }
  focoAlTitulo = false
})
// Un enlace que ya trae la vista (?fila=…) abre con el visor a la vista, no bajo el aviso.
onMounted(async () => {
  await nextTick()
  centraChips()
  if (vista.value.marcador) aLaVista(seccion.value, false)
})
function teclas(e: KeyboardEvent) {
  if (!vista.value.marcador || !e.altKey) return
  if (e.key === 'ArrowRight') { e.preventDefault(); mueve(1) }
  if (e.key === 'ArrowLeft') { e.preventDefault(); mueve(-1) }
}
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Laminillas al microscopio', 'Slides under the microscope')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :parent="{ to: localePath({ name: 'herramientas' }), label: $t('nav.tools') }"
          :tag="L('Anatomía patológica', 'Pathology')"
          :title="L('Las laminillas, al microscopio', 'The slides, under the microscope')"
          :subtitle="L(
            `${total} laminillas escaneadas de ${palabra(nMuestras, 'es')} muestras de Miriam: la biopsia de mama del diagnóstico (2024), la revisión de ese mismo bloque en 2026 y la biopsia de hígado de 2026. Se miran como en un microscopio, con zoom hasta la célula y una regla en micras ajustada a cada escáner.`,
            `${total} scanned slides from ${palabra(nMuestras, 'en')} of Miriam’s samples: the breast biopsy from her diagnosis (2024), the 2026 review of that same block and the 2026 liver biopsy. They open like a microscope, with zoom down to the cell and a micron ruler set to each scanner.`)"
        />

        <div class="alert-callout mb-8" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
          <p>{{ L(
            'Los resultados que aparecen son los de los informes de anatomía patológica, cada uno con su fuente y su sello de verificación. Mirar la imagen no los sustituye: los interpreta el equipo médico.',
            'The results shown are those in the pathology reports, each with its source and verification seal. Looking at the image does not replace them: the medical team interprets them.') }}</p>
        </div>

        <div ref="ancla" />
        <!-- Selector arriba, en flujo (no se pega: tapaba el foco y un tercio de la pantalla). -->
        <nav class="selector" :aria-label="L('Elegir laminilla', 'Choose a slide')">
          <div class="selector__fila">
            <span class="selector__rotulo" aria-hidden="true">{{ L('Tinción', 'Stain') }}</span>
            <div class="selector__chips" role="group" :aria-label="L('Tinción', 'Stain')">
              <button type="button" class="lam-chip" :aria-pressed="!vista.marcador" @click="aMatriz">
                <Icon name="ph:table-bold" class="w-4 h-4" aria-hidden="true" />{{ L('Todas las laminillas', 'All slides') }}
              </button>
              <button
                v-for="f in filas"
                :key="f.marcador.id"
                type="button"
                class="lam-chip"
                :aria-pressed="vista.marcador === f.marcador.id"
                :aria-label="nombreChip(f)"
                :title="tituloChip(f)"
                :data-origen="`chip:${f.marcador.id}`"
                @click="eligeTincion(f.marcador.id)"
              >{{ corto(f) }}</button>
            </div>
          </div>
          <!-- En móvil la muestra se elige junto a la imagen (en el visor), no aquí arriba. -->
          <div v-if="vista.marcador && !estrecho" class="selector__fila">
            <span class="selector__rotulo" aria-hidden="true">{{ L('Muestra', 'Sample') }}</span>
            <LaminillasMuestras :manifest="M" :idioma="idioma" :con-todas="true" :todas-elegida="!vista.muestra" :elegida="muestraElegida" :tiene="tieneTincion" @elige="eligeMuestra" />
          </div>
        </nav>

        <!-- Escenario: la matriz o el visor, en el mismo sitio (#visor: los enlaces de antes lo llevan). -->
        <div id="visor" class="escenario">
          <div v-if="!vista.marcador" id="matriz">
            <Nota icon="tap" class="mb-4">{{ L(
              'Toca el nombre de una tinción para compararla en todas sus muestras, o una miniatura para ver esa laminilla sola.',
              'Tap a stain’s name to compare it across all its samples, or a thumbnail to see that slide on its own.') }}</Nota>
            <table class="matriz">
              <caption class="matriz__leyenda">
                {{ L(`${total} laminillas: tinción por muestra`, `${total} slides: stain by sample`) }}
              </caption>
              <thead>
                <tr>
                  <th scope="col" class="matriz__esquina">{{ L('Tinción', 'Stain') }}</th>
                  <th v-for="m in M.muestras" :key="m.id" scope="col" class="matriz__col">
                    <button type="button" class="matriz__colboton" :data-origen="`col:${m.id}`" @click="abreColumna(m.id)">
                      <span class="matriz__colnombre">{{ t(m.corto) }}</span>
                      <span class="matriz__colmeta"><span class="whitespace-nowrap">{{ m.aumento }}</span> <span class="matriz__colmpp whitespace-nowrap">{{ mppTexto(m.mpp, 3) }} µm/px</span></span>
                      <span class="sr-only">{{ L('Ver todas las tinciones de esta muestra, una a una', 'See every stain from this sample, one by one') }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody v-for="g in grupos" :key="g.id">
                <tr class="matriz__grupo">
                  <th :colspan="M.muestras.length + 1" scope="rowgroup">{{ g.titulo }}</th>
                </tr>
                <tr v-for="f in g.filas" :key="f.marcador.id" class="matriz__fila" @click="abreFila(f.marcador.id)">
                  <th scope="row" class="matriz__filacab">
                    <button type="button" class="matriz__filaboton" :data-origen="`fila:${f.marcador.id}`" @click.stop="abreFila(f.marcador.id)">
                      <span class="matriz__filanombre">{{ t(f.marcador.nombre) }}<Icon name="ph:caret-right-bold" class="matriz__flecha" aria-hidden="true" /></span>
                      <span v-if="f.marcador.nota" class="matriz__nota">{{ t(f.marcador.nota) }}</span>
                    </button>
                  </th>
                  <td v-for="m in M.muestras" :key="m.id" class="matriz__celda">
                    <template v-if="f.celdas[m.id]">
                      <button
                        v-for="l in f.celdas[m.id]"
                        :key="l.id"
                        type="button"
                        class="matriz__miniboton"
                        :class="{ 'matriz__miniboton--doble': f.celdas[m.id]!.length > 1 }"
                        :aria-label="L('Ver ', 'See ') + etiquetaVoz(l)"
                        :data-origen="`mini:${l.id}`"
                        @click.stop="abreLaminilla(l)"
                      >
                        <img :src="l.miniatura" alt="" class="matriz__mini" width="96" height="96" loading="lazy" decoding="async">
                      </button>
                    </template>
                    <span v-else class="matriz__vacia">
                      <span aria-hidden="true">·</span><span class="sr-only">{{ L('Sin laminilla', 'No slide') }}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="discordancia mt-6">{{ textoDiscordancia }}</p>
          </div>

          <section v-else ref="seccion" class="visor-seccion" aria-labelledby="visor-titulo" @keydown="teclas">
            <div ref="filaTitulo" class="visor-cabecera" :style="{ '--alto-cabecera': altoCabecera + 'px' }">
              <h2 id="visor-titulo" ref="encabezado" tabindex="-1" class="font-display font-semibold text-berenjena text-2xl">{{ tituloVisor }}</h2>
              <div class="visor-acciones">
                <button type="button" class="btn-ghost min-h-[44px] visor-volver" :aria-label="L('Todas las laminillas', 'All slides')" @click="aMatriz">
                  <Icon name="ph:table-bold" class="w-4 h-4" aria-hidden="true" /><span class="visor-acciones__texto">{{ L('Todas las laminillas', 'All slides') }}</span>
                </button>
                <button type="button" class="btn-secondary min-h-[44px]" :aria-label="vista.muestra ? L('Laminilla anterior', 'Previous slide') : L('Tinción anterior', 'Previous stain')" @click="mueve(-1)">
                  <Icon name="ph:caret-left-bold" class="w-4 h-4" aria-hidden="true" /><span class="visor-acciones__texto">{{ L('Anterior', 'Previous') }}</span>
                </button>
                <p class="visor-posicion" aria-live="polite"><span class="visor-posicion__que">{{ queCuenta + ' ' }}</span>{{ L(`${posicion.i} de ${posicion.n}`, `${posicion.i} of ${posicion.n}`) }}</p>
                <button type="button" class="btn-secondary min-h-[44px]" :aria-label="vista.muestra ? L('Laminilla siguiente', 'Next slide') : L('Tinción siguiente', 'Next stain')" @click="mueve(1)">
                  <span class="visor-acciones__texto">{{ L('Siguiente', 'Next') }}</span><Icon name="ph:caret-right-bold" class="w-4 h-4" aria-hidden="true" />
                </button>
                <button v-if="puedeHE" type="button" class="btn-secondary min-h-[44px]" :aria-label="L('HE de referencia', 'Reference H&E')" :aria-pressed="conHE" @click="alternaHE">
                  <Icon :name="conHE ? 'ph:check-bold' : 'ph:square-split-horizontal-bold'" class="w-4 h-4" aria-hidden="true" /><span class="visor-he-largo">{{ L('HE de referencia', 'Reference H&E') }}</span><span class="visor-he-corto" aria-hidden="true">{{ L('HE', 'H&E') }}</span>
                </button>
              </div>
            </div>
            <LaminillasMuestras v-if="estrecho" class="mb-3" :manifest="M" :idioma="idioma" :con-todas="false" :todas-elegida="false" :elegida="muestraElegida" :tiene="tieneTincion" @elige="eligeMuestra" />
            <ClientOnly>
              <LaminillasVisor :manifest="M" :rejilla="rejilla" :idioma="idioma" :teselas="teselas" :rotulos="rotulos" :nombres="nombres" :muestra-visible="estrecho ? muestraVisible : null" />
              <template #fallback>
                <div class="visor-cargando">{{ L('Cargando el visor…', 'Loading the viewer…') }}</div>
              </template>
            </ClientOnly>
            <p v-if="conDiscordancia" class="discordancia mt-4">{{ textoDiscordancia }}</p>
            <div class="fichas" :style="{ '--cols': Math.min(3, rejilla[0]?.length ?? 1) }">
              <LaminillasFicha v-for="l in fichas" :key="l.id" :manifest="M" :laminilla="l" :idioma="idioma" :titulo="etiqueta(l)" />
            </div>
          </section>
        </div>

        <dl class="muestras mt-10">
          <div v-for="m in M.muestras" :key="m.id">
            <dt>{{ t(m.largo) }}</dt>
            <dd>{{ m.escaner }} · {{ m.aumento }} · {{ mppTexto(m.mpp, 5) }} µm/px<span v-if="m.nota">. {{ t(m.nota) }}</span></dd>
          </div>
        </dl>
        <p class="muestras-nota mt-4">{{ L(
          'Los marcadores neuroendocrinos de la tabla son cromogranina, sinaptofisina, INSM1 y CD56.',
          'The neuroendocrine markers in the table are chromogranin, synaptophysin, INSM1 and CD56.') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Selector (los chips, .lam-chip, viven en main.css: los comparte LaminillasMuestras). */
.selector { display: grid; gap: var(--sp-8); padding: var(--sp-12) 0; margin-bottom: var(--sp-16);
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.selector__fila { display: flex; align-items: center; gap: var(--sp-8) var(--sp-12); min-width: 0; }
.selector__rotulo { flex: none; width: 4.5rem; font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-soft); font-weight: 600; }
.selector__chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
@media (max-width: 767px) {
  .selector__fila { flex-direction: column; align-items: stretch; gap: 4px; }
  .selector__rotulo { width: auto; }
  /* En móvil una sola línea que se desliza (sin desbordar la página). El relleno deja sitio al
     anillo de foco, que overflow-x recortaría arriba y abajo. */
  .selector__chips { position: relative; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 6px; margin: -6px; }
  .selector__chips::-webkit-scrollbar { display: none; }
}
.matriz { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.matriz__leyenda { caption-side: top; text-align: left; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-xl); color: var(--color-text); margin-bottom: var(--sp-12); }
.matriz__esquina { width: 30%; text-align: left; font-size: var(--texto-xs); color: var(--color-text-soft); font-weight: 600; padding: 0 var(--sp-8) var(--sp-8) 0; vertical-align: bottom; }
@media (min-width: 768px) { .matriz__esquina { width: 22%; } }
.matriz__col { padding: 0 2px var(--sp-8); vertical-align: bottom; }
.matriz__colboton { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; width: 100%; min-height: 44px; padding: 6px 4px;
  border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent); color: var(--color-text); }
.matriz__colboton:focus-visible, .matriz__filaboton:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.matriz__colnombre { font-weight: 700; font-size: var(--texto-sm); line-height: 1.2; text-align: center; }
.matriz__colmeta { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-soft); text-align: center; }
@media (max-width: 479px) {
  .matriz__colnombre { font-size: 13px; overflow-wrap: anywhere; hyphens: auto; }
  .matriz__colboton { min-height: 64px; }
  /* A este ancho el µm/px no cabe en la cabecera: sigue en la lista de muestras y en cada ficha. */
  .matriz__colmpp { display: none; }
  .matriz__filaboton { font-size: 13px; overflow-wrap: anywhere; hyphens: auto; }
}
.matriz__grupo th { text-align: left; padding: var(--sp-16) 0 var(--sp-4); font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: var(--color-text-soft); font-weight: 600; }
.matriz__fila { cursor: pointer; }
.matriz__fila > * { border-top: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
@media (hover: hover) and (pointer: fine) {
  .matriz__fila:hover > * { background: color-mix(in srgb, var(--color-miriam-soft) 45%, transparent); }
  .matriz__colboton:hover { border-color: var(--color-miriam); }
}
.matriz__filacab { text-align: left; padding: 0; }
.matriz__filaboton { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; width: 100%; min-height: 64px; padding: 6px 8px 6px 4px;
  font-weight: 700; font-size: var(--texto-sm); color: var(--color-text); text-align: left; border-radius: var(--radius-sm); }
.matriz__filanombre { display: inline-flex; align-items: center; gap: 4px; }
.matriz__flecha { width: 14px; height: 14px; flex: none; color: var(--color-miriam); }
.matriz__filaboton { text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--color-miriam) 45%, transparent); text-underline-offset: 4px; }
.matriz__nota { font-weight: 400; font-size: 12px; color: var(--color-text-soft); line-height: 1.3; }
.matriz__celda { text-align: center; padding: 6px 2px; vertical-align: middle; }
.matriz__miniboton { display: inline-block; width: min(96px, 100%); padding: 0; border: 0; background: none; border-radius: var(--radius-sm); cursor: zoom-in; vertical-align: middle; }
.matriz__miniboton--doble { width: min(46px, 48%); margin: 0 1px; }
.matriz__miniboton:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.matriz__mini { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; background: #fff; border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
@media (hover: hover) and (pointer: fine) {
  .matriz__miniboton:hover .matriz__mini { border-color: var(--color-miriam); }
}
.matriz__vacia { color: color-mix(in srgb, var(--color-text) 35%, transparent); font-size: var(--texto-lg); }
.discordancia { max-width: 80ch; font-size: var(--texto-sm); color: var(--color-text); line-height: 1.55; }
.muestras { display: grid; gap: var(--sp-8); font-size: var(--texto-xs); color: var(--color-text-soft); max-width: 80ch; }
.muestras dt { font-weight: 700; color: var(--color-text); }
.muestras dd { margin: 0; line-height: 1.5; }
.muestras-nota { max-width: 80ch; font-size: var(--texto-xs); color: var(--color-text-soft); line-height: 1.5; }
.visor-cabecera { display: flex; flex-wrap: wrap; gap: var(--sp-12); align-items: center; justify-content: space-between; margin-bottom: var(--sp-12); }
@media (min-width: 768px) {
  /* Solo esta fila se pega: anterior/siguiente y volver siempre a mano, por poco alto. */
  .visor-cabecera { position: sticky; top: var(--alto-cabecera, 80px); z-index: 20; background: var(--color-bg); padding-block: var(--sp-8);
    border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
}
.visor-posicion { margin: 0; min-width: 7ch; text-align: center; font-size: var(--texto-sm); font-variant-numeric: tabular-nums; color: var(--color-text); }
.visor-he-corto { display: none; }
.visor-cabecera h2:focus { outline: none; }
.visor-cabecera h2:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 4px; }
.visor-acciones { display: flex; flex-wrap: wrap; gap: var(--sp-8); }
.visor-acciones { align-items: center; }
@media (max-width: 767px) {
  .visor-cabecera h2 { font-size: var(--texto-xl); }
  .visor-acciones { width: 100%; flex-wrap: wrap; }
  .visor-acciones > .btn-secondary { flex: 0 0 auto; padding-inline: 12px; font-size: var(--texto-sm); }
  .visor-acciones > .btn-secondary:last-child { margin-left: auto; }
  /* «Anterior» / «Siguiente» / «Todas las laminillas» quedan en el icono (con su nombre accesible);
     el contador, «2 de 17» (lo que cuenta lo oye el lector). */
  .visor-acciones__texto, .visor-posicion__que { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  /* «HE» corto: con «HE de referencia» la fila no cabía y el botón bajaba solo a otra línea. */
  .visor-he-largo { display: none; }
  .visor-he-corto { display: inline; }
}
/* A 320 px no cabe todo en una fila: la HE baja a la suya (antes se salía de la pantalla). */
@media (max-width: 380px) {
  .visor-acciones > .btn-secondary:last-child { margin-left: 0; }
}
/* Pulsado: violeta suave con texto berenjena también en hover (el hover del DS pone texto crema: 1,29:1). */
.visor-acciones .btn-secondary[aria-pressed='true'],
.visor-acciones .btn-secondary[aria-pressed='true']:hover { background: var(--seleccionado-bg); color: var(--color-text); }
.visor-cargando { display: flex; align-items: center; justify-content: center; height: clamp(280px, 52svh, 640px); background: var(--color-bg-card); color: var(--color-text-soft); border-radius: var(--radius-md); }
.fichas { display: grid; gap: var(--sp-12); margin-top: var(--sp-16); grid-template-columns: 1fr; }
@media (min-width: 1024px) { .fichas { grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); } }
</style>
