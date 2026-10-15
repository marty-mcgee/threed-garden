'use client';
import { DetailsCardActions } from './DetailsCardActions';

import { CHARACTER_PHYSICS_FIELDS, resolveCharacterPhysics, parseCharacterPhysicsSettings, convertCharacterPhysicsToMetres, type CharacterPhysics, type CharacterPhysicsSettings } from '@/libraries/services/threed/characters/character-physics';
import { CHARACTER_CAPSULE_RADIUS, CHARACTER_CAPSULE_HALF_HEIGHT } from '@/libraries/services/threed/characters/character-controller-dimensions';
import { useEffect, useState, type ReactNode } from 'react';
import { Crosshair, Loader2, Save, Trash2 } from 'lucide-react';
import { DetailsCardSection } from './DetailsCardSection';

export function CharacterInstancePositionEditor({
  markerId,
  metadata,
  moveActive = false,
  onMoveToggle,
  initialPosition,
  initialRotation = 0,
  initialScaleMultiplier = 1,
  initialPhysics,
  metersPerSceneUnit,
  movable = false,
  disabled,
  updating,
  deleting,
  onSave,
  onDelete,
}: {
  metadata?: ReactNode;
  moveActive?: boolean;
  onMoveToggle?: (markerId:number) => void;
  markerId: number;
  initialRotation?: number;
  initialScaleMultiplier?: number;
  initialPhysics?: unknown;
  metersPerSceneUnit?: number;
  movable?: boolean;
  initialPosition: { x: number; y: number; z: number };
  disabled: boolean;
  updating: boolean;
  deleting: boolean;
  onSave: (markerId: number, position: { positionX: number; positionY: number; positionZ: number; rotation: number; scaleMultiplier: number; characterPhysics?: CharacterPhysicsSettings }) => void;
  onDelete: (markerId: number) => void;
}) {
  let initialPhysicsIssue = '';
  const initialSettings = (() => {
    try { return parseCharacterPhysicsSettings(initialPhysics); }
    catch (error) {
      if (initialPhysics && typeof initialPhysics === 'object' && ('version' in initialPhysics || 'units' in initialPhysics || 'values' in initialPhysics)) {
        initialPhysicsIssue = error instanceof Error ? error.message : 'Unsupported saved physics settings.';
      }
      return resolveCharacterPhysics(initialPhysics);
    }
  })();
  const [physicsUnit, setPhysicsUnit] = useState<number | null>('version' in initialSettings ? initialSettings.metresPerSceneUnit : null);
  const [physics, setPhysics] = useState(() => Object.fromEntries(Object.entries('version' in initialSettings ? initialSettings.values : initialSettings).map(([key, value]) => [key, String(value)])));
  const [physicsError, setPhysicsError] = useState('');
  const calibrationValid = typeof metersPerSceneUnit === 'number' && Number.isFinite(metersPerSceneUnit) && metersPerSceneUnit > 0;
  const fieldFactor = (key: string) => key === 'mass' ? 1 : (physicsUnit ?? 1);
  const physicsValid = !initialPhysicsIssue && (physicsUnit === null || (calibrationValid && physicsUnit === metersPerSceneUnit)) && Object.entries(CHARACTER_PHYSICS_FIELDS).every(([key, field]) => physics[key].trim() !== '' && Number.isFinite(Number(physics[key])) && Number(physics[key]) >= field.min * fieldFactor(key) && Number(physics[key]) <= field.max * fieldFactor(key));
  const physicsValues = Object.fromEntries(Object.entries(physics).map(([key, value]) => [key, Number(value)])) as CharacterPhysics;
  const physicsSettings: CharacterPhysicsSettings = physicsUnit === null ? physicsValues : { version: 1, units: 'metres', metresPerSceneUnit: physicsUnit, values: physicsValues };
  const originalValues = 'version' in initialSettings ? initialSettings.values : initialSettings;
  const physicsDirty = physicsUnit !== ('version' in initialSettings ? initialSettings.metresPerSceneUnit : null) || Object.entries(originalValues).some(([key, value]) => Number(physics[key]) !== value);
  const [scale, setScale] = useState(String(initialScaleMultiplier));
  useEffect(() => { setScale(String(initialScaleMultiplier)); }, [initialScaleMultiplier]);
  const scaleValid = scale.trim() !== '' && Number.isFinite(Number(scale)) && Number(scale) >= 0.01 && Number(scale) <= 1000;
  const [rotation, setRotation] = useState(String(initialRotation));
  useEffect(() => { setRotation(initialRotation.toFixed(1)); }, [initialRotation]);
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
  const valid = scaleValid && rotation.trim() !== '' && Number.isFinite(Number(rotation)) && Math.abs(Number(rotation)) <= 360
    && physicsValid && Object.values(position).every(
    (value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000,
  );
  const dirty = Number(scale) !== initialScaleMultiplier || Number(rotation) !== Number(initialRotation.toFixed(1)) || (movable && physicsDirty)
    || position.positionX !== Number(initialPosition.x.toFixed(1))
    || position.positionY !== Number(initialPosition.y.toFixed(1))
    || position.positionZ !== Number(initialPosition.z.toFixed(1));
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Ready to save';

  return (
    <div className="contents">
      <DetailsCardActions labels={['Save Character', moveActive ? 'Cancel Move' : 'Move Character', 'Delete Character']}>
        <button
          type="button"
          disabled={!valid || disabled || updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            onSave(markerId, { ...position, scaleMultiplier: Number(scale), rotation: Number(rotation), ...(movable ? { characterPhysics: physicsSettings } : {}) });
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-violet-600/35 px-2 py-1.5 text-[11px] font-medium text-violet-100 transition-colors hover:bg-violet-600/60 hover:text-white disabled:cursor-not-allowed disabled:bg-foreground/5 disabled:text-foreground/30"
        >
          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Character
        </button>
      <button type="button" disabled={disabled || updating || deleting || (!moveActive && dirty) || !onMoveToggle} aria-pressed={moveActive}
        onClick={event=>{event.stopPropagation();onMoveToggle?.(markerId);}}
        className="flex items-center justify-center gap-1 rounded bg-amber-600/30 px-1.5 py-1.5 text-[10px] font-medium text-amber-800 dark:text-amber-100 hover:bg-amber-600/55 disabled:opacity-40">
        <Crosshair className="h-3.5 w-3.5" />{moveActive ? 'Cancel Move' : <>Move Character</>}
      </button>
        <button
          type="button"
          disabled={disabled || updating || deleting}
          onClick={(event) => {
            event.stopPropagation();
            if (!window.confirm('Remove this Character from the ThreeD Project? The reusable Character will remain available in the Library.')) return;
            onDelete(markerId);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600/30 px-2 py-1.5 text-[11px] font-medium text-red-800 dark:text-red-100 transition-colors hover:bg-red-600/55 hover:text-white disabled:cursor-not-allowed disabled:bg-foreground/5 disabled:text-foreground/30"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete Character
        </button>
      </DetailsCardActions>
      <DetailsCardSection title="Module / Position" className="order-4">
        {metadata && <div className="space-y-0.5">{metadata}</div>}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[9px] ${dirty ? (valid ? 'text-amber-800 dark:text-amber-200' : 'text-red-800 dark:text-red-300') : 'text-foreground/35'}`} aria-live="polite">
          {disabled ? 'Release Control to edit' : editStatus}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">Position (Scene units)</p>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['X', positionX, setPositionX],
          ['Y', positionY, setPositionY],
          ['Z', positionZ, setPositionZ],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="block min-w-0 space-y-1">
            <span className="text-[9px] text-foreground/50">Position {label as string}</span>
            <input aria-label={`Position ${label as string} (Scene units)`}
              type="number"
              step="0.1"
              value={value as string}
              disabled={disabled || updating || deleting}
              onChange={(event) => (setter as (next: string) => void)(event.target.value)}
              className="h-7 w-full rounded border border-foreground/10 bg-foreground/5 px-1.5 text-[11px] text-foreground outline-none focus:border-foreground/30 disabled:opacity-50"
            />
          </label>
        ))}
      </div>
      <label className="block space-y-1">
        <span className="text-[9px] text-foreground/50">Scale (Project multiplier)</span>
        <input type="number" min={0.01} max={1000} step="0.01" value={scale} aria-invalid={!scaleValid}
          disabled={disabled || updating || deleting} onChange={event => setScale(event.target.value)}
          className="h-7 w-full rounded border border-foreground/10 bg-foreground/5 px-1.5 text-[11px] text-foreground outline-none focus:border-foreground/30 disabled:opacity-50" />
        <span className="block text-[9px] text-foreground/50">1 = original size. Changes this Project instance, not the Library Character or physics capsule.</span>
        {!scaleValid && <span role="alert" className="block text-[9px] text-red-600 dark:text-red-300">Enter a scale from 0.01 to 1000.</span>}
      </label>
      <label className="block space-y-1">
        <span className="text-[9px] text-foreground/50">Facing / Y rotation (°)</span>
        <input type="number" min={-360} max={360} step="1" value={rotation}
          disabled={disabled || updating || deleting} onChange={event => setRotation(event.target.value)}
          className="h-7 w-full rounded border border-foreground/10 bg-foreground/5 px-1.5 text-[11px] text-foreground outline-none focus:border-foreground/30 disabled:opacity-50" />
      </label>
      </DetailsCardSection>
      {movable && <DetailsCardSection title="Character Physics" className="order-6 text-[11px] text-foreground/70">
        <p>{physicsUnit === null ? 'Legacy Scene units' : 'Physical units (metres and seconds)'}</p>
        {physicsUnit === null && <button type="button" disabled={!calibrationValid || !physicsValid || disabled || updating || deleting}
          className="mt-2 rounded border border-foreground/15 px-2 py-1 hover:bg-foreground/10 disabled:opacity-40"
          onClick={() => {
            try {
              const converted = convertCharacterPhysicsToMetres(physicsValues, metersPerSceneUnit!);
              if ('version' in converted) {
                setPhysicsUnit(converted.metresPerSceneUnit);
                setPhysics(Object.fromEntries(Object.entries(converted.values).map(([key, value]) => [key, String(value)])));
                setPhysicsError('');
              }
            } catch (error) { setPhysicsError(error instanceof Error ? error.message : 'Unable to convert settings.'); }
          }}>Convert to physical units</button>}
        <p className="mt-1 text-[10px] text-foreground/50">Conversion preserves current motion and size. Save Character to retain it. Visual scale is separate.</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(CHARACTER_PHYSICS_FIELDS).map(([key, field]) => <label key={key}>{key === 'jumpSpeed' ? 'Jump velocity' : field.label} ({key === 'mass' ? 'kg' : key === 'clearance' ? (physicsUnit === null ? 'Scene units' : 'm') : (physicsUnit === null ? 'Scene units/s' : 'm/s')})
            <input className="w-full rounded bg-foreground/5 p-1" type="number" min={field.min * fieldFactor(key)} max={field.max * fieldFactor(key)} step="any" value={physics[key]} disabled={disabled || updating || deleting} onChange={e => setPhysics(v => ({...v, [key]: e.target.value}))} />
          </label>)}
        </div>
        {calibrationValid && <p className="mt-2 text-[10px] text-foreground/50">
          Loaded-model capsule: radius {(CHARACTER_CAPSULE_RADIUS * metersPerSceneUnit!).toFixed(4)} m; total height {((2 * CHARACTER_CAPSULE_HALF_HEIGHT + 2 * CHARACTER_CAPSULE_RADIUS) * metersPerSceneUnit!).toFixed(4)} m. The error/missing-model fallback uses a shorter capsule.
          {' '}World gravity: {(9.81 * metersPerSceneUnit!).toFixed(4)} m/s². Capsule and world gravity remain unchanged; the controller increases gravity while falling.
        </p>}
        {physicsError && <p role="alert" className="text-red-800 dark:text-red-300">{physicsError}</p>}
        {initialPhysicsIssue && <p role="alert" className="text-red-800 dark:text-red-300">{initialPhysicsIssue} Saved settings have been retained.</p>}
        {!physicsValid && <p className="text-red-800 dark:text-red-300">Check physics values.</p>}
      </DetailsCardSection>}
      {disabled && (
        <p className="order-4 text-[9px] text-amber-800/75 dark:text-amber-200/75">Release Control before changing the Character position.</p>
      )}
    </div>
  );
}
