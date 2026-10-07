'use client';

import { Radio, X } from 'lucide-react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { useProjectOverlayPosition } from '@/components/map/panels/ProjectOverlayLayout';
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
  const overlay = useProjectOverlayPosition('sensorGroup');
  const workspace = useSensorGroups();
  const group = workspace?.groups.find(item => item.id === groupId);
  const members = markers.flatMap(marker => readPhysicsSensorCuboids(marker.metadata)
    .filter(sensor => sensor.groupId === groupId).map(sensor => ({ marker, sensor })));
  return <section ref={overlay.ref} aria-label="Sensor Group details" className="threed-workspace-panel threed-details-surface threed-inspector absolute top-[38px] z-40 flex max-h-[calc(100%-2.25rem)] w-72 flex-col overflow-hidden rounded-lg border border-foreground/15 text-foreground shadow-xl"
    style={{ left: `${leftOffsetRem}rem`, backgroundColor: 'var(--threed-details-background)', ...overlay.style }}>
    <header {...overlay.handle} className={`${overlay.handle.className} flex shrink-0 items-center justify-between gap-2 p-2`}>
      <div className="flex min-w-0 items-center gap-2"><Radio aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" /><h2 className="truncate text-sm font-semibold">{group?.name ?? 'New Sensor Group'}</h2><span data-overlay-control><ModelFieldHelp label="Sensor Groups">Assign sensors to a group from their sensor settings. Open Environment ? Show Sensors to watch entry counts. Group names save immediately; sensor membership saves with the sensor.</ModelFieldHelp></span></div>
      <button type="button" onClick={onClose} aria-label="Close Sensor Group details" className="rounded p-1 hover:bg-foreground/10"><X className="h-4 w-4" /></button>
    </header>
    <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold">Sensors in this group · {members.length}</h3>
        <div className="space-y-1">
          {members.map(({ marker, sensor }) => <button key={`${marker.id}:${sensor.id}`} type="button" onClick={() => onSelectSensor(marker, sensor.id)} className="block w-full rounded border border-foreground/15 p-2 text-left text-xs hover:bg-foreground/10">
            <span className="block font-medium">{sensor.name}</span><span className="block text-foreground/60">{marker.name} · Edit sensor →</span>
          </button>)}
        </div>
        {!members.length && <p className="text-xs text-foreground/65">Assign a sensor to this group from its sensor settings.</p>}
      </div>
      <SensorGroupEditor key={groupId} initialGroupId={groupId} showHelp={false} onSelectGroup={onSelectGroup} />
    </div>
  </section>;
}
