<template>
  <section id="campaign" class="section-spacing bg-white/50" :aria-label="$t('gofundme.title')">
    <div class="section-container">
      <h2 class="heading-display text-3xl sm:text-4xl text-ink-950 mb-3">
        {{ $t('gofundme.title') }}
      </h2>
      <p class="text-lg text-ink-700 max-w-2xl mb-12">
        {{ $t('gofundme.subtitle') }}
      </p>

      <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
        <!-- What we fund -->
        <div class="card-base">
          <div class="flex items-center gap-2.5 mb-5">
            <span class="w-9 h-9 rounded-xl bg-gold-100 flex items-center justify-center">
              <Icon name="ph:flask-fill" class="w-4.5 h-4.5 text-gold-700" />
            </span>
            <h3 class="font-display font-semibold text-ink-900">{{ $t('gofundme.what_title') }}</h3>
          </div>
          <p v-if="$te('gofundme.what_intro')" class="text-sm text-ink-600 leading-relaxed mb-4 italic">
            {{ $t('gofundme.what_intro') }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="(item, i) in $tm('gofundme.what_items')"
              :key="i"
              class="flex items-start gap-2.5"
            >
              <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-600 shrink-0" aria-hidden="true" />
              <span class="text-sm text-ink-700 leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
        </div>

        <!-- Why not covered -->
        <div class="card-base">
          <div class="flex items-center gap-2.5 mb-5">
            <span class="w-9 h-9 rounded-xl bg-ocean-50 flex items-center justify-center">
              <Icon name="ph:question-fill" class="w-4.5 h-4.5 text-ocean-700" />
            </span>
            <h3 class="font-display font-semibold text-ink-900">{{ $t('gofundme.why_title') }}</h3>
          </div>
          <p class="text-sm text-ink-700 leading-relaxed">
            {{ $t('gofundme.why_text') }}
          </p>
        </div>

        <!-- Transparency -->
        <div class="card-base md:col-span-2 bg-gold-50/40 border-gold-200/50">
          <div class="flex items-center gap-2.5 mb-4">
            <span class="w-9 h-9 rounded-xl bg-gold-200/60 flex items-center justify-center">
              <Icon name="ph:eye-fill" class="w-4.5 h-4.5 text-gold-800" />
            </span>
            <h3 class="font-display font-semibold text-ink-900">{{ $t('gofundme.transparency_title') }}</h3>
          </div>
          <p class="text-sm text-ink-700 leading-relaxed max-w-2xl">
            {{ $t('gofundme.transparency_text') }}
          </p>
          <!-- GoFundMe live widget -->
          <div class="mt-5 mb-4">
            <iframe
              src="https://www.gofundme.com/f/biopsia-molecular-que-puede-cambiar-su-tratamiento/widget/medium"
              width="100%"
              height="214"
              frameborder="0"
              scrolling="no"
              title="GoFundMe progress"
            />
          </div>
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Icon name="ph:arrow-up-right-bold" class="w-3.5 h-3.5" aria-hidden="true" />
            GoFundMe
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

