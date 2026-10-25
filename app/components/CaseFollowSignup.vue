<template>
  <!-- Captura de audiencia (comité · el nº1 para la retención). Recoge un email
       para avisar de novedades del caso. Netlify Forms (mismo mecanismo que el
       contacto): los emails caen en el panel de Netlify, sin servicio externo.
       RGPD: consentimiento explícito (casilla sin premarcar + obligatoria),
       finalidad declarada, enlace a privacidad, baja fácil, mínimos datos
       (solo email) y honeypot anti-bot. -->
  <section class="card-base" aria-labelledby="case-follow-title">
    <p class="eyebrow mb-2 block">{{ $t('follow.eyebrow') }}</p>
    <h2 id="case-follow-title" class="h2-seccion mb-2">
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
          class="form-input flex-1"
        />
        <button
          type="submit"
          :disabled="sending || !consent || (turnstileEnabled && !turnstileToken && !captchaUnavailable)"
          class="btn-secondary justify-center"
        >
          {{ sending ? $t('follow.sending') : $t('follow.cta') }}
        </button>
      </div>

      <TurnstileWidget
        ref="turnstileRef"
        action="case-follow"
        class="mt-3"
        @token="onCaptchaToken"
        @expired="turnstileToken = ''"
        @error="onCaptchaError"
      />

      <label class="flex items-center gap-1 mt-1 text-sm text-tinta leading-relaxed cursor-pointer">
        <!-- La casilla nativa mide 44 × 44 (objetivo táctil del sistema) y va transparente encima de la marca que se ve, de 20 px: el
             teclado, el lector de pantalla y el envío del formulario son los de siempre. -->
        <span class="cfs__control">
          <input
            v-model="consent"
            type="checkbox"
            name="consent"
            required
            class="cfs__casilla"
          />
          <span class="cfs__marca" aria-hidden="true"><Icon name="ph:check-bold" class="cfs__check" /></span>
        </span>
        <span>
          <i18n-t keypath="follow.consent" tag="span">
            <template #privacy>
              <NuxtLink :to="localePath('privacidad')" class="link-inline">{{ $t('follow.privacy_link') }}</NuxtLink>
            </template>
          </i18n-t>
        </span>
      </label>

      <!-- Errores: texto del color del cuerpo con icono (el coral no es texto sobre crema, 2,6:1; el color nunca es la única señal) -->
      <p v-if="captchaFailed" class="mt-2 flex items-center gap-2 text-sm font-medium text-berenjena" role="alert">
        <Icon name="ph:warning-circle-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ turnstileToken ? $t('captcha.failed') : $t('captcha.required') }}
      </p>
      <p v-if="failed" class="mt-2 flex items-center gap-2 text-sm font-medium text-berenjena" role="alert">
        <Icon name="ph:warning-circle-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ $t('follow.failed') }}
      </p>
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
const captchaFailed = ref(false)
const turnstileToken = ref('')
// El widget no cargó/renderizó: no bloqueamos la suscripción por ello (honeypot
// + antispam de Netlify hacen de red de seguridad).
const captchaUnavailable = ref(false)
const turnstileRef = ref<{ reset: () => void } | null>(null)
const { enabled: turnstileEnabled, verifyToken } = useTurnstile()

function onCaptchaToken(token: string) {
  turnstileToken.value = token
  captchaUnavailable.value = false
}
function onCaptchaError() {
  turnstileToken.value = ''
  captchaUnavailable.value = true
}

async function onSubmit(e: Event) {
  if (!consent.value) return // RGPD: sin consentimiento explícito, no se envía.
  captchaFailed.value = false
  failed.value = false

  if (turnstileEnabled.value && !captchaUnavailable.value) {
    if (!turnstileToken.value) {
      captchaFailed.value = true
      return
    }
    const verified = await verifyToken(turnstileToken.value)
    if (!verified) {
      captchaFailed.value = true
      turnstileToken.value = ''
      turnstileRef.value?.reset()
      return
    }
  }

  const form = e.target as HTMLFormElement
  const body = new URLSearchParams(
    new FormData(form) as unknown as Record<string, string>
  ).toString()
  sending.value = true
  try {
    // POST a la ruta actual, no a "/": el catch-all `/* → /404.html 404` del
    // `_redirects` de `nuxt generate` intercepta el POST a "/" antes de que
    // Netlify Forms lo procese. La página actual es un fichero real (200).
    await $fetch(window.location.pathname, {
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

<style scoped>
.cfs__control {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: var(--control-min);
  height: var(--control-min);
}
.cfs__casilla {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.cfs__marca {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  box-sizing: border-box;
  border: 2px solid var(--trazo-interactivo); /* >= 3:1 sobre el fondo (WCAG 1.4.11) */
  border-radius: var(--radius-sm);
  background: var(--fondo);
  color: transparent;
  pointer-events: none;
  transition: background-color var(--dur-micro) var(--curva-salida), border-color var(--dur-micro) var(--curva-salida);
}
.cfs__check { width: 0.875rem; height: 0.875rem; }
.cfs__casilla:checked + .cfs__marca {
  background: var(--identidad);
  border-color: var(--identidad);
  color: var(--color-bg);
}
.cfs__casilla:focus-visible + .cfs__marca {
  outline: 2px solid var(--anillo-foco);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) { .cfs__marca { transition: none; } }
@media (forced-colors: active) {
  .cfs__marca { border-color: CanvasText; }
  .cfs__casilla:checked + .cfs__marca { background: Highlight; border-color: Highlight; color: HighlightText; forced-color-adjust: none; }
}
</style>
