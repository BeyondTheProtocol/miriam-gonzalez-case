<template>
  <!--
    Chips "por perfil" (propuesta 4 del comité, 26-sep-2026): antes vivían
    solo dentro de VisitorPathways.vue (variant="colabora"), como salto de
    ancla a las 5 tarjetas de /colabora. Se extraen aquí para reusarlos TAL
    CUAL (misma copy, mismos iconos, mismo orden) también en el footer global
    (SiteFooter.vue). Desde cualquier página que no sea /colabora, el chip
    navega a /colabora#<hash>; desde la propia /colabora, hace scroll suave
    en la página (comportamiento idéntico al de antes).
  -->
  <nav class="pathway-chips" :aria-label="$t('pathways.chips_aria')">
    <NuxtLink
      v-for="chip in chips"
      :key="chip.id"
      :to="chip.to"
      class="pathway-chip"
      @click="onClick(chip)"
    >
      <Icon :name="chip.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
      <span class="pathway-chip__label">{{ chip.label }}</span>
      <span class="pathway-chip__time">{{ chip.time }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { trackPathway } = useSupport()

const colaboraPath = computed(() => (localePath('colabora') as string).replace(/\/+$/, '') || '/')
const onColaboraPage = computed(() => (route.path.replace(/\/+$/, '') || '/') === colaboraPath.value)

interface ProfileChip {
  id: string
  hash: string
  icon: string
  label: string
  time: string
}

// Copia literal de los 5 perfiles ya existentes en /colabora (mismas claves
// i18n, mismos iconos, mismo orden) — cero copy nuevo.
const chipDefs = computed<ProfileChip[]>(() => [
  { id: 'clinical', hash: '#revision-clinica', icon: 'ph:stethoscope', label: t('pathways.chip_clinical'), time: t('pathways.time_5') },
  { id: 'press', hash: '#alcance', icon: 'ph:megaphone-simple-fill', label: t('pathways.chip_press'), time: t('pathways.time_3') },
  { id: 'tech', hash: '#tech-ia', icon: 'ph:code', label: t('pathways.chip_tech'), time: t('pathways.time_4') },
  { id: 'peer', hash: '#apoyo-mutuo', icon: 'ph:hands-praying-fill', label: t('pathways.chip_peer'), time: t('pathways.time_2') },
  { id: 'donate', hash: '#financiar', icon: 'ph:hand-heart-fill', label: t('pathways.chip_donate'), time: t('pathways.time_1') },
])

const chips = computed(() =>
  chipDefs.value.map((c) => ({ ...c, to: onColaboraPage.value ? c.hash : colaboraPath.value + c.hash }))
)

function onClick(chip: ProfileChip) {
  if (onColaboraPage.value) {
    const el = document.getElementById(chip.hash.replace('#', ''))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  trackPathway(chip.id)
}
</script>
