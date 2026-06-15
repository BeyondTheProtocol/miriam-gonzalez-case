# CLAUDE.md

## About this Project

This is an informational website about **Miriam González Pérez**: a patient with metastatic HR+/HER2- breast cancer with neuroendocrine differentiation (~80%) and FGFR1 ×13 / CCND1 ×20 / 11q13 cluster amplification. The goal is to explain the case to the scientific community, raise funds for an advanced molecular rebiopsy (GoFundMe), and publicly document the process of a patient using AI and an international expert network to navigate precision oncology.

The website has two audiences: scientists/physicians (science page, molecular profile, clinical trials) and general public/donors (story, GoFundMe, timeline).

## Stack & Technical Decisions

### Framework: Nuxt 4 + SSG
- **Nuxt 4** with static generation (`pnpm run generate`). No backend. No database. No custom API.
- Deploy on Vercel/Netlify/Cloudflare Pages connected to GitHub. Every push to `main` triggers automatic redeployment.
- We chose SSG over SSR because content changes infrequently (weekly updates) and we want free serverless hosting.
- Nuxt 4 uses an `app/` directory for all source files (pages, components, assets, layouts).

### SEO: @nuxtjs/seo + @nuxtjs/sitemap + nuxt-ai-ready
- `@nuxtjs/seo` is a meta-module bundling: nuxt-og-image, nuxt-robots, nuxt-schema-org, nuxt-link-checker, nuxt-seo-utils.
- `@nuxtjs/sitemap` generates `/sitemap.xml` with i18n hreflang support — integrates automatically with `@nuxtjs/i18n`.
- `nuxt-ai-ready` generates `/llms.txt` for AI/LLM agent discoverability.
- **Module order matters**: `@nuxtjs/seo` and `@nuxtjs/sitemap` must be listed BEFORE `@nuxt/content` in `nuxt.config.ts`.
- `robots.txt` is managed by `nuxt-robots` — do not put a `robots.txt` in `public/`. The source file is `public/_robots.txt`.
- All pages use `useSeoMeta()` for meta tags. Do not use `useHead()` for SEO-related tags.
- OG images use `nuxt-og-image` via `defineOgImage()`. The template is `app/components/OgImage/Default.takumi.vue`.
- `site.url` and `site.name` in `nuxt.config.ts` feed all SEO modules — Nuxt SEO appends `site.name` to page titles automatically, so page titles should not include " | Miriam González" or " — Miriam González" suffixes.

### i18n: Spanish + English from Day 1
- `@nuxtjs/i18n` with `prefix_except_default` strategy (Spanish without prefix, English at `/en/`).
- UI strings live in `i18n/locales/es.json` and `i18n/locales/en.json`.

### Tailwind CSS
- Custom warm palette: `ink` (warm grays), `ocean` (deep blue for scientific content).
- Typography: **Fraunces** (serif, display/headings), **Source Sans 3** (sans, body), **JetBrains Mono** (mono, scientific data).
- `@tailwindcss/typography` plugin for prose on the story page.
- Custom utility classes in `app/assets/css/main.css`: `.section-container`, `.card-base`, `.tag-gold`, `.tag-ocean`, `.heading-display`, `.link-underline`, `.animate-fade-up`, `.stagger-children`.

### Icons
- `@nuxt/icon` with Phosphor Icons (prefix `ph:`). Examples: `ph:heart-fill`, `ph:flask-fill`, `ph:stethoscope-fill`.

### Analytics: @nuxtjs/plausible
- Privacy-first analytics. Configured with `ignoredHostnames: ['localhost']` so local dev doesn't pollute stats.
- No cookie banner needed (GDPR-compliant by design).

### @vueuse/nuxt
- Provides VueUse composables as Nuxt auto-imports. Currently used in `SiteNav.vue` via `useWindowScroll()` for scroll-aware header styling.

### Contact Form
- Netlify Forms integrated (no backend, no Formspree). The form lives in `app/pages/contacto.vue`.

### GoFundMe Data Sync (live endpoints)
- `/fundraiser.json` (total) and `/donations.json` (donor list → stars + table) are served by **on-request Netlify Functions** that query GoFundMe live and are cached at Netlify's CDN (`Netlify-CDN-Cache-Control` with `stale-while-revalidate`/`stale-if-error`), so the data refreshes **without a redeploy**. `netlify.toml` redirects map those paths to the functions (`force = true`); the Vue components keep fetching the same URLs on mount.
  - `netlify/functions/fundraiser.mts` — one GraphQL call, CDN-cached ~15 min.
  - `netlify/functions/donations.mts` — the public feed fetched in **parallel** (bounded by `donationCount` so it stays within the function time budget), CDN-cached ~1 h with `stale-while-revalidate` (users always get the cached copy instantly; revalidation is background).
- `utils/fundraiser.ts` defines the types (`GoFundMeFundraiser`, `GoFundMeAmount`, `GoFundMeResponse`, `PublicDonation`) and the fetchers: `getFundraiser()`, `getDonations()` (sequential, for the build seed), `getDonationsFast(total?)` (parallel, for the live endpoint), plus `saveFundraiser()/saveDonations()` that write the build-time seed.
- `utils/seed.ts` `readSeed()` reads the build-time `public/*.json` (bundled into the functions via `included_files`) as a fallback when GoFundMe is unreachable, so the total and stars never go blank.
- CLI `pnpm update-fundraiser` (runs at build via `pnpm generate`) regenerates the seed. `public/fundraiser.json` and `public/donations.json` are **gitignored** — never committed, auto-generated at build.
- The previous hourly scheduled function was removed: a Netlify function cannot rewrite the already-deployed static files, so writing `public/*.json` at runtime never reached the served assets (the data only changed on redeploy). The live endpoints replace it.

### Nitro Route Rules
- `/colabora` and `/collaborate` → 301 redirect to `https://helpmiriam.notion.site/colabora`. This is the collaboration guide for new contributors.
- Defined in `nuxt.config.ts` under `nitro.routeRules`.

### Vite optimizeDeps
- `vite.optimizeDeps.include: []` is explicitly set in `nuxt.config.ts` to avoid pre-bundling issues with certain modules during SSG.

### Nuxt Content v3
- `@nuxt/content` v3 active. Collections defined in `content.config.ts`.
- 12 collections: `timeline_es`, `timeline_en`, `historia_es`, `historia_en`, `ciencia_articles`, `science_articles`, `team_es`, `team_en`, `press_es`, `press_en`, `science_es`, `science_en`.
- Timeline: `.yml` files in `content/es/timeline.yml` and `content/en/timeline.yml`.
- Story and science: `.md` files in `content/es/historia/`, `content/en/story/`, `content/es/ciencia/`, `content/en/science/`.
- Team data: `content/es/team.yml` and `content/en/team.yml` (3 groups: `coreTeam`, `medicalNetwork`, `integrativeSupport`).
- Press mentions: `content/es/press.yml` and `content/en/press.yml`.
- Science page data (treatments, papers, panel): `content/es/science.yml` and `content/en/science.yml`.
- Articles/chapters are linked between languages with `translationKey` in frontmatter.
- Language-specific slugs: ES `/ciencia/analisis-fgfr1`, EN `/en/science/fgfr1-analysis` — custom routes configured in `nuxt.config.ts` under `i18n.pages`.
- **Page collections** (`historia_es`, `historia_en`, `ciencia_articles`, `science_articles`) have their schemas extended with `defineRobotsSchema()` and `defineSitemapSchema()`. This enables per-file SEO control via frontmatter (e.g. `robots: noindex`, `sitemap: { priority: 0.8 }`).
- **Data collections** (timeline, team, press, science YML) do NOT have SEO schemas — they are not routed pages.
- If you modify `content.config.ts`, run `pnpm nuxt prepare` to regenerate types.

## Design Decisions

- **Editorial-warm tone**, not clinical or charity-template. The case is scientifically serious but the communication is human and accessible.
- Molecular data (biomarker table, rebiopsy panel) uses `font-mono` and colored tags to visually distinguish important findings.
- Timeline entries with `highlight: true` have a golden dot; normal entries have gray.
- The team is presented **without names** (only profession + country/city). This is intentional: collaborator privacy.
- The story section has a **placeholder with teaser text**. Alba Silvente will write the final content. Don't remove the teaser until the real text arrives.

## The Notebook — annotation alphabet & motion grammar

Root concept that unifies the whole site: **a lab-notebook page that Miriam
annotates by hand**. Real science + a human hand + warmth. Every new visual
solution must be readable as "something annotated in that notebook".

### Annotation alphabet (one mark = one meaning, site-wide)

| Mark | Meaning | Where |
|---|---|---|
| ✦ coral spark | gratitude · donation · action | star map, support CTAs |
| hand-tap icon (`<Nota icon="tap">`) | "you can touch this" (gesture) | glossary hint, star map |
| ✱ magenta asterisk (`<Nota>`) | passive margin/meta note | last-updated stamps, legends |
| Caveat handwriting | scientific annotation, names, captions | two-faces, star-map labels |
| hand-drawn underline (single ink) | emphasis | "dos caras" in the hero |
| graph-paper grid | the page surface | two-faces, star map |

Ink is berenjena `#2d1b3d`. **One accent per piece** — magenta `#9d44ab`
(concept / Miriam) OR coral `#ff6b47` (action / urgency), never both in the
same piece. Science labels in handwriting go UPPERCASE. Never below 11px.

### Motion grammar (psychology, neurodivergence-aware)

> **Motion draws once on entry, then rests.** Animation tells how the stroke
> was made (it paints, traces, ignites) and goes still. Infinite loops are the
> exception, not the rule.

- **Once on entry**: dividers (ECG, DNA) trace on scroll; logo twinkle; the
  hero underline; reveals; the newest star ignites; timeline landing echo.
- **Interaction-driven**: term tooltips, star highlight on tap/hover, CTA
  hearts speed up on hover/press. Always fine — the user asked for it.
- **Perpetual loops: exactly ONE** — the support-CTA heart
  (`heart-beat--alive`), plus the loading splash (disappears by definition).
  "Live" dots beat 3 times on entry and stop. Do not add new infinite loops.
- Always honour `prefers-reduced-motion` (this codebase uses the
  `reduce { animation: none }` override pattern — keep doing it).
- Decorative animation is `aria-hidden`; the data it illustrates must exist
  as text (donor table, sr-only summaries). Interactive pieces need visible
  focus and keyboard operability (e.g., the star-map zoom buttons).
- Coral as TEXT on cream must be `coral-deep #bb4128` (AA). Tap targets
  ≥ 40px. Gestures never hijack page scroll (one finger keeps scrolling).

## Important Clinical Data (don't break these when editing)

These data are medically accurate and should not be modified without verification:

- FGFR1 amplified ×13 (not ×12, not ×14)
- CCND1 amplified ×20
- FGF3/FGF4/FGF19 amplified ×18
- Neuroendocrine differentiation ~80% (not 70%, not 90%)
- Initial Ki67: 60%
- HER2 negative (0)
- Discordant RP: 5% local vs 100% external
- Low TMB, low MSI
- No pathogenic SNVs or INDELs, no fusions
- PIK3CA and ESR1 not detected in primary tissue
- ECOG 1 (since April 2026; ECOG 0 from diagnosis until then)
- Exclusively bone metastases
- Drago 2019 = PMC6825550 (don't confuse with other Drago)
- Spanish trial = NCT04483505 (9.1 vs 1.9 months, FGFR1 protein by IHC)
- PRRT in breast = NCT04529044

## How to Add Content

### New Timeline Entry
Add an object to the `entries` array in `content/es/timeline.yml` and `content/en/timeline.yml` (same object in both files):
```yaml
  - date: 'April 2026 — Week X'
    title: Milestone Title
    description: >
      What happened.
    highlight: true  # or false if minor
    link: 'https://...'  # optional
    linkLabel: 'View on X'  # optional
```

### New Team Member
Add an object to the corresponding array (`coreTeam`, `medicalNetwork`, or `integrativeSupport`) in `content/es/team.yml` and `content/en/team.yml`:
```yaml
- role: Professional Title (City/Country)
  description: What they contribute to the case.
  icon: ph:icon-name-fill
  color: gold  # or ocean or ink
```

### New Press Mention
Add to the `articles` array in `content/es/press.yml` and `content/en/press.yml`:
```yaml
- outlet: Outlet Name
  url: https://...
  title: Article headline
```

### New Clinical Trial / Science Data
Edit `content/es/science.yml` and `content/en/science.yml`. The file has three sections:
- `treatments`: treatment lines (`line`, `regimen`, `outcome`, `active`)
- `papers`: key references (`ref`, `finding`, `relevance`, `link`)
- `panelRows`: rebiopsy panel rows (`component`, `method`, `targets`, `implication`)

### New "Supported By" Logo
1. Place the image in `public/img/` (PNG/JPG) or `public/svg/` (SVG).
2. Add a new `<div>` block to the "Supported By" section in `app/pages/index.vue` (look for `$t('index.supported_by')`).
3. Use the same pattern: `<img src="/img/your-logo.ext" alt="Brand Name" class="h-10 w-auto object-contain" />` and a `<span>` label below.

### Alba's Text (Story)
Replace the placeholder content in `app/pages/historia/index.vue` with the real text. Keep the `prose prose-ink` structure. If the text is long, consider migrating it to `content/es/historia.md` and `content/en/historia.md`.

## Commands

```bash
pnpm dev               # local dev at http://localhost:3000 (auto-fetches fundraiser)
pnpm generate          # generate static site to .output/public/ (auto-fetches fundraiser)
pnpm preview           # preview static build
pnpm update-fundraiser # manually fetch & write public/fundraiser.json (add --force to overwrite)
```

### Code Standards
- Mobile-first CSS (use Tailwind utilities)
- BEM naming for custom CSS
- No `any` in TypeScript
- Accessibility: semantic HTML, proper labels, keyboard navigation

## Pending Tasks

- [x] ~~Replace `YOUR_FORM_ID` in contact~~ → Migrated to Netlify Forms
- [ ] Alba's complete text in story
- [x] ~~Migrate timeline to `.md`~~ → Migrated to YAML in `content/es|en/timeline.yml`
- [x] ~~Configure custom domain~~ → **helpmiriam.com** (configured in `nuxt.config.ts` as `site.url`)
- [ ] Consider adding an RSS feed for timeline updates
- [x] ~~Analytics~~ → `@nuxtjs/plausible` (privacy-first, ignores localhost) — see Stack section for config details

### SEO

- [x] ~~OG image~~ → `nuxt-og-image` with `app/components/OgImage/Default.takumi.vue`; `defineOgImage()` called on index page
- [x] ~~robots.txt~~ → `nuxt-robots` manages it from `public/_robots.txt`
- [x] ~~Sitemap~~ → `@nuxtjs/sitemap` auto-generates with i18n hreflang at `/sitemap.xml`
- [x] ~~AEO~~ → `nuxt-ai-ready` serves `/llms.txt`
- [x] ~~Add favicon~~ → `public/favicon.ico` and `public/favicon.svg` already in place
- [ ] Schema JSON-LD: `Person` (Miriam) + `Article` on science slugs — can use `nuxt-schema-org` (already bundled in `@nuxtjs/seo`)
- [ ] Verify `helpmiriam.com` in Google Search Console and request indexing of key pages
