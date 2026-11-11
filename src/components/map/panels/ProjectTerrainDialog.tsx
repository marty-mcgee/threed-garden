'use client';

import { useEffect, useState } from 'react';
import { generateTerrainDefinition, parseTerrainDefinition, type ProjectTerrainSurface, type TerrainDefinition } from '@/libraries/services/threed/terrains/terrain-core';

interface TerrainListItem {
  id: number;
  name: string;
  revision: number;
}

interface Props {
  open: boolean;
  projectId: number;
  modules: Array<{ id: number; name: string }>;
  surface: ProjectTerrainSurface | null;
  onChange: (surface: ProjectTerrainSurface | null) => void;
  onClose: () => void;
}

export function ProjectTerrainDialog({ open, projectId, modules, surface, onChange, onClose }: Props) {
  const [items, setItems] = useState<TerrainListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<TerrainDefinition | null>(null);
  const [name, setName] = useState('New Terrain');
  const [seed, setSeed] = useState(1);
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setModuleId(surface?.placement.threedId ?? modules[0]?.id ?? 0);
    setSelectedId(surface?.placement.terrainId ?? null);
    setSelectedRevision(surface?.placement.terrainRevision ?? null);
    setSelectedDefinition(surface?.definition ?? null);
    setError('');
    void fetch('/api/threed/terrains', { cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Terrains.');
        if (active) setItems(result.data);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load Terrains.'); });
    return () => { active = false; };
  }, [open, projectId, modules, surface]);

  if (!open) return null;
  const preview = selectedDefinition ?? generateTerrainDefinition(seed);
  const samples = preview.heightsM;
  const highest = Math.max(1, ...samples.map(Math.abs));
  const previewCells = samples.map((height, index) => {
    const hue = height >= 0 ? 103 : 40;
    const lightness = Math.round(42 + height / highest * 18);
    return <rect key={index} x={index % preview.columns} y={Math.floor(index / preview.columns)} width="1" height="1" fill={`hsl(${hue} 38% ${lightness}%)`} />;
  });

  async function selectSaved(id: number) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/threed/terrains?id=${id}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load Terrain.');
      const latest = result.data.revisions[0];
      if (!latest) throw new Error('Terrain has no saved revision.');
      setSelectedId(id);
      setSelectedRevision(latest.revision);
      setSelectedDefinition(parseTerrainDefinition({
        formatVersion: latest.formatVersion,
        widthM: latest.widthM,
        lengthM: latest.lengthM,
        columns: latest.columns,
        rows: latest.rows,
        heightsM: latest.heightsM,
        appearance: latest.appearance,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Terrain.');
    } finally {
      setBusy(false);
    }
  }

  async function attach() {
    if (!moduleId) return;
    setBusy(true);
    setError('');
    try {
      let id = selectedId;
      let revision = selectedRevision ?? items.find(item => item.id === id)?.revision ?? 1;
      let definition = selectedDefinition;
      let terrainName = items.find(item => item.id === id)?.name ?? name.trim();
      if (id === null) {
        definition = generateTerrainDefinition(seed);
        const response = await fetch('/api/threed/terrains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: terrainName, definition }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not save Terrain.');
        id = result.data.id;
        revision = result.data.revision;
        setSelectedId(id);
        setSelectedRevision(revision);
        setSelectedDefinition(definition);
        setItems(current => [{ id: id!, revision, name: terrainName }, ...current]);
      }
      if (!definition) throw new Error('Select a saved Terrain first.');
      const check = await fetch(`/api/project/assets?projectId=${projectId}&moduleId=${moduleId}&assetType=threed_terrains&assetId=${id}&checkAssignment=true`, { cache: 'no-store' });
      const assignment = await check.json();
      if (!check.ok || !assignment.success) throw new Error(assignment.error || 'Could not check Terrain assignment.');
      if (!assignment.assigned) {
        const response = await fetch('/api/project/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, moduleId, moduleType: 'threed', assetType: 'threed_terrains', assetId: id }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not assign Terrain to this Project.');
      }
      onChange({
        name: terrainName,
        definition,
        placement: {
          id: surface?.placement.id ?? null,
          threedId: moduleId,
          terrainId: id!,
          terrainRevision: revision,
          centerXM: surface?.placement.centerXM ?? 0,
          centerZM: surface?.placement.centerZM ?? 0,
          rotationYDeg: surface?.placement.rotationYDeg ?? 0,
          scale: surface?.placement.scale ?? 1,
        },
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not attach Terrain.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/70 p-3" role="dialog" aria-modal="true" aria-label="Project Terrain">
    <div className="threed-workspace-panel w-full max-w-2xl space-y-3 rounded-lg border bg-background p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Project Terrain</h2>
        <button type="button" onClick={onClose} aria-label="Close Terrain" className="rounded border px-2 py-1">Close</button>
      </div>
      <p className="text-xs text-muted-foreground">Choose a reusable Terrain or generate a smooth one. Assign it here, then Save Project to keep its placement.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2">
          <label className="block text-xs">Saved Terrain
            <select className="mt-1 w-full rounded border bg-background p-2" value={selectedId ?? ''} onChange={event => {
              const id = Number(event.target.value);
              if (id) void selectSaved(id);
              else { setSelectedId(null); setSelectedRevision(null); setSelectedDefinition(null); }
            }}>
              <option value="">Generate new Terrain</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name} · revision {item.revision}</option>)}
            </select>
          </label>
          {selectedId === null && <div className="grid grid-cols-[1fr_90px] gap-2">
            <label className="text-xs">Name<input className="mt-1 w-full rounded border bg-background p-2" value={name} maxLength={255} onChange={event => setName(event.target.value)} /></label>
            <label className="text-xs">Seed<input className="mt-1 w-full rounded border bg-background p-2" type="number" step="1" value={seed} onChange={event => {
              const value = Number(event.target.value);
              if (Number.isSafeInteger(value)) setSeed(value);
            }} /></label>
          </div>}
          <label className="block text-xs">ThreeD Module
            <select className="mt-1 w-full rounded border bg-background p-2" value={moduleId} onChange={event => setModuleId(Number(event.target.value))}>
              {modules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}
            </select>
          </label>
        </div>
        <svg viewBox={`0 0 ${preview.columns} ${preview.rows}`} className="aspect-square w-full rounded border" aria-label="Terrain height preview">{previewCells}</svg>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded bg-green-700 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy || !moduleId || (selectedId === null && !name.trim())} onClick={() => void attach()}>{busy ? 'Working…' : 'Use in Project'}</button>
        {surface && <button type="button" className="rounded border px-3 py-2 text-sm" disabled={busy} onClick={() => { onChange(null); onClose(); }}>Remove active Terrain</button>}
      </div>
    </div>
  </div>;
}
