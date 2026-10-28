import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, serial, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { User } from '../auth';

// Shared App guides. Creator/editor references are attribution, not personal ownership.
export const learnGuides = pgTable('learn_guides', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  summary: varchar('summary', { length: 500 }).notNull().default(''),
  content: text('content').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  revision: uuid('revision').notNull(),
  createdBy: text('created_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  updatedBy: text('updated_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('learn_guides_slug_unique').on(table.slug),
  index('learn_guides_public_order_idx').on(table.isActive, table.isPublished, table.sortOrder, table.id),
  check('learn_guides_title_valid', sql`length(btrim(${table.title})) BETWEEN 1 AND 255`),
  check('learn_guides_slug_valid', sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check('learn_guides_content_length', sql`length(${table.content}) <= 100000`),
  check('learn_guides_sort_range', sql`${table.sortOrder} BETWEEN -10000 AND 10000`),
]);

export type LearnGuideRecord = typeof learnGuides.$inferSelect;
