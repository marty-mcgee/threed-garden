// lib/data/settings/seed.ts
import { db } from '@/lib/db/client';
import { settings, settingsDeployment } from '@/lib/schema/settings';

export async function seedDefaultSettings() {
  // System settings
  const systemSettings = [
    {
      key: 'app.name',
      scope: 'system' as const,
      value: 'Marty McGee Neon',
      type: 'string' as const,
      label: 'Application Name',
      group: 'appearance',
      category: 'system',
      defaultValue: 'Marty McGee Neon',
    },
    {
      key: 'app.theme',
      scope: 'system' as const,
      value: 'system',
      type: 'string' as const,
      label: 'Default Theme',
      group: 'appearance',
      category: 'system',
      defaultValue: 'system',
    },
    {
      key: 'app.timezone',
      scope: 'system' as const,
      value: 'America/Los_Angeles',
      type: 'string' as const,
      label: 'Default Timezone',
      group: 'regional',
      category: 'system',
      defaultValue: 'America/Los_Angeles',
    },
  ];

  // Feature settings
  const featureSettings = [
    {
      key: 'features.traffic.enabled',
      scope: 'system' as const,
      value: true,
      type: 'boolean' as const,
      label: 'Traffic Module',
      group: 'features',
      category: 'traffic',
      defaultValue: true,
    },
    {
      key: 'features.threed.enabled',
      scope: 'system' as const,
      value: true,
      type: 'boolean' as const,
      label: 'ThreeD Module',
      group: 'features',
      category: 'threed',
      defaultValue: true,
    },
    {
      key: 'features.music.enabled',
      scope: 'system' as const,
      value: true,
      type: 'boolean' as const,
      label: 'Music Module',
      group: 'features',
      category: 'music',
      defaultValue: true,
    },
    {
      key: 'features.polling.enabled',
      scope: 'system' as const,
      value: true,
      type: 'boolean' as const,
      label: 'Auto Polling',
      group: 'features',
      category: 'system',
      defaultValue: true,
    },
  ];

  // Integration settings
  const integrationSettings = [
    {
      key: 'integrations.aws.s3.bucket',
      scope: 'system' as const,
      value: 'threedpublic',
      type: 'string' as const,
      label: 'S3 Bucket',
      group: 'integrations',
      category: 'storage',
      isSensitive: true,
      defaultValue: 'threedpublic',
    },
    {
      key: 'integrations.openweather.api_key',
      scope: 'system' as const,
      value: '',
      type: 'string' as const,
      label: 'OpenWeather API Key',
      group: 'integrations',
      category: 'weather',
      isSensitive: true,
      defaultValue: '',
    },
  ];

  const allSettings = [...systemSettings, ...featureSettings, ...integrationSettings];

  for (const setting of allSettings) {
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, setting.key))
      .limit(1);

    if (!existing) {
      await db.insert(settings).values(setting);
    }
  }

  // Create default deployment
  const [existingDeployment] = await db
    .select()
    .from(settingsDeployment)
    .where(eq(settingsDeployment.name, 'default'))
    .limit(1);

  if (!existingDeployment) {
    await db.insert(settingsDeployment).values({
      name: 'default',
      environment: 'development',
      description: 'Default development settings',
      settings: {},
      isActive: true,
    });
  }

  console.log('✅ Default settings seeded');
}