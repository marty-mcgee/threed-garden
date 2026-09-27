'use client';

import { Box } from 'lucide-react';

interface ThreeDProjectLoadingPresentationProps {
  progress: number;
  label: string;
  className?: string;
}

export function ThreeDProjectLoadingPresentation({
  progress,
  label,
  className = '',
}: ThreeDProjectLoadingPresentationProps) {
  const boundedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className={`bg-slate-50 text-foreground dark:bg-slate-950 ${className}`}>
      <div className="flex h-full items-center justify-center">
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
