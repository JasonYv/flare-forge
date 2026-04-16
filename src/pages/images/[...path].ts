import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  avif: 'image/avif',
};

/**
 * GET /images/<...path>?f=webp&w=800&q=80
 *
 * Image serving strategy (works on ALL Cloudflare plans):
 *
 *  1. If `?f=webp` requested → look for pre-converted `.webp` in R2 (stored at upload time)
 *  2. If Pro+ plan → try Cloudflare Image Resizing for on-the-fly resize/format
 *  3. Fallback → serve original from R2
 *
 * SEO headers: Cache 1yr immutable, Vary: Accept, correct Content-Type.
 */
export const GET: APIRoute = async ({ params, request }) => {
  const filePath = params.path;

  if (!filePath) {
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }

  const url = new URL(request.url);
  const fParam = url.searchParams.get('f');
  const wParam = url.searchParams.get('w');
  const hParam = url.searchParams.get('h');
  const qParam = url.searchParams.get('q');
  const fitParam = url.searchParams.get('fit');

  const r2 = env.R2;

  try {
    // ── Strategy 1: Pre-converted WebP lookup ─────────────
    // If ?f=webp and the original is jpg/png, check for a .webp sibling
    if (fParam === 'webp' && /\.(jpe?g|png)$/i.test(filePath)) {
      const webpKey = filePath.replace(/\.[^.]+$/, '.webp');
      const webpObject = await r2.get(webpKey);

      if (webpObject) {
        return new Response(webpObject.body as ReadableStream, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ETag: webpObject.httpEtag,
            Vary: 'Accept',
          },
        });
      }
      // No pre-converted WebP found, try Image Resizing or fallback
    }

    // Fetch original from R2
    const object = await r2.get(filePath);
    if (!object) {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }

    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const originalType =
      object.httpMetadata?.contentType || MIME_MAP[ext] || 'application/octet-stream';

    const isTransformable =
      !originalType.includes('svg') && !originalType.includes('gif');
    const wantsTransform =
      isTransformable && (wParam || hParam || fParam || qParam);

    // ── Strategy 2: Cloudflare Image Resizing (Pro+) ──────
    if (wantsTransform) {
      const width = wParam ? Math.min(Number(wParam), 4096) : undefined;
      const height = hParam ? Math.min(Number(hParam), 4096) : undefined;
      const quality = qParam ? Math.min(Math.max(Number(qParam), 1), 100) : 80;
      const format = fParam === 'webp' || fParam === 'avif' ? fParam : undefined;
      const fit = (['cover', 'contain', 'scale-down', 'crop'] as const).includes(
        fitParam as any,
      )
        ? fitParam!
        : 'scale-down';

      try {
        const originUrl = new URL(`/images/${filePath}`, url.origin);
        const cfResponse = await fetch(originUrl.toString(), {
          cf: {
            image: {
              ...(width && { width }),
              ...(height && { height }),
              quality,
              ...(format && { format }),
              fit,
            },
          },
        });

        if (cfResponse.ok && cfResponse.headers.get('cf-resized')) {
          const headers = new Headers(cfResponse.headers);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('Vary', 'Accept');
          return new Response(cfResponse.body, { status: 200, headers });
        }
      } catch {
        // Image Resizing not available — fall through
      }
    }

    // ── Strategy 3: Raw R2 original ───────────────────────
    const headers: Record<string, string> = {
      'Content-Type': originalType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
      Vary: 'Accept',
    };

    const alt = object.customMetadata?.alt;
    if (alt) headers['X-Image-Alt'] = alt;

    return new Response(object.body as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('R2 image proxy error:', err);
    return new Response(null, { status: 500, statusText: 'Internal Server Error' });
  }
};
