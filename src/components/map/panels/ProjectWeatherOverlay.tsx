'use client';

import { CloudSun, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectWeather } from '@/components/map/hooks/useProjectWeather';

export function ProjectWeatherOverlay({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { snapshot, busy, error, reload, update } = useProjectWeather(projectId);
  const latest = snapshot?.readings[0];
  const date = (value: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Unknown observation time';
  const metric = (value: number | null | undefined, suffix: string) => value == null ? '—' : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
  const stale = latest && (!latest.recordedAt || Date.now() - Date.parse(latest.recordedAt) > 1_800_000);
  return (
    <section id="project-weather-overlay" role="region" aria-labelledby="project-weather-title"
      className="threed-workspace-panel threed-scene-panel-surface absolute right-2 top-[38px] z-[46] flex max-h-[calc(100%-46px)] w-80 max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-md border shadow-xl backdrop-blur-md"
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h2 id="project-weather-title" className="flex items-center gap-2 text-sm font-semibold"><CloudSun className="h-4 w-4" />Project Weather</h2>
        <Button autoFocus type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Close Project Weather" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
      </header>
      <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-3 text-xs" aria-busy={busy}>
        {busy && <p role="status">{latest ? 'Updating Weather…' : 'Loading Weather…'}</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {snapshot && !snapshot.location && <p>Set a location in <a className="underline" href={`/admin/projects/${projectId}#weather-settings`} target="_blank" rel="noreferrer">Weather Settings</a> to use Weather.</p>}
        {snapshot?.location && <p className="text-muted-foreground">{snapshot.locationSource === 'weather' ? 'Weather location' : snapshot.locationSource === 'module' ? 'ThreeD Weather location' : 'Project origin'}: {snapshot.location.latitude.toFixed(4)}, {snapshot.location.longitude.toFixed(4)}</p>}
        {snapshot?.location && <a className="inline-block underline" href={`/admin/projects/${projectId}#weather-settings`} target="_blank" rel="noreferrer">Weather Settings</a>}
        {snapshot && !snapshot.providerConfigured && <p className="text-muted-foreground">Weather provider is not configured. Stored readings remain available.</p>}
        {snapshot?.location && !latest && <p>No Weather readings for this Project and location yet. Choose Update Weather to request an observation.</p>}
        {latest && <>
          <p className="text-muted-foreground">Observed: {date(latest.recordedAt)} · {latest.source}</p>
          {stale && <p role="status" className="text-amber-700 dark:text-amber-300">This observation is over 30 minutes old.</p>}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            <dt>Temperature</dt><dd>{metric(latest.temperature, ' °F')}</dd>
            <dt>Humidity</dt><dd>{metric(latest.humidity, '%')}</dd>
            <dt>Rainfall (last hour)</dt><dd>{metric(latest.rainfallInches, ' in')}</dd>
            <dt>Wind speed</dt><dd>{metric(latest.windSpeed, ' mph')}</dd>
          </dl>
          {(latest.frostWarning || latest.heatWarning || latest.droughtWarning) && <p className="text-amber-700 dark:text-amber-300">{[latest.frostWarning && 'Frost warning', latest.heatWarning && 'Heat warning', latest.droughtWarning && 'Drought warning'].filter(Boolean).join(' · ')}</p>}
          {snapshot!.readings.length > 1 && <details><summary className="cursor-pointer">Recent observations ({snapshot!.readings.length})</summary><ul className="mt-2 space-y-2">{snapshot!.readings.map(reading => <li key={reading.id} className="border-t pt-2"><time>{date(reading.recordedAt)}</time><p>{metric(reading.temperature, ' °F')} · {metric(reading.humidity, '%')} · {metric(reading.rainfallInches, ' in')} · {metric(reading.windSpeed, ' mph')}</p></li>)}</ul></details>}
        </>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void reload()}><RefreshCw className="mr-1 h-3 w-3" />Reload</Button>
          <Button type="button" size="sm" disabled={busy || !snapshot?.location || !snapshot.providerConfigured} onClick={() => void update()}>Update Weather</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Reload reads stored observations. Update Weather requests and saves an observation; updates within five minutes reuse the latest reading.</p>
      </div>
    </section>
  );
}
