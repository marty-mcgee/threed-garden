'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PanelsTopLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'threed:panel-opacity:v1';
const defaults = { idle: 80, hover: 98, headerIdle: 15, headerHover: 90, lightSurface: '#f8fafc', darkSurface: '#111a28', lightControl: '#0f172a', darkControl: '#f8fafc', lightControlText: '#0f172a', darkControlText: '#f8fafc', controlIdle: 0, controlHover: 8, controlActive: 12 };
export type PanelAppearance = typeof defaults;
type Appearance = PanelAppearance;
function parse(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? 'null');
    const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
    const color = (n: unknown, fallback: string) => typeof n === 'string' && /^#[0-9a-fA-F]{6}$/.test(n) ? n : fallback;
    if (value && valid(value.idle) && valid(value.hover)) return {
      idle: value.idle, hover: value.hover,
      headerIdle: valid(value.headerIdle) ? value.headerIdle : defaults.headerIdle,
      headerHover: valid(value.headerHover) ? value.headerHover : defaults.headerHover,
      lightSurface: color(value.lightSurface, defaults.lightSurface), darkSurface: color(value.darkSurface, defaults.darkSurface),
      lightControl: color(value.lightControl, defaults.lightControl), darkControl: color(value.darkControl, defaults.darkControl),
      lightControlText: color(value.lightControlText, defaults.lightControlText), darkControlText: color(value.darkControlText, defaults.darkControlText),
      controlIdle: valid(value.controlIdle) ? value.controlIdle : defaults.controlIdle,
      controlHover: valid(value.controlHover) ? value.controlHover : defaults.controlHover,
      controlActive: valid(value.controlActive) ? value.controlActive : defaults.controlActive,
    };
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
    document.documentElement.style.setProperty('--threed-header-idle-opacity', String(value.headerIdle / 100));
    document.documentElement.style.setProperty('--threed-header-hover-opacity', String(value.headerHover / 100));
    const css = document.documentElement.style;
    css.setProperty('--threed-light-surface', value.lightSurface);
    css.setProperty('--threed-dark-surface', value.darkSurface);
    css.setProperty('--threed-light-control', value.lightControl);
    css.setProperty('--threed-dark-control', value.darkControl);
    css.setProperty('--threed-light-control-text', value.lightControlText);
    css.setProperty('--threed-dark-control-text', value.darkControlText);
    css.setProperty('--threed-control-idle-opacity', String(value.controlIdle) + '%');
    css.setProperty('--threed-control-hover-opacity', String(value.controlHover) + '%');
    css.setProperty('--threed-control-active-opacity', String(value.controlActive) + '%');
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
  const themes = [
    { name: 'Light theme', surface: 'lightSurface', button: 'lightControl', text: 'lightControlText' },
    { name: 'Dark theme', surface: 'darkSurface', button: 'darkControl', text: 'darkControlText' },
  ] as const;

  return <fieldset className="rounded-md border p-3" disabled={disabled}>
    <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><PanelsTopLeft aria-hidden="true" className="h-3.5 w-3.5 text-cyan-500" />Scene Appearance <span className="font-normal text-muted-foreground">· This browser</span></span></legend>
    <p className="mb-3 text-xs text-muted-foreground">Previews update as you edit. Use Save Changes to apply your choices to the Scene in this browser.</p>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <h3 className="text-xs font-semibold">Scene panels</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">Default opacity: {value.idle}%
            <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.idle} onChange={event => update({ ...value, idle: Number(event.target.value) })} />
          </label>
          <label className="text-xs">Hover / focus opacity: {value.hover}%
            <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.hover} onChange={event => update({ ...value, hover: Number(event.target.value) })} />
          </label>
        </div>
        <div className="rounded-md bg-gradient-to-r from-emerald-500 to-sky-300 p-2">
          <div tabIndex={0} style={{ '--threed-panel-idle-opacity': String(value.idle / 100), '--threed-panel-hover-opacity': String(value.hover / 100), '--threed-light-surface': value.lightSurface, '--threed-dark-surface': value.darkSurface } as import('react').CSSProperties} className="threed-appearance-preview threed-workspace-panel threed-toolbar-dropdown-surface rounded border p-3 text-xs">Panel preview — hover or focus to compare</div>
        </div>
        <h3 className="text-xs font-semibold">Project Header</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">Project Header default opacity: {value.headerIdle}%
            <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.headerIdle} onChange={event => update({ ...value, headerIdle: Number(event.target.value) })} />
          </label>
          <label className="text-xs">Project Header hover / focus opacity: {value.headerHover}%
            <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value.headerHover} onChange={event => update({ ...value, headerHover: Number(event.target.value) })} />
          </label>
        </div>
        <div className="rounded-md bg-gradient-to-r from-emerald-500 to-sky-300 p-2">
          <div tabIndex={0} style={{ '--threed-header-idle-opacity': String(value.headerIdle / 100), '--threed-header-hover-opacity': String(value.headerHover / 100), '--threed-light-surface': value.lightSurface, '--threed-dark-surface': value.darkSurface } as import('react').CSSProperties} className="threed-appearance-preview threed-project-toolbar rounded border p-3 text-xs">Project Header preview — hover or focus to compare</div>
        </div>
      </div>
      <div className="min-w-0 space-y-3">
        <h3 className="text-xs font-semibold">Colors</h3>
        <p className="text-xs text-muted-foreground">Choose the panel, button background, and button text colors for each theme.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {themes.map(theme => <div key={theme.name} className={`space-y-2 rounded-md border p-2 ${theme.name === 'Dark theme' ? 'dark:order-first' : 'dark:order-last'}`}>
            <h4 className="flex items-center gap-2 text-xs font-semibold">{theme.name}<span className={`font-normal text-cyan-500 ${theme.name === 'Dark theme' ? 'hidden dark:inline' : 'dark:hidden'}`}>Current theme</span></h4>
            {([['Panel + header', theme.surface], ['Button background', theme.button], ['Button text color', theme.text]] as const).map(([label, key]) =>
              <label key={key} className="flex min-h-10 items-center gap-2 text-xs"><span>{label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{value[key].toUpperCase()}</span>
                <input aria-label={`${theme.name} ${label}`} className="h-8 w-10 cursor-pointer" type="color" value={value[key]} onChange={event => update({ ...value, [key]: event.target.value })} />
              </label>)}
          </div>)}
        </div>
        <h3 className="text-xs font-semibold">Project Header button background opacity</h3>
        <p className="text-xs text-muted-foreground">The button text color above is a manual setting. These sliders only change background opacity.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(['controlIdle', 'controlHover', 'controlActive'] as const).map(key =>
            <label key={key} className="text-xs">{({ controlIdle: 'Default', controlHover: 'Hover / focus', controlActive: 'Active' })[key]}: {value[key]}%
              <input className="mt-1.5 block w-full accent-cyan-500" type="range" min="0" max="100" value={value[key]} onChange={event => update({ ...value, [key]: Number(event.target.value) })} />
            </label>)}
        </div>
        <div className="rounded-md bg-gradient-to-r from-emerald-500 to-sky-300 p-2">
          <div className="threed-appearance-preview threed-project-toolbar rounded border p-2 text-xs" style={{ '--threed-header-idle-opacity': String(value.headerIdle / 100), '--threed-header-hover-opacity': String(value.headerHover / 100), '--threed-light-surface': value.lightSurface, '--threed-dark-surface': value.darkSurface, '--threed-light-control': value.lightControl, '--threed-dark-control': value.darkControl, '--threed-light-control-text': value.lightControlText, '--threed-dark-control-text': value.darkControlText, '--threed-control-idle-opacity': String(value.controlIdle) + '%', '--threed-control-hover-opacity': String(value.controlHover) + '%', '--threed-control-active-opacity': String(value.controlActive) + '%' } as import('react').CSSProperties}>
            <button type="button" data-variant="outline" className="rounded px-2 py-1">Default / hover</button>{' '}
            <button type="button" data-variant="secondary" className="rounded px-2 py-1">Active</button>
          </div>
        </div>
      </div>
    </div>
    <Button type="button" variant="outline" size="sm" className="mt-3 h-8 gap-1.5 text-xs [@media(pointer:coarse)]:min-h-11" onClick={() => update(defaults)}><RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-cyan-500" />Reset Defaults</Button>
  </fieldset>;
}
