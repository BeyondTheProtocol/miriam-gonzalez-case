<template>
  <!-- «Actualizado el …» con la voz de Nota (✱): lo que antes decía el pie para TODO el sitio, ahora lo dice cada página
       que tiene una fecha fiable. Sin fecha válida no pinta nada: una fecha inventada es peor que ninguna. -->
  <Nota v-if="dia">
    <i18n-t :keypath="clave" scope="global">
      <template #date>
        <time :datetime="dia">{{ texto }}</time>
      </template>
    </i18n-t>
  </Nota>
</template>

<script setup lang="ts">
/**
 * Fecha de actualización de UNA página (rediseño de arquitectura, F3, 23-oct-2026).
 *
 * `fecha` es AAAA-MM-DD y viene del código o de los datos de esa página (caso.json en /datos, caseData.pressAsOf en
 * /prensa), nunca del build: el día del último commit del sitio entero decía «actualizado» de páginas que no habían
 * cambiado. Cualquier otra cosa (vacía, con hora, imposible) no se pinta.
 *
 * `clave` es la frase i18n con `{date}`: por defecto `page.updated` («Actualizado el {date}»); /prensa conserva la suya
 * («Sala de prensa revisada el {date}»). Como mucho una por página, en el primer punto de necesidad (ver Nota.vue).
 */
const props = withDefaults(defineProps<{ fecha?: string | null; clave?: string }>(), { fecha: null, clave: 'page.updated' })

const { locale } = useI18n()
const valida = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(props.fecha ?? ''))
const dia = computed(() => (valida.value ? diaCambio(props.fecha!) : ''))
const texto = computed(() => (valida.value ? formatearFechaCambio(props.fecha!, locale.value) : ''))
</script>
