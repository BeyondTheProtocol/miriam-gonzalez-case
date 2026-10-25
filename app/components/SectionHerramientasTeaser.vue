<script setup lang="ts">
/**
 * Banda de herramientas de la home (tanda 2 del rediseño de arquitectura, T2a, 24-oct-2026): el bloque 3, justo debajo de la prensa.
 * La prensa dice «construye con IA» y esta banda lo enseña. Es el patrón del SectionHerramientasTeaser que F5 borró (la home de 7
 * bloques lo dejó fuera), restaurado porque Umami lo desmintió: sus clics (`home_teaser`) fueron 511 de los 540 `VerLesiones`, el 8,7 %
 * de los visitantes de la home, más que el botón «Apoyar» del hero (7,7 %) en el mismo periodo.
 *
 * Forma: una tarjeta destacada (LO_ULTIMO, hoy «Célula a célula», con la etiqueta «Lo último»), debajo el resto de HERRAMIENTAS en
 * filas de ≥ 64 px (la fila entera es el enlace) y, al final, «Todas las herramientas». Sin carrusel. Las dos pasadas (el mapa y el
 * reservorio) no salen aquí: están en el índice. El explorador solo con su puerta abierta (useHerramientas).
 *
 * Copy: el título y la descripción de la destacada son LITERALES, los de su página (COPY_HERRAMIENTAS). Nuevo, para voz-miriam: la frase
 * de apertura (herramientas.apertura) y las etiquetas «Para…» (herramientas.para_*). Las filas llevan solo el título y la etiqueta.
 *
 * Origen en Umami: `home_teaser`, el mismo del teaser que desapareció, para que las series se puedan comparar (se mezclan, y se anota).
 * Se monta con las piezas del sistema v3: Banda, CabeceraSeccion y TarjetaEnlace.
 */
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackHerramienta } = useSupport()
const { herramientas } = useHerramientas()

const tarjetas = computed(() =>
  herramientas.value.map((h) => {
    const [titulo, descripcion] = copyHerramienta(h.key, locale.value)
    return { ...h, titulo, descripcion, icono: ICONO_HERRAMIENTA[h.key] ?? 'ph:wrench-fill', etiqueta: PARA_HERRAMIENTA[h.key] ? t(PARA_HERRAMIENTA[h.key]!) : undefined }
  }),
)
// Si LO_ULTIMO estuviera oculta (puerta cerrada), se destaca la primera de la lista.
const destacada = computed(() => tarjetas.value.find((x) => x.key === LO_ULTIMO.key) ?? tarjetas.value[0]!)
const resto = computed(() => tarjetas.value.filter((x) => x.key !== destacada.value.key))

const medir = (key: string) => trackHerramienta(key, 'home_teaser')
</script>

<template>
  <Banda tono="crema" titular="h-herramientas" compacta>
    <CabeceraSeccion
      id="h-herramientas"
      :eyebrow="$t('herramientas.eyebrow')"
      :titulo="$t('herramientas.title')"
      :lede="$t('herramientas.apertura')"
    />

    <TarjetaEnlace
      :to="localePath({ name: destacada.name })"
      :titulo="destacada.titulo"
      :meta="destacada.descripcion"
      :icono="destacada.icono"
      :nivel="destacada.etiqueta"
      tono="destacada"
      class="teaser-destacada"
      @click="medir(destacada.key)"
    >
      <template #preview><span class="etiqueta">{{ $t('home.tools_new') }}</span></template>
    </TarjetaEnlace>

    <ul class="teaser-filas" role="list">
      <li v-for="h in resto" :key="h.key">
        <TarjetaEnlace :to="localePath({ name: h.name })" :titulo="h.titulo" :icono="h.icono" :nivel="h.etiqueta" @click="medir(h.key)" />
      </li>
    </ul>

    <NuxtLink :to="localePath('herramientas')" class="link-action group teaser-todas">
      {{ $t('nav.all_tools') }}
      <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </NuxtLink>
  </Banda>
</template>

<style scoped>
.teaser-destacada { height: auto; }
.teaser-filas { list-style: none; margin: var(--sp-24) 0 0; padding: 0; display: grid; gap: var(--sp-12); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) { .teaser-filas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1280px) { .teaser-filas { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.teaser-filas > li { display: flex; }
.teaser-filas > li > * { width: 100%; }
.teaser-todas { margin-top: var(--sp-16); }
</style>
