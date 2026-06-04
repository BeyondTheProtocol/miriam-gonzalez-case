<template>
  <div>
    <section class="section-spacing" :aria-label="$t('team.title')">
      <div class="section-container">
        <PageHeader :title="$t('team.title')" :subtitle="$t('team.subtitle')" />

        <div class="card-base mb-12" style="border-left: 4px solid #a44db2">
          <p class="text-sm text-tinta leading-relaxed">
            {{ $t('team.how_it_formed') }}
          </p>
        </div>

        <h2 id="team-miriam" class="eyebrow mb-6 block">
          {{ $t('team.miriam_team') }}
        </h2>

        <ul aria-labelledby="team-miriam" class="grid sm:grid-cols-2 gap-4 mb-12 stagger-children">
          <li v-for="member in coreTeam" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>

        <h2 id="team-medical" class="eyebrow mb-6 block">
          {{ $t('team.medical_support_network') }}
        </h2>

        <ul aria-labelledby="team-medical" class="grid sm:grid-cols-2 gap-4 mb-12 stagger-children">
          <li v-for="member in medicalNetwork" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>

        <h2 id="team-integrative" class="eyebrow mb-6 block">
          {{ $t('team.integrative_support') }}
        </h2>

        <ul aria-labelledby="team-integrative" class="grid sm:grid-cols-2 gap-4 stagger-children">
          <li v-for="member in integrativeSupport" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, TeamEnCollectionItem } from '@nuxt/content'
const { locale, t } = useI18n()

const { data: teamData } = await useAsyncData(
  `team-data-${locale.value}`,
  () => {
    const collection = `team_${locale.value || 'en'}` as keyof Collections
    return queryCollection(
      collection
    ).first() as Promise<TeamEnCollectionItem | null>
  },
  { watch: [locale] }
)

const coreTeam = computed(() => teamData.value?.coreTeam ?? [])
const medicalNetwork = computed(() => teamData.value?.medicalNetwork ?? [])
const integrativeSupport = computed(
  () => teamData.value?.integrativeSupport ?? []
)

useSeoMeta({
  title: () => (locale.value === 'es' ? 'El equipo' : 'The team'),
  description: () =>
    locale.value === 'es'
      ? 'El equipo internacional que trabaja en el caso de Miriam: oncólogos, especialistas en FGFR1, investigadores de IA médica y colaboradores de 4 países.'
      : "The international team working on Miriam's case: oncologists, FGFR1 specialists, medical AI researchers, and collaborators from 4 countries.",
  ogTitle: () => (locale.value === 'es' ? 'El equipo' : 'The team'),
  ogDescription: () =>
    locale.value === 'es'
      ? 'Una paciente, un equipo internacional e inteligencia artificial.'
      : 'One patient, an international team, and artificial intelligence.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => (locale.value === 'es' ? 'El equipo' : 'The team'),
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Una paciente, un equipo internacional e inteligencia artificial.'
      : 'One patient, an international team, and artificial intelligence.',
})

defineOgImage('Default.takumi', {
  title: () => t('team.title'),
  description: () =>
    locale.value === 'es'
      ? 'Una paciente, un equipo internacional e IA.'
      : 'One patient, an international team, and AI.',
})
</script>
