export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/icon', '@nuxtjs/seo', '@nuxtjs/sitemap', '@nuxt/content', 'nuxt-ai-ready', '@nuxtjs/plausible', '@vueuse/nuxt', '@nuxt/fonts', '@nuxt/image'],

  runtimeConfig: {
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    public: {
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    },
  },

  aiReady: {
    llmsTxt: {
      notes: [
        'The metastasis map (/mapa-metastasis) is a public decision-SUPPORT tool — Miriam’s own case — not a diagnosis or medical advice. The raw Markdown export (/mapa-metastasis.md) stays out of AI exports; the page itself is public.',
      ],
    },
  },

  // Fuentes auto-alojadas: @nuxt/fonts las descarga en build y las sirve desde
  // el propio dominio (el cliente nunca contacta con Google → sin transferencia
  // de IP), con subsetting y font-display: swap. Sin <link> a Google Fonts.
  fonts: {
    families: [
      // Fraunces va sin cursiva a propósito: desde el 16-ago-2026 Google Fonts
      // devuelve 404 en el woff2 de la Fraunces itálica variable, y @nuxt/fonts
      // aborta el build entero al descargarla. Reproducido en local con caché
      // limpia y en los tres deploys de ese día. Las demás familias no están
      // afectadas. Cuando Google lo arregle, devolver 'italic' aquí.
      { name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal'] },
      { name: 'Hanken Grotesk', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
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

  // ── Hacer PÚBLICA una página (pasarla de noindex → indexable) ──────────
  // Quitar la meta `robots: noindex` del .vue NO basta. Hay que coordinar 3 sitios:
  //   1. La meta robots en el `useSeoMeta`/`useHead` de app/pages/<página>.vue.
  //   2. public/_robots.txt → borrar su línea `Disallow: /<ruta>`. OJO: ese
  //      fichero (lo lee nuxt-robots, del bundle @nuxtjs/seo) es quien INYECTA
  //      el <meta name="robots" content="noindex,nofollow"> en el HTML, aunque
  //      la página no lo declare. Es el despiste habitual.
  //   3. Aquí: sacar la ruta de `sitemap.exclude` (abajo) y ajustar la nota de
  //      `aiReady.llmsTxt.notes` (arriba).
  // VERIFICAR siempre contra un build limpio, nunca contra dev/preview: ahí
  // nuxt-robots sirve `noindex` a propósito y solo marca con el atributo
  // data-production-content="index, follow…" lo que servirá producción. Comprobar:
  //   rm -rf .nuxt .output && pnpm generate   →  inspeccionar .output/public/<página>.html
  // ──────────────────────────────────────────────────────────────────────
  // /mapa-metastasis es público (herramienta de apoyo): entra en el sitemap.
  // Solo se excluye su export Markdown crudo (queda fuera de los exports de IA).
  sitemap: {
    exclude: ['/mapa-metastasis.md', '/en/mapa-metastasis.md'],
  },

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
      // NOTA RGPD: NO se carga recorder.js (session replays + heatmaps). En un sitio
      // de salud, grabar sesiones individuales empuja a pedir consentimiento; por
      // eso solo usamos analítica cookieless y agregada (script.js), sin banner.
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
      // pre-empaquetar three (visor 3D del hueso) evita que Vite lo descubra en
      // caliente y recargue a media página (causaba un 500 transitorio en dev)
      include: ['three', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/loaders/PLYLoader.js']
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
      'biopsia-osea': { en: '/bone-biopsy' },
      'ciencia/index': { en: '/science' },
      'ciencia/evidencia': { en: '/science/evidence' },
      'ciencia/[slug]': { en: '/science/[slug]' },
      'historia/index': { en: '/story' },
      'historia/[slug]': { en: '/story/[slug]' },
      'equipo': { en: '/team' },
      'prensa': { en: '/press' },
      'contacto': { en: '/contact' },
      'colabora': { en: '/collaborate' },
      'marcas': { en: '/brands' },
      'gastos': { en: '/expenses' },
      'gracias': { en: '/thank-you' },
      'aviso-legal': { en: '/legal-notice' },
      'privacidad': { en: '/privacy' },
      'cookies': { en: '/cookies-policy' },
    },
  },

  css: ['~/assets/css/design-system-v2/btp-tokens.css', '~/assets/css/main.css'],

  // ── Enlaces cortos de marca (campañas) ───────────────────────────────────
  // Links cortos en NUESTRO dominio (helpmiriam.com/3d…) que redirigen al
  // destino real con UTM, para repartir en redes y medir el canal en Umami.
  //
  // POR QUÉ AQUÍ (routeRules) y NO en netlify.toml — root cause del 404 (#117–#119):
  //   `nuxt generate` produce un `dist/_redirects` que termina con un catch-all
  //   `/*  /404.html  404`. Netlify procesa el FICHERO `_redirects` ANTES que
  //   `netlify.toml`, así que ese catch-all interceptaba /3d-x, /3d, … (que NO
  //   tenían fichero propio) y devolvía 404 antes de llegar a los redirects de
  //   netlify.toml. `force=true` en netlify.toml NO lo arreglaba: force solo gana
  //   a un FICHERO del mismo nombre, no a una regla previa del propio _redirects.
  //   Definidos como routeRules, nitro escribe estas reglas 302 en `dist/_redirects`
  //   ANTES del catch-all, así que ganan. 302 = repunteable sin caché permanente.
  //   Cómo añadir/leer en Umami y la tabla de activos: SHORT-LINKS.md.
  //
  // OJO «shadowing» de Netlify (por eso el `prerender.ignore` de abajo): una
  //   routeRule redirect también prerenderiza un fichero `3d-x.html` (meta-refresh).
  //   Si ese fichero existe y la regla de _redirects NO es `force`, Netlify sirve
  //   el FICHERO (200 + meta-refresh), sombreando el 302. Para que gane el 302
  //   limpio, se EXCLUYEN estas rutas del prerender (nitro.prerender.ignore), así
  //   solo queda la regla 302 en _redirects, sin `.html` que la sombree.
  routeRules: {
    '/3d': { redirect: { to: '/mapa-metastasis?utm_source=short&utm_medium=link&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-x': { redirect: { to: '/mapa-metastasis?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-in': { redirect: { to: '/mapa-metastasis?utm_source=linkedin&utm_medium=post&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-ig': { redirect: { to: '/mapa-metastasis?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/donar': { redirect: { to: 'https://www.gofundme.com/f/biopsia-molecular-que-puede-cambiar-su-tratamiento', statusCode: 302 } },
    // (acceso para médicos) enlace corto SERIO para reenviar al equipo clínico (no de redes):
    // helpmiriam.com/caso → el panel del mapa. UTM «referral/medico» para distinguir el canal.
    '/caso': { redirect: { to: '/ciencia?nivel=pro&utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#mapa-acceso', statusCode: 302 } },
    // Llevaba solo al mapa de metástasis. Desde que existe el visor de la biopsia son DOS
    // herramientas en el mismo bloque, y este es el enlace que la propia página imprime para
    // que un médico lo comparta con su equipo: tiene que abrirlas las dos.
    // Datos EN VIVO de GoFundMe: /fundraiser.json (total) y /donations.json (muro)
    // se enrutan a las funciones de Netlify. Van AQUÍ y NO en netlify.toml por el
    // MISMO motivo que los enlaces cortos de arriba: el catch-all de dist/_redirects
    // se procesa ANTES que netlify.toml, así que un redirect allí (aun con force=true)
    // nunca gana. Como routeRule, nitro escribe la regla ANTES del catch-all. Además
    // la semilla de fallback se guarda en seed/ (no en public/, ver utils/fundraiser.ts)
    // para que NO exista dist/fundraiser.json que sombree esta regla (nota «shadowing»).
    '/fundraiser.json': { redirect: { to: '/.netlify/functions/fundraiser', statusCode: 302 } },
    '/donations.json': { redirect: { to: '/.netlify/functions/donations', statusCode: 302 } },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      // /marcas (y /en/brands) es una página B2B SIN enlace en la navegación, así
      // que crawlLinks no la descubre: hay que listarla explícitamente para que
      // se prerenderice como HTML estático.
      routes: ['/marcas', '/en/brands'],
      // /design-system/ es un export estático en public/, no una ruta de Nuxt.
      // crawlLinks lo descubre desde /colabora, intenta prerenderizarlo, da 404
      // y aborta el build. Lo ignoramos: el archivo estático se copia igual.
      // Los enlaces cortos (/3d…, /donar): se EXCLUYEN del prerender para que NO
      // se genere su `.html` de meta-refresh, que sombrearía el 302 del _redirects
      // (ver nota «shadowing» en `routeRules` arriba). Así queda solo el 302 limpio.
      ignore: [
        '/design-system', '/mapa-metastasis.md', '/en/mapa-metastasis.md',
        '/3d', '/3d-x', '/3d-in', '/3d-ig', '/donar', '/caso',
        // datos en vivo: que nitro NO prerenderice un fichero que sombree el 302
        '/fundraiser.json', '/donations.json',
      ],
      // URLs SIN barra final, coherentes con los links y el canonical del sitio
      // (que ya usan «/colabora», no «/colabora/»). Genera «colabora.html» en
      // vez de «colabora/index.html», así Netlify sirve «/colabora» directo sin
      // redirigir a «/colabora/». Evita que la analítica (Umami) cuente cada
      // página dos veces (/x y /x/) y arregla el desajuste canonical↔URL servida.
      autoSubfolderIndex: false,
    },
  },

})