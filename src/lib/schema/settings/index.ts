// lib/schema/settings/index.ts
// ============================================
// SETTINGS MODULE - Centralized configuration
// ============================================

import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../auth';
import { projects } from '../projects';

// ============================================
// ENUMS
// ============================================

export const settingScopeEnum = pgEnum('setting_scope', [
  'system',     // Global system settings
  'user',       // User-specific settings
  'module',     // Module-specific settings (traffic, threed, music)
]);

export const settingTypeEnum = pgEnum('setting_type', [
  'boolean',
  'string',
  'number',
  'json',
  'array',
]);

export const deploymentEnvironmentEnum = pgEnum('deployment_environment', [
  'development',
  'staging',
  'production',
]);

// ============================================
// 1. settings - Main settings table
// ============================================
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  
  // Setting identification
  key: text('key').notNull().unique(),
  scope: settingScopeEnum('scope').notNull().default('system'),
  
  // Setting values
  value: jsonb('value').notNull(),
  type: settingTypeEnum('type').notNull().default('string'),
  
  // Metadata
  label: text('label'),
  description: text('description'),
  group: text('group'), // e.g., 'appearance', 'features', 'integrations'
  category: text('category'), // e.g., 'traffic', 'threed', 'music'
  
  // Constraints
  isRequired: boolean('is_required').default(false),
  isSensitive: boolean('is_sensitive').default(false), // For API keys, secrets
  isEnabled: boolean('is_enabled').default(true),
  
  // Validation
  validation: jsonb('validation'), // { min, max, pattern, enum, etc. }
  
  // Default value
  defaultValue: jsonb('default_value'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('idx_settings_key').on(table.key),
  scopeIdx: index('idx_settings_scope').on(table.scope),
  groupIdx: index('idx_settings_group').on(table.group),
  categoryIdx: index('idx_settings_category').on(table.category),
  enabledIdx: index('idx_settings_enabled').on(table.isEnabled),
}));

// ============================================
// 2. settings_user_overrides - User-specific setting overrides
// ============================================
export const settingsUserOverrides = pgTable('settings_user_overrides', {
  id: serial('id').primaryKey(),
  
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  settingId: integer('setting_id').references(() => settings.id, { onDelete: 'cascade' }),
  
  // Override value
  value: jsonb('value').notNull(),
  
  // Metadata
  overrideReason: text('override_reason'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_settings_user_overrides_user_id').on(table.userId),
  settingIdIdx: index('idx_settings_user_overrides_setting_id').on(table.settingId),
  compositeKeyIdx: uniqueIndex('idx_settings_user_overrides_composite').on(table.userId, table.settingId),
}));

// ============================================
// 3. settings_deployment - Deployment-specific settings
// ============================================
export const settingsDeployment = pgTable('settings_deployment', {
  id: serial('id').primaryKey(),
  
  // Deployment identification
  name: text('name').notNull().unique(),
  environment: deploymentEnvironmentEnum('environment').default('development'),
  description: text('description'),
  
  // Active status
  isActive: boolean('is_active').default(false),
  
  // Settings snapshot - full configuration for this deployment
  settings: jsonb('settings').notNull(), // Stores full settings object
  
  // Version tracking
  version: text('version').default('1.0.0'),
  
  // Metadata
  deployedBy: text('deployed_by'),
  deployedAt: timestamp('deployed_at'),
  rollbackTo: integer('rollback_to').references(() => settingsDeployment.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex('idx_settings_deployment_name').on(table.name),
  activeIdx: index('idx_settings_deployment_active').on(table.isActive),
  environmentIdx: index('idx_settings_deployment_environment').on(table.environment),
  rollbackIdx: index('idx_settings_deployment_rollback').on(table.rollbackTo),
}));

// ============================================
// 4. settings_deployment_history - Deployment history
// ============================================
export const settingsDeploymentHistory = pgTable('settings_deployment_history', {
  id: serial('id').primaryKey(),
  
  deploymentId: integer('deployment_id').references(() => settingsDeployment.id, { onDelete: 'cascade' }),
  
  // Action details
  action: text('action').notNull(), // 'deploy', 'rollback', 'activate', 'deactivate'
  previousDeploymentId: integer('previous_deployment_id'),
  newDeploymentId: integer('new_deployment_id'),
  
  // Actor
  performedBy: text('performed_by'),
  
  // Diff/Changes
  changes: jsonb('changes'), // What changed between deployments
  
  // Timestamps
  performedAt: timestamp('performed_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  deploymentIdIdx: index('idx_settings_deployment_history_deployment_id').on(table.deploymentId),
  actionIdx: index('idx_settings_deployment_history_action').on(table.action),
  performedAtIdx: index('idx_settings_deployment_history_performed_at').on(table.performedAt),
}));

// ============================================
// 5. settings_audit_logs - Settings change audit
// ============================================
export const settingsAuditLogs = pgTable('settings_audit_logs', {
  id: serial('id').primaryKey(),
  
  settingId: integer('setting_id').references(() => settings.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  
  // Change details
  action: text('action').notNull(), // 'create', 'update', 'delete', 'override'
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  
  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  settingIdIdx: index('idx_settings_audit_setting_id').on(table.settingId),
  userIdIdx: index('idx_settings_audit_user_id').on(table.userId),
  actionIdx: index('idx_settings_audit_action').on(table.action),
  createdAtIdx: index('idx_settings_audit_created_at').on(table.createdAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================

export const settingsRelations = relations(settings, ({ one, many }) => ({
  userOverrides: many(settingsUserOverrides),
  auditLogs: many(settingsAuditLogs),
}));

export const settingsUserOverridesRelations = relations(settingsUserOverrides, ({ one }) => ({
  user: one(user, {
    fields: [settingsUserOverrides.userId],
    references: [user.id],
  }),
  setting: one(settings, {
    fields: [settingsUserOverrides.settingId],
    references: [settings.id],
  }),
}));

export const settingsDeploymentRelations = relations(settingsDeployment, ({ one, many }) => ({
  rollbackTarget: one(settingsDeployment, {
    fields: [settingsDeployment.rollbackTo],
    references: [settingsDeployment.id],
  }),
  history: many(settingsDeploymentHistory),
}));

export const settingsDeploymentHistoryRelations = relations(settingsDeploymentHistory, ({ one }) => ({
  deployment: one(settingsDeployment, {
    fields: [settingsDeploymentHistory.deploymentId],
    references: [settingsDeployment.id],
  }),
}));

export const settingsAuditLogsRelations = relations(settingsAuditLogs, ({ one }) => ({
  setting: one(settings, {
    fields: [settingsAuditLogs.settingId],
    references: [settings.id],
  }),
  user: one(user, {
    fields: [settingsAuditLogs.userId],
    references: [user.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type SettingUserOverride = typeof settingsUserOverrides.$inferSelect;
export type NewSettingUserOverride = typeof settingsUserOverrides.$inferInsert;

export type SettingDeployment = typeof settingsDeployment.$inferSelect;
export type NewSettingDeployment = typeof settingsDeployment.$inferInsert;

export type SettingDeploymentHistory = typeof settingsDeploymentHistory.$inferSelect;
export type NewSettingDeploymentHistory = typeof settingsDeploymentHistory.$inferInsert;

export type SettingAuditLog = typeof settingsAuditLogs.$inferSelect;
export type NewSettingAuditLog = typeof settingsAuditLogs.$inferInsert;