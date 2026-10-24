import { execSync } from 'node:child_process'
import manifiestoExplorador from './public/celula/explorador/manifiesto.json'
import { estadoPuerta, type Manifiesto } from './app/utils/celulaExplorador'

// «Última actualización» del pie = el día del último commit, leído en el build. Cada despliegue
// trae el suyo; un rebuild sin cambios no la mueve. Sin git (no debería pasar en Netlify), la
// hora del build. Test: pnpm test:pie-fecha.
function fechaUltimoCambio(): string {
  try {
    const iso = execSync('git log -1 --format=%cI', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (iso) return iso
  } catch { /* sin git: se usa la hora del build */ }
  return new Date().toISOString()
}

// Explorador célula a célula: la misma puerta que el robots de su página (useCelulaExplorador → estadoPuerta).
// Abierta (verificado + OK de Miriam), entra en el sitemap; cerrada, fuera. Una lista fija se quedó atrás
// cuando la puerta se abrió el 19-oct-2026. Test: pnpm test:sitemap-explorador.
const exploradorAbierto = estadoPuerta(manifiestoExplorador as unknown as Manifiesto) === 'real'

export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/icon', '@nuxtjs/seo', '@nuxtjs/sitemap', '@nuxt/content', 'nuxt-ai-ready', '@nuxtjs/plausible', '@vueuse/nuxt', '@nuxt/fonts', '@nuxt/image'],

  runtimeConfig: {
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    public: {
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      // /laminillas: raíz de las teselas. Vacía = la del manifest (app/data/laminillas.json, el bucket).
      // Solo para probar contra un servidor local: NUXT_PUBLIC_LAMINILLAS_TESELAS=http://127.0.0.1:8090/v1/
      laminillasTeselas: process.env.NUXT_PUBLIC_LAMINILLAS_TESELAS || '',
      ultimoCambio: fechaUltimoCambio(),
    },
  },

  aiReady: {
    llmsTxt: {
      notes: [
        'The metastasis map (/mapa-metastasis) is a public decision-SUPPORT tool — Miriam’s own case — not a diagnosis or medical advice. It was made in June 2026 with the March and May PET scans and is not updated (current view: /lesiones). The raw Markdown export (/mapa-metastasis.md) stays out of AI exports; the page itself is public.',
        'The slide viewer (/laminillas) is a public decision-SUPPORT tool with Miriam’s own scanned pathology slides — not a diagnosis or medical advice. Each report result it quotes carries its source and verification seal.',
      ],
    },
  },

  // Fuentes auto-alojadas: @nuxt/fonts las descarga en build y las sirve desde
  // el propio dominio (el cliente nunca contacta con Google → sin transferencia
  // de IP), con subsetting y font-display: swap. Sin <link> a Google Fonts.
  fonts: {
    families: [
      // Fraunces con cursiva real (sistema v3, S7). Estuvo sin ella desde el 16-ago-2026, cuando Google Fonts devolvió 404 en el
      // woff2 de la itálica variable y @nuxt/fonts abortaba el build entero (reproducido en local con caché limpia y en los tres
      // deploys de ese día). Probado el 24-oct-2026: `nuxt generate` termina con ella y en Chrome `document.fonts` lista Fraunces
      // italic 400 y 600 como cargadas. Si el build vuelve a romperse, quitar 'italic' aquí: el sitio sigue (el navegador sintetiza
      // la oblicua) y el plan B es @fontsource/fraunces, que además mantiene el cero a terceros.
      { name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'Hanken Grotesk', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      { name: 'Source Sans 3', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal', 'italic'] },
      // El 600 existe de verdad: `.etiqueta`, `.badge-genomic` y `.status-badge` lo piden y sin él salía una negrita sintética.
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600] },
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
  // /mapa-metastasis es público e indexable (herramienta de apoyo que «sirvió en un momento concreto», junio de 2026, y no se
  // actualiza): entra en el sitemap. T2a (24-oct-2026) lo devolvió a su estado de antes de F4, cuando era un archivo con
  // `noindex`. Solo se excluye su export Markdown crudo (queda fuera de los exports de IA).
  // Las páginas con `robots: noindex` tampoco van en el sitemap. Las españolas ya no salían;
  // las inglesas sí, porque su ruta traducida no casaba con la exclusión automática.
  sitemap: {
    exclude: [
      '/mapa-metastasis.md', '/en/mapa-metastasis.md',
      '/guia-de-estilo', '/en/style-guide',
      '/contacto', '/en/contact',
      '/gracias', '/en/thank-you',
      '/aviso-legal', '/en/legal-notice',
      '/privacidad', '/en/privacy',
      '/cookies', '/en/cookies-policy',
      // explorador célula a célula: fuera solo con la puerta cerrada (entonces la página es noindex; ver exploradorAbierto)
      ...(exploradorAbierto ? [] : ['/celula-a-celula/explorar', '/en/cell-by-cell/explore']),
    ],
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

  // En desarrollo, el servidor HTTP escucha solo en 127.0.0.1. Sin host, `nuxt dev` resuelve
  // 'localhost' a [::1] y 127.0.0.1:<puerto> no responde. No toca el build ni lo publicado.
  devServer: { host: '127.0.0.1' },

  vite: {
    plugins: [
      {
        // En desarrollo, el websocket HMR del servidor escucha solo en este Mac. Nuxt 4.4 le
        // fija el puerto (24678) y no el host, y Vite sin host lo abre a toda la red (visible
        // desde la wifi). Ni `--host 127.0.0.1`, ni `vite.server.hmr.host`, ni el hook
        // `vite:extendConfig` llegan a esa instancia; este plugin 'post' sí (medido con lsof,
        // 26-sep-2026). No toca el build ni lo publicado.
        name: 'hmr-solo-en-este-mac',
        enforce: 'post',
        config(config) {
          const hmr = config.server?.hmr
          if (hmr && typeof hmr === 'object' && !hmr.server) hmr.host ??= '127.0.0.1'
        },
      },
    ],
    optimizeDeps: {
      // pre-empaquetar three (visor 3D del hueso) evita que Vite lo descubra en
      // caliente y recargue a media página (causaba un 500 transitorio en dev)
      include: ['three', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/loaders/PLYLoader.js',
        // explorador célula a célula (/celula-a-celula/explorar): React + piezas de Vitessce, solo en su chunk
        'react', 'react-dom/client', '@vitessce/vit-s', '@vitessce/schemas', '@vitessce/constants-internal', '@vitessce/plugins',
        '@vitessce/csv', '@vitessce/scatterplot-embedding',
        // visor de laminillas (/laminillas)
        'openseadragon']
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
    // Sin detección por idioma del navegador: Google desaconseja redirigir entre
    // versiones de idioma, y así el sitio no instala ninguna cookie (ni banner).
    // El idioma lo marca la URL (/ o /en) y el usuario cambia con el selector ES/EN.
    detectBrowserLanguage: false,
    customRoutes: 'config',
    pages: {
      // Guía viva del sistema de diseño (sistema v3). Probado el 24-oct-2026: con `false` (sin localizar) el cliente
      // redirigía /guia-de-estilo a la home tras hidratar. Va localizada como el resto; el contenido es español en las dos
      // (lang="es" en la página) y las dos son noindex y salen de sitemap y exports de IA.
      'guia-de-estilo': { en: '/style-guide' },
      'laminillas': { en: '/slides' },
      'celula-a-celula': { en: '/cell-by-cell' },
      // Fichero plano y no pages/celula-a-celula/explorar.vue: así /celula-a-celula no pasa a ser ruta padre.
      'celula-a-celula-explorar': { es: '/celula-a-celula/explorar', en: '/cell-by-cell/explore' },
      'ciencia/index': { en: '/science' },
      'ciencia/evidencia': { en: '/science/evidence' },
      // Tanda 2 del rediseño (T2a, 24-oct-2026): /historia, /herramientas y /reservorio vuelven a ser páginas vivas y se
      // reponen sus rutas traducidas (las quitó F4 al fusionarlas). El slug EN de /reservorio es el mismo.
      'historia/index': { en: '/story' },
      'equipo': { en: '/team' },
      'prensa': { en: '/press' },
      'contacto': { en: '/contact' },
      'colabora': { en: '/collaborate' },
      'marcas': { en: '/brands' },
      'reservorio': { en: '/reservorio' },
      'gastos': { en: '/expenses' },
      'datos': { en: '/data' },
      'herramientas': { en: '/tools' },
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
    // Desde el rediseño (F4, 23-oct-2026) los /3d* llevan a /lesiones, que ya incluye el mapa de hueso (el mapa pasó a
    // archivo). Siguen en 302 y con los MISMOS UTM (`lanzamiento-herramienta`), para no romper la serie en Umami.
    '/3d': { redirect: { to: '/lesiones?utm_source=short&utm_medium=link&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-x': { redirect: { to: '/lesiones?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-in': { redirect: { to: '/lesiones?utm_source=linkedin&utm_medium=post&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-ig': { redirect: { to: '/lesiones?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    // Faltaban desde junio: TikTok y YouTube caían en el genérico /3d y no se distinguían.
    '/3d-tt': { redirect: { to: '/lesiones?utm_source=tiktok&utm_medium=bio&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    '/3d-yt': { redirect: { to: '/lesiones?utm_source=youtube&utm_medium=bio&utm_campaign=lanzamiento-herramienta', statusCode: 302 } },
    // /lesiones (mama, hígado y hueso). Mismo patrón que /3d*, más TikTok: el vídeo de
    // esta página es vertical y ahí sí hay enlace propio que medir. No hay genérico:
    // /lesiones ya es la página, y para WhatsApp o correo se reparte su URL tal cual.
    '/lesiones-x': { redirect: { to: '/lesiones?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento-lesiones', statusCode: 302 } },
    '/lesiones-in': { redirect: { to: '/lesiones?utm_source=linkedin&utm_medium=post&utm_campaign=lanzamiento-lesiones', statusCode: 302 } },
    '/lesiones-ig': { redirect: { to: '/lesiones?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-lesiones', statusCode: 302 } },
    '/lesiones-tt': { redirect: { to: '/lesiones?utm_source=tiktok&utm_medium=bio&utm_campaign=lanzamiento-lesiones', statusCode: 302 } },
    '/lesiones-yt': { redirect: { to: '/lesiones?utm_source=youtube&utm_medium=bio&utm_campaign=lanzamiento-lesiones', statusCode: 302 } },
    // /biopsia-osea → /laminillas (20-oct-2026): el visor de laminillas sustituye al de la microfotografía.
    // 301 (permanente) y las dos rutas en `prerender.ignore`: sin ese .html no hay nada que sombree la regla.
    '/biopsia-osea': { redirect: { to: '/laminillas', statusCode: 301 } },
    '/en/bone-biopsy': { redirect: { to: '/en/slides', statusCode: 301 } },
    // i18n crea también la variante /en/biopsia-osea de la regla de arriba: que no quede como página vacía.
    '/en/biopsia-osea': { redirect: { to: '/en/slides', statusCode: 301 } },
    // /tres-dianas → el explorador (20-oct-2026): AlphaFold va como información de cada proteína en el detalle del gen,
    // no como página aparte (lo acordado con Miriam). 301 sin query: un destino con «?» lo trata test-short-links como corto de campaña.
    '/tres-dianas': { redirect: { to: '/celula-a-celula/explorar', statusCode: 301 } },
    '/en/three-targets': { redirect: { to: '/en/cell-by-cell/explore', statusCode: 301 } },
    // i18n crea también la variante /en/tres-dianas de la regla de arriba (como /en/biopsia-osea): que no quede vacía.
    '/en/tres-dianas': { redirect: { to: '/en/cell-by-cell/explore', statusCode: 301 } },
    // Enlaces cortos de la biopsia: van directos a /laminillas (sin encadenar con el 301 de arriba).
    // Sin genérico, a propósito:
    // NO hay genérico «/biopsia»: `prerender.ignore` hace match por PREFIJO, así que
    // ignorar '/biopsia' deja sin prerenderizar /biopsia-osea y la página entera da 404
    // (pasó en producción el 20-sep-2026). Un corto no puede ser prefijo de su destino.
    '/biopsia-x': { redirect: { to: '/laminillas?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento-biopsia', statusCode: 302 } },
    '/biopsia-in': { redirect: { to: '/laminillas?utm_source=linkedin&utm_medium=post&utm_campaign=lanzamiento-biopsia', statusCode: 302 } },
    '/biopsia-ig': { redirect: { to: '/laminillas?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento-biopsia', statusCode: 302 } },
    '/biopsia-tt': { redirect: { to: '/laminillas?utm_source=tiktok&utm_medium=bio&utm_campaign=lanzamiento-biopsia', statusCode: 302 } },
    '/biopsia-yt': { redirect: { to: '/laminillas?utm_source=youtube&utm_medium=bio&utm_campaign=lanzamiento-biopsia', statusCode: 302 } },
    // ── Páginas que se pliegan en otras (rediseño de arquitectura, F4, 23-oct-2026; tanda 2, T2a, 24-oct-2026) ─────────
    // Cada redirección son TRES reglas (ES, EN y la variante /en/<slug-es> que crea i18n) y las tres van en
    // `prerender.ignore` (si no, su .html de meta-refresh sombrea el redirect). Donde el slug EN es igual al ES, bastan dos. Sin
    // query: un destino con «?» lo trata test-short-links como corto de campaña. El fragmento # sí (como /caso).
    // T2a devolvió a la vida /herramientas, /reservorio e /historia (Miriam, 24-oct-2026): ya no tienen regla de ES ni de EN, y
    // las tres salieron de `prerender.ignore` (casa por PREFIJO: dejarlas habría dejado la página viva sin prerenderizar).
    // Solo queda lo que i18n inventa: la variante /en/<slug-es>, que apunta a la ruta inglesa de verdad.
    '/en/herramientas': { redirect: { to: '/en/tools', statusCode: 301 } },
    '/en/historia': { redirect: { to: '/en/story', statusCode: 301 } },
    // El capítulo 1 de /historia se borró (ES y EN, 23-oct): 301 a la cronología.
    '/historia/01-el-comienzo': { redirect: { to: '/timeline', statusCode: 301 } },
    '/en/story/01-the-beginning': { redirect: { to: '/en/timeline', statusCode: 301 } },
    '/en/historia/01-el-comienzo': { redirect: { to: '/en/timeline', statusCode: 301 } },
    // /videos → /ciencia (el ADC vive allí; el promo, en /prensa). /en/videos conserva su slug: dos reglas.
    '/videos': { redirect: { to: '/ciencia', statusCode: 301 } },
    '/en/videos': { redirect: { to: '/en/science', statusCode: 301 } },
    '/donar': { redirect: { to: 'https://www.gofundme.com/f/biopsia-molecular-que-puede-cambiar-su-tratamiento', statusCode: 302 } },
    // El repo público de Polaris. Destino EXTERNO: un 302 directo a GitHub no lo vería Umami (el
    // navegador nunca carga una página con su script, por eso /donar sale «no medible»). Así que
    // salta por un Link de Umami, que sí cuenta el clic y reenvía al repo. Se mide en Umami → Links,
    // «General → Repo Polaris», no en las visitas de la web.
    '/polaris': { redirect: { to: 'https://cloud.umami.is/q/polaris-repo', statusCode: 302 } },
    // (acceso para médicos) enlace corto SERIO para reenviar al equipo clínico (no de redes):
    // helpmiriam.com/caso → «Qué buscamos» de /datos: lo que el equipo clínico puede hacer por el caso.
    // Hasta el 23-oct-2026 llevaba al panel del mapa de /ciencia (#mapa-acceso). UTM «referral/medico»
    // para distinguir el canal. Sigue en 302: el destino puede cambiar otra vez (rediseño, fase F1).
    '/caso': { redirect: { to: '/datos?utm_source=referral&utm_medium=medico&utm_campaign=equipo-clinico#que-buscamos', statusCode: 302 } },
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
      // /guia-de-estilo (guía viva del sistema de diseño) tampoco tiene enlace desde la navegación: igual que /marcas.
      // T2a: /herramientas, /reservorio e /historia (y sus rutas inglesas) también van aquí. El selector de idioma es un botón y
      // no un enlace, así que el rastreo no descubre las rutas /en/…; y /historia no tiene enlace interno (su tráfico llega de
      // Google). Lo que `crawlLinks` no ve, se lista.
      routes: [
        '/marcas', '/en/brands', '/guia-de-estilo', '/en/style-guide',
        '/herramientas', '/en/tools', '/reservorio', '/en/reservorio', '/historia', '/en/story',
      ],
      // /design-system/ es un export estático en public/, no una ruta de Nuxt.
      // crawlLinks lo descubre desde /colabora, intenta prerenderizarlo, da 404
      // y aborta el build. Lo ignoramos: el archivo estático se copia igual.
      // Los enlaces cortos (/3d…, /donar): se EXCLUYEN del prerender para que NO
      // se genere su `.html` de meta-refresh, que sombrearía el 302 del _redirects
      // (ver nota «shadowing» en `routeRules` arriba). Así queda solo el 302 limpio.
      ignore: [
        '/design-system', '/mapa-metastasis.md', '/en/mapa-metastasis.md',
        // guía viva del sistema de diseño: su export Markdown está bloqueado a propósito (utils/aiExportBlocklist.ts) y daría 404
        '/guia-de-estilo.md', '/en/style-guide.md',
        '/3d', '/3d-x', '/3d-in', '/3d-ig', '/3d-tt', '/3d-yt', '/donar', '/caso', '/polaris',
        '/lesiones-x', '/lesiones-in', '/lesiones-ig', '/lesiones-tt', '/lesiones-yt',
        '/biopsia-x', '/biopsia-in', '/biopsia-ig', '/biopsia-tt', '/biopsia-yt',
        // la página vieja de la biopsia: solo queda su 301 a /laminillas
        '/biopsia-osea', '/en/bone-biopsy', '/en/biopsia-osea',
        // la página retirada de AlphaFold: solo queda su 301 al explorador
        '/tres-dianas', '/en/three-targets', '/en/tres-dianas',
        // lo que i18n inventa y ya solo es un redirect (T2a): /en/herramientas → /en/tools y /en/historia → /en/story. OJO: `ignore`
        // casa por PREFIJO, y ninguna de estas es prefijo de una página viva (test-short-links §1.bis). /herramientas,
        // /reservorio e /historia NO están aquí: son páginas vivas desde T2a.
        '/en/herramientas', '/en/historia',
        '/historia/01-el-comienzo', '/en/story/01-the-beginning', '/en/historia/01-el-comienzo',
        '/videos', '/en/videos',
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