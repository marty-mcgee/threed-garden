// lib/schema/auth/index.ts
// ============================================
// USER AUTH SCHEMA - All tables prefixed with "user_"
// ============================================

import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// 1. user - Main user table (Better Auth expects 'user')
// ============================================
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  
  // Profile data
  username: text('username').unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  
  // Preferences
  theme: text('theme').default('system'),
  language: text('language').default('en'),
  timezone: text('timezone').default('UTC'),
  
  // Metadata
  role: text('role').default('user'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('idx_user_email').on(table.email),
  usernameIdx: uniqueIndex('idx_user_username').on(table.username),
  roleIdx: index('idx_user_role').on(table.role),
  activeIdx: index('idx_user_active').on(table.isActive),
}));

// ============================================
// 2. user_accounts - OAuth/Provider accounts
// ============================================
export const userAccounts = pgTable('user_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_accounts_user_id').on(table.userId),
  providerIdx: index('idx_user_accounts_provider').on(table.provider),
  providerAccountIdIdx: index('idx_user_accounts_provider_account_id').on(table.providerAccountId),
  compositeProviderIdx: uniqueIndex('idx_user_accounts_provider_composite').on(table.provider, table.providerAccountId),
}));

// ============================================
// 3. user_sessions - User sessions
// ============================================
export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_sessions_user_id').on(table.userId),
  tokenIdx: uniqueIndex('idx_user_sessions_token').on(table.token),
  expiresAtIdx: index('idx_user_sessions_expires_at').on(table.expiresAt),
}));

// ============================================
// 4. user_verifications - Email/Phone verification
// ============================================
export const userVerifications = pgTable('user_verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  type: text('type').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_verifications_user_id').on(table.userId),
  tokenIdx: uniqueIndex('idx_user_verifications_token').on(table.token),
  expiresAtIdx: index('idx_user_verifications_expires_at').on(table.expiresAt),
}));

// ============================================
// 5. user_settings_overrides - User settings
// ============================================
export const userSettingsOverrides = pgTable('user_settings_overrides', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  module: text('module').notNull(),
  service: text('service'),
  settingKey: text('setting_key').notNull(),
  settingValue: boolean('setting_value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_settings_user_id').on(table.userId),
  moduleIdx: index('idx_user_settings_module').on(table.module),
  compositeKeyIdx: index('idx_user_settings_composite').on(table.userId, table.module, table.settingKey),
}));

// ============================================
// 6. user_api_keys - API keys
// ============================================
export const userApiKeys = pgTable('user_api_keys', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  permissions: jsonb('permissions').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_api_keys_user_id').on(table.userId),
  keyIdx: uniqueIndex('idx_user_api_keys_key').on(table.key),
  expiresAtIdx: index('idx_user_api_keys_expires_at').on(table.expiresAt),
}));

// ============================================
// 7. user_audit_logs - Activity audit trail
// ============================================
export const userAuditLogs = pgTable('user_audit_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_audit_user_id').on(table.userId),
  actionIdx: index('idx_user_audit_action').on(table.action),
  createdAtIdx: index('idx_user_audit_created_at').on(table.createdAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(userAccounts),
  sessions: many(userSessions),
  verifications: many(userVerifications),
  settings: many(userSettingsOverrides),
  apiKeys: many(userApiKeys),
  auditLogs: many(userAuditLogs),
}));

export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
  user: one(user, {
    fields: [userAccounts.userId],
    references: [user.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(user, {
    fields: [userSessions.userId],
    references: [user.id],
  }),
}));

export const userVerificationsRelations = relations(userVerifications, ({ one }) => ({
  user: one(user, {
    fields: [userVerifications.userId],
    references: [user.id],
  }),
}));

export const userSettingsOverridesRelations = relations(userSettingsOverrides, ({ one }) => ({
  user: one(user, {
    fields: [userSettingsOverrides.userId],
    references: [user.id],
  }),
}));

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(user, {
    fields: [userApiKeys.userId],
    references: [user.id],
  }),
}));

export const userAuditLogsRelations = relations(userAuditLogs, ({ one }) => ({
  user: one(user, {
    fields: [userAuditLogs.userId],
    references: [user.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type UserAccount = typeof userAccounts.$inferSelect;
export type NewUserAccount = typeof userAccounts.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type UserVerification = typeof userVerifications.$inferSelect;
export type NewUserVerification = typeof userVerifications.$inferInsert;

export type UserSettingOverride = typeof userSettingsOverrides.$inferSelect;
export type NewUserSettingOverride = typeof userSettingsOverrides.$inferInsert;

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type NewUserApiKey = typeof userApiKeys.$inferInsert;

export type UserAuditLog = typeof userAuditLogs.$inferSelect;
export type NewUserAuditLog = typeof userAuditLogs.$inferInsert;