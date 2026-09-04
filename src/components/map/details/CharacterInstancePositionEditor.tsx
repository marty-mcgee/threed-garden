'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, User } from 'lucide-react';

export function CharacterInstancePositionEditor({
  markerId,
  initialPosition,
  disabled,
  updating,
  deleting,
  onSave,
  onDelete,
}: {
  markerId: number;
  initialPosition: { x: number; y: number; z: number };
  disabled: boolean;
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, position: { positionX: number; positionY: number; positionZ: number }) => void;
  onDelete: (markerId: number) => void;
}) {
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));

  useEffect(() => {
    // Avoid feeding full-precision Ecctrl coordinates into controlled inputs
    // on every physics frame. Synchronize only the settled display precision.
    const syncTimer = window.setTimeout(() => {
      setPositionX(initialPosition.x.toFixed(1));
      setPositionY(initialPosition.y.toFixed(1));
      setPositionZ(initialPosition.z.toFixed(1));
    }, disabled ? 180 : 0);
    return () => window.clearTimeout(syncTimer);
  }, [disabled, initialPosition.x, initialPosition.y, initialPosition.z]);

  const position = {
    positionX: Number(positionX),
    positionY: Number(positionY),
    positionZ: Number(positionZ),
  };
  const valid = Object.values(position).every(
    (value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000,
  );
  const dirty = position.positionX !== Number(initialPosition.x.toFixed(1))
    || position.positionY !== Number(initialPosition.y.toFixed(1))
    || position.positionZ !== Number(initialPosition.z.toFixed(1));
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Saved';

  return (
    <div className="mt-2 space-y-1.5 rounded bg-white/[0.035] p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100/75">
          <User className="h-3.5 w-3.5" />
          Project Character Instance
        </div>
        <span className={`text-[9px] ${dirty ? (valid ? 'text-amber-200' : 'text-red-300') : 'text-white/35'}`} aria-live="polite">
          {disabled ? 'Release Control to edit' : editStatus}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['X', positionX, setPositionX],
          ['Y', positionY, setPositionY],
          ['Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">Position {label as string}</span>
            <input
              type="number"
              step="0.1"
              value={value as string}
              disabled={disabled || updating || deleting}
              onChange={(event) => (setter as (next: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!valid || !dirty || disabled || updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            onSave(markerId, position);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-violet-600/35 px-2 py-1.5 text-[11px] font-medium text-violet-100 transition-colors hover:bg-violet-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Position
        </button>
        <button
          type="button"
          disabled={disabled || updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            if (!window.confirm('Remove this Character from the ThreeD Project? The reusable Character will remain available in the Library.')) return;
            onDelete(markerId);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete Character
        </button>
      </div>
      {disabled && (
        <p className="text-[9px] text-amber-200/75">Release Control before changing the Character position.</p>
      )}
    </div>
  );
}
