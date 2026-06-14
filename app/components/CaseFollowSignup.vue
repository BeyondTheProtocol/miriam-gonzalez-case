<template>
  <!-- Captura de audiencia (comité · el nº1 para la retención). Recoge un email
       para avisar de novedades del caso. Netlify Forms (mismo mecanismo que el
       contacto): los emails caen en el panel de Netlify, sin servicio externo.
       RGPD: consentimiento explícito (casilla sin premarcar + obligatoria),
       finalidad declarada, enlace a privacidad, baja fácil, mínimos datos
       (solo email) y honeypot anti-bot. -->
  <section class="card-base" aria-labelledby="case-follow-title">
    <p class="eyebrow mb-2 block">{{ $t('follow.eyebrow') }}</p>
    <h2 id="case-follow-title" class="heading-display text-xl text-berenjena mb-2">
      {{ $t('follow.title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed mb-5 max-w-xl">{{ $t('follow.body') }}</p>

    <p
      v-if="sent"
      class="flex items-center gap-2 text-sm text-berenjena font-medium"
      role="status"
    >
      <Icon name="ph:check-circle-fill" class="w-5 h-5 text-miriam shrink-0" aria-hidden="true" />
      {{ $t('follow.sent') }}
    </p>

    <form
      v-else
      name="case-follow"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      @submit.prevent="onSubmit"
      class="max-w-xl"
    >
      <input type="hidden" name="form-name" value="case-follow" />
      <p hidden>
        <label>{{ $t('follow.bot') }} <input name="bot-field" /></label>
      </p>

      <div class="flex flex-col sm:flex-row gap-3">
        <label class="sr-only" for="case-follow-email">{{ $t('follow.email_label') }}</label>
        <input
          id="case-follow-email"
          v-model="email"
          type="email"
          name="email"
          required
          autocomplete="email"
          :placeholder="$t('follow.placeholder')"
          class="flex-1 min-h-[44px] rounded-btn bg-cream px-4 py-2.5 text-sm text-berenjena placeholder:text-tinta/60"
          style="border: 1px solid rgba(45, 27, 61, 0.15)"
        />
        <button
          type="submit"
          :disabled="sending || !consent"
          class="btn-cta justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ sending ? $t('follow.sending') : $t('follow.cta') }}
        </button>
      </div>

      <label class="flex items-start gap-2.5 mt-3 text-xs text-tinta leading-relaxed cursor-pointer">
        <input
          v-model="consent"
          type="checkbox"
          name="consent"
          required
          class="mt-0.5 shrink-0 accent-miriam"
          style="width: 16px; height: 16px"
        />
        <span>
          <i18n-t keypath="follow.consent" tag="span">
            <template #privacy>
              <NuxtLink :to="localePath('privacidad')" class="link-inline">{{ $t('follow.privacy_link') }}</NuxtLink>
            </template>
          </i18n-t>
        </span>
      </label>

      <p v-if="failed" class="mt-2 text-xs text-coral-deep" role="alert">{{ $t('follow.failed') }}</p>
    </form>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const email = ref('')
const consent = ref(false)
const sending = ref(false)
const sent = ref(false)
const failed = ref(false)

async function onSubmit(e: Event) {
  if (!consent.value) return // RGPD: sin consentimiento explícito, no se envía.
  const form = e.target as HTMLFormElement
  const body = new URLSearchParams(
    new FormData(form) as unknown as Record<string, string>
  ).toString()
  sending.value = true
  failed.value = false
  try {
    await $fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    sent.value = true
  } catch {
    failed.value = true
  } finally {
    sending.value = false
  }
}
</script>
