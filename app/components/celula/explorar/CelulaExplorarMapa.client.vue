<script setup lang="ts">
/**
 * Mapa de células (UMAP) con Vitessce, como isla de cliente. React y Vitessce se cargan con
 * `import()` al montar: viajan en un chunk propio que solo pide esta página, y nunca en el HTML.
 * Lo que tiene que llevar avisos, n y suelo NO va aquí (eso son los paneles propios): el mapa enseña
 * dónde cae cada célula y de qué color es, nada más. Su alternativa en texto es la tabla de n por
 * grupo que va debajo (ExpExplorador).
 */
import type { Coexp, LesionDatos } from '~/utils/celulaExplorador'
import { columna } from '~/utils/celulaExplorador'
import { ETIQUETA_GRUPO, ETIQUETA_TIPO, etiqueta } from '~/utils/celulaExploradorTexto'

const props = defineProps<{
  d: LesionDatos
  modo: 'grupo' | 'tipo' | 'gen' | 'coexp'
  gen: string
  genB: string
  coexp: Coexp[] | null
  etiquetasCoexp: Record<Coexp, string>
  tema: 'light' | 'dark'
  lang: 'es' | 'en'
}>()
const emit = defineEmits<{ error: [string] }>()

const el = ref<HTMLElement | null>(null)
const cargando = ref(true)
let motor: { pinta: (e: any) => void; desmonta: () => void } | null = null

// colores del sistema: el grupo de interés en violeta; las referencias en tintas; «otras» casi fondo
const VIOLETA = { light: [157, 68, 171], dark: [199, 125, 210] } as const
const TINTAS = [[58, 51, 64], [96, 88, 104], [128, 118, 138], [84, 104, 122], [122, 104, 88], [70, 96, 86], [146, 128, 150], [104, 112, 138]]
const OTRAS = { light: [206, 198, 210], dark: [96, 82, 110] } as const
const COEXP = { ambos: [157, 68, 171], solo_a: [84, 104, 122], solo_b: [196, 140, 90], ninguno: [214, 208, 216] } as const

function entrada() {
  const d = props.d, L = props.lang, tema = props.tema
  const nGrupo = L === 'en' ? 'Group' : 'Grupo', nTipo = L === 'en' ? 'Cell type' : 'Tipo celular', nCo = L === 'en' ? 'Co-expression' : 'Co-expresión'
  const grupo = d.celulas.grupo.map((k) => etiqueta(ETIQUETA_GRUPO, d.grupos[k]!.id, L))
  const tipo = d.celulas.tipo.map((k) => etiqueta(ETIQUETA_TIPO, d.tipos[k]!, L))
  const conjuntos = [{ nombre: nGrupo, columna: 'grupo', valores: grupo }, { nombre: nTipo, columna: 'tipo', valores: tipo }]
  if (props.coexp) conjuntos.push({ nombre: nCo, columna: 'coexp', valores: props.coexp.map((c) => props.etiquetasCoexp[c]) })
  let ref = 0
  const colores: { ruta: [string, string]; rgb: [number, number, number] }[] = d.grupos.map((g) => ({
    ruta: [nGrupo, etiqueta(ETIQUETA_GRUPO, g.id, L)],
    rgb: (g.rol === 'interes' ? VIOLETA[tema] : g.rol === 'otras' ? OTRAS[tema] : TINTAS[ref++ % TINTAS.length]) as [number, number, number],
  }))
  d.tipos.forEach((tp, k) => colores.push({ ruta: [nTipo, etiqueta(ETIQUETA_TIPO, tp, L)], rgb: TINTAS[k % TINTAS.length] as [number, number, number] }))
  if (props.coexp) (Object.keys(COEXP) as Coexp[]).forEach((c) => colores.push({ ruta: [nCo, props.etiquetasCoexp[c]], rgb: [...COEXP[c]] as [number, number, number] }))
  const colorearPor = props.modo === 'tipo' ? nTipo : props.modo === 'coexp' && props.coexp ? nCo : nGrupo
  return {
    uid: `exp-${d.lesion}-${props.modo}-${props.gen}-${props.coexp ? props.genB : ''}-${tema}-${L}`,
    tema, alto: 520, umap: d.celulas.umap, conjuntos, colores, colorearPor,
    gen: props.modo === 'gen' ? { simbolo: props.gen, valores: columna(d, props.gen) } : null,
    etiquetas: { mapa: L === 'en' ? 'Cell map (UMAP)' : 'Mapa de células (UMAP)', conjuntos: L === 'en' ? 'Groups' : 'Grupos' },
  }
}

onMounted(async () => {
  try {
    const m = await import('~/lib/explorador/motor')
    if (!el.value) return
    motor = m.montaMotor(el.value)
    motor.pinta(entrada())
  }
  catch (e) { emit('error', String((e as Error)?.message ?? e)) }
  finally { cargando.value = false }
})
watch(() => [props.d, props.modo, props.gen, props.genB, props.coexp, props.tema, props.lang], () => { motor?.pinta(entrada()) })
onBeforeUnmount(() => { motor?.desmonta(); motor = null })
</script>

<template>
  <div class="exp-mapa" :class="{ 'exp-mapa--oscuro': tema === 'dark' }">
    <p v-if="cargando" class="exp-mapa__carga">{{ lang === 'en' ? 'Loading the map…' : 'Cargando el mapa…' }}</p>
    <div ref="el" class="exp-mapa__lienzo" role="region" :aria-label="lang === 'en' ? 'Interactive cell map (visual). The same information is in the lists and tables below.' : 'Mapa de células interactivo (visual). La misma información está en las listas y tablas de abajo.'" />
  </div>
</template>

<style scoped>
.exp-mapa { position: relative; min-height: 520px; border-radius: var(--radius-card); overflow: hidden; border: 1px solid var(--trazo-medio); background: #fff; }
.exp-mapa--oscuro { background: #222; }
.exp-mapa__lienzo { position: relative; height: 520px; }
.exp-mapa__carga { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
</style>
