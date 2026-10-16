'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { ProjectConfigurations } from '@/components/admin/projects/ProjectConfigurations';
import { ProjectDetailsFields, type ProjectDetailsValues } from '@/components/admin/projects/ProjectDetailsFields';
import type { ProjectConfigurationRequest } from '@/libraries/services/project/configuration';
import { DEFAULT_THREED_METERS_PER_SCENE_UNIT } from '@/libraries/services/threed/markers/map-coordinate-core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

const emptyDetails = (): ProjectDetailsValues => ({ name: '', description: '', isPublic: false, isActive: true });

export default function NewProjectPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyDetails);

  const createProject = async (configuration: ProjectConfigurationRequest | undefined, signal: AbortSignal) => {
    if (!formData.name.trim()) throw new Error('Project name is required');
    setLoading(true);
    try {
      const response = await fetch('/api/project', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ ...formData, measurementUnits: configuration?.changes.measurementUnits ?? 'imperial' }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Failed to create Project. Your edits are retained.');
      if (signal.aborted) throw new Error('Project creation was interrupted.');
      if (!Number.isSafeInteger(result.data?.id) || result.data.id <= 0 || !('config' in result.data)) throw new Error('Project creation was not confirmed. Check All Projects before retrying.');
      showToast('Project created successfully', 'success');
      router.push(`/admin/projects/${result.data.id}`);
      return result.data.config as unknown;
    } catch (error) {
      if (!signal.aborted) showToast(error instanceof Error ? error.message : 'Failed to create Project', 'error');
      throw error;
    } finally { setLoading(false); }
  };

  return <div className="space-y-4">
    {ToastComponent}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">New Project</h1><p className="mt-1 text-muted-foreground">Set up Project details, access and measurement preferences. Add modules and Scene content after creation.</p></div><Button variant="outline" asChild><Link href="/admin/projects"><FolderOpen aria-hidden="true" className="mr-2 h-4 w-4" />All Projects</Link></Button></div>
    <Tabs defaultValue="setup" className="space-y-4">
      <TabsList><TabsTrigger value="setup">Setup</TabsTrigger><TabsTrigger value="modules" disabled>Modules and assets</TabsTrigger></TabsList>
      <TabsContent value="setup" className="space-y-4">
        <ProjectConfigurations project={{ id: null, config: { measurementUnits: 'imperial' }, metersPerSceneUnit: String(DEFAULT_THREED_METERS_PER_SCENE_UNIT), headingDegrees: '0', originLatitude: null, originLongitude: null }}
          disabled={loading} detailsDirty={Boolean(formData.name || formData.description || formData.isPublic || !formData.isActive)}
          onSave={createProject} onReset={() => setFormData(emptyDetails())} onSaved={() => {}} onCalibrate={() => {}}
          details={<Card><CardContent className="space-y-3 p-4"><h2 className="text-base font-semibold">Project details and access</h2><ProjectDetailsFields value={formData} onChange={setFormData} disabled={loading} idPrefix="new-project" /><p className="text-xs text-muted-foreground">Create the Project to add modules/assets and calibrate coordinates. No Models, Designs or Scene snapshots are created by this form.</p></CardContent></Card>} />
      </TabsContent>
    </Tabs>
  </div>;
}
