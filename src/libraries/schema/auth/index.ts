// lib/schema/auth/index.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// AUTH SCHEMA - Your naming convention
// ============================================

// 1. User - Main user table
export const User = pgTable('user', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  
  // Custom fields
  username: text('username').unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  theme: text('theme').default('system'),
  language: text('language').default('en'),
  timezone: text('timezone').default('UTC'),
  role: text('role').default('user'),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('idx_user_email').on(table.email),
  usernameIdx: uniqueIndex('idx_user_username').on(table.username),
}));

// 2. UserAccounts - OAuth accounts + Password storage
export const UserAccounts = pgTable('user_accounts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  
  // Password field for credentials provider
  password: text('password'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_accounts_user_id').on(table.userId),
  providerIdx: uniqueIndex('idx_user_accounts_provider').on(table.provider, table.providerAccountId),
}));

// 3. UserSessions - User sessions
export const UserSessions = pgTable('user_sessions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => User.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  sessionTokenIdx: uniqueIndex('idx_user_sessions_token').on(table.sessionToken),
  userIdIdx: index('idx_user_sessions_user_id').on(table.userId),
}));

// 4. UserVerifications - Email verification
export const UserVerifications = pgTable('user_verifications', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  identifierTokenIdx: uniqueIndex('idx_user_verifications_token').on(table.identifier, table.token),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const UserRelations = relations(User, ({ many }) => ({
  accounts: many(UserAccounts),
  sessions: many(UserSessions),
}));

export const UserAccountsRelations = relations(UserAccounts, ({ one }) => ({
  user: one(User, {
    fields: [UserAccounts.userId],
    references: [User.id],
  }),
}));

export const UserSessionsRelations = relations(UserSessions, ({ one }) => ({
  user: one(User, {
    fields: [UserSessions.userId],
    references: [User.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type User = typeof User.$inferSelect;
export type NewUser = typeof User.$inferInsert;
export type UserAccount = typeof UserAccounts.$inferSelect;
export type NewUserAccount = typeof UserAccounts.$inferInsert;
export type UserSession = typeof UserSessions.$inferSelect;
export type NewUserSession = typeof UserSessions.$inferInsert;
export type UserVerification = typeof UserVerifications.$inferSelect;
export type NewUserVerification = typeof UserVerifications.$inferInsert;

// ============================================
// BACKWARD COMPATIBILITY (if needed)
// ============================================

// Export as both PascalCase and camelCase for compatibility
export const user = User;
export const userAccounts = UserAccounts;
export const userSessions = UserSessions;
export const userVerifications = UserVerifications;