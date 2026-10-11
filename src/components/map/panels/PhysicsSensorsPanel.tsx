'use client';
import { Radio, RotateCcw, X } from 'lucide-react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import type { useProjectOverlayPosition } from './ProjectOverlayLayout';
import { sensorMemberKey, type SensorMember, type SensorCounterState } from '@/libraries/services/threed/physics/sensor-counter-core';

interface PhysicsSensorsPanelProps {
  sensorsOverlay: ReturnType<typeof useProjectOverlayPosition>;
  visibleCounterGroups: readonly (readonly [string, { name: string; members: readonly SensorMember[] }])[];
  sensorCounterState: SensorCounterState;
  resetSensorCounterState: () => void;
  onClose: () => void;
}

/** Rendering only: subscriptions, counts and overlay position remain Scene-owned. */
export function PhysicsSensorsPanel({ sensorsOverlay, visibleCounterGroups, sensorCounterState, resetSensorCounterState, onClose }: PhysicsSensorsPanelProps) {
  return (
    <section ref={sensorsOverlay.ref} style={sensorsOverlay.style} data-scene-hover-obstacle aria-label="Physics Sensors" className="threed-workspace-panel threed-scene-panel-surface absolute right-0 top-10 z-30 flex max-h-[calc(100%_-_4rem)] w-72 max-w-full flex-col overflow-hidden rounded-lg border border-foreground/15 text-xs text-foreground shadow-xl backdrop-blur-md">
      <header {...sensorsOverlay.handle} className={`${sensorsOverlay.handle.className} flex shrink-0 items-center justify-between gap-2 px-3 py-2`}>
        <div className="flex items-center gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><Radio aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />Physics Sensors</h2><span data-overlay-control><ModelFieldHelp label="Physics Sensors">Add a Physics Sensor Cuboid in an asset?s DetailsCard and choose Count Entries. Counts continue while hidden. Save Project to keep them after reload.</ModelFieldHelp></span></div>
        <div className="flex shrink-0 items-center gap-1"><button type="button" disabled={!visibleCounterGroups.length} onClick={resetSensorCounterState} aria-label="Reset All Counts" title="Reset All Counts" className="rounded p-1 text-foreground/70 hover:bg-foreground/10 disabled:opacity-40"><RotateCcw className="h-4 w-4" /></button><button type="button" onClick={onClose} aria-label="Close Physics Sensors" className="rounded p-1 text-foreground/70 hover:bg-foreground/10"><X className="h-4 w-4" /></button></div>
      </header>
      <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain px-3 pb-3 [scrollbar-width:thin]">
        {!visibleCounterGroups.length && <p className="text-foreground/65">No entry counters configured. Add a Physics Sensor Cuboid in an asset’s DetailsCard and choose Count Entries.</p>}
        {visibleCounterGroups.map(([id, group]) => <details key={id} open className="rounded border border-foreground/10 p-2">
          <summary className="cursor-pointer text-foreground/80">{group.name}</summary>
          <div className="mt-2 space-y-1">{group.members.map(member => <div key={sensorMemberKey(member)} className="flex items-start justify-between gap-3">
            <span className="min-w-0 break-words">{member.name}</span>
            <span className="shrink-0 tabular-nums">{sensorCounterState.counts[sensorMemberKey(member)] ?? 0}</span>
          </div>)}</div>
        </details>)}
      </div>
    </section>
  );
}
