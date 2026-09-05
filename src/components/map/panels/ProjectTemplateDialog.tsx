'use client';

import { useState } from 'react';
import { Box, Boxes, Check, Loader2, Music, TrafficCone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  PROJECT_TEMPLATES,
  type ProjectTemplateKey,
} from '@/lib/services/project/project-templates';

export function ProjectTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (projectId: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [templateKey, setTemplateKey] = useState<ProjectTemplateKey>('threed-starter');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setTemplateKey('threed-starter');
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter a Project name.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/project/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), isPublic, templateKey }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success || !payload?.data?.project?.id) {
        throw new Error(payload?.error || 'Failed to create Project');
      }
      const projectId = String(payload.data.project.id);
      onOpenChange(false);
      reset();
      onCreated(projectId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create Project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Project from a Template</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleCreate}>
          <div className="space-y-2">
            <Label htmlFor="template-project-name">Project Name</Label>
            <Input id="template-project-name" value={name} maxLength={120} disabled={submitting} onChange={(event) => setName(event.target.value)} placeholder="My ThreeD Project" autoFocus />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Project Template</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PROJECT_TEMPLATES.map((template) => {
                const selected = template.key === templateKey;
                return (
                  <button
                    key={template.key}
                    type="button"
                    disabled={submitting}
                    aria-pressed={selected}
                    className={`relative rounded-lg border p-3 text-left transition-colors ${selected ? 'border-cyan-500 bg-cyan-500/10' : 'border-border hover:border-cyan-500/40 hover:bg-muted/50'}`}
                    onClick={() => setTemplateKey(template.key)}
                  >
                    {selected && <Check className="absolute right-2 top-2 h-4 w-4 text-cyan-500" aria-hidden="true" />}
                    <Boxes className="mb-2 h-5 w-5 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
                    <div className="pr-5 text-sm font-medium">{template.name}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{template.description}</p>
                    <div className="mt-2 flex min-h-4 gap-1 text-muted-foreground" aria-label={`${template.name} modules`}>
                      {template.modules.length === 0 && <span className="text-[10px]">No modules</span>}
                      {template.modules.includes('threed') && <Box className="h-3.5 w-3.5" aria-label="ThreeD" />}
                      {template.modules.includes('traffic') && <TrafficCone className="h-3.5 w-3.5" aria-label="Traffic" />}
                      {template.modules.includes('music') && <Music className="h-3.5 w-3.5" aria-label="Music" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="template-project-description">Description</Label>
            <Textarea id="template-project-description" value={description} maxLength={2000} rows={3} disabled={submitting} onChange={(event) => setDescription(event.target.value)} placeholder="What will this Project contain?" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="template-project-public">Public Project</Label>
              <p className="text-[11px] text-muted-foreground">Allow other users to discover this Project after it contains active assets.</p>
            </div>
            <Switch id="template-project-public" checked={isPublic} disabled={submitting} onCheckedChange={setIsPublic} />
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !name.trim()} className="bg-cyan-600 text-white hover:bg-cyan-500">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create &amp; Open Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
