<script setup lang="ts">
/**
 * El explorador con la puerta ABIERTA (datos reales con OK, o el ejemplo con ?demo=1 fuera de
 * producción). Solo existe en el navegador: lo monta la página cuando la puerta lo permite.
 *
 * Qué enseña (plan del 17-oct-2026): mapa por lesión (Vitessce), un gen de la lista con n y suelo
 * ambiental por grupo (violines propios), la tabla de genes de interés con referencia emparejada y
 * lectura de Polaris (borrador), co-expresión de dos genes y número de copias (por célula SOLO en el hueso,
 * inferido de la expresión frente a la referencia; no es lectura de ADN).
 * Qué NO enseña: «% de células tumorales» del hígado, re-clustering ni comparación tumor/hepatocito.
 * SIMULADOR (18-oct, Miriam: «el mismo simulador que en local [Loupe], el buscador de marcadores y que se vea en el
 * mapa»): el mapa manda. Barra de controles arriba (lesión, buscador de los 18.132 genes, colorear por, fondo), mapa
 * grande con un panel al lado (pestañas «Gen»: violines con n y suelo; «Marcadores»: por grupo, un toque y se pinta en
 * el mapa) y el resto plegado en «Datos técnicos». En táctil el mapa se ve y se mueve tras pulsar «Mover el mapa».
 * Claro/oscuro: el tema del sistema es manual (data-tema), no prefers-color-scheme; el conmutador
 * «Fondo» pone data-tema="oscuro" en este bloque, el tema oscuro de Vitessce y su paleta de tokens.
 * Violeta = grupo de interés, selección, foco y enlaces; los avisos van en tinta (auditoría `diseno`).
 */
import type { Coexp, Lesion, LesionDatos, Manifiesto } from '~/utils/celulaExplorador'
import { coexpresion, columna, nivelMatriz, porGrupo } from '~/utils/celulaExplorador'
import { abreZarr, storeWeb, type ZarrLesion } from '~/utils/celulaExploradorZarr'
import { cssRgb, paleta, type RGB } from '~/utils/celulaExploradorColor'
import { ETIQUETA_GRUPO, ETIQUETA_LESION, ETIQUETA_TIPO, PANEL_INTERES, PROTEINA, etiqueta, nombreGen } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ man: Manifiesto; ejemplo: boolean; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

// táctil o estrecho: el mapa va encima del panel y queda quieto hasta pedir moverlo (Vitessce lleva touch-action:none)
const movil = useMediaQuery('(max-width: 1023px)')
const { height: altoVentana } = useWindowSize()
/** el mapa ocupa la pantalla: siete décimas del alto en escritorio y seis en móvil, con topes */
const altoMapa = computed(() => {
  const h = altoVentana.value || 900
  return movil.value ? Math.round(Math.min(560, Math.max(340, h * 0.6))) : Math.round(Math.min(820, Math.max(480, h * 0.7)))
})
const panel = ref<'gen' | 'marcadores'>('gen')
const lesion = ref<Lesion>(props.man.lesiones.includes('higado') ? 'higado' : props.man.lesiones[0]!)
const cache = shallowReactive<Partial<Record<Lesion, LesionDatos>>>({})
const error = ref('')
const cargando = ref(false)
const d = computed(() => cache[lesion.value] ?? null)
const gen = ref('ANKRD30A')
const genB = ref('TPBG')
const modo = ref<'grupo' | 'tipo' | 'gen' | 'coexp'>('grupo')
const tema = ref<'claro' | 'oscuro'>('claro')
const errorMapa = ref('')
const aviso = ref('')

async function asegura(l: Lesion) {
  if (cache[l]) return
  cargando.value = true; error.value = ''
  try { cache[l] = await cargaLesion(props.man, l, props.ejemplo) }
  catch (e) { error.value = String((e as Error)?.message ?? e) }
  finally { cargando.value = false }
}
watch(lesion, (l) => asegura(l), { immediate: true })
watch(d, (x) => {
  if (!x) return
  if (!x.genes.includes(gen.value)) gen.value = PANEL_INTERES.find((g) => x.genes.includes(g)) ?? x.genes[0]!
  if (!x.genes.includes(genB.value) || genB.value === gen.value) genB.value = x.genes.find((g) => g !== gen.value)!
})

const genesInteres = computed(() => (d.value ? PANEL_INTERES.filter((g) => d.value!.genes.includes(g)) : []))
const genesOtros = computed(() => (d.value ? d.value.genes.filter((g) => !PANEL_INTERES.includes(g)).sort() : []))
const filas = computed(() => (d.value ? porGrupo(d.value, gen.value) : []))
const etiquetasCx = computed(() => (d.value ? coexpresion(d.value, gen.value, genB.value) : null))
const nombresCx = computed<Record<Coexp, string>>(() => ({
  ambos: L('Los dos', 'Both'), solo_a: L(`Solo ${PROT(gen.value)}`, `${PROT(gen.value)} only`), solo_b: L(`Solo ${PROT(genB.value)}`, `${PROT(genB.value)} only`), ninguno: L('Ninguno', 'Neither'),
}))
const PROT = (g: string) => nombreGen(g).split(' (')[0]!
const nTotal = computed(() => (d.value ? fmtN(d.value.n_celulas, props.lang) : ''))
const MODOS = [['grupo', 'Grupo', 'Group'], ['tipo', 'Tipo celular', 'Cell type'], ['gen', 'Gen elegido', 'Selected gene'], ['coexp', 'Dos genes', 'Two genes']] as const
const idCtl = useId()
const ej = computed(() => (props.ejemplo ? L(' · ejemplo', ' · example') : ''))

/* ── colores del mapa y su leyenda (paleta derivada de los tokens) ── */
const montado = ref(false)
onMounted(() => { montado.value = true })
const pal = computed(() => {
  void montado.value
  if (typeof window === 'undefined') return null
  const css = getComputedStyle(document.documentElement)
  return paleta(tema.value === 'oscuro' ? 'dark' : 'light', (v) => css.getPropertyValue(v))
})
const nombreSet = computed(() => ({ grupo: L('Grupo', 'Group'), tipo: L('Tipo celular', 'Cell type'), coexp: L('Co-expresión', 'Co-expression'), gen: L(`Nivel de ${PROT(gen.value)}`, `${PROT(gen.value)} level`) }))
/** Gen elegido, como en Loupe: lo no detectado en gris y lo detectado por tramos de nivel, de claro a intenso.
 * Cortes = cuartiles del CP10k de las células donde se detecta (del fichero, nada a mano); la leyenda da el
 * rango y el n de cada tramo. Orden de dibujo: lo detectado encima de lo no detectado. */
const nivelGen = computed(() => {
  const x = d.value
  if (!x || modo.value !== 'gen') return null
  const col = columna(x, gen.value)
  const det = Array.from(col).filter((v) => v > 0).sort((a, b) => a - b)
  const q = (p: number) => det[Math.min(det.length - 1, Math.floor(p * det.length))]!
  const cortes = det.length >= 8 ? [...new Set([q(0.25), q(0.5), q(0.75)])].filter((c) => c < det[det.length - 1]!) : []
  const clase = (v: number) => (v <= 0 ? 0 : 1 + cortes.filter((c) => v > c).length)
  const clases = Array.from(col, clase)
  const f = (v: number) => { const t = String(Number(v.toPrecision(2))); return props.lang === 'en' ? t : t.replace('.', ',') }
  const lims = det.length ? [det[0]!, ...cortes, det[det.length - 1]!] : []
  const nombres = [L('No detectado', 'Not detected'), ...lims.slice(0, -1).map((a, k) => `${f(a)}–${f(lims[k + 1]!)} CP10k`)]
  const orden = Array.from(col.keys()).sort((a, b) => clases[a]! - clases[b]! || a - b)
  return { clases, nombres, orden }
})
const conjuntos = computed(() => {
  const x = d.value
  if (!x) return []
  const c = [
    { nombre: nombreSet.value.grupo, columna: 'grupo', valores: x.celulas.grupo.map((k) => etiqueta(ETIQUETA_GRUPO, x.grupos[k]!.id, props.lang)) },
    { nombre: nombreSet.value.tipo, columna: 'tipo', valores: x.celulas.tipo.map((k) => etiqueta(ETIQUETA_TIPO, x.tipos[k]!, props.lang)) },
  ]
  if (modo.value === 'coexp' && etiquetasCx.value) c.push({ nombre: nombreSet.value.coexp, columna: 'coexp', valores: etiquetasCx.value.map((k) => nombresCx.value[k]) })
  const ng = nivelGen.value
  if (ng) c.push({ nombre: nombreSet.value.gen, columna: 'nivel', valores: ng.clases.map((k) => ng.nombres[k]!) })
  return c
})
/** Leyenda del modo activo: [etiqueta, color, n]. Es también la alternativa en texto de los colores. */
const leyenda = computed<{ etiqueta: string; rgb: RGB; n: number }[]>(() => {
  const x = d.value, p = pal.value
  if (!x || !p) return []
  if (modo.value === 'grupo') {
    let r = 0
    return x.grupos.map((g) => ({ etiqueta: etiqueta(ETIQUETA_GRUPO, g.id, props.lang), n: g.n, rgb: g.rol === 'interes' ? p.interes : g.rol === 'otras' ? p.otras : p.ref[r++ % p.ref.length]! }))
  }
  if (modo.value === 'tipo') {
    const cuenta = x.tipos.map((_, k) => x.celulas.tipo.filter((t) => t === k).length)
    return x.tipos.map((t, k) => ({ etiqueta: etiqueta(ETIQUETA_TIPO, t, props.lang), n: cuenta[k]!, rgb: p.ref[k % p.ref.length]! }))
  }
  if (modo.value === 'coexp' && etiquetasCx.value) {
    const cx = etiquetasCx.value
    return (['ambos', 'solo_a', 'solo_b', 'ninguno'] as Coexp[]).map((c) => ({ etiqueta: nombresCx.value[c], n: cx.filter((v) => v === c).length, rgb: p.coexp[c] }))
  }
  const ng = nivelGen.value
  if (ng) {
    const m = ng.nombres.length - 1, tonos = p.nivel.slice(p.nivel.length - m)
    return ng.nombres.map((nm, k) => ({ etiqueta: nm, n: ng.clases.filter((c) => c === k).length, rgb: k === 0 ? p.cero : tonos[k - 1]! }))
  }
  return []
})
const colores = computed(() => {
  const set = colorearPor.value
  return leyenda.value.map((l) => ({ ruta: [set, l.etiqueta] as [string, string], rgb: l.rgb }))
})
const colorearPor = computed(() => (modo.value === 'tipo' ? nombreSet.value.tipo : modo.value === 'coexp' ? nombreSet.value.coexp : modo.value === 'gen' ? nombreSet.value.gen : nombreSet.value.grupo))

/* ── nivel «todos los genes» (Zarr): solo si el manifiesto lo permite (publicar la matriz completa) ── */
const nivel = computed(() => nivelMatriz(props.man, props.ejemplo ? 'ejemplo' : 'real'))
const zcache = shallowReactive<Partial<Record<Lesion, ZarrLesion>>>({})
const z = computed(() => zcache[lesion.value] ?? null)
const busca = ref('')
const avisoBusca = ref('')
const leyendoGen = ref(false)
const elegidoBusca = ref('')
async function aseguraZarr(l: Lesion) {
  const x = cache[l]
  if (nivel.value !== 'todos' || zcache[l] || !x) return
  try { zcache[l] = await abreZarr(storeWeb(l), x.n_celulas, x.grupos.map((g) => g.id)) }
  catch { avisoBusca.value = L('No se ha podido abrir la matriz de todos los genes, así que el buscador no funciona. El resto de la página, sí.', 'The all-genes matrix could not be opened, so gene search is unavailable. The rest of the page works as usual.') }
}
watch(d, () => { void aseguraZarr(lesion.value) }, { immediate: true })
/** nombre de proteína → símbolo (HER2 → ERBB2): la página usa los nombres de proteína y un oncólogo buscará por ellos */
const ALIAS: Record<string, string> = Object.fromEntries(Object.entries(PROTEINA).map(([g, p]) => [p.toUpperCase(), g]))
const sugerencias = computed(() => {
  const q = busca.value.trim().toUpperCase()
  const zl = z.value
  if (!zl || q.length < 2) return []
  const porAlias = Object.entries(ALIAS).filter(([p]) => p.startsWith(q)).map(([, g]) => g).filter((g) => zl.tiene(g))
  return [...new Set([...porAlias, ...zl.genes.filter((g) => g.toUpperCase().startsWith(q))])].slice(0, 12)
})
/** ¿Se puede abrir este gen en el mapa y los violines? Los del JSON siempre; con el Zarr, cualquiera con sonda. */
const abrible = (g: string) => !!d.value?.expr[g] || (!!z.value && z.value.tiene(g) && !z.value.sinSonda.has(g))
/** Abre cualquier gen: si no está en el JSON, lee su columna del Zarr y la añade a los datos de la lesión. */
async function abreGen(g: string, origen: 'busca' | 'marcadores' = 'busca') {
  g = ALIAS[g.toUpperCase()] ?? g
  const x = d.value
  avisoBusca.value = ''
  elegidoBusca.value = ''
  if (!x) return
  if (!x.expr[g]) {
    const zl = z.value
    if (!zl || !zl.tiene(g)) {
      avisoBusca.value = L(`No hay ningún gen «${g}» en estos datos. Busca por el símbolo del gen, no por la proteína (ERBB2, no HER2). Si el símbolo es correcto, el panel no lo mide o lo lista con otro nombre; que no se mida no quiere decir que no se exprese.`, `There is no gene “${g}” in these data. Search by gene symbol, not protein name (ERBB2, not HER2). If the symbol is right, the panel does not measure it or lists it under another name; not being measured does not mean it is not expressed.`)
      return
    }
    if (zl.sinSonda.has(g)) {
      avisoBusca.value = L(`${g} no está en el panel, así que no se mide. Eso no quiere decir que no se exprese.`, `${g} is not in this panel, so it is not measured. That does not mean it is not expressed.`)
      return
    }
    leyendoGen.value = true
    try {
      const col = await zl.columna(g)
      const i: number[] = [], v: number[] = []
      col.forEach((val, k) => { if (val > 0) { i.push(k); v.push(val) } })
      x.expr[g] = { i, v }
      x.suelo[g] = zl.sueloDe(g)
      x.referencia[g] = zl.refDe(g)
      x.sondas[g] = zl.sondasDe(g)
      if (!x.veredicto[g]) x.veredicto[g] = 'sin_veredicto'
    }
    catch { avisoBusca.value = L(`No se ha podido leer ${g}. Vuelve a intentarlo.`, `${g} could not be read. Try again.`); return }
    finally { leyendoGen.value = false }
  }
  busca.value = ''
  gen.value = g
  pintaGen()
  if (origen === 'busca') elegidoBusca.value = g      // los violines quedan DEBAJO del buscador: enlace, no «más arriba»
}

/** Elegir un gen (buscador, marcadores o tabla) lo pinta también en el mapa: sin esto el mapa seguía coloreado por
 * grupo y el aviso «está ahora en el mapa» era falso (pase de voz, 18-oct). En co-expresión el gen ya es el gen A. */
function pintaGen() { if (modo.value !== 'coexp') modo.value = 'gen' }
/** «Ir a los violines»: abre la pestaña «Gen» del panel y lleva el foco allí. */
function irAGen() {
  panel.value = 'gen'
  void nextTick(() => document.getElementById('exp-violines')?.focus({ preventScroll: false }))
}

/** Elegir un gen desde la tabla: los violines y el mapa cambian arriba, y se anuncia. */
function elegirDesdeTabla(g: string) {
  gen.value = g
  pintaGen()
  panel.value = 'gen'
  aviso.value = L(`Mostrando ${nombreGen(g)} en el mapa y en los violines, más arriba.`, `Showing ${nombreGen(g)} on the map and in the violins, further up.`)
}

/** Hueso: células de «Otras» sin GEM limpio (sin número de copias), y cuántas son de un tipo con grupo propio
 * (verificacion, 18-oct: 137 de tipos de referencia están en «Otras» solo por el GEM). Calculado del fichero. */
const otrasGem = computed(() => {
  const x = d.value
  if (!x || x.lesion !== 'hueso' || !('valores' in x.cnv) || !x.cnv.valores.length) return null
  const v0 = x.cnv.valores[0]!, ids = new Set(x.grupos.map((g) => g.id))
  let cuenta = 0, deTipo = 0
  v0.forEach((v, i) => {
    if (v != null || x.grupos[x.celulas.grupo[i]!]?.id !== 'otras') return
    cuenta++
    if (ids.has(x.tipos[x.celulas.tipo[i]!]!)) deTipo++
  })
  return cuenta ? { n: cuenta, deTipo } : null
})

/* ── el aviso del hígado queda fijo bajo la cabecera del sitio (sticky y de alto variable) ── */
const raiz = ref<HTMLElement | null>(null)
const altoCabecera = ref(0)
let ro: ResizeObserver | null = null
onMounted(() => {
  const cab = document.querySelector<HTMLElement>('[data-cabecera-fija]')
  if (!cab) return
  const mide = () => { altoCabecera.value = Math.ceil(cab.getBoundingClientRect().height) }
  mide()
  ro = new ResizeObserver(mide)
  ro.observe(cab)
})
onBeforeUnmount(() => ro?.disconnect())
/** WCAG 2.4.11: el foco no puede quedar tapado por la cabecera ni por el aviso fijo. */
function sinTapar(ev: FocusEvent) {
  const el = ev.target as HTMLElement
  if (!el?.matches?.(':focus-visible')) return
  const b = raiz.value?.querySelector<HTMLElement>('.exp__banner')
  const tope = altoCabecera.value + (b?.offsetHeight ?? 0) + 24
  const r = el.getBoundingClientRect()
  if (r.top < tope) window.scrollBy({ top: r.top - tope, behavior: 'instant' as ScrollBehavior })
}
</script>

<template>
  <section ref="raiz" class="exp" :data-tema="tema === 'oscuro' ? 'oscuro' : undefined" :style="{ '--exp-top': `${altoCabecera + 8}px`, '--alto-panel': `${altoMapa + 160}px` }"
           :aria-label="L('Explorador de datos', 'Data explorer')" @focusin="sinTapar">
    <div v-if="ejemplo" class="exp__demo" role="note">
      <strong>{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</strong>
      {{ L('Todo lo que ves aquí es sintético y solo sirve para enseñar cómo funciona la página. No son datos de Miriam.', 'Everything here is synthetic and only shows how the page works. None of it is Miriam’s data.') }}
    </div>

    <!-- barra del simulador: lesión, buscador, colorear por y fondo -->
    <div class="exp__ctl" role="group" :aria-label="L('Controles del explorador', 'Explorer controls')">
      <div class="exp__campo">
        <span :id="`${idCtl}-les`" class="exp__eti">{{ L('Lesión', 'Lesion') }}</span>
        <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-les`">
          <button v-for="l in man.lesiones" :key="l" type="button" class="exp__btn" :aria-pressed="lesion === l" @click="lesion = l">{{ etiqueta(ETIQUETA_LESION, l, lang) }}</button>
        </div>
      </div>
      <div v-if="d && nivel === 'todos'" class="exp__campo exp__busca">
        <label :for="`${idCtl}-busca`" class="exp__eti">{{ z ? L(`Buscar entre los ${fmtN(z.genes.length, lang)} genes`, `Search the ${fmtN(z.genes.length, lang)} genes`) : L('Buscar un gen', 'Search for a gene') }}</label>
        <input :id="`${idCtl}-busca`" v-model="busca" class="exp__sel exp__sel--busca" type="search" autocomplete="off" spellcheck="false" :disabled="!z"
               :placeholder="L('Gen o proteína, p. ej. MKI67 o HER2', 'Gene or protein, e.g. MKI67 or HER2')" @keydown.enter.prevent="busca.trim() && abreGen(sugerencias[0] ?? busca.trim().toUpperCase())" />
        <p class="sr-only" aria-live="polite">{{ busca.trim().length >= 2 && z ? (sugerencias.length === 0 ? L('Ningún gen coincide', 'No matching genes') : sugerencias.length === 1 ? L('1 gen coincide', '1 matching gene') : L(`Se muestran ${sugerencias.length} genes que coinciden`, `Showing ${sugerencias.length} matching genes`)) : '' }}</p>
        <ul v-if="sugerencias.length" class="exp__sug" :aria-label="L('Genes que coinciden', 'Matching genes')">
          <li v-for="g in sugerencias" :key="g"><button type="button" class="exp__btn exp__btn--sm" :data-gen="g" @click="abreGen(g)">{{ PROTEINA[g] ? nombreGen(g) : g }}</button></li>
        </ul>
        <p v-if="leyendoGen" class="exp__nota" role="status">{{ L('Leyendo el gen…', 'Reading the gene…') }}</p>
        <p class="exp__nota exp__nota--busca" role="status">
          <template v-if="avisoBusca">{{ avisoBusca }}</template>
          <template v-else-if="elegidoBusca && elegidoBusca === gen">{{ L(`${elegidoBusca} está ahora en el mapa y en los violines.`, `${elegidoBusca} is now on the map and in the violins.`) }} <button type="button" class="exp__salto" @click="irAGen">{{ L('Ir a los violines', 'Go to the violins') }}</button></template>
        </p>
      </div>
      <div v-if="d" class="exp__campo" :class="{ 'exp__campo--solo-ancho': nivel === 'todos' }">
        <label :for="`${idCtl}-gen`" class="exp__eti">{{ L('Genes de interés', 'Genes of interest') }}</label>
        <select :id="`${idCtl}-gen`" v-model="gen" class="exp__sel" @change="pintaGen">
          <option v-if="!d.genes.includes(gen)" :value="gen">{{ gen }}</option>
          <optgroup :label="L('Genes de interés', 'Genes of interest')">
            <option v-for="g in genesInteres" :key="g" :value="g">{{ nombreGen(g) }}</option>
          </optgroup>
          <optgroup :label="L('Otros genes', 'Other genes')">
            <option v-for="g in genesOtros" :key="g" :value="g">{{ g }}</option>
          </optgroup>
        </select>
      </div>
    </div>

    <template v-if="lesion === 'higado'">
      <div class="exp__banner" role="note">
        <svg class="exp__ico" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M240.26 186.1 152.81 34.23a28.74 28.74 0 0 0-49.62 0L15.74 186.1a27.45 27.45 0 0 0 0 27.71A28.31 28.31 0 0 0 40.55 228h174.9a28.31 28.31 0 0 0 24.79-14.19 27.45 27.45 0 0 0 .02-27.71ZM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0Zm8 88a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z" /></svg>
        <p><strong>{{ L('Hígado: tumor frente a hepatocito no está resuelto célula a célula.', 'Liver: tumor versus hepatocyte is not resolved cell by cell.') }}</strong></p>
      </div>
      <details class="exp__porque">
        <summary>{{ L('Por qué', 'Why') }}</summary>
        <p class="exp__nota exp__nota--banner">
          {{ L('El grupo «Luminal de alta confianza» es un subconjunto, no el tumor entero, y sus cifras no son «% de células tumorales». «Otras, sin asignar a un grupo» y «Hepatocitos» también pueden incluir células tumorales: el tipo se asigna por clúster, y una célula tumoral caída en un clúster de hepatocitos cuenta como hepatocito y queda fuera del grupo de interés.',
            'The “High-confidence luminal” group is a subset, not the whole tumor, and its figures are not “% of tumor cells”. “Other, not assigned to a group” and “Hepatocytes” may also include tumor cells: type is assigned per cluster, and a tumor cell falling in a hepatocyte cluster counts as hepatocyte and stays out of the group of interest.') }}
        </p>
      </details>
    </template>

    <p v-if="cargando" class="exp__estado" role="status">{{ L('Cargando los datos…', 'Loading the data…') }}</p>
    <div v-else-if="error" class="exp__estado exp__estado--error" role="alert">
      <p>{{ L('No se han podido cargar los datos de esta lesión. Para no enseñar datos a medias, no se muestra nada.', 'The data for this lesion could not be loaded. To avoid showing partial data, nothing is shown.') }}</p>
      <p class="exp__det">{{ L('Detalle técnico:', 'Technical detail:') }} {{ error }}</p>
    </div>

    <template v-else-if="d">
      <!-- el simulador: mapa grande y, al lado (debajo en móvil), el panel del gen y de los marcadores -->
      <div class="exp__sim">
        <div class="exp__mapacol">
          <h2 class="sr-only">{{ L('Mapa de células', 'Cell map') }}{{ ej }}</h2>
          <div class="exp__mapabar">
            <div class="exp__campo exp__campo--fila">
              <span :id="`${idCtl}-modo`" class="exp__eti">{{ L('Colorear por', 'Color by') }}</span>
              <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-modo`">
                <button v-for="[k, es, en] in MODOS" :key="k" type="button" class="exp__btn exp__btn--sm" :aria-pressed="modo === k" @click="modo = k">{{ L(es, en) }}</button>
              </div>
            </div>
            <div v-if="modo === 'coexp'" class="exp__campo exp__campo--fila">
              <label :for="`${idCtl}-genb-mapa`" class="exp__eti">{{ L(`${nombreGen(gen)} con`, `${nombreGen(gen)} with`) }}</label>
              <select :id="`${idCtl}-genb-mapa`" v-model="genB" class="exp__sel">
                <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
              </select>
            </div>
          </div>
          <a class="sr-only focus:not-sr-only exp__salto" href="#exp-panel">{{ L('Saltar el mapa', 'Skip the map') }}</a>
          <CelulaExplorarMapa :d="d" :modo="modo" :gen="gen" :gen-b="genB" :conjuntos="conjuntos" :colores="colores" :colorear-por="colorearPor"
                              :tema="tema === 'oscuro' ? 'dark' : 'light'" :lang="lang" :alto="altoMapa" :movil="movil" :orden="nivelGen?.orden" @error="errorMapa = $event" />
          <p v-if="errorMapa" class="exp__estado exp__estado--error" role="alert">{{ L('El mapa no se ha podido dibujar en este navegador. El panel y los datos técnicos no dependen de él.', 'The map could not be drawn in this browser. The panel and the technical data do not depend on it.') }}</p>
          <p v-if="modo === 'gen'" class="exp__leyt">{{ L(`Nivel de ${nombreGen(gen)} en cada célula: no detectado, o el tramo de CP10k en que cae (cuartiles de las células donde se detecta).`, `Level of ${nombreGen(gen)} in each cell: not detected, or the CP10k band it falls in (quartiles of the cells where it is detected).`) }}</p>
          <ul v-if="leyenda.length" class="exp__leyenda" :aria-label="L('Leyenda del mapa', 'Map legend')">
            <li v-for="l in leyenda" :key="l.etiqueta"><span class="exp__muestra" :style="{ background: cssRgb(l.rgb) }" aria-hidden="true" />{{ l.etiqueta }} <span class="nums">{{ fmtN(l.n, lang) }}</span></li>
          </ul>
          <p class="exp__nota">{{ L(`${nTotal} células de la biopsia, colocadas según lo que se parecen entre sí (UMAP). Dos puntos cercanos son células parecidas; la distancia entre grupos alejados no se interpreta.`,
            `${nTotal} cells from the biopsy, placed by how similar they are (UMAP). Nearby dots are similar cells; distances between far-apart groups are not meaningful.`) }}</p>
          <p class="exp__avisos">
            {{ L('El color es ARN, no proteína. Lo que no supera el suelo ambiental de su grupo no cuenta como expresión: míralo en los violines.',
              'Colour is RNA, not protein. Anything that does not clear its group’s ambient floor does not count as expression: check it in the violins.') }}
          </p>
          <div class="exp__campo exp__campo--fila exp__fondo">
            <span :id="`${idCtl}-tema`" class="exp__eti">{{ L('Fondo', 'Background') }}</span>
            <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-tema`">
              <button type="button" class="exp__btn exp__btn--sm" :aria-pressed="tema === 'claro'" @click="tema = 'claro'">{{ L('Claro', 'Light') }}</button>
              <button type="button" class="exp__btn exp__btn--sm" :aria-pressed="tema === 'oscuro'" @click="tema = 'oscuro'">{{ L('Oscuro', 'Dark') }}</button>
            </div>
          </div>
        </div>
        <aside id="exp-panel" class="exp__panel" :aria-label="L('Panel del gen y de los marcadores', 'Gene and markers panel')">
          <div class="exp__seg exp__pestanas" role="group" :aria-label="L('Qué ver en el panel', 'What to show in the panel')">
            <button type="button" class="exp__btn exp__btn--sm" :aria-pressed="panel === 'gen'" @click="panel = 'gen'">{{ L('Gen', 'Gene') }}</button>
            <button type="button" class="exp__btn exp__btn--sm" :aria-pressed="panel === 'marcadores'" @click="panel = 'marcadores'">{{ L('Marcadores', 'Markers') }}</button>
          </div>
          <div v-show="panel === 'gen'" id="exp-violines" class="exp__pcuerpo" tabindex="-1">
            <h2 class="exp__h2">{{ L(`${nombreGen(gen)}, grupo a grupo`, `${nombreGen(gen)}, group by group`) }}{{ ej }}</h2>
            <CelulaExplorarViolines :filas="filas" :gen="gen" :lang="lang" :lesion="lesion" :adn="d.adn" :papel="d.seleccion[gen]" :loo="d.loo[gen]" />
          </div>
          <div v-show="panel === 'marcadores'" class="exp__pcuerpo">
            <h2 class="exp__h2">{{ L('Marcadores por grupo', 'Markers per group') }}{{ ej }}</h2>
            <CelulaExplorarMarcadores :d="d" :lang="lang" :abribles="abrible" :elegido="gen" :con-mapa="!errorMapa" @elegir="(g: string) => abreGen(g, 'marcadores')" @ir-gen="irAGen" />
          </div>
        </aside>
      </div>

      <!-- todo lo demás, plegado: está a un clic, no estorba al mapa -->
      <details class="exp__tecnico">
        <summary>
          <span class="exp__tsum">{{ L('Datos técnicos', 'Technical data') }}</span>
          <span class="exp__tsub">{{ L('Grupos, genes de interés, dos genes, número de copias, perfil por regiones, ADN genómico y control de calidad', 'Groups, genes of interest, two genes, copy number, regional profile, genomic DNA and quality control') }}</span>
        </summary>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Células por grupo', 'Cells per group') }}{{ ej }}</h2>
          <ul class="exp__grupos">
            <li v-for="g in d.grupos" :key="g.id" :class="`exp__g--${g.rol}`">
              <span>{{ etiqueta(ETIQUETA_GRUPO, g.id, lang) }}</span>
              <span class="nums">n = {{ fmtN(g.n, lang) }}</span>
            </li>
          </ul>
          <p class="exp__nota">{{ L('El n de cada grupo sale directamente del fichero de datos.', 'Each group’s n comes straight from the data file.') }}</p>
          <p v-if="otrasGem" class="exp__nota">{{ L(`En el hueso, «Otras» incluye ${fmtN(otrasGem.n, 'es')} células sin GEM limpio: comparten gota con una célula del hígado y pueden llevar su ARN. ${fmtN(otrasGem.deTipo, 'es')} de ellas son de tipos que tienen grupo propio y están en «Otras» solo por eso.`, `In the bone, “Other” includes ${fmtN(otrasGem.n, 'en')} cells without a clean GEM: they share a droplet with a liver cell and may carry its RNA. ${fmtN(otrasGem.deTipo, 'en')} of them are of types that have their own group and sit in “Other” only for that reason.`) }}</p>
          <p class="exp__nota">{{ L('Grupo y tipo celular salen de métodos distintos: el grupo, de la selección de células del análisis revisado; el tipo, de la anotación por clúster con marcadores canónicos de uno de los analistas. Por eso una célula del grupo de interés puede figurar con otro tipo, o con el tipo «Sin asignar».',
            'Group and cell type come from different methods: the group, from the cell selection in the reviewed analysis; the type, from one analyst’s per-cluster annotation with canonical markers. That is why a cell in the group of interest may show another type, or the type “Unassigned”.') }}</p>
        </div>

        <div id="exp-genes" class="exp__bloque">
          <h2 class="exp__h2">{{ L('Genes de interés', 'Genes of interest') }}{{ ej }}</h2>
          <CelulaExplorarGenes :d="d" :lang="lang" :elegido="gen" @elegir="elegirDesdeTabla" />
          <p class="exp__estado" role="status">{{ aviso }}</p>
        </div>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Dos genes a la vez', 'Two genes at once') }}{{ ej }}</h2>
          <div v-if="modo !== 'coexp'" class="exp__campo exp__campo--fila">
            <label :for="`${idCtl}-genb`" class="exp__eti">{{ L(`${nombreGen(gen)} con`, `${nombreGen(gen)} with`) }}</label>
            <select :id="`${idCtl}-genb`" v-model="genB" class="exp__sel">
              <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
            </select>
          </div>
          <p v-else class="exp__nota">{{ L('El segundo gen se elige en la barra de arriba.', 'The second gene is chosen in the bar above.') }}</p>
          <CelulaExplorarCoexp v-if="etiquetasCx" :d="d" :etiquetas="etiquetasCx" :gen-a="gen" :gen-b="genB" :lang="lang" />
        </div>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Número de copias (inferido)', 'Copy number (inferred)') }}{{ ej }}</h2>
          <CelulaExplorarCnv :d="d" :lang="lang" />
        </div>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Expresión por regiones del genoma', 'Expression by genome region') }}{{ ej }}</h2>
          <CelulaExplorarPerfil :d="d" :lang="lang" />
        </div>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('ADN genómico por grupo', 'Genomic DNA per group') }}{{ ej }}</h2>
          <CelulaExplorarAdn :d="d" :lang="lang" />
        </div>

        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Control de calidad', 'Quality control') }}{{ ej }}</h2>
          <CelulaExplorarQc :d="d" :lang="lang" />
        </div>
      </details>
    </template>
  </section>
</template>

<style scoped>
.exp { min-width: 0; background: var(--fondo); color: var(--texto-1); border-radius: var(--radius-card); padding: var(--sp-16); border: 1px solid var(--trazo-medio); }
@media (min-width: 640px) { .exp { padding: var(--sp-24); } }
.exp__demo { margin: 0 0 var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 2px dashed var(--texto-1); border-radius: var(--radius-btn); font: 600 var(--texto-sm)/1.45 var(--font-body); }
.exp__demo strong { display: block; font: 700 var(--texto-sm)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); color: var(--texto-1); }
.exp__ctl { display: flex; flex-wrap: wrap; gap: var(--sp-16) var(--sp-24); align-items: flex-end; padding-bottom: var(--sp-16); border-bottom: 1px solid var(--trazo-medio); }
.exp__campo { display: grid; gap: var(--sp-4); }
.exp__campo--fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.exp__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.exp__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.exp__btn {
  min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); color: var(--texto-1);
  font: 600 var(--texto-sm)/1 var(--font-body); background: transparent;
  transition: background-color var(--dur-micro) var(--curva-salida), color var(--dur-micro) var(--curva-salida), transform var(--dur-micro) var(--curva-salida);
  -webkit-tap-highlight-color: transparent;
}
.exp__btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .exp__btn { transition: none; } .exp__btn:active { transform: none; } }
.exp__btn--sm { font-size: var(--texto-xs); padding: 0 var(--sp-12); }
.exp__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.exp__btn:focus-visible, .exp__sel:focus-visible, .exp__salto:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__sel { min-height: 44px; min-width: 14rem; max-width: 100%; padding: 0 var(--sp-12); border-radius: var(--radius-btn); border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1); font: 500 var(--texto-base)/1 var(--font-body); }
.exp__banner { display: flex; gap: var(--sp-8); align-items: flex-start; padding: var(--sp-12) var(--sp-16); border-radius: var(--radius-btn); font: var(--tipo-body-sm); }
.exp__banner { margin: var(--sp-16) 0 0; position: sticky; top: var(--exp-top, 8px); z-index: 5; background: var(--fondo); border: 2px solid var(--texto-1); color: var(--texto-1); }
@media (max-width: 1023px) { .exp__banner { padding: var(--sp-8) var(--sp-12); font-size: var(--texto-xs); } }
.exp__banner p { margin: 0; }
.exp__ico { width: 20px; height: 20px; flex: none; margin-top: 1px; color: var(--texto-1); }
.exp__estado { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.exp__estado:empty { margin: 0; }
.exp__estado--error { color: var(--texto-1); font-weight: 600; }
.exp__estado--error p { margin: 0; }
.exp__det { margin-top: var(--sp-4) !important; font: 400 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
/* simulador: el mapa manda (≈60 %), el panel al lado; en estrecho, uno encima del otro */
.exp__sim { display: grid; gap: var(--sp-24); margin-top: var(--sp-16); }
@media (min-width: 1024px) { .exp__sim { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: start; } }
.exp__mapacol, .exp__panel { min-width: 0; }
@media (min-width: 1024px) { .exp__panel { max-height: calc(var(--alto-panel, 80vh)); overflow: auto; position: sticky; top: var(--exp-top, 8px); padding-right: var(--sp-4); } }
.exp__pestanas { margin-bottom: var(--sp-12); }
.exp__pcuerpo:focus { outline: none; }
#exp-violines, #exp-panel { scroll-margin-top: calc(var(--exp-top, 8px) + 7rem); }   /* que el salto no lo tape la cabecera ni el aviso fijo */
.exp__avisos { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: none; }
.exp__porque { margin-top: var(--sp-4); }
.exp__porque summary, .exp__tecnico summary { cursor: pointer; list-style-position: inside; }
.exp__porque summary { min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--identidad); }
.exp__porque summary:focus-visible, .exp__tecnico summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__tecnico { margin-top: var(--sp-32); border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.exp__tecnico summary { display: grid; gap: var(--sp-4); min-height: 44px; padding: var(--sp-8) 0; }
.exp__tsum { font: var(--tipo-h3); color: var(--texto-1); }
.exp__tsub { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.exp__tecnico > .exp__bloque:first-of-type { border-top: 0; margin-top: var(--sp-16); padding-top: 0; }
.exp__sel--busca { min-width: min(22rem, 100%); }
.exp__mapabar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-24); margin-bottom: var(--sp-8); }
.exp__mapabar .exp__campo--fila { margin-bottom: 0; }
.exp__leyt { margin: var(--sp-12) 0 0; font: 600 var(--texto-xs)/1.4 var(--font-body); color: var(--texto-1); max-width: var(--measure); }
.exp__fondo { margin-top: var(--sp-12); }
@media (max-width: 1023px) { .exp__campo--solo-ancho { display: none; } }   /* en móvil manda el buscador */
.exp__h2 { font: var(--tipo-h3); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.exp__nota { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.exp__nota--busca:empty { display: none; }
.exp__nota--banner { margin-top: var(--sp-8); }
.exp__salto { display: inline-block; margin-bottom: var(--sp-8); padding: 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-sm) var(--font-body); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.exp__leyenda { list-style: none; margin: var(--sp-12) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-4) var(--sp-16); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); }
.exp__leyenda li { display: inline-flex; align-items: center; gap: var(--sp-8); }
.exp__leyenda .nums { font-family: var(--font-mono); color: var(--texto-2); }
.exp__muestra { width: 12px; height: 12px; border-radius: 999px; flex: none; box-shadow: 0 0 0 1px var(--trazo-fuerte); }
.exp__bloque { margin-top: var(--sp-32); padding-top: var(--sp-24); border-top: 1px solid var(--trazo-medio); }
.exp__grupos { list-style: none; margin: 0; padding: 0; display: grid; gap: 0 var(--sp-24); grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr)); }
.exp__grupos li { display: flex; justify-content: space-between; gap: var(--sp-8); padding: var(--sp-8) 0; border-bottom: 1px solid var(--trazo-sutil); font: var(--tipo-body-sm); }
.exp__grupos .nums { font-family: var(--font-mono); color: var(--texto-2); white-space: nowrap; flex: none; }
.exp__g--interes span:first-child { color: var(--identidad); font-weight: 600; }
.exp__busca { position: relative; flex: 1 1 18rem; }
.exp__busca .exp__sel { width: 100%; }
.exp__sug { position: absolute; top: calc(100% + var(--sp-4)); left: 0; right: 0; z-index: 10; list-style: none; margin: 0; padding: var(--sp-8); display: flex; flex-wrap: wrap; gap: var(--sp-4); max-width: 28rem; background: var(--fondo); border: 1px solid var(--trazo-fuerte); border-radius: var(--radius-btn); box-shadow: 0 6px 18px color-mix(in srgb, var(--texto-1) 12%, transparent); }
.exp__sel::placeholder { color: var(--texto-2); opacity: 1; }
</style>
