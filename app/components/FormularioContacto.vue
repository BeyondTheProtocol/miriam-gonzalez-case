<template>
  <!-- Gracias tras enviar: segundo momento emocional del sitio. -->
  <div
    v-if="sent"
    class="card-base text-center py-12"
    role="status"
    aria-live="polite"
  >
    <!-- En línea y no con <Icon>: este icono no va en el HTML de la página y, al aparecer tras enviar, <Icon> lo pediría a api.iconify.design. -->
    <svg v-if="deExpertos" class="w-8 h-8 mx-auto text-miriam" viewBox="0 0 256 256" aria-hidden="true">
      <path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m45.66 85.66l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32" />
    </svg>
    <Icon v-else name="ph:heart-fill" class="heart-beat heart-beat--alive w-8 h-8 mx-auto text-coral" aria-hidden="true" />
    <h2 ref="tituloEnviado" tabindex="-1" class="heading-display bajo-lg:text-2xl lg:h2-seccion text-berenjena mt-4 mb-2">
      {{ $t('contact.sent_title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed max-w-xs mx-auto">
      {{ $t(deExpertos ? 'expertos.sent_body' : 'contact.sent_body') }}
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
      :value="deExpertos ? 'Nuevo mensaje de contacto (expertos) — helpmiriam.com' : 'Nuevo mensaje de contacto — helpmiriam.com'"
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
      <select id="role" name="role" v-model="rol" class="form-input">
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
      {{ $t(deExpertos ? 'expertos.failed' : 'contact.failed') }}
    </p>
    <!-- /expertos lleva la información de primera capa de la protección de datos, con enlace a la política. Son cuatro frases: a la izquierda, que centradas cuestan de leer. -->
    <i18n-t v-if="deExpertos" keypath="expertos.privacidad" tag="p" class="text-xs text-tinta leading-relaxed">
      <template #politica>
        <NuxtLink :to="localePath({ name: 'privacidad' })" class="link-inline">{{ $t('expertos.politica') }}</NuxtLink>
      </template>
    </i18n-t>
    <p v-else class="text-xs text-tinta text-center">
      {{ $t('contact.privacy_notice') }}
    </p>
  </form>
</template>

<script setup lang="ts">
/**
 * El formulario de contacto (Netlify Forms + Turnstile), uno solo: lo montan /contacto y /expertos. Cada página decide el perfil con `v-model:rol`: /contacto lo lee
 * del `?role=`, que llega después de hidratar, y /expertos lo fija de entrada, así que su HTML generado ya sale con el perfil marcado. Los `name` de los campos
 * tienen que coincidir con el esqueleto de `public/__forms.html`.
 *
 * `origen="expertos"`: el asunto del correo lo distingue (conserva «contacto», la palabra que busca el parte), los textos van en primera persona, la nota de privacidad es
 * la suya y el «enviado» lleva un check quieto en vez del corazón coral que late, que en esa página se leería como la campaña.
 */
const props = defineProps<{ origen?: 'expertos' }>()
const localePath = useLocalePath()
const rol = defineModel<string>('rol', { default: '' })
const deExpertos = computed(() => props.origen === 'expertos')

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
// Al enviar desaparece el formulario, y con él lo que tenía el foco: el foco pasa al titular del agradecimiento y no se pierde en <body>.
const tituloEnviado = ref<HTMLElement | null>(null)

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
    trackUmami('Contacto-enviado', { rol: rolDeContacto(rol.value) })
    await nextTick()
    tituloEnviado.value?.focus()
  } catch {
    failed.value = true
  } finally {
    sending.value = false
  }
}
</script>
