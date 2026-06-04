<template>
  <div>
    <section class="section-spacing" :aria-label="$t('contact.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('contact.title')"
          :subtitle="$t('contact.subtitle')"
        />

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

            <div class="mt-10 card-base" style="border-left: 4px solid #a44db2">
              <h2 class="font-display font-semibold text-berenjena text-sm mb-2">
                {{ $t('contact.for_professionals') }}
              </h2>
              <p class="text-xs text-tinta leading-relaxed">
                {{ $t('contact.for_professionals_desc') }}
              </p>
            </div>
          </div>

          <div>
            <form
              name="contact"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              class="card-base space-y-5"
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
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label for="role" class="form-label">
                  {{ $t('contact.role_label') }}
                </label>
                <select id="role" name="role" class="form-input">
                  <option value="" disabled selected>
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

              <button type="submit" class="btn-cta w-full">
                {{ $t('contact.submit') }}
              </button>

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

useSeoMeta({
  title: () => (locale.value === 'es' ? 'Contacto' : 'Contact'),
  description: () =>
    locale.value === 'es'
      ? '¿Eres oncólogo/a, investigador/a o periodista con interés en el caso? Contacta con el equipo de Miriam González para documentación clínica o colaboración.'
      : "Are you an oncologist, researcher, or journalist interested in the case? Contact Miriam González's team for clinical documentation or collaboration.",
  ogTitle: () => (locale.value === 'es' ? 'Contacto' : 'Contact'),
  ogType: 'website',
  twitterCard: 'summary',
  robots: 'noindex',
})
</script>
