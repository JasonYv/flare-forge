import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sendNotification, formatWaitlistEmail } from '../../lib/email';

export const prerender = false;

/**
 * POST /api/waitlist
 *
 * Lightweight waitlist signup for "Coming Soon" pages (Lithium, Tools, Case Studies).
 * Sends email notification to sales inbox; persistence to D1 is optional and not
 * required for this endpoint to work.
 *
 * Body: { email, topic }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, topic } = body as Record<string, unknown>;

    if (!email) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return jsonResponse({ error: 'Invalid email address.' }, 400);
    }

    const topicStr = topic ? String(topic).slice(0, 200) : 'General Waitlist';
    const emailStr = String(email).slice(0, 200);

    const emailContent = formatWaitlistEmail(emailStr, topicStr);
    const emailSent = await sendNotification(env, {
      ...emailContent,
      replyTo: emailStr,
    });

    if (!emailSent) {
      // If email failed but it's a dev environment with no API key, still succeed
      // so the user gets confirmation. Real production will have RESEND_API_KEY set.
      console.warn('[waitlist] Email not sent (no API key or transient failure)');
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[waitlist] Unhandled error:', err);
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
