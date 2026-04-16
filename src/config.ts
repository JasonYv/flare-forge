/**
 * Site-wide configuration for the B2B Manufacturing Export website.
 * Centralized config to keep all branding, SEO, and social settings in one place.
 */
export const siteConfig = {
  /** Site name displayed in header and <title> tags */
  name: 'FlareForge Manufacturing',
  /** Tagline for homepage hero and meta description fallback */
  tagline: 'Premium Industrial Solutions for Global Markets',
  /** Canonical site URL (no trailing slash) */
  url: 'https://example.com',
  /** Default language */
  defaultLocale: 'en' as const,
  /** Supported locales */
  locales: ['en', 'zh', 'es'] as const,

  /** Contact information */
  contact: {
    email: 'info@example.com',
    phone: '+86-755-1234-5678',
    address: 'Building A, Industrial Zone, Shenzhen, China',
    workingHours: 'Mon-Fri 9:00-18:00 (GMT+8)',
  },

  /** Social media links */
  social: {
    linkedin: 'https://linkedin.com/company/example',
    facebook: 'https://facebook.com/example',
    twitter: 'https://twitter.com/example',
    youtube: '',
    whatsapp: '+8613800138000',
  },

  /** SEO defaults */
  seo: {
    titleTemplate: '%s | FlareForge Manufacturing',
    defaultDescription:
      'Leading manufacturer and exporter of industrial equipment. ISO 9001 certified. Custom OEM/ODM solutions for global B2B clients.',
    defaultOgImage: '/images/og-default.jpg',
  },

  /** Theme colors used in meta tags and PWA manifest */
  theme: {
    primary: '#1e40af',
    secondary: '#f59e0b',
    background: '#ffffff',
  },

  /** Navigation items */
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
    { label: 'News', href: '/news' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type Locale = (typeof siteConfig.locales)[number];
