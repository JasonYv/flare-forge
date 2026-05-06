/**
 * Site-wide configuration for AltusVolt.
 * AltusVolt is the overseas operator brand for Lingyun (Shaanxi Lingyun Storage Battery Co., Ltd.).
 * Domestic market: Lingyun. Overseas market: AltusVolt.
 */
export const siteConfig = {
  /** Site name displayed in header and <title> tags */
  name: 'AltusVolt',
  /** Full brand name for footer / formal contexts */
  fullName: 'AltusVolt — Global Export Operator for Lingyun Battery',
  /** Manufacturing partner — used in About / trust narrative, NOT as primary brand */
  manufacturingPartner: {
    name: 'Shaanxi Lingyun Storage Battery Co., Ltd.',
    established: 1993,
    location: 'Baoji, Shaanxi, China',
  },
  /** Tagline for homepage hero and meta description fallback */
  tagline: 'Global Export Partner for Lingyun Battery',
  /** Canonical site URL (no trailing slash) */
  url: 'https://altusvolt.com',
  /** Default language */
  defaultLocale: 'en' as const,
  /** Supported locales — currently English only; add zh/es when translations are ready */
  locales: ['en'] as const,

  /** Contact information */
  contact: {
    email: 'sales@altusvolt.com',
    phone: '',
    address: 'No.8 Shanliulu, Auto Industry Park, Hi-tech Zone, Baoji, Shaanxi, China',
    workingHours: 'Mon-Fri 8:30-17:30 (GMT+8)',
  },

  /** Social media links — empty values are hidden by templates */
  social: {
    linkedin: '',
    facebook: '',
    twitter: '',
    youtube: '',
    whatsapp: '',
  },

  /** SEO defaults */
  seo: {
    titleTemplate: '%s | AltusVolt — Lead Acid Battery Manufacturer China',
    defaultDescription:
      'AltusVolt is the global export partner for Lingyun Battery — overseas distributor and OEM sales for AGM, EFB, heavy-duty truck, marine, and parking AC batteries. Backed by IATF 16949 manufacturing.',
    defaultOgImage: '/images/og-default.png',
  },

  /** Theme colors — V2 Midnight Navy + Precision Gold */
  theme: {
    primary: '#0A1628',
    steel: '#3D5A80',
    gold: '#C8A951',
    background: '#FFFFFF',
    surface: '#F4F6F8',
  },

  /** Top-level navigation labels */
  nav: [
    { label: 'Products', href: '/products' },
    { label: 'Applications', href: '/solutions' },
    { label: 'Resources', href: '/resources' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],

  /**
   * Product categories — only categories Lingyun actually manufactures.
   *
   * Status:
   *   'live'         — has at least one published product, fully visible
   *   'coming-soon'  — placeholder landing page with email capture, not yet supplied
   */
  productCategories: [
    // === Automotive Starting Batteries ===
    {
      slug: 'agm-start-stop',
      name: 'AGM Start-Stop',
      parentGroup: 'Automotive Starting Batteries',
      description:
        'Absorbent Glass Mat batteries for micro-hybrid start-stop vehicles. High CCA, rapid recharge, deep cycling capability.',
      icon: 'electric_car',
      flagshipModel: '6-QTF-70',
      status: 'live',
    },
    {
      slug: 'efb-start-stop',
      name: 'EFB Start-Stop',
      parentGroup: 'Automotive Starting Batteries',
      description:
        'Enhanced Flooded Battery technology for entry-level start-stop applications. Cost-effective with improved cycling.',
      icon: 'battery_charging_full',
      flagshipModel: '6-QTPE-70',
      status: 'live',
    },
    {
      slug: 'maintenance-free',
      name: 'Maintenance-Free (Calcium-Calcium)',
      parentGroup: 'Automotive Starting Batteries',
      description:
        'Sealed calcium-calcium MF batteries requiring zero water top-up. JIS standard for Japanese & Korean vehicle aftermarket.',
      icon: 'battery_full',
      flagshipModel: '55D23-MF',
      status: 'live',
    },
    {
      slug: 'conventional',
      name: 'Conventional Flooded SLI',
      parentGroup: 'Automotive Starting Batteries',
      description:
        'Traditional flooded lead-acid starting batteries for trucks, buses, and price-sensitive markets. 100Ah to 200Ah.',
      icon: 'directions_car',
      flagshipModel: 'N150',
      status: 'live',
    },
    // === Heavy-Duty / Commercial ===
    {
      slug: 'truck-commercial',
      name: 'Heavy-Duty Truck & Commercial',
      parentGroup: 'Commercial & Heavy-Duty',
      description:
        'High-capacity flooded batteries for trucks, buses, construction and agricultural equipment. 105Ah to 200Ah, OEM-validated.',
      icon: 'local_shipping',
      flagshipModel: '6-QW-150',
      status: 'live',
    },
    {
      slug: 'parking-ac',
      name: 'Parking AC / Auxiliary Power',
      parentGroup: 'Commercial & Heavy-Duty',
      description:
        'Deep-cycle batteries for truck parking air-conditioners and auxiliary power. Heavy cycling endurance for long-haul fleets.',
      icon: 'ac_unit',
      flagshipModel: 'obsidian-s490-pro',
      status: 'live',
    },
    // === Energy Storage / Industrial ===
    {
      slug: 'solar-storage',
      name: 'Solar & Off-Grid Storage',
      parentGroup: 'Energy Storage',
      description:
        'Deep-cycle VRLA batteries for solar PV systems, off-grid installations, and hybrid energy storage. 38Ah to 200Ah.',
      icon: 'solar_power',
      flagshipModel: '6-CNF-100',
      status: 'live',
    },
    {
      slug: 'marine',
      name: 'Marine Batteries',
      parentGroup: 'Marine & Specialty',
      description:
        'CCS-certified marine starting and deep-cycle batteries. Built for vibration, humidity, and extreme operating conditions.',
      icon: 'directions_boat',
      flagshipModel: '6-CQW-220',
      status: 'live',
    },
    // === Coming Soon ===
    {
      slug: 'lithium-starter',
      name: 'Lithium Starter (LiFePO4)',
      parentGroup: 'Automotive Starting Batteries',
      description:
        '12.8V LiFePO4 starting batteries. 70% lighter than lead-acid, 5,000+ cycle life. Coming soon.',
      icon: 'bolt',
      flagshipModel: null,
      status: 'coming-soon',
    },
  ],

  /** Trust stats for hero bar */
  trustStats: [
    { value: '30+', label: 'Years Manufacturing Heritage' },
    { value: '5M', label: 'Annual Production Capacity' },
    { value: '45+', label: 'Countries Served' },
    { value: 'IATF', label: '16949 Certified' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type Locale = (typeof siteConfig.locales)[number];
export type ProductCategory = (typeof siteConfig.productCategories)[number];
