'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  host: HTMLDivElement | null;
  setHost: (host: HTMLDivElement | null) => void;
} | null>(null);

export function GroundMapInspectorWorkspace({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return <Context.Provider value={{ open, setOpen, host, setHost }}>{children}</Context.Provider>;
}
export const useGroundMapInspector = () => useContext(Context);

export function GroundMapInspector({ leftOffsetRem, available, onSave, saving }: {
  leftOffsetRem: number; available: boolean; onSave: () => void; saving: boolean;
}) {
  const workspace = useGroundMapInspector();
  return <section hidden={!workspace?.open || !available} aria-label="Ground Map inspector"
    className="threed-workspace-panel threed-details-surface absolute top-9 z-40 flex max-h-[calc(100%-2.25rem)] w-[min(18rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-white/15 text-white shadow-xl"
    style={{ display: !workspace?.open || !available ? 'none' : undefined, left: `${leftOffsetRem}rem`, backgroundColor: 'var(--threed-details-background)' }}>
    <div className="shrink-0 border-b border-white/10 p-2">
      <Button className="h-8 w-full text-xs" variant="outline" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save Project'}</Button>
      <div className="mt-2 flex items-center justify-between"><h2 className="text-sm font-semibold">Ground Map</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Close Ground Map" onClick={() => workspace?.setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>
    </div>
    <div ref={workspace?.setHost} className="min-h-0 overflow-y-auto overscroll-contain p-3 text-xs" />
  </section>;
}
