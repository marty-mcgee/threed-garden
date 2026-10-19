'use client';

import { useEffect, useRef, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectWeatherLocation, type ProjectWeatherLocation, type ProjectWeatherLocationSetting } from '@/libraries/services/threed/project-weather-core';

interface Settings {
  projectId: number;
  setting: ProjectWeatherLocationSetting | null;
  location: ProjectWeatherLocation | null;
  providerConfigured: boolean;
  locationSource: 'weather' | 'project' | 'module';
}
const fields = (settings: Settings) => ({ latitude: settings.location ? String(settings.location.latitude) : '', longitude: settings.location ? String(settings.location.longitude) : '' });

export function ProjectWeatherSettings({ projectId, disabled = false, compact = false }: { projectId: number; disabled?: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [draft, setDraft] = useState({ latitude: '', longitude: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const pending = useRef<AbortController | null>(null), saving = useRef(false);
  const edits = useRef(draft); edits.current = draft;
  const dirty = Boolean(saved && JSON.stringify(draft) !== JSON.stringify(fields(saved!)));
  const empty = !draft.latitude.trim() && !draft.longitude.trim();
  const location = projectWeatherLocation(draft.latitude, draft.longitude);
  async function request(save: boolean, expected: Settings['setting'] = null) {
    if (saving.current && !pending.current?.signal.aborted) return;
    saving.current = true; pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    const captured = { ...edits.current };
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/project/weather/settings?projectId=${projectId}`, {
        method: save ? 'PATCH' : 'GET', cache: 'no-store', signal: controller.signal,
        ...(save ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected, location: empty ? null : { version: 1, ...location } }) } : {}),
      });
      const result = await response.json();
      if (!response.ok || !result.success || result.data?.projectId !== projectId) throw new Error(result.error || 'Could not load Weather Settings.');
      if (controller.signal.aborted) return;
      setSaved(result.data);
      if (!save || JSON.stringify(edits.current) === JSON.stringify(captured)) setDraft(fields(result.data));
      if (save) setMessage('Weather Settings saved. Return to the Scene, Reload Weather, then choose Update Weather.');
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not save Weather Settings.');
    } finally {
      if (pending.current === controller) {
        saving.current = false;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
  }
  useEffect(() => {
    void request(false);
    if (window.location.hash === '#weather-settings') document.getElementById('weather-settings')?.scrollIntoView();
    return () => pending.current?.abort();
    // Parent keys this editor by Project; drafts survive Setup/Modules tab changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')
        || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (anchor.pathname === window.location.pathname && anchor.search === window.location.search) return;
      if (busy || !window.confirm('Discard unsaved Weather Settings?')) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, busy]);
  return <section id="weather-settings" aria-labelledby="weather-settings-title" onKeyDown={event => { if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault(); }} className={compact ? "scroll-mt-4 space-y-2 rounded-xl border bg-card p-4" : "scroll-mt-4 space-y-3 rounded-lg border bg-card p-4"}>
    <h2 id="weather-settings-title" className="flex items-center gap-2 text-base font-semibold"><CloudSun aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />Weather Settings</h2>
    {!compact && <p className="text-xs text-muted-foreground">Coordinates are filled from the existing Weather source when this Project has no saved location. You can override them here. Scene calibration is preserved.</p>}
    {busy && <p role="status" className="text-xs">{saved ? 'Saving Weather Settings…' : 'Loading Weather Settings…'}</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {saved && <>
      <p className="text-xs">OpenWeatherMap: {saved.providerConfigured ? 'Configured' : 'Not configured'}. {saved.location ? `Current Weather location: ${saved.location.latitude}, ${saved.location.longitude}.` : 'No Weather location configured.'}</p>
      {!compact && saved.locationSource === 'module' && <p className="text-xs text-muted-foreground">Using the existing ThreeD Weather module location. Save only if you want a Project-specific override.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs">Weather latitude<Input aria-label="Weather latitude" type="number" step="any" min="-90" max="90" disabled={disabled || busy} value={draft.latitude} onChange={event => { setDraft(current => ({ ...current, latitude: event.target.value })); setMessage(''); }} /></label>
        <label className="space-y-1 text-xs">Weather longitude<Input aria-label="Weather longitude" type="number" step="any" min="-180" max="180" disabled={disabled || busy} value={draft.longitude} onChange={event => { setDraft(current => ({ ...current, longitude: event.target.value })); setMessage(''); }} /></label>
      </div>
      {!empty && !location && <p role="alert" className="text-xs text-destructive">Enter both coordinates: latitude −90 to 90, longitude −180 to 180.</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={disabled || busy || !dirty || (!empty && !location)} onClick={() => void request(true, saved.setting)}>Save Weather Settings</Button>
        <Button type="button" variant="outline" size="sm" disabled={busy || !dirty} onClick={() => { setDraft(fields(saved!)); setError(''); setMessage(''); }}>Discard</Button>
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { if (!dirty || window.confirm('Discard unsaved Weather Settings and reload?')) void request(false); }}>Reload Settings</Button>
      </div>
    </>}
    {!saved && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void request(false)}>Reload Settings</Button>}
    {message && <p role="status" className="text-xs">{message}</p>}
  </section>;
}
