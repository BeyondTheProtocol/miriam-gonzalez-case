/** @type {import('tailwindcss').Config} */
export default {
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
  ],
  theme: {
    extend: {
      colors: {
        // Design system tokens — Caso Miriam
        // Base palette (5 colors): cream bg, berenjena text, miriam violet (accent), coral (CTA)
        cream: '#faf6f0',         // var(--color-bg)
        'cream-card': '#f5efe6',  // var(--color-bg-card)
        berenjena: '#2d1b3d',     // var(--color-text)
        tinta: '#3a3340',         // var(--color-text-soft)
        miriam: {
          // Firma / emphasis / links. Oscurecido de #a44db2 a #9d44ab para que el
          // texto pase WCAG AA (4.5:1) también sobre cream-card (4.77:1), no solo
          // sobre cream. El violeta sigue siendo prácticamente el mismo.
          DEFAULT: '#9d44ab',
          soft: '#e8d4ed',        // var(--color-miriam-soft) — badge genómico bg
          // Violeta claro para ÉNFASIS sobre fondos oscuros (berenjena): el miriam
          // DEFAULT no contrasta sobre berenjena, este sí (5.46:1, pasa WCAG AA).
          // Usado en el dossier /marcas (titulares e identidad sobre bandas oscuras).
          claro: '#c77dd2',
        },
        // Berenjena un punto más violácea para tarjetas elevadas SOBRE las bandas
        // oscuras (cajas «Carlos Roca» / LinkedIn en /marcas). Texto crema: 12.8:1.
        'berenjena-2': '#3a2350',
        coral: {
          DEFAULT: '#ff6b47',     // var(--color-cta) — ÚNICO color de acción (fondos / decoración)
          hover: '#e5573a',
          // Coral accesible para TEXTO sobre fondos claros: pasa WCAG AA
          // (4.7:1 sobre cream-card, 5.0:1 sobre cream). El coral DEFAULT
          // solo cumple contraste como fondo o como texto sobre berenjena.
          deep: '#bb4128',
          500: '#ff6b47',
          600: '#e5573a',
        },

        // Legacy palette aliases — remapped to DS tokens so existing classNames
        // produce design-system colors without rewriting every template.
        ink: {
          50:  '#faf6f0', // → cream bg
          100: '#f5efe6', // → cream-card
          200: '#ebe2d7', // borders soft
          300: '#c8bdd3',
          400: '#9a8ca8',
          500: '#6b5d75',
          600: '#3a3340', // → tinta soft
          700: '#2d1b3d', // → berenjena
          800: '#2d1b3d', // → berenjena
          900: '#2d1b3d', // → berenjena
          950: '#1c1126', // berenjena profundo (dark sections)
        },
        gold: {
          // Antiguo "gold" → ahora miriam violet
          50:  '#faf2fc',
          100: '#e8d4ed', // → miriam-soft (badge bg)
          200: '#d9b8e2',
          300: '#c69bd2',
          400: '#b870c3',
          500: '#a44db2', // → miriam
          600: '#8a3f97', // hover
          700: '#6b3175', // texto sobre miriam-soft
          800: '#4d2354', // texto deep
          900: '#3a1a40',
          950: '#23102a',
        },
        ocean: {
          // Antiguo "ocean" → también miriam (DS = un solo accent)
          50:  '#faf2fc',
          100: '#e8d4ed',
          200: '#d9b8e2',
          300: '#c69bd2',
          400: '#b870c3',
          500: '#a44db2',
          600: '#8a3f97',
          700: '#6b3175',
          800: '#4d2354',
          900: '#3a1a40',
          950: '#23102a',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      spacing: {
        // Altura del header sticky en ≥sm (h-18). Sin este token, `sm:h-18` era
        // un no-op y el menú se quedaba en 64px (h-16) en todos los tamaños.
        18: '4.5rem',
      },
      borderRadius: {
        btn: '12px',
        card: '16px',
      },
      typography: (theme) => ({
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
