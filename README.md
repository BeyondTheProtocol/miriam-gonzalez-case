# Miriam González Pérez — Precision Oncology

An informational website about Miriam González Pérez's case: metastatic breast cancer with neuroendocrine differentiation (~80%) and FGFR1 amplification ×13.

## Stack

- **Nuxt 4** — framework
- **Nuxt Content v3** — Markdown/YAML content collections
- **@nuxtjs/i18n** — internationalization ES/EN
- **@nuxtjs/seo** — SEO meta, OG images, robots, sitemap, schema.org
- **@nuxtjs/sitemap** — XML sitemap with i18n hreflang
- **nuxt-ai-ready** — AI/LLM readiness (`/llms.txt`)
- **@nuxtjs/plausible** — privacy-first analytics (ignores localhost)
- **Tailwind CSS** — styles
- **@nuxt/icon** — icons (Phosphor Icons via Iconify)
- **Netlify Functions** — scheduled function for GoFundMe data sync
- **Netlify Forms** — contact form (no backend)

## Setup

```bash
pnpm install
pnpm dev                # local dev at http://localhost:3000
pnpm update-fundraiser  # manually sync GoFundMe progress (add --force to overwrite existing file)
```

Open `http://localhost:3000`.

## Deploy

```bash
pnpm generate
```

Upload the `.output/public/` folder to Vercel, Netlify, or Cloudflare Pages.

For automatic deployment with Vercel:
1. Connect the GitHub repo
2. Framework preset: Nuxt.js
3. Every push to `main` triggers automatic redeployment

## Structure

```
app/
  pages/
    index.vue              → Landing (hero + GoFundMe + molecular profile + thesis)
    ciencia/
      index.vue            → Complete scientific page + article list
      [slug].vue           → Individual science article
    historia/
      index.vue            → Chapter list
      [slug].vue           → Individual chapter with prev/next
    equipo.vue             → Team (anonymous, by profession)
    timeline.vue           → Week-by-week timeline
    contacto.vue           → Contact + Netlify Forms
  components/
    OgImage/
      Default.takumi.vue   → OG image template (nuxt-og-image)
    SiteNav.vue            → Sticky navigation with i18n toggle
    SiteFooter.vue         → Footer
    SectionHero.vue        → Landing hero
    SectionCampaign.vue    → GoFundMe section
    MolecularProfile.vue   → Molecular profile table
    TimelineEntry.vue      → Individual timeline entry
    TeamCard.vue           → Team member card
    PageHeader.vue         → Reusable page header

netlify/functions/
    get-fundraiser-function.mts  → Scheduled (hourly) GoFundMe data sync

utils/
    fundraiser.ts          → GoFundMe GraphQL client + types + save logic

public/
    fundraiser.json        → Static snapshot of GoFundMe progress (gitignored, auto-generated at build time)

content/
  es/  →  timeline.yml, team.yml, press.yml, science.yml, historia/*.md, ciencia/*.md
  en/  →  timeline.yml, team.yml, press.yml, science.yml, story/*.md, science/*.md

i18n/locales/
  es.json           → Spanish strings
  en.json           → English strings
```

## How to Update Content

All content lives in `content/es/` and `content/en/`. Edit the YAML or Markdown files and push to `main` — the site regenerates automatically. See `CONTENT-REPO.md` for full details.

## How to Collaborate

We welcome contributions! Here's how you can help:

### Open an Issue
If you have a good idea, feature request, or notice something that could be improved:
1. Go to the [Issues](https://github.com/ceciCoding/miriam-gonzalez-case/issues) tab
2. Click **New Issue**
3. Describe your idea or suggestion
4. Submit — we'll review it and get back to you

### Pull Requests
- Fork the repository
- Create a feature branch: `git checkout -b feature/your-feature-name`
- Make your changes
- Submit a pull request

### Code Standards
- Mobile-first CSS (use Tailwind utilities)
- BEM naming convention for custom CSS
- No `any` in TypeScript
- Accessibility: semantic HTML, proper labels, keyboard navigation

## TODO

- [x] ~~Add page-specific Open Graph meta tags~~ → `useSeoMeta` on all pages + OG image component
- [x] ~~robots.txt~~ → managed by `nuxt-robots` (`public/_robots.txt`)
- [x] ~~Sitemap~~ → `@nuxtjs/sitemap` with i18n hreflang auto-generated
- [x] ~~AEO / agentic search~~ → `nuxt-ai-ready` serves `/llms.txt`
- [ ] Alba's complete text in `app/pages/historia/index.vue` — will be added gradually
- [x] Add favicon (`public/favicon.ico` or `public/favicon.svg`)
- [ ] Verify `helpmiriam.com` in Google Search Console and request indexing
- [ ] Think about a way to auto-update the timeline from social media posts
- [ ] Talk to Miriam about what images she wants to use
- [x] ~~Research if GoFundMe API can be used instead of iframe~~ → Migrated to Netlify scheduled function + static JSON
