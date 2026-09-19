'use client';

import { useEffect, useState } from 'react';
import { Crosshair, Loader2, Save, Sprout, Trash2 } from 'lucide-react';

export function PlantingInstanceEditor({
  markerId,
  initialModelScale,
  initialPosition,
  initialBedId,
  beds,
  updating,
  deleting,
  onSave,
  onDelete,
  moveActive = false,
  onMoveToggle,
}: {
  moveActive?: boolean;
  onMoveToggle?: (markerId: number, input: {bedId:number|null;modelScale:number}) => void;
  markerId: number;
  initialModelScale: number;
  initialBedId: number | null;
  beds: {id:number;name:string}[];
  initialPosition: { x: number; y: number; z: number };
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, input: {
    bedId?: number | null;
    modelScale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  }) => void;
  onDelete: (markerId: number, name: string) => void;
}) {
  const [modelScale, setModelScale] = useState(String(initialModelScale));
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const [bedId, setBedId] = useState(initialBedId === null ? '' : String(initialBedId));
  useEffect(() => {
    setModelScale(String(initialModelScale));
    setPositionX(String(initialPosition.x)); setPositionY(String(initialPosition.y)); setPositionZ(String(initialPosition.z));
    setBedId(initialBedId === null ? '' : String(initialBedId));
  }, [initialModelScale, initialPosition.x, initialPosition.y, initialPosition.z, initialBedId]);
  const parsed = {
    bedId: bedId === '' ? null : Number(bedId),
    modelScale: Number(modelScale),
    positionX: Number(positionX),
    positionY: Number(positionY),
    positionZ: Number(positionZ),
  };
  const valid = Number.isFinite(parsed.modelScale)
    && parsed.modelScale >= 0.01
    && parsed.modelScale <= 1_000
    && [parsed.positionX, parsed.positionY, parsed.positionZ].every(
      (value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000,
    );
  const dirty = parsed.bedId !== initialBedId || parsed.modelScale !== initialModelScale
    || parsed.positionX !== initialPosition.x
    || parsed.positionY !== initialPosition.y
    || parsed.positionZ !== initialPosition.z;
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Saved';

  return (
    <div className="contents">
      <div className="order-[-10] mt-2 grid grid-cols-3 gap-1.5">
        <button type="button" disabled={!valid || !dirty || updating || deleting}
          onClick={(event) => { event.stopPropagation(); onSave(markerId, parsed); }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-emerald-600/35 px-2 py-1.5 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-emerald-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30">
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Planting
        </button>
        <button type="button" disabled={!valid || updating || deleting || !onMoveToggle} aria-pressed={moveActive}
          onClick={event=>{event.stopPropagation(); onMoveToggle?.(markerId,{bedId:parsed.bedId,modelScale:parsed.modelScale});}}
          className="flex items-center justify-center gap-1 rounded bg-amber-600/30 px-1.5 py-1.5 text-[10px] font-medium text-amber-100 hover:bg-amber-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30">
          <Crosshair className="h-3.5 w-3.5" />{moveActive ? 'Cancel Move' : 'Move Planting'}
        </button>
        <button type="button" disabled={updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            const name = 'this Planting';
            if (!window.confirm(`Delete ${name} from this ThreeD Project?`)) return;
            onDelete(markerId, name);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30">
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete Planting
        </button>
      </div>
      <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100/75">
          <Sprout className="h-3.5 w-3.5" />
          Project Planting Instance
        </div>
        <span className={`text-[9px] ${dirty ? (valid ? 'text-amber-200' : 'text-red-300') : 'text-white/35'}`} aria-live="polite">
          {editStatus}
        </span>
      </div>
      <label className="block space-y-1">
        <span className="text-[9px] text-white/50">Assigned Bed</span>
        <select value={bedId} onChange={event=>setBedId(event.target.value)} disabled={updating || deleting}
          className="h-7 w-full rounded border border-white/10 bg-zinc-900 px-1.5 text-[11px] text-white focus:border-white/30 disabled:opacity-50">
          <option value="">Unassigned</option>
          {initialBedId !== null && !beds.some(bed=>bed.id===initialBedId) && <option value={initialBedId}>Unavailable Bed #{initialBedId}</option>}
          {beds.map(bed=><option key={bed.id} value={bed.id}>{bed.name}</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[9px] text-white/50">Model scale</span>
        <input type="number" min="0.01" max="1000" step="0.01" value={modelScale}
          disabled={updating || deleting} onChange={(event) => setModelScale(event.target.value)}
          className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Position X', positionX, setPositionX],
          ['Position Y', positionY, setPositionY],
          ['Position Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input type="number" step="0.1" value={value as string} disabled={updating || deleting}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
          </label>
        ))}
      </div>
      </div>
    </div>
  );
}
