import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const timelineEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  description: z.string(),
  highlight: z.boolean(),
  link: z.string().optional(),
  linkLabel: z.string().optional(),
  image: z.string().optional(),
})

const chapterSchema = z.object({
  order: z.number(),
  title: z.string(),
  subtitle: z.string().optional(),
  excerpt: z.string(),
  translationKey: z.string(),
})

const articleSchema = z.object({
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  excerpt: z.string(),
  translationKey: z.string().optional(),
  references: z
    .array(z.object({ id: z.string(), link: z.string() }))
    .optional(),
})

const teamMemberSchema = z.object({
  role: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.enum(['gold', 'ocean', 'ink']).optional(),
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
})

const pressSchema = z.object({
  articles: z.array(pressItemSchema),
})

const scienceSchema = z.object({
  treatments: z.array(
    z.object({
      line: z.string(),
      regimen: z.string(),
      outcome: z.string(),
      active: z.boolean(),
    }),
  ),
  papers: z.array(
    z.object({
      ref: z.string(),
      finding: z.string(),
      relevance: z.string(),
      link: z.string().nullable().optional(),
    }),
  ),
  panelRows: z.array(
    z.object({
      component: z.string(),
      method: z.string(),
      targets: z.string(),
      implication: z.string(),
    }),
  ),
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
    historia_es: defineCollection({
      type: 'page',
      source: 'es/historia/*.md',
      schema: chapterSchema,
    }),
    historia_en: defineCollection({
      type: 'page',
      source: 'en/story/*.md',
      schema: chapterSchema,
    }),
    ciencia_articles: defineCollection({
      type: 'page',
      source: 'es/ciencia/*.md',
      schema: articleSchema,
    }),
    science_articles: defineCollection({
      type: 'page',
      source: 'en/science/*.md',
      schema: articleSchema,
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
      source: 'es/presss.yml',
      schema: pressSchema,
    }),
    press_en: defineCollection({
      type: 'data',
      source: 'en/press.yml',
      schema: pressSchema,
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
