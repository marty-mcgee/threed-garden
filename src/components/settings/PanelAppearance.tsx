'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PanelsTopLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'threed:panel-opacity:v1';
const defaults = { idle: 80, hover: 98 };
export type PanelAppearance = typeof defaults;
type Appearance = PanelAppearance;
function parse(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value && [value.idle, value.hover].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100)) return { idle: value.idle, hover: value.hover };
  } catch { /* Invalid browser preference falls back to defaults. */ }
  return defaults;
}
const Context = createContext<{ value: Appearance; update: (value: Appearance) => boolean; ready: boolean; stored: boolean } | null>(null);
export function PanelAppearanceProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState(true);
  useEffect(() => {
    try { setValue(parse(localStorage.getItem(KEY))); } catch { setStored(false); }
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) setValue(parse(event.newValue)); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty('--threed-panel-idle-opacity', String(value.idle / 100));
    document.documentElement.style.setProperty('--threed-panel-hover-opacity', String(value.hover / 100));
  }, [value]);
  const update = (next: Appearance) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setValue(next);
      setStored(true);
      return true;
    } catch { setStored(false); return false; }
  };
  return <Context.Provider value={{ value, update, ready, stored }}>{children}</Context.Provider>;
}
export function usePanelAppearance() {
  return useContext(Context);
}

export function PanelAppearanceSettings({ value, onChange: update, disabled = false }: {
  value: PanelAppearance;
  onChange: (value: PanelAppearance) => void;
  disabled?: boolean;
}) {
  return <fieldset className="rounded-md border p-3" disabled={disabled}>
    <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><PanelsTopLeft aria-hidden="true" className="h-3.5 w-3.5 text-cyan-500" />Panel Appearance <span className="font-normal text-muted-foreground">· This browser</span></span></legend>
    <p className="mb-2 text-xs text-muted-foreground">Preview changes below. Use Save Changes to apply and save panel opacity in this browser.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">Default opacity: {value.idle}%
        <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.idle} onChange={event => update({ ...value, idle: Number(event.target.value) })} />
      </label>
      <label className="text-xs">Hover / focus opacity: {value.hover}%
        <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.hover} onChange={event => update({ ...value, hover: Number(event.target.value) })} />
      </label>
    </div>
    <div className="my-2 rounded-md bg-gradient-to-r from-emerald-500 to-sky-300 p-2">
      <div tabIndex={0} style={{ '--threed-panel-idle-opacity': String(value.idle / 100), '--threed-panel-hover-opacity': String(value.hover / 100) } as import('react').CSSProperties} className="threed-workspace-panel threed-toolbar-dropdown-surface rounded border border-white/15 p-3 text-xs text-white">Panel preview — hover or focus to compare</div>
    </div>
    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs [@media(pointer:coarse)]:min-h-11" onClick={() => update(defaults)}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-cyan-500" />Reset Defaults</Button>
  </fieldset>;
}
