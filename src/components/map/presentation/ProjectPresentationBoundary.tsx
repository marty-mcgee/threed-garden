'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { ThreeDProjectLoadingPresentation } from './ThreeDProjectLoadingPresentation';

interface ProjectPresentationStatus {
  progress: number;
  label: string;
  complete: boolean;
  failed: boolean;
}

const ProjectPresentationReporter = createContext<((status: ProjectPresentationStatus) => void) | null>(null);

export const useProjectPresentationReporter = () => useContext(ProjectPresentationReporter);

/** A presentation boundary only: children keep their existing mount and resource owners. */
export function ProjectPresentationBoundary({ projectId, mapOnly, children }: {
  projectId: string | null;
  mapOnly: boolean;
  children: ReactNode;
}) {
  const scope = projectId ?? 'default';
  const [state, setState] = useState<{
    scope: string;
    released: boolean;
    progress: number;
    label: string;
  } | null>(null);
  const report = useCallback((status: ProjectPresentationStatus) => {
    setState(current => {
      // Completion/failure releases this Project once. Incremental edits never hide it again.
      if (current?.scope === scope && current.released) return current;
      const released = status.complete || status.failed;
      if (current?.scope === scope && current.released === released
        && current.progress === status.progress && current.label === status.label) return current;
      return {
        scope,
        released,
        progress: status.progress,
        label: status.label,
      };
    });
  }, [scope]);
  const current = state?.scope === scope ? state : null;
  const preparing = !mapOnly && !current?.released;

  return <ProjectPresentationReporter.Provider value={report}>
    <div className="relative h-[calc(100dvh-48px)] min-h-0 bg-[var(--threed-surface-color)]" data-testid="project-scene-workspace" aria-busy={preparing}>
      <div className="relative h-full min-h-0" inert={preparing} aria-hidden={preparing || undefined} style={{ opacity: preparing ? 0 : 1 }}>
        {children}
      </div>
      {preparing && <ThreeDProjectLoadingPresentation
        progress={current?.progress ?? 35}
        label={current?.label ?? 'Preparing ThreeD Project…'}
        className="absolute inset-0 z-[1000]"
      />}
    </div>
  </ProjectPresentationReporter.Provider>;
}
