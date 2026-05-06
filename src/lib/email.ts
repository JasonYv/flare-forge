/**
 * Email delivery via Cloudflare Email Workers (Send Email binding).
 *
 * Why CF Email Workers and not Resend / SendGrid:
 *   - Native binding — no third-party API key, no monthly quota
 *   - No outbound HTTP call from the Worker (lower latency, fewer failure modes)
 *   - Free as part of Cloudflare Email Routing
 *
 * The trade-off: recipients MUST be addresses verified in your Email Routing
 * destinations. Cloudflare blocks sending to arbitrary external addresses to
 * prevent abuse. For a B2B lead-capture site that's not a problem — you're
 * sending notifications to your own inbox, not transactional mail to customers.
 *
 * Setup (per project):
 *   1. Cloudflare dashboard → your domain → Email → Email Routing → Enable.
 *   2. Add and verify a destination address (e.g. you@gmail.com).
 *   3. Set SALES_INBOX secret to that destination:
 *        npx wrangler secret put SALES_INBOX
 *   4. wrangler.toml has the [[send_email]] name = "SEND_EMAIL" binding.
 *   5. Optionally set EMAIL_FROM_ADDRESS / EMAIL_FROM_NAME secrets to
 *      override the From: header (defaults to noreply@<your-domain>).
 *
 * Gracefully no-ops when the binding is missing (useful for `astro dev`).
 */

import { EmailMessage } from 'cloudflare:email';

interface EmailEnv {
  SEND_EMAIL?: import('@cloudflare/workers-types').SendEmail;
  SALES_INBOX?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
}

interface SendOptions {
  subject: string;
  html: string;
  text?: string;
  /** Customer's email — set as Reply-To so you can reply to them directly from your inbox. */
  replyTo?: string;
  /** Override the default From: address for this one send. */
  fromAddress?: string;
  /** Override the default From: display name for this one send. */
  fromName?: string;
}

const FALLBACK_FROM_ADDRESS = 'noreply@example.com';
const FALLBACK_FROM_NAME = 'Inquiry Bot';

/**
 * RFC 2047 encode a header value if it contains non-ASCII characters.
 * Uses base64 + UTF-8 charset.
 */
function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

/** Build a multipart/alternative RFC 5322 message. */
function buildRawMessage(o: {
  fromAddr: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): string {
  const boundary = `bnd_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  const date = new Date().toUTCString();
  const fromDomain = o.fromAddr.split('@')[1] ?? 'localhost';
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${fromDomain}>`;
  const fromHeader = `${encodeHeader(o.fromName)} <${o.fromAddr}>`;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${o.to}`,
    `Subject: ${encodeHeader(o.subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    o.replyTo ? `Reply-To: ${o.replyTo}` : null,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');

  const body = [
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    '',
    o.text ?? '',
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset="utf-8"`,
    `Content-Transfer-Encoding: 8bit`,
    '',
    o.html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return headers + '\r\n' + body;
}

/**
 * Send a transactional notification email via Cloudflare Email Workers.
 * Returns true on success, false on no-op or failure. Never throws.
 */
export async function sendNotification(env: EmailEnv, opts: SendOptions): Promise<boolean> {
  if (!env.SEND_EMAIL) {
    console.warn('[email] SEND_EMAIL binding missing — skipping send (likely local dev)');
    return false;
  }

  const to = env.SALES_INBOX;
  if (!to) {
    console.warn('[email] SALES_INBOX not set — skipping send');
    return false;
  }

  const fromAddr = opts.fromAddress ?? env.EMAIL_FROM_ADDRESS ?? FALLBACK_FROM_ADDRESS;
  const fromName = opts.fromName ?? env.EMAIL_FROM_NAME ?? FALLBACK_FROM_NAME;

  const raw = buildRawMessage({
    fromAddr,
    fromName,
    to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  });

  try {
    const msg = new EmailMessage(fromAddr, to, raw);
    await env.SEND_EMAIL.send(msg);
    return true;
  } catch (err) {
    console.error('[email] CF send error:', err);
    return false;
  }
}

/** HTML-escape user input before inserting into email bodies. */
export function escapeHtml(unsafe: unknown): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render an inquiry payload into a readable HTML + plain-text email.
 * Pass any subset of the listed fields — empty/missing keys are skipped.
 */
export function formatInquiryEmail(data: Record<string, unknown>): { subject: string; html: string; text: string } {
  const e = escapeHtml;
  const lines: [string, unknown][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company],
    ['Phone', data.phone],
    ['Country / Region', data.country],
    ['Product Interest', data.productInterest],
    ['SKU', data.sku],
    ['Quantity', data.quantity],
    ['Message', data.message],
  ];

  const rows = lines
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #eee;color:#475569;">${e(k)}</th><td style="padding:8px;border-bottom:1px solid #eee;">${e(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');

  const subject = `New inquiry — ${e(data.company || data.name || 'Anonymous')}${data.sku ? ` · ${e(data.sku)}` : ''}`;

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;background:#f7f9fc;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <h1 style="margin:0 0 8px 0;color:#0f172a;font-size:20px;">New customer inquiry</h1>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px 0;">Submitted via your website — please respond within 24 hours.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
      <p style="margin-top:24px;font-size:12px;color:#64748b;">Reply to this email to respond directly to the customer (Reply-To set to their address).</p>
    </div>
  </body></html>`;

  const text = lines
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return { subject, html, text };
}

/** Render a waitlist signup payload into an HTML + plain-text email. */
export function formatWaitlistEmail(email: string, topic: string): { subject: string; html: string; text: string } {
  const e = escapeHtml;
  const subject = `New waitlist signup — ${e(topic)}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;background:#f7f9fc;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px 0;color:#0f172a;font-size:20px;">Waitlist signup</h1>
      <p><strong>Topic:</strong> ${e(topic)}</p>
      <p><strong>Email:</strong> <a href="mailto:${e(email)}">${e(email)}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#64748b;">Add to waitlist tracker; notify when launched.</p>
    </div>
  </body></html>`;
  const text = `Topic: ${topic}\nEmail: ${email}`;
  return { subject, html, text };
}
