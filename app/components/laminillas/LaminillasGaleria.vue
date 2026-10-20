<script setup lang="ts">
/**
 * Galería de /laminillas (rediseño del 20-oct-2026: «un visor e ir cambiando, o las slides listadas
 * como una galería»). Las 32 laminillas con su miniatura, agrupadas por muestra o por tinción.
 * Escritorio: columna a la izquierda del visor, que se desplaza ella sola. Móvil: tira deslizable
 * bajo el visor (se desliza la tira, no la imagen: en el visor ese gesto ya mueve la laminilla).
 *
 * Cada laminilla es un enlace de verdad (?l=…): sin JS se puede abrir y compartir; con JS la página
 * cambia el visor en su sitio. La activa lleva aria-current y la galería la mantiene a la vista.
 */
import { gruposGaleria, type Agrupacion, type Idioma, type Laminilla, type Manifest } from '~/utils/laminillas'

const props = defineProps<{
  manifest: Manifest
  idioma: Idioma
  por: Agrupacion
  activa: string
  /** Las otras laminillas que se ven al comparar (se marcan, sin aria-current). */
  tambien: string[]
  enlace: (id: string) => string
}>()
const emit = defineEmits<{ elige: [id: string]; por: [por: Agrupacion] }>()
const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
const t = (x: { es: string; en: string } | undefined) => (x ? x[props.idioma] : '')

const grupos = computed(() => gruposGaleria(props.manifest, props.por))
const marcador = (id: string) => props.manifest.marcadores.find((m) => m.id === id)
const muestra = (id: string) => props.manifest.muestras.find((m) => m.id === id)
const tituloGrupo = (id: string) => (props.por === 'muestra' ? t(muestra(id)?.corto) : t(marcador(id)?.nombre))
const conVariante = (base: string, l: Laminilla) => base + (l.variante ? ' · ' + t(l.variante) : '')
/** Rótulo largo (columna de escritorio) y corto (tira del móvil). */
const largo = (l: Laminilla) => conVariante(props.por === 'muestra' ? t(marcador(l.marcador)?.nombre) : t(muestra(l.muestra)?.corto), l)
const corto = (l: Laminilla) => conVariante(props.por === 'muestra' ? t(marcador(l.marcador)?.nombre).split(' · ')[0]! : t(muestra(l.muestra)?.corto), l)
const voz = (l: Laminilla) => `${t(marcador(l.marcador)?.nombre)}, ${t(muestra(l.muestra)?.corto)}${l.variante ? ', ' + t(l.variante) : ''}`.replaceAll(' · ', ', ')

// La activa, a la vista DENTRO de la galería (sin scrollIntoView, que movería también la página).
const lista = ref<HTMLElement | null>(null)
function aLaVista() {
  const caja = lista.value
  const el = caja?.querySelector<HTMLElement>(`[data-l="${CSS.escape(props.activa)}"]`)
  if (!caja || !el) return
  const horizontal = caja.scrollWidth > caja.clientWidth + 1 && caja.scrollHeight <= caja.clientHeight + 1
  if (horizontal) {
    const fuera = el.offsetLeft < caja.scrollLeft || el.offsetLeft + el.offsetWidth > caja.scrollLeft + caja.clientWidth
    if (fuera) caja.scrollTo({ left: el.offsetLeft - (caja.clientWidth - el.offsetWidth) / 2 })
  } else {
    const fuera = el.offsetTop < caja.scrollTop || el.offsetTop + el.offsetHeight > caja.scrollTop + caja.clientHeight
    if (fuera) caja.scrollTo({ top: el.offsetTop - (caja.clientHeight - el.offsetHeight) / 2 })
  }
}
watch(() => [props.activa, props.por], () => nextTick(aLaVista))
onMounted(() => nextTick(aLaVista))
</script>

<template>
  <nav class="gal" :aria-label="L('Galería de laminillas', 'Slide gallery')">
    <div class="gal__cab">
      <span class="gal__n">{{ L(`${manifest.laminillas.length} laminillas`, `${manifest.laminillas.length} slides`) }}</span>
      <div class="gal__por" role="group" :aria-label="L('Agrupar', 'Group')">
        <button type="button" class="gal__por-boton" :aria-pressed="por === 'muestra'" @click="emit('por', 'muestra')">{{ L('Por muestra', 'By sample') }}</button>
        <button type="button" class="gal__por-boton" :aria-pressed="por === 'tincion'" @click="emit('por', 'tincion')">{{ L('Por tinción', 'By stain') }}</button>
      </div>
    </div>
    <div ref="lista" class="gal__lista">
      <section v-for="g in grupos" :key="g.id" class="gal__grupo" :aria-labelledby="`gal-${g.id}`">
        <h2 :id="`gal-${g.id}`" class="gal__titulo">{{ tituloGrupo(g.id) }} <span class="gal__cuenta">· {{ g.laminillas.length }}</span></h2>
        <ul class="gal__items">
          <li v-for="l in g.laminillas" :key="l.id">
            <a
              :href="enlace(l.id)"
              class="gal__item"
              :class="{ 'gal__item--tambien': tambien.includes(l.id) }"
              :aria-current="l.id === activa ? 'true' : undefined"
              :aria-label="voz(l)"
              :data-l="l.id"
              @click.prevent="emit('elige', l.id)"
            >
              <img :src="l.miniatura" alt="" class="gal__mini" width="56" height="56" loading="lazy" decoding="async">
              <span class="gal__largo" aria-hidden="true">{{ largo(l) }}</span>
              <span class="gal__corto" aria-hidden="true">{{ corto(l) }}</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  </nav>
</template>

<style scoped>
.gal { display: flex; flex-direction: column; min-height: 0; height: 100%; background: var(--color-bg); }
.gal__cab { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; padding: 10px 12px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
.gal__n { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-soft); }
.gal__por { display: inline-flex; border: 1px solid var(--trazo-interactivo); border-radius: var(--radius-md); overflow: hidden; }
.gal__por-boton { min-height: 36px; padding: 0 10px; font: 600 var(--texto-xs) var(--font-body); color: var(--color-text); background: var(--color-bg-card); }
.gal__por-boton + .gal__por-boton { border-left: 1px solid var(--trazo-interactivo); }
.gal__por-boton[aria-pressed='true'] { background: var(--seleccionado-bg); text-decoration: underline; text-underline-offset: 3px; }
.gal__por-boton:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: -3px; }
.gal__lista { position: relative; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px 8px 12px; }
.gal__titulo { position: sticky; top: -4px; z-index: 1; margin: 0; padding: 10px 4px 4px; background: var(--color-bg);
  font-family: var(--font-mono); font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-soft); }
.gal__cuenta { font-weight: 400; }
.gal__items { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.gal__item { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 10px; padding: 4px 6px; border-radius: var(--radius-md);
  border: 1px solid transparent; color: var(--color-text); text-decoration: none; font-size: var(--texto-sm); line-height: 1.3; }
.gal__item[aria-current='true'] { background: var(--seleccionado-bg); border-color: var(--color-miriam); font-weight: 600; }
.gal__item--tambien:not([aria-current]) { border-color: var(--trazo-interactivo); border-style: dashed; }
.gal__item:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 1px; }
@media (hover: hover) and (pointer: fine) {
  .gal__item:not([aria-current]):hover { background: color-mix(in srgb, var(--seleccionado-bg) 55%, transparent); }
}
.gal__mini { width: 56px; height: 56px; object-fit: contain; background: #fff; border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent); }
.gal__corto { display: none; }

/* Móvil: tira deslizable bajo el visor, agrupada por muestra (el rótulo del grupo va delante). */
@media (max-width: 767px) {
  .gal { height: auto; border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
  .gal__cab { display: none; }
  .gal__lista { display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; padding: 6px 10px 8px; scroll-snap-type: x proximity; scrollbar-width: thin; }
  .gal__grupo { display: flex; align-items: flex-start; gap: 4px; flex: none; }
  .gal__titulo { position: static; writing-mode: vertical-rl; transform: rotate(180deg); padding: 2px 0; font-size: 11px; letter-spacing: .04em; max-height: 72px; overflow: hidden; }
  .gal__cuenta { display: none; }
  .gal__items { display: flex; gap: 4px; }
  .gal__item { grid-template-columns: 1fr; justify-items: center; gap: 2px; width: 64px; padding: 3px; font-size: 11px; text-align: center; scroll-snap-align: center; }
  .gal__mini { width: 52px; height: 52px; }
  .gal__largo { display: none; }
  .gal__corto { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
</style>
