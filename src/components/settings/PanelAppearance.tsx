'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

const KEY = 'threed:panel-opacity:v1';
const defaults = { idle: 80, hover: 98 };
type Appearance = typeof defaults;
function parse(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value && [value.idle, value.hover].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 20 && n <= 100) && value.hover >= value.idle) return { idle: value.idle, hover: value.hover };
  } catch { /* Invalid browser preference falls back to defaults. */ }
  return defaults;
}
const Context = createContext<{ value: Appearance; update: (value: Appearance) => void; ready: boolean; stored: boolean } | null>(null);
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
    setValue(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); setStored(true); } catch { setStored(false); }
  };
  return <Context.Provider value={{ value, update, ready, stored }}>{children}</Context.Provider>;
}
export function PanelAppearanceSettings() {
  const context = useContext(Context);
  if (!context) return null;
  const { value, update, ready, stored } = context;
  return <fieldset className="rounded-md border p-3" disabled={!ready}>
    <legend className="px-1 text-sm font-medium">ThreeD Panel Appearance · This browser</legend>
    <p className="mb-3 text-xs text-muted-foreground">Applies immediately to Scene panels, inspectors and toolbar dropdowns. Separate from Save Changes.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Default opacity: {value.idle}%
        <input className="mt-2 block w-full" type="range" min="20" max="100" value={value.idle} onChange={event => { const idle = Number(event.target.value); update({ idle, hover: Math.max(idle, value.hover) }); }} />
      </label>
      <label className="text-sm">Hover / focus opacity: {value.hover}%
        <input className="mt-2 block w-full" type="range" min={value.idle} max="100" value={value.hover} onChange={event => update({ ...value, hover: Number(event.target.value) })} />
      </label>
    </div>
    <div className="my-3 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-300 p-4">
      <div tabIndex={0} className="threed-workspace-panel threed-toolbar-dropdown-surface rounded border border-white/15 p-4 text-sm text-white">Panel preview — hover or focus to compare</div>
    </div>
    <Button type="button" variant="outline" size="sm" onClick={() => update(defaults)}>Reset panel opacity</Button>
    <p role="status" className="mt-2 text-xs text-muted-foreground">{stored ? 'Saved automatically in this browser.' : 'Browser storage unavailable; changes apply for this session.'}</p>
  </fieldset>;
}
