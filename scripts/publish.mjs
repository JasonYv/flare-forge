#!/usr/bin/env node

/**
 * publish.mjs — 发布 Markdown 文章到 FlareForge
 *
 * 用法:
 *   node scripts/publish.mjs content/news/my-article.md
 *
 * 它会:
 *   1. 解析 frontmatter (title, slug, summary, category, coverImage...)
 *   2. 扫描正文中的本地图片引用 (./xxx.jpg)
 *   3. 自动上传所有图片到 R2 (POST /api/upload)
 *   4. 替换正文中的图片路径为线上 URL
 *   5. 发布文章到 D1 (POST /api/publish)
 *
 * 环境变量:
 *   SITE_URL  — 站点地址 (默认 http://localhost:4321)
 *   API_KEY   — Bearer Token
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

// Sharp is used ONLY for local WebP conversion at publish time.
// Dynamic import — fails gracefully if sharp isn't installed.
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp 未安装 — 跳过 WebP 本地转换 (npm install sharp)\n');
}

// ── Config ────────────────────────────────────────────────
const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('❌ 请设置 API_KEY 环境变量');
  console.error('   例: API_KEY=xxx node scripts/publish.mjs content/news/my-article.md');
  process.exit(1);
}

const mdPath = process.argv[2];
if (!mdPath) {
  console.error('❌ 请指定 Markdown 文件路径');
  console.error('   例: node scripts/publish.mjs content/news/my-article.md');
  process.exit(1);
}

const fullPath = resolve(mdPath);
if (!existsSync(fullPath)) {
  console.error(`❌ 文件不存在: ${fullPath}`);
  process.exit(1);
}

// ── Parse frontmatter ─────────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.error('❌ 无法解析 frontmatter，请确保文件以 --- 开头和结尾');
    process.exit(1);
  }

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }

  return { meta, content: match[2].trim() };
}

const MIME_MAP = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml',
};

// ── Upload image (with paired WebP in a single request) ─
async function uploadImage(localPath, alt) {
  if (!existsSync(localPath)) {
    console.warn(`   ⚠️  图片不存在，跳过: ${localPath}`);
    return null;
  }

  const fileBytes = readFileSync(localPath);
  const fileName = basename(localPath);
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';

  const formData = new FormData();
  formData.append('file', new Blob([fileBytes], { type: mimeType }), fileName);
  formData.append('alt', alt || fileName);

  // If jpg/png + sharp available, generate WebP locally and send it in the SAME request
  // so the server stores both with the same timestamp stem.
  let webpSavings = '';
  if (sharp && (ext === 'jpg' || ext === 'jpeg' || ext === 'png')) {
    try {
      const webpBytes = await sharp(fileBytes).webp({ quality: 80 }).toBuffer();
      const webpName = fileName.replace(/\.[^.]+$/, '.webp');
      formData.append('webpFile', new Blob([webpBytes], { type: 'image/webp' }), webpName);
      const saved = Math.round((1 - webpBytes.length / fileBytes.length) * 100);
      webpSavings = ` (+WebP ${saved > 0 ? '-' : '+'}${Math.abs(saved)}%)`;
    } catch (e) {
      console.warn(`   ⚠️  WebP 转换失败 ${fileName}: ${e.message}`);
    }
  }

  try {
    const res = await fetch(`${SITE_URL}/api/upload?t=${Date.now()}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`   ❌ ${fileName}: ${err}`);
      return null;
    }

    const data = await res.json();
    console.log(`   ✅ ${fileName} → ${data.url}${data.webpUrl ? webpSavings : ''}`);
    return data.url;
  } catch (err) {
    console.error(`   ❌ ${fileName}: ${err.message}`);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  const raw = readFileSync(fullPath, 'utf-8');
  const { meta, content } = parseFrontmatter(raw);
  const mdDir = dirname(fullPath);

  console.log(`\n📄 文章: ${meta.title || '(无标题)'}`);
  console.log(`   slug: ${meta.slug}`);
  console.log(`   分类: ${meta.category || 'news'}\n`);

  // ── Collect and upload local images ─────────────────────
  // Matches: ![alt](./path.jpg) and coverImage: ./path.jpg
  const localImagePattern = /(?:!\[([^\]]*)\]\((\.\/[^)]+)\))/g;
  const imageMap = new Map(); // ./local-path → /images/remote-url

  // Collect from body
  let match;
  while ((match = localImagePattern.exec(content)) !== null) {
    const [, alt, localRef] = match;
    if (!imageMap.has(localRef)) {
      imageMap.set(localRef, { alt, localPath: resolve(mdDir, localRef) });
    }
  }

  // Collect coverImage
  if (meta.coverImage?.startsWith('./')) {
    if (!imageMap.has(meta.coverImage)) {
      imageMap.set(meta.coverImage, {
        alt: meta.title || 'cover',
        localPath: resolve(mdDir, meta.coverImage),
      });
    }
  }

  // Upload all images
  if (imageMap.size > 0) {
    console.log(`📸 上传 ${imageMap.size} 张图片...\n`);
    for (const [localRef, { alt, localPath }] of imageMap) {
      const remoteUrl = await uploadImage(localPath, alt);
      if (remoteUrl) {
        imageMap.set(localRef, { ...imageMap.get(localRef), remoteUrl });
      }
    }
    console.log('');
  }

  // ── Replace local paths with remote URLs ────────────────
  let finalContent = content;
  let finalCover = meta.coverImage || null;

  for (const [localRef, info] of imageMap) {
    if (info.remoteUrl) {
      // Replace in body: ![alt](./local) → ![alt](/images/remote)
      finalContent = finalContent.split(localRef).join(info.remoteUrl);
      // Replace coverImage
      if (finalCover === localRef) {
        finalCover = info.remoteUrl;
      }
    }
  }

  // ── Publish article ─────────────────────────────────────
  console.log('📤 发布文章...');

  const payload = {
    slug: meta.slug,
    title: meta.title,
    summary: meta.summary,
    content: finalContent,
    category: meta.category || 'news',
    locale: meta.locale || 'en',
    author: meta.author || null,
    coverImage: finalCover,
    publishedAt: meta.publishedAt
      ? new Date(meta.publishedAt).toISOString()
      : new Date().toISOString(),
  };

  const res = await fetch(`${SITE_URL}/api/publish?t=${Date.now()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`\n❌ 发布失败: ${err}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log(`\n✅ 发布成功！`);
  console.log(`   🔗 ${SITE_URL}/news/${result.slug}`);
}

main().catch((err) => {
  console.error('❌ 未知错误:', err);
  process.exit(1);
});
