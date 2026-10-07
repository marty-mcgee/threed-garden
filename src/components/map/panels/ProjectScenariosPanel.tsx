'use client';

import { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';
import type { RuntimeMarker } from '@/libraries/types/map';
import type { ScenarioStart } from '@/libraries/services/threed/scenario-core';
import { useProjectOverlayPosition } from './ProjectOverlayLayout';
import { ScenarioGuidance } from './ScenarioGuidance';
import { ProjectScenarioLoadDialog } from './ProjectScenarioLoadDialog';
import type { ProjectScenarioGuideState, ProjectScenarioSelection } from '@/libraries/services/threed/markers/project-view-state-core';

export function ProjectScenariosPanel({ isOpen, projectId, markers, selected, guide, startedScenarioName, onSelectedChange, onGuideChange, onClose, onStartScenario }: {
  isOpen: boolean;
  projectId: string;
  markers: RuntimeMarker[];
  selected: ProjectScenarioSelection | null;
  guide: ProjectScenarioGuideState;
  startedScenarioName: string | null;
  onSelectedChange: (scenario: ProjectScenarioSelection | null) => void;
  onGuideChange: (guide: ProjectScenarioGuideState) => void;
  onClose: () => void;
  onStartScenario: (scenario: ScenarioStart) => void;
}) {
  const overlay = useProjectOverlayPosition('scenarios');
  const [loadOpen, setLoadOpen] = useState(false);
  const currentSelected = selected?.projectId === Number(projectId) ? selected : null;
  useEffect(() => { if (!isOpen) setLoadOpen(false); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <section ref={overlay.ref} style={overlay.style} id="project-scenarios-panel" aria-labelledby="project-scenarios-title"
      className={`threed-workspace-panel threed-toolbar-dropdown-surface absolute left-1/2 top-10 z-30 w-[min(36rem,calc(100%_-_2rem))] -translate-x-1/2 max-h-[calc(100%_-_4rem)] overflow-y-auto overscroll-contain rounded-xl border border-foreground/10 p-3 text-foreground shadow-2xl backdrop-blur-md transition-opacity opacity-100`}>
      <div {...overlay.handle} className={`${overlay.handle.className} flex items-center justify-between gap-3`}>
        <div className="flex min-w-0 flex-wrap items-center gap-2"><h2 id="project-scenarios-title" className="flex items-center gap-2 text-sm font-semibold"><BookOpen aria-hidden="true" className="h-4 w-4 text-violet-700 dark:text-violet-300" /> Scenarios</h2><span data-overlay-control><ModelFieldHelp label="Scenarios">A Scenario is a plan. Choose one to review its setup and open it in this view. Simulations execute Actions and collect Results separately.</ModelFieldHelp></span>{startedScenarioName && <span role="status" className="max-w-full truncate rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">In Scene: {startedScenarioName}</span>}</div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLoadOpen(false); onClose(); }} aria-label="Close Scenarios"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <ScenarioGuidance projectId={projectId} markers={markers} loadedScenario={currentSelected} guide={guide} onGuideChange={onGuideChange} onChooseTemplate={() => setLoadOpen(true)} onClearLoaded={() => onSelectedChange(null)} onStartScenario={scenario => { onStartScenario(scenario); onClose(); }} />
      <ProjectScenarioLoadDialog open={loadOpen} projectId={projectId} onClose={() => setLoadOpen(false)} onLoad={scenario => { onSelectedChange({ id: scenario.id, projectId: scenario.projectId, threedId: scenario.threedId, name: scenario.name, threedName: scenario.threedName, setup: scenario.setup }); onGuideChange({ kind: scenario.setup?.kind ?? 'soccer', environmentId: scenario.setup?.environmentMarkerId ?? '', groupId: scenario.setup?.sensorGroupId ?? '', farmbotId: '' }); setLoadOpen(false); }} />
    </section>
  );
}
