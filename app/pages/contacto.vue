<template>
  <div>
    <section class="section-spacing" :aria-label="$t('contact.title')">
      <div class="section-wide">
        <!-- Cabecera v3, como /datos (T3-CIERRE, 26-oct-2026, decisión B del DS sección 8: un solo rol de H1 en las dos páginas). El H1 pasa a `.h1-pagina` y la entradilla
             a `.lede`: en el móvil el interlineado del H1 baja de 36 a 32,4 px y la entradilla sube de 18 a 19 px. Los textos son los de siempre. La doble entradilla
             (`contact.subtitle` más `contact.message`) sigue: es la decisión G4 de Miriam. Sin eyebrow: sería copy nuevo. -->
        <PageHeader
          variante="pagina"
          :title="$t('contact.title')"
          :subtitle="$t('contact.subtitle')"
        />

        <p
          v-if="roleLabel"
          class="pathway-comfort mb-8 measure"
          role="status"
          aria-live="polite"
        >
          <Icon name="ph:identification-badge" class="pathway-comfort__icon" aria-hidden="true" />
          {{ $t('a11y.role_detected', { role: roleLabel }) }}
        </p>

        <div class="grid md:grid-cols-2 xl:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12">
          <div>
            <p class="text-tinta leading-relaxed mb-8">
              {{ $t('contact.message') }}
            </p>

            <!-- T3-LOTE2 (A26, 25-oct-2026): los cuatro canales pasan de cuatro cajas con baldosa de color a `TarjetaEnlace` (el mismo componente de /links y
                 /prensa; mismas palabras, mismos enlaces, el mismo clic de «Apoyar»). Una columna hasta `xl`; en 1280, 2×2 (la columna mide ~530 px). -->
            <ul class="ct-canales" role="list">
              <li>
                <TarjetaEnlace href="https://x.com/miriamgonp" icono="ph:x-logo-fill" :titulo="$t('contact.twitter_label')" :meta="$t('timeline.follow_twitter')" />
              </li>
              <li>
                <TarjetaEnlace href="https://www.instagram.com/miriamgonp" icono="ph:instagram-logo-fill" titulo="Instagram" meta="@miriamgonp" />
              </li>
              <li>
                <!-- `<wbr>` tras cada barra: en 2×2 la dirección se parte por la barra y no por la mitad de «miriamgonp». -->
                <TarjetaEnlace href="https://www.linkedin.com/in/miriamgonp" icono="ph:linkedin-logo-fill" :titulo="$t('contact.linkedin_label')">linkedin.com/<wbr>in/<wbr>miriamgonp</TarjetaEnlace>
              </li>
              <li>
                <TarjetaEnlace href="https://gofund.me/3e25cae99" icono="ph:heart-fill" :titulo="$t('contact.gofundme_label')" meta="gofund.me/3e25cae99" @click="trackSupport('contacto')" />
              </li>
            </ul>

            <div class="mt-10 card-base">
              <!-- Titular de una tarjeta lateral de 530 px: `.h3-seccion` (24 px) y no `.h2-seccion` (36), que en dos líneas pesaba más que las tres de texto de la tarjeta
                   (DS sección 8: /contacto está en la lista de `H2_COMO_H3`). -->
              <h2 class="bajo-lg:font-display bajo-lg:font-semibold bajo-lg:text-berenjena bajo-lg:text-sm lg:h3-seccion mb-2">
                {{ $t('contact.for_professionals') }}
              </h2>
              <p class="text-xs text-tinta leading-relaxed measure">
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
              <h2 class="heading-display bajo-lg:text-2xl lg:h2-seccion text-berenjena mt-4 mb-2">
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
              <input type="hidden" hidden name="form-name" value="contact" />
              <input
                type="hidden"
                hidden
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
                @token="onCaptchaToken"
                @expired="turnstileToken = ''"
                @error="onCaptchaError"
              />

              <button
                type="submit"
                class="btn-secondary w-full"
                :disabled="sending || (turnstileEnabled && !turnstileToken && !captchaUnavailable)"
              >
                {{ sending ? $t('contact.sending') : $t('contact.submit') }}
              </button>

              <p v-if="captchaFailed" class="msg-atencion" role="alert">
                {{ turnstileToken ? $t('captcha.failed') : $t('captcha.required') }}
              </p>
              <p v-if="failed" class="msg-atencion" role="alert">
                {{ $t('contact.failed') }}
              </p>
              <p class="text-xs text-tinta text-center">
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
// El vocabulario es ÚNICO (utils/rolesContacto.ts): el mismo que usan «Contacto», «Contacto-enviado» y «Contacto-clic» en Umami.
const roleFromQuery = () => {
  const r = route.query.role
  return esRolContacto(r) ? r : ''
}
const role = ref<string>(roleFromQuery())
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

// Envío AJAX a Netlify Forms (urlencode), mostrando el agradecimiento en la
// propia página en vez de redirigir. Posteamos a la ruta ACTUAL, no a "/":
// `nuxt generate` termina el `dist/_redirects` con un catch-all
// `/* → /404.html 404` que intercepta el POST a "/" ANTES de que Netlify Forms
// lo procese (devolvía 404 → el remitente veía "error" aunque el envío sí se
// registraba, y algunos reescribían por duplicado). La página localizada
// (/contacto, /en/contact) es un fichero prerenderizado real (200), intocada
// por el catch-all.
const sent = ref(false)
const sending = ref(false)
const failed = ref(false)
const captchaFailed = ref(false)
const turnstileToken = ref('')
// El widget no se pudo cargar/renderizar (script bloqueado, Cloudflare caído,
// sitekey inválida). No dejamos que eso bloquee el contacto: se permite enviar y
// Netlify (honeypot + antispam) hace de red de seguridad.
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
  const form = e.target as HTMLFormElement
  captchaFailed.value = false
  failed.value = false

  // Solo exigimos captcha si está habilitado Y el widget funciona. Si no cargó
  // (captchaUnavailable), saltamos la verificación para no bloquear el envío.
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

  const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString()
  sending.value = true
  try {
    await $fetch(window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    sent.value = true
    // Sin perfil elegido: `sin_rol` (antes `otro`, que se confundía con el perfil «Otro», `other`, que SÍ se eligió).
    trackUmami('Contacto-enviado', { rol: rolDeContacto(role.value) })
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

<style scoped>
/* Canales (A26): una columna hasta `xl`, 2×2 desde 1280. La tarjeta se estira a la altura de su fila. */
.ct-canales { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-16); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1280px) { .ct-canales { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.ct-canales > li { display: flex; }
.ct-canales > li > :deep(*) { width: 100%; }
</style>
