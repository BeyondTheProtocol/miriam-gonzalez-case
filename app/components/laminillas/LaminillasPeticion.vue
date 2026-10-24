<script lang="ts">
// El hash de la carga, leído al evaluar el módulo: la página reescribe la URL con ?l= al hidratar
// (router.replace) y el #ficheros/#files ya no está cuando se monta el diálogo.
const HASH_INICIAL = import.meta.client ? window.location.hash : ''
</script>

<script setup lang="ts">
/**
 * LaminillasPeticion — «Pide los ficheros»: los TIFF a resolución completa, bajo petición.
 *
 * Nace el 24-oct-2026: un grupo de patología computacional pidió los ficheros porque el visor no
 * tenía descarga. Comité (diseno + acceso + verificacion): bajo petición y no descarga libre, para
 * saber quién los usa y no disparar el coste de salida; contado como cortesía, no como cerrojo,
 * porque los píxeles ya son públicos. Licencia CC BY 4.0 y sha256 publicados (SHA256SUMS.txt).
 *
 *  · <dialog> nativo: foco atrapado, Esc, fondo inerte.
 *  · Netlify Forms, como CaseFollowSignup: esqueleto en public/__forms.html (los `name` deben
 *    coincidir), honeypot, Turnstile y consentimiento sin premarcar.
 *  · Lo abre el botón de la barra o el ancla #ficheros / #files (para pegarla en un correo).
 */
const props = defineProps<{ idioma: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.idioma === 'en' ? en : es)
const localePath = useLocalePath()

const CONJUNTOS = [
  { id: 'higado-2026', es: 'Hígado 2026 · 6 laminillas · 3,8 GB', en: 'Liver 2026 · 6 slides · 3.8 GB' },
  { id: 'mama-2024', es: 'Mama 2024 · 13 laminillas · 15,3 GB', en: 'Breast 2024 · 13 slides · 15.3 GB' },
  { id: 'mama-revision-2026', es: 'Mama, revisión 2026 · 13 laminillas · 1,2 GB', en: 'Breast, 2026 review · 13 slides · 1.2 GB' },
]
const SUMAS = '/laminillas-ficheros/SHA256SUMS.txt'

const dlg = ref<HTMLDialogElement | null>(null)
const email = ref('')
const sobre = ref('')
// Sin premarcar: que cada cual pida lo que va a usar (coste de salida; comité diseno).
const conjuntos = ref<string[]>([])
const consent = ref(false)
const faltaConsent = ref(false)
const faltaMuestra = ref(false)
const faltaEmail = ref(false)
const sending = ref(false)
const sent = ref(false)
const failed = ref(false)
const captchaFailed = ref(false)
const turnstileToken = ref('')
const captchaUnavailable = ref(false)
const turnstileRef = ref<{ reset: () => void } | null>(null)
const { enabled: turnstileEnabled, verifyToken } = useTurnstile()

function abre() { if (dlg.value && !dlg.value.open) dlg.value.showModal() }
function cierra() { dlg.value?.close() }
defineExpose({ abre })

const ANCLAS = ['#ficheros', '#files']
function alHash() { if (ANCLAS.includes(window.location.hash)) abre() }
const route = useRoute()
onMounted(() => {
  if ([HASH_INICIAL, route.hash, window.location.hash].some((h) => ANCLAS.includes(h))) abre()
  window.addEventListener('hashchange', alHash)
})
onBeforeUnmount(() => window.removeEventListener('hashchange', alHash))

function onCaptchaToken(token: string) { turnstileToken.value = token; captchaUnavailable.value = false }
function onCaptchaError() { turnstileToken.value = ''; captchaUnavailable.value = true }

async function onSubmit(e: Event) {
  // Los motivos se dicen en texto, no con un botón gris (comité diseno). RGPD: sin consentimiento, no se envía.
  const campoEmail = (e.target as HTMLFormElement).elements.namedItem('email') as HTMLInputElement
  faltaEmail.value = !campoEmail.checkValidity()
  faltaMuestra.value = !conjuntos.value.length
  faltaConsent.value = !consent.value
  if (faltaEmail.value || faltaMuestra.value || faltaConsent.value) return
  captchaFailed.value = false
  failed.value = false
  if (turnstileEnabled.value && !captchaUnavailable.value) {
    if (!turnstileToken.value) { captchaFailed.value = true; return }
    if (!(await verifyToken(turnstileToken.value))) {
      captchaFailed.value = true
      turnstileToken.value = ''
      turnstileRef.value?.reset()
      return
    }
  }
  const datos = new FormData(e.target as HTMLFormElement)
  datos.set('conjuntos', conjuntos.value.join(', '))
  const body = new URLSearchParams(datos as unknown as Record<string, string>).toString()
  sending.value = true
  try {
    // POST a la ruta actual, no a "/": ver CaseFollowSignup (el catch-all 404 de `_redirects`).
    await $fetch(window.location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    sent.value = true
  } catch {
    failed.value = true
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <dialog ref="dlg" class="pet" aria-labelledby="pet-titulo" @click.self="cierra">
    <div class="pet__caja">
      <div class="pet__cab">
        <h2 id="pet-titulo" class="pet__titulo">{{ L('Pide los ficheros a resolución completa', 'Request the full-resolution files') }}</h2>
        <button type="button" class="pet__cerrar" :aria-label="L('Cerrar', 'Close')" @click="cierra">
          <Icon name="ph:x-bold" class="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <p class="pet__texto">{{ L(
        'Son los mismos píxeles que ves aquí, en TIFF piramidal (se abren con OpenSlide o QuPath), sin etiquetas ni metadatos. Te mando el enlace de descarga en 2 días laborables como mucho. Te pido el email para saber quién los usa y que podamos seguir hablando.',
        'They’re the same pixels you see here, as pyramidal TIFFs (they open in OpenSlide or QuPath), with no labels or metadata. I’ll send you a download link within 2 working days. I ask for your email so I know who’s using them and we can stay in touch.') }}</p>

      <p v-if="sent" class="pet__ok" role="status">
        <Icon name="ph:check-circle-fill" class="w-5 h-5 shrink-0" aria-hidden="true" />
        {{ L('Recibido. El enlace te llega en 2 días laborables como mucho.', 'Got it. You’ll have the link within 2 working days.') }}
      </p>

      <form v-else name="slides-request" method="POST" novalidate data-netlify="true" data-netlify-honeypot="bot-field" class="pet__form" @submit.prevent="onSubmit">
        <input type="hidden" name="form-name" value="slides-request" />
        <p hidden><label>{{ L('No rellenes esto', 'Leave this empty') }} <input name="bot-field" /></label></p>

        <label class="pet__campo">
          <span>{{ L('Tu email', 'Your email') }}</span>
          <input v-model="email" type="email" name="email" required autocomplete="email" class="pet__input" :aria-invalid="faltaEmail" @input="faltaEmail = false" />
        </label>
        <p v-if="faltaEmail" class="pet__error text-coral-deep" role="alert">{{ L('Escribe un email válido para que pueda mandarte el enlace.', 'Enter a valid email so I can send you the link.') }}</p>
        <label class="pet__campo">
          <span>{{ L('Quién eres y para qué los quieres (opcional)', 'Who you are and what you’ll use them for (optional)') }}</span>
          <input v-model="sobre" type="text" name="about" maxlength="300" class="pet__input" />
        </label>

        <fieldset class="pet__conjuntos">
          <legend>{{ L('Qué muestras', 'Which samples') }}</legend>
          <label v-for="c in CONJUNTOS" :key="c.id" class="pet__check">
            <input v-model="conjuntos" type="checkbox" :value="c.id" />
            <span>{{ L(c.es, c.en) }}</span>
          </label>
        </fieldset>

        <p class="pet__licencia">
          {{ L('Licencia CC BY 4.0: úsalos para lo que quieras citando «Miriam González · helpmiriam.com». Si encuentras algo, me encantará saberlo.', 'Licensed under CC BY 4.0: use them however you like, just credit “Miriam González · helpmiriam.com”. If you find something, I’d love to hear about it.') }}
          <a :href="SUMAS" class="link-inline">{{ L('Sumas SHA-256', 'SHA-256 checksums') }}</a>
        </p>

        <TurnstileWidget ref="turnstileRef" action="slides-request" @token="onCaptchaToken" @expired="turnstileToken = ''" @error="onCaptchaError" />

        <label class="pet__check pet__consent">
          <input v-model="consent" type="checkbox" name="consent" required />
          <span>
            {{ L('Acepto que Miriam use mi email solo para mandarme el enlace y hablar de cómo uso los ficheros.', 'I agree that Miriam can use my email only to send me the link and to talk about how I use the files.') }}
            <NuxtLink :to="localePath('privacidad')" class="link-inline">{{ L('Privacidad', 'Privacy') }}</NuxtLink>
          </span>
        </label>
        <p v-if="faltaConsent && !consent" class="pet__error text-coral-deep" role="alert">{{ L('Marca la casilla para que pueda mandarte el enlace.', 'Tick the box so I can send you the link.') }}</p>

        <p v-if="faltaMuestra && !conjuntos.length" class="pet__error text-coral-deep" role="alert">{{ L('Elige al menos una muestra.', 'Pick at least one sample.') }}</p>
        <p v-if="captchaFailed" class="pet__error text-coral-deep" role="alert">{{ turnstileToken ? $t('captcha.failed') : $t('captcha.required') }}</p>
        <p v-if="failed" class="pet__error text-coral-deep" role="alert">{{ L('No se ha podido enviar. Prueba otra vez en un momento.', 'It couldn’t be sent. Please try again in a moment.') }}</p>

        <button type="submit" class="btn-cta justify-center disabled:opacity-50 disabled:cursor-not-allowed" :disabled="sending">
          {{ sending ? L('Enviando…', 'Sending…') : L('Pedir los ficheros', 'Request the files') }}
        </button>
      </form>
    </div>
  </dialog>
</template>

<style scoped>
.pet { width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 0; border: none; border-radius: var(--radius-md, 12px); background: var(--color-bg-card); color: var(--color-text); }
.pet::backdrop { background: color-mix(in srgb, var(--color-text) 45%, transparent); }
.pet__caja { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.pet__cab { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.pet__titulo { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: var(--texto-lg); }
.pet__cerrar { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; margin: -10px -10px 0 0; border-radius: var(--radius-sm); color: var(--color-text); }
.pet__cerrar:focus-visible, .pet__input:focus-visible, .pet__check input:focus-visible { outline: 3px solid var(--anillo-foco); outline-offset: 2px; }
.pet__texto, .pet__licencia { margin: 0; font-size: var(--texto-sm); line-height: 1.5; }
.pet__licencia { font-size: var(--texto-xs); }
.pet__form { display: flex; flex-direction: column; gap: 12px; }
.pet__campo { display: flex; flex-direction: column; gap: 4px; font-size: var(--texto-sm); font-weight: 600; }
.pet__input { min-height: 44px; padding: 8px 12px; font-weight: 400; font-size: 16px; border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent); border-radius: var(--radius-sm); background: var(--color-bg-card); color: var(--color-text); }
.pet__conjuntos { margin: 0; padding: 0; border: none; display: flex; flex-direction: column; gap: 2px; }
.pet__conjuntos legend { padding: 0; margin-bottom: 4px; font-size: var(--texto-sm); font-weight: 600; }
.pet__check { display: flex; align-items: flex-start; gap: 10px; min-height: 44px; padding-top: 10px; font-size: var(--texto-sm); cursor: pointer; }
.pet__check input { width: 18px; height: 18px; margin-top: 1px; flex-shrink: 0; accent-color: var(--color-miriam, currentColor); }
.pet__consent { font-size: var(--texto-xs); line-height: 1.5; }
.pet__error { margin: 0; font-size: var(--texto-xs); }
.pet__ok { display: flex; align-items: center; gap: 8px; margin: 0; font-size: var(--texto-sm); font-weight: 600; }
</style>
