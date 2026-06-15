<template>
  <div>
    <SectionHero />

    <VisitorPathways variant="home" />

    <!-- La historia + en sus propias palabras (beat humano: persona antes que problema) -->
    <section v-reveal class="py-24 sm:py-32 relative overflow-hidden" :aria-label="$t('home.story_eyebrow')" style="background: #2d1b3d; color: #faf6f0">
      <div class="absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0); background-size: 32px 32px;" />
      <div class="relative section-container max-w-4xl">
        <p class="eyebrow block" style="color: #e8d4ed">
          {{ $t('home.story_eyebrow') }}
        </p>
        <h2 class="heading-display text-3xl sm:text-4xl mt-4 mb-6" style="color: #faf6f0; letter-spacing: -0.03em">
          {{ $t('home.story_heading') }}
        </h2>
        <p class="text-base sm:text-lg leading-relaxed max-w-2xl" style="color: rgba(250,246,240,0.92)">
          {{ $t('home.story_p1')
          }}<strong class="font-semibold text-cream">{{ $t('home.story_p1_rarity') }}</strong>{{ $t('home.story_p1_tail') }}
        </p>
        <!-- Cita verificable de la rareza: que nadie pueda decir que es inventada. -->
        <p class="mt-2.5 font-mono text-xs" style="color: rgba(250,246,240,0.5)">
          <a
            href="https://doi.org/10.21037/tcr-23-368"
            target="_blank"
            rel="noopener"
            class="underline underline-offset-2 decoration-cream/25 transition-colors hover:text-cream/85"
          >
            {{ $t('home.story_p1_source') }}
          </a>
        </p>
        <!-- Atenuado mientras /historia esté en preparación: no manda tráfico
             "fuerte" a una página aún provisional (la nota ya enlaza redes + La ciencia). -->
        <NuxtLink
          :to="localePath({ name: 'historia' })"
          class="link-action group mt-7 text-sm text-cream/55"
        >
          {{ $t('home.story_link') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>

        <!-- En sus propias palabras -->
        <div class="mt-14 pt-12" style="border-top: 1px solid rgba(250,246,240,0.15)">
          <p class="eyebrow mb-8 block" style="color: #e8d4ed">
            {{ $t('home.s6_eyebrow') }}
          </p>
          <!-- Las comillas en dos tonos —coral y violeta— son el guiño a las
               «dos caras» del tumor de las que habla la cita. Decorativo. -->
          <blockquote class="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.2] max-w-3xl" style="letter-spacing: -0.025em">
            <span style="color: #ff6b47">«</span>{{ $t('home.s6_quote') }}<span style="color: #b870c3">»</span>
          </blockquote>
          <p class="mt-8 font-display italic text-xl" style="color: #e8d4ed">
            — {{ $t('home.s6_signature') }}
          </p>
        </div>
      </div>
    </section>

    <!-- S3 · Por qué no lo cubre la sanidad pública (brecha clínica · respuesta principal) -->
    <section v-reveal
      class="section-spacing bg-cream-card"
      :aria-label="$t('home.s3_eyebrow')"
      style="border-top: 1px solid rgba(45,27,61,0.08); border-bottom: 1px solid rgba(45,27,61,0.08)"
    >
      <div class="section-container max-w-5xl">
        <p class="eyebrow mb-4 block">{{ $t('home.s3_eyebrow') }}</p>
        <h2 class="heading-display text-3xl sm:text-5xl text-berenjena mb-4" style="letter-spacing: -0.03em">
          {{ $t('home.s3_heading') }}
        </h2>
        <p class="text-lg sm:text-xl text-berenjena font-medium mb-6 max-w-2xl font-display italic" style="line-height: 1.45">
          {{ $t('home.s3_subheading') }}
        </p>
        <!-- Resumen en lenguaje llano (DS §13): el detalle molecular y el
             hallazgo PET viven en /ciencia; aquí solo la idea. -->
        <i18n-t
          keypath="home.s3_summary"
          tag="p"
          class="text-base text-tinta leading-relaxed max-w-2xl"
        >
          <template #luminal><Term id="luminal" /></template>
          <template #neuroendocrino><Term id="neuroendocrino" /></template>
        </i18n-t>
        <Nota icon="tap" class="mt-3">{{ $t('glossary.hint') }}</Nota>

        <!-- "Lo que existe / lo que falta" · dos paneles (mobile-first: apilan
             en móvil, lado a lado en sm+). Lo cubierto queda sereno; lo que falta
             se eleva con filete violeta (patrón callout del DS). -->
        <h3 class="font-display font-semibold text-berenjena text-xl mt-12 mb-5">
          {{ $t('home.s3_table_title') }}
        </h3>
        <!-- Comparación alineada fila a fila: cada par antitético queda enfrentado
             (✓ cubierto · ✗ falta). En móvil el par se apila junto; en sm+ va
             lado a lado con divisor central. El símbolo —no solo el color— comunica
             la oposición; el lado "falta" pesa por marcador coral + texto más firme. -->
        <div class="card-base p-0 overflow-hidden">
          <!-- DESKTOP (sm+): comparación lado a lado, fila a fila -->
          <div class="hidden sm:block">
            <div class="grid grid-cols-2">
              <p
                class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta px-6 py-4"
                style="border-bottom: 1px solid rgba(45,27,61,0.10)"
              >
                {{ $t('home.s3_col_has') }}
              </p>
              <p
                class="font-mono uppercase text-[11px] tracking-[0.1em] text-berenjena px-6 py-4"
                style="border-bottom: 1px solid rgba(45,27,61,0.10); border-left: 1px solid rgba(45,27,61,0.08); background: rgba(255,107,71,0.04)"
              >
                {{ $t('home.s3_col_missing') }}
              </p>
            </div>
            <div
              v-for="(row, i) in s3Rows"
              :key="i"
              class="grid grid-cols-2 items-stretch"
            >
              <div
                class="flex items-start gap-3 px-6 py-4"
                :class="i > 0 ? 'border-t border-berenjena/[0.07]' : ''"
              >
                <span
                  class="mt-0.5 shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] bg-miriam-soft"
                  aria-hidden="true"
                >
                  <Icon name="ph:check-bold" class="w-3 h-3 text-berenjena" />
                </span>
                <span class="text-sm text-tinta leading-relaxed">{{ row[0] }}</span>
              </div>
              <div
                class="flex items-start gap-3 px-6 py-4 border-berenjena/[0.07] border-l"
                :class="i > 0 ? 'border-t' : ''"
                style="background: rgba(255,107,71,0.04)"
              >
                <span
                  class="mt-0.5 shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px]"
                  style="background: rgba(255,107,71,0.16)"
                  aria-hidden="true"
                >
                  <Icon name="ph:circle-dashed-bold" class="w-3 h-3 text-coral" />
                </span>
                <span class="text-sm text-berenjena leading-relaxed">{{ row[1] }}</span>
              </div>
            </div>
          </div>

          <!-- MÓVIL (<sm): dos sub-bloques etiquetados, conserva el "frente a"
               que la lista alternada perdía (plan D.2). -->
          <div class="sm:hidden">
            <div class="px-5 py-4">
              <p class="font-mono uppercase text-[11px] tracking-[0.1em] text-tinta mb-3">
                {{ $t('home.s3_col_has') }}
              </p>
              <ul class="space-y-2.5">
                <li v-for="(row, i) in s3Rows" :key="`h${i}`" class="flex items-start gap-3">
                  <span
                    class="mt-0.5 shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] bg-miriam-soft"
                    aria-hidden="true"
                  >
                    <Icon name="ph:check-bold" class="w-3 h-3 text-berenjena" />
                  </span>
                  <span class="text-sm text-tinta leading-relaxed">{{ row[0] }}</span>
                </li>
              </ul>
            </div>
            <div
              class="px-5 py-4"
              style="background: rgba(255,107,71,0.04); border-top: 1px solid rgba(45,27,61,0.10)"
            >
              <p class="font-mono uppercase text-[11px] tracking-[0.1em] text-berenjena mb-3">
                {{ $t('home.s3_col_missing') }}
              </p>
              <ul class="space-y-2.5">
                <li v-for="(row, i) in s3Rows" :key="`m${i}`" class="flex items-start gap-3">
                  <span
                    class="mt-0.5 shrink-0 inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px]"
                    style="background: rgba(255,107,71,0.16)"
                    aria-hidden="true"
                  >
                    <Icon name="ph:circle-dashed-bold" class="w-3 h-3 text-coral" />
                  </span>
                  <span class="text-sm text-berenjena leading-relaxed">{{ row[1] }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p class="mt-6 text-sm text-tinta italic max-w-2xl">
          {{ $t('home.s3_outro') }}
        </p>
      </div>
    </section>

    <!-- Hacia dónde va · objetivo N-of-1 + perfil molecular en una línea (detalle completo en /ciencia) -->
    <!-- Sin border-bottom: el separador aquí es la línea de latido (EcgDivider). -->
    <section v-reveal class="section-spacing bg-cream" :aria-label="$t('home.s8_eyebrow')">
      <div class="section-container max-w-5xl">
        <p class="eyebrow mb-4 block">{{ $t('home.s8_eyebrow') }}</p>
        <h2 class="heading-display text-3xl sm:text-5xl text-berenjena mb-6" style="letter-spacing: -0.03em">
          {{ $t('home.s8_heading') }}
        </h2>
        <i18n-t
          keypath="home.s8_p1"
          tag="p"
          class="text-base text-tinta leading-relaxed mb-8 max-w-2xl"
        >
          <template #nof1><Term id="nof1" /></template>
        </i18n-t>

        <div class="card-base mb-10 max-w-3xl" style="background: #f5efe6">
          <p class="font-display font-semibold text-berenjena text-lg mb-3">{{ $t('home.s8_advantages_title') }}</p>
          <ul class="space-y-2.5">
            <li
              v-for="(item, i) in $tm('home.s8_advantages')"
              :key="i"
              class="flex items-start gap-3"
            >
              <Icon name="ph:check-circle-fill" class="mt-[3px] w-4 h-4 text-miriam shrink-0" aria-hidden="true" />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
        </div>

        <!-- Perfil molecular en una línea · detalle completo en /ciencia -->
        <div>
          <p class="text-sm text-tinta mb-3">
            {{ $t('home.s8_markers_title') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <template v-for="(m, mi) in $tm('home.s8_markers')" :key="mi">
              <Term
                v-if="markerTerms[mi]"
                :id="markerTerms[mi]"
                :label="String($rt(m))"
                variant="badge"
              />
              <span v-else class="badge-genomic">{{ $rt(m) }}</span>
            </template>
          </div>
          <Nota class="mt-4 max-w-2xl">{{ $t('home.s8_markers_note') }}</Nota>
        </div>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <NuxtLink :to="localePath({ name: 'ciencia' })" class="btn-secondary w-full sm:w-auto">
            <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
            {{ $t('home.s8_science_button') }}
          </NuxtLink>
          <p class="text-xs text-tinta">{{ $t('home.s8_science_caption') }}</p>
        </div>
      </div>
    </section>

    <!-- S4 · ¿Por qué necesitamos tu ayuda? · Destino del dinero
         (aquí el separador es el propio cambio de color de sección) -->
    <section v-reveal class="section-spacing bg-cream-card" id="campaign" :aria-label="$t('home.s4_eyebrow')">
      <div class="section-container max-w-5xl">
        <p class="eyebrow mb-4 block">{{ $t('home.s4_eyebrow') }}</p>
        <h2 class="heading-display text-3xl sm:text-5xl text-berenjena mb-6" style="letter-spacing: -0.03em">
          {{ $t('home.s4_heading') }}
        </h2>
        <div class="space-y-4 text-base text-tinta leading-relaxed mb-8 max-w-2xl">
          <p>
            {{ $t('home.s4_p1')
            }}<strong class="font-semibold text-berenjena">{{ $t('home.s4_p1_blind') }}</strong>.
          </p>
          <p>
            {{ $t('home.s4_p2') }}
          </p>
        </div>

        <!-- Resumen de 4 categorías; el desglose completo (12 partidas) vive en
             /gastos para no sobrecargar el home (DS §13: resúmenes al inicio). -->
        <div class="card-base">
          <p class="font-display font-semibold text-berenjena text-lg mb-4">{{ $t('home.s4_buckets_title') }}</p>
          <ul class="grid sm:grid-cols-2 gap-x-10">
            <li
              v-for="(item, i) in $tm('home.s4_buckets')"
              :key="i"
              class="flex items-start gap-3 py-2.5 border-t border-berenjena/[0.07]"
            >
              <Icon
                name="ph:check-circle-fill"
                class="mt-[3px] w-4 h-4 text-miriam shrink-0"
                aria-hidden="true"
              />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
          <NuxtLink
            :to="localePath('gastos')"
            class="link-action group mt-5 text-sm text-miriam"
          >
            {{ $t('home.s4_full_breakdown') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- S10 · CTAs en escalera -->
    <section v-reveal class="section-spacing bg-cream" :aria-label="$t('home.s10_eyebrow')" style="border-top: 1px solid rgba(45,27,61,0.08)">
      <div class="section-container max-w-5xl">
        <p class="eyebrow mb-4 block">{{ $t('home.s10_eyebrow') }}</p>
        <h2 class="heading-display text-3xl sm:text-4xl text-berenjena mb-6" style="letter-spacing: -0.03em">
          {{ $t('home.s10_intro') }}
        </h2>
        <div class="grid sm:grid-cols-3 gap-6 text-left mt-12">
          <article class="card-base flex flex-col" style="background: #faf6f0">
            <p class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta mb-2">01</p>
            <h3 class="font-display font-semibold text-berenjena text-xl mb-3">{{ $t('home.s10_l1_title') }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-5 flex-1">{{ $t('home.s10_l1_text') }}</p>
            <button type="button" class="btn-ghost w-full h-12 justify-center whitespace-nowrap" style="border: 1px solid rgba(45,27,61,0.2)" @click="shareCase">
              <Icon name="ph:share-network" class="w-4 h-4" aria-hidden="true" />
              {{ $t('home.s10_l1_button') }}
            </button>
            <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('home.s10_l1_caption') }}</p>
          </article>
          <article class="card-base flex flex-col" style="background: #faf6f0">
            <p class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta mb-2">02</p>
            <h3 class="font-display font-semibold text-berenjena text-xl mb-3">{{ $t('home.s10_l2_title') }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-5 flex-1">{{ $t('home.s10_l2_text') }}</p>
            <NuxtLink
              :to="localePath({ name: 'ciencia' })"
              class="btn-secondary w-full h-12 justify-center whitespace-nowrap"
              @click="trackScience('home_ladder')"
            >
              <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
              {{ $t('home.s10_l2_button') }}
            </NuxtLink>
            <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('home.s10_l2_caption') }}</p>
          </article>
          <article class="card-base flex flex-col" style="background: #faf6f0">
            <p class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta mb-2">03</p>
            <h3 class="font-display font-semibold text-berenjena text-xl mb-3">{{ $t('home.s10_l3_title') }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-5 flex-1">{{ $t('home.s10_l3_text') }}</p>
            <a :href="GOFUNDME_URL" target="_blank" rel="noopener" @click="trackSupport('home_ladder')" data-support-cta class="btn-cta w-full h-12 justify-center whitespace-nowrap">
              <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
              {{ $t('home.s10_l3_button') }}
            </a>
            <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('home.s10_l3_caption') }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Perfiles de alto impacto · acceso directo a las vías de /colabora.
         (Plausible: /colabora apenas se ve; la gente de alto valor entra por la home.) -->
    <!-- Línea de latido como único separador: ambas secciones comparten fondo
         crema, así que aquí no compite con ningún cambio de color. -->
    <EcgDivider class="bg-cream" />

    <section v-reveal class="section-spacing bg-cream" :aria-label="$t('home.pro_eyebrow')">
      <div class="section-container max-w-3xl">
        <!-- D7: en desktop apila (título a todo el ancho arriba, botones debajo)
             en vez de texto|botones lado a lado, que estrujaba el título a 4
             líneas y dejaba hueco abajo. En móvil ya era flex-col → idéntico. -->
        <div class="card-base flex flex-col gap-5">
          <div>
            <p class="eyebrow mb-2 block">{{ $t('home.pro_eyebrow') }}</p>
            <p class="font-display font-semibold text-berenjena text-lg sm:text-xl max-w-2xl">{{ $t('home.pro_text') }}</p>
            <p class="text-sm text-tinta mt-1">{{ $t('home.pro_sub') }}</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <NuxtLink :to="localePath({ name: 'ciencia' }) + '?nivel=pro'" class="btn-secondary">
              <Icon name="ph:stethoscope" class="w-4 h-4" aria-hidden="true" />
              {{ $t('home.pro_clinical') }}
            </NuxtLink>
            <NuxtLink :to="localePath('prensa')" class="btn-secondary">
              <Icon name="ph:megaphone-simple-fill" class="w-4 h-4" aria-hidden="true" />
              {{ $t('home.pro_press') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Cierre · estado de la campaña + caso en prensa (lo último de todo) -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-label="$t('home.s5_eyebrow')" style="border-top: 1px solid rgba(45,27,61,0.08)">
      <div class="section-container max-w-5xl">
        <p class="eyebrow mb-3 block">{{ $t('home.s5_eyebrow') }}</p>
        <h2 class="font-display font-semibold text-berenjena text-2xl sm:text-3xl mb-6" style="letter-spacing: -0.02em">
          {{ $t('home.s5_heading') }}
        </h2>
        <GoFundMeProgress card />

        <!-- Caso en prensa · tira de medios + contacto de prensa (estilo prototipo) -->
        <div
          class="mt-10 pt-6 flex flex-wrap items-baseline gap-x-7 gap-y-3"
          style="border-top: 1px solid rgba(45,27,61,0.08)"
        >
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta self-center">
            {{ $t('home.s9_strip_label') }}
          </span>
          <a
            :href="elPaisUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('El País')"
          >El País<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="murciaUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('La Opinión de Murcia')"
          >La Opinión de Murcia<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="la7Url"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('La 7')"
          >La 7<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <NuxtLink
            :to="localePath('prensa')"
            class="link-action group sm:ml-auto self-center font-mono text-[12px] text-miriam"
          >
            {{ $t('home.s9_press_contact') }}
            <Icon name="ph:arrow-right" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, tm, rt } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport, trackScience, trackPress, trackShare } = useSupport()

// Mapa badge molecular → id de glosario (Term), mismo orden que home.s8_markers
// (idéntico en ES y EN). Da tooltip a cada marcador sin perder el pill.
const markerTerms = ['fgfr1', 'bcned', 'ki67', 'esr1', 'rb1', 'nec', 'ctdna', 'sstr']

// Cobertura de prensa real (verificada)
const elPaisUrl =
  'https://elpais.com/tecnologia/2026-04-23/asi-usa-una-paciente-con-cancer-metastasico-la-ia-para-entender-su-enfermedad-cual-es-el-mejor-metodo-para-hablar-de-salud-con-chatbots.html'
const murciaUrl =
  'https://www.laopiniondemurcia.es/comunidad/2026/05/30/paciente-murciana-aguarda-nuevo-tratamiento-130816775.html'
const la7Url = 'https://www.instagram.com/p/DZDT2hIAMPU/?hl=es'

const s3Rows = computed(() => {
  const raw = tm('home.s3_rows') as unknown
  const list = Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>)
  return list.map((row) => {
    const arr = Array.isArray(row) ? row : Object.values(row as Record<string, unknown>)
    return [rt(arr[0] as string), rt(arr[1] as string)]
  })
})

const shareCase = async () => {
  const url = typeof window !== 'undefined' ? window.location.href : 'https://helpmiriam.com'
  const title =
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision oncology for an ultra-rare tumor'
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url })
      trackShare('nativo', 'home')
      return
    } catch {
      /* user cancelled */
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(url)
    trackShare('copiar', 'home')
  }
}

defineOgImage('Default.takumi', {
  title:
    locale.value === 'es'
      ? 'Oncología de precisión para un tumor ultra-raro'
      : 'Precision Oncology for an Ultra-Rare Tumor',
  description:
    locale.value === 'es'
      ? 'BC-NED con FGFR1 ×13 y SSTR2+. Apoya la rebiopsia molecular avanzada que puede cambiar su tratamiento.'
      : 'BC-NED with FGFR1 ×13 and SSTR2+. Support the advanced molecular rebiopsy that could change her treatment.',
  colorMode: 'light',
})

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  description: () =>
    locale.value === 'es'
      ? 'Miriam tiene un cáncer de mama metastásico ultra-raro que los protocolos no cubren. Apoya las pruebas de precisión que pueden cambiar su tratamiento.'
      : "Miriam has an ultra-rare metastatic breast cancer that protocols don't cover. Support the precision tests that could change her treatment.",
  ogTitle: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  ogDescription: () =>
    locale.value === 'es'
      ? 'BC-NED con FGFR1 ×13 y SSTR2+. Apoya la rebiopsia molecular avanzada que puede cambiar su tratamiento.'
      : 'BC-NED with FGFR1 ×13 and SSTR2+. Support the advanced molecular rebiopsy that could change her treatment.',
  ogType: 'website',
  ogUrl: () =>
    locale.value === 'es'
      ? 'https://helpmiriam.com'
      : 'https://helpmiriam.com/en',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'BC-NED con FGFR1 ×13 y SSTR2+. Apoya la rebiopsia molecular avanzada.'
      : 'BC-NED with FGFR1 ×13 and SSTR2+. Support the advanced molecular rebiopsy.',
})

// DonateAction JSON-LD: declara la vía canónica de donación (GoFundMe) para
// buscadores y agentes de IA que responden «cómo donar / cómo ayudar a Miriam».
// Raw JSON-LD vía useHead (mismo patrón que el FAQPage de gastos.vue), porque
// schema-org no expone un helper dedicado para DonateAction.
const donateJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: locale.value === 'es' ? 'Donar para el caso de Miriam González' : "Donate to Miriam González's case",
    recipient: {
      '@type': 'Person',
      name: 'Miriam González',
      url: 'https://helpmiriam.com',
    },
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://gofund.me/3e25cae99',
      inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: donateJsonLd }],
})
</script>
