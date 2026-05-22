export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/icon', '@nuxtjs/seo', '@nuxtjs/sitemap', '@nuxt/content', 'nuxt-ai-ready', '@nuxtjs/plausible', '@vueuse/nuxt'],

  site: {
    url: 'https://helpmiriam.com',
    name: 'Help Miriam',
  },

  sitemap: {},

  app: {
    head: {
      title: 'Miriam González — Buscando un tratamiento oncológico de precisión',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Source+Sans+3:ital,wght@0,300..900;1,300..900&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  plausible: {
    ignoredHostnames: ['localhost'],
  },

  i18n: {
    baseUrl: 'https://helpmiriam.com',
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'es',
    strategy: 'prefix_except_default',
    langDir: 'locales/',
    detectBrowserLanguage: {
      useCookie: true ,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      fallbackLocale: 'es',
    },
    customRoutes: 'config',
    pages: {
      'ciencia/index': { en: '/science' },
      'ciencia/[slug]': { en: '/science/[slug]' },
      'historia/index': { en: '/story' },
      'historia/[slug]': { en: '/story/[slug]' },
      'equipo': { en: '/team' },
      'contacto': { en: '/contact' },
    },
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    prerender: {
      crawlLinks: true,
    },
    routeRules: {
      '/colabora': { redirect: { to: 'https://helpmiriam.notion.site/colabora', statusCode: 301 } },
      '/collaborate': { redirect: { to: 'https://helpmiriam.notion.site/colabora', statusCode: 301 } },
    },
  },
})