import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sendNotification, formatWaitlistEmail } from '../../lib/email';

export const prerender = false;

/**
 * POST /api/waitlist
 *
 * Lightweight email-only signup for "Coming Soon" / pre-launch pages.
 * Just emails a notification to SALES_INBOX — no D1 persistence by default.
 * If you want a `waitlist` table, add one to db/schema.ts and insert here.
 *
 * Body: { email: string, topic?: string, locale?: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, topic } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return new Response(
        JSON.stringify({ error: 'Valid email required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const safeEmail = String(email).slice(0, 200);
    const safeTopic = topic ? String(topic).slice(0, 200) : 'general';

    const { subject, html, text } = formatWaitlistEmail(safeEmail, safeTopic);
    const emailSent = await sendNotification(env, {
      subject,
      html,
      text,
      replyTo: safeEmail,
    });

    if (!emailSent) {
      console.warn('[waitlist] Email not sent (binding missing or transient failure)');
    }

    return new Response(
      JSON.stringify({ success: true, emailSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[waitlist] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
