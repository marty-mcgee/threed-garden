'use client';

import { useEffect, useState } from 'react';
import { TerrainHelp } from './TerrainHelp';
import { Input } from '@/components/ui/input';
import { defaultTerrainStyle, parseTerrainStyle, type TerrainDefinition } from '@/libraries/services/threed/terrains/terrain-core';

export const terrainStyleHelp = 'Resolution is squares per side, not bit rate. Blocks resample the saved height grid; increasing display resolution does not add new landforms. The editable grid is controlled by Columns and Rows. Blocks and flat Water are visual surfaces; collision and sculpting follow the underlying Terrain. Height map shows true elevations. Undo restores the previous Terrain. Save Changes retains all settings.';

export function TerrainStyleControls({ definition, disabled, onChange, onPendingChange }: {
  onPendingChange: (pending: boolean) => void;
  definition: TerrainDefinition;
  disabled: boolean;
  onChange: (definition: TerrainDefinition) => void;
}) {
  const style = definition.appearance.style ?? defaultTerrainStyle();
  const [resolution, setResolution] = useState(String(style.resolution));
  const [saturation, setSaturation] = useState(String(style.saturation));
  useEffect(() => setResolution(String(style.resolution)), [style.resolution]);
  useEffect(() => setSaturation(String(style.saturation)), [style.saturation]);
  const resolutionInvalid = !resolution.trim() || !Number.isInteger(Number(resolution)) || Number(resolution) < 20 || Number(resolution) > 500;
  const saturationInvalid = !saturation.trim() || !Number.isFinite(Number(saturation)) || Number(saturation) < 0 || Number(saturation) > 2;
  useEffect(() => onPendingChange(resolutionInvalid || saturationInvalid), [resolutionInvalid, saturationInvalid, onPendingChange]);
  const palette = definition.appearance.elevationColors;
  const waterFeedback = style.display === 'height' ? 'Water presentation is hidden by Height map. Select Terrain colors.'
    : !palette || palette.waterEnabled === false ? 'Water presentation requires Elevation colors and Water enabled.'
    : Math.min(...definition.heightsM) > palette.seaLevelM ? 'No Terrain is at or below Sea Level; Water changes have no visible effect.'
    : 'Water presentation previews immediately; it does not change ground heights or physics.';
  function editNumber(key: 'resolution' | 'saturation', value: string) {
    if (key === 'resolution') setResolution(value);
    else setSaturation(value);
    if (!value.trim()) return;
    try {
      const next = parseTerrainStyle({ ...style, [key]: Number(value) });
      updateStyle({ [key]: next[key] });
    } catch { /* Keep the invalid entry and last valid preview until corrected. */ }
  }
  function updateStyle(patch: Partial<typeof style>) {
    onChange({ ...definition, appearance: { ...definition.appearance, style: { ...style, ...patch } } });
  }
  return <fieldset disabled={disabled} className="space-y-1">
    <label className="block"><TerrainHelp content="Surface changes the visual presentation immediately; underlying heights and collision stay unchanged."><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Surface</span></TerrainHelp><select className="h-7 w-full rounded border bg-background" value={style.surface} onChange={event => updateStyle({ surface: event.target.value as typeof style.surface })}><option value="mesh">Continuous terrain</option><option value="blocks">Square blocks</option></select></label>
    <div className="grid grid-cols-2 gap-2"><label className="block"><TerrainHelp content={style.surface !== 'blocks' ? 'Squares per side: only affects Square blocks. Continuous terrain uses Columns and Rows instead.' : 'Squares per side resamples the saved heights; it does not create additional landforms.'}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Squares per side</span></TerrainHelp><Input type="number" min="20" max="500" step="1" aria-invalid={resolutionInvalid} value={resolution} onChange={event => editNumber('resolution', event.target.value)} /></label>

    <label className="block"><TerrainHelp content={style.display === 'height' ? 'Saturation has no effect in Height map; select Terrain colors.' : 'Saturation previews immediately; neutral gray/white colors remain neutral.'}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Saturation</span></TerrainHelp><Input type="number" min="0" max="2" step="0.05" aria-invalid={saturationInvalid} value={saturation} onChange={event => editNumber('saturation', event.target.value)} /></label></div>
    {resolutionInvalid && <p role="alert" className="text-destructive">Squares per side: enter a whole number from 20 to 500. Preview unchanged.</p>}
    {saturationInvalid && <p role="alert" className="text-destructive">Saturation: enter 0 to 2. Preview unchanged.</p>}
    <label className="block"><TerrainHelp content="Height map overrides colors, saturation and Water presentation. Terrain colors restores them."><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Display</span></TerrainHelp><select className="h-7 w-full rounded border bg-background" value={style.display} onChange={event => updateStyle({ display: event.target.value as typeof style.display })}><option value="color">Terrain colors</option><option value="height">Height map</option></select></label>
    <label className="flex gap-2"><input type="checkbox" checked={style.flatWater} onChange={event => updateStyle({ flatWater: event.target.checked })} /><TerrainHelp content={waterFeedback}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Flat water surface</span></TerrainHelp></label>
    <label className="flex gap-2"><input type="checkbox" checked={style.depthColor} onChange={event => updateStyle({ depthColor: event.target.checked })} /><TerrainHelp content={style.surface === 'mesh' && style.flatWater && style.display === 'color' ? 'Water depth coloring affects the underlying terrain, but the flat Water plane covers it. Disable Flat water surface to see it.' : waterFeedback}><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Water depth coloring</span></TerrainHelp></label>

    <label className="block"><TerrainHelp content="Preview lighting affects the Admin preview only; it does not change saved geometry or Project lighting."><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Preview lighting</span></TerrainHelp><select className="h-7 w-full rounded border bg-background" value={style.lighting} onChange={event => updateStyle({ lighting: event.target.value as typeof style.lighting })}><option value="standard">Standard</option><option value="warm">Warm shadows</option></select></label>
    <label className="flex items-center justify-between"><TerrainHelp content="Preview background affects the empty Canvas around the Terrain; zoom out if the Terrain fills the view."><span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline focus-visible:outline-1">Preview background</span></TerrainHelp><Input type="color" value={style.background} onChange={event => updateStyle({ background: event.target.value })} /></label>
  </fieldset>;
}
