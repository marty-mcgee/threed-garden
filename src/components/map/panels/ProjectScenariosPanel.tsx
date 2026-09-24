'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RuntimeMarker } from '@/libraries/types/map';
import { ScenarioGuidance } from './ScenarioGuidance';

export function ProjectScenariosPanel({ isOpen, projectId, markers, onClose }: {
  isOpen: boolean;
  projectId: string;
  markers: RuntimeMarker[];
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <section id="project-scenarios-panel" aria-labelledby="project-scenarios-title"
      className="threed-workspace-panel threed-toolbar-dropdown-surface absolute left-1/2 top-14 z-30 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 max-h-[calc(100%-4rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/10 p-3 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <h2 id="project-scenarios-title" className="text-base font-semibold">ThreeD Scenarios</h2>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close Scenarios"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <ScenarioGuidance key={projectId} projectId={projectId} markers={markers} />
    </section>
  );
}
