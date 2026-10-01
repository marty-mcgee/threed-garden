'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MODEL_FALLBACK_SHAPES,
  type ModelFallbackShape,
} from '@/libraries/services/threed/models/model-fallback-core';

export function AddShapeDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, shape: ModelFallbackShape) => Promise<void>;
}) {
  const [name, setName] = useState('ThreeD Sphere');
  const [shape, setShape] = useState<ModelFallbackShape>('sphere');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeOpen = (next: boolean) => {
    if (busy) return;
    onOpenChange(next);
    if (!next) setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const modelName = name.trim();
    if (!modelName) {
      setError('Enter a Model name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(modelName, shape);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the shape.');
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add Shape</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Save a file-free procedural Model, then place it in this Project. For a soccer ball, set its Physics Mode to Movable Ball after placement.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="scene-shape-name">Model name</Label>
          <Input id="scene-shape-name" value={name} maxLength={255} disabled={busy}
            onChange={event => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scene-shape-kind">Shape</Label>
          <select id="scene-shape-kind" value={shape} disabled={busy}
            onChange={event => setShape(event.target.value as ModelFallbackShape)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {MODEL_FALLBACK_SHAPES.map(value =>
              <option key={value} value={value}>{value === 'box' ? 'Box / Block' : value[0].toUpperCase() + value.slice(1)}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => changeOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Model and Place
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
