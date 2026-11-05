import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const timelineEntrySchema = z.object({
  date: z.string(),
  tag: z.string().optional(),
  title: z.string(),
  description: z.string(),
  highlight: z.boolean(),
  link: z.string().optional(),
  linkLabel: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  // Un vídeo de la web dentro del hito (clave de `videoPorId`, utils/videos.ts) y el id que lleva su <li>. Tanda 2, T2c
  // (24-oct-2026): el explicativo del ADC vive en el hito del 7-oct. Hay que declararlos aquí: un campo que el esquema no
  // conoce se descarta al leer la colección y el vídeo no saldría.
  video: z.string().optional(),
  anchor: z.string().optional(),
})

const teamMemberSchema = z.object({
  role: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.enum(['gold', 'ocean', 'ink']).optional(),
  name: z.string().optional(),
  photo: z.string().optional(),
  featured: z.boolean().optional(),
})

const teamSchema = z.object({
  coreTeam: z.array(teamMemberSchema),
  medicalNetwork: z.array(teamMemberSchema),
  integrativeSupport: z.array(teamMemberSchema),
})

const pressItemSchema = z.object({
  outlet: z.string(),
  url: z.string(),
  title: z.string(),
  // Fecha de publicación (ISO o 'YYYY-MM'). Opcional: algunas piezas (TV, RRSS)
  // no tienen fecha exacta verificable.
  date: z.string().optional(),
  // Puesto en la tira «Han contado su caso» de la home (1 = primero). Sin este campo, el medio solo sale en /prensa.
  // Debe declararse aquí: un campo que el esquema no conoce se descarta al leer la colección y la tira saldría vacía.
  home: z.number().int().positive().optional(),
})

const pressSchema = z.object({
  articles: z.array(pressItemSchema),
})

// Feed automático de apariciones (4-nov-2026). Lo escribe `tools/menciones_al_feed.py` de Polaris por PR, nunca a mano ni sin
// verificar; `press.yml` sigue siendo la lista curada por Adri y no tiene ruta de escritura. Todos los campos van declarados: un campo
// que el esquema no conoce se descarta al leer la colección. `country` es el código ISO 3166-1 alfa-2 del medio (no la edición del
// buscador) y `lang` el BCP 47 del titular; la página los pinta con Intl, así ES y EN llevan el mismo dato.
const pressFeedItemSchema = z.object({
  outlet: z.string(),
  url: z.string().url(),
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
  lang: z.string().optional(),
  verified: z.boolean(),
})

const pressFeedSchema = z.object({
  articles: z.array(pressFeedItemSchema),
})

const scienceSchema = z.object({
  treatments: z.array(
    z.object({
      line: z.string(),
      regimen: z.string(),
      outcome: z.string(),
      active: z.boolean(),
      badge: z.string().optional(),
    })
  ),
  papers: z
    .array(
      z.object({
        ref: z.string(),
        finding: z.string(),
        relevance: z.string(),
        link: z.string().nullable().optional(),
      })
    )
    .optional(),
  paperSections: z
    .array(
      z.object({
        title: z.string(),
        // Id de la sección en /ciencia/evidencia: a ella enlazan los ejes terapéuticos de /ciencia (T2c). Estable aunque se reordenen las secciones.
        anchor: z.string().optional(),
        tag: z.string().optional(),
        tone: z.enum(['violet', 'info', 'warn', 'positive', 'neutral']).optional(),
        subtitle: z.string().optional(),
        papers: z.array(
          z.object({
            ref: z.string(),
            finding: z.string(),
            relevance: z.string(),
            link: z.string().nullable().optional(),
          })
        ),
      })
    )
    .optional(),
  panelRows: z.array(
    z.object({
      component: z.string(),
      method: z.string(),
      targets: z.string(),
      implication: z.string(),
      status: z.string().optional(),
      statusTone: z.enum(['hecho', 'curso', 'pendiente', 'no']).optional(),
      linkTo: z.string().optional(),
      linkText: z.string().optional(),
    })
  ),
  imaging: z
    .object({
      title: z.string(),
      date: z.string(),
      center: z.string().optional(),
      summary: z.string(),
      meaning: z.string(),
      quote: z.string().optional(),
      caveat: z.string().optional(),
    })
    .optional(),
})

export default defineContentConfig({
  collections: {
    timeline_es: defineCollection({
      type: 'data',
      source: 'es/timeline.yml',
      schema: z.object({ entries: z.array(timelineEntrySchema) }),
    }),
    timeline_en: defineCollection({
      type: 'data',
      source: 'en/timeline.yml',
      schema: z.object({ entries: z.array(timelineEntrySchema) }),
    }),
    team_es: defineCollection({
      type: 'data',
      source: 'es/team.yml',
      schema: teamSchema,
    }),
    team_en: defineCollection({
      type: 'data',
      source: 'en/team.yml',
      schema: teamSchema,
    }),
    press_es: defineCollection({
      type: 'data',
      source: 'es/press.yml',
      schema: pressSchema,
    }),
    press_en: defineCollection({
      type: 'data',
      source: 'en/press.yml',
      schema: pressSchema,
    }),
    press_feed_es: defineCollection({
      type: 'data',
      source: 'es/press-feed.yml',
      schema: pressFeedSchema,
    }),
    press_feed_en: defineCollection({
      type: 'data',
      source: 'en/press-feed.yml',
      schema: pressFeedSchema,
    }),
    science_es: defineCollection({
      type: 'data',
      source: 'es/science.yml',
      schema: scienceSchema,
    }),
    science_en: defineCollection({
      type: 'data',
      source: 'en/science.yml',
      schema: scienceSchema,
    }),
  },
})
