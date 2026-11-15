'use client';

import { useEffect, useRef, useState } from 'react';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Input } from '@/components/ui/input';
import { defaultTerrainElevationColors, parseTerrainElevationColors, terrainBandNames, type TerrainElevationColors } from '@/libraries/services/threed/terrains/terrain-core';

interface Props {
  settings?: TerrainElevationColors;
  disabled: boolean;
  onChange: (settings: TerrainElevationColors | undefined) => void;
  onPendingChange: (pending: boolean) => void;
}

export function TerrainColors({ settings, disabled, onChange, onPendingChange }: Props) {
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
  return <fieldset disabled={disabled} className="space-y-2">
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(settings)} onChange={event => onChange(event.target.checked ? defaultTerrainElevationColors() : undefined)} />Elevation colors</label>
      <ModelFieldHelp label="Elevation colors">Enable Elevation colors to edit these settings. When disabled, the Terrain uses its Surface color. Colors follow elevation from valleys and hills through mountain stone and snow. Valid colors, thresholds and switches update the Canvas immediately and support Undo/Redo; Save Changes retains them. Incomplete or invalid numeric inputs retain the last valid preview and block Save until corrected.</ModelFieldHelp>
    </div>
    <div className="flex items-center gap-2"><span>Sea Level and thresholds</span><ModelFieldHelp label="Sea Level and thresholds">Sea Level colors low ground as Water; it does not flatten ground or add water physics. Each band starts its specified metres above Sea Level. Thresholds must increase. Water includes Sea Level; Shore starts immediately above it. Colors blend between grid vertices. Disabled bands use the next enabled band below, or Surface color when none applies. Disabled Water uses Surface color. Turning a band off retains its settings. Sea Level remains the shared reference for every band.</ModelFieldHelp></div>
    <fieldset disabled={!settings} className="space-y-2">
      <label className="flex items-center gap-2"><input type="checkbox" role="switch" aria-label="Water enabled" checked={draft.waterEnabled !== false} onChange={event => toggleBand(null, event.target.checked)} />Water</label>
      <label className="block">Sea Level (m)<Input type="number" min="-1000" max="1000" step="0.01" value={sea} onChange={event => { setSea(event.target.value); preview(draft, event.target.value); }} /></label>
      <label className="block">Water color<Input type="color" disabled={draft.waterEnabled === false} value={draft.waterColor} onChange={event => { const next = { ...draft, waterColor: event.target.value }; setDraft(next); preview(next); }} /></label>
      {terrainBandNames.map((name, index) => <div key={name} className="grid grid-cols-2 gap-2">
        <label className="col-span-2 flex items-center gap-2"><input type="checkbox" role="switch" aria-label={name + ' enabled'} checked={draft.bands[index].enabled !== false} onChange={event => toggleBand(index, event.target.checked)} />{name}</label>
        <label>{name} color<Input type="color" disabled={draft.bands[index].enabled === false} value={draft.bands[index].color} onChange={event => {
          const next = {
            ...draft,
            bands: draft.bands.map((band, bandIndex) => bandIndex === index ? { ...band, color: event.target.value } : band),
          };
          setDraft(next);
          preview(next);
        }} /></label>
        <label>{name} from (m)<Input type="number" min="0" max="2000" step="0.01" disabled={index === 0 || draft.bands[index].enabled === false} value={thresholds[index]} onChange={event => { const next = thresholds.map((value, thresholdIndex) => thresholdIndex === index ? event.target.value : value); setThresholds(next); preview(draft, sea, next); }} /></label>
      </div>)}
      {pending && <p role="status">Correct invalid values before saving.</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </fieldset>
  </fieldset>;
}
