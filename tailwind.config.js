/** @type {import('tailwindcss').Config} */
export default {
  // En el móvil el primer toque deja el `hover:` pegado. Así los `hover:` solo se aplican donde
  // hay hover de verdad (@media (hover: hover)). Skill `movimiento-movil`, auditoría del 26-sep-26.
  future: { hoverOnlyWhenSupported: true },
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './content/**/*.md',
    './app.vue',
  ],
  // Tonos de pill-data construidos dinámicamente (`pill-data--${tone}`) en las
  // tablas clínicas (snapshot, perfil molecular, biopsia líquida, evidencia).
  // Sin safelist, Tailwind los purga —no los ve literales— y los tags salen sin
  // fondo (transparentes). Mantener en sync con app/assets/css/main.css.
  safelist: [
    'pill-data--info',
    'pill-data--warn',
    'pill-data--positive',
    'pill-data--neutral',
    'pill-data--violet',
    'pill-data--berenjena',
    // <RutaPasos> las construye por nombre (utils/estadoInsignia.ts): ninguna página las escribe literales.
    'status-badge--hecho',
    'status-badge--curso',
    'status-badge--pendiente',
    'status-badge--nopuede',
    'status-badge--atencion',
  ],
  theme: {
    extend: {
      colors: {
        // Design system tokens — Caso Miriam
        // Base palette (5 colors): cream bg, berenjena text, miriam violet (accent), coral (CTA)
        cream: 'rgb(var(--color-bg-rgb) / <alpha-value>)',         // var(--color-bg)
        'cream-card': 'rgb(var(--color-bg-card-rgb) / <alpha-value>)',  // var(--color-bg-card)
        berenjena: 'rgb(var(--color-text-rgb) / <alpha-value>)',     // var(--color-text)
        tinta: 'rgb(var(--color-text-soft-rgb) / <alpha-value>)',         // var(--color-text-soft)
        miriam: {
          // Firma / emphasis / links. Oscurecido de #a44db2 a #9d44ab para que el
          // texto pase WCAG AA (4.5:1) también sobre cream-card (4.77:1), no solo
          // sobre cream. El violeta sigue siendo prácticamente el mismo.
          DEFAULT: 'rgb(var(--color-miriam-rgb) / <alpha-value>)',
          soft: 'rgb(var(--color-miriam-soft-rgb) / <alpha-value>)',        // var(--color-miriam-soft) — badge genómico bg
          // Violeta claro para ÉNFASIS sobre fondos oscuros (berenjena): el miriam
          // DEFAULT no contrasta sobre berenjena, este sí (5.46:1, pasa WCAG AA).
          // Usado en el dossier /marcas (titulares e identidad sobre bandas oscuras).
          claro: 'rgb(var(--color-miriam-claro-rgb) / <alpha-value>)',
        },
        // Berenjena un punto más violácea para tarjetas elevadas SOBRE las bandas
        // oscuras (cajas «Carlos Roca» / LinkedIn en /marcas). Texto crema: 12.8:1.
        'berenjena-2': 'rgb(var(--berenjena-2-rgb) / <alpha-value>)',
        coral: {
          DEFAULT: 'rgb(var(--color-cta-rgb) / <alpha-value>)',     // var(--color-cta) — color de ACCIÓN + acento de marca (fondo de botón, punto/borde). Como TEXTO sobre claro usa coral.deep; NUNCA en anillos de foco (usa --anillo-foco) ni como texto/velo coral puro sobre crema (falla AA)
          hover: 'rgb(var(--color-cta-hover-rgb) / <alpha-value>)',
          // Coral accesible para TEXTO sobre fondos claros: pasa WCAG AA
          // (4.7:1 sobre cream-card, 5.0:1 sobre cream). El coral DEFAULT
          // solo cumple contraste como fondo o como texto sobre berenjena.
          deep: '#bb4128',
          500: 'rgb(var(--color-cta-rgb) / <alpha-value>)',
          600: 'rgb(var(--color-cta-hover-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        // Cuerpo/UI: Hanken Grotesk (elección del tipógrafo, 9-jul) — cálida, x-height
        // generosa, quita el «tell» de Source Sans. Ya cargada por @nuxt/fonts.
        body: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // Suelo de la escala (sistema v3, S2b): el texto pequeño de Tailwind sale de los tokens y ya no baja de 13 px.
      // `2xs` (12 px) está RESERVADO a mono en mayúsculas (.eyebrow, .etiqueta, ejes de gráfico). Las alturas de línea
      // son las de siempre, para que solo cambie el cuerpo de la letra.
      fontSize: {
        '2xs': ['var(--texto-2xs)', { lineHeight: '1rem' }],
        xs: ['var(--texto-xs)', { lineHeight: '1rem' }],
        sm: ['var(--texto-sm)', { lineHeight: '1.25rem' }],
      },
      spacing: {
        // Altura del header sticky en ≥sm (h-18). Sin este token, `sm:h-18` era
        // un no-op y el menú se quedaba en 64px (h-16) en todos los tamaños.
        18: '4.5rem',
        // Retícula y táctil: `px-gutter` es el relleno de .section-wide; `min-h-control`, los 44 px.
        control: 'var(--control-min)',
        gutter: 'var(--gutter)',
      },
      // Puente de los tokens de movimiento, sombra y radio (sistema v3, S1). Solo nombres NUEVOS o con el mismo valor
      // que ya tenían: nada cambia de píxel. Las utilidades que nadie usa no salen en el CSS.
      borderRadius: {
        btn: 'var(--radius-btn)',
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        flotante: 'var(--sombra-flotante)',
        hover: 'var(--sombra-hover)',
        dura: 'var(--sombra-dura)',
      },
      transitionDuration: {
        micro: 'var(--dur-micro)',
        transicion: 'var(--dur-transicion)',
        explica: 'var(--dur-explica)',
      },
      transitionTimingFunction: {
        salida: 'var(--curva-salida)',
        entrada: 'var(--curva-entrada)',
        mover: 'var(--curva-mover)',
      },
      // `max-w-shell` es el ancho de .section-wide; `max-w-medida`, la medida de lectura.
      maxWidth: {
        shell: 'var(--shell-max)',
        medida: 'var(--measure)',
      },
      // Bordes, divisores y anillos por defecto desde los roles (S3). Sin esto salían de gris-200 (#e5e7eb) y azul-500 de
      // Tailwind: separadores grises en /prensa, aros azules en cualquier `ring` sin color.
      borderColor: {
        DEFAULT: 'var(--trazo-sutil)',
      },
      divideColor: {
        DEFAULT: 'var(--trazo-sutil)',
      },
      ringColor: {
        DEFAULT: 'var(--anillo-foco)',
      },
      typography: (theme) => ({
        // `prose-ink` (legales): la prosa de marca con los roles. Antes no estaba definida y viñetas, contadores,
        // filetes y citas salían en el gris de Tailwind.
        ink: {
          css: {
            '--tw-prose-body': 'var(--texto-1)',
            '--tw-prose-headings': 'var(--texto-1)',
            '--tw-prose-lead': 'var(--texto-2)',
            '--tw-prose-links': 'var(--identidad)',
            '--tw-prose-bold': 'var(--texto-1)',
            '--tw-prose-counters': 'var(--texto-2)',
            '--tw-prose-bullets': 'var(--texto-3)',
            '--tw-prose-hr': 'var(--trazo-medio)',
            '--tw-prose-quotes': 'var(--texto-1)',
            '--tw-prose-quote-borders': 'var(--trazo-fuerte)',
            '--tw-prose-captions': 'var(--texto-3)',
            '--tw-prose-code': 'var(--texto-1)',
            '--tw-prose-pre-code': 'var(--texto-1)',
            '--tw-prose-pre-bg': 'var(--superficie)',
            '--tw-prose-th-borders': 'var(--trazo-fuerte)',
            '--tw-prose-td-borders': 'var(--trazo-sutil)',
          },
        },
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.berenjena'),
            '--tw-prose-headings': theme('colors.berenjena'),
            '--tw-prose-links': theme('colors.miriam.DEFAULT'),
            '--tw-prose-bold': theme('colors.berenjena'),
            fontFamily: theme('fontFamily.body').join(', '),
            h1: { fontFamily: theme('fontFamily.display').join(', ') },
            h2: { fontFamily: theme('fontFamily.display').join(', ') },
            h3: { fontFamily: theme('fontFamily.display').join(', ') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
