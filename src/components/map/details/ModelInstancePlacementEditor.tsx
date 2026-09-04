'use client';

import { useState } from 'react';
import { Box, Crosshair, Loader2, Save, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function ModelInstancePlacementEditor({
  instanceId,
  initialName,
  initialScaleMultiplier,
  initialRotationY,
  initialPosition,
  initialPlacementRole,
  baseModelScale,
  updating,
  deleting,
  moveActive,
  onSave,
  onDelete,
  onMoveToggle,
}: {
  instanceId: number;
  initialName: string;
  initialScaleMultiplier: number;
  initialRotationY: number;
  initialPosition: { x: number; y: number; z: number };
  initialPlacementRole: 'object' | 'environment';
  baseModelScale: number;
  updating: boolean;
  deleting: boolean;
  moveActive: boolean;
  onSave: (input: {
    instanceName: string;
    scaleMultiplier: number;
    rotationY: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    placementRole: 'object' | 'environment';
  }) => void;
  onDelete: (instanceId: number, name: string) => void;
  onMoveToggle: (instanceId: number, name: string) => void;
}) {
  const [instanceName, setInstanceName] = useState(initialName);
  const [scaleMultiplier, setScaleMultiplier] = useState(String(initialScaleMultiplier));
  const [rotationYDegrees, setRotationYDegrees] = useState(String(
    Number((initialRotationY * 180 / Math.PI).toFixed(2)),
  ));
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const [placementRole, setPlacementRole] = useState<'object' | 'environment'>(initialPlacementRole);
  const parsedScale = Number(scaleMultiplier);
  const parsedRotationDegrees = Number(rotationYDegrees);
  const parsedPosition = [Number(positionX), Number(positionY), Number(positionZ)];
  const valid = instanceName.trim().length <= 120
    && Number.isFinite(parsedScale)
    && parsedScale >= 0.0001
    && parsedScale <= 10_000
    && Number.isFinite(parsedRotationDegrees)
    && parsedPosition.every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000);
  const busy = updating || deleting;
  const dirty = instanceName.trim() !== initialName.trim()
    || parsedScale !== initialScaleMultiplier
    || parsedRotationDegrees !== Number((initialRotationY * 180 / Math.PI).toFixed(2))
    || parsedPosition[0] !== initialPosition.x
    || parsedPosition[1] !== initialPosition.y
    || parsedPosition[2] !== initialPosition.z
    || placementRole !== initialPlacementRole;
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Saved';

  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100/75">
          <Box className="h-3.5 w-3.5" />
          Project Model Instance
        </div>
        <span className={`text-[9px] ${dirty ? (valid ? 'text-amber-200' : 'text-red-300') : 'text-white/35'}`} aria-live="polite">
          {editStatus}
        </span>
      </div>
      <label className="block space-y-1">
        <span className="text-[10px] text-white/50">Instance name</span>
        <input
          value={instanceName}
          maxLength={120}
          disabled={busy}
          onChange={(event) => setInstanceName(event.target.value)}
          className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-[10px] text-white/50">Instance scale</span>
          <input
            type="number"
            min="0.0001"
            max="10000"
            step="any"
            value={scaleMultiplier}
            disabled={busy}
            onChange={(event) => setScaleMultiplier(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] text-white/50">Y rotation (°)</span>
          <input
            type="number"
            step="1"
            value={rotationYDegrees}
            disabled={busy}
            onChange={(event) => setRotationYDegrees(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Position X', positionX, setPositionX],
          ['Position Y', positionY, setPositionY],
          ['Position Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={busy}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="text-[9px] text-white/35">
        Effective scale: {(baseModelScale * (Number.isFinite(parsedScale) ? parsedScale : 0)).toLocaleString()}
      </div>
      <label className="flex items-center justify-between gap-2 rounded bg-white/[0.035] px-2 py-1.5">
        <span className="text-[10px] text-white/60">Project environment / base map</span>
        <Switch
          checked={placementRole === 'environment'}
          disabled={busy}
          onCheckedChange={(checked) => setPlacementRole(checked ? 'environment' : 'object')}
        />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={!valid || !dirty || busy}
          onClick={(event) => {
            event.stopPropagation();
            onSave({
              instanceName: instanceName.trim(),
              scaleMultiplier: parsedScale,
              rotationY: parsedRotationDegrees * Math.PI / 180,
              positionX: parsedPosition[0],
              positionY: parsedPosition[1],
              positionZ: parsedPosition[2],
              placementRole,
            });
          }}
          className="flex items-center justify-center gap-1.5 rounded bg-cyan-600/35 px-2 py-1.5 text-[11px] font-medium text-cyan-100 transition-colors hover:bg-cyan-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Placement
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onMoveToggle(instanceId, instanceName.trim() || `Model instance #${instanceId}`);
          }}
          className="flex items-center justify-center gap-1 rounded bg-amber-600/30 px-1.5 py-1.5 text-[10px] font-medium text-amber-100 transition-colors hover:bg-amber-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          <Crosshair className="h-3.5 w-3.5" />
          {moveActive ? 'Cancel Move' : 'Move Model'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            const name = instanceName.trim() || `Model instance #${instanceId}`;
            if (!window.confirm(`Delete "${name}" from this ThreeD Project?`)) return;
            onDelete(instanceId, name);
          }}
          className="flex items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {deleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
          Delete Model
        </button>
      </div>
    </div>
  );
}

