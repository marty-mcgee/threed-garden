'use client';

import { BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RuntimeMarker } from '@/libraries/types/map';
import { ScenarioGuidance } from './ScenarioGuidance';
import { ThreeDScenariosCRUD } from '@/components/admin/threed/scenarios/ThreeDScenariosCRUD';

export function ProjectScenariosPanel({ isOpen, projectId, markers, onClose }: {
  isOpen: boolean;
  projectId: string;
  markers: RuntimeMarker[];
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <section id="project-scenarios-panel" aria-labelledby="project-scenarios-title"
      className="threed-workspace-panel threed-toolbar-dropdown-surface absolute left-1/2 top-14 z-30 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 max-h-[calc(100%-4rem)] overflow-y-auto overscroll-contain rounded-xl border border-foreground/10 p-3 text-foreground shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <h2 id="project-scenarios-title" className="flex items-center gap-2 text-base font-semibold"><BookOpen aria-hidden="true" className="h-4 w-4 text-violet-700 dark:text-violet-300" /> ThreeD Scenarios</h2>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close Scenarios"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <ThreeDScenariosCRUD compact projectId={projectId} />
      <ScenarioGuidance key={projectId} projectId={projectId} markers={markers} />
    </section>
  );
}
