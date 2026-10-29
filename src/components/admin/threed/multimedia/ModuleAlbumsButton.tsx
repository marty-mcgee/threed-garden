'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ModuleKey } from '@/libraries/config/module-appearance';
import type { AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { AlbumEntityPicker } from './AlbumEntityPicker';

export const moduleAlbumKinds: Partial<Record<ModuleKey, AlbumModuleType>> = {
  models: 'model',
  characters: 'character',
  plants: 'plant',
  plantings: 'planting',
  beds: 'bed',
  farmbots: 'farmbot',
  scenarios: 'scenario',
  simulations: 'simulation',
  layers: 'layer',
  tasks: 'task',
  harvests: 'harvest',
  waterings: 'watering',
  modelFiles: 'model_file',
  modelCategories: 'model_category',
  modelTextures: 'texture',
  animations: 'animation',
  animationCategories: 'animation_category',
  animationSlots: 'animation_slot',
  assemblyGroups: 'assembly',
};

/** Module-local access for lists and catalogs without a standalone edit page. */
export function ModuleAlbumsButton({ moduleKey }: { moduleKey: ModuleKey }) {
  const [open, setOpen] = useState(false);
  const kind = moduleAlbumKinds[moduleKey];
  if (moduleKey === 'designs') return <Button asChild type="button" size="sm" variant="outline" className="h-7 text-xs"><Link href="/admin/projects" title="Open the owning Project to manage its Multimedia assets">Project Multimedia</Link></Button>;
  if (!kind) return null;
  return <>
    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>Multimedia Albums</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Multimedia Albums</DialogTitle></DialogHeader>
        {open && <AlbumEntityPicker key={kind} fixedKind={kind} contextual />}
      </DialogContent>
    </Dialog>
  </>;
}
