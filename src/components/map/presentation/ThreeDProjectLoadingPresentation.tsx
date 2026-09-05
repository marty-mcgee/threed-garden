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
    <div className={`bg-slate-950 text-white ${className}`}>
      {showProjectHeader && (
        <>
          <div
            className="flex h-9 items-center justify-between border-b border-white/10 px-2"
            aria-label="Loading Project header"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="flex gap-2">
              <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-6 w-20 animate-pulse rounded bg-white/10" />
            </div>
          </div>
          <div className="h-1.5" aria-hidden="true" />
        </>
      )}
      <div className={`flex items-center justify-center ${showProjectHeader ? 'h-[calc(100%-2.625rem)]' : 'h-full'}`}>
        <div className="w-[min(24rem,calc(100%-3rem))] min-h-32 text-center">
        <Box className="mx-auto h-6 w-6 text-cyan-300/80" aria-hidden="true" />
        <div className="mt-3 text-sm font-medium tracking-wide">Loading ThreeD Project</div>
        <div className="mt-2 h-4 truncate text-xs text-white/60" aria-live="polite">
          {label}
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="ThreeD Project loading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={boundedProgress}
        >
          <div
            className="h-full rounded-full bg-cyan-400 transition-[width] duration-300 ease-out"
            style={{ width: `${boundedProgress}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] tabular-nums text-white/40">
          {boundedProgress}%
        </div>
        </div>
      </div>
    </div>
  );
}
