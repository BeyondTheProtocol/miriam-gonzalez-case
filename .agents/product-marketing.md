# Product Marketing Context

*Last updated: 2026-06-05*

> Note: This is **not a SaaS product** — it is an informational + fundraising website
> for a real medical case (helpmiriam.com). The standard product-marketing template
> has been adapted accordingly. "Conversion" here means a GoFundMe donation or a
> scientific/clinical contact, not a purchase or signup.

## Overview
**One-liner:** Open, bilingual documentation of Miriam González's ultra-rare metastatic breast cancer case — built to recruit scientific expertise and fund an advanced molecular rebiopsy.

**What it is:** A Nuxt 4 static site (ES default, EN at `/en/`) that explains a metastatic HR+/HER2− breast cancer with neuroendocrine differentiation (~80%) and an FGFR1 ×13 / CCND1 ×20 / 11q13 amplification cluster. It documents the molecular profile, treatment history, and clinical evidence; tells the human story; and drives donations to a GoFundMe campaign for an advanced molecular rebiopsy. It also publicly documents a patient using AI + an international expert network to navigate precision oncology.

**Category:** Patient-led precision-oncology case site / medical crowdfunding cause.

**Type:** Non-profit informational + fundraising site. No backend, no database, SSG.

**Model:** Donation-funded (GoFundMe). Primary campaign: https://gofund.me/60665ab35

## Audiences
This site serves **two distinct audiences** — keep both in mind for every page:

1. **Scientists / physicians** (oncologists, molecular pathologists, researchers, trial PIs)
   - Enter via: Science page, molecular profile tables, clinical-trial references.
   - Want: rigorous, accurate, citable clinical data; reasons the case is unusual.
   - Conversion: get in touch / collaborate / suggest trials or analyses.

2. **General public / donors** (community, press, supporters)
   - Enter via: Story, Timeline, GoFundMe, social (X/Twitter @miriamgonp).
   - Want: a clear human story, trust, transparency about where money goes.
   - Conversion: donate, share, follow updates.

## The Problem (why this exists)
- Miriam's tumor has an **ultra-rare molecular profile** that does not fit standard treatment guidelines, so off-the-shelf protocols are a poor match.
- Identifying the right targeted/precision approach requires an **advanced molecular rebiopsy** and panel analyses that are not covered by standard care.
- Without external funding and expert input, the case risks being treated as generic rather than precision-matched.
- Emotional tension: a time-sensitive, life-threatening diagnosis navigated largely by the patient herself, in public.

## Differentiation / What makes the case notable
- BC with **neuroendocrine differentiation (~80%)** + **FGFR1 ×13**, **CCND1 ×20**, **FGF3/FGF4/FGF19 ×18**, 11q13 cluster.
- **SSTR-positive** (somatostatin-receptor) → rationale for PRRT exploration (NCT04529044).
- FGFR1-protein-by-IHC predictive signal (Spanish trial NCT04483505: 9.1 vs 1.9 months).
- Exclusively bone metastases, ECOG 0 (April 2026), low TMB / low MSI, HER2 0 (ultralow mention).
- A documented, open, AI-assisted, expert-network-driven precision-oncology journey.

## The Ask (conversion actions)
- **Primary:** Donate via GoFundMe → https://gofund.me/60665ab35 (secondary link: https://gofund.me/3e25cae99).
- **Secondary (scientific):** Contact / collaborate — suggest analyses, trials, or connect experts.
- **Tertiary:** Follow & share updates (X/Twitter @miriamgonp; weekly timeline updates).

## Brand Voice
- **Tone:** Editorial-warm — scientifically serious but human and accessible. **Not** clinical-cold, **not** charity-template / pity-driven.
- **Style:** Clear, precise, honest. Lead with facts; let the gravity speak for itself.
- **Personality:** Rigorous, transparent, dignified, hopeful, human.
- **Bilingual parity:** Every user-facing string exists in both `es.json` and `en.json`. Spanish is the source of truth (default locale).

## Proof Points
- Verifiable molecular data (see "Clinical accuracy" constraints below).
- Press mentions (`content/*/press.yml`).
- Public timeline with linked primary sources (X threads, etc.).
- International medical/scientific network (shown **without names** for privacy).
- Transparency block on fund usage in the campaign section.

## Hard Constraints (do not violate)
- **Clinical accuracy is non-negotiable.** Never alter the medical data in AGENTS.md
  (FGFR1 ×13, CCND1 ×20, FGF3/4/19 ×18, NED ~80%, Ki67 60%, HER2 0/ultralow,
  discordant RP 5% vs 100%, low TMB/MSI, no pathogenic SNVs/INDELs/fusions,
  PIK3CA/ESR1 not detected in primary, ECOG 0, bone-only mets, Drago 2019 =
  PMC6825550, NCT04483505, NCT04529044). Verify before changing any number or claim.
- **Collaborator privacy:** the team is presented by profession + country/city only,
  **never names**. Do not add names.
- **Ethical persuasion only.** This is a real medical fundraiser: no fabricated
  urgency, no fake scarcity, no manipulative dark patterns, no invented testimonials
  or metrics. Honesty and dignity over conversion tricks.
- **Brand identity is intentional** (warm cream/purple/coral palette, Fraunces +
  Source Sans 3 + JetBrains Mono). Do not "de-brand" toward generic templates.
- **Story page** keeps the teaser placeholder until Alba Silvente's final text arrives.

## Goals
- **Primary goal:** Fund the advanced molecular rebiopsy via GoFundMe.
- **Secondary goal:** Recruit scientific/clinical expertise and trial leads.
- **Key conversion action:** GoFundMe donation; scientific contact form submission.
- **Discoverability:** strong SEO + AEO (schema.org, sitemap hreflang, /llms.txt) so
  both researchers and donors can find the case.

## Tech context (for marketing skills that touch code)
- Nuxt 4 SSG, `@nuxtjs/seo` (schema-org, og-image, robots, link-checker), `@nuxtjs/sitemap`,
  `nuxt-ai-ready` (/llms.txt), `@nuxtjs/plausible` (privacy-first analytics, no cookie banner),
  `@nuxtjs/i18n` (prefix_except_default).
- SEO meta via `useSeoMeta()` only (never `useHead()` for SEO tags). OG via `defineOgImage()`.
- Global JSON-LD (`definePerson` + `defineWebSite`) lives in `app/layouts/default.vue`;
  `defineArticle` on science/story slug pages.
- UI copy: `i18n/locales/es.json` + `en.json`. Campaign copy under the `gofundme.*` keys.
