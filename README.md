# Pet Signals

An SEO-first blog for **[petsignals.info](https://petsignals.info)** — pet behavior, habits, and how-to guides for dog and cat owners in the US and UK.

## Stack

- **[Astro 7](https://docs.astro.build)** — static HTML, zero client JS by default (great Core Web Vitals)
- **Tailwind CSS v4** via `@tailwindcss/vite`, plus `@tailwindcss/typography` for article prose
- **Content collections** (MDX) validated with Zod
- `@astrojs/sitemap` (git-based `lastmod`) and `@astrojs/rss`

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start dev server at `localhost:4321`        |
| `npm run build`   | Build production site to `./dist/`          |
| `npm run preview` | Preview the production build locally        |
| `npm run check`   | Type-check with `astro check`               |

The dev server can also run in background mode: `astro dev --background`, then `astro dev status` / `astro dev logs` / `astro dev stop`.

## Structure

```text
src/
├── components/
│   ├── blog/       # ArticleCard, ClusterCard, PostMeta, TableOfContents, FaqSection, HowToSteps…
│   ├── global/     # Seo (head + JSON-LD), Header, Footer, Breadcrumbs, Logo
│   └── ui/         # Container, Button, Prose, CtaBanner
├── content/
│   ├── authors/    # *.json author records
│   └── blog/       # *.mdx articles
├── content.config.ts   # collections + Zod schemas
├── layouts/            # BaseLayout, ArticleLayout
├── lib/                # site config, clusters, seo helpers, JSON-LD builders, content queries
├── pages/              # routes (see below)
└── styles/global.css   # Tailwind import + design tokens
```

### Routes

| Route                | Page                                                        |
| :------------------- | :---------------------------------------------------------- |
| `/`                  | Landing — hero, cluster cards, featured + latest guides     |
| `/[cluster]/`        | Cluster hub (pillar) — `pet-behavior`, `pet-habits`, `how-to-guides` |
| `/[cluster]/[slug]/` | Article                                                     |
| `/articles/`         | Archive of every published guide                            |
| `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/404` | Supporting pages          |
| `/rss.xml`, `/llms.txt`, `/sitemap-index.xml`, `/robots.txt` | Discovery           |

## Authoring content

Add an MDX file to `src/content/blog/`. The filename becomes the slug, and the frontmatter is validated at build time.

```yaml
---
title: "Why Does My Dog Bark at Everything?"   # 10–120 chars
description: "One or two sentences, 50–200 chars, used as the meta description." # 50–200
cluster: pet-behavior         # pet-behavior | pet-habits | how-to-guides
publishDate: 2026-09-18
updatedDate: 2026-10-02       # optional — shown to readers + in schema when it differs
author: maya-bennett          # id of a file in src/content/authors/
heroImage: ../../assets/blog/pet-behavior.png   # optional
heroImageAlt: "Descriptive alt text"
tags: ["dog behavior", "barking"]
featured: true                # optional — surfaces on the homepage
draft: false                  # optional — drafts are excluded from the build
faq:                          # optional — rendered visibly, in schema order
  - question: "…"
    answer: "…"
howTo:                        # optional — emits HowTo schema + a visible steps section
  name: "How to trim your dog's nails"
  totalTime: "PT10M"
  steps:
    - name: "Get your dog comfortable"
      text: "…"
---
```

Write body headings as `##` (major sections) and `###` (sub-sections). The page title is the only `<h1>`.

Add authors as JSON files in `src/content/authors/`.

## SEO implementation

- **`src/components/global/Seo.astro`** emits a unique `<title>`, meta description, canonical URL, robots directives, Open Graph + Twitter cards, article metadata, and the JSON-LD `@graph` for every page.
- **`src/lib/schema.ts`** builds one linked `@graph` per page with stable `@id`s — `Organization`, `WebSite`, `WebPage`, `BlogPosting`, `Person`, `ImageObject`, `BreadcrumbList`, `ItemList`, and `HowTo` where relevant.
- **Canonical URLs** are normalised (query stripped, trailing slash enforced) and always match `og:url`.
- **`public/robots.txt`** allows all crawlers, explicitly allows AI crawlers, and points to the sitemap.
- **Sitemap** is generated with `lastmod` derived from git commit times. Excludes `/404`.
- **`/rss.xml`** is a full-content feed; **`/llms.txt`** gives AI systems a map of the site.
- Every page has exactly one `<h1>`, a logical heading order, and visible breadcrumbs that match the `BreadcrumbList` schema.

## Deploying

`npm run build` produces `dist/`. Set `site` in `astro.config.mjs` to your production URL, and add 301 redirects under `redirects` whenever a published slug changes.

## Migrating to Sanity (next step)

Pages read content **only** through `src/lib/content.ts` and `src/lib/schema.ts`. To move to Sanity:

1. Replace the `glob()` loaders in `src/content.config.ts` with a Sanity loader (for example `@sanity/astro` or a custom Content Layer loader).
2. Map Sanity documents onto the same frontmatter shape used here.
3. Reuse the existing schema builders and page templates unchanged.

Keeping the query layer in `src/lib/content.ts` means the templates do not need to change when the content source does.
