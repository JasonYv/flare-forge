import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getDb } from '../../db';
import { inquiries } from '../../db/schema';

export const prerender = false;

/**
 * POST /api/inquiry
 * Saves a contact form submission to D1.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, company, phone, message, productInterest, locale } = body;

    // Basic validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Inquiry submission error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
