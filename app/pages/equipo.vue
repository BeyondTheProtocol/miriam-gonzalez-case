<template>
  <div>
    <section class="section-spacing" :aria-label="$t('team.title')">
      <div class="section-wide">
        <PageHeader :title="$t('team.title')" :subtitle="$t('team.subtitle')" />

        <!-- El equipo de Miriam · retratos del círculo cercano (Miriam, primera) -->
        <h2 id="team-miriam" class="eyebrow mb-3 block">
          {{ $t('team.miriam_team') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed measure mb-8">
          {{ $t('team.how_it_formed') }}
        </p>
        <ul
          aria-labelledby="team-miriam"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9 mb-16 stagger-children"
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
          class="grid sm:grid-cols-2 gap-4 mb-16 stagger-children"
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
      </div>
    </section>

    <!-- Cierre (T3-LOTE2, A20, 25-oct-2026). Antes: una caja oscura redondeada con hex en línea, dentro del contenedor y a un paso del pie. Ahora: «Lo que NO
         somos» es la banda oscura de la página (a sangre, con los roles de color de la Banda: ni un hex) y «Beyond the Protocol» pasa a una banda tarjeta
         propia, DESPUÉS. Es lo que evita lo que el sistema prohíbe (DESIGN-SYSTEM §3): una banda oscura pegada a la de logos del pie, que también es
         berenjena. Las cadenas, su orden y los niveles de titular son los de antes. -->
    <Banda tono="oscura" titular="notus-title">
      <p class="eyebrow mb-3 block">
        {{ $t('team.notus_eyebrow') }}
      </p>
      <h2 id="notus-title" class="heading-display text-2xl sm:text-3xl mb-6">
        {{ $t('team.notus_title') }}
      </h2>

      <ul class="grid gap-x-10 lg:gap-x-16 gap-y-4 lg:grid-cols-2">
        <li
          v-for="(item, i) in notUsItems"
          :key="i"
          class="flex items-start gap-3.5 text-sm leading-relaxed"
          :class="{ 'lg:col-span-2': i === notUsItems.length - 1 && notUsItems.length % 2 === 1 }"
        >
          <span class="notus__marca shrink-0 mt-[11px] h-[2px] w-3.5 rounded-full" aria-hidden="true" />
          <span class="measure notus__texto"
            ><strong class="font-semibold notus__lead">{{ item.lead }}</strong
            >{{ item.rest ? ' ' + item.rest : '' }}</span
          >
        </li>
      </ul>
    </Banda>

    <!-- Beyond the Protocol · próximamente + cómo ayudar -->
    <Banda tono="tarjeta" compacta titular="network-origin-title">
      <p class="eyebrow mb-2 block">
        {{ $t('team.network_origin_label') }}
      </p>
      <h3 id="network-origin-title" class="heading-display text-xl sm:text-2xl mb-3">
        {{ $t('team.network_origin_title') }}
      </h3>
      <p class="text-sm text-tinta leading-relaxed measure">
        {{ $t('team.network_origin_body') }}
      </p>
      <NuxtLink :to="localePath('colabora')" class="link-action group mt-5 text-sm text-miriam">
        {{ $t('team.network_origin_cta') }}
        <Icon
          name="ph:arrow-right"
          class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </NuxtLink>
    </Banda>
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

// "Lo que NO somos": separa la frase-tesis de su explicación para destacarla en
// negrita y sustituir el muro de iconos ✗ repetidos por jerarquía tipográfica.
const notUsItems = computed(() =>
  notUsList.value.map((s) => {
    const idx = s.indexOf('. ')
    return idx === -1
      ? { lead: s, rest: '' }
      : { lead: s.slice(0, idx + 1), rest: s.slice(idx + 2) }
  })
)

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
      ? 'Una ingeniera, un equipo internacional e inteligencia artificial.'
      : 'An engineer, an international team, and artificial intelligence.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => (locale.value === 'es' ? 'El equipo' : 'The team'),
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Una ingeniera, un equipo internacional e inteligencia artificial.'
      : 'An engineer, an international team, and artificial intelligence.',
})

defineOgImage('Default.takumi', {
  title: () => t('team.title'),
  description: () =>
    locale.value === 'es'
      ? 'Una ingeniera, un equipo internacional e IA.'
      : 'An engineer, an international team, and AI.',
})
</script>

<style scoped>
/* «Lo que NO somos» (banda oscura): colores por rol, así que se invierten solos con la Banda (antes: crema y coral en hex y rgba escritos a mano). */
.notus__marca { background: color-mix(in srgb, var(--color-cta) 70%, transparent); } /* el guion coral decorativo de siempre, derivado del átomo */
.notus__texto { color: var(--texto-2); }
.notus__lead { color: var(--texto-1); }
</style>
