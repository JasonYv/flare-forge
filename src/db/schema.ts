import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/** News / Blog articles — fetched via SSR on /news/[slug] */
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  category: text('category').notNull().default('news'),
  locale: text('locale').notNull().default('en'),
  author: text('author'),
  publishedAt: text('published_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Product catalog */
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  specifications: text('specifications'),
  category: text('category').notNull(),
  images: text('images'),
  minOrderQty: integer('min_order_qty'),
  locale: text('locale').notNull().default('en'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Contact form submissions / inquiries */
export const inquiries = sqliteTable('inquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  phone: text('phone'),
  productInterest: text('product_interest'),
  message: text('message').notNull(),
  locale: text('locale').default('en'),
  status: text('status').notNull().default('new'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Type helpers */
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
