/**
 * Email delivery via Resend.
 *
 * Resend is chosen because:
 *   - HTTP-only API (works inside Cloudflare Workers without TCP)
 *   - No DNS verification needed for low-volume transactional sending
 *   - Free tier: 100 emails/day, 3,000/month
 *
 * Setup:
 *   1. Sign up at https://resend.com
 *   2. Generate API key
 *   3. Add to wrangler.toml secrets:  npx wrangler secret put RESEND_API_KEY
 *   4. Optionally add SALES_INBOX env var (defaults to sales@altusvolt.com)
 *
 * Gracefully no-ops if RESEND_API_KEY is not configured — useful in dev.
 */

interface EmailEnv {
  RESEND_API_KEY?: string;
  SALES_INBOX?: string;
}

interface SendOptions {
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

const DEFAULT_FROM = 'AltusVolt Inquiry Bot <inquiry@altusvolt.com>';
const DEFAULT_TO = 'sales@altusvolt.com';

/**
 * Send an email via Resend. Returns true on success, false on failure or no-op.
 * Never throws — caller decides how to react.
 */
export async function sendNotification(env: EmailEnv, opts: SendOptions): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — skipping send');
    return false;
  }

  const to = env.SALES_INBOX ?? DEFAULT_TO;
  const from = opts.from ?? DEFAULT_FROM;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email] Resend API error:', res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[email] Network error:', err);
    return false;
  }
}

/** Lightweight HTML escaper for inserting user input into email bodies */
export function escapeHtml(unsafe: unknown): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Format an inquiry payload as a readable HTML email */
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
    .map(([k, v]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #eee;color:#3D5A80;">${e(k)}</th><td style="padding:8px;border-bottom:1px solid #eee;">${e(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');

  const subject = `New RFQ — ${e(data.company || data.name || 'Anonymous')}${data.sku ? ` · ${e(data.sku)}` : ''}`;

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#191c1e;background:#f7f9fc;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <h1 style="margin:0 0 8px 0;color:#0A1628;font-size:20px;">New AltusVolt Inquiry</h1>
      <p style="color:#75777d;font-size:13px;margin:0 0 16px 0;">Submitted via altusvolt.com — please respond within 24 hours.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
      <p style="margin-top:24px;font-size:12px;color:#75777d;">Reply to this email to respond directly to the customer.</p>
    </div>
  </body></html>`;

  const text = lines
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return { subject, html, text };
}

/** Format a waitlist signup payload */
export function formatWaitlistEmail(email: string, topic: string): { subject: string; html: string; text: string } {
  const e = escapeHtml;
  const subject = `New waitlist signup — ${e(topic)}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#191c1e;background:#f7f9fc;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px 0;color:#0A1628;font-size:20px;">Waitlist Signup</h1>
      <p><strong>Topic:</strong> ${e(topic)}</p>
      <p><strong>Email:</strong> <a href="mailto:${e(email)}">${e(email)}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#75777d;">Add to waitlist tracker; notify when launched.</p>
    </div>
  </body></html>`;
  const text = `Topic: ${topic}\nEmail: ${email}`;
  return { subject, html, text };
}
