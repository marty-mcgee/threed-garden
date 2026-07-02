// lib/schema/projects/index.ts
import { pgTable, text, timestamp, boolean, jsonb, serial, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '../auth';

// ============================================
// PROJECTS TABLE
// ============================================

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  
  // Basic info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  
  // Owner
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  
  // Configuration
  config: jsonb('config').default({}),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('idx_projects_slug').on(table.slug),
  userIdIdx: index('idx_projects_user_id').on(table.userId),
  activeIdx: index('idx_projects_active').on(table.isActive),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  // These will be populated when we update the module schemas
  // threed: many(threed),
  // traffic: many(traffic),
  // music: many(music),
}));

// ============================================
// TYPES
// ============================================

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;