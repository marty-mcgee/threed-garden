'use client';

import type { RuntimeMarker } from '@/libraries/types/map';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { SensorGroupEditor, useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';

/** Metadata inspection only: opening this panel does not alter sensor participation. */
export function SensorGroupInspector({ groupId, markers, leftOffsetRem, onClose, onSelectSensor, onSelectGroup }: {
  groupId: string;
  markers: RuntimeMarker[];
  leftOffsetRem: number;
  onClose: () => void;
  onSelectGroup: (id: string) => void;
  onSelectSensor: (marker: RuntimeMarker, sensorId: string) => void;
}) {
  const workspace = useSensorGroups();
  const group = workspace?.groups.find(item => item.id === groupId);
  const members = markers.flatMap(marker => readPhysicsSensorCuboids(marker.metadata)
    .filter(sensor => sensor.groupId === groupId).map(sensor => ({ marker, sensor })));
  return <section aria-label="Sensor Group details" className="threed-workspace-panel threed-details-surface threed-inspector absolute top-9 z-40 flex max-h-[calc(100%-2.25rem)] w-72 flex-col overflow-hidden rounded-lg border border-white/15 text-white shadow-xl"
    style={{ left: `${leftOffsetRem}rem`, backgroundColor: 'var(--threed-details-background)' }}>
    <header className="flex shrink-0 items-center justify-between gap-2 p-2">
      <h2 className="truncate text-sm font-semibold">{group?.name ?? 'New Sensor Group'}</h2>
      <button type="button" onClick={onClose} aria-label="Close Sensor Group details" className="rounded px-2 py-1 hover:bg-white/10">×</button>
    </header>
    <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-2">
      <SensorGroupEditor key={groupId} initialGroupId={groupId} expanded onSelectGroup={onSelectGroup} />
      <h3 className="text-xs">Members · {members.length}</h3>
      {members.map(({ marker, sensor }) => <button key={`${marker.id}:${sensor.id}`} type="button" onClick={() => onSelectSensor(marker, sensor.id)} className="block w-full rounded border border-white/15 p-2 text-left text-xs hover:bg-white/10">
        {sensor.name}<span className="block text-white/60">{marker.name}</span>
      </button>)}
      {!members.length && <p className="text-xs text-white/65">Assign a sensor to this group from its sensor settings.</p>}
      <p className="text-xs text-white/65">Live entry counts are available under Environment → Show Sensors.</p>
    </div>
  </section>;
}
