<template>
  <section
    v-reveal
    class="pathways"
    :class="variant === 'home' ? 'bg-cream-card section-spacing' : ''"
    :aria-labelledby="titleId"
    :style="variant === 'colabora' ? '' : 'border-bottom: 1px solid rgba(45,27,61,0.08)'"
  >
    <div :class="variant === 'home' ? 'section-wide' : ''">
      <p class="eyebrow mb-3 block">{{ $t('pathways.eyebrow') }}</p>
      <h2
        :id="titleId"
        class="heading-display text-2xl sm:text-3xl text-berenjena mb-2"
        style="letter-spacing: -0.02em"
      >
        {{ variant === 'home' ? $t('pathways.home_title') : $t('pathways.colabora_title') }}
      </h2>
      <p class="text-sm sm:text-base text-tinta leading-relaxed max-w-2xl mb-3">
        {{ variant === 'home' ? $t('pathways.home_sub') : $t('pathways.colabora_sub') }}
      </p>
      <p class="pathway-comfort max-w-2xl" role="note">
        <Icon name="ph:leaf" class="pathway-comfort__icon" aria-hidden="true" />
        {{ $t('pathways.comfort') }}
      </p>

      <!-- Home: tarjetas por persona -->
      <div
        v-if="variant === 'home'"
        class="pathway-grid mt-8"
        role="list"
        :aria-label="$t('pathways.grid_aria')"
      >
        <article
          v-for="path in homePaths"
          :key="path.id"
          class="pathway-card"
          role="listitem"
        >
          <div class="pathway-card__head">
            <span class="pathway-card__icon" aria-hidden="true">
              <Icon :name="path.icon" class="w-5 h-5" />
            </span>
            <span class="pathway-card__time">{{ path.time }}</span>
          </div>
          <h3 class="pathway-card__title">{{ path.title }}</h3>
          <p class="pathway-card__desc">{{ path.desc }}</p>
          <ol class="pathway-card__steps" :aria-label="path.stepsAria">
            <li v-for="(step, i) in path.steps" :key="i">{{ step }}</li>
          </ol>
          <div class="pathway-card__cta">
            <component
              :is="path.as ?? (path.external ? 'a' : 'NuxtLink')"
              v-bind="path.linkProps"
              :class="path.primary ? 'btn-cta w-full justify-center' : 'btn-secondary w-full justify-center'"
              :style="path.external ? 'text-decoration: none' : undefined"
              @click="path.onClick?.()"
            >
              <Icon v-if="path.ctaIcon" :name="path.ctaIcon" class="w-4 h-4" aria-hidden="true" />
              {{ path.cta }}
              <span v-if="path.external" class="sr-only"> {{ $t('a11y.new_tab') }}</span>
            </component>
            <p v-if="path.caption" class="pathway-card__caption">{{ path.caption }}</p>
          </div>
        </article>
      </div>

      <!-- Colabora: chips de salto a cada perfil -->
      <nav
        v-else
        class="pathway-chips mt-6"
        :aria-label="$t('pathways.chips_aria')"
      >
        <a
          v-for="chip in colaboraChips"
          :key="chip.id"
          :href="chip.hash"
          class="pathway-chip"
          @click="scrollTo(chip.hash)"
        >
          <Icon :name="chip.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
          <span class="pathway-chip__label">{{ chip.label }}</span>
          <span class="pathway-chip__time">{{ chip.time }}</span>
        </a>
      </nav>

      <!-- Resumen de 2 minutos (home): progressive disclosure, sin presión -->
      <details v-if="variant === 'home'" id="pathway-brief" class="pathway-brief mt-10 max-w-3xl">
        <summary class="pathway-brief__summary">
          <Icon name="ph:book-open-text" class="w-4 h-4 shrink-0 text-miriam" aria-hidden="true" />
          {{ $t('pathways.brief_toggle') }}
          <span class="pathway-brief__badge">{{ $t('pathways.brief_time') }}</span>
        </summary>
        <div class="pathway-brief__body card-base bg-cream mt-3">
          <p class="font-display font-semibold text-berenjena text-lg mb-4">
            {{ $t('pathways.brief_heading') }}
          </p>
          <ol class="pathway-brief__list">
            <li v-for="(item, i) in briefPoints" :key="i">
              <span class="pathway-brief__num" aria-hidden="true">{{ i + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ol>
          <p class="text-sm text-tinta mt-5 leading-relaxed">{{ $t('pathways.brief_outro') }}</p>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <NuxtLink :to="localePath({ name: 'ciencia' })" class="btn-secondary w-full sm:w-auto justify-center">
              <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
              {{ $t('pathways.brief_cta_science') }}
            </NuxtLink>
            <NuxtLink :to="localePath('colabora')" class="btn-ghost w-full sm:w-auto justify-center">
              {{ $t('pathways.brief_cta_help') }}
              <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ variant?: 'home' | 'colabora' }>(),
  { variant: 'home' }
)

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport } = useSupport()

const titleId = computed(() => `pathways-title-${props.variant}`)

function arr(key: string): string[] {
  const raw = tm(key) as unknown
  const list = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as Record<string, unknown>)
  return list.map((item) => rt(item as never))
}

const briefPoints = computed(() => arr('pathways.brief_points'))

interface HomePath {
  id: string
  icon: string
  time: string
  title: string
  desc: string
  steps: string[]
  stepsAria: string
  cta: string
  ctaIcon?: string
  caption?: string
  primary?: boolean
  external?: boolean
  linkProps: Record<string, string>
  as?: 'a' | 'NuxtLink'
  onClick?: () => void
}

const homePaths = computed<HomePath[]>(() => [
  {
    id: 'supporter',
    icon: 'ph:heart-fill',
    time: t('pathways.time_1'),
    title: t('pathways.supporter_title'),
    desc: t('pathways.supporter_desc'),
    steps: arr('pathways.supporter_steps'),
    stepsAria: t('pathways.supporter_steps_aria'),
    cta: t('pathways.supporter_cta'),
    ctaIcon: 'ph:heart-fill',
    caption: t('pathways.supporter_caption'),
    primary: true,
    external: true,
    linkProps: { href: GOFUNDME_URL, target: '_blank', rel: 'noopener noreferrer', 'data-support-cta': '' },
    onClick: () => trackSupport('pathway_supporter'),
  },
  {
    id: 'curious',
    icon: 'ph:compass',
    time: t('pathways.time_3'),
    title: t('pathways.curious_title'),
    desc: t('pathways.curious_desc'),
    steps: arr('pathways.curious_steps'),
    stepsAria: t('pathways.curious_steps_aria'),
    cta: t('pathways.curious_cta'),
    ctaIcon: 'ph:book-open-text',
    caption: t('pathways.curious_caption'),
    as: 'a',
    linkProps: { href: '#pathway-brief' },
    onClick: () => {
      const el = document.getElementById('pathway-brief')
      if (el && el.tagName === 'DETAILS') (el as HTMLDetailsElement).open = true
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  },
  {
    id: 'clinician',
    icon: 'ph:stethoscope',
    time: t('pathways.time_6'),
    title: t('pathways.clinician_title'),
    desc: t('pathways.clinician_desc'),
    steps: arr('pathways.clinician_steps'),
    stepsAria: t('pathways.clinician_steps_aria'),
    cta: t('pathways.clinician_cta'),
    ctaIcon: 'ph:flask-fill',
    caption: t('pathways.clinician_caption'),
    linkProps: { to: localePath({ name: 'ciencia' }) + '?nivel=pro' },
  },
  {
    id: 'press',
    icon: 'ph:megaphone-simple-fill',
    time: t('pathways.time_4'),
    title: t('pathways.press_title'),
    desc: t('pathways.press_desc'),
    steps: arr('pathways.press_steps'),
    stepsAria: t('pathways.press_steps_aria'),
    cta: t('pathways.press_cta'),
    ctaIcon: 'ph:megaphone-simple-fill',
    caption: t('pathways.press_caption'),
    linkProps: { to: localePath('prensa') },
  },
  {
    id: 'tech',
    icon: 'ph:code',
    time: t('pathways.time_5'),
    title: t('pathways.tech_title'),
    desc: t('pathways.tech_desc'),
    steps: arr('pathways.tech_steps'),
    stepsAria: t('pathways.tech_steps_aria'),
    cta: t('pathways.tech_cta'),
    ctaIcon: 'ph:envelope-simple-fill',
    caption: t('pathways.tech_caption'),
    linkProps: { to: localePath('contacto') + '?role=tech' },
  },
  {
    id: 'peer',
    icon: 'ph:hands-praying-fill',
    time: t('pathways.time_2'),
    title: t('pathways.peer_title'),
    desc: t('pathways.peer_desc'),
    steps: arr('pathways.peer_steps'),
    stepsAria: t('pathways.peer_steps_aria'),
    cta: t('pathways.peer_cta'),
    ctaIcon: 'ph:envelope-simple-fill',
    caption: t('pathways.peer_caption'),
    linkProps: { to: localePath('contacto') + '?role=patient' },
  },
])

interface ColaboraChip {
  id: string
  hash: string
  icon: string
  label: string
  time: string
}

const colaboraChips = computed<ColaboraChip[]>(() => [
  { id: 'clinical', hash: '#revision-clinica', icon: 'ph:stethoscope', label: t('pathways.chip_clinical'), time: t('pathways.time_5') },
  { id: 'press', hash: '#alcance', icon: 'ph:megaphone-simple-fill', label: t('pathways.chip_press'), time: t('pathways.time_3') },
  { id: 'tech', hash: '#tech-ia', icon: 'ph:code', label: t('pathways.chip_tech'), time: t('pathways.time_4') },
  { id: 'peer', hash: '#apoyo-mutuo', icon: 'ph:hands-praying-fill', label: t('pathways.chip_peer'), time: t('pathways.time_2') },
  { id: 'donate', hash: '#financiar', icon: 'ph:hand-heart-fill', label: t('pathways.chip_donate'), time: t('pathways.time_1') },
])

function scrollTo(hash: string) {
  const id = hash.replace('#', '')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>