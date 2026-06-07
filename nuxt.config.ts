export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/icon', '@nuxtjs/seo', '@nuxtjs/sitemap', '@nuxt/content', 'nuxt-ai-ready', '@nuxtjs/plausible', '@vueuse/nuxt', '@nuxt/fonts'],

  // Fuentes auto-alojadas: @nuxt/fonts las descarga en build y las sirve desde
  // el propio dominio (el cliente nunca contacta con Google → sin transferencia
  // de IP), con subsetting y font-display: swap. Sin <link> a Google Fonts.
  fonts: {
    families: [
      { name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'Source Sans 3', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500] },
    ],
  },

  site: {
    url: 'https://helpmiriam.com',
    name: 'Help Miriam',
  },

  sitemap: {},

  // Usa el SQLite nativo de Node (node:sqlite, Node 22+) en lugar del SQLite
  // WASM por defecto. El WASM falla al insertar filas muy grandes —como
  // science.yml, que lleva treatments + paperSections en un solo registro—
  // con «The supplied SQL string contains no statements», dejando la colección
  // vacía en dev. El nativo no tiene ese límite.
  content: {
    experimental: { nativeSqlite: true },
  },

  app: {
    head: {
      title: 'Miriam González — Buscando un tratamiento oncológico de precisión',
      meta: [
        { name: 'theme-color', content: '#faf6f0' },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: []
    }
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
      'ciencia/evidencia': { en: '/science/evidence' },
      'ciencia/[slug]': { en: '/science/[slug]' },
      'historia/index': { en: '/story' },
      'historia/[slug]': { en: '/story/[slug]' },
      'equipo': { en: '/team' },
      'contacto': { en: '/contact' },
      'colabora': { en: '/collaborate' },
      'gastos': { en: '/expenses' },
      'gracias': { en: '/thank-you' },
      'aviso-legal': { en: '/legal-notice' },
      'privacidad': { en: '/privacy' },
      'cookies': { en: '/cookies-policy' },
    },
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    prerender: {
      crawlLinks: true,
    },
    routeRules: {},
  },
})