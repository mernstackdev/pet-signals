# Pet Signals CMS (Sanity Studio)

Content backend for the Pet Signals blog. This is a **separate app**: it has its own
`package.json`, its own dependencies, and it is **not** part of the Astro frontend build.

```
pet-signals/          ← Astro frontend (builds to dist/, deploys to Cloudflare)
└── cms/              ← this Studio (runs separately, deploys to sanity.studio / your host)
```

The frontend keeps building from Markdown in `src/content/blog/` until it is wired to
Sanity (see [Wiring the frontend](#wiring-the-frontend)).

---

## 1. Create the Sanity project

You need a Sanity account, then either:

**Dashboard (easiest)**

1. Go to <https://sanity.io/manage> → **Create project** → name it `Pet Signals`,
   dataset `production`.
2. Copy the **Project ID**.

**CLI**

```sh
cd cms
npm install
npx sanity login
npx sanity init --project <project-id> --dataset production
```

## 2. Configure and run

```sh
cd cms
cp .env.example .env      # paste your project id
npm run dev               # Studio at http://localhost:3333
```

`.env` (only the `SANITY_STUDIO_` prefix reaches the editor bundle):

```
SANITY_STUDIO_PROJECT_ID=xxxxxxxx
SANITY_STUDIO_DATASET=production
```

Useful commands:

| Command                 | What it does                                        |
| :---------------------- | :-------------------------------------------------- |
| `npm run dev`           | Run the Studio locally                              |
| `npm run typecheck`     | Type-check the schemas                              |
| `npm run build`         | Build the Studio for deployment                     |
| `npm run deploy`        | Deploy to `<project>.sanity.studio`                 |
| `npm run backup`        | Export the dataset to `backups/production.tar.gz`   |

### Import the existing articles

The three starter articles live in the repo as Markdown. Load them into Sanity with:

```sh
npm run import:content   # builds cms/seed.ndjson and prints a summary (no credentials needed)
npm run import:push      # uploads hero images, then upserts the documents
```

`import:push` needs `SANITY_API_WRITE_TOKEN` in `.env`. Without a token you can import the
NDJSON through the CLI instead (after `npx sanity login`):

```sh
npx sanity dataset import seed.ndjson production
```

Either way it creates — idempotently — 3 categories, 1 author, the site-settings singleton,
and 3 posts with their Portable Text bodies, hero images, FAQ and how-to steps. Document ids
are deterministic (`post.<slug>`, `category.<slug>`, `author.<slug>`, `siteSettings`), so
re-running updates the same documents instead of duplicating them.

> The Markdown → Portable Text conversion covers headings, paragraphs, bullet/numbered
> lists, block quotes and inline bold/italic/code/links. The richer blocks (tables,
> callouts, pull quotes, code) are authored in the Studio.

## 3. What's in here

```
cms/
├── sanity.config.ts        # Studio config (plugins, table editing, structure)
├── sanity.cli.ts           # CLI / deploy config
├── structure/index.ts      # Sidebar: Posts → Categories → Authors → Site settings
└── schema/
    ├── index.ts
    ├── documents/          # post, author, category, siteSettings
    └── objects/            # seo, blockContent, table, imageWithAlt, callout,
                            # codeBlock, pullQuote, faqItem, howTo, link, internalLink
```

**Documents**

| Type           | Purpose                                                              |
| :------------- | :------------------------------------------------------------------- |
| `post`         | An article (title, slug, excerpt, category, author, dates, body, FAQ, how-to, related, SEO) |
| `author`       | Byline + Person structured data (job title, bio, photo, `sameAs`, `knowsAbout`) |
| `category`     | Topic hub = frontend "cluster" (`pet-behavior`, `pet-habits`, `how-to-guides`) |
| `siteSettings` | Singleton: site name/URL, publisher, social profiles, SEO defaults    |

**Body (Portable Text)** supports everything you listed:

- Headings **h2–h4** (h1 is reserved for the page title, so the outline stays valid), paragraphs
- **Bulleted and numbered lists**, bold / italic / underline / strike / inline code
- **Block quotes** (built-in `blockquote` style) and an attributed **pull quote** block
- **Images** with required-style alt text and optional caption (`<figcaption>`)
- **Tables** with a header row, using Studio's built-in table editor
- **Callouts** (information / tip / warning / when-to-see-a-vet)
- **Code blocks**
- **Links**: external (`link`) and internal references to posts/categories (`internalLink`)

## 4. SEO fields

Every SEO signal lives on the document, with sensible fallbacks so a well-written post is
already a well-optimised page. Fields are grouped in the editor under **SEO** and
**Structured data**.

| SEO requirement                                  | Where it lives                                    |
| :----------------------------------------------- | :------------------------------------------------ |
| Meta title (50–60 chars, keyword first, unique)  | `post.seo.metaTitle` → falls back to `title`       |
| Meta description (140–155 chars, unique)         | `post.seo.metaDescription` → falls back to `excerpt` |
| Focus keyword (editorial reminder)               | `post.seo.focusKeyword`                           |
| Secondary keywords / Article `keywords`          | `post.seo.keywords`, `post.tags`                  |
| Canonical URL                                    | `post.seo.canonicalUrl`                           |
| Robots `noindex`                                 | `post.seo.noindex`                                |
| Open Graph (`og:title/description/image/url/type`) | `post.seo.openGraph` → falls back to title / description / hero |
| Twitter card (`summary_large_image`)             | `post.seo.twitter`                                |
| Article schema `headline` / `image` / dates      | `post.title`, `post.heroImage`, `publishedAt`, `updatedAt` |
| Article schema `author` (+ `sameAs`)             | `post.author` → `author.name`, `author.sameAs`, `author.jobTitle` |
| Publisher / `Organization`                       | `siteSettings.organizationName`, `organizationLogo`, `sameAs` |
| Breadcrumbs                                      | Derived from `category` + `title`                 |
| FAQ content (AEO + FAQPage data)                 | `post.faq[]`                                      |
| HowTo data (`name`, `steps`, `totalTime`)        | `post.howTo` + `post.howTo.steps[]`               |
| Image alt text + caption                         | required on `imageWithAlt` (used for hero and body images) |
| Internal linking                                 | `internalLink` annotations + `post.relatedPosts`  |

### Why there is no "JSON-LD" field

Structured data is **generated on the frontend from these same fields** rather than stored
as a hand-written JSON blob. Google requires structured data to match the content a reader
can see, so deriving it from the fields that actually render the page is the only way to
guarantee that — and it keeps one source of truth.

The frontend already has the builders (`src/lib/schema.ts`): `Organization`, `WebSite`,
`WebPage`, `BlogPosting`/`Article`, `Person`, `ImageObject`, `BreadcrumbList`, `ItemList`,
plus `FAQPage` and `HowTo` from the `faq` / `howTo` fields above. The mapping is:

| Sanity field                     | JSON-LD property                        |
| :------------------------------- | :-------------------------------------- |
| `title`                          | `headline`                              |
| `excerpt` / `seo.metaDescription`| `description`                           |
| `heroImage` (asset + alt)        | `image` / `ImageObject`                 |
| `publishedAt` / `updatedAt`      | `datePublished` / `dateModified`        |
| `author` ref                     | `author` → `Person`                     |
| `siteSettings`                   | `publisher` → `Organization`, `WebSite`  |
| `category`                       | `articleSection` + `BreadcrumbList`      |
| `seo.keywords` / `tags`          | `keywords`                              |
| `faq[]`                          | `FAQPage.mainEntity`                    |
| `howTo.steps[]`                  | `HowTo.step` (+ `totalTime`)            |

> Note on rich results: Google has scaled back both **FAQ** and **HowTo** rich results for
> most sites. These fields are still worth filling in — they structure the page, help AI
> answer engines cite it, and other engines/consumers use them — but don't expect an FAQ
> accordion in the SERP.

## 5. Notes

- **Tables**: Studio's table editor needs the `table` schema to keep `headerRows` declared,
  and the plugin is switched on globally in `sanity.config.ts`. Don't remove either.
- **Categories**: the `slug` is a fixed list on purpose — it must match a frontend cluster
  slug so URLs line up (`/<category>/<post-slug>/`).
- **Redirects**: renaming a published post's slug needs a redirect in
  `public/_redirects` on the frontend; Sanity can't know about that.
- **Backups**: `npm run backup` writes a dataset export; keep those out of git
  (`cms/backups/` is ignored).

## Publishing triggers a rebuild

The frontend is statically built, so a publish in Sanity only reaches the live site after a
rebuild. Wire that up once:

1. **Cloudflare** → your Worker → **Settings → Builds & deployments** → create a **deploy/build
   hook** and copy its URL.
2. **Sanity** → sanity.io/manage → your project → **API → Webhooks** → create a webhook:
   - **URL**: the Cloudflare hook URL
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type in ["post", "author", "category", "siteSettings"]`
   - **Projection**: `{_id, _type}`
   - **Method**: POST
3. Publish a draft and check that a Cloudflare build starts.

If you skip this, publishing still works — the site just stays on the last build until you
trigger a deploy yourself.

## Wiring the frontend

The frontend reads content through `src/lib/content.ts` and `src/lib/schema.ts` only, so
swapping the Markdown loaders for Sanity is contained:

1. Add `@sanity/client` + `@sanity/image-url` + `@portabletext/to-html` (or use
   `@sanity/astro`) to the **root** project.
2. Replace the `glob()` loaders in `src/content.config.ts` with a Sanity loader, mapping
   the documents onto the same shape the templates expect.
3. Render `body` (Portable Text) with components for `imageWithAlt`, `table`, `callout`,
   `pullQuote`, `codeBlock`.
4. Point the JSON-LD builders at the `faq` / `howTo` fields.

No page templates need to change.
