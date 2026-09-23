'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Loader2, Move, Plus, Save, ScanSearch, Trash2 } from 'lucide-react';
import { SceneTransformActions, useSceneTransform } from '@/components/threed/transform/SceneTransformWorkspace';
import type { SceneOwnerPose } from '@/libraries/services/threed/transforms/scene-transform-core';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import { DetailsCardSection } from './DetailsCardSection';
import {
  readPhysicsSensorCuboids,
  validatePhysicsSensorCuboids,
  type PhysicsSensorBehavior,
  type PhysicsSensorCuboid,
} from '@/libraries/services/threed/physics/sensor-cuboid-core';

export interface PhysicsSensorPlacementResult {
  requestId: number;
  markerId: number;
  sensorId: string;
  position: { x: number; y: number; z: number };
}

export function PhysicsSensorCuboidsEditor({
  selectedSensorId,
  onSelectSensor,
  markerId,
  ownerKey,
  ownerPose,
  initialMetadata,
  saving,
  placementSensorId,
  placementResult,
  onBeginPlacement,
  onCancelPlacement,
  onZoomToSensor,
  onSave,
}: {
  selectedSensorId: string | null;
  onSelectSensor?: (id: string | null) => void;
  markerId: number;
  ownerKey: string;
  ownerPose: SceneOwnerPose;
  initialMetadata: unknown;
  saving: boolean;
  placementSensorId: string | null;
  placementResult: PhysicsSensorPlacementResult | null;
  onBeginPlacement: (sensor: PhysicsSensorCuboid, operation: 'place' | 'move') => void;
  onCancelPlacement: () => void;
  onZoomToSensor: (sensor: PhysicsSensorCuboid) => void;
  onSave: (markerId: number, sensors: readonly PhysicsSensorCuboid[]) => Promise<boolean>;
}) {
  const transform = useSceneTransform();
  const groups = useSensorGroups();
  const { releaseOwner } = transform;
  useEffect(() => () => releaseOwner(ownerKey), [ownerKey, releaseOwner]);
  const editing = transform.session !== null;
  const initialSensors = useMemo(() => readPhysicsSensorCuboids(initialMetadata), [initialMetadata]);
  const [sensors, setSensors] = useState<PhysicsSensorCuboid[]>(() => initialSensors.map((sensor) => ({
    ...sensor,
    position: { ...sensor.position },
  })));
  const [lastPlacementRequest, setLastPlacementRequest] = useState(0);

  useEffect(() => {
    if (!placementResult || placementResult.markerId !== markerId || placementResult.requestId <= lastPlacementRequest) return;
    setLastPlacementRequest(placementResult.requestId);
    const next = sensors.map((sensor) => sensor.id === placementResult.sensorId
      ? { ...sensor, position: placementResult.position }
      : sensor);
    setSensors(next);
    onSave(markerId, next);
  }, [lastPlacementRequest, markerId, onSave, placementResult, sensors]);

  const initialSensorIds = useMemo(() => new Set(initialSensors.map((sensor) => sensor.id)), [initialSensors]);
  const dirty = JSON.stringify(sensors) !== JSON.stringify(initialSensors);
  const collectionValidation = validatePhysicsSensorCuboids(sensors);
  const updateSensor = (id: string, patch: Partial<PhysicsSensorCuboid>) => setSensors((current) => current.map(
    (sensor) => sensor.id === id ? { ...sensor, ...patch } : sensor,
  ));

  const creating = useRef(false);
  useEffect(() => {
    if (selectedSensorId !== '__new__') { creating.current = false; return; }
    if (creating.current || saving || editing || sensors.length >= 8) return;
    creating.current = true;
    const sensor: PhysicsSensorCuboid = {
      id: `sensor_${crypto.randomUUID().replaceAll('-', '')}`,
      name: `Sensor ${sensors.length + 1}`,
      behavior: 'counter',
      detection: 'movable-ball',
      groupId: null,
      position: { x: 0, y: 1, z: 0 },
      width: 2,
      height: 2,
      depth: 0.35,
      rotationY: 0,
    };
    setSensors((current) => [...current, sensor]);
    onSelectSensor?.(sensor.id);
  }, [selectedSensorId, saving, editing, sensors.length, onSelectSensor]);

  return (
    <DetailsCardSection
      key={selectedSensorId ?? 'sensor-list'}
      title={selectedSensorId ? 'Sensor Settings' : 'Physics Sensors'}
      defaultOpen
      summaryAside={<span className="text-[9px] text-white/40">{sensors.length}/8</span>}
    >

      {!collectionValidation.success && (
        <p role="alert" className="text-[10px] text-red-200">{collectionValidation.error} Correct that sensor before saving.</p>
      )}
      <button type="button" disabled={saving || editing || !dirty || !collectionValidation.success}
        onClick={() => onSave(markerId, sensors)}
        className="flex w-full items-center justify-center gap-1 rounded bg-cyan-600/30 px-2 py-1.5 text-[10px] text-cyan-100 hover:bg-cyan-600/55 disabled:opacity-40">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} {selectedSensorId ? 'Save Sensor' : 'Save Sensors'}
      </button>
      {selectedSensorId === '__new__' && sensors.length >= 8 && <p role="alert" className="text-xs text-amber-200">This asset already has eight sensors. Select an existing sensor to edit or delete it.</p>}
      <div className="space-y-2">
        {sensors.filter(sensor => !selectedSensorId || sensor.id === selectedSensorId).map((sensor, index) => {
          if (!selectedSensorId) return <button key={sensor.id} type="button" className="block w-full rounded border border-white/15 p-2 text-left text-xs hover:bg-white/10" onClick={() => onSelectSensor?.(sensor.id)}>{sensor.name} →</button>;
          const placing = placementSensorId === sensor.id;
          const transformDraft = transform.session?.objectKey === `${ownerKey}:${sensor.id}` ? transform.session.draft : null;
          const isNewSensor = !initialSensorIds.has(sensor.id);
          const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => updateSensor(sensor.id, {
            position: { ...sensor.position, [axis]: value },
          });
          return (
            <div key={sensor.id} className="flex flex-col gap-1.5 rounded border border-white/10 bg-black/15 p-2">
              <div className="order-[-30] flex justify-end">
                <button type="button" disabled={saving || editing} aria-label={`Delete ${sensor.name}`}
                  onClick={() => {
                    if (placing) onCancelPlacement();
                    const next = sensors.filter(item => item.id !== sensor.id);
                    if (!initialSensorIds.has(sensor.id)) { setSensors(next); onSelectSensor?.(null); }
                    else void onSave(markerId, next).then(success => { if (success) { setSensors(next); onSelectSensor?.(null); } });
                  }}
                  className="rounded border border-red-300/20 p-1.5 text-red-200 hover:bg-red-500/20">
                  <Trash2 className="inline h-3 w-3" /> Delete Sensor
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input value={sensor.name} maxLength={80} disabled={saving || editing}
                  aria-label={`Physics Sensor ${index + 1} name`}
                  onChange={(event) => updateSensor(sensor.id, { name: event.target.value })}
                  className="h-7 min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 text-[10px] text-white" />
                <select value={sensor.behavior} disabled={saving || editing}
                  aria-label={`${sensor.name} behavior`}
                  onChange={(event) => updateSensor(sensor.id, { behavior: event.target.value as PhysicsSensorBehavior })}
                  className="h-7 rounded border border-white/10 bg-slate-950/80 px-1 text-[10px] text-white">
                  <option value="trigger">Trigger</option>
                  <option value="counter">Count Entries</option>
                </select>

              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <label>Detect
                  <select aria-label={`${sensor.name} detection`} value={sensor.detection} disabled={saving || editing} onChange={event => updateSensor(sensor.id, { detection: event.target.value as PhysicsSensorCuboid['detection'] })} className="w-full rounded border border-white/10 p-1">
                    <option value="movable-ball">Movable balls</option>
                    <option value="model">Model bodies</option>
                  </select>
                </label>
                <label>Sensor Group
                  <select aria-label={`${sensor.name} group`} value={sensor.groupId ?? ''} disabled={saving || editing || groups?.loading} onChange={event => updateSensor(sensor.id, { groupId: event.target.value || null })} className="w-full rounded border border-white/10 p-1">
                    <option value="">Ungrouped</option>
                    {sensor.groupId && !groups?.groups.some(group => group.id === sensor.groupId) && <option value={sensor.groupId}>Unavailable group</option>}
                    {groups?.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="order-[-20] grid grid-cols-2 gap-1">
                <button type="button" disabled={saving || editing}
                  onClick={() => placing ? onCancelPlacement() : onBeginPlacement(sensor, isNewSensor ? 'place' : 'move')}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 text-[10px] ${placing ? 'border-amber-300/30 bg-amber-500/20 text-amber-100' : 'border-cyan-300/20 text-cyan-100 hover:bg-cyan-500/10'}`}>
                  {placing ? <Crosshair className="h-3 w-3" /> : isNewSensor ? <Crosshair className="h-3 w-3" /> : <Move className="h-3 w-3" />} {placing ? 'Cancel Placement' : isNewSensor ? 'Place Sensor' : 'Move Sensor'}
                </button>
                <button type="button" disabled={saving || placing || editing}
                  onClick={() => onZoomToSensor(sensor)}
                  title="Zoom to Sensor"
                  className="flex items-center justify-center gap-1 rounded border border-violet-300/20 px-2 py-1 text-[10px] text-violet-100 hover:bg-violet-500/10 disabled:opacity-40">
                  <ScanSearch className="h-3 w-3" /> Zoom to Sensor
                </button>
              </div>
              <button type="button" disabled={saving || editing}
                onClick={() => {
                  onCancelPlacement();
                  transform.begin({
                    ownerKey, objectKey: `${ownerKey}:${sensor.id}`, name: sensor.name,
                    owner: ownerPose, dimensions: [sensor.width, sensor.height, sensor.depth],
                    draft: { position: { ...sensor.position }, rotationY: sensor.rotationY, width: sensor.width, height: sensor.height, depth: sensor.depth },
                    commit: async draft => {
                      const next = sensors.map(item => item.id === sensor.id ? { ...item, ...draft } : item);
                      const validation = validatePhysicsSensorCuboids(next);
                      if (!validation.success) throw new Error(validation.error);
                      const success = await onSave(markerId, validation.sensors);
                      if (success) setSensors([...validation.sensors]);
                      return success;
                    },
                  });
                }}
                className="order-[-10] w-full rounded border border-cyan-300/30 bg-cyan-600/20 px-2 py-1.5 text-[10px] text-cyan-100 disabled:opacity-40">
                Transform Sensor · Mouse Handles
              </button>
              {transform.session?.objectKey === `${ownerKey}:${sensor.id}` && <SceneTransformActions />}
              <div className="grid grid-cols-3 gap-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <label key={axis} className="text-[8px] text-white/45">Local {axis.toUpperCase()}
                    <input type="number" step="0.1" value={Number((transformDraft?.position ?? sensor.position)[axis].toFixed(3))} disabled={saving || editing}
                      onChange={(event) => updatePosition(axis, Number(event.target.value))}
                      className="mt-0.5 h-6 w-full rounded border border-white/10 bg-white/5 px-1 text-[9px] text-white" />
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['width', 'height', 'depth', 'rotationY'] as const).map((field) => (
                  <label key={field} className="text-[8px] text-white/45">
                    {field === 'rotationY' ? 'Y rotation °' : field[0].toUpperCase() + field.slice(1)}
                    <input type="number" min={field === 'rotationY' ? undefined : 0.05} step="0.05"
                      value={Number((transformDraft?.[field] ?? sensor[field]).toFixed(3))} disabled={saving || editing}
                      onChange={(event) => updateSensor(sensor.id, { [field]: Number(event.target.value) })}
                      className="mt-0.5 h-6 w-full rounded border border-white/10 bg-white/5 px-1 text-[9px] text-white" />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!selectedSensorId && <button type="button" disabled={saving || editing || sensors.length >= 8}
        onClick={() => {
          onSelectSensor?.('__new__');
        }}
        className="flex w-full items-center justify-center gap-1 rounded border border-white/10 px-2 py-1.5 text-[10px] text-white/70 hover:bg-white/10 disabled:opacity-40">
        <Plus className="h-3 w-3" /> Add Sensor
      </button>}

    </DetailsCardSection>
  );
}
