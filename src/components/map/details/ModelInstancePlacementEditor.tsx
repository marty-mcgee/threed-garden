'use client';
import { DetailsCardActions } from './DetailsCardActions';

import type { ModelVolumeSensor } from '@/libraries/services/threed/physics/sensor-legacy-compat';
import { BALL_PHYSICS_FIELDS, resolveBallPhysics, type BallPhysics } from '@/libraries/services/threed/models/ball-physics';
import { useState } from 'react';
import { Box, Crosshair, Loader2, Save, Trash2 } from 'lucide-react';
import type { ProjectModelCollisionMode } from '@/libraries/services/threed/models/project-model-instance-core';
import { DetailsCardSection } from './DetailsCardSection';

type ProjectModelPhysicsMode = ProjectModelCollisionMode | 'ball';

export function ModelInstancePlacementEditor({
  instanceId,
  initialName,
  initialScaleMultiplier,
  initialRotationY,
  initialPosition,
  initialPlacementRole,
  initialCollisionMode,
  initialMovableBall = false,
  initialBallPhysics,
  initialVolumeSensor,
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
  initialCollisionMode: ProjectModelCollisionMode;
  initialMovableBall?: boolean;
  initialBallPhysics?: unknown;
  initialVolumeSensor?: ModelVolumeSensor | null;
  baseModelScale: number;
  updating: boolean;
  deleting: boolean;
  moveActive: boolean;
  onSave: (input: {
    metadata: {
      physicsMode: 'ball' | 'fixed';
      ballPhysics: BallPhysics;
      physicsVolumeSensor: ModelVolumeSensor | false;
    };
    collisionMode: ProjectModelCollisionMode;
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
  const initialPhysicsMode: ProjectModelPhysicsMode = initialMovableBall && initialPlacementRole !== 'environment'
    ? 'ball'
    : initialCollisionMode;
  const [physicsMode, setPhysicsMode] = useState<ProjectModelPhysicsMode>(initialPhysicsMode);
  const [volumeSensor, setVolumeSensor] = useState(Boolean(initialVolumeSensor));
  const initialPhysics = resolveBallPhysics(initialBallPhysics);
  const [physics, setPhysics] = useState(() => Object.fromEntries(Object.entries(initialPhysics).map(([key, value]) => [key, String(value)])));
  const physicsValid = Object.entries(BALL_PHYSICS_FIELDS).every(([key, field]) => physics[key].trim() !== '' && Number.isFinite(Number(physics[key])) && Number(physics[key]) >= field.min && Number(physics[key]) <= field.max);
  const parsedPhysics = Object.fromEntries(Object.entries(physics).map(([key, value]) => [key, Number(value)])) as BallPhysics;
  const parsedScale = Number(scaleMultiplier);
  const parsedRotationDegrees = Number(rotationYDegrees);
  const parsedPosition = [Number(positionX), Number(positionY), Number(positionZ)];
  const effectiveVolumeSensor = physicsMode !== 'ball' && placementRole !== 'environment'
    ? volumeSensor
    : false;
  const valid = physicsValid && instanceName.trim().length <= 120
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
    || placementRole !== initialPlacementRole
    || physicsMode !== initialPhysicsMode
    || effectiveVolumeSensor !== Boolean(initialVolumeSensor)
    || Object.keys(initialPhysics).some(key => parsedPhysics[key as keyof BallPhysics] !== initialPhysics[key as keyof BallPhysics]);
  const editStatus = updating ? 'Saving…' : dirty ? (valid ? 'Unsaved changes' : 'Check fields') : 'Saved';

  return (
    <div className="contents">
      <DetailsCardActions labels={['Save Model', moveActive ? 'Cancel Move' : 'Move Model', 'Delete Model']}>
        <button
          type="button"
          disabled={!valid || !dirty || busy}
          onClick={(event) => {
            event.stopPropagation();
            onSave({
              metadata: {
                physicsMode: physicsMode === 'ball' && placementRole !== 'environment' ? 'ball' : 'fixed',
                ballPhysics: parsedPhysics,
                physicsVolumeSensor: effectiveVolumeSensor ? initialVolumeSensor ?? {
                  id: 'model-volume', name: instanceName.trim() || 'Model volume', behavior: 'counter', detection: 'movable-ball', groupId: null,
                } : false,
              },
              collisionMode: physicsMode === 'triangle-surface' ? 'triangle-surface' : 'box',
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
          Save Model
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
      </DetailsCardActions>
      <DetailsCardSection
        title={<span className="inline-flex items-center gap-1.5">
          <Box className="h-3.5 w-3.5" />
          Project Model Instance
        </span>}
        summaryAside={<span className={`text-[9px] ${dirty ? (valid ? 'text-amber-200' : 'text-red-300') : 'text-white/35'}`} aria-live="polite">
          {editStatus}
        </span>}
      >
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
      </DetailsCardSection>
      <DetailsCardSection title="Scene Role">
        <label className="block space-y-1">
          <span className="text-[10px] text-white/60">Model role in this Project</span>
          <select
          value={placementRole}
          disabled={busy}
          onChange={(event) => {
            const nextRole = event.target.value as 'object' | 'environment';
            setPlacementRole(nextRole);
            if (nextRole === 'environment' && physicsMode === 'ball') setPhysicsMode('box');
          }}
          className="h-7 w-full rounded border border-white/10 bg-black/45 px-2 text-[10px] text-white outline-none focus:border-white/30 disabled:opacity-50"
          >
            <option value="object">Scene Object</option>
            <option value="environment">Environment / Base Map</option>
          </select>
        </label>
      </DetailsCardSection>
      <DetailsCardSection title="Physics Mode">
      <label className="block space-y-1">
        <span className="text-[10px] text-white/60">Collision and movement profile</span>
        <select
          value={physicsMode}
          disabled={busy}
          aria-label="Model physics mode"
          onChange={(event) => setPhysicsMode(event.target.value as ProjectModelPhysicsMode)}
          className="h-7 w-full rounded border border-white/10 bg-black/45 px-2 text-[10px] text-white outline-none focus:border-white/30 disabled:opacity-50"
        >
          <option value="box">Fixed Box</option>
          <option value="triangle-surface">Fixed Triangle Surface</option>
          <option value="ball" disabled={placementRole === 'environment'}>Movable Ball</option>
        </select>
      </label>
      </DetailsCardSection>
      {physicsMode === 'ball' && placementRole !== 'environment' && (
        <DetailsCardSection title="Ball Physics">
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(BALL_PHYSICS_FIELDS).map(([key, field]) => (
              <label key={key} className="block text-[10px] text-white/60">
                {field.label}
                <input type="number" min={field.min} max={field.max} step={field.step} value={physics[key]} disabled={busy}
                  onChange={event => setPhysics(current => ({ ...current, [key]: event.target.value }))}
                  className="mt-1 h-7 w-full rounded border border-white/10 bg-white/5 px-2 text-[11px] text-white" />
              </label>
            ))}
          </div>
          {!physicsValid && <p className="text-[10px] text-red-300">Enter values within the allowed ranges.</p>}
        </DetailsCardSection>
      )}
      {physicsMode !== 'ball' && placementRole !== 'environment' && (
        <DetailsCardSection title="Model Volume Sensor">
          <label className="flex items-center gap-2 text-[10px]">
            <input type="checkbox" checked={volumeSensor} disabled={busy} onChange={event => setVolumeSensor(event.target.checked)} />
            Use the Model bounding box as an entry counter
          </label>
          <p className="mt-2 text-[10px] text-white/60">For named sensors and groups, add Physics Sensor Cuboids below.</p>
        </DetailsCardSection>
      )}
    </div>
  );
}
