import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { inquiries } from '../../db/schema';
import { sendNotification, formatInquiryEmail } from '../../lib/email';

export const prerender = false;

/**
 * POST /api/inquiry
 *
 * Universal endpoint for both Contact form and Quote/RFQ form.
 * Persists to D1 (if available) and sends notification email to sales inbox via Resend.
 *
 * Either persistence layer can fail without breaking the user-facing response —
 * we degrade gracefully so a partial outage still captures leads.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      name,
      email,
      company,
      phone,
      message,
      productInterest,
      sku,
      country,
      quantity,
      locale,
      inquiryType,
    } = body as Record<string, unknown>;

    if (!name || !email || !message) {
      return jsonResponse({ error: 'Name, email, and message are required.' }, 400);
    }

    if (inquiryType) {
      console.log(`[inquiry] type=${String(inquiryType)} country=${String(country ?? '-')} company=${String(company ?? '-')}`);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return jsonResponse({ error: 'Invalid email address.' }, 400);
    }

    // === Persist to D1 (best-effort) ===
    let dbSaved = false;
    try {
      if (env.DB) {
        const db = getDb(env.DB);
        await db.insert(inquiries).values({
          name: String(name).slice(0, 200),
          email: String(email).slice(0, 200),
          company: company ? String(company).slice(0, 200) : null,
          phone: phone ? String(phone).slice(0, 50) : null,
          productInterest: productInterest ? String(productInterest).slice(0, 500) : null,
          message: String(message).slice(0, 5000),
          locale: typeof locale === 'string' ? locale : 'en',
        });
        dbSaved = true;
      }
    } catch (dbErr) {
      console.error('[inquiry] D1 insert failed:', dbErr);
      // continue — email is the primary delivery channel
    }

    // === Send notification email (best-effort) ===
    const emailContent = formatInquiryEmail({
      name, email, company, phone, country, productInterest, sku, quantity, message,
    });

    // Override subject for typed inquiries so sales inbox can triage at a glance
    let subject = emailContent.subject;
    if (inquiryType === 'distributor') {
      subject = `AltusVolt Distributor RFQ from ${String(country || 'Unknown')} — ${String(company || name)}`;
    } else if (inquiryType === 'oem') {
      subject = `AltusVolt OEM RFQ from ${String(country || 'Unknown')} — ${String(company || name)}`;
    }

    const emailSent = await sendNotification(env, {
      ...emailContent,
      subject,
      replyTo: String(email),
    });

    // If both channels failed, return error so user retries / reaches out via mailto
    if (!dbSaved && !emailSent) {
      return jsonResponse(
        { error: 'Submission could not be processed. Please email sales@altusvolt.com directly.' },
        503,
      );
    }

    return jsonResponse({ success: true, dbSaved, emailSent });
  } catch (err) {
    console.error('[inquiry] Unhandled error:', err);
    return jsonResponse({ error: 'Internal server error.' }, 500);
  }
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
