# FlareForge

**[English](./README.md)** · **简体中文**

> **为外贸制造业打造的 SEO 优先、零运维 B2B 建站脚手架。**
> Astro 6 + Cloudflare（D1 / R2 / Workers）全栈方案，Markdown 发文工作流，免费套餐也能用真 WebP 的图片优化管线。

专为独立 B2B 网站设计：要排进 Google、全球打开秒开、每月 $0 运行成本。

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  写 .md 文件   │  →   │  npm run       │  →   │  Cloudflare    │
│  配上图片      │      │    publish     │      │  边缘全球分发  │
└────────────────┘      └────────────────┘      └────────────────┘
                           ↓                         ↓
                    sharp 转 WebP             D1 + R2 + Worker
                    配对上传                  SSR + 1 年缓存
```

---

## 为什么选这个技术栈

| 需求 | 方案 |
|------|------|
| **全球打开 < 1 秒** | Cloudflare Workers SSR，全球 300+ 边缘节点 |
| **Lighthouse 天然 100 分** | 首页/产品页静态预渲染，只有需要的页面走 SSR |
| **免费套餐也能用 WebP** | `sharp` 在发布时本地转换，R2 同时存原图和 `.webp` 副本 |
| **流量起来前不用付一分钱** | D1 免费额度：5GB + 500 万读/天；R2 免费：10GB + 上百万次操作 |
| **Markdown 发文工作流** | `content/news/*.md` + `npm run publish`——像 Hugo 但有真数据库 |
| **SEO 一应俱全** | JSON-LD、Open Graph、hreflang、sitemap、面包屑 schema、canonical 全部内置 |
| **多语言** | Astro i18n，默认 en/zh/es，加语言只改一个文件 |

---

## 功能速览

- 🚀 **Astro 6** 混合渲染（按路由选择静态或 SSR）
- ☁️ **Cloudflare 全栈**：D1 存数据、R2 存图片、Workers 跑 SSR
- 📝 **Markdown 发文**：自动转 WebP + 配对上传
- 🖼️ **响应式 `<picture>`**：含 `srcset`、WebP 回退、固定宽高（零 CLS）
- 🔍 **SEO 完整**：OG、Twitter Card、JSON-LD、hreflang、sitemap，全部内置
- 🌐 **i18n**：预置中英西三语
- 🔒 **Bearer Token 鉴权**保护发布和上传 API
- 🛡️ **XSS 安全的 Markdown 渲染**——纯 JS 净化器，兼容 Workers 运行时
- ⚙️ **一键初始化**——`npm run setup` 自动搞定 D1、R2、Secret、数据库迁移
- 🎨 **Tailwind CSS 4** + `@tailwindcss/typography`

---

## 快速开始（10 分钟发第一篇文章）

### 0. 前置要求

| 工具 | 版本 |
|------|------|
| Node.js | ≥ 22.12（推荐 `nvm install 22`） |
| Cloudflare 账号 | 免费版够用 |

### 1. 克隆 & 安装

```bash
git clone <你的仓库地址> my-b2b-site
cd my-b2b-site
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

浏览器会弹出授权页面，点击允许即可。

### 3. 运行初始化脚本

```bash
npm run setup
```

脚本会自动：

- ✅ 检测 Node / Wrangler / Cloudflare 登录状态
- ✅ 创建 D1 数据库 `flare-forge-db`（已存在则直接复用）
- ✅ 创建 R2 存储桶 `flare-forge-assets`
- ✅ 生成 256 位随机 `API_KEY`，同步写入 `wrangler.toml` 和 Cloudflare Secrets
- ✅ 根据 `src/db/schema.ts` 生成 Drizzle 迁移 SQL
- ✅ 在本地和远程 D1 上执行迁移建表
- ✅ 最后打印所有凭证

### 4. 在 Cloudflare Dashboard 添加 D1/R2 绑定

Cloudflare 需要知道这个 Worker 能访问哪些资源。**这一步目前只能在 Dashboard 做**（CLI 暂未支持 Workers 项目的绑定）：

1. 打开 https://dash.cloudflare.com → **Workers & Pages** → `flare-forge`
2. **Settings** → **Bindings** → **Add**：
   - Type 选 `D1 database` · Variable 填 `DB` · Database 选 `flare-forge-db`
   - Type 选 `R2 bucket` · Variable 填 `R2` · Bucket 选 `flare-forge-assets`
3. 保存。

> **什么是"绑定"**：绑定就是告诉 Cloudflare "这个 Pages/Worker 项目里的 `env.DB` 变量指向哪个具体的数据库"。不绑定的话，代码里 `env.DB` 就是 undefined。

### 5. 部署 Worker

```bash
npm run deploy
```

看到这一行说明成功：

```
✨ Deployed flare-forge triggers
   https://flare-forge.<你的二级域名>.workers.dev
```

这个 URL 就是你的网站。打开看看——已经是一个能跑的 B2B 网站了。

### 6. 发布第一篇文章

新建 `content/news/hello-world.md`：

```markdown
---
title: 你好世界
slug: hello-world
summary: 第一篇通过 FlareForge 管线发布的文章。
category: company
locale: zh
author: 你的名字
coverImage: ./hero.jpg
publishedAt: 2026-04-16
---

## 简介

标准 **Markdown** 语法都支持——标题、表格、列表、链接、图片。

![工厂车间](./factory.jpg)

> 引用块、行内 `代码`、~~删除线~~，全部经过 XSS 净化。
```

把 `hero.jpg` 和 `factory.jpg` 放在同一目录下。然后：

```bash
API_KEY="$(grep API_KEY wrangler.toml | cut -d'"' -f2)" \
SITE_URL="https://flare-forge.<你的二级域名>.workers.dev" \
  npm run publish content/news/hello-world.md
```

输出：

```
📄 文章: 你好世界
   slug: hello-world
   分类: company

📸 上传 2 张图片...
   ✅ hero.jpg    → /images/1776...-hero.jpg    (+WebP -68%)
   ✅ factory.jpg → /images/1776...-factory.jpg (+WebP -71%)

📤 发布文章...

✅ 发布成功！
   🔗 https://flare-forge.<你的二级域名>.workers.dev/news/hello-world
```

文章上线，全球边缘缓存，现代浏览器自动加载 WebP。

---

## 发布管线工作原理

```
content/news/my-article.md + ./hero.jpg + ./photo.jpg
                     │
                     │  scripts/publish.mjs
                     │  1. 解析 YAML frontmatter
                     │  2. 扫描正文里所有 ./local-path 图片引用
                     │  3. 对 jpg/png：本地用 sharp 转 WebP
                     │  4. 原图 + WebP 作为配对，一次请求上传到 /api/upload
                     │  5. 替换 .md 里的路径为 /images/<timestamp>-name.ext
                     │  6. POST 解析后的文章到 /api/publish（UPSERT）
                     ↓
            ┌────────┴────────┐
            │                 │
     ┌──────▼──────┐   ┌──────▼──────┐
     │  D1         │   │  R2         │
     │  articles   │   │  image.png  │  ← 原图
     │             │   │  image.webp │  ← 同 stem 副本
     └─────────────┘   └─────────────┘
                            │
                            │  SSR /news/[slug] 渲染：
                            │  <picture>
                            │    <source type="image/webp" srcset="image.webp">
                            │    <img src="image.png">
                            │  </picture>
                            ↓
                      全球边缘分发
                      (Cache-Control: immutable)
```

**关键设计**：原图和 WebP **共享同一个 timestamp 前缀**，`<picture>` 只需把 `.png` 换成 `.webp` 就能找到对应副本。

---

## 项目结构

```
flare-forge/
├── content/news/           ← Markdown 文章 + 图片（发布前不入库）
├── scripts/
│   ├── setup.mjs           ← 一键初始化脚本
│   └── publish.mjs         ← Markdown → D1 + R2 发布管线
├── drizzle/                ← 自动生成的 SQL 迁移
├── src/
│   ├── config.ts           ← 站点名、社交链接、导航、主题色
│   ├── env.d.ts            ← Cloudflare 运行时类型（D1、R2、API_KEY）
│   ├── i18n/index.ts       ← 多语言翻译（en/zh/es）
│   ├── db/
│   │   ├── schema.ts       ← Drizzle 表定义：articles、products、inquiries
│   │   └── index.ts        ← getDb() 工具
│   ├── lib/
│   │   └── markdown.ts     ← marked + xss 净化器 + <img>→<picture> 重写
│   ├── components/
│   │   ├── BaseLayout.astro   ← SEO meta、OG、JSON-LD、hreflang
│   │   ├── Header.astro       ← 响应式导航 + 语言切换器
│   │   ├── Footer.astro       ← 社交链接、联系方式
│   │   ├── InquiryForm.astro  ← 询盘表单 → /api/inquiry
│   │   ├── CoverImage.astro   ← <picture> + WebP + srcset + 零 CLS
│   │   └── Picture.astro      ← 通用 SEO 图片组件
│   └── pages/
│       ├── index.astro                 ← 静态首页
│       ├── contact.astro               ← 静态联系页
│       ├── products/index.astro        ← 静态产品目录
│       ├── news/index.astro            ← SSR 新闻列表
│       ├── news/[slug].astro           ← SSR 文章详情（Markdown → HTML）
│       ├── images/[...path].ts         ← R2 图片代理（WebP 路由 + 缓存头）
│       └── api/
│           ├── inquiry.ts   ← 询盘入库（D1）
│           ├── publish.ts   ← 文章 Upsert（Bearer 鉴权）
│           └── upload.ts    ← 原图 + WebP 配对上传 R2（Bearer 鉴权）
├── astro.config.mjs        ← Astro + adapter + i18n 路由
├── drizzle.config.ts       ← Drizzle ORM 配置
├── wrangler.toml           ← Cloudflare 绑定（D1、R2、API_KEY）
└── package.json
```

---

## 渲染策略

| 路由 | 模式 | 原因 |
|------|:----:|------|
| `/` | 静态 | 营销内容，部署时重建 |
| `/products` | 静态 | 产品目录变化不频繁 |
| `/contact` | 静态 | 表单 POST 到 SSR 端点 |
| `/news` | **SSR** | 每次请求从 D1 读最新文章 |
| `/news/[slug]` | **SSR** | 按 slug 从 D1 读文章 |
| `/images/*` | **SSR** | R2 代理 + 缓存头 + WebP 路由 |
| `/api/*` | **SSR** | 标准 JSON 端点 |

SSR 路由都有 `export const prerender = false;`，其他路由全部静态预渲染，性能最大化。

---

## SEO 特性（你来的真正原因）

### 每页都有

- ✅ `<title>` + `<meta description>`（按页独立，通过 props 传入）
- ✅ `<link rel="canonical">`（绝对 URL）
- ✅ Open Graph 四件套（`og:type` / `og:title` / `og:description` / `og:image`）
- ✅ Twitter Card（`summary_large_image`）
- ✅ `hreflang` 多语言备用链接 + `x-default`
- ✅ 每页都有 JSON-LD `Organization` schema
- ✅ 新闻详情页有 JSON-LD `Article` schema
- ✅ 产品/新闻页有 JSON-LD `BreadcrumbList` Microdata
- ✅ `<html lang>` 按 locale 正确设置
- ✅ `theme-color` + `viewport` + `charset`
- ✅ 每页仅一个 `<h1>`（已验证）

### 自动化

- ✅ `sitemap.xml`（`@astrojs/sitemap` 生成）
- ✅ 响应式图片带 `srcset`（默认三档宽度）
- ✅ WebP 通过 `<source>` 下发（PNG/JPG 作为回退）
- ✅ 非首屏图片 `loading="lazy"`，LCP 图片 `eager` + `fetchpriority="high"`
- ✅ 每张图都有 `width`/`height`（消除 CLS）
- ✅ 封面图 `alt` 文本必填（组件 prop 强制）
- ✅ R2 图片响应头：`Cache-Control: public, max-age=31536000, immutable`
- ✅ `Vary: Accept` 让 CDN 按浏览器能力分别缓存 WebP/原图

### Lighthouse 实测分数

| 页面 | Performance | A11y | Best Practices | SEO |
|------|:-----------:|:----:|:--------------:|:---:|
| 首页 | 100 | 96 | 100 | 100 |
| 产品页 | 100 | 95 | 100 | 100 |
| 联系页 | 100 | 94 | 100 | 100 |

Core Web Vitals：FCP 0.8s、LCP 0.9s、TBT 0ms、CLS 0。

---

## 图片管线深度剖析

### 上传阶段（发布时）

1. `scripts/publish.mjs` 扫描 Markdown 里所有 `./local-path.{jpg,png}` 引用
2. 对每张图：
   - 从磁盘读取字节
   - 有 `sharp` + 是 jpg/png：本地转 WebP（质量 80）
   - 一次 multipart 请求同时上传**原图 + WebP** 到 `/api/upload`
3. 服务器用**同一个 timestamp stem** 存储两份：
   ```
   1776327904177-hero.png   (原图，200 KB)
   1776327904177-hero.webp  (转换后，60 KB —— 小 70%)
   ```

### 服务阶段（运行时）

`/images/[...path].ts` 代理：

1. 在 R2 里查找请求的 key
2. 流式返回字节，带 `Cache-Control: immutable, 1-年`
3. 设置 `Vary: Accept`，让边缘缓存按浏览器能力分别存
4. 支持 `?w=` 参数接 Cloudflare Image Resizing（Pro+ 生效，免费版自动跳过）

### 渲染阶段

`<CoverImage>` 组件输出：

```html
<picture>
  <source type="image/webp" srcset="hero.webp?w=800 800w, ?w=1200 1200w, ?w=1600 1600w">
  <img src="hero.png?w=1600" alt="..." width="1200" height="675" loading="eager" fetchpriority="high">
</picture>
```

现代浏览器加载 WebP（60 KB），老浏览器回退 PNG。两者共享 stem，`<source>` 永远能找到对应文件。

---

## 为你的业务定制

### 1. 改品牌信息（`src/config.ts`）

```ts
export const siteConfig = {
  name: '你的公司',
  tagline: '你的口号',
  url: 'https://yourdomain.com',
  contact: { email, phone, address, workingHours },
  social: { linkedin, facebook, whatsapp, ... },
  seo: { titleTemplate, defaultDescription, defaultOgImage },
  theme: { primary, secondary },
  nav: [...],
};
```

### 2. 加一种语言（比如法语）

1. `src/config.ts` 里加：
   ```ts
   locales: ['en', 'zh', 'es', 'fr'] as const,
   ```
2. `src/i18n/index.ts` 里加 `fr` 的翻译
3. 更新 `getLocaleFromUrl()` 识别 `fr` 前缀
4. 重新构建——`hreflang` 和 sitemap 自动更新

### 3. 加一张新数据表（比如客户评价）

1. 在 `src/db/schema.ts` 里定义：
   ```ts
   export const testimonials = sqliteTable('testimonials', { ... });
   ```
2. 生成迁移：
   ```bash
   npm run db:generate
   ```
3. 同时应用到本地和远程 D1：
   ```bash
   npx wrangler d1 execute flare-forge-db --local  --file=drizzle/NNNN_*.sql
   npx wrangler d1 execute flare-forge-db --remote --file=drizzle/NNNN_*.sql
   ```

### 4. 换域名

在 `src/config.ts` 改 `url:`，在 `astro.config.mjs` 改 `site:`，重新部署——canonical、OG、sitemap、hreflang 自动跟着变。

---

## 命令参考

| 命令 | 作用 |
|------|------|
| `npm run setup` | 一键初始化（创建 D1、R2、API_KEY、迁移建表） |
| `npm run dev` | 本地开发服务器 http://localhost:4321（用本地 D1/R2 mock） |
| `npm run build` | 生产构建到 `dist/` |
| `npm run deploy` | 构建 + 部署 Worker 到 Cloudflare |
| `npm run publish <file.md>` | 发布 Markdown 文章（需 `API_KEY` + `SITE_URL` 环境变量） |
| `npm run db:generate` | schema 改动后重新生成 Drizzle SQL |
| `npm run db:studio` | 打开 Drizzle Studio 查看 D1 数据 |

---

## 环境变量

运行时设置（不要提交到 git）：

| 变量 | 用途 | 设置位置 |
|------|------|----------|
| `API_KEY` | `/api/publish`、`/api/upload` 鉴权 | `wrangler.toml` `[vars]`（dev）+ `wrangler secret put API_KEY`（生产）—— **`setup` 已自动搞定** |
| `SITE_URL` | `publish.mjs` 的目标地址 | 运行 publish 时通过 shell 环境变量传入 |

---

## 我踩过的坑（帮你避一下）

1. **Astro v6 移除了 `Astro.locals.runtime.env`**
   改用 `import { env } from 'cloudflare:workers'`。`env.d.ts` 必须声明这个模块。

2. **CSRF 默认拦截 multipart POST**
   Astro 6 默认开启 `security.checkOrigin: true`。API 路由已经用 Bearer Token 鉴权，在 `astro.config.mjs` 里设为 `false` 即可。

3. **`sanitize-html` 依赖 Node 内置模块 → Vite SSR 挂**
   换成了 `xss` 包（纯 JS，零 Node 依赖），在 Workers 运行时能用。

4. **`<picture>` 遇到 404 不会回退到 `<img>`**
   浏览器一旦选中某个 `<source>` 就锁定了，如果 `.webp` 返回 404 图片就破碎。**解决方案**：把 WebP 作为同一次请求的配对文件上传，服务器用同 stem 存两份，确保总能找到对应文件。

5. **Vite 8 和 `@tailwindcss/vite` 版本冲突**
   `package.json` 里加 `overrides.vite: ^7` 锁定版本。

6. **部署目标是 Workers 不是 Pages**
   Astro 6 + `@astrojs/cloudflare` v13 默认输出 Worker 格式。用 `wrangler deploy`，不是 `wrangler pages deploy`。

7. **Workers 项目的绑定暂时只能通过 Dashboard 配**
   每个项目需要在 Cloudflare Dashboard 手动加 D1/R2 绑定，CLI 支持还在开发中。

8. **Cloudflare 免费套餐没有 `cf.image` 的 WebP 转换**
   所以用 `sharp` 在发布时本地转 WebP——这也是为什么 `sharp` 是 `devDependency`（只 publish 脚本用，不进 Workers）。

---

## 常见问题

**Q：能改用 Cloudflare Pages 吗？**
A：Astro 6 + adapter v13 默认输出 Workers 格式。Pages 需要 `_worker.js` + `pages_build_output_dir` 配置，而且有 `ASSETS` 保留名冲突的 bug。Workers 更干净，速度一样快。

**Q：能换成 PostgreSQL / MySQL 吗？**
A：可以。改 `src/db/schema.ts` 和 `drizzle.config.ts` 里的 Drizzle dialect，把 `getDb()` 换成对应的 driver。其他代码不用动。

**Q：后台管理界面呢？**
A：故意不做。Markdown + Git 就是最好的管理界面。本地写完 `.md`，commit，push 就完事。如果需要可视化，可以接入 Decap CMS / Tina（不在此脚手架内）。

**Q：运行起来多少钱？**
A：B2B 网站的常规流量（~1 万访客/月）基本就是 **$0/月**。只有超过这些免费额度才收费：
- D1 免费：500 万读、10 万写、5GB 存储（每天）
- R2 免费：10GB 存储、100 万次 class-A 操作、1000 万次 class-B 操作
- Workers 免费：10 万请求/天

**Q：为啥不用 Next.js？**
A：Astro 默认不发 JavaScript（内容页通常 0 KB JS）。对于 B2B SEO 站，Lighthouse 100 分更容易做到也更容易维持。

**Q：有可视化编辑器吗？**
A：没有。这是面向开发者的脚手架。如果非技术人员要发文，配一个 headless CMS 就好。

**Q：如何给编辑/客户用？**
A：两种方式：
1. **保持 Markdown 工作流**：给他们一个 Git 仓库 + Typora/VS Code 写 Markdown
2. **接 CMS**：装一个 Decap CMS（免费，静态托管），让他们在 Web 界面编辑，CMS 生成 commit 触发发布
3. **加管理后台**：自己基于 `/api/publish` 和 `/api/upload` 写一个 Astro 页面（约 200 行代码）

---

## License

MIT

## 鸣谢

站在巨人的肩上：
- [Astro](https://astro.build) · [Cloudflare](https://cloudflare.com) · [Drizzle ORM](https://orm.drizzle.team) · [Tailwind CSS](https://tailwindcss.com) · [marked](https://marked.js.org) · [sharp](https://sharp.pixelplumbing.com) · [xss](https://github.com/leizongmin/js-xss)
