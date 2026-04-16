import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { articles } from '../../db/schema';

export const prerender = false;

/**
 * POST /api/publish
 * Upsert (create or update) a news article. Protected by Bearer Token auth.
 *
 * Upsert behavior: if `slug` already exists, updates the existing row's
 * title/summary/content/etc. while preserving `createdAt`. This makes the
 * publish script idempotent — re-running `npm run publish` on the same .md
 * file will update the article rather than erroring.
 *
 * Headers:
 *   Authorization: Bearer <API_KEY>
 *
 * Body (JSON):
 *   { slug, title, summary, content, coverImage?, category?, locale?, author?, publishedAt? }
 */
export const POST: APIRoute = async ({ request }) => {
  // ── Auth check ──────────────────────────────────────────────
  const apiKey = env.API_KEY;
  const authHeader = request.headers.get('Authorization');

  if (!apiKey || !authHeader || authHeader !== `Bearer ${apiKey}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Parse & validate ────────────────────────────────────────
  try {
    const body = await request.json();
    const { slug, title, summary, content, coverImage, category, locale, author, publishedAt } = body;

    if (!slug || !title || !summary || !content) {
      return new Response(
        JSON.stringify({ error: 'slug, title, summary, and content are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const db = getDb(env.DB);

    const now = new Date().toISOString();
    const values = {
      slug: String(slug).slice(0, 200),
      title: String(title).slice(0, 500),
      summary: String(summary).slice(0, 1000),
      content: String(content),
      coverImage: coverImage ? String(coverImage) : null,
      category: category ? String(category) : 'news',
      locale: locale ?? 'en',
      author: author ? String(author) : null,
      publishedAt: publishedAt ? String(publishedAt) : now,
    };

    // UPSERT: insert, on slug conflict update all fields except createdAt
    const result = await db
      .insert(articles)
      .values(values)
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: values.title,
          summary: values.summary,
          content: values.content,
          coverImage: values.coverImage,
          category: values.category,
          locale: values.locale,
          author: values.author,
          publishedAt: values.publishedAt,
          updatedAt: now,
        },
      })
      .returning({ id: articles.id });

    const created = result[0] !== undefined;

    return new Response(
      JSON.stringify({ success: true, slug, action: created ? 'upserted' : 'updated' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    console.error('Publish error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error.',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
