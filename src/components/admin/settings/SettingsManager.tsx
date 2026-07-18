// components/admin/SettingsManager.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { type AppSettings, type ModuleName } from '@/lib/config/settings';

interface SettingsManagerProps {
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export function SettingsManager({ initialSettings, onSave }: SettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const updateModule = (module: ModuleName, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module],
          enabled,
        },
      },
    }));
  };

  const updateService = (
    module: ModuleName,
    service: string,
    enabled: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module],
          services: {
            ...prev.modules[module].services,
            [service]: enabled,
          },
        },
      },
    }));
  };

  const updateFeature = (feature: keyof AppSettings['features'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Application Settings</h2>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="traffic">
        <TabsList>
          <TabsTrigger value="traffic">
            Traffic {settings.modules.traffic.enabled && <Badge className="ml-2">Active</Badge>}
          </TabsTrigger>
          <TabsTrigger value="threed">
            ThreeD {settings.modules.threed.enabled && <Badge className="ml-2">Active</Badge>}
          </TabsTrigger>
          <TabsTrigger value="music">
            Music {settings.modules.music.enabled && <Badge className="ml-2">Active</Badge>}
          </TabsTrigger>
          <TabsTrigger value="features">Global Features</TabsTrigger>
        </TabsList>

        {(['traffic', 'threed', 'music'] as ModuleName[]).map((module) => (
          <TabsContent key={module} value={module}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{module.charAt(0).toUpperCase() + module.slice(1)} Module</span>
                  <Switch
                    checked={settings.modules[module].enabled}
                    onCheckedChange={(checked) => updateModule(module, checked)}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(settings.modules[module].services)
                    .filter(([key]) => key !== 'features')
                    .map(([service, enabled]) => (
                      <div key={service} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{service}</span>
                        <Switch
                          checked={enabled as boolean}
                          onCheckedChange={(checked) => updateService(module, service, checked)}
                          disabled={!settings.modules[module].enabled}
                        />
                      </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Module Features</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(settings.modules[module].services.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{feature}</span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => {
                            setSettings(prev => ({
                              ...prev,
                              modules: {
                                ...prev.modules,
                                [module]: {
                                  ...prev.modules[module],
                                  services: {
                                    ...prev.modules[module].services,
                                    features: {
                                      ...prev.modules[module].services.features,
                                      [feature]: checked,
                                    },
                                  },
                                },
                              },
                            }));
                          }}
                          disabled={!settings.modules[module].enabled}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Global Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(settings.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{feature}</span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateFeature(feature as keyof AppSettings['features'], checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}