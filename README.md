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
- **`/rss.xml`** is a full-content feed.
- Every page has exactly one `<h1>`, a logical heading order, and visible breadcrumbs that match the `BreadcrumbList` schema.

## LLM / AI features

Every article is also published as clean Markdown and advertised for AI agents, following the **llms.txt v2** discovery conventions (August 2026).

- **`/<cluster>/<slug>.md`** — a Markdown version of each article (`text/markdown`) with byline, body, how-to steps, and FAQ. Excluded from the sitemap.
- **`<link rel="alternate" type="text/markdown">`** on each article points to that Markdown URL.
- **`<link rel="describedby" href="/llms.txt">`** tells agents which llms.txt covers the page.
- **`/llms.txt`** lists topics and links each article to its Markdown version; **`/llms-full.txt`** bundles every article into one document.
- **Page actions bar** at the top of each article:
  - **Copy page** → *Copy as Markdown* (fetches the `.md` URL to the clipboard), *View as Markdown*, *Copy link*.
  - **Open in** → ChatGPT, Claude, Perplexity, or Grok, pre-filled with a prompt pointing at the article.
  - **llms.txt** → the AI resource index.

## Reading experience

- **Read mode** (article pages): a distraction-free view that hides navigation, breadcrumbs, the actions bar, the table of contents and related content, with **text size** (5 steps) and **theme** (Light / Sepia / Dark) controls. Choices persist in `localStorage` and are applied before first paint, so there is no flash.
- Refined `prose-lg` typography with a comfortable measure and underlined, brand-coloured links.
- Sticky **table of contents** on desktop with **scroll-spy** highlighting, plus a collapsible **On this page** panel on mobile.
- **Reading progress bar** and a **Back to top** button.
- **Clickable heading anchors** on every `##` / `###` for easy deep-linking.
- Byline shows published / updated dates and an estimated reading time. The author bio appears once, at the end of the article.
- **Mobile-first**: compact single-row scrollable header, a short "Back to …" breadcrumb link instead of a long trail, a horizontally scrollable actions bar with 44px tap targets, and a full-bleed hero image.

## Deploying

`npm run build` produces `dist/`.

No domain is hardcoded. The canonical origin is resolved automatically, in this order:

1. `SITE_URL` (or `PUBLIC_SITE_URL`) environment variable, if set.
2. The host's own variable — `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` (Vercel), `URL` / `DEPLOY_PRIME_URL` (Netlify), `CF_PAGES_URL` (Cloudflare Pages).
3. `http://localhost:4321` for local development.

That single origin feeds canonical URLs, JSON-LD `@id`s, the sitemap, RSS, `/llms.txt`, `/llms-full.txt`, the per-article `.md` alternates, and `robots.txt`. So locally everything points at `http://localhost:4321`, and in production it follows the deploy URL with no code change. To pin a specific domain (recommended in production), set it explicitly:

```sh
SITE_URL=https://your-domain.com npm run build
```

Add 301 redirects under `redirects` in `astro.config.mjs` whenever a published slug changes.

## Testing performance and SEO

Run Lighthouse against the **production build**, never the dev server:

```sh
npm run build && npm run preview   # then audit http://localhost:4321
```

`astro dev` serves unminified CSS/JS, an HMR client, and (when enabled) the Astro dev
toolbar — which on its own injects a non-descriptive "Learn more" link and tanks the
performance score. The dev toolbar is disabled in `astro.config.mjs` so dev audits
stay meaningful, but the production build is the number that matters.

> **Note:** the stylesheet is inlined into every page (`build.inlineStylesheets: 'always'`).
> That removes the render-blocking `<link rel="stylesheet">` and the HTML → CSS critical
> chain, so first paint depends only on the HTML — which keeps Speed Index fast and stable
> on slow mobile connections. The trade-off is that CSS is not cached across page views.

## Deploy to Cloudflare

The site is fully static (`output: 'static'`) and deploys as a **Cloudflare Workers static-assets**
project — no adapter and no Worker script. `wrangler.toml` points the assets directory at `./dist`.

### Git integration (Workers Builds)

Cloudflare builds on every push with these settings:

- **Build command**: `npm run build`
- **Deploy command**: `npx wrangler deploy` (the default — `wrangler.toml` supplies the assets)
- **Build variables** — set them for **both Production and Preview**:
  - `SITE_URL` = `https://petsignals.info` — drives canonical URLs, JSON-LD `@id`, the sitemap,
    RSS, `/llms.txt` and the `.md` alternates. Without it the build falls back to
    `http://localhost:4321` and logs a warning.
  - `NODE_VERSION` = `22.12.0` — also pinned in `.nvmrc`

> The `name` in `wrangler.toml` (`pet-signals`) must match the Worker name in the dashboard,
> otherwise the build deploys to a different Worker than the one your domain points at.

### Wrangler CLI

```sh
npx wrangler login      # once
npm run deploy          # builds, then `wrangler deploy`
npm run preview:cf      # local Workers runtime that applies _headers / _redirects
```

### What ships in the build

- **`_headers`** — immutable `Cache-Control` for `/_astro/*`, `Content-Type: text/markdown` for the
  `.md` alternates, `text/plain` for the `llms*.txt` files, plus security headers and
  `No-Vary-Search` so tracking parameters don't split the edge cache.
- **`_redirects`** — add real `301`s here when a published slug changes.
- **`404.html`** — served for unknown paths (`not_found_handling = "404-page"`).
- `html_handling = "auto-trailing-slash"` redirects `/about` → `/about/`, matching the canonical
  URLs the site emits.

A local `.env` is **not** deployed (it is gitignored), so `SITE_URL` must be set as a build
variable. After the first deploy, add `petsignals.info` under the Worker's
**Settings → Domains & Routes**.

### Publishing (Sanity → rebuild)

Content lives in Sanity (`cms/`), so publishing needs a rebuild to reach the live site.
Create a Cloudflare deploy hook and point a Sanity webhook at it — see
[`cms/README.md` → Publishing triggers a rebuild](./cms/README.md#publishing-triggers-a-rebuild).

### Prefer classic Pages?

Cloudflare Pages works too — build command `npm run build`, output directory `dist`, and **no**
deploy command. To use it, change `wrangler.toml` back to
`pages_build_output_dir = "./dist"` and deploy with `wrangler pages deploy`.

## Content backend (Sanity)

The CMS lives in **[`cms/`](./cms/README.md)** — a standalone Sanity Studio with its own
`package.json`. It is deliberately **not** part of this frontend build:

- only `src/` is built into `dist/` — nothing under `cms/` is ever bundled
- `cms` is excluded in `tsconfig.json`, so the Studio is not type-checked with the site
- Tailwind's source scan excludes it via `@source not "../../cms"` in `src/styles/global.css`

Run it separately:

```sh
cd cms && npm install && cp .env.example .env   # then npm run dev
```

It models **posts** (rich Portable Text: tables, lists, images with alt text, quotes,
callouts, code), **authors**, **categories**, a **site-settings** singleton, and the full
**SEO field set** (meta title/description, canonical, noindex, Open Graph, Twitter, FAQ,
How-To, keywords). See [`cms/README.md`](./cms/README.md) for setup, the SEO field
reference, and how each field maps to JSON-LD.

### Wiring the frontend to Sanity

Pages read content **only** through `src/lib/content.ts` and `src/lib/schema.ts`, so the swap
is contained:

1. Add `@sanity/client` (+ `@sanity/image-url`, `@portabletext/to-html`) to this project.
2. Replace the `glob()` loaders in `src/content.config.ts` with a Sanity loader that maps
   documents onto the same shape the templates expect.
3. Render Portable Text with components for `imageWithAlt`, `table`, `callout`, `pullQuote`
   and `codeBlock`.
4. Point the JSON-LD builders at the `faq` / `howTo` fields.

No page templates need to change.
