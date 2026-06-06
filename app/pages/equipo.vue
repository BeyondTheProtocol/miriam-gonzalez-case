<template>
  <div>
    <section class="section-spacing" :aria-label="$t('team.title')">
      <div class="section-container">
        <PageHeader :title="$t('team.title')" :subtitle="$t('team.subtitle')" />

        <!-- El equipo de Miriam · retratos del círculo cercano (Miriam, primera) -->
        <h2 id="team-miriam" class="eyebrow mb-3 block">
          {{ $t('team.miriam_team') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed max-w-2xl mb-8">
          {{ $t('team.how_it_formed') }}
        </p>
        <ul
          aria-labelledby="team-miriam"
          class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-9 mb-16 stagger-children"
        >
          <li v-for="member in coreTeam" :key="member.name">
            <TeamPortrait :member="member" />
          </li>
        </ul>

        <!-- Red médica de apoyo · tarjetas de rol (anónimas) -->
        <h2 id="team-medical" class="eyebrow mb-6 block">
          {{ $t('team.medical_support_network') }}
        </h2>
        <ul
          aria-labelledby="team-medical"
          class="grid sm:grid-cols-2 gap-4 mb-14 stagger-children"
        >
          <li v-for="member in medicalNetwork" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>

        <!-- Apoyo integral · tarjetas de rol (anónimas) -->
        <h2 id="team-integrative" class="eyebrow mb-6 block">
          {{ $t('team.integrative_support') }}
        </h2>
        <ul
          aria-labelledby="team-integrative"
          class="grid sm:grid-cols-2 gap-4 stagger-children"
        >
          <li v-for="member in integrativeSupport" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>

        <!-- Red de origen · Beyond the Protocol (sección oscura sobria, estilo home) -->
        <section
          class="mt-16 relative overflow-hidden rounded-card p-8 sm:p-12"
          style="background: #2d1b3d; color: #faf6f0"
          :aria-label="$t('team.network_origin_title')"
        >
          <div
            aria-hidden="true"
            class="absolute inset-0 opacity-[0.04]"
            style="background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0); background-size: 32px 32px"
          />
          <div class="relative max-w-2xl">
            <p class="eyebrow mb-3 block" style="color: rgba(250,246,240,0.55)">
              {{ $t('team.network_origin_label') }}
            </p>
            <h2
              class="heading-display text-2xl sm:text-3xl mb-4"
              style="color: #faf6f0; letter-spacing: -0.02em"
            >
              {{ $t('team.network_origin_title') }}
            </h2>
            <p class="text-sm leading-relaxed" style="color: rgba(250,246,240,0.78)">
              {{ $t('team.network_origin_body') }}
            </p>
            <NuxtLink
              :to="localePath('colabora')"
              class="link-action group mt-6 text-sm text-cream"
            >
              {{ $t('team.network_origin_cta') }}
              <Icon
                name="ph:arrow-right"
                class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </section>
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

const localePath = useLocalePath()

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
