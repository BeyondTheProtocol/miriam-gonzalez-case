export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/content',
    '@nuxtjs/sitemap',
  ],

  site: {
    url: 'https://helpmiriam.com',
    name: 'Help Miriam',
  },

  sitemap: {},

  app: {
    head: {
      title: 'Miriam González — Buscando un tratamiento oncológico de precisión',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Cáncer de mama con diferenciación neuroendocrina y amplificación FGFR1. Una paciente que lucha por la oncología de precisión con IA y una red internacional de expertos.',
        },
        { property: 'og:image', content: '/og-image.jpg' },
      ],
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
  },
})
