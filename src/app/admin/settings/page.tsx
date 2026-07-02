// app/admin/settings/page.tsx
import { getSettings, updateSettings, type AppSettings } from '@/lib/config/settings-old';
import { SettingsManager } from '@/components/admin/SettingsManager';

export default async function SettingsPage() {
  const settings = getSettings();

  async function handleSave(newSettings: AppSettings) {
    'use server';
    updateSettings(newSettings);
  }

  return (
    <div className="container mx-auto py-8">
      <SettingsManager initialSettings={settings} onSave={handleSave} />
    </div>
  );
}