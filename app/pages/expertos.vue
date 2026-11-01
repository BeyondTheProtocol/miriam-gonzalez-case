<template>
  <section class="section-spacing" :aria-label="$t('expertos.titulo')">
    <div class="section-wide">
      <!-- Una sola columna a la medida de lectura, a todos los anchos: la página tiene una sola acción y a 1280 la rejilla de /contacto dejaría media pantalla vacía.
           `!mb-6`: la entradilla acaba en dos puntos y tiene que quedar pegada al formulario. -->
      <div class="measure">
        <PageHeader
          variante="pagina"
          class="!mb-6"
          :title="$t('expertos.titulo')"
          :lede="$t('expertos.peticion')"
        />

        <FormularioContacto v-model:rol="rol" origen="expertos" />

        <p class="mt-8 text-tinta leading-relaxed">
          {{ $t('expertos.conoces') }}
        </p>

        <!-- Nota al margen sin caja, como CampanaOficial: la misma frase de su aviso, sin el enlace. La medida va en cada <p>: la letra es más pequeña que la del contenedor. -->
        <div class="mt-6 pt-6 border-t space-y-3 text-sm text-tinta leading-relaxed">
          <p class="measure">{{ $t('expertos.aviso') }}</p>
          <p class="measure">{{ $t('campanaOficial.otras') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

// El perfil va fijo de entrada, no por `?role=`: la query llega después de hidratar y el HTML generado saldría con «Selecciona…».
// «Personal de investigación» y no «Profesional de oncología»: la petición cubre también a quien trabaja con neoantígenos. Se puede cambiar en el selector.
const rol = ref<string>('researcher')

useSeoMeta({
  title: () => t('expertos.meta_title'),
  description: () => t('expertos.meta_description'),
  ogTitle: () => t('expertos.meta_title'),
  ogDescription: () => t('expertos.meta_description'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('expertos.meta_title'),
  twitterDescription: () => t('expertos.meta_description'),
  robots: 'noindex',
})

defineOgImage('Default.takumi', {
  title: () => t('expertos.meta_title'),
  description: () => t('expertos.meta_description'),
})
</script>
