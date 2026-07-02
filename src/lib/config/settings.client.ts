// lib/config/settings.client.ts
'use client';

import settingsData from './settings.json';
import type { AppSettings, ModuleName } from './settings-old';

export function getClientSettings(): AppSettings {
  return settingsData as AppSettings;
}

export function isModuleEnabledClient(module: ModuleName): boolean {
  return getClientSettings().modules[module].enabled;
}

export function isServiceEnabledClient(
  module: ModuleName,
  service: string
): boolean {
  const settings = getClientSettings();
  if (!settings.modules[module].enabled) return false;
  const services = settings.modules[module].services as any;
  return services[service] ?? false;
}