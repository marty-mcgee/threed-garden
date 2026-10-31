'use client';
import { X } from 'lucide-react';
import { useLayoutEffect } from 'react';
import type { SceneResourceIssue } from '@/components/threed/shared/SceneResourceStatus';
import { ThreeDProjectLoadingPresentation } from './ThreeDProjectLoadingPresentation';
import { useProjectPresentationReporter } from './ProjectPresentationBoundary';

interface SceneResourceFeedbackProps {
  physicsFailed: boolean;
  warningsDismissed: boolean;
  resourceFailed: boolean;
  visibleResourceIssues: readonly SceneResourceIssue[];
  onDismissWarnings: () => void;
  scenePostProduction: boolean;
  sceneLoadingProgress: number;
  sceneLoadingLabel: string;
  sceneProductionStarted: boolean;
  resourcesPending: boolean;
}

/** DOM feedback outside Canvas; resource reporting and readiness remain Scene-owned. */
export function SceneResourceFeedback({ physicsFailed, warningsDismissed, resourceFailed, visibleResourceIssues, onDismissWarnings, scenePostProduction, sceneLoadingProgress, sceneLoadingLabel, sceneProductionStarted, resourcesPending }: SceneResourceFeedbackProps) {
  const reportPresentation = useProjectPresentationReporter();
  useLayoutEffect(() => {
    reportPresentation?.({
      progress: sceneLoadingProgress,
      label: sceneLoadingLabel,
      complete: scenePostProduction,
      failed: physicsFailed,
    });
  }, [reportPresentation, sceneLoadingProgress, sceneLoadingLabel, scenePostProduction, physicsFailed]);
  return <>
      {!physicsFailed && !warningsDismissed && (resourceFailed || visibleResourceIssues.length > 0) && (
        <aside aria-label="Scene file loading warnings" className="absolute bottom-4 left-4 z-40 max-w-sm max-h-[35%] overflow-auto rounded-lg border border-amber-600/40 bg-amber-50/95 dark:border-amber-400/40 dark:bg-slate-950/90 p-3 text-xs text-amber-950 dark:text-amber-100 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p role="status" className="font-semibold">Some files could not be loaded</p>
            <button type="button" aria-label="Close file loading warnings" title="Close warnings" className="shrink-0 rounded p-1 hover:bg-amber-900/10 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2" onClick={onDismissWarnings}><X className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mt-1 text-amber-900 dark:text-amber-100/80">You can continue using this Project.</p>
          {visibleResourceIssues.length > 0 ? <ul className="mt-2 space-y-1">
            {visibleResourceIssues.map(issue => <li key={`${issue.modelId ?? "resource"}:${issue.fileName}:${issue.message}`} className="break-words"><span className="font-mono">{issue.fileName}</span> — {issue.message}</li>)}
          </ul> : <p className="mt-2">A Model or Ground Map is unavailable.</p>}
        </aside>
      )}
      {!reportPresentation && !physicsFailed && !scenePostProduction && (
        <ThreeDProjectLoadingPresentation
          progress={sceneLoadingProgress}
          label={sceneLoadingLabel}
          className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-700 ease-out motion-reduce:transition-none ${sceneProductionStarted ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      {!physicsFailed && scenePostProduction && resourcesPending && (
        <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-4 right-4 z-30 max-w-[calc(100%-2rem)] rounded-lg border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          Loading Scene assets…
        </div>
      )}
  </>;
}
