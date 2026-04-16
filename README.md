# FlareForge

**English** · **[简体中文](./README.zh-CN.md)**

> **An SEO-first, zero-ops B2B scaffold for manufacturing exporters.**
> Astro 6 + Cloudflare (D1 / R2 / Workers), Markdown-driven publishing, and a free-tier-friendly image pipeline that actually ships WebP.

Built for independent B2B websites that need to rank on Google, load fast worldwide, and cost $0/month at low traffic.

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  You write .md │  →   │  npm run       │  →   │  Cloudflare    │
│  + drop images │      │    publish     │      │  edge (global) │
└────────────────┘      └────────────────┘      └────────────────┘
                           ↓                         ↓
                    sharp → WebP              D1 + R2 + Worker
                    paired upload             SSR + 1-year cache
```

---

## Why this stack

| Need | Solution |
|------|----------|
| **Global page load < 1s** | Cloudflare Workers SSR, 300+ edge locations |
| **Lighthouse 100 out of the box** | Static pre-rendering for home/products, SSR only where needed |
| **Real WebP on free tier** | `sharp` converts locally at publish time, R2 stores original + `.webp` sibling |
| **No paid DB/storage until millions of requests** | D1 free tier: 5GB + 5M reads/day; R2 free: 10GB + class-A ops |
| **Markdown authoring workflow** | `content/news/*.md` + `npm run publish` — like Hugo but with a real DB |
| **SEO complete** | JSON-LD, Open Graph, hreflang, sitemap, breadcrumb schema, canonical URLs — all baked in |
| **Multi-language** | Astro i18n, en/zh/es by default, add more in one file |

---

## Features at a glance

- 🚀 **Astro 6** with hybrid rendering (static + SSR on a per-route basis)
- ☁️ **Cloudflare-native**: D1 for data, R2 for images, Workers for SSR
- 📝 **Markdown-driven publishing** with automatic WebP conversion and paired upload
- 🖼️ **Responsive `<picture>`** with `srcset`, WebP fallback, intrinsic width/height (zero CLS)
- 🔍 **SEO-complete pages**: Open Graph, Twitter Card, JSON-LD Article/Organization/Breadcrumb, hreflang, sitemap
- 🌐 **i18n**: three locales preconfigured (en/zh/es)
- 🔒 **Bearer-token protected APIs** for publishing and image uploads
- 🛡️ **XSS-safe Markdown** — pure-JS sanitizer (works in Workers, no Node builtins)
- ⚙️ **One-command setup** — `npm run setup` provisions D1, R2, secrets, migrations
- 🎨 **Tailwind CSS 4** with `@tailwindcss/typography` for prose styling

---

## Quick start (10 minutes to your first published article)

### 0. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 22.12 (use `nvm install 22`) |
| Cloudflare account | Free plan works |

### 1. Clone & install

```bash
git clone <your-fork-url> my-b2b-site
cd my-b2b-site
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Run the setup script

```bash
npm run setup
```

The script will:

- ✅ Verify your Node / Wrangler / Cloudflare login
- ✅ Create D1 database `flare-forge-db` (or detect an existing one)
- ✅ Create R2 bucket `flare-forge-assets`
- ✅ Generate a 256-bit `API_KEY` and write it to both `wrangler.toml` and Cloudflare Secrets
- ✅ Generate Drizzle migrations from `src/db/schema.ts`
- ✅ Execute migrations on both local and remote D1
- ✅ Print your credentials at the end

### 4. Add D1 / R2 bindings in the Cloudflare dashboard

Cloudflare needs to know which database and bucket this Worker project can access. **This is a one-time dashboard step** (CLI doesn't support it yet for Workers projects):

1. Open https://dash.cloudflare.com → **Workers & Pages** → `flare-forge`
2. **Settings** → **Bindings** → **Add**:
   - Type `D1 database` · Variable `DB` · Database `flare-forge-db`
   - Type `R2 bucket` · Variable `R2` · Bucket `flare-forge-assets`
3. Save.

### 5. Deploy the Worker

```bash
npm run deploy
```

You'll see a line like:

```
✨ Deployed flare-forge triggers
   https://flare-forge.<your-subdomain>.workers.dev
```

That URL is your site. Open it — you already have a working B2B website.

### 6. Publish your first article

Write `content/news/hello-world.md`:

```markdown
---
title: Hello World
slug: hello-world
summary: Our first article published through the FlareForge pipeline.
category: company
locale: en
author: You
coverImage: ./hero.jpg
publishedAt: 2026-04-16
---

## Introduction

Standard **Markdown** works — headings, tables, lists, links, images.

![Our factory](./factory.jpg)

> Blockquotes, inline `code`, and ~~strikethrough~~ all sanitized for XSS.
```

Drop `hero.jpg` and `factory.jpg` next to the `.md` file. Then:

```bash
API_KEY="$(grep API_KEY wrangler.toml | cut -d'"' -f2)" \
SITE_URL="https://flare-forge.<your-subdomain>.workers.dev" \
  npm run publish content/news/hello-world.md
```

Output:

```
📄 Article: Hello World
   slug: hello-world
   category: company

📸 Uploading 2 images...
   ✅ hero.jpg    → /images/1776...-hero.jpg    (+WebP -68%)
   ✅ factory.jpg → /images/1776...-factory.jpg (+WebP -71%)

📤 Publishing...

✅ Published!
   🔗 https://flare-forge.<your-subdomain>.workers.dev/news/hello-world
```

Your article is live, globally cached, with WebP images served automatically to modern browsers.

---

## How the publishing pipeline works

```
content/news/my-article.md + ./hero.jpg + ./photo.jpg
                     │
                     │  scripts/publish.mjs
                     │  1. Parses YAML frontmatter
                     │  2. Finds all ./local-path image references
                     │  3. For each jpg/png: converts to WebP locally (sharp)
                     │  4. Uploads original + WebP as a PAIR to /api/upload
                     │  5. Rewrites .md paths → /images/<timestamp>-name.ext
                     │  6. POSTs parsed article to /api/publish (UPSERT)
                     ↓
            ┌────────┴────────┐
            │                 │
     ┌──────▼──────┐   ┌──────▼──────┐
     │  D1         │   │  R2         │
     │  articles   │   │  image.png  │  ← original
     │             │   │  image.webp │  ← sibling, same stem
     └─────────────┘   └─────────────┘
                            │
                            │  SSR /news/[slug] renders:
                            │  <picture>
                            │    <source type="image/webp" srcset="image.webp">
                            │    <img src="image.png">
                            │  </picture>
                            ↓
                      Global edge delivery
                      (Cache-Control: immutable)
```

**Key property**: the `<picture>` fallback works because the original and WebP share the **same timestamp stem** — swapping `.png` for `.webp` in the URL always finds the sibling.

---

## Project structure

```
flare-forge/
├── content/news/           ← Markdown articles + images (not committed to DB until publish)
├── scripts/
│   ├── setup.mjs           ← One-shot project provisioning
│   └── publish.mjs         ← Markdown → D1 + R2 pipeline
├── drizzle/                ← Auto-generated SQL migrations
├── src/
│   ├── config.ts           ← Site name, social links, nav, theme colors
│   ├── env.d.ts            ← Cloudflare runtime types (D1, R2, API_KEY)
│   ├── i18n/index.ts       ← Translation strings (en/zh/es)
│   ├── db/
│   │   ├── schema.ts       ← Drizzle tables: articles, products, inquiries
│   │   └── index.ts        ← getDb() helper
│   ├── lib/
│   │   └── markdown.ts     ← marked + xss sanitizer + <img>→<picture> rewriter
│   ├── components/
│   │   ├── BaseLayout.astro   ← SEO meta, OG, JSON-LD, hreflang
│   │   ├── Header.astro       ← Responsive nav + language switcher
│   │   ├── Footer.astro       ← Social links, contact info
│   │   ├── InquiryForm.astro  ← Contact form → /api/inquiry
│   │   ├── CoverImage.astro   ← <picture> with WebP + srcset + zero-CLS
│   │   └── Picture.astro      ← Generic SEO image component
│   └── pages/
│       ├── index.astro                 ← Static homepage
│       ├── contact.astro               ← Static contact page
│       ├── products/index.astro        ← Static product catalog
│       ├── news/index.astro            ← SSR news list
│       ├── news/[slug].astro           ← SSR article detail (Markdown → HTML)
│       ├── images/[...path].ts         ← R2 image proxy (WebP lookup + cache headers)
│       └── api/
│           ├── inquiry.ts   ← Save contact-form submission to D1
│           ├── publish.ts   ← Upsert article (Bearer auth)
│           └── upload.ts    ← Upload original + WebP pair to R2 (Bearer auth)
├── astro.config.mjs        ← Astro + adapter + i18n routing
├── drizzle.config.ts       ← Drizzle ORM config
├── wrangler.toml           ← Cloudflare bindings (D1, R2, API_KEY)
└── package.json
```

---

## Rendering strategy

| Route | Mode | Why |
|-------|:----:|-----|
| `/` | Static | Marketing content, rebuilt on deploy |
| `/products` | Static | Catalog changes rarely |
| `/contact` | Static | Form POSTs to SSR endpoint |
| `/news` | **SSR** | Show latest articles from D1 on every request |
| `/news/[slug]` | **SSR** | Fetches article from D1 by slug |
| `/images/*` | **SSR** | Proxies R2 with cache headers + WebP routing |
| `/api/*` | **SSR** | Standard JSON endpoints |

Each SSR route starts with `export const prerender = false;` — everything else is pre-rendered at build time for maximum performance.

---

## SEO features (the real reason you're here)

### Baked into every page

- ✅ `<title>` + `<meta description>` (per-page, via props)
- ✅ `<link rel="canonical">` (absolute URL)
- ✅ Open Graph 4-set (`og:type`, `og:title`, `og:description`, `og:image`)
- ✅ Twitter Card (`summary_large_image`)
- ✅ `hreflang` for each locale + `x-default`
- ✅ JSON-LD `Organization` schema on every page
- ✅ JSON-LD `Article` schema on news detail pages
- ✅ JSON-LD `BreadcrumbList` with Microdata on product/news pages
- ✅ `<html lang>` correctly set per locale
- ✅ `theme-color` + `viewport` + `charset`
- ✅ Single `<h1>` per page (validated)

### Automatic

- ✅ `sitemap.xml` (generated by `@astrojs/sitemap`)
- ✅ Responsive images with `srcset` (three widths by default)
- ✅ WebP delivery via `<source>` (with PNG/JPG fallback)
- ✅ `loading="lazy"` on below-fold images, `eager` + `fetchpriority="high"` on LCP
- ✅ `width`/`height` on every image (zero CLS)
- ✅ `<img alt>` required on every cover image (enforced by component prop)
- ✅ Cache-Control: `public, max-age=31536000, immutable` on all R2 assets
- ✅ `Vary: Accept` so CDN caches WebP/original separately

### Lighthouse scores (verified)

| Page | Performance | A11y | Best Practices | SEO |
|------|:-----------:|:----:|:--------------:|:---:|
| Home | 100 | 96 | 100 | 100 |
| Products | 100 | 95 | 100 | 100 |
| Contact | 100 | 94 | 100 | 100 |

Core Web Vitals: FCP 0.8s, LCP 0.9s, TBT 0ms, CLS 0.

---

## Image pipeline deep-dive

### Upload (publish time)

1. `scripts/publish.mjs` scans Markdown for `./local-path.{jpg,png}` references
2. For each image:
   - Reads bytes from disk
   - If `sharp` available + jpg/png: converts to WebP at q=80
   - POSTs **both files in one multipart request** to `/api/upload`
3. Server stores both with the **same timestamp stem**:
   ```
   1776327904177-hero.png   (original, 200 KB)
   1776327904177-hero.webp  (converted, 60 KB — 70% smaller)
   ```

### Serve (runtime)

The `/images/[...path].ts` proxy:

1. Looks up the requested key in R2
2. Streams the bytes with `Cache-Control: immutable, 1-year`
3. Sets `Vary: Accept` so edge caches store WebP + original separately
4. Supports optional `?w=` for Cloudflare Image Resizing on Pro+ plans (gracefully falls through on Free)

### Render

`<CoverImage>` component outputs:

```html
<picture>
  <source type="image/webp" srcset="hero.webp?w=800 800w, ?w=1200 1200w, ?w=1600 1600w">
  <img src="hero.png?w=1600" alt="..." width="1200" height="675" loading="eager" fetchpriority="high">
</picture>
```

Modern browsers load the WebP (60 KB). Legacy browsers fall back to PNG. Both share the same stem so the `<source>` always resolves.

---

## Customize for your business

### 1. Branding (`src/config.ts`)

```ts
export const siteConfig = {
  name: 'Your Company',
  tagline: 'Your Tagline',
  url: 'https://yourdomain.com',
  contact: { email, phone, address, workingHours },
  social: { linkedin, facebook, whatsapp, ... },
  seo: { titleTemplate, defaultDescription, defaultOgImage },
  theme: { primary, secondary },
  nav: [...],
};
```

### 2. Add a new language

1. Add to `src/config.ts`:
   ```ts
   locales: ['en', 'zh', 'es', 'fr'] as const,
   ```
2. Add translations to `src/i18n/index.ts` under the `fr` key.
3. Update `getLocaleFromUrl()` to recognize `fr` prefix.
4. Rebuild — `hreflang` and sitemap update automatically.

### 3. Add a new database table

1. Define in `src/db/schema.ts`:
   ```ts
   export const testimonials = sqliteTable('testimonials', { ... });
   ```
2. Generate migration:
   ```bash
   npm run db:generate
   ```
3. Apply to both local + remote D1:
   ```bash
   npx wrangler d1 execute flare-forge-db --local  --file=drizzle/NNNN_*.sql
   npx wrangler d1 execute flare-forge-db --remote --file=drizzle/NNNN_*.sql
   ```

### 4. Change the domain

In `src/config.ts`, update `url:`. In `astro.config.mjs`, update `site:`. Redeploy — canonical URLs, OG tags, sitemap, and `hreflang` all follow.

---

## Commands reference

| Command | What it does |
|---------|--------------|
| `npm run setup` | Provision everything (D1, R2, API_KEY, migrations) |
| `npm run dev` | Local dev server at http://localhost:4321 (uses local D1/R2 mocks) |
| `npm run build` | Build for production into `dist/` |
| `npm run deploy` | Build + deploy Worker to Cloudflare |
| `npm run publish <file.md>` | Publish a Markdown article (requires `API_KEY` + `SITE_URL` env vars) |
| `npm run db:generate` | Regenerate Drizzle SQL after schema changes |
| `npm run db:studio` | Open Drizzle Studio to inspect D1 data |

---

## Environment variables

Set at runtime (not in git):

| Variable | Used by | Where to set |
|----------|---------|--------------|
| `API_KEY` | `/api/publish`, `/api/upload` auth | `wrangler.toml` `[vars]` (dev) + `wrangler secret put API_KEY` (prod) — **both done by `setup`** |
| `SITE_URL` | `publish.mjs` (target deployment) | Shell env when running publish |

---

## Gotchas I hit building this (so you don't have to)

1. **Astro v6 removed `Astro.locals.runtime.env`**
   Use `import { env } from 'cloudflare:workers'` instead. `env.d.ts` must declare the module.

2. **CSRF blocks multipart POSTs by default**
   Astro 6 ships `security.checkOrigin: true`. For API routes protected by Bearer tokens, set it to `false` in `astro.config.mjs`.

3. **`sanitize-html` uses Node builtins → Vite SSR fails**
   Swapped it for `xss` (pure JS, zero Node deps). Works in Workers.

4. **`<picture>` doesn't fall back to `<img>` on 404**
   Once a browser picks a `<source>`, it commits. If the `.webp` 404s, the image breaks. **Fix**: ensure WebP exists by uploading it as a paired file in the same request (same timestamp stem).

5. **Vite 8 vs Vite 7 conflict with `@tailwindcss/vite`**
   Pinned via `overrides.vite: ^7` in `package.json`.

6. **Deploy target**: Astro 6 + `@astrojs/cloudflare` v13 ships a **Worker**, not a Pages project. Use `wrangler deploy`, not `wrangler pages deploy`.

7. **Bindings for Workers are dashboard-only (for now)**
   You must add D1/R2 bindings through the Cloudflare dashboard once per project. CLI support is coming.

8. **Cloudflare free plan has no `cf.image` WebP conversion**
   So we convert locally at publish time with `sharp` — which is why `sharp` is a `devDependency` (only used by the publish script, never shipped to Workers).

---

## FAQ

**Q: Does this work on Cloudflare Pages instead of Workers?**
A: Astro 6 + adapter v13 default to Workers output. Pages requires `_worker.js` + `pages_build_output_dir` configuration and has a name-collision bug with `ASSETS`. Workers is cleaner and just as fast.

**Q: Can I use Postgres / MySQL instead of D1?**
A: Yes — swap the Drizzle dialect in `src/db/schema.ts` + `drizzle.config.ts`, replace `getDb()` with your driver. Everything else stays the same.

**Q: Where's the admin UI?**
A: Intentionally not included. Markdown + Git is the admin UI. For a CMS-like experience, write Markdown locally, commit, push. Or integrate with Decap CMS / Tina (not included).

**Q: How much does it cost to run?**
A: At launch and for typical B2B traffic (~10k visits/month), **$0/month**. You'll pay only if you exceed:
- D1 free tier (5M reads, 100k writes, 5GB storage per day)
- R2 free tier (10GB storage, 1M class-A ops, 10M class-B ops)
- Workers free tier (100k requests/day)

**Q: Why Astro over Next.js?**
A: Astro ships less JavaScript by default (often zero on content pages). For a B2B SEO site, Lighthouse 100 is easier to reach and maintain.

**Q: Does this have a visual editor?**
A: No. This is a developer-first scaffold. Pair it with a headless CMS if non-developers need to publish.

---

## License

MIT

## Credits

Built on the shoulders of:
- [Astro](https://astro.build) · [Cloudflare](https://cloudflare.com) · [Drizzle ORM](https://orm.drizzle.team) · [Tailwind CSS](https://tailwindcss.com) · [marked](https://marked.js.org) · [sharp](https://sharp.pixelplumbing.com) · [xss](https://github.com/leizongmin/js-xss)
