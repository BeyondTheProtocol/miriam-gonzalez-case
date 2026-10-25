<script setup lang="ts">
/**
 * /laminillas · /en/slides — las laminillas escaneadas del caso, en un visor público.
 *
 * Rediseño del 20-oct-2026, desde cero (Miriam: «lo de hacer scroll no mola; la idea es poder tener
 * un visor e ir cambiando, o al menos las slides listadas como una galería»). Sigue el patrón de los
 * visores de patología (investigación archivada en 05 · Web; el más parecido, el Human Protein Atlas,
 * usa el mismo motor): la herramienta ocupa la pantalla y la página no se desplaza para usarla.
 *  · Escritorio: galería a la izquierda, visor en el centro (minimapa, regla en µm, ‹ ›) y la ficha
 *    del informe a la derecha, plegable.
 *  · Móvil: el visor arriba, la galería en una tira deslizable debajo y la ficha en un cajón.
 *  · Comparar: la misma tinción en todas sus muestras, con el zoom a la par en µm (en móvil, apiladas).
 *  · «HE al lado»: la HE de la misma muestra junto a cada panel.
 * Estado en la URL (?l=&comparar=&he=; también los enlaces de antes, ver vistaDeQuery). Cada laminilla
 * entra en el historial: «atrás» vuelve a la anterior. Todo sale de app/data/laminillas.json.
 *
 * Herramienta de apoyo, no diagnóstico. Cada dato clínico de las fichas lleva su sello de
 * verificación contra el informe original. Sin normalizar color.
 */
import datos from '~/data/laminillas.json'
import {
  companeras, grupoPaneo, gruposGaleria, heDe, ordenGaleria, primeraLaminilla, queryDeVista, vecinaEnGaleria, vistaDeQuery,
  zonaDe, zonas as calculaZonas,
  type Agrupacion, type Laminilla, type Manifest, type Vista,
} from '~/utils/laminillas'

const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const idioma = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (idioma.value === 'en' ? en : es)

const M = datos as unknown as Manifest
const teselas = (config.public.laminillasTeselas as string) || M.teselas
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
// Para el lector de pantalla, comas: el «·» separa sigla y nombre y también tinción y muestra.
const etiquetaVoz = (l: Laminilla) => etiqueta(l).replaceAll(' · ', ', ')
const mppTexto = (mpp: number, dec: number) => mpp.toLocaleString(idioma.value === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: dec })

// ── Qué se ve (sale solo de la query; en la página prerenderizada llega vacía durante la hidratación)
const vista = computed<Vista>(() => vistaDeQuery(M, route.query))
const actual = computed(() => M.laminillas.find((l) => l.id === vista.value.laminilla) ?? primeraLaminilla(M))
const hermanas = computed(() => companeras(M, actual.value))
const puedeComparar = computed(() => hermanas.value.length > 1)
const comparando = computed(() => vista.value.comparar && puedeComparar.value)
const puedeHE = computed(() => actual.value.marcador !== 'he')
// En móvil no hay «HE al lado» al comparar: con los paneles apilados, 6 no caben.
const conHE = computed(() => vista.value.he && puedeHE.value && !(estrecho.value && comparando.value))
const enVista = computed(() => (comparando.value ? hermanas.value : [actual.value]))

// Móvil (< 768 px): rejilla en filas (cada muestra una fila; comparar apila) y galería por muestra.
const estrecho = ref(false)
const porElegida = ref<Agrupacion>('muestra')
const por = computed<Agrupacion>(() => (estrecho.value ? 'muestra' : porElegida.value))
const rejilla = computed<(Laminilla | null)[][]>(() => {
  const base = enVista.value
  const he = (l: Laminilla) => heDe(M, l.muestra) ?? null
  if (estrecho.value) return base.map((l) => (conHE.value ? [l, he(l)] : [l]))
  return conHE.value ? [base, base.map(he)] : [base]
})
const unPanel = computed(() => rejilla.value.flat().length === 1)
// Rótulo en cada panel solo si hay más de uno (con uno, el título de arriba ya lo dice).
const rotulos = computed(() => rejilla.value.flat().map((l) => {
  if (!l || unPanel.value) return ''
  const esHE = l.marcador === 'he' && actual.value.marcador !== 'he'
  if (comparando.value) return esHE ? `HE · ${nombreMuestra(l.muestra)}` : conVariante(nombreMuestra(l.muestra), l)
  return esHE ? L('HE de referencia', 'Reference H&E') : conVariante(nombreMarcador(l.marcador), l)
}))
const nombres = computed(() => rejilla.value.flat().map((l) => (l ? etiquetaVoz(l) : '')))
const fichas = computed(() => [...new Map(rejilla.value.flat().filter((l): l is Laminilla => !!l).map((l) => [l.id, l])).values()])

// Zona: la de la laminilla que se ve. La galería, ‹ › y el contador se quedan dentro de ella.
const zonasM = calculaZonas(M)
const zona = computed(() => zonaDe(M, actual.value.muestra))
const orden = computed(() => ordenGaleria(M, por.value, zona.value))
const posicion = computed(() => orden.value.findIndex((l) => l.id === actual.value.id) + 1)
const titulo = computed(() => {
  if (!comparando.value) return etiqueta(actual.value)
  const n = hermanas.value.length
  const nombre = nombreMarcador(actual.value.marcador)
  return L(`${nombre} en las ${n} muestras`, `${nombre} in ${n === 2 ? 'both samples' : `all ${n} samples`}`)
})
// En móvil no cabe el nombre largo: «RE · Mama 2024», «RE en las 3 muestras».
const tituloCorto = computed(() => {
  const sigla = nombreMarcador(actual.value.marcador).split(' · ')[0]!
  if (!comparando.value) return conVariante(`${sigla} · ${nombreMuestra(actual.value.muestra)}`, actual.value)
  const n = hermanas.value.length
  return L(`${sigla} en las ${n} muestras`, `${sigla} in ${n === 2 ? 'both samples' : `all ${n} samples`}`)
})
const textoComparar = computed(() => {
  const n = hermanas.value.length
  return L(`Comparar las ${n} muestras`, n === 2 ? 'Compare both samples' : `Compare all ${n} samples`)
})
// Donde se leen las cifras que no coinciden entre informes, el aviso va en la ficha.
// Solo si se ve alguna laminilla del bloque de mama: en la RE del hígado salía junto a «negativo (0 %)»
// un párrafo sobre cifras de mama (diseno, 21-oct).
const conDiscordancia = computed(() => ['re', 'rp', 'ki67'].includes(actual.value.marcador) && fichas.value.some((l) => grupoPaneo(M, l.muestra) === 'mama'))
const textoDiscordancia = computed(() => L(
  'Las lecturas del bloque de mama no coinciden en todas las cifras: RE 95 % en el informe de 2024 y 85 % en la revisión de 2026, RP 5 % y 20 %, Ki-67 60 % y 40 %. Cada ficha da la del informe de su propia tanda de laminillas.',
  'The readings of the breast block do not agree on every figure: ER 95% in the 2024 report and 85% in the 2026 review, PR 5% and 20%, Ki-67 60% and 40%. Each record gives the figure from the report for its own batch of slides.'))

// ── Cambiar lo que se ve. Cada laminilla entra en el historial (atrás = la anterior); comparar y
// la HE al lado, no. El scroll no se toca (router.options.ts deja quietas estas claves).
const enlace = (id: string) => router.resolve({ path: route.path, query: queryDeVista({ laminilla: id, comparar: false, he: false }) }).href
function ve(v: Vista, historial = true) {
  const q = queryDeVista(v)
  return historial ? router.push({ query: q }) : router.replace({ query: q })
}
async function elige(id: string) {
  if (id === actual.value.id) return
  const l = M.laminillas.find((x) => x.id === id)
  // Si el foco estaba en la galería (← → desde un enlace), se va con la laminilla nueva.
  const enGaleria = !!document.activeElement?.closest('.gal__lista')
  await ve({ laminilla: id, comparar: vista.value.comparar && !!l && companeras(M, l).length > 1, he: vista.value.he })
  if (enGaleria) document.querySelector<HTMLElement>(`.gal__item[data-l="${CSS.escape(id)}"]`)?.focus({ preventScroll: true })
}
const mueve = (d: number) => elige(vecinaEnGaleria(M, actual.value.id, d, por.value, zona.value).id)
/** Otra zona: su primera laminilla (la HE de su primera muestra, que encabeza la galería por muestra). */
const primeraDeZona = (z: string) => gruposGaleria(M, 'muestra', z)[0]?.laminillas[0]?.id ?? primeraLaminilla(M).id
function eligeZona(z: string) {
  if (z !== zona.value) elige(primeraDeZona(z))
}
const alternaComparar = () => ve({ ...vista.value, laminilla: actual.value.id, comparar: !comparando.value }, false)
const alternaHE = () => ve({ ...vista.value, laminilla: actual.value.id, he: !conHE.value }, false)

// ── Ficha: columna a la derecha desde 1024 px (abierta por defecto desde 1280) y, por debajo,
// panel superpuesto (tableta) o cajón (móvil) que se comporta como diálogo: foco dentro al abrir,
// el resto inerte, velo que cierra, Esc, y el foco vuelve al botón (diseno, 21-oct: K3 de a11y).
// Cerrada en el HTML prerenderizado: en móvil salía abierta hasta hidratar.
const fichaAbierta = ref(false)
const superpuesta = ref(false)
const modal = computed(() => superpuesta.value && fichaAbierta.value)
const botonFicha = ref<HTMLElement | null>(null)
const tituloFicha = ref<HTMLElement | null>(null)
const peticion = ref<{ abre: () => void } | null>(null)
async function alternaFicha() {
  fichaAbierta.value = !fichaAbierta.value
  await nextTick()
  if (fichaAbierta.value && superpuesta.value) tituloFicha.value?.focus()
  if (!fichaAbierta.value) botonFicha.value?.focus()
}

// ── Teclado: ← → cambian de laminilla salvo dentro de la imagen (allí mueven la imagen) o de un campo.
function teclas(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  const el = e.target as HTMLElement | null
  if (el?.closest('.openseadragon-canvas, input, textarea, select, [contenteditable="true"]')) return
  // Con el informe abierto encima, ← → no cambian lo que hay debajo.
  if (modal.value && e.key !== 'Escape') return
  if (e.key === 'ArrowRight') { e.preventDefault(); mueve(1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); mueve(-1) }
  else if (e.key === 'Escape') {
    if (modal.value) alternaFicha()
    else if (comparando.value) alternaComparar()
  }
}

// ── Alto: la herramienta llena la pantalla bajo la cabecera fija del sitio (se mide).
const altoCabecera = ref(112)
let ro: ResizeObserver | null = null
let mqMovil: MediaQueryList | null = null
let mqSuperpuesta: MediaQueryList | null = null
const alMovil = () => { estrecho.value = !!mqMovil?.matches }
const alSuperpuesta = () => { superpuesta.value = !!mqSuperpuesta?.matches }
onMounted(() => {
  mqMovil = window.matchMedia('(max-width: 767px)')
  mqSuperpuesta = window.matchMedia('(max-width: 1023px)')
  alMovil()
  alSuperpuesta()
  mqMovil.addEventListener('change', alMovil)
  mqSuperpuesta.addEventListener('change', alSuperpuesta)
  fichaAbierta.value = window.matchMedia('(min-width: 1280px)').matches
  const cab = document.querySelector<HTMLElement>('[data-cabecera-fija]')
  // scroll-padding: con la cabecera pegada, el foco que llega por Tab no queda debajo (2.4.11).
  const mide = () => {
    altoCabecera.value = Math.ceil(cab?.getBoundingClientRect().height ?? 112)
    document.documentElement.style.scrollPaddingTop = `${altoCabecera.value + 8}px`
  }
  mide()
  ro = new ResizeObserver(mide)
  if (cab) ro.observe(cab)
  document.documentElement.classList.add('lam-activa')
  window.addEventListener('keydown', teclas)
})
onBeforeUnmount(() => {
  mqMovil?.removeEventListener('change', alMovil)
  mqSuperpuesta?.removeEventListener('change', alSuperpuesta)
  ro?.disconnect()
  document.documentElement.style.scrollPaddingTop = ''
  document.documentElement.classList.remove('lam-activa')
  window.removeEventListener('keydown', teclas)
})
</script>

<template>
  <div class="lam" :class="{ 'lam--sin-ficha': !fichaAbierta }" :style="{ '--alto-cabecera': altoCabecera + 'px' }">
    <div class="lam__barra">
      <!-- T3-LOTE1 (A18, 25-oct-2026): el contenido de la barra va en el shell (`.section-wide`, DS §3), para que «← Herramientas» y el
           título caigan bajo el logo; el filete de abajo sigue a sangre. La zona de trabajo (visor, galería y ficha) conserva su ancho
           completo. Hasta `lg` la barra es la de antes (mismo relleno), así que tableta y móvil no cambian. -->
      <div class="lam__barra-in section-wide">
        <NuxtLink :to="localePath({ name: 'herramientas' })" class="lam__volver">
          <Icon name="ph:arrow-left-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__volver-texto">{{ $t('nav.tools') }}</span>
        </NuxtLink>
        <h1 class="lam__h1">{{ L('Las laminillas, al microscopio', 'The slides, under the microscope') }}</h1>
        <details class="lam__aviso" role="note">
          <summary>
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}</span>
            <Icon name="ph:caret-down-bold" class="lam__aviso-flecha w-3 h-3 shrink-0" aria-hidden="true" />
          </summary>
          <p>{{ L(
            'Los resultados que aparecen son los de los informes de anatomía patológica, cada uno con su fuente y su sello de verificación. Mirar la imagen no los sustituye: los interpreta el equipo médico.',
            'The results shown are those in the pathology reports, each with its source and verification seal. Looking at the image does not replace them: the medical team interprets them.') }}</p>
        </details>
        <!-- Los TIFF a resolución completa, bajo petición (24-oct-2026). También abre con #ficheros / #files. -->
        <button type="button" class="lam__accion lam__pedir lam__pedir--barra" :aria-label="L('Pedir los ficheros a resolución completa', 'Request the full-resolution files')" @click="peticion?.abre()">
          <Icon name="ph:download-simple-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__accion-texto">{{ L('Pedir los ficheros', 'Request the files') }}</span><span class="lam__accion-corto" aria-hidden="true">{{ L('Ficheros', 'Files') }}</span>
        </button>
      </div>
    </div>
    <ClientOnly><LaminillasPeticion ref="peticion" :idioma="idioma" /></ClientOnly>

    <div class="lam__cuerpo">
      <!-- Orden del DOM: el visor primero (lo principal; ← → y ‹ › cambian de laminilla sin pasar por
           la lista), después la galería y la ficha. Dónde se ven lo decide grid-template-areas. -->
      <section class="lam__visor" aria-labelledby="lam-titulo" :inert="modal ? '' : undefined">
        <div class="lam__cab">
          <h2 id="lam-titulo" class="lam__titulo" aria-live="polite">
            <span class="lam__titulo-texto lam__titulo-largo">{{ titulo }}</span>
            <span class="lam__titulo-texto lam__titulo-corto" aria-hidden="true">{{ tituloCorto }}</span>
            <span class="lam__pos"><span class="sr-only">{{ ', ' + L('laminilla', 'slide') + ' ' }}</span>{{ L(`${posicion} de ${orden.length}`, `${posicion} of ${orden.length}`) }}</span>
          </h2>
          <div class="lam__acciones">
            <!-- Interruptor, como «HE al lado»: el texto no cambia (el nombre accesible es el mismo, 2.5.3); se marca pulsado. -->
            <button v-if="puedeComparar" type="button" class="lam__accion" :aria-pressed="comparando" :aria-label="textoComparar" @click="alternaComparar">
              <Icon name="ph:columns-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__accion-texto">{{ textoComparar }}</span><span class="lam__accion-corto" aria-hidden="true">{{ L('Comparar', 'Compare') }}</span>
            </button>
            <button v-if="puedeHE && !(estrecho && comparando)" type="button" class="lam__accion" :aria-pressed="conHE" :aria-label="L('HE al lado', 'H&E alongside')" @click="alternaHE">
              <Icon name="ph:square-split-horizontal-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__accion-texto">{{ L('HE al lado', 'H&E alongside') }}</span><span class="lam__accion-corto" aria-hidden="true">{{ L('HE al lado', 'H&E') }}</span>
            </button>
            <!-- En móvil «Ficheros» va aquí y no en la barra: allí estrechaba el aviso hasta 5 líneas (comité diseno, 24-oct). -->
            <button type="button" class="lam__accion lam__pedir lam__pedir--acciones" :aria-label="L('Pedir los ficheros a resolución completa', 'Request the full-resolution files')" @click="peticion?.abre()">
              <Icon name="ph:download-simple-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__accion-texto">{{ L('Pedir los ficheros', 'Request the files') }}</span><span class="lam__accion-corto" aria-hidden="true">{{ L('Ficheros', 'Files') }}</span>
            </button>
            <button ref="botonFicha" type="button" class="lam__accion" :aria-expanded="fichaAbierta" aria-controls="lam-ficha" :aria-label="L('Informe', 'Report')" @click="alternaFicha">
              <Icon name="ph:file-text-bold" class="w-4 h-4" aria-hidden="true" /><span class="lam__accion-texto">{{ L('Informe', 'Report') }}</span><span class="lam__accion-corto" aria-hidden="true">{{ L('Informe', 'Report') }}</span>
            </button>
          </div>
        </div>
        <div class="lam__lienzo">
          <ClientOnly>
            <LaminillasVisor :manifest="M" :rejilla="rejilla" :idioma="idioma" :teselas="teselas" :rotulos="rotulos" :nombres="nombres" :minimapa="!estrecho" />
            <template #fallback>
              <div class="lam__cargando">{{ L('Cargando el visor…', 'Loading the viewer…') }}</div>
            </template>
          </ClientOnly>
          <button v-if="!comparando" type="button" class="lam__flecha lam__flecha--ant" :aria-label="L('Laminilla anterior', 'Previous slide')" @click="mueve(-1)">
            <Icon name="ph:caret-left-bold" class="w-5 h-5" aria-hidden="true" />
          </button>
          <button v-if="!comparando" type="button" class="lam__flecha lam__flecha--sig" :aria-label="L('Laminilla siguiente', 'Next slide')" @click="mueve(1)">
            <Icon name="ph:caret-right-bold" class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      <LaminillasGaleria
        class="lam__galeria"
        :manifest="M"
        :idioma="idioma"
        :por="por"
        :zona="zona"
        :zonas="zonasM"
        :primera-de-zona="primeraDeZona"
        :activa="actual.id"
        :tambien="enVista.filter((l) => l.id !== actual.id).map((l) => l.id)"
        :enlace="enlace"
        :inert="modal ? '' : undefined"
        @elige="elige"
        @por="porElegida = $event"
        @zona="eligeZona"
      />

      <div v-if="modal" class="lam__velo" aria-hidden="true" @click="alternaFicha" />
      <aside v-show="fichaAbierta" id="lam-ficha" class="lam__ficha" aria-labelledby="lam-ficha-titulo">
        <div class="lam__ficha-cab">
          <!-- «Informe»: cada ficha ya trae el campo «Lo que dice el informe»; así no sale dos veces seguidas. -->
          <h2 id="lam-ficha-titulo" ref="tituloFicha" tabindex="-1" class="lam__ficha-titulo">{{ L('Informe', 'Report') }}</h2>
          <button type="button" class="lam__cerrar" :aria-label="L('Cerrar el informe', 'Close the report')" @click="alternaFicha">
            <Icon name="ph:x-bold" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div class="lam__ficha-cuerpo">
          <p v-if="conDiscordancia" class="lam__discordancia">{{ textoDiscordancia }}</p>
          <LaminillasFicha v-for="l in fichas" :key="l.id" :manifest="M" :laminilla="l" :idioma="idioma" :titulo="etiqueta(l)" />
          <details class="lam__sobre">
            <summary>{{ L('Sobre las muestras', 'About the samples') }}</summary>
            <p>{{ L(
              `${total} laminillas escaneadas de ${palabra(nMuestras, 'es')} muestras de Miriam: la biopsia de mama del diagnóstico (2024), la revisión de ese mismo bloque en 2026 y la biopsia de hígado de 2026. Se miran como en un microscopio, con zoom hasta la célula y una regla en micras ajustada a cada escáner.`,
              `${total} scanned slides from ${palabra(nMuestras, 'en')} of Miriam’s samples: the breast biopsy from her diagnosis (2024), the 2026 review of that same block and the 2026 liver biopsy. They open like a microscope, with zoom down to the cell and a micron ruler set to each scanner.`) }}</p>
            <dl class="lam__muestras">
              <div v-for="m in M.muestras" :key="m.id">
                <dt>{{ t(m.largo) }}</dt>
                <dd>{{ m.escaner }} · {{ m.aumento }} · {{ mppTexto(m.mpp, 5) }} µm/px<span v-if="m.nota">. {{ t(m.nota) }}</span></dd>
              </div>
            </dl>
            <p>{{ L(
              'Los marcadores neuroendocrinos son cromogranina, sinaptofisina, INSM1 y CD56.',
              'The neuroendocrine markers are chromogranin, synaptophysin, INSM1 and CD56.') }}</p>
            <p>
              {{ L('Si quieres los ficheros a resolución completa, pídemelos con «Pedir los ficheros». Licencia CC BY 4.0.', 'If you want the full-resolution files, ask me through “Request the files”. Licensed under CC BY 4.0.') }}
              <a href="/laminillas-ficheros/SHA256SUMS.txt" class="link-inline">{{ L('Sumas SHA-256', 'SHA-256 checksums') }}</a>
            </p>
          </details>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* La herramienta llena la pantalla bajo la cabecera fija del sitio: no hay que desplazar la página. */
.lam { height: calc(100dvh - var(--alto-cabecera, 112px)); min-height: 420px; display: flex; flex-direction: column; background: var(--color-bg); }
/* La barra: el filete va a sangre y el contenido, en el shell (.section-wide: el borde de «← Herramientas» cae bajo el logo). Hasta `lg` el relleno
   es el de siempre (16 px; 12 en móvil), así que solo el escritorio se alinea con la cabecera. */
.lam__barra { border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.lam__barra-in { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; padding-block: 8px; }
@media (max-width: 1023px) { .lam__barra-in { padding-inline: 16px; } }
.lam__volver { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; min-width: 44px; font-size: var(--texto-sm); color: var(--color-text); text-decoration: none; }
.lam__volver:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; border-radius: var(--radius-sm); }
.lam__h1 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-lg); color: var(--color-text); }
.lam__aviso { margin-left: auto; font-size: var(--texto-xs); color: var(--color-text); }
.lam__pedir--acciones { display: none; }
.lam__aviso summary { display: flex; align-items: center; gap: 6px; min-height: 36px; cursor: pointer; font-weight: 600; list-style: none; }
.lam__aviso summary::-webkit-details-marker { display: none; }
.lam__aviso-flecha { transition: transform var(--dur-micro, .15s) ease; }
.lam__aviso[open] .lam__aviso-flecha { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .lam__aviso-flecha { transition: none; } }
.lam__aviso summary:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; border-radius: var(--radius-sm); }
.lam__aviso p { margin: 4px 0 6px 22px; line-height: 1.5; }

.lam__cuerpo { position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: 280px minmax(0, 1fr) 340px; grid-template-areas: 'gal visor ficha'; }
.lam--sin-ficha .lam__cuerpo { grid-template-columns: 280px minmax(0, 1fr); grid-template-areas: 'gal visor'; }
.lam__visor { grid-area: visor; }
.lam__galeria { grid-area: gal; border-right: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.lam__ficha { grid-area: ficha; }
/* Velo bajo el informe superpuesto (tableta y móvil): lo de debajo queda inerte y un toque lo cierra. */
.lam__velo { position: absolute; z-index: 9; inset: 0; background: color-mix(in srgb, var(--color-text) 28%, transparent); }

.lam__visor { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.lam__cab { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 8px 12px; }
.lam__titulo { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; min-width: 0; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-lg); color: var(--color-text); }
.lam__titulo-corto { display: none; }
.lam__pos { font-family: var(--font-body); font-weight: 400; font-size: var(--texto-sm); font-variant-numeric: tabular-nums; color: var(--color-text-soft); }
.lam__acciones { display: flex; flex-wrap: wrap; gap: 6px; }
.lam__accion { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px; border-radius: var(--radius-md);
  border: 1px solid var(--trazo-interactivo); background: var(--color-bg-card); font: 600 var(--texto-sm) var(--font-body); color: var(--color-text); }
.lam__accion[aria-pressed='true'], .lam__accion[aria-expanded='true'] { background: var(--seleccionado-bg); border-color: var(--color-miriam); }
/* Pulsado no solo por color (1.4.1): el rótulo se subraya, como en «Por muestra / Por tinción». */
.lam__accion[aria-pressed='true'] :is(.lam__accion-texto, .lam__accion-corto), .lam__accion[aria-expanded='true'] :is(.lam__accion-texto, .lam__accion-corto) { text-decoration: underline; text-underline-offset: 3px; }
.lam__accion-corto { display: none; }
.lam__accion:focus-visible, .lam__flecha:focus-visible, .lam__cerrar:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .lam__accion:hover, .lam__flecha:hover { border-color: var(--color-miriam); }
}
.lam__lienzo { position: relative; flex: 1; min-height: 0; padding: 0 12px 12px; }
.lam__cargando { display: flex; align-items: center; justify-content: center; height: 100%; background: var(--color-bg-card); color: var(--color-text-soft); border-radius: var(--radius-md); }
/* ‹ › encima de la imagen, a media altura, como en cualquier galería. */
.lam__flecha { position: absolute; z-index: 5; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 56px; border-radius: var(--radius-md); border: 1px solid var(--trazo-interactivo);
  background: color-mix(in srgb, var(--color-bg-card) 92%, transparent); color: var(--color-text); }
.lam__flecha--ant { left: 20px; }
.lam__flecha--sig { right: 20px; }

.lam__ficha { position: relative; z-index: 10; display: flex; flex-direction: column; min-height: 0; border-left: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); background: var(--color-bg); }
.lam__ficha-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
.lam__ficha-titulo { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-base, 1rem); color: var(--color-text); }
.lam__ficha-titulo:focus { outline: none; }
.lam__ficha-titulo:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.lam__cerrar { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: var(--radius-md); color: var(--color-text); }
.lam__ficha-cuerpo { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px; display: grid; gap: 12px; align-content: start; }
/* La ficha es estrecha aquí: etiqueta encima del valor (con la columna de 9,5 rem el texto quedaba en un hilo). */
.lam__ficha :deep(.ficha__datos > div) { grid-template-columns: 1fr; gap: 2px; }
.lam__discordancia { margin: 0; font-size: var(--texto-sm); line-height: 1.5; color: var(--color-text); }
.lam__sobre { font-size: var(--texto-xs); color: var(--color-text-soft); line-height: 1.5; }
.lam__sobre summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 600; color: var(--color-text); }
.lam__sobre summary:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.lam__muestras { display: grid; gap: 6px; margin: 8px 0; }
.lam__muestras dt { font-weight: 700; color: var(--color-text); }
.lam__muestras dd { margin: 0; }

/* Tableta: galería más estrecha; la ficha se abre encima del visor, a la derecha. */
@media (max-width: 1023px) {
  .lam__cuerpo, .lam--sin-ficha .lam__cuerpo { grid-template-columns: 220px minmax(0, 1fr); }
  .lam__cuerpo, .lam--sin-ficha .lam__cuerpo { grid-template-areas: 'gal visor'; }
  .lam__ficha { position: absolute; z-index: 10; top: 0; right: 0; bottom: 0; width: min(360px, 90%); box-shadow: var(--sombra-flotante); }
}
/* Móvil: el visor arriba, la tira de la galería debajo y la ficha en un cajón desde abajo. */
@media (max-width: 767px) {
  .lam__barra-in { padding: 4px 12px; gap: 0 12px; }
  .lam__volver-texto, .lam__h1 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .lam__aviso { margin-left: 0; flex: 1; }
  .lam__pedir--barra { display: none; }
  .lam__pedir--acciones { display: inline-flex; }
  .lam__cuerpo, .lam--sin-ficha .lam__cuerpo { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; grid-template-areas: 'visor' 'gal'; }
  .lam__galeria { border-right: 0; }
  /* Dos filas: el título y, debajo, las acciones con su rótulo visible (solo icono no se entendía). */
  .lam__cab { padding: 6px 10px; gap: 4px; }
  .lam__titulo { flex-wrap: nowrap; font-size: var(--texto-base, 1rem); min-width: 0; width: 100%; }
  .lam__titulo-texto { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* El largo sigue en el árbol de accesibilidad (sr-only); se ve el corto. */
  .lam__titulo-largo { position: absolute; width: 1px; height: 1px; clip: rect(0 0 0 0); }
  .lam__titulo-corto { display: inline; }
  .lam__pos { white-space: nowrap; }
  .lam__acciones { flex-wrap: nowrap; width: 100%; }
  .lam__accion { flex: 1 1 0; justify-content: center; min-width: 44px; padding: 0 8px; font-size: var(--texto-xs); }
  .lam__accion-texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .lam__accion-corto { display: inline; }
  .lam__lienzo { padding: 0 6px 6px; }
  .lam__flecha { width: 44px; height: 48px; }
  .lam__flecha--ant { left: 10px; }
  .lam__flecha--sig { right: 10px; }
  .lam__ficha { top: auto; left: 0; right: 0; width: auto; max-height: 72%; border-left: 0; border-top: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
    border-radius: var(--radius-md) var(--radius-md) 0 0; box-shadow: var(--sombra-flotante); }
}
/* Pantallas bajas (o zoom del 200 % en adelante): la cabecera del sitio deja de pegarse para que la
   herramienta no quede en un tercio de la pantalla. */
@media (max-height: 560px) {
  :global(html.lam-activa [data-cabecera-fija]) { position: static; }
  .lam { height: 100dvh; }
}
</style>
