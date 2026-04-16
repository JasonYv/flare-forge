import { marked } from 'marked';
import xss, { type IFilterXSSOptions } from 'xss';

/** Standard responsive widths for article images */
const SRCSET_WIDTHS = [480, 800, 1200];

/** Replace extension to get the pre-converted WebP sibling key */
function webpSrc(src: string): string {
  return src.replace(/\.[^.]+$/, '.webp');
}

function imgUrl(src: string, w: number): string {
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${w}&q=80`;
}

function buildSrcset(src: string): string {
  return SRCSET_WIDTHS.map((w) => `${imgUrl(src, w)} ${w}w`).join(', ');
}

/**
 * Rewrite a plain <img> into a <picture> with WebP source + fallback srcset.
 * Skips external URLs, SVGs, GIFs, and data URIs.
 */
function rewriteImgToPicture(imgTag: string): string {
  const srcMatch = imgTag.match(/src="([^"]*)"/);
  const altMatch = imgTag.match(/alt="([^"]*)"/);
  if (!srcMatch) return imgTag;

  const src = srcMatch[1];
  const alt = altMatch?.[1] ?? '';

  if (
    src.startsWith('http') ||
    src.startsWith('data:') ||
    src.endsWith('.svg') ||
    src.endsWith('.gif')
  ) {
    return imgTag;
  }

  const sizes = '(max-width: 768px) 100vw, 800px';
  return [
    '<picture>',
    `  <source type="image/webp" srcset="${buildSrcset(webpSrc(src))}" sizes="${sizes}">`,
    `  <img src="${imgUrl(src, 800)}" srcset="${buildSrcset(src)}" sizes="${sizes}"`,
    `       alt="${alt}" loading="lazy" decoding="async" class="rounded-lg">`,
    '</picture>',
  ].join('\n');
}

/** XSS sanitizer config — whitelist common article tags/attrs */
const xssOptions: IFilterXSSOptions = {
  whiteList: {
    a: ['href', 'title', 'target', 'rel'],
    b: [], i: [], em: [], strong: [], mark: [], del: [], ins: [], sub: [], sup: [],
    p: [], br: [], hr: [],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    ul: [], ol: [], li: [],
    blockquote: [],
    code: ['class'],
    pre: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'class'],
    picture: [],
    source: ['srcset', 'sizes', 'type'],
    figure: [], figcaption: [],
    details: [], summary: [],
  },
  onTagAttr(tag, name, value) {
    // Auto add rel/target to external links
    if (tag === 'a' && name === 'href' && value.startsWith('http')) {
      // Signal to add extra attrs via onTag
    }
  },
  onTag(tag, html, options) {
    if (tag === 'a' && options.isWhite && !options.isClosing) {
      // Parse href; if external, inject target + rel
      const hrefMatch = html.match(/href="([^"]*)"/);
      if (hrefMatch && hrefMatch[1].startsWith('http')) {
        if (!/rel=/.test(html)) {
          html = html.replace(/>$/, ' rel="noopener noreferrer">');
        }
        if (!/target=/.test(html)) {
          html = html.replace(/>$/, ' target="_blank">');
        }
        return html;
      }
    }
    return undefined; // use default handling
  },
};

/**
 * Parse Markdown → sanitized, SEO-optimized HTML.
 *
 * Pipeline:
 *   1. marked: Markdown → HTML
 *   2. xss: strip dangerous tags/attrs (pure JS, zero Node deps, CF-compatible)
 *   3. img → picture rewrite: WebP source + responsive srcset
 */
export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw, { async: false }) as string;
  const sanitized = xss(html, xssOptions);
  return sanitized.replace(/<img\s[^>]*>/g, rewriteImgToPicture);
}
