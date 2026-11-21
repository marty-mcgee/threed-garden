'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useProjectOverlayPosition } from '@/components/map/panels/ProjectOverlayLayout';
import { Map, X } from 'lucide-react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  openSection: (section: "ground" | "map") => void;
  host: HTMLDivElement | null;
  setHost: (host: HTMLDivElement | null) => void;
} | null>(null);

export function GroundMapInspectorWorkspace({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  function openSection(section: "ground" | "map") {
    setOpen(true);
    requestAnimationFrame(() => {
      const target = host?.querySelector<HTMLElement>('[data-setup-section="' + section + '"]');
      target?.focus({ preventScroll: true });
      if (host && target) host.scrollTop += target.getBoundingClientRect().top - host.getBoundingClientRect().top;
    });
  }
  return <Context.Provider value={{ open, setOpen, openSection, host, setHost }}>{children}</Context.Provider>;
}
export const useGroundMapInspector = () => useContext(Context);

export function GroundMapInspector({ available, onSave, saving }: {
  available: boolean;
  onSave: () => void;
  saving: boolean;
}) {
  const workspace = useGroundMapInspector();
  const overlay = useProjectOverlayPosition('sceneSetup');
  const visible = workspace?.open && available;
  return <section ref={overlay.ref} hidden={!visible} aria-labelledby="scene-setup-title"
    style={{ ...overlay.style, display: visible ? undefined : 'none' }}
    className="threed-workspace-panel threed-toolbar-dropdown-surface absolute left-1/2 top-10 z-40 flex max-h-[calc(100%_-_4rem)] w-[min(28rem,calc(100%_-_2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl backdrop-blur-md">
    <div className="h-1 shrink-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
    <header className="flex shrink-0 items-center gap-2 p-3">
      <div {...overlay.handle} aria-label="Move Scene Setup panel" className={overlay.handle.className + ' flex flex-1 items-center gap-2'}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30">
          <Map aria-hidden="true" className="h-4 w-4 text-cyan-500" />
        </span>
        <h2 id="scene-setup-title" className="text-base font-semibold">Scene Setup</h2>
      </div>
      <ModelFieldHelp label="Scene Setup">Save Project to keep ground sizing, map alignment and lighting changes.</ModelFieldHelp>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Close Scene Setup" onClick={() => workspace?.setOpen(false)}>
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </Button>
    </header>
    <div ref={workspace?.setHost} className="min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 text-xs" />
    <footer className="shrink-0 border-t border-foreground/10 p-3">
      <Button type="button" className="h-8 w-full bg-cyan-600 text-xs text-white hover:bg-cyan-500" disabled={saving} onClick={onSave}>{saving ? 'Saving\u2026' : 'Save Project'}</Button>
    </footer>
  </section>;
}
