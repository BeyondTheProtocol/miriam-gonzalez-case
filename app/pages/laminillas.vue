<script setup lang="ts">
/**
 * /laminillas · /en/slides — las laminillas escaneadas del caso, en un visor público.
 *
 * Entrada: matriz marcador × muestra con miniaturas (prerenderizada: se lee sin JS). Elegir una
 * fila abre la comparación de esa tinción en todas las muestras (OpenSeadragon, zoom a la par en
 * µm, movimiento enlazado solo dentro del mismo bloque); elegir la cabecera de una columna recorre
 * todas las tinciones de esa muestra. Botón «HE de referencia»: pone la HE de la misma muestra
 * debajo de cada panel. Todo sale de app/data/laminillas.json (ver app/utils/laminillas.ts).
 *
 * Herramienta de apoyo, no diagnóstico. Cada dato clínico de las fichas lleva su sello de
 * verificación contra el informe original. Sin normalizar color.
 */
import datos from '~/data/laminillas.json'
import { deMuestra, filas as calculaFilas, heDe, type Fila, type Laminilla, type Manifest } from '~/utils/laminillas'

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
const mppTexto = (mpp: number, dec: number) => mpp.toLocaleString(idioma.value === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: dec })

const grupos = computed(() => {
  const g: { id: string; titulo: string; filas: Fila[] }[] = [
    { id: 'todas', titulo: L(`En las ${nMuestras} muestras`, `In all ${nMuestras} samples`), filas: filas.filter((f) => f.n === nMuestras) },
    { id: 'varias', titulo: L('En más de una muestra', 'In more than one sample'), filas: filas.filter((f) => f.n > 1 && f.n < nMuestras) },
    { id: 'una', titulo: L('En una sola muestra', 'In a single sample'), filas: filas.filter((f) => f.n === 1) },
  ]
  return g.filter((x) => x.filas.length)
})

// Estado en la URL (?fila=re&he=1 · ?muestra=mama-2024&n=3). Se VIGILA la query: en la página
// prerenderizada llega vacía durante la hidratación y se aplica después.
const fila = ref<string | null>(null)
const muestra = ref<string | null>(null)
const paso = ref(0)
const conHE = ref(false)
function leeQuery() {
  const q = route.query
  fila.value = typeof q.fila === 'string' && filas.some((f) => f.marcador.id === q.fila) ? q.fila : null
  muestra.value = !fila.value && typeof q.muestra === 'string' && M.muestras.some((m) => m.id === q.muestra) ? q.muestra : null
  paso.value = Math.max(0, Number(q.n ?? 1) - 1) || 0
  conHE.value = q.he === '1'
}
watch(() => route.query, leeQuery, { immediate: true, deep: true })

// Abrir y cerrar el visor entra en el historial (el «atrás» del móvil vuelve a la tabla); cambiar
// de paso o de HE de referencia, no. Al cerrar, el foco vuelve al botón que lo abrió.
let disparador: HTMLElement | null = null
function recuerda(e?: Event) {
  const el = e?.currentTarget as HTMLElement | undefined
  disparador = (el?.tagName === 'TR' ? el.querySelector('button') : el) ?? null
}
function abreFila(id: string, e?: Event) {
  recuerda(e)
  router.push({ query: { fila: id, ...(conHE.value ? { he: '1' } : {}) }, hash: '#visor' })
}
function abreMuestra(id: string, e?: Event) {
  recuerda(e)
  router.push({ query: { muestra: id, n: '1' }, hash: '#visor' })
}
async function cierra() {
  await router.push({ query: {}, hash: '#matriz' })
  await nextTick()
  disparador?.focus()
}
function alternaHE() {
  const q: Record<string, string> = { ...(route.query as Record<string, string>) }
  if (conHE.value) delete q.he
  else q.he = '1'
  router.replace({ query: q })
}

const recorrido = computed(() => (muestra.value ? deMuestra(M, muestra.value) : []))
const actual = computed(() => recorrido.value[Math.min(paso.value, recorrido.value.length - 1)])
function mueve(d: number) {
  const n = recorrido.value.length
  if (!n || !muestra.value) return
  const i = (Math.min(paso.value, n - 1) + d + n) % n
  router.replace({ query: { ...(route.query as Record<string, string>), n: String(i + 1) } })
}

const filaActual = computed(() => filas.find((f) => f.marcador.id === fila.value))
const columnasFila = computed(() => M.muestras.filter((m) => filaActual.value?.celdas[m.id]))
const puedeHE = computed(() => (fila.value ? fila.value !== 'he' : actual.value ? actual.value.marcador !== 'he' : false))
const rejilla = computed<(Laminilla | null)[][]>(() => {
  if (filaActual.value) {
    const arriba = columnasFila.value.map((m) => filaActual.value!.celdas[m.id]![0]!)
    if (conHE.value && puedeHE.value) return [arriba, columnasFila.value.map((m) => heDe(M, m.id) ?? null)]
    return [arriba]
  }
  if (actual.value) {
    const he = heDe(M, actual.value.muestra)
    return [conHE.value && puedeHE.value && he ? [actual.value, he] : [actual.value]]
  }
  return []
})
// Rótulo corto en cada panel (el título ya dice el resto): en una fila, la muestra; en el recorrido,
// el marcador. La HE de referencia se nombra como tal. El nombre accesible lleva siempre las dos cosas.
const rotulos = computed(() => rejilla.value.flatMap((filaR, r) => filaR.map((l) => {
  if (!l) return ''
  if (fila.value) return r === 0 ? conVariante(nombreMuestra(l.muestra), l) : `HE · ${nombreMuestra(l.muestra)}`
  return conVariante(r === 0 && l === actual.value ? nombreMarcador(l.marcador) : L('HE de referencia', 'Reference H&E'), l)
})))
const nombres = computed(() => rejilla.value.flat().map((l) => (l ? etiqueta(l) : '')))
const fichas = computed(() => rejilla.value.flat().filter((l): l is Laminilla => !!l))
const tituloVisor = computed(() => {
  if (filaActual.value) {
    const n = columnasFila.value.length
    return L(`${t(filaActual.value.marcador.nombre)} en ${n === 1 ? 'su muestra' : `las ${n} muestras`}`,
      `${t(filaActual.value.marcador.nombre)} in ${n === 1 ? 'its sample' : `all ${n} samples`}`)
  }
  if (muestra.value) return L(`${nombreMuestra(muestra.value)}: todas sus tinciones`, `${nombreMuestra(muestra.value)}: every stain`)
  return ''
})
// Donde se leen las cifras que no coinciden entre informes, el aviso se repite junto al visor.
const conDiscordancia = computed(() => ['re', 'rp', 'ki67'].includes(fila.value ?? ''))
const textoDiscordancia = computed(() => L(
  'Las lecturas del bloque de mama no coinciden en todas las cifras: RE 95 % en el informe de 2024 y 85 % en la revisión de 2026, RP 5 % y 20 %, Ki-67 60 % y 40 %. Cada ficha da la del informe de su propia tanda de laminillas.',
  'The readings of the breast block do not agree on every figure: ER 95% in the 2024 report and 85% in the 2026 review, PR 5% and 20%, Ki-67 60% and 40%. Each record gives the figure from the report for its own batch of slides.'))

const encabezado = ref<HTMLElement | null>(null)
watch([fila, muestra], async ([f, m], [f0, m0]) => {
  if ((f && f !== f0) || (m && m !== m0)) {
    await nextTick()
    encabezado.value?.focus({ preventScroll: true })
    encabezado.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
})
function teclas(e: KeyboardEvent) {
  if (!muestra.value) return
  if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); mueve(1) }
  if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); mueve(-1) }
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

        <!-- Matriz marcador × muestra -->
        <div id="matriz" class="scroll-mt-32">
          <table class="matriz">
            <caption class="matriz__leyenda">
              {{ L(`${total} laminillas: tinción por muestra`, `${total} slides: stain by sample`) }}
            </caption>
            <thead>
              <tr>
                <th scope="col" class="matriz__esquina">{{ L('Tinción', 'Stain') }}</th>
                <th v-for="m in M.muestras" :key="m.id" scope="col" class="matriz__col">
                  <button type="button" class="matriz__colboton" :aria-current="muestra === m.id ? 'true' : undefined" @click="abreMuestra(m.id, $event)">
                    <span class="matriz__colnombre">{{ t(m.corto) }}</span>
                    <span class="matriz__colmeta"><span class="whitespace-nowrap">{{ m.aumento }}</span> <span class="matriz__colmpp whitespace-nowrap">{{ mppTexto(m.mpp, 3) }} µm/px</span></span>
                    <span class="sr-only">{{ L('Recorrer todas las tinciones de esta muestra', 'Step through every stain from this sample') }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody v-for="g in grupos" :key="g.id">
              <tr class="matriz__grupo">
                <th :colspan="M.muestras.length + 1" scope="rowgroup">{{ g.titulo }}</th>
              </tr>
              <tr v-for="f in g.filas" :key="f.marcador.id" class="matriz__fila" :class="{ 'matriz__fila--activa': fila === f.marcador.id }" @click="abreFila(f.marcador.id, $event)">
                <th scope="row" class="matriz__filacab">
                  <button type="button" class="matriz__filaboton" :aria-current="fila === f.marcador.id ? 'true' : undefined" @click.stop="abreFila(f.marcador.id, $event)">
                    <span>{{ t(f.marcador.nombre) }}</span>
                    <span v-if="f.marcador.nota" class="matriz__nota">{{ t(f.marcador.nota) }}</span>
                  </button>
                </th>
                <td v-for="m in M.muestras" :key="m.id" class="matriz__celda">
                  <template v-if="f.celdas[m.id]">
                    <img
                      v-for="l in f.celdas[m.id]"
                      :key="l.id"
                      :src="l.miniatura"
                      :alt="L('Laminilla', 'Slide') + (l.variante ? ' · ' + t(l.variante) : '')"
                      class="matriz__mini"
                      :class="{ 'matriz__mini--doble': f.celdas[m.id]!.length > 1 }"
                      width="96" height="96" loading="lazy" decoding="async"
                    >
                  </template>
                  <span v-else class="matriz__vacia">
                    <span aria-hidden="true">·</span><span class="sr-only">{{ L('Sin laminilla', 'No slide') }}</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <Nota icon="tap" class="mt-4">{{ L(
            'Elige una fila para comparar esa tinción en todas sus muestras, con el zoom a la par, o la cabecera de una columna para recorrer esa muestra.',
            'Pick a row to compare that stain across all its samples with matched zoom, or a column header to step through that sample.') }}</Nota>
          <p class="discordancia mt-6">{{ textoDiscordancia }}</p>
          <dl class="muestras mt-6">
            <div v-for="m in M.muestras" :key="m.id">
              <dt>{{ t(m.largo) }}</dt>
              <dd>{{ m.escaner }} · {{ m.aumento }} · {{ mppTexto(m.mpp, 5) }} µm/px<span v-if="m.nota">. {{ t(m.nota) }}</span></dd>
            </div>
          </dl>
          <p class="muestras-nota mt-4">{{ L(
            'Los marcadores neuroendocrinos de la tabla son cromogranina, sinaptofisina, INSM1 y CD56.',
            'The neuroendocrine markers in the table are chromogranin, synaptophysin, INSM1 and CD56.') }}</p>
        </div>

        <!-- Comparación (fila) o recorrido (columna) -->
        <section v-if="rejilla.length" id="visor" class="visor-seccion scroll-mt-32" aria-labelledby="visor-titulo" @keydown="teclas">
          <div class="visor-cabecera">
            <h2 id="visor-titulo" ref="encabezado" tabindex="-1" class="font-display font-semibold text-berenjena text-2xl scroll-mt-32">{{ tituloVisor }}</h2>
            <div class="visor-acciones">
              <button type="button" class="btn-ghost min-h-[44px]" @click="cierra">
                <Icon name="ph:table-bold" class="w-4 h-4" aria-hidden="true" />{{ L('Volver a la tabla', 'Back to the table') }}
              </button>
              <button v-if="puedeHE" type="button" class="btn-secondary min-h-[44px]" :aria-pressed="conHE" @click="alternaHE">
                <Icon :name="conHE ? 'ph:check-bold' : 'ph:square-split-horizontal-bold'" class="w-4 h-4" aria-hidden="true" />{{ L('HE de referencia', 'Reference H&E') }}
              </button>
            </div>
          </div>
          <p v-if="conDiscordancia" class="discordancia mb-3">{{ textoDiscordancia }}</p>
          <div v-if="muestra && recorrido.length" class="recorrido">
            <button type="button" class="btn-secondary min-h-[44px]" @click="mueve(-1)">
              <Icon name="ph:caret-left-bold" class="w-4 h-4" aria-hidden="true" />{{ L('Anterior', 'Previous') }}
            </button>
            <p class="recorrido__estado" aria-live="polite">
              {{ L(`${Math.min(paso, recorrido.length - 1) + 1} de ${recorrido.length}`, `${Math.min(paso, recorrido.length - 1) + 1} of ${recorrido.length}`) }} ·
              <strong>{{ actual ? nombreMarcador(actual.marcador) : '' }}<template v-if="actual?.variante"> · {{ t(actual.variante) }}</template></strong>
            </p>
            <button type="button" class="btn-secondary min-h-[44px]" @click="mueve(1)">
              {{ L('Siguiente', 'Next') }}<Icon name="ph:caret-right-bold" class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <ClientOnly>
            <LaminillasVisor :manifest="M" :rejilla="rejilla" :idioma="idioma" :teselas="teselas" :rotulos="rotulos" :nombres="nombres" />
            <template #fallback>
              <div class="visor-cargando">{{ L('Cargando el visor…', 'Loading the viewer…') }}</div>
            </template>
          </ClientOnly>
          <div class="fichas" :style="{ '--cols': Math.min(3, rejilla[0]?.length ?? 1) }">
            <LaminillasFicha v-for="l in fichas" :key="l.id" :manifest="M" :laminilla="l" :idioma="idioma" :titulo="etiqueta(l)" />
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.matriz { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.matriz__leyenda { caption-side: top; text-align: left; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-xl); color: var(--color-text); margin-bottom: var(--sp-12); }
.matriz__esquina { width: 30%; text-align: left; font-size: var(--texto-xs); color: var(--color-text-soft); font-weight: 600; padding: 0 var(--sp-8) var(--sp-8) 0; vertical-align: bottom; }
@media (min-width: 768px) { .matriz__esquina { width: 22%; } }
.matriz__col { padding: 0 2px var(--sp-8); vertical-align: bottom; }
.matriz__colboton { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; width: 100%; min-height: 44px; padding: 6px 4px;
  border-radius: var(--radius-md); background: var(--color-bg-card); border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent); color: var(--color-text); }
.matriz__colboton[aria-current='true'] { border-color: var(--color-miriam); background: var(--seleccionado-bg); }
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
.matriz__fila--activa > * { background: color-mix(in srgb, var(--color-miriam-soft) 45%, transparent); }
@media (hover: hover) and (pointer: fine) {
  .matriz__fila:hover > * { background: color-mix(in srgb, var(--color-miriam-soft) 45%, transparent); }
  .matriz__colboton:hover { border-color: var(--color-miriam); }
}
.matriz__filacab { text-align: left; padding: 0; }
.matriz__filaboton { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; width: 100%; min-height: 64px; padding: 6px 8px 6px 4px;
  font-weight: 700; font-size: var(--texto-sm); color: var(--color-text); text-align: left; border-radius: var(--radius-sm); }
.matriz__filaboton[aria-current='true'] { color: var(--color-miriam); }
.matriz__nota { font-weight: 400; font-size: 12px; color: var(--color-text-soft); line-height: 1.3; }
.matriz__celda { text-align: center; padding: 6px 2px; vertical-align: middle; }
.matriz__mini { display: inline-block; width: min(96px, 100%); aspect-ratio: 1; object-fit: contain; background: #fff; border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
.matriz__mini--doble { width: min(46px, 48%); margin: 0 1px; }
.matriz__vacia { color: color-mix(in srgb, var(--color-text) 35%, transparent); font-size: var(--texto-lg); }
.discordancia { max-width: 80ch; font-size: var(--texto-sm); color: var(--color-text); line-height: 1.55; }
.muestras { display: grid; gap: var(--sp-8); font-size: var(--texto-xs); color: var(--color-text-soft); max-width: 80ch; }
.muestras dt { font-weight: 700; color: var(--color-text); }
.muestras dd { margin: 0; line-height: 1.5; }
.muestras-nota { max-width: 80ch; font-size: var(--texto-xs); color: var(--color-text-soft); line-height: 1.5; }
.visor-seccion { margin-top: var(--sp-48); padding-top: var(--sp-24); border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.visor-cabecera { display: flex; flex-wrap: wrap; gap: var(--sp-12); align-items: center; justify-content: space-between; margin-bottom: var(--sp-12); }
.visor-cabecera h2:focus { outline: none; }
.visor-cabecera h2:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 4px; }
.visor-acciones { display: flex; flex-wrap: wrap; gap: var(--sp-8); }
/* Pulsado: violeta suave con texto berenjena también en hover (el hover del DS pone texto crema: 1,29:1). */
.visor-acciones .btn-secondary[aria-pressed='true'],
.visor-acciones .btn-secondary[aria-pressed='true']:hover { background: var(--seleccionado-bg); color: var(--color-text); }
.recorrido { display: flex; flex-wrap: wrap; gap: var(--sp-8); align-items: center; margin-bottom: var(--sp-12); }
.recorrido__estado { margin: 0; font-size: var(--texto-sm); color: var(--color-text); min-width: 12ch; }
.visor-cargando { display: flex; align-items: center; justify-content: center; height: clamp(280px, 52svh, 640px); background: var(--color-bg-card); color: var(--color-text-soft); border-radius: var(--radius-md); }
.fichas { display: grid; gap: var(--sp-12); margin-top: var(--sp-16); grid-template-columns: 1fr; }
@media (min-width: 1024px) { .fichas { grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); } }
</style>
