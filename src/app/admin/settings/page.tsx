// app/admin/settings/page.tsx
import { getSettings, updateSettings, type AppSettings } from '@/lib/config/settings';
import { SettingsManager } from '@/components/admin/settings/SettingsManager';

export default async function SettingsPage() {
  const settings = getSettings();

  async function handleSave(newSettings: AppSettings) {
    'use server';
    updateSettings(newSettings);
  }

  return <SettingsManager initialSettings={settings} onSave={handleSave} />;
}
