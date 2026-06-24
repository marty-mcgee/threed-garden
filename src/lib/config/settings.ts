// lib/config/settings.ts
// ONE FILE TO RULE ALL SETTINGS - Reads from JSON

import settingsData from './settings.json';

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
let cachedSettings: AppSettings | null = null;

export function loadSettings(): AppSettings {
  if (cachedSettings) return cachedSettings;
  
  // Load from JSON file
  const settings = settingsData as AppSettings;
  cachedSettings = settings;
  
  return settings;
}

// ============================================
// CONVENIENCE HELPERS (Sync - No DB)
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
import fs from 'fs';
import path from 'path';

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

// lib/config/settings.ts (Add these functions)

import { db } from '@/lib/db/client';
import { userSettingsOverrides, deploymentSettings } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

let cachedDBSettings: AppSettings | null = null;
let lastDBLoad: number = 0;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Load settings from: JSON > Database > Overrides
 */
export async function loadSettingsWithDB(userId?: string): Promise<AppSettings> {
  // 1. Start with JSON settings
  let settings = loadSettings();
  
  // 2. Get active deployment settings from database
  const activeDeployment = await db
    .select()
    .from(deploymentSettings)
    .where(eq(deploymentSettings.isActive, true))
    .limit(1);

  if (activeDeployment.length > 0) {
    const deploymentConfig = activeDeployment[0].settings as AppSettings;
    settings = deepMerge(settings, deploymentConfig);
  }

  // 3. Get user-specific overrides
  if (userId) {
    const overrides = await db
      .select()
      .from(userSettingsOverrides)
      .where(eq(userSettingsOverrides.userId, userId));

    for (const override of overrides) {
      if (override.module && override.service) {
        // Service-level override
        const module = settings.modules[override.module as ModuleName];
        if (module && module.services[override.service as keyof typeof module.services] !== undefined) {
          (module.services as any)[override.service] = override.settingValue;
        }
      } else if (override.module) {
        // Module-level override
        const module = settings.modules[override.module as ModuleName];
        if (module) {
          if (override.settingKey === 'enabled') {
            module.enabled = override.settingValue;
          } else if (override.settingKey === 'polling' || 
                     override.settingKey === 'cronJobs' || 
                     override.settingKey === 'dashboard' || 
                     override.settingKey === 'apiDocs') {
            module.services.features[override.settingKey as keyof ModuleFeatures] = override.settingValue;
          }
        }
      }
    }
  }

  return settings;
}

// Helper: Deep merge objects
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

export async function saveDeploymentSettings(
  name: string,
  settings: AppSettings,
  description?: string
): Promise<void> {
  await db.insert(deploymentSettings).values({
    name,
    description,
    settings: settings as any,
    isActive: false,
  });
}

export async function activateDeploymentSettings(name: string): Promise<void> {
  await db.update(deploymentSettings).set({ isActive: false });
  await db
    .update(deploymentSettings)
    .set({ isActive: true })
    .where(eq(deploymentSettings.name, name));
  cachedDBSettings = null;
}

export async function setUserSettingOverride(
  userId: string,
  module: ModuleName,
  settingKey: string,
  settingValue: boolean,
  service?: string
): Promise<void> {
  await db.insert(userSettingsOverrides).values({
    userId,
    module,
    service,
    settingKey,
    settingValue,
  });
  cachedDBSettings = null;
}

export async function clearUserOverrides(userId: string): Promise<void> {
  await db
    .delete(userSettingsOverrides)
    .where(eq(userSettingsOverrides.userId, userId));
  cachedDBSettings = null;
}

// Async versions for DB-enabled checks
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