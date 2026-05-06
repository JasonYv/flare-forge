import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const productCategories = [
  'agm-start-stop',
  'efb-start-stop',
  'maintenance-free',
  'conventional',
  'truck-commercial',
  'parking-ac',
  'solar-storage',
  'marine',
  'lithium-starter',
] as const;

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      // Identity
      model: z.string(),
      altusvoltSku: z.string(),
      title: z.string(),
      slug: z.string().optional(),
      category: z.enum(productCategories),
      series: z.string(),
      seriesCode: z.string().optional(),

      // Core electrical specs
      voltage: z.string().default('12V'),
      capacityAh: z.number(),
      ccaA: z.number().optional(),
      rcMin: z.number().optional(),
      cycleLife: z.string().optional(),

      // Physical dimensions
      lengthMm: z.number().optional(),
      widthMm: z.number().optional(),
      heightMm: z.number().optional(),
      weightKg: z.number().optional(),
      terminalType: z.string().optional(),
      container: z.string().optional(),
      layout: z.string().optional(),
      holdDown: z.string().optional(),

      // Commercial
      warrantyMonths: z.number().default(24),
      moqPcs: z.number().optional(),
      hsCode: z.string().default('8507.20'),

      // Editorial
      shortDescription: z.string(),
      features: z.array(z.string()).default([]),
      applications: z.array(z.string()).default([]),
      certifications: z.array(z.string()).default([]),
      crossReferences: z.array(z.object({ brand: z.string(), sku: z.string() })).default([]),

      // Display / media
      images: z.array(z.string()).min(1),
      heroImage: z.string().optional(),

      // Listing controls
      featured: z.boolean().default(false),
      order: z.number().default(100),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    coverImage: z.string().optional(),
    category: z.string().default('news'),
    locale: z.string().default('en'),
    author: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const kb = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kb' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['guide', 'comparison', 'shipping', 'sizing', 'reference']).default('guide'),
    coverImage: z.string().optional(),
    author: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    relatedProducts: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, news, kb };
