// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://altusvolt.com',
  adapter: cloudflare(),
  security: {
    // Allow JSON / multipart POST from external tools (publish script, admin panels, etc.)
    // API routes are protected by Bearer Token auth instead.
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/admin/') &&
        !page.endsWith('/404'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  redirects: {
    // Legacy retired/aspirational categories
    '/products/telecom': { status: 301, destination: '/products' },
    '/products/ups': { status: 301, destination: '/products' },
    '/products/stationary-vrla': { status: 301, destination: '/products' },
    '/products/lineup': { status: 301, destination: '/products' },
    '/downloads': { status: 301, destination: '/resources/downloads' },
    '/resources/news': { status: 301, destination: '/news' },

    // Old slugs → new /products/* paths
    '/products/agm-start-stop': { status: 301, destination: '/products/agm-batteries' },
    '/products/efb-start-stop': { status: 301, destination: '/products/efb-batteries' },
    '/products/truck-commercial': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/commercial': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/conventional': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/parking-ac': { status: 301, destination: '/products/parking-ac-batteries' },
    '/products/marine': { status: 301, destination: '/products/marine-batteries' },
    '/products/solar-storage': { status: 301, destination: '/products/solar-batteries' },
    '/products/maintenance-free': { status: 301, destination: '/products/starter-batteries' },

    // Short-lived top-level URLs (intermediate refactor) → final /products/* paths
    '/agm-batteries': { status: 301, destination: '/products/agm-batteries' },
    '/efb-batteries': { status: 301, destination: '/products/efb-batteries' },
    '/heavy-duty-batteries': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/marine-batteries': { status: 301, destination: '/products/marine-batteries' },
    '/parking-ac-batteries': { status: 301, destination: '/products/parking-ac-batteries' },
    '/solar-batteries': { status: 301, destination: '/products/solar-batteries' },
    '/starter-batteries': { status: 301, destination: '/products/starter-batteries' },

    // About & brand consolidation
    '/about': { status: 301, destination: '/about-altusvolt' },
    '/about/factory': { status: 301, destination: '/factory-and-certifications' },
    '/about/certifications': { status: 301, destination: '/factory-and-certifications' },
    '/about/equipment': { status: 301, destination: '/factory-and-certifications' },
    '/about/history': { status: 301, destination: '/brand/lingyun-battery' },

    // OEM & inquiry consolidation
    '/oem-odm': { status: 301, destination: '/oem-private-label' },
    '/quote': { status: 301, destination: '/distributor-program' },
    '/quote/distributor': { status: 301, destination: '/distributor-program' },
    '/quote/oem': { status: 301, destination: '/oem-private-label' },

    // Support consolidation
    '/compare/agm-vs-efb': { status: 301, destination: '/support/agm-vs-efb' },
    '/standards/group-31-battery': { status: 301, destination: '/support/battery-standards' },
    '/standards/jis-vs-din-vs-bci': { status: 301, destination: '/support/battery-standards' },

    // Retired individual product detail pages → roll up to category landing
    '/products/6-qtf-60': { status: 301, destination: '/products/agm-batteries' },
    '/products/6-qtf-70': { status: 301, destination: '/products/agm-batteries' },
    '/products/6-qtf-105': { status: 301, destination: '/products/agm-batteries' },
    '/products/6-qtpe-70': { status: 301, destination: '/products/efb-batteries' },
    '/products/6-qtpe-80': { status: 301, destination: '/products/efb-batteries' },
    '/products/55d23-mf': { status: 301, destination: '/products/starter-batteries' },
    '/products/95d31-mf': { status: 301, destination: '/products/starter-batteries' },
    '/products/6-qw-105': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/6-qw-150': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/6-qw-200': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/n150': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/n200': { status: 301, destination: '/products/heavy-duty-batteries' },
    '/products/obsidian-s390': { status: 301, destination: '/products/parking-ac-batteries' },
    '/products/obsidian-s490-pro': { status: 301, destination: '/products/parking-ac-batteries' },
    '/products/6-cnf-100': { status: 301, destination: '/products/solar-batteries' },
    '/products/6-cnf-200': { status: 301, destination: '/products/solar-batteries' },
    '/products/6-cqa-225': { status: 301, destination: '/products/marine-batteries' },
    '/products/6-cqw-220': { status: 301, destination: '/products/marine-batteries' },
  },
  // i18n routing intentionally not configured: site is English-only until full
  // translations ship. See doc/TODO-pending-items.md for re-enablement plan.
});
