'use client';

import { useEffect, useState, type CSSProperties, type Ref } from 'react';
import { Mountain, X } from 'lucide-react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { DetailsCardSection } from './DetailsCardSection';
import { DetailsSectionScope } from './PersistentDetails';
import { useProjectOverlayPosition } from '../panels/ProjectOverlayLayout';
import { parseTerrainPlacement, type ProjectTerrainSurface, type TerrainPlacementDraft } from '@/libraries/services/threed/terrains/terrain-core';

const placementFields = [
  { key: 'centerXM', label: 'Position X (m)' },
  { key: 'centerZM', label: 'Position Z (m)' },
  { key: 'rotationYDeg', label: 'Rotation Y (°)' },
  { key: 'scale', label: 'Uniform scale' },
] as const;

export function TerrainDetailsCard({ surface, projectId, canEdit, leftOffsetRem, onChange, onChoose, onClose, onSave, saving }: {
  surface: ProjectTerrainSurface;
  projectId: string;
  canEdit: boolean;
  leftOffsetRem: number;
  onChange: (surface: ProjectTerrainSurface | null) => void;
  onChoose: () => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const overlay = useProjectOverlayPosition('details');
  const [values, setValues] = useState(() => fieldValues(surface.placement));
  const [error, setError] = useState('');

  useEffect(() => {
    setValues(fieldValues(surface.placement));
    setError('');
  }, [surface.placement]);

  function applyPlacement() {
    try {
      const placement = parseTerrainPlacement({
        ...surface.placement,
        centerXM: Number(values.centerXM),
        centerZM: Number(values.centerZM),
        rotationYDeg: Number(values.rotationYDeg),
        scale: Number(values.scale),
      });
      if (!placement || Object.values(values).some(value => value.trim() === '')) throw new Error('Enter all Terrain placement values.');
      onChange({ ...surface, placement });
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid Terrain placement.');
    }
  }

  const isDraft = placementFields.some(field => values[field.key] !== String(surface.placement[field.key]));
  const draftScale = Number(values.scale);
  const terrainPeakM = Math.max(0, ...surface.definition.heightsM) * surface.placement.scale;
  const footprint = Number.isFinite(draftScale) && draftScale > 0
    ? `${formatMetres(surface.definition.widthM * draftScale)} × ${formatMetres(surface.definition.lengthM * draftScale)} m`
    : null;
  const style: CSSProperties = {
    left: `${leftOffsetRem}rem`,
    backgroundColor: 'var(--threed-details-background, rgba(17, 26, 40, 0.5))',
    ...overlay.style,
  };

  return <DetailsSectionScope.Provider value={`${projectId}:terrain:${surface.placement.terrainId}`}>
    <div ref={overlay.ref as Ref<HTMLDivElement>} data-positioned={overlay.style ? 'true' : undefined} className="flex flex-col threed-workspace-panel threed-details-surface threed-inspector absolute top-[38px] z-40 max-h-[calc(100%-38px)] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-foreground/15 text-foreground shadow-xl pointer-events-auto [scrollbar-width:thin]" style={style}>
      <div {...overlay.handle} aria-label="Move Terrain DetailsCard" className={`${overlay.handle.className} shrink-0 flex items-start justify-between gap-2 border-b border-foreground/10 px-3 py-3`}>
        <div className="flex min-w-0 items-center gap-2"><Mountain aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-500" /><strong className="min-w-0 break-words text-sm">{surface.name}</strong><ModelFieldHelp label="Terrain DetailsCard">Edit this Project's placement of the selected reusable Terrain. Apply changes, then Save Project to retain them. The Terrain definition is managed in Admin.</ModelFieldHelp></div>
        <button type="button" onClick={onClose} aria-label="Close Terrain DetailsCard" className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-foreground/10"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 overflow-y-auto px-2 pb-2 text-xs">
        <DetailsCardSection title="Project placement" defaultOpen help="The Terrain is one Project placement. Changes remain a draft until you save the Project.">
          <div className="grid grid-cols-2 gap-2">
            {placementFields.map(field => <label key={field.key} className="min-w-0">{field.label}<input type="number" step="any" value={values[field.key]} disabled={!canEdit || saving} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} className="mt-1 w-full rounded border bg-background px-2 py-1.5 disabled:opacity-50" /></label>)}
          </div>
          {footprint && <p className="mt-2 text-muted-foreground">Footprint at this scale: {footprint}</p>}
          {error && <p role="alert" className="text-red-400">{error}</p>}
          {canEdit && <button type="button" disabled={!isDraft || saving} onClick={applyPlacement} className="mt-2 rounded border px-2 py-1.5 disabled:opacity-50">Apply placement</button>}
        </DetailsCardSection>
        <DetailsCardSection title="Terrain information">
          <p>{surface.definition.widthM} × {surface.definition.lengthM} m · {surface.definition.columns} × {surface.definition.rows} height samples</p>
          <p>Terrain revision {surface.placement.terrainRevision}</p>
          <p>Highest Terrain elevation at this placement: {formatMetres(terrainPeakM)} m.</p>
          <p>Project Models remain separate. Set a flat Model platform above the Terrain with that Model&apos;s placement controls, then save the Project to retain both.</p>
          {canEdit && <a href={`/admin/threed/terrains/${surface.placement.terrainId}`} target="_blank" rel="noopener noreferrer" className="inline-block underline">Edit Terrain definition in Admin<span className="sr-only"> (opens in a new tab)</span></a>}
        </DetailsCardSection>
        {canEdit && <div className="mt-3 flex flex-wrap gap-2 border-t border-foreground/10 pt-3">
          <button type="button" disabled={saving || isDraft} onClick={onSave} className="rounded bg-emerald-700 px-2 py-1.5 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Project'}</button>
          <button type="button" disabled={saving} onClick={onChoose} className="rounded border px-2 py-1.5">Change Terrain</button>
          <button type="button" disabled={saving} onClick={() => { onChange(null); onClose(); }} className="rounded border px-2 py-1.5">Remove Terrain</button>
          {isDraft && <p className="w-full text-muted-foreground">Apply placement before saving the Project.</p>}
        </div>}
      </div>
    </div>
  </DetailsSectionScope.Provider>;
}

function fieldValues(placement: TerrainPlacementDraft) {
  return {
    centerXM: String(placement.centerXM),
    centerZM: String(placement.centerZM),
    rotationYDeg: String(placement.rotationYDeg),
    scale: String(placement.scale),
  };
}

function formatMetres(value: number) {
  return Number(value.toFixed(2)).toString();
}
