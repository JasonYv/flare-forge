import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB per file

/**
 * POST /api/upload
 * Upload an image to Cloudflare R2, optionally with a pre-converted WebP sibling.
 *
 * Headers:  Authorization: Bearer <API_KEY>
 * Body:     multipart/form-data
 *
 * Fields:
 *   file      — original image (required, jpg/png/webp/gif/svg)
 *   webpFile  — pre-converted WebP copy (optional; must share the same stem)
 *   alt       — alt text for SEO (optional, max 500 chars)
 *   width     — intrinsic width hint (optional)
 *   height    — intrinsic height hint (optional)
 *
 * Returns:
 *   { success, url, webpUrl?, filename, alt }
 *
 * The original and webpFile share the SAME timestamp prefix so that
 * `<source type="image/webp" srcset="xxx.webp">` can correctly find
 * the sibling by just swapping the extension.
 */
export const POST: APIRoute = async ({ request }) => {
  // ── Auth ─────────────────────────────────────────────────
  const apiKey = env.API_KEY;
  const authHeader = request.headers.get('Authorization');

  if (!apiKey || !authHeader || authHeader !== `Bearer ${apiKey}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const webpFile = formData.get('webpFile');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided. Use form field "file".' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid file type "${file.type}". Allowed: ${[...ALLOWED_TYPES].join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const alt = (formData.get('alt') as string | null)?.slice(0, 500) || '';
    const width = formData.get('width') as string | null;
    const height = formData.get('height') as string | null;

    // Generate shared stem for original + webp sibling
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const baseName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 100);
    const timestamp = Date.now();
    const stem = `${timestamp}-${baseName}`;
    const filename = `${stem}.${ext}`;
    const webpFilename = `${stem}.webp`;

    const r2 = env.R2;
    const meta = {
      alt,
      ...(width && { width }),
      ...(height && { height }),
      originalName: file.name,
    };

    // ── 1. Store original ─────────────────────────────────
    const fileBytes = await file.arrayBuffer();
    await r2.put(filename, fileBytes, {
      httpMetadata: { contentType: file.type },
      customMetadata: meta,
    });

    // ── 2. Store client-provided WebP (if given) ─────────
    let webpUrl: string | null = null;
    if (webpFile instanceof File && webpFile.type === 'image/webp' && webpFile.size > 0) {
      const webpBytes = await webpFile.arrayBuffer();
      await r2.put(webpFilename, webpBytes, {
        httpMetadata: { contentType: 'image/webp' },
        customMetadata: meta,
      });
      webpUrl = `/images/${webpFilename}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: `/images/${filename}`,
        webpUrl,
        filename,
        alt,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error.',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
