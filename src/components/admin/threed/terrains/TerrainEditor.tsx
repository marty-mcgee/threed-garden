'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mountain, Save } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateTerrainDefinition, parseTerrainDefinition, type TerrainDefinition } from '@/libraries/services/threed/terrains/terrain-core';

interface Props {
  recordId?: number;
}

const root = '/admin/threed/terrains';

export function TerrainEditor({ recordId }: Props) {
  const router = useRouter();
  const [name, setName] = useState('New Terrain');
  const [definition, setDefinition] = useState<TerrainDefinition>(() => generateTerrainDefinition(1));
  const [revision, setRevision] = useState<number | null>(null);
  const [seed, setSeed] = useState('1');
  const [width, setWidth] = useState('40');
  const [length, setLength] = useState('40');
  const [columns, setColumns] = useState('33');
  const [rows, setRows] = useState('33');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(recordId));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!recordId) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(`/api/threed/terrains?id=${recordId}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not open Terrain.');
        const latest = result.data.revisions?.[0];
        if (!latest) throw new Error('Terrain has no saved revision.');
        const saved = parseTerrainDefinition({
          formatVersion: latest.formatVersion,
          widthM: latest.widthM,
          lengthM: latest.lengthM,
          columns: latest.columns,
          rows: latest.rows,
          heightsM: latest.heightsM,
          appearance: latest.appearance,
        });
        if (controller.signal.aborted) return;
        setName(result.data.name);
        setRevision(latest.revision);
        setDefinition(saved);
        setWidth(String(saved.widthM));
        setLength(String(saved.lengthM));
        setColumns(String(saved.columns));
        setRows(String(saved.rows));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not open Terrain.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [recordId]);

  function generate() {
    setError('');
    setMessage('');
    try {
      const next = generateTerrainDefinition(Number(seed), Number(width), Number(length), Number(columns), Number(rows));
      setDefinition({ ...next, appearance: definition.appearance });
      setMessage('Height grid generated. Save Changes to retain this revision.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate Terrain.');
    }
  }

  async function save() {
    if (busy || loading || (recordId && revision === null)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/threed/terrains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          definition,
          ...(recordId ? { terrainId: recordId, expectedRevision: revision } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not save Terrain.');
      setRevision(result.data.revision);
      setMessage(`Terrain saved as revision ${result.data.revision}.`);
      if (!recordId) router.replace(`${root}/${result.data.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save Terrain. Your draft is retained.');
    } finally {
      setBusy(false);
    }
  }

  const sampleColumns = Math.min(definition.columns, 65);
  const sampleRows = Math.min(definition.rows, 65);
  const peak = Math.max(1, ...definition.heightsM.map(Math.abs));
  const preview = Array.from({ length: sampleRows * sampleColumns }, (_, index) => {
    const col = Math.round((index % sampleColumns) * (definition.columns - 1) / (sampleColumns - 1));
    const row = Math.round(Math.floor(index / sampleColumns) * (definition.rows - 1) / (sampleRows - 1));
    const height = definition.heightsM[row * definition.columns + col];
    const lightness = Math.round(43 + height / peak * 18);
    return <rect key={index} x={index % sampleColumns} y={Math.floor(index / sampleColumns)} width="1" height="1" fill={`hsl(${height >= 0 ? 105 : 40} 38% ${lightness}%)`} />;
  });

  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 text-xs">
    <AdminWorkspaceHeader icon={Mountain} title={recordId ? 'Edit Terrain' : 'Add Terrain'} description="Create and revise a reusable ThreeD Terrain" showModuleAlbums={false}>
      {revision && <span className="rounded bg-muted px-2">Revision {revision}</span>}
      <div className="ml-auto"><AdminWorkspaceLink href={root} icon={Mountain}>All Terrains</AdminWorkspaceLink></div>
    </AdminWorkspaceHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {message && <p role="status" className="text-emerald-500">{message}</p>}
    {loading ? <p role="status">Opening Terrain…</p> : <div className="grid min-h-0 gap-3 overflow-auto lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <section className="space-y-3 rounded-md border p-3">
        <label className="block space-y-1">Terrain name<Input value={name} maxLength={255} onChange={event => setName(event.target.value)} /></label>
        <p className="font-semibold">Generate height grid</p>
        <p className="text-muted-foreground">Changing these controls does not replace the current Terrain until you select Generate.</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">Seed<Input type="number" value={seed} onChange={event => setSeed(event.target.value)} /></label>
          <label className="space-y-1">Width (metres)<Input type="number" min="0.01" max="1000" step="0.1" value={width} onChange={event => setWidth(event.target.value)} /></label>
          <label className="space-y-1">Length (metres)<Input type="number" min="0.01" max="1000" step="0.1" value={length} onChange={event => setLength(event.target.value)} /></label>
          <label className="space-y-1">Columns<Input type="number" min="2" max="129" step="1" value={columns} onChange={event => setColumns(event.target.value)} /></label>
          <label className="space-y-1">Rows<Input type="number" min="2" max="129" step="1" value={rows} onChange={event => setRows(event.target.value)} /></label>
          <label className="space-y-1">Surface color<Input type="color" value={definition.appearance.color} onChange={event => setDefinition(current => ({ ...current, appearance: { color: event.target.value } }))} /></label>
        </div>
        <Button type="button" variant="outline" onClick={generate} disabled={busy}>Generate</Button>
      </section>
      <section className="flex min-h-64 flex-col gap-2 rounded-md border p-3">
        <h2 className="font-semibold">Terrain preview</h2>
        <p className="text-muted-foreground">{definition.widthM} × {definition.lengthM} metres · {definition.columns} × {definition.rows} grid</p>
        <svg role="img" aria-label="Top view of Terrain heights" viewBox={`0 0 ${sampleColumns} ${sampleRows}`} preserveAspectRatio="none" className="min-h-64 w-full flex-1 rounded-md border">
          {preview}
        </svg>
        {recordId && <p className="text-muted-foreground">Saved Projects retain their selected Terrain revision until changed in the Project.</p>}
      </section>
    </div>}
    <div className="flex shrink-0 items-center gap-2 rounded-md border border-emerald-700/40 bg-emerald-950/30 p-2">
      <Button variant="success" disabled={busy || loading || Boolean(recordId && revision === null)} onClick={() => void save()}><Save className="size-4" />Save Changes</Button>
      <Link className="text-muted-foreground hover:underline" href={root}>Back to Terrains</Link>
    </div>
  </div>;
}
