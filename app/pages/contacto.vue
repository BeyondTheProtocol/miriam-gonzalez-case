<template>
  <div>
    <section class="section-spacing" :aria-label="$t('contact.title')">
      <div class="section-wide">
        <PageHeader
          :title="$t('contact.title')"
          :subtitle="$t('contact.subtitle')"
        />

        <p
          v-if="roleLabel"
          class="pathway-comfort mb-8 max-w-2xl"
          role="status"
          aria-live="polite"
        >
          <Icon name="ph:identification-badge" class="pathway-comfort__icon" aria-hidden="true" />
          {{ $t('a11y.role_detected', { role: roleLabel }) }}
        </p>

        <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <p class="text-tinta leading-relaxed mb-8">
              {{ $t('contact.message') }}
            </p>

            <div class="space-y-4">
              <a
                href="https://x.com/miriamgonp"
                target="_blank"
                rel="noopener"
                class="card-base flex items-center gap-4 hover:shadow-md transition-shadow group"
                style="text-decoration: none"
              >
                <span
                  class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0"
                >
                  <Icon name="ph:x-logo-fill" class="w-5 h-5 text-cream" aria-hidden="true" />
                </span>
                <div>
                  <p
                    class="font-semibold text-berenjena text-sm group-hover:text-miriam transition-colors"
                  >
                    {{ $t('contact.twitter_label') }}
                  </p>
                  <p class="text-xs text-tinta">
                    {{ $t('timeline.follow_twitter') }}
                  </p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/miriamgonp"
                target="_blank"
                rel="noopener"
                class="card-base flex items-center gap-4 hover:shadow-md transition-shadow group"
                style="text-decoration: none"
              >
                <span
                  class="w-10 h-10 rounded-xl bg-miriam flex items-center justify-center shrink-0"
                >
                  <Icon
                    name="ph:instagram-logo-fill"
                    class="w-5 h-5 text-cream"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p
                    class="font-semibold text-berenjena text-sm group-hover:text-miriam transition-colors"
                  >
                    Instagram
                  </p>
                  <p class="text-xs text-tinta">{{'@'}}miriamgonp</p>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/miriamgonp"
                target="_blank"
                rel="noopener"
                class="card-base flex items-center gap-4 hover:shadow-md transition-shadow group"
                style="text-decoration: none"
              >
                <span
                  class="w-10 h-10 rounded-xl bg-tinta flex items-center justify-center shrink-0"
                >
                  <Icon
                    name="ph:linkedin-logo-fill"
                    class="w-5 h-5 text-cream"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p
                    class="font-semibold text-berenjena text-sm group-hover:text-miriam transition-colors"
                  >
                    {{ $t('contact.linkedin_label') }}
                  </p>
                  <p class="text-xs text-tinta">linkedin.com/in/miriamgonp</p>
                </div>
              </a>

              <a
                href="https://gofund.me/3e25cae99"
                target="_blank"
                rel="noopener"
                @click="trackSupport('contacto')"
                class="card-base flex items-center gap-4 hover:shadow-md transition-shadow group"
                style="text-decoration: none"
              >
                <span
                  class="w-10 h-10 rounded-xl bg-coral flex items-center justify-center shrink-0"
                >
                  <Icon name="ph:heart-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
                </span>
                <div>
                  <p
                    class="font-semibold text-berenjena text-sm group-hover:text-coral transition-colors"
                  >
                    {{ $t('contact.gofundme_label') }}
                  </p>
                  <p class="text-xs text-tinta">gofund.me/3e25cae99</p>
                </div>
              </a>
            </div>

            <div class="mt-10 card-base">
              <h2 class="font-display font-semibold text-berenjena text-sm mb-2">
                {{ $t('contact.for_professionals') }}
              </h2>
              <p class="text-xs text-tinta leading-relaxed">
                {{ $t('contact.for_professionals_desc') }}
              </p>
            </div>
          </div>

          <div>
            <!-- Gracias tras enviar: segundo momento emocional del sitio. -->
            <div
              v-if="sent"
              class="card-base text-center py-12"
              role="status"
              aria-live="polite"
            >
              <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-8 h-8 mx-auto text-coral" aria-hidden="true" />
              <h2 class="heading-display text-2xl text-berenjena mt-4 mb-2">
                {{ $t('contact.sent_title') }}
              </h2>
              <p class="text-sm text-tinta leading-relaxed max-w-xs mx-auto">
                {{ $t('contact.sent_body') }}
              </p>
            </div>

            <form
              v-else
              name="contact"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              class="card-base space-y-5"
              @submit.prevent="onSubmit"
            >
              <input type="hidden" name="form-name" value="contact" />
              <input
                type="hidden"
                name="subject"
                value="Nuevo mensaje de contacto — helpmiriam.com"
              />
              <p hidden>
                <label>No rellenes esto: <input name="bot-field" /></label>
              </p>
              <div>
                <label for="name" class="form-label">
                  {{ $t('contact.name_label') }}
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  autocomplete="name"
                  class="form-input"
                  :placeholder="$t('contact.name_placeholder')"
                />
              </div>

              <div>
                <label for="email" class="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autocomplete="email"
                  class="form-input"
                  :placeholder="$t('contact.email_placeholder')"
                />
              </div>

              <div>
                <label for="role" class="form-label">
                  {{ $t('contact.role_label') }}
                </label>
                <select id="role" name="role" v-model="role" class="form-input">
                  <option value="" disabled>
                    {{ $t('contact.role_placeholder') }}
                  </option>
                  <option value="oncologist">
                    {{ $t('contact.role_oncologist') }}
                  </option>
                  <option value="researcher">
                    {{ $t('contact.role_researcher') }}
                  </option>
                  <option value="journalist">
                    {{ $t('contact.role_journalist') }}
                  </option>
                  <option value="patient">
                    {{ $t('contact.role_patient') }}
                  </option>
                  <option value="tech">{{ $t('contact.role_tech') }}</option>
                  <option value="other">{{ $t('contact.role_other') }}</option>
                </select>
              </div>

              <div>
                <label for="message" class="form-label">
                  {{ $t('contact.message_label') }}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  required
                  class="form-input resize-y"
                  :placeholder="$t('contact.message_placeholder')"
                ></textarea>
              </div>

              <TurnstileWidget
                ref="turnstileRef"
                action="contact"
                @token="turnstileToken = $event"
                @expired="turnstileToken = ''"
                @error="turnstileToken = ''"
              />

              <button
                type="submit"
                class="btn-cta w-full"
                :disabled="sending || (turnstileEnabled && !turnstileToken)"
              >
                {{ sending ? $t('contact.sending') : $t('contact.submit') }}
              </button>

              <p v-if="captchaFailed" class="text-xs text-coral-deep text-center" role="alert">
                {{ turnstileToken ? $t('captcha.failed') : $t('captcha.required') }}
              </p>
              <p v-if="failed" class="text-xs text-coral-deep text-center" role="alert">
                {{ $t('contact.failed') }}
              </p>
              <p class="text-[11px] text-tinta text-center">
                {{ $t('contact.privacy_notice') }}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const { trackSupport } = useSupport()
const route = useRoute()

// Pre-relleno del selector de perfil desde ?role=… — los enlaces de la home y de
// /colabora ya saben quién escribe (oncología, prensa, tech, paciente…), así que
// llegan con su perfil elegido. Solo aceptamos valores válidos; si no, vacío.
const VALID_ROLES = ['oncologist', 'researcher', 'journalist', 'patient', 'tech', 'other']
const roleFromQuery = () => {
  const r = route.query.role
  return typeof r === 'string' && VALID_ROLES.includes(r) ? r : ''
}
const role = ref(roleFromQuery())
watch(() => route.query.role, () => { role.value = roleFromQuery() })

const { t } = useI18n()
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    oncologist: t('contact.role_oncologist'),
    researcher: t('contact.role_researcher'),
    journalist: t('contact.role_journalist'),
    patient: t('contact.role_patient'),
    tech: t('contact.role_tech'),
    other: t('contact.role_other'),
  }
  return role.value ? map[role.value] ?? '' : ''
})

// Envío AJAX a Netlify Forms: mismo endpoint (POST a "/" con urlencode), pero
// mostramos el agradecimiento en la propia página en vez de redirigir.
const sent = ref(false)
const sending = ref(false)
const failed = ref(false)
const captchaFailed = ref(false)
const turnstileToken = ref('')
const turnstileRef = ref<{ reset: () => void } | null>(null)
const { enabled: turnstileEnabled, verifyToken } = useTurnstile()

async function onSubmit(e: Event) {
  const form = e.target as HTMLFormElement
  captchaFailed.value = false
  failed.value = false

  if (turnstileEnabled.value) {
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

  const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString()
  sending.value = true
  try {
    await $fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    sent.value = true
    trackUmami('Contacto-enviado', { rol: role.value || 'otro' })
  } catch {
    failed.value = true
  } finally {
    sending.value = false
  }
}

const metaTitle = () => (locale.value === 'es' ? 'Contacto' : 'Contact')
const metaDesc = () =>
  locale.value === 'es'
    ? '¿Eres profesional de la oncología, investigador, periodista o quieres ayudar? Escríbenos sobre el caso de Miriam.'
    : "Are you an oncology professional, researcher, journalist or do you want to help? Write to us about Miriam's case."

useSeoMeta({
  title: metaTitle,
  description: metaDesc,
  ogTitle: metaTitle,
  ogDescription: metaDesc,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: metaTitle,
  twitterDescription: metaDesc,
  robots: 'noindex',
})

defineOgImage('Default.takumi', {
  title: metaTitle,
  description: metaDesc,
})
</script>
