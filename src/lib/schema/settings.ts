// lib/schema/settings.ts
import { pgTable, text, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';
import { user } from "@/lib/schema";

export const userSettingsOverrides = pgTable('user_settings_overrides', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  module: text('module').notNull(), // 'traffic', 'threed', 'music'
  service: text('service'), // Optional: specific service within module
  settingKey: text('setting_key').notNull(), // e.g., 'enabled', 'polling', 'chpCad'
  settingValue: boolean('setting_value').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const deploymentSettings = pgTable('deployment_settings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  settings: jsonb('settings').notNull(), // Stores full AppSettings object
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type UserSettingOverride = typeof userSettingsOverrides.$inferSelect;
export type NewUserSettingOverride = typeof userSettingsOverrides.$inferInsert;
export type DeploymentSetting = typeof deploymentSettings.$inferSelect;
export type NewDeploymentSetting = typeof deploymentSettings.$inferInsert;