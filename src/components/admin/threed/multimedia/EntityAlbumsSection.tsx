'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AlbumModuleType } from '@/libraries/services/threed/multimedia/album-entity-registry';
import { EntityAlbumWorkspace } from './EntityAlbumWorkspace';

/** Contextual editor: the saved record supplies identity, never a second entity picker. */
export function EntityAlbumsSection({ moduleType, entityId, entityName, disabled = false }: {
  moduleType: AlbumModuleType;
  entityId: number | string;
  entityName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({
    dirty: false,
    busy: false,
  });
  function changeOpen(next: boolean) {
    if (!next && (state.busy || (state.dirty && !window.confirm('Discard unsaved Album changes?')))) return;
    setOpen(next);
    if (!next) setState({ dirty: false, busy: false });
  }
  return <section className="space-y-2 rounded-lg border p-3" aria-label="Multimedia Albums">
    <h2 className="text-sm font-semibold">Multimedia Albums</h2>
    <p className="text-xs text-muted-foreground">Choose related Albums for this saved item. Album assignments have their own Save.</p>
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => changeOpen(true)}>Edit Albums</Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl" onEscapeKeyDown={event => { if (state.busy || state.dirty) { event.preventDefault(); changeOpen(false); } }} onInteractOutside={event => { if (state.busy || state.dirty) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Multimedia Albums</DialogTitle></DialogHeader>
        {open && <EntityAlbumWorkspace key={`${moduleType}:${entityId}`} moduleType={moduleType} entityId={entityId} entityName={entityName} onStateChange={setState} hideChooser />}
      </DialogContent>
    </Dialog>
  </section>;
}
