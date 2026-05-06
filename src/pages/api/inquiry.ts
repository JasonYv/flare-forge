import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { inquiries } from '../../db/schema';
import { sendNotification, formatInquiryEmail } from '../../lib/email';

export const prerender = false;

/**
 * POST /api/inquiry
 *
 * Persists a contact / RFQ form submission to D1 and emails a notification
 * to SALES_INBOX via Cloudflare Email Workers.
 *
 * The optional `inquiryType` field (e.g. "distributor", "oem", "general")
 * lets multi-form sites tag the source — it's logged and prefixed onto the
 * email subject so sales can filter in their inbox.
 *
 * Email failures don't abort the request: the inquiry is saved to D1 first,
 * so leads survive transient binding misconfiguration.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      phone,
      country,
      productInterest,
      sku,
      quantity,
      message,
      locale,
      inquiryType,
    } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (inquiryType) {
      console.log(`[inquiry] type=${String(inquiryType)} country=${String(country ?? '-')} company=${String(company ?? '-')}`);
    }

    let dbSaved = false;
    try {
      const db = getDb(env.DB);
      await db.insert(inquiries).values({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 200),
        company: company ? String(company).slice(0, 200) : null,
        phone: phone ? String(phone).slice(0, 50) : null,
        productInterest: productInterest ? String(productInterest).slice(0, 500) : null,
        message: String(message).slice(0, 5000),
        locale: locale ?? 'en',
      });
      dbSaved = true;
    } catch (dbErr) {
      console.error('[inquiry] D1 insert failed:', dbErr);
    }

    // Email notification — best-effort; never blocks the response on failure.
    const { subject, html, text } = formatInquiryEmail({
      name, email, company, phone, country, productInterest, sku, quantity, message,
    });
    const taggedSubject = inquiryType ? `[${String(inquiryType)}] ${subject}` : subject;
    const emailSent = await sendNotification(env, {
      subject: taggedSubject,
      html,
      text,
      replyTo: String(email),
    });

    return new Response(
      JSON.stringify({ success: true, dbSaved, emailSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[inquiry] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
