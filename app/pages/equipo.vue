<template>
  <div>
    <section class="section-spacing" :aria-label="$t('team.title')">
      <div class="section-wide">
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
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14 stagger-children"
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
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children"
        >
          <li v-for="member in integrativeSupport" :key="member.role">
            <TeamCard :member="member" />
          </li>
        </ul>

        <!-- Cierre · "Lo que NO somos" (honestidad operativa) + Beyond the
             Protocol (próximamente) + cómo ayudar. Panel oscuro sobrio.
             D5: contenido a max-w-4xl (alineado a la izquierda del shell) para
             que el panel no quede con un hueco grande a la derecha a 1200px. -->
        <section
          class="mt-16 relative overflow-hidden rounded-card p-8 sm:p-12 max-w-4xl"
          style="background: #2d1b3d; color: #faf6f0"
          :aria-labelledby="'notus-title'"
        >
          <div
            aria-hidden="true"
            class="absolute inset-0 opacity-[0.04]"
            style="background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0); background-size: 32px 32px"
          />
          <div class="relative max-w-2xl">
            <p class="eyebrow mb-3 block" style="color: rgba(250,246,240,0.55)">
              {{ $t('team.notus_eyebrow') }}
            </p>
            <h2
              id="notus-title"
              class="heading-display text-2xl sm:text-3xl mb-6"
              style="color: #faf6f0; letter-spacing: -0.02em"
            >
              {{ $t('team.notus_title') }}
            </h2>

            <ul class="space-y-4">
              <li
                v-for="(item, i) in notUsList"
                :key="i"
                class="flex items-start gap-4 text-[15px] leading-relaxed"
                style="color: rgba(250,246,240,0.9)"
              >
                <span
                  class="shrink-0 mt-0.5 inline-flex items-center justify-center w-[22px] h-[22px] rounded-md"
                  style="background: rgba(255,107,71,0.18)"
                  aria-hidden="true"
                >
                  <Icon name="ph:x-bold" class="w-3.5 h-3.5 text-coral" />
                </span>
                <span>{{ item }}</span>
              </li>
            </ul>

            <!-- Beyond the Protocol · próximamente + cómo ayudar -->
            <div class="mt-8 pt-6" style="border-top: 1px solid rgba(250,246,240,0.15)">
              <p class="eyebrow mb-2 block" style="color: rgba(250,246,240,0.55)">
                {{ $t('team.network_origin_label') }}
              </p>
              <h3
                class="heading-display text-xl sm:text-2xl mb-3"
                style="color: #faf6f0; letter-spacing: -0.02em"
              >
                {{ $t('team.network_origin_title') }}
              </h3>
              <p class="text-sm leading-relaxed" style="color: rgba(250,246,240,0.78)">
                {{ $t('team.network_origin_body') }}
              </p>
              <NuxtLink
                :to="localePath('colabora')"
                class="link-action group mt-5 text-sm text-cream"
              >
                {{ $t('team.network_origin_cta') }}
                <Icon
                  name="ph:arrow-right"
                  class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections, TeamEnCollectionItem } from '@nuxt/content'
const { locale, t, tm, rt } = useI18n()

// Lista "Lo que NO somos" (array i18n) — mismo helper que /colabora.
function arr(key: string): string[] {
  const raw = tm(key) as unknown
  const list = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as Record<string, unknown>)
  return list.map((item) => rt(item as never))
}
const notUsList = computed(() => arr('team.notus_list'))

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
      ? 'El equipo que acompaña a Miriam: medicina, investigación, IA y una red internacional para que la biología del tumor guíe el tratamiento.'
      : "The team supporting Miriam: medicine, research, AI and an international network so the tumor's biology guides the treatment.",
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
