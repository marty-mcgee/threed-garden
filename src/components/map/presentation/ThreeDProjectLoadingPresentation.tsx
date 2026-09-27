'use client';

import { Box } from 'lucide-react';

interface ThreeDProjectLoadingPresentationProps {
  progress: number;
  label: string;
  className?: string;
  showProjectHeader?: boolean;
}

export function ThreeDProjectLoadingPresentation({
  progress,
  label,
  className = '',
  showProjectHeader = false,
}: ThreeDProjectLoadingPresentationProps) {
  const boundedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className={`bg-slate-50 text-foreground dark:bg-slate-950 ${className}`}>
      {showProjectHeader && <ProjectToolbarLoadingSkeleton />}
      <div className={`flex items-center justify-center ${showProjectHeader ? 'h-[calc(100%-37px)] rounded-xl border border-border' : 'h-full'}`}>
        <div className="w-[min(24rem,calc(100%-3rem))] min-h-32 text-center">
        <Box className="mx-auto h-6 w-6 text-cyan-700 dark:text-cyan-300/80" aria-hidden="true" />
        <div className="mt-3 text-sm font-medium tracking-wide">Loading ThreeD Project</div>
        <div className="mt-2 h-4 truncate text-xs text-muted-foreground" aria-live="polite">
          {label}
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-label="ThreeD Project loading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={boundedProgress}
        >
          <div
            className="h-full rounded-full bg-cyan-600 dark:bg-cyan-400 transition-[width] duration-300 ease-out"
            style={{ width: `${boundedProgress}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] tabular-nums text-muted-foreground">
          {boundedProgress}%
        </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectToolbarLoadingSkeleton() {
  return (
    <div
    className="threed-project-toolbar flex h-[37px] items-center justify-between border-b border-foreground/10 px-0.5"
    aria-label="Loading Project header"
  >
    <div className="h-5 w-40 animate-pulse rounded bg-foreground/10" />
    <div className="flex gap-2" aria-hidden="true">
      <div className="hidden h-7 w-24 animate-pulse rounded bg-foreground/10 sm:block" />
      <div className="hidden h-7 w-20 animate-pulse rounded bg-foreground/10 sm:block" />
      <div className="h-7 w-24 animate-pulse rounded bg-foreground/10" />
      <div className="h-7 w-20 animate-pulse rounded bg-foreground/10" />
    </div>
  </div>
  );
}
