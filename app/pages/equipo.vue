<template>
  <div>
    <section class="section-spacing" :aria-label="$t('team.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('team.title')"
          :subtitle="$t('team.subtitle')"
        />

        <div class="card-base mb-12 border-l-4 border-l-gold-400">
          <p class="text-sm text-ink-700 leading-relaxed">
            {{ $t('team.how_it_formed') }}
          </p>
        </div>

        <h3 class="font-display font-semibold text-ink-800 text-sm uppercase tracking-wider mb-6">
          {{ $t('team.miriam_team') }}
        </h3>

        <div class="grid sm:grid-cols-2 gap-4 mb-12 stagger-children">
          <TeamCard
            v-for="member in coreTeam"
            :key="member.role"
            :member="member"
          />
        </div>

        <h3 class="font-display font-semibold text-ink-800 text-sm uppercase tracking-wider mb-6">
          {{ $t('team.medical_support_network') }}
        </h3>

        <div class="grid sm:grid-cols-2 gap-4 mb-12 stagger-children">
          <TeamCard
            v-for="member in medicalNetwork"
            :key="member.role"
            :member="member"
          />
        </div>

        <h3 class="font-display font-semibold text-ink-800 text-sm uppercase tracking-wider mb-6">
          {{ $t('team.integrative_support') }}
        </h3>

        <div class="grid sm:grid-cols-2 gap-4 stagger-children">
          <TeamCard
            v-for="member in integrativeSupport"
            :key="member.role"
            :member="member"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, TeamEnCollectionItem } from '@nuxt/content'
const { locale } = useI18n()

const { data: teamData } = await useAsyncData(`team-data-${locale.value}`, () => {
  const collection = `team_${locale.value || 'en'}` as keyof Collections
  return queryCollection(collection).first() as Promise<TeamEnCollectionItem | null>
}, { watch: [locale] })

const coreTeam = computed(() => teamData.value?.coreTeam ?? [])
const medicalNetwork = computed(() => teamData.value?.medicalNetwork ?? [])
const integrativeSupport = computed(() => teamData.value?.integrativeSupport ?? [])

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'El equipo — Miriam González'
    : 'The Team — Miriam González',
  description: () => locale.value === 'es'
    ? 'El equipo internacional que trabaja en el caso de Miriam: oncólogos, especialistas en FGFR1, investigadores de IA médica y colaboradores de 4 países.'
    : 'The international team working on Miriam\'s case: oncologists, FGFR1 specialists, medical AI researchers, and collaborators from 4 countries.',
  ogTitle: () => locale.value === 'es'
    ? 'El equipo — Miriam González'
    : 'The Team — Miriam González',
  ogType: 'website',
  twitterCard: 'summary',
})
</script>
