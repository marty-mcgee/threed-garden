// lib/config/settings.server.ts
import 'server-only';
import settingsData from './settings.json';
import type { AppSettings, ModuleName } from './settings';

let cachedSettings: AppSettings | null = null;

export function getServerSettings(): AppSettings {
  if (!cachedSettings) {
    cachedSettings = settingsData as AppSettings;
  }
  return cachedSettings;
}

export function isModuleEnabledServer(module: ModuleName): boolean {
  return getServerSettings().modules[module].enabled;
}

export function isServiceEnabledServer(
  module: ModuleName,
  service: string
): boolean {
  const settings = getServerSettings();
  if (!settings.modules[module].enabled) return false;
  const services = settings.modules[module].services as any;
  return services[service] ?? false;
}