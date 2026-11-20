import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, index, integer, pgTable, serial, text, timestamp, unique, uniqueIndex, uuid, varchar, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { User } from '../auth';

// Shared Learn collection with an owner for each Guide.
export const learnGuides = pgTable('learn_guides', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  summary: varchar('summary', { length: 500 }).notNull().default(''),
  content: text('content').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(true),
  revision: uuid('revision').notNull(),
  createdBy: text('created_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  updatedBy: text('updated_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  userId: text('user_id').notNull().references(() => User.id, { onDelete: 'restrict' }),
}, table => [
  unique('learn_guides_slug_unique').on(table.slug),
  index('learn_guides_public_order_idx').on(table.isActive, table.isPublished, table.sortOrder, table.id),
  index('learn_guides_user_id_idx').on(table.userId),
  check('learn_guides_title_valid', sql`length(btrim(${table.title})) BETWEEN 1 AND 255`),
  check('learn_guides_slug_valid', sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check('learn_guides_content_length', sql`length(${table.content}) <= 100000`),
  check('learn_guides_sort_range', sql`${table.sortOrder} BETWEEN -10000 AND 10000`),
]);

export type LearnGuideRecord = typeof learnGuides.$inferSelect;

// Shared Learn taxonomy. Creator/editor references record attribution.
export const learnCategories = pgTable('learn_categories', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references((): AnyPgColumn => learnCategories.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  revision: uuid('revision').notNull(),
  createdBy: text('created_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  updatedBy: text('updated_by').notNull().references(() => User.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('learn_categories_slug_unique').on(table.slug),
  index('learn_categories_active_order_idx').on(table.isActive, table.sortOrder, table.id),
  index('learn_categories_parent_idx').on(table.parentId),
  check('learn_categories_name_valid', sql`length(btrim(${table.name})) BETWEEN 1 AND 120`),
  check('learn_categories_slug_valid', sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check('learn_categories_sort_range', sql`${table.sortOrder} BETWEEN -10000 AND 10000`),
  check('learn_categories_parent_not_self', sql`${table.parentId} <> ${table.id}`),
]);

export type LearnCategoryRecord = typeof learnCategories.$inferSelect;

// Guide/category junction for the shared Learn collection.
export const learnGuideCategoryAssignments = pgTable('learn_guide_category_assignments', {
  id: serial('id').primaryKey(),
  guideId: integer('guide_id').notNull(),
  categoryId: integer('category_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  foreignKey({
    name: 'learn_guide_category_assignments_guide_fk',
    columns: [table.guideId],
    foreignColumns: [learnGuides.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'learn_guide_category_assignments_category_fk',
    columns: [table.categoryId],
    foreignColumns: [learnCategories.id],
  }).onDelete('cascade'),
  uniqueIndex('learn_guide_category_assignments_guide_category_idx').on(table.guideId, table.categoryId),
  index('learn_guide_category_assignments_category_idx').on(table.categoryId),
]);

export type LearnGuideCategoryAssignmentRecord = typeof learnGuideCategoryAssignments.$inferSelect;
