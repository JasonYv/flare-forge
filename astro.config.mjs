// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  adapter: cloudflare(),
  security: {
    // Allow JSON / multipart POST from external tools (publish script, admin panels, etc.)
    // API routes are protected by Bearer Token auth instead.
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
