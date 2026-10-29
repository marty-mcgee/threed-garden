'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DesignModelTransform {
  positionX: number;
  positionY: number;
  positionZ: number;
  scaleMultiplier: number;
}

export interface DesignModelSelection extends DesignModelTransform {
  id: string;
  name: string;
}

export type SaveDesignModel = (id: string, transform: DesignModelTransform) => Promise<boolean>;

export function DesignModelProperties({ model, save, metersPerSceneUnit, busy }: {
  model: DesignModelSelection;
  save: SaveDesignModel;
  metersPerSceneUnit: number;
  busy: boolean;
}) {
  const initial = () => ({
    positionX: String(model.positionX * metersPerSceneUnit),
    positionY: String(model.positionY * metersPerSceneUnit),
    positionZ: String(model.positionZ * metersPerSceneUnit),
    scaleMultiplier: String(model.scaleMultiplier),
  });
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setDraft(initial()); }, [model.positionX, model.positionY, model.positionZ, model.scaleMultiplier, metersPerSceneUnit]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial());
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    const selection = (event: Event) => {
      if (saving || (dirty && !window.confirm('Discard unsaved Model property changes?'))) event.preventDefault();
    };
    const navigation = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.('a[href]');
      if (link && (saving || (dirty && !window.confirm('Discard unsaved Model property changes?')))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', guard);
    window.addEventListener('threed:design:model-selection', selection);
    window.addEventListener('threed:design:transition', selection);
    document.addEventListener('click', navigation, true);
    return () => {
      window.removeEventListener('beforeunload', guard);
      window.removeEventListener('threed:design:model-selection', selection);
      window.removeEventListener('threed:design:transition', selection);
      document.removeEventListener('click', navigation, true);
    };
  }, [dirty, saving]);
  return <div className="space-y-2 text-xs">
    <p className="font-semibold">{model.name}</p>
    <div className="grid grid-cols-2 gap-2">
      {(['positionX', 'positionY', 'positionZ', 'scaleMultiplier'] as const).map(field => <label key={field}>
        {field === 'scaleMultiplier' ? 'Uniform scale' : `Position ${field.slice(-1)} (m)`}
        <Input aria-label={field === 'scaleMultiplier' ? 'Model uniform scale' : `Model position ${field.slice(-1)} (m)`} type="number" step="any" disabled={busy || saving} value={draft[field]} onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} />
      </label>)}
    </div>
    <Button size="xs" disabled={busy || saving || !dirty} onClick={async () => {
      const values = Object.values(draft);
      if (values.some(value => !value.trim() || !Number.isFinite(Number(value))) || Number(draft.scaleMultiplier) < .0001 || Number(draft.scaleMultiplier) > 10000) { setError('Enter valid positions and a scale between 0.0001 and 10000.'); return; }
      setSaving(true);
      setError('');
      try {
        const saved = await save(model.id, {
          positionX: Number(draft.positionX) / metersPerSceneUnit,
          positionY: Number(draft.positionY) / metersPerSceneUnit,
          positionZ: Number(draft.positionZ) / metersPerSceneUnit,
          scaleMultiplier: Number(draft.scaleMultiplier),
        });
        if (!saved) setError('Model update failed. Your values are retained; retry Save Model.');
      } catch { setError('Model update failed. Your values are retained; retry Save Model.'); }
      finally { setSaving(false); }
    }}>Save Model</Button>
    {error && <p role="alert">{error}</p>}
    <p className="text-muted-foreground">Drag the image to move. Drag its corner to resize proportionally. Canvas edits save on release.</p>
  </div>;
}
