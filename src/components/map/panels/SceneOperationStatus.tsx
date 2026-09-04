'use client';

import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapViewMode } from '@/lib/types/map';

export interface SceneOperationStatusValue {
  phase: 'ready' | 'pending';
  label: string;
  instruction: string;
  cancellable: boolean;
}

export function SceneOperationStatus({
  operation,
  viewMode,
  onCancel,
}: {
  operation: SceneOperationStatusValue | null;
  viewMode: MapViewMode;
  onCancel: () => void;
}) {
  if (!operation) return null;

  return (
    <div
      className={`flex min-h-8 max-w-[32rem] items-center gap-2 rounded-md border py-1 pl-2 text-[11px] ${
        operation.phase === 'pending'
          ? 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          : 'border-cyan-500/35 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium" title={operation.label}>
          {operation.label}
        </span>
        <span className="hidden truncate text-[10px] opacity-75 md:block">
          {operation.instruction}
        </span>
      </span>
      <span className="shrink-0 rounded border border-current/20 px-1 py-0.5 text-[9px] font-semibold uppercase opacity-75">
        {viewMode}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-current hover:bg-current/10 hover:text-current"
        disabled={!operation.cancellable}
        aria-label={`Cancel ${operation.label}`}
        title={operation.cancellable
          ? `Cancel ${operation.label} (Escape)`
          : operation.instruction}
        onClick={onCancel}
      >
        {operation.phase === 'pending'
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <X className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
