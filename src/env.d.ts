/// <reference types="astro/client" />

// Type declarations for Cloudflare bindings accessed via
// `import { env } from 'cloudflare:workers'` (Astro v6+).
declare module 'cloudflare:workers' {
  interface Env {
    DB: import('@cloudflare/workers-types').D1Database;
    R2: import('@cloudflare/workers-types').R2Bucket;
    SEND_EMAIL: import('@cloudflare/workers-types').SendEmail;
    SALES_INBOX?: string;
    API_KEY: string;
  }
  export const env: Env;
}
