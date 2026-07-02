// lib/config/settings.ts
// ONE FILE TO RULE ALL SETTINGS - Reads from JSON with DB overrides

import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/client';
import { 
  settings as settingsTable,
  settingsUserOverrides,
  settingsDeployment,
  settingsAuditLogs
} from '@/lib/schema/settings';
import { eq, and } from 'drizzle-orm';

// ============================================
// CONSTANTS
// ============================================

export const SOURCE_COLORS: Record<string, string> = {
  caltrans: '#3b82f6',
  bayarea511: '#10b981',
  chpLive: '#ef4444',
  chpHistorical: '#8b5cf6',
  calfire: '#f97316',
  default: '#6b7280',
};

export const SOURCE_ICONS: Record<string, string> = {
  caltrans: '🚧',
  bayarea511: '📻',
  chpLive: '🚨',
  chpHistorical: '📊',
  calfire: '🔥',
  default: '📍',
};

export const SEVERITY_SCALE: Record<string, number> = {
  critical: 1.6,
  fatal: 1.6,
  injury: 1.3,
  high: 1.3,
  medium: 1.0,
  low: 0.8,
  default: 1.0,
};

// ============================================
// TYPES
// ============================================

export type ModuleName = 'traffic' | 'threed' | 'music';

export interface ModuleFeatures {
  polling: boolean;
  cronJobs: boolean;
  dashboard: boolean;
  apiDocs: boolean;
}

export interface TrafficServices {
  chpCad: boolean;
  chpHistorical: boolean;
  caltrans: boolean;
  bayArea511: boolean;
  calfire: boolean;
  cctv: boolean;
}

export interface ThreeDServices {
  weather: boolean;
  farmbot: boolean;
  plants: boolean;
  beds: boolean;
  plantings: boolean;
  tasks: boolean;
  harvests: boolean;
  characters: boolean;
  models: boolean;
  analytics: boolean;
}

export interface MusicServices {
  albums: boolean;
  tracks: boolean;
  links: boolean;
  media: boolean;
  streaming: boolean;
}

export interface ModuleConfig<T> {
  enabled: boolean;
  services: T & {
    features: ModuleFeatures;
  };
}

export interface AppSettings {
  modules: {
    traffic: ModuleConfig<TrafficServices>;
    threed: ModuleConfig<ThreeDServices>;
    music: ModuleConfig<MusicServices>;
  };
  features: ModuleFeatures;
}

// ============================================
// LOAD SETTINGS FROM JSON
// ============================================

import settingsData from './settings.json';

let cachedSettings: AppSettings | null = null;

export function loadSettings(): AppSettings {
  if (cachedSettings) return cachedSettings;
  
  const settings = settingsData as AppSettings;
  cachedSettings = settings;
  return settings;
}

// ============================================
// CONVENIENCE HELPERS (Sync - JSON Only)
// ============================================

export function getSettings(): AppSettings {
  return loadSettings();
}

export function isModuleEnabled(module: ModuleName): boolean {
  return getSettings().modules[module].enabled;
}

export function isServiceEnabled(
  module: ModuleName,
  service: keyof TrafficServices | keyof ThreeDServices | keyof MusicServices
): boolean {
  const settings = getSettings();
  if (!settings.modules[module].enabled) return false;
  const services = settings.modules[module].services as any;
  return services[service] ?? false;
}

export function isFeatureEnabled(feature: keyof ModuleFeatures): boolean {
  return getSettings().features[feature];
}

export function getEnabledServices(module: ModuleName): string[] {
  const settings = getSettings();
  const moduleConfig = settings.modules[module];
  if (!moduleConfig.enabled) return [];
  const services = moduleConfig.services as any;
  return Object.keys(services)
    .filter(key => key !== 'features' && services[key] === true);
}

export function hasAnyServiceEnabled(module: ModuleName): boolean {
  const settings = getSettings();
  const moduleConfig = settings.modules[module];
  if (!moduleConfig.enabled) return false;
  const services = moduleConfig.services as any;
  return Object.keys(services)
    .some(key => key !== 'features' && services[key] === true);
}

// ============================================
// UPDATE SETTINGS (Write to JSON)
// ============================================

const settingsPath = path.join(process.cwd(), 'lib/config/settings.json');

export function updateSettings(newSettings: AppSettings): void {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
    cachedSettings = newSettings;
    console.log('✅ Settings updated successfully');
  } catch (error) {
    console.error('❌ Failed to update settings:', error);
    throw error;
  }
}

export function toggleModule(module: ModuleName, enabled: boolean): void {
  const settings = getSettings();
  settings.modules[module].enabled = enabled;
  updateSettings(settings);
}

export function toggleService(
  module: ModuleName,
  service: keyof TrafficServices | keyof ThreeDServices | keyof MusicServices,
  enabled: boolean
): void {
  const settings = getSettings();
  const services = settings.modules[module].services as any;
  if (services[service] !== undefined) {
    services[service] = enabled;
    updateSettings(settings);
  }
}

export function toggleFeature(feature: keyof ModuleFeatures, enabled: boolean): void {
  const settings = getSettings();
  settings.features[feature] = enabled;
  updateSettings(settings);
}

// ============================================
// DATABASE SETTINGS LOADER (Overrides JSON)
// ============================================

let cachedDBSettings: AppSettings | null = null;
let lastDBLoad: number = 0;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Deep merge two objects
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Load settings from: JSON → Database Deployment → User Overrides
 */
export async function loadSettingsWithDB(userId?: string): Promise<AppSettings> {
  // 1. Start with JSON settings
  let settings = loadSettings();
  
  // 2. Get active deployment settings from database
  const [activeDeployment] = await db
    .select()
    .from(settingsDeployment)
    .where(eq(settingsDeployment.isActive, true))
    .limit(1);

  if (activeDeployment) {
    const deploymentConfig = activeDeployment.settings as AppSettings;
    settings = deepMerge(settings, deploymentConfig);
  }

  // 3. Get user-specific overrides
  if (userId) {
    const overrides = await db
      .select()
      .from(settingsUserOverrides)
      .where(eq(settingsUserOverrides.userId, userId));

    for (const override of overrides) {
      // Get the setting to know its type
      const [settingDef] = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.id, override.settingId))
        .limit(1);

      if (!settingDef) continue;

      // Parse the setting key path (e.g., "modules.traffic.enabled")
      const keyParts = settingDef.key.split('.');
      
      // Navigate to the setting location
      let current: any = settings;
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (current[keyParts[i]] === undefined) {
          // If path doesn't exist, create it
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      // Set the value
      const lastKey = keyParts[keyParts.length - 1];
      current[lastKey] = override.value;
    }
  }

  return settings;
}

/**
 * Get settings with database overrides (cached)
 */
export async function getSettingsWithDB(userId?: string, forceRefresh: boolean = false): Promise<AppSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedDBSettings && (now - lastDBLoad) < CACHE_TTL) {
    return cachedDBSettings;
  }
  cachedDBSettings = await loadSettingsWithDB(userId);
  lastDBLoad = now;
  return cachedDBSettings;
}

// ============================================
// DATABASE CRUD OPERATIONS
// ============================================

/**
 * Create a new deployment snapshot
 */
export async function createDeploymentSettings(
  name: string,
  settings: AppSettings,
  description?: string,
  environment: 'development' | 'staging' | 'production' = 'development'
): Promise<void> {
  await db.insert(settingsDeployment).values({
    name,
    description,
    environment,
    settings: settings as any,
    isActive: false,
  });
}

/**
 * Activate a deployment by name
 */
export async function activateDeploymentSettings(name: string): Promise<void> {
  // Deactivate all
  await db.update(settingsDeployment).set({ isActive: false });
  
  // Activate the chosen one
  await db
    .update(settingsDeployment)
    .set({ isActive: true })
    .where(eq(settingsDeployment.name, name));
  
  cachedDBSettings = null;
}

/**
 * Set a user-specific setting override
 */
export async function setUserSettingOverride(
  userId: string,
  settingKey: string,
  value: any
): Promise<void> {
  // Find the setting definition
  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, settingKey))
    .limit(1);

  if (!setting) {
    throw new Error(`Setting "${settingKey}" not found`);
  }

  // Check if override exists
  const [existing] = await db
    .select()
    .from(settingsUserOverrides)
    .where(
      and(
        eq(settingsUserOverrides.userId, userId),
        eq(settingsUserOverrides.settingId, setting.id)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(settingsUserOverrides)
      .set({ 
        value: value,
        updatedAt: new Date(),
      })
      .where(eq(settingsUserOverrides.id, existing.id));
  } else {
    await db.insert(settingsUserOverrides).values({
      userId,
      settingId: setting.id,
      value: value,
    });
  }

  // Log the change
  await db.insert(settingsAuditLogs).values({
    settingId: setting.id,
    userId,
    action: 'override',
    newValue: value,
  });

  cachedDBSettings = null;
}

/**
 * Clear all user overrides
 */
export async function clearUserOverrides(userId: string): Promise<void> {
  await db
    .delete(settingsUserOverrides)
    .where(eq(settingsUserOverrides.userId, userId));
  
  cachedDBSettings = null;
}

/**
 * Get a user's setting override
 */
export async function getUserSettingOverride(userId: string, settingKey: string): Promise<any> {
  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, settingKey))
    .limit(1);

  if (!setting) return null;

  const [override] = await db
    .select()
    .from(settingsUserOverrides)
    .where(
      and(
        eq(settingsUserOverrides.userId, userId),
        eq(settingsUserOverrides.settingId, setting.id)
      )
    )
    .limit(1);

  return override?.value ?? null;
}

// ============================================
// ASYNC HELPERS (DB-enabled checks)
// ============================================

export async function isModuleEnabledAsync(module: ModuleName, userId?: string): Promise<boolean> {
  const settings = await getSettingsWithDB(userId);
  return settings.modules[module].enabled;
}

export async function isServiceEnabledAsync(
  module: ModuleName,
  service: keyof TrafficServices | keyof ThreeDServices | keyof MusicServices,
  userId?: string
): Promise<boolean> {
  const settings = await getSettingsWithDB(userId);
  if (!settings.modules[module].enabled) return false;
  const services = settings.modules[module].services as any;
  return services[service] ?? false;
}

export async function isFeatureEnabledAsync(feature: keyof ModuleFeatures, userId?: string): Promise<boolean> {
  const settings = await getSettingsWithDB(userId);
  return settings.features[feature];
}

// ============================================
// STARTUP LOG
// ============================================

if (typeof window === 'undefined') {
  const settings = getSettings();
  console.log('\n⚙️  Application Settings Loaded:');
  console.log(`  📦 Modules: Traffic=${settings.modules.traffic.enabled}, ThreeD=${settings.modules.threed.enabled}, Music=${settings.modules.music.enabled}`);
  console.log(`  ⚡ Features: Polling=${settings.features.polling}, Cron=${settings.features.cronJobs}, Dashboard=${settings.features.dashboard}, API Docs=${settings.features.apiDocs}`);
  
  const totalServices = 
    Object.keys(settings.modules.traffic.services).filter(k => k !== 'features' && settings.modules.traffic.services[k as keyof typeof settings.modules.traffic.services]).length +
    Object.keys(settings.modules.threed.services).filter(k => k !== 'features' && settings.modules.threed.services[k as keyof typeof settings.modules.threed.services]).length +
    Object.keys(settings.modules.music.services).filter(k => k !== 'features' && settings.modules.music.services[k as keyof typeof settings.modules.music.services]).length;
  
  console.log(`  🎯 ${totalServices} services enabled\n`);
}

