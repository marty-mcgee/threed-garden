'use client';

import { useEffect, useRef, useState } from 'react';
import { TerrainHelp } from './TerrainHelp';
import { Input } from '@/components/ui/input';
import { defaultTerrainElevationColors, parseTerrainElevationColors, terrainBandNames, type TerrainElevationColors } from '@/libraries/services/threed/terrains/terrain-core';

interface Props {
  heightsM?: number[];
  display?: 'color' | 'height';
  settings?: TerrainElevationColors;
  disabled: boolean;
  onChange: (settings: TerrainElevationColors | undefined) => void;
  onPendingChange: (pending: boolean) => void;
}

export function TerrainColors({ settings, disabled, onChange, onPendingChange, heightsM, display }: Props) {
  const [draft, setDraft] = useState(settings ?? defaultTerrainElevationColors());
  const [sea, setSea] = useState(String(draft.seaLevelM));
  const [thresholds, setThresholds] = useState(draft.bands.map(band => String(band.fromM)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const switchUpdate = useRef<TerrainElevationColors | null>(null);
  useEffect(() => {
    if (settings && switchUpdate.current === settings) {
      switchUpdate.current = null;
      return;
    }
    switchUpdate.current = null;
    const next = settings ?? defaultTerrainElevationColors();
    setDraft(next);
    setSea(String(next.seaLevelM));
    setThresholds(next.bands.map(band => String(band.fromM)));
    setPending(false);
    onPendingChange(false);
    setError('');
  }, [settings, onPendingChange]);
  function toggleBand(index: number | null, enabled: boolean) {
    if (disabled || !settings) return;
    const update = (value: TerrainElevationColors): TerrainElevationColors => index === null ? {
      ...value,
      waterEnabled: enabled,
    } : {
      ...value,
      bands: value.bands.map((band, bandIndex) => bandIndex === index ? {
        ...band,
        enabled,
      } : band),
    };
    const next = update(settings);
    switchUpdate.current = next;
    setDraft(update(draft));
    onChange(next);
  }
  function preview(nextDraft = draft, nextSea = sea, nextThresholds = thresholds) {
    if (disabled || !settings) return;
    try {
      if (!nextSea.trim() || nextThresholds.some(value => !value.trim())) throw new Error('Enter every elevation threshold.');
      const next = parseTerrainElevationColors({
        ...nextDraft,
        seaLevelM: Number(nextSea),
        bands: nextDraft.bands.map((band, index) => ({
          ...band,
          fromM: Number(nextThresholds[index]),
        })),
      });
      switchUpdate.current = next;
      onChange(next);
      setError('');
      setPending(false);
      onPendingChange(false);
    } catch (error) {
      setPending(true);
      onPendingChange(true);
      setError(error instanceof Error ? error.message : 'Invalid Terrain colors.');
    }
  }
  function changeThreshold(index: number, value: string) {
    // Shore width and Beach start describe the same boundary above Sea Level.
    const next = thresholds.map((current, thresholdIndex) => {
      if (index <= 1 && thresholdIndex === 0) return '0';
      if (thresholdIndex === (index === 0 ? 1 : index)) return value;
      return current;
    });
    setThresholds(next);
    preview(draft, sea, next);
  }
  const minimum = heightsM ? Math.min(...heightsM) : -Infinity;
  const maximum = heightsM ? Math.max(...heightsM) : Infinity;
  const paletteFeedback = !settings ? 'Enable Elevation colors to edit these values.' : display === 'height' ? 'Height map overrides these colors. Select Terrain colors to see changes.' : '';
  function bandFeedback(index: number) {
    if (paletteFeedback) return paletteFeedback;
    if (draft.bands[index].enabled === false) return terrainBandNames[index] + ' is off; its saved color and threshold have no effect until enabled.';
    const start = Number(sea) + (index === 0 ? 0 : Number(thresholds[index]));
    const nextIndex = draft.bands.findIndex((band, bandIndex) => bandIndex > index && band.enabled !== false);
    const end = nextIndex >= 0 ? Number(sea) + Number(thresholds[nextIndex]) : Infinity;
    if (maximum < start || minimum >= end || maximum <= Number(sea)) return 'No current Terrain heights reach this band. Its values are retained for future height edits.';
    if (index === 0) return draft.bands[1].enabled === false
      ? 'Beach is off, so Shore extends to the next enabled band. Its width is retained and will apply when Beach is enabled.'
      : 'Shore always starts immediately above Sea Level. Width is its vertical height range in metres, ending where Beach starts. Editing Shore width or Beach from updates that shared boundary. Use a positive width below Shrub from. Valid changes preview immediately.';
    return index === 1 ? 'Beach starts this many metres above Sea Level, at the top of Shore. Editing this value also updates Shore width. Keep it positive and below Shrub from.' : 'Valid thresholds preview immediately. Keep them increasing; small changes may not cross a visible height sample.';
  }
  const waterFeedback = paletteFeedback || (draft.waterEnabled === false ? 'Water is off; enable it to see its color.' : minimum > draft.seaLevelM ? 'No current Terrain heights reach Water. Adjust Sea Level or the Terrain heights.' : 'Water color previews immediately at or below Sea Level.');
  return <fieldset disabled={disabled} className="space-y-1">
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(settings)} onChange={event => onChange(event.target.checked ? defaultTerrainElevationColors() : undefined)} /><TerrainHelp content="Enable Elevation colors to edit these settings. When disabled, the Terrain uses its Surface color. Colors follow elevation from valleys and hills through mountain stone and snow. Valid colors, thresholds and switches update the Canvas immediately and support Undo/Redo; Save Changes retains them. Incomplete or invalid numeric inputs retain the last valid preview and block Save until corrected. Height map overrides the palette; choose Terrain colors to see it."><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Elevation colors</span></TerrainHelp></label>
    </div>
    <div className="flex items-center gap-2"><TerrainHelp content={<>{paletteFeedback} Sea Level colors low ground as Water; it does not flatten ground or add water physics. Each band starts its specified metres above Sea Level. Thresholds must increase. Water includes Sea Level. Shore starts immediately above Sea Level. Shore width and Beach from are the same boundary: changing either updates both. Shore width is a vertical elevation range, not horizontal distance. Sharp height bands classify elevation per pixel on Continuous Terrain and per sample on Square blocks, without blending neighboring band colors. Disabled bands use the next enabled band below, or Surface color when none applies. Disabled Water uses Surface color. Turning a band off retains its settings. Sea Level remains the shared reference for every band.</>}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Sea Level and thresholds</span></TerrainHelp></div>
    <fieldset disabled={!settings} className="space-y-1">
      <div className="flex items-center justify-between gap-1"><label className="flex items-center gap-1"><input type="checkbox" role="switch" aria-label="Water enabled" checked={draft.waterEnabled !== false} onChange={event => toggleBand(null, event.target.checked)} /><TerrainHelp content={waterFeedback}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Water</span></TerrainHelp></label>      <label className="block"><span className="sr-only">Water color</span><Input type="color" disabled={draft.waterEnabled === false} value={draft.waterColor} onChange={event => { const next = { ...draft, waterColor: event.target.value }; setDraft(next); preview(next); }} /></label></div>
      <label className="grid grid-cols-[1fr_6rem] items-center gap-1"><TerrainHelp content={paletteFeedback || 'Sea Level shifts every elevation band. Water can be off while Sea Level still affects land colors. Valid values preview immediately.'}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Sea Level (m)</span></TerrainHelp><Input type="number" min="-1000" max="1000" step="0.01" value={sea} onChange={event => { setSea(event.target.value); preview(draft, event.target.value); }} /></label>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground"><span>Band / color</span><span>Width / from (m)</span></div>
      {terrainBandNames.map((name, index) => <div key={name} className="grid grid-cols-[minmax(0,1fr)_2.5rem_5rem] items-center gap-1 border-t py-1">
        <label className="flex min-w-0 items-center gap-1"><input type="checkbox" role="switch" aria-label={name + ' enabled'} checked={draft.bands[index].enabled !== false} onChange={event => toggleBand(index, event.target.checked)} /><TerrainHelp content={bandFeedback(index)}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">{index === 0 ? 'Shore width' : name}</span></TerrainHelp></label>
        <label className="block"><span className="sr-only">{name} color</span><Input type="color" disabled={draft.bands[index].enabled === false} value={draft.bands[index].color} onChange={event => {
          const next = {
            ...draft,
            bands: draft.bands.map((band, bandIndex) => bandIndex === index ? { ...band, color: event.target.value } : band),
          };
          setDraft(next);
          preview(next);
        }} /></label>
        <label className="block"><span className="sr-only">{name} {index === 0 ? 'width' : 'from'} (m)</span><Input type="number" min="0" max="2000" step="0.01" disabled={draft.bands[index].enabled === false} value={thresholds[index === 0 ? 1 : index]} onChange={event => changeThreshold(index, event.target.value)} /></label>
      </div>)}
      {pending && <p role="status">Correct invalid values before saving.</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </fieldset>
  </fieldset>;
}
