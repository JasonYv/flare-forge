/**
 * i18n shim — currently English only.
 *
 * The site previously declared en/zh/es support but had no real translations.
 * Multi-language support has been deferred until full translations are produced
 * (see /doc/TODO-pending-items.md).
 *
 * Translations for zh/es are kept here for future re-enablement but are not
 * surfaced via Locale type or routing today.
 */
import type { Locale } from '../config';
export type { Locale };

const en: Record<string, string> = {
  'nav.solutions': 'Solutions',
  'nav.products': 'Products',
  'nav.technology': 'Technology',
  'nav.support': 'Support',
  'nav.company': 'Company',
  'hero.title': '30+ Years of Battery Manufacturing Heritage',
  'hero.subtitle':
    'AltusVolt — global export operator for Lingyun. AGM Start-Stop, EFB, Heavy-Duty Truck, Solar Storage, CCS-certified Marine batteries. IATF 16949 manufacturing.',
  'hero.cta': 'Request a Quote',
  'hero.cta_secondary': 'Browse Products',
  'hero.cta_download': 'Download Datasheets',
  'products.title': 'Industrial Battery Catalog',
  'products.subtitle':
    'Eight categories of lead-acid batteries spanning automotive starting, heavy-duty commercial, solar storage, and marine applications.',
  'products.view_all': 'Explore Full Catalog',
  'news.title': 'Latest News',
  'news.read_more': 'Read More',
  'contact.title': 'Get in Touch',
  'contact.name': 'Full Name',
  'contact.email': 'Work Email',
  'contact.company': 'Company',
  'contact.phone': 'Phone',
  'contact.country': 'Project Region',
  'contact.product_interest': 'Solution Category',
  'contact.quantity': 'Project Scale',
  'contact.message': 'Technical Requirements & Timeline',
  'contact.submit': 'Send Quote Request',
  'contact.success': 'Thank you. Our sales team will review your RFQ within 24 hours.',
  'footer.rights': 'All Rights Reserved.',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
};

export function t(key: string, _locale: Locale = 'en'): string {
  return en[key] ?? key;
}

export function getLocaleFromUrl(_url: URL): Locale {
  return 'en';
}
