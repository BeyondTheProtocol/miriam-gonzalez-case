export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/icon', '@nuxtjs/seo', '@nuxtjs/sitemap', '@nuxt/content', 'nuxt-ai-ready', '@nuxtjs/plausible', '@vueuse/nuxt', '@nuxt/fonts', '@nuxt/image'],

  // Fuentes auto-alojadas: @nuxt/fonts las descarga en build y las sirve desde
  // el propio dominio (el cliente nunca contacta con Google → sin transferencia
  // de IP), con subsetting y font-display: swap. Sin <link> a Google Fonts.
  fonts: {
    families: [
      { name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'Source Sans 3', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500] },
      // Manuscrita para las anotaciones «de cuaderno de laboratorio»
      // (las dos caras, las estrellas). Subset latino, font-display: swap.
      { name: 'Caveat', provider: 'google', weights: [400, 600, 700] },
    ],
  },

  site: {
    url: 'https://helpmiriam.com',
    name: 'Help Miriam',
  },

  sitemap: {},

  // El «sistema de diseño» es una página estática suelta (public/design-system/),
  // no una ruta de Nuxt, así que el link-checker no la reconoce y la marca como
  // 404. El enlace es válido en producción (/design-system/); lo excluimos de la
  // inspección en lugar de degradarlo a una URL absoluta con barra final.
  linkChecker: {
    excludeLinks: ['/design-system', '/design-system/', '/design-system/**'],
  },

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
      // Analítica Umami (privada, SIN cookies, agregada). Convive con Plausible.
      // Vive AQUÍ (no por «Snippet injection» de Netlify): si se añade el snippet
      // además de esto, script.js se cargaría dos veces y se duplicarían las
      // visitas. Mantener una sola fuente: el repo.
      // data-domains: solo envía desde el dominio real (no localhost/previews).
      // data-performance: recoge Core Web Vitals reales de los visitantes.
      // NOTA RGPD: NO se carga el recorder.js (session replays + heatmaps). En un
      // sitio de salud, grabar sesiones individuales requeriría consentimiento;
      // por eso solo usamos analítica cookieless y agregada, sin banner. Si algún
      // día se quieren replays, hay que añadir un flujo de consentimiento primero.
      script: [
        {
          src: 'https://cloud.umami.is/script.js',
          defer: true,
          'data-website-id': '30a40c53-5573-45c0-8ac9-8f0f94621ecf',
          'data-domains': 'helpmiriam.com',
          'data-performance': 'true',
        },
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
      // /design-system/ es un export estático en public/, no una ruta de Nuxt.
      // crawlLinks lo descubre desde /colabora, intenta prerenderizarlo, da 404
      // y aborta el build. Lo ignoramos: el archivo estático se copia igual.
      ignore: ['/design-system'],
      // URLs SIN barra final, coherentes con los links y el canonical del sitio
      // (que ya usan «/colabora», no «/colabora/»). Genera «colabora.html» en
      // vez de «colabora/index.html», así Netlify sirve «/colabora» directo sin
      // redirigir a «/colabora/». Evita que la analítica (Umami) cuente cada
      // página dos veces (/x y /x/) y arregla el desajuste canonical↔URL servida.
      autoSubfolderIndex: false,
    },
  },
})