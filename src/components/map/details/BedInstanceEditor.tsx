'use client';

import { useState } from 'react';
import { Layers, Crosshair, Loader2, Save, Settings, Trash2 } from 'lucide-react';
import { DetailsCardSection } from './DetailsCardSection';

export function BedInstanceEditor({
  markerId,
  moveActive = false,
  onMoveToggle,
  initialWidthFeet,
  initialLengthFeet,
  initialHeightFeet,
  initialScale,
  initialColor,
  initialPosition,
  initialRotation,
  updating,
  deleting,
  onSave,
  onDelete,
  entityLabel = 'Bed',
}: {
  moveActive?: boolean;
  onMoveToggle?: (markerId:number) => void;
  markerId: number;
  initialWidthFeet: number;
  initialLengthFeet: number;
  initialHeightFeet: number;
  initialScale: number;
  initialColor: string;
  initialPosition: { x: number; y: number; z: number };
  initialRotation: number;
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, input: {
    widthFeet: number;
    lengthFeet: number;
    heightFeet: number;
    scale: number;
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotation: number;
  }) => void;
  onDelete: (markerId: number, name: string) => void;
  entityLabel?: 'Bed' | 'FarmBot';
}) {
  const [widthFeet, setWidthFeet] = useState(String(initialWidthFeet));
  const [lengthFeet, setLengthFeet] = useState(String(initialLengthFeet));
  const [heightFeet, setHeightFeet] = useState(String(initialHeightFeet));
  const [scale, setScale] = useState(String(initialScale));
  const [color, setColor] = useState(initialColor);
  const [positionX, setPositionX] = useState(String(initialPosition.x));
  const [positionY, setPositionY] = useState(String(initialPosition.y));
  const [positionZ, setPositionZ] = useState(String(initialPosition.z));
  const [rotationDegrees, setRotationDegrees] = useState(String(initialRotation));
  const dimensions = [Number(widthFeet), Number(lengthFeet), Number(heightFeet)];
  const positions = [Number(positionX), Number(positionY), Number(positionZ)];
  const parsedRotationDegrees = Number(rotationDegrees);
  const parsedScale = Number(scale);
  const valid = dimensions.every((value) => (
    Number.isFinite(value) && value >= 0.1 && value <= 1_000
  ))
    && positions.every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000)
    && Number.isFinite(parsedRotationDegrees)
    && Number.isFinite(parsedScale) && parsedScale >= 0.01 && parsedScale <= 1_000
    && /^#[0-9a-f]{6}$/i.test(color);
  const busy = updating || deleting;
  const dirty = dimensions[0] !== initialWidthFeet
    || dimensions[1] !== initialLengthFeet
    || dimensions[2] !== initialHeightFeet
    || parsedScale !== initialScale
    || color.toLowerCase() !== initialColor.toLowerCase()
    || positions[0] !== initialPosition.x
    || positions[1] !== initialPosition.y
    || positions[2] !== initialPosition.z
    || parsedRotationDegrees !== initialRotation;
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Saved';

  return (
    <div className="contents">
      <div className="order-[-10] mt-2 grid grid-cols-3 gap-1.5">
      <button
        type="button"
        disabled={!valid || !dirty || busy}
        onClick={(event) => {
          event.stopPropagation();
          onSave(markerId, {
            widthFeet: dimensions[0],
            lengthFeet: dimensions[1],
            heightFeet: dimensions[2],
            scale: parsedScale,
            color,
            positionX: positions[0],
            positionY: positions[1],
            positionZ: positions[2],
            rotation: parsedRotationDegrees,
          });
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-amber-600/35 px-2 py-1.5 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save {entityLabel}
      </button>
      <button type="button" disabled={busy || (!moveActive && dirty) || !onMoveToggle} aria-pressed={moveActive}
        onClick={event=>{event.stopPropagation();onMoveToggle?.(markerId);}}
        className="flex items-center justify-center gap-1 rounded bg-amber-600/30 px-1.5 py-1.5 text-[10px] font-medium text-amber-100 hover:bg-amber-600/55 disabled:opacity-40">
        <Crosshair className="h-3.5 w-3.5" />{moveActive ? 'Cancel Move' : <>Move {entityLabel}</>}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          if (!window.confirm(`Remove this ${entityLabel} from this ThreeD Project?`)) return;
          onDelete(markerId, entityLabel);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Remove {entityLabel}
      </button>
      </div>
      <DetailsCardSection
        title={<span className="inline-flex items-center gap-1.5">
          {entityLabel === 'FarmBot'
            ? <Settings className="h-3.5 w-3.5" />
            : <Layers className="h-3.5 w-3.5" />}
          Project {entityLabel} Instance
        </span>}
        summaryAside={<span className={`text-[9px] ${dirty ? (valid ? 'text-amber-200' : 'text-red-300') : 'text-white/35'}`} aria-live="polite">
          {editStatus}
        </span>}
      >
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['Width (ft)', widthFeet, setWidthFeet],
          ['Length (ft)', lengthFeet, setLengthFeet],
          ['Height (ft)', heightFeet, setHeightFeet],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-white/50">{label as string}</span>
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              value={value as string}
              disabled={busy}
              onChange={(event) => (setter as (value: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        ))}
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
      <div className="grid grid-cols-3 gap-1.5">
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Y rotation (°)</span>
          <input type="number" step="1" value={rotationDegrees} disabled={busy}
            onChange={(event) => setRotationDegrees(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
        </label>
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Scale</span>
          <input type="number" min="0.01" max="1000" step="0.01" value={scale} disabled={busy}
            onChange={(event) => setScale(event.target.value)}
            className="h-7 w-full rounded border border-white/10 bg-white/5 px-1.5 text-[11px] text-white outline-none focus:border-white/30 disabled:opacity-50" />
        </label>
        <label className="block space-y-1">
          <span className="text-[9px] text-white/50">Color</span>
          <input type="color" value={color} disabled={busy}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-full cursor-pointer rounded border border-white/10 bg-white/5 p-0.5 disabled:opacity-50" />
        </label>
      </div>
      </DetailsCardSection>
    </div>
  );
}
