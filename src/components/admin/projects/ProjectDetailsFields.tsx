'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface ProjectDetailsValues { name: string; featured_image?: string; description: string; isPublic: boolean; isActive: boolean }

/** Shared New/Edit fields; draft and persistence stay with the owning page. */
export function ProjectDetailsFields({ value, onChange, disabled, idPrefix }: {
  value: ProjectDetailsValues; onChange: (value: ProjectDetailsValues) => void; disabled: boolean; idPrefix: string;
}) {
  return <>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1"><Label htmlFor={`${idPrefix}-name`} className="text-sm">Project Name</Label><Input id={`${idPrefix}-name`} required value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} disabled={disabled} /></div>
      <div className="space-y-1"><Label htmlFor={`${idPrefix}-description`} className="text-sm">Description</Label><Input id={`${idPrefix}-description`} value={value.description} onChange={event => onChange({ ...value, description: event.target.value })} disabled={disabled} /></div>
    </div>
    <div className="space-y-1"><Label htmlFor={`${idPrefix}-featured-image`} className="text-sm">Featured image</Label><Input id={`${idPrefix}-featured-image`} value={value.featured_image ?? ''} maxLength={2048} placeholder="/home/showcase/garden-project.png or https://?" onChange={event => onChange({ ...value, featured_image: event.target.value })} disabled={disabled} aria-describedby={`${idPrefix}-featured-image-help`} /><p id={`${idPrefix}-featured-image-help`} className="text-xs text-muted-foreground">App image path or HTTPS image URL. Leave empty to remove the image. Saved with Project details.</p></div>
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2"><Switch id={`${idPrefix}-public`} checked={value.isPublic} onCheckedChange={checked => onChange({ ...value, isPublic: checked })} disabled={disabled} /><Label htmlFor={`${idPrefix}-public`} className="text-sm">Public</Label></div>
      <div className="flex items-center gap-2"><Switch id={`${idPrefix}-active`} checked={value.isActive} onCheckedChange={checked => onChange({ ...value, isActive: checked })} disabled={disabled} /><Label htmlFor={`${idPrefix}-active`} className="text-sm">Active</Label></div>
    </div>
  </>;
}
