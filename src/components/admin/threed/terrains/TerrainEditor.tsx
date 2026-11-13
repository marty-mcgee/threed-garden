'use client';

import { useEffect, useId, useReducer, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Mountain, Plus, Save } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateTerrainDefinition, maxTerrainOperations, parseTerrainDefinition, updateTerrainAuthoring, type TerrainDefinition, type TerrainDrawing } from '@/libraries/services/threed/terrains/terrain-core';
import { TerrainCanvas } from './TerrainCanvas';

interface Props {
  recordId?: number;
}

const root = '/admin/threed/terrains';
const historyLimit = 30;

interface TerrainHistory {
  past: TerrainDefinition[];
  present: TerrainDefinition;
  future: TerrainDefinition[];
}

type TerrainHistoryAction =
  | { type: 'load'; definition: TerrainDefinition }
  | { type: 'commit'; definition: TerrainDefinition }
  | { type: 'undo' }
  | { type: 'redo' };

function terrainHistoryReducer(state: TerrainHistory, action: TerrainHistoryAction): TerrainHistory {
  if (action.type === 'load') return { past: [], present: action.definition, future: [] };
  if (action.type === 'commit') {
    if (action.definition === state.present) return state;
    return {
      past: [...state.past, state.present].slice(-historyLimit),
      present: action.definition,
      future: [],
    };
  }
  if (action.type === 'undo') {
    if (state.past.length === 0) return state;
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future].slice(0, historyLimit),
    };
  }
  if (state.future.length === 0) return state;
  return {
    past: [...state.past, state.present].slice(-historyLimit),
    present: state.future[0],
    future: state.future.slice(1),
  };
}

function TerrainEditorPanel({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return <section aria-label={label} className="admin-editor-panel rounded-lg border px-2 py-1.5">
    <h2><Button type="button" variant="ghost" className="h-6 w-full justify-start gap-1 p-0 text-left text-xs font-semibold hover:bg-transparent has-[>svg]:px-0" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(value => !value)}><ChevronRight className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />{title}</Button></h2>
    <div id={contentId} hidden={!open} className="space-y-2 pt-1">{children}</div>
  </section>;
}

export function TerrainEditor({ recordId }: Props) {
  const router = useRouter();
  const [name, setName] = useState('New Terrain');
  const [history, dispatchHistory] = useReducer(terrainHistoryReducer, undefined, () => ({
    past: [],
    present: generateTerrainDefinition(1),
    future: [],
  }));
  const definition = history.present;
  const [revision, setRevision] = useState<number | null>(null);
  const [savedDefinition, setSavedDefinition] = useState<TerrainDefinition | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [recoveryChanged, setRecoveryChanged] = useState(false);
  const [seed, setSeed] = useState('1');
  const [reliefM, setReliefM] = useState('2');
  const [hillSize, setHillSize] = useState('1');
  const [detailPercent, setDetailPercent] = useState('35');
  const [width, setWidth] = useState('40');
  const [length, setLength] = useState('40');
  const [columns, setColumns] = useState('33');
  const [rows, setRows] = useState('33');
  const [brushMode, setBrushMode] = useState<'inspect' | 'raise' | 'lower' | 'straight' | 'freeform'>('inspect');
  const [brushRadius, setBrushRadius] = useState('4');
  const [brushStrength, setBrushStrength] = useState('0.5');
  const [brushFeather, setBrushFeather] = useState('50');
  const [pathStartHeight, setPathStartHeight] = useState('2');
  const [pathEndHeight, setPathEndHeight] = useState('2');
  const [fillArea, setFillArea] = useState(false);
  const [drawnPath, setDrawnPath] = useState<{ xM: number; zM: number; yM: number }[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
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
        if (controller.signal.aborted) return;
        setName(result.data.name);
        setRevision(latest.revision);
        setWidth(String(latest.widthM));
        setLength(String(latest.lengthM));
        setColumns(String(latest.columns));
        setRows(String(latest.rows));
        let saved: TerrainDefinition;
        try {
          saved = parseTerrainDefinition({
            formatVersion: latest.formatVersion,
            widthM: latest.widthM,
            lengthM: latest.lengthM,
            columns: latest.columns,
            rows: latest.rows,
            heightsM: latest.heightsM,
            appearance: latest.appearance,
          });
        } catch (cause) {
          setRecoveryRequired(true);
          setRecoveryChanged(false);
          throw new Error(`Saved Terrain revision ${latest.revision} cannot be opened: ${cause instanceof Error ? cause.message : 'invalid data'}. The saved revision is retained. Generate a valid height grid, then Save Changes to create a new revision, or retry opening it.`);
        }
        dispatchHistory({ type: 'load', definition: saved });
        restoreGeneration(saved);
        setSavedDefinition(saved);
        setSavedName(result.data.name);
        setRecoveryRequired(false);
        setRecoveryChanged(false);
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
  }, [recordId, loadAttempt]);

  function restoreGeneration(value: TerrainDefinition) {
    const recipe = value.appearance.generation;
    setSeed(String(recipe?.seed ?? 1));
    setReliefM(String(recipe?.reliefM ?? 2));
    setHillSize(String(recipe?.hillSize ?? 1));
    setDetailPercent(String((recipe?.detail ?? 0.35) * 100));
  }

  function commitDefinition(next: TerrainDefinition) {
    dispatchHistory({ type: 'commit', definition: next });
    if (recoveryRequired) setRecoveryChanged(true);
  }

  function stepHistory(direction: 'undo' | 'redo') {
    const next = direction === 'undo' ? history.past.at(-1) : history.future[0];
    if (!next || busy || loading) return;
    dispatchHistory({ type: direction });
    const drawing = next.appearance.authoring?.operations.find(operation => operation.type === 'path' && operation.drawing.id === selectedDrawingId);
    if (drawing?.type === 'path') {
      selectDrawing(drawing.drawing);
    } else {
      setSelectedDrawingId(null);
      setDrawnPath([]);
    }
    restoreGeneration(next);
    setWidth(String(next.widthM));
    setLength(String(next.lengthM));
    setColumns(String(next.columns));
    setRows(String(next.rows));
    setError('');
    setMessage(direction === 'undo' ? 'Terrain edit undone. Save Changes to retain this state.' : 'Terrain edit redone. Save Changes to retain this state.');
  }

  function generate() {
    setError('');
    setMessage('');
    try {
      if (generationError) throw new Error(generationError);
      const requestedSeed = Number(seed);
      const next = generateTerrainDefinition(requestedSeed, Number(width), Number(length), Number(columns), Number(rows), {
        reliefM: Number(reliefM),
        hillSize: Number(hillSize),
        detail: Number(detailPercent) / 100,
      });
      const base = { ...next, appearance: { ...next.appearance, color: definition.appearance.color } };
      const operations = definition.appearance.authoring?.operations ?? [];
      const generated = operations.length > 0 ? updateTerrainAuthoring(base, operations) : base;
      if (generated.widthM === definition.widthM
        && generated.lengthM === definition.lengthM
        && generated.columns === definition.columns
        && generated.rows === definition.rows
        && JSON.stringify(generated.appearance.generation) === JSON.stringify(definition.appearance.generation)
        && generated.heightsM.every((height, index) => height === definition.heightsM[index])) {
        setMessage('These settings already produce the current Terrain. Change a control to create a variation.');
        return;
      }
      commitDefinition(generated);
      setMessage(operations.length > 0
        ? 'Height grid generated. Existing sculpting and drawings were retained. Save Changes to retain this revision.'
        : 'Height grid generated. Save Changes to retain this revision.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate Terrain.');
    }
  }

  function sculpt(xM: number, zM: number) {
    try {
      const radius = Number(brushRadius);
      const strength = Number(brushStrength);
      if (!Number.isFinite(radius) || radius <= 0 || radius > 1000) throw new Error('Brush radius must be between 0 and 1000 metres.');
      if (!Number.isFinite(strength) || strength <= 0 || strength > 100) throw new Error('Brush height must be between 0 and 100 metres.');
      const operations = definition.appearance.authoring?.operations ?? [];
      commitDefinition(updateTerrainAuthoring(definition, [...operations, { type: 'brush', stroke: { xM, zM, radiusM: radius, changeM: brushMode === 'raise' ? strength : -strength } }]));
      setError('');
      setMessage('Terrain sculpted. Save Changes to create a new revision.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sculpt Terrain.');
    }
  }

  function changeBrushMode(mode: typeof brushMode) {
    setBrushMode(mode);
  }

  function applyPath() {
    try {
      const radius = Number(brushRadius);
      const feather = Number(brushFeather) / 100;
      const startHeight = Number(pathStartHeight);
      const endHeight = brushMode === 'freeform' && fillArea ? startHeight : Number(pathEndHeight);
      const drawing: TerrainDrawing = {
        id: selectedDrawingId ?? crypto.randomUUID(),
        mode: brushMode === 'straight' ? 'straight' : 'freeform',
        points: drawnPath.map(point => ({ xM: point.xM, zM: point.zM })),
        radiusM: radius,
        startHeightM: startHeight,
        endHeightM: endHeight,
        feather,
        hidden: false,
        ...(brushMode === 'freeform' && fillArea ? { fillArea: true } : {}),
      };
      const operations = definition.appearance.authoring?.operations ?? [];
      const existing = operations.findIndex(operation => operation.type === 'path' && operation.drawing.id === selectedDrawingId);
      const updated = [...operations];
      if (existing >= 0) updated[existing] = { type: 'path', drawing };
      else updated.push({ type: 'path', drawing });
      const next = updateTerrainAuthoring(definition, updated);
      commitDefinition(next);
      setSelectedDrawingId(drawing.id);
      setError('');
      setMessage('Terrain drawing applied. It remains editable; Save Changes to retain it in the next revision.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not shape Terrain path.');
    }
  }

  function selectDrawing(drawing: TerrainDrawing) {
    setSelectedDrawingId(drawing.id);
    setFillArea(drawing.fillArea ?? false);
    setBrushMode(drawing.mode);
    setDrawnPath(drawing.points.map(point => ({ ...point, yM: 0 })));
    setBrushRadius(String(drawing.radiusM));
    setPathStartHeight(String(drawing.startHeightM));
    setPathEndHeight(String(drawing.endHeightM));
    setBrushFeather(String(drawing.feather * 100));
  }

  function moveDrawingPoint(id: string, index: number, xM: number, zM: number) {
    try {
      const operations = definition.appearance.authoring?.operations ?? [];
      const original = operations.find(operation => operation.type === 'path' && operation.drawing.id === id);
      if (original?.type !== 'path' || !original.drawing.points[index]) return;
      if (original.drawing.points[index].xM === xM && original.drawing.points[index].zM === zM) return;
      const updated = operations.map(operation => {
        if (operation.type !== 'path' || operation.drawing.id !== id) return operation;
        return {
          type: 'path' as const,
          drawing: {
            ...operation.drawing,
            points: operation.drawing.points.map((point, pointIndex) => pointIndex === index ? { xM, zM } : point),
          },
        };
      });
      commitDefinition(updateTerrainAuthoring(definition, updated));
      setDrawnPath(current => current.map((point, pointIndex) => pointIndex === index ? { ...point, xM, zM } : point));
      setMessage('Drawing reshaped. Save Changes to retain the new elevation.');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reshape Terrain drawing.');
    }
  }

  function changeDrawing(id: string, action: 'hide' | 'delete') {
    const operations = definition.appearance.authoring?.operations ?? [];
    const updated = action === 'delete'
      ? operations.filter(operation => operation.type !== 'path' || operation.drawing.id !== id)
      : operations.map(operation => operation.type === 'path' && operation.drawing.id === id
        ? { type: 'path' as const, drawing: { ...operation.drawing, hidden: !operation.drawing.hidden } }
        : operation);
    try {
      commitDefinition(updateTerrainAuthoring(definition, updated));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change Terrain drawing.');
      return;
    }
    if (action === 'delete' && selectedDrawingId === id) {
      setSelectedDrawingId(null);
      setDrawnPath([]);
    }
    if (action === 'hide' && selectedDrawingId === id) {
      setSelectedDrawingId(null);
      setDrawnPath([]);
    }
    setMessage(action === 'delete' ? 'Drawing removed. Save Changes to retain the change.' : 'Drawing visibility changed. Save Changes to retain it.');
  }

  async function save() {
    if (saveDisabled) return;
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
      setSavedDefinition(definition);
      setSavedName(name);
      setRecoveryRequired(false);
      setRecoveryChanged(false);
      setMessage(`Terrain saved as revision ${result.data.revision}.`);
      if (!recordId) router.replace(`${root}/${result.data.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save Terrain. Your draft is retained.');
    } finally {
      setBusy(false);
    }
  }

  const generationError = [seed, reliefM, hillSize, detailPercent, width, length, columns, rows].some(value => !value.trim() || !Number.isFinite(Number(value)))
    ? 'Complete all generation fields with finite numbers.'
    : !Number.isInteger(Number(columns)) || !Number.isInteger(Number(rows)) || Number(columns) < 2 || Number(columns) > 129 || Number(rows) < 2 || Number(rows) > 129
      ? 'Columns and Rows must be whole numbers from 2 to 129. The applied Terrain is unchanged.'
      : !Number.isSafeInteger(Number(seed)) ? 'Seed must be a safe whole number.'
      : Number(width) < 0.01 || Number(width) > 1000 || Number(length) < 0.01 || Number(length) > 1000 ? 'Width and Length must be between 0.01 and 1000 metres.'
      : Number(reliefM) < 0 || Number(reliefM) > 20 || Number(hillSize) < 0.5 || Number(hillSize) > 4 || Number(detailPercent) < 0 || Number(detailPercent) > 100 ? 'Use relief 0?20 m, hill size 0.5?4 and detail 0?100%.'
      : '';
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
  const hasChanges = !recordId || name !== savedName || definition !== savedDefinition;
  const saveDisabled = busy || loading || Boolean(recordId && revision === null) || (recoveryRequired && !recoveryChanged) || !hasChanges;
  const recordUnavailable = Boolean(recordId && !loading && revision === null);

  return <main className="flex h-full min-h-0 min-w-0 flex-col gap-2 text-xs">
    <AdminWorkspaceHeader icon={Mountain} title={recordId ? 'Edit Terrain' : 'Add Terrain'} description="Create and revise a reusable ThreeD Terrain" showModuleAlbums={false} className="shrink-0">
      <ModelFieldHelp label="Terrain editor">Generate a height grid, then use Raise or Lower, or draw a straight or freeform path and apply an elevation. Save Changes creates a new revision. Projects keep their selected revision until changed in the Project.</ModelFieldHelp>
      <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">{revision ? `Revision ${revision}` : recordId ? loading ? 'Opening…' : 'Unavailable' : 'Local draft'}</span>
      {!recordUnavailable && (error || message) && <p role={error ? "alert" : "status"} className={`min-w-0 flex-1 ${error ? "text-destructive" : "text-emerald-500"}`}>{error || message}</p>}
      <div className="ml-auto flex flex-wrap gap-1">
        <AdminWorkspaceLink href={root} icon={Mountain}>All Terrains</AdminWorkspaceLink>
        {recordId && <AdminWorkspaceLink href={`${root}/new`} icon={Plus}>New Terrain</AdminWorkspaceLink>}
      </div>
    </AdminWorkspaceHeader>
    {loading ? <p role="status">Opening Terrain…</p> : recordUnavailable ? <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <p>{error === 'Terrain not found' ? 'This Terrain record does not exist, or is not available for edit by this User.' : error || 'This Terrain could not be opened.'}</p>
      <Link className="font-medium underline underline-offset-2" href={root}>Back to All Terrains</Link>
      <Button type="button" size="xs" variant="outline" disabled={busy} onClick={() => setLoadAttempt(value => value + 1)}>Retry opening Terrain</Button>
    </div> : <div className="grid min-h-0 min-w-0 flex-1 gap-2 overflow-y-auto lg:overflow-hidden lg:grid-cols-[minmax(0,1fr)_16rem] [&_input]:h-7 [&_input]:px-2 [&_input]:text-xs">
      <TerrainCanvas fillArea={brushMode === 'freeform' && fillArea} definition={definition} brushMode={brushMode} onBrushModeChange={changeBrushMode} onSculpt={sculpt} drawnPath={drawnPath} onDrawnPathChange={setDrawnPath} selectedDrawingId={selectedDrawingId} onDrawingStart={() => setSelectedDrawingId(null)} onSelectDrawing={id => { const operation = definition.appearance.authoring?.operations.find(item => item.type === 'path' && item.drawing.id === id); if (operation?.type === 'path') selectDrawing(operation.drawing); }} onMoveDrawingPoint={moveDrawingPoint} onUndo={() => stepHistory('undo')} undoDisabled={busy || loading || history.past.length === 0} onRedo={() => stepHistory('redo')} redoDisabled={busy || loading || history.future.length === 0} onSave={() => void save()} saveDisabled={saveDisabled} disabled={busy} />
      <div aria-label="Terrain controls" className="min-h-0 min-w-0 space-y-2 lg:overflow-y-auto">
        <section aria-label="Terrain details" className="admin-editor-panel rounded-lg border px-2 py-1.5">
          <label className="block">Terrain name<Input value={name} maxLength={255} onChange={event => setName(event.target.value)} /></label>
        </section>
        <TerrainEditorPanel label="Height grid" title="Generate height grid">
          <div className="grid grid-cols-2 gap-1.5">
            <label>Seed<Input type="number" step="1" value={seed} onChange={event => setSeed(event.target.value)} /></label>
            <label>Relief height (m)<Input type="number" min="0" max="20" step="0.1" value={reliefM} onChange={event => setReliefM(event.target.value)} /></label>
            <label>Hill size<Input type="number" min="0.5" max="4" step="0.1" value={hillSize} onChange={event => setHillSize(event.target.value)} /></label>
            <label>Surface detail (%)<Input type="number" min="0" max="100" step="5" value={detailPercent} onChange={event => setDetailPercent(event.target.value)} /></label>
            <label>Width (m)<Input type="number" min="0.01" max="1000" step="0.1" value={width} onChange={event => setWidth(event.target.value)} /></label>
            <label>Length (m)<Input type="number" min="0.01" max="1000" step="0.1" value={length} onChange={event => setLength(event.target.value)} /></label>
            <label>Columns<Input type="number" min="2" max="129" step="1" value={columns} onChange={event => setColumns(event.target.value)} /></label>
            <label>Rows<Input type="number" min="2" max="129" step="1" value={rows} onChange={event => setRows(event.target.value)} /></label>
            <label>Surface color<Input type="color" value={definition.appearance.color} onChange={event => {
              if (event.target.value !== definition.appearance.color) commitDefinition({ ...definition, appearance: { ...definition.appearance, color: event.target.value } });
            }} /></label>
          </div>
          <Button type="button" size="xs" variant="outline" onClick={generate} disabled={busy || Boolean(generationError)}>Generate</Button>
          {generationError && <p role="alert" className="text-destructive">{generationError}</p>}
          <p className="text-muted-foreground">Generation fields apply only when you click Generate. The same Seed and settings produce the same base. Change relief, hill size, detail, or Seed to make a variation. Existing sculpting and drawings remain.</p>
        </TerrainEditorPanel>
        <TerrainEditorPanel label="Sculpt brush" title="Sculpt brush">
          <div className="grid grid-cols-2 gap-1.5">
            <label>Radius (m)<Input type="number" min="0.01" max="1000" step="0.1" value={brushRadius} onChange={event => setBrushRadius(event.target.value)} /></label>
            {(brushMode === 'raise' || brushMode === 'lower') && <label>Height per click (m)<Input type="number" min="0.01" max="100" step="0.1" value={brushStrength} onChange={event => setBrushStrength(event.target.value)} /></label>}
            {(brushMode === 'straight' || brushMode === 'freeform') && <>
              <label>Start elevation (m)<Input type="number" min="-1000" max="1000" step="0.1" value={pathStartHeight} onChange={event => setPathStartHeight(event.target.value)} /></label>
              <label>End elevation (m)<Input type="number" min="-1000" max="1000" step="0.1" disabled={brushMode === 'freeform' && fillArea} value={brushMode === 'freeform' && fillArea ? pathStartHeight : pathEndHeight} onChange={event => setPathEndHeight(event.target.value)} /></label>
              <label>Edge feather (%)<Input type="number" min="0" max="100" step="5" value={brushFeather} onChange={event => setBrushFeather(event.target.value)} /></label>
            </>}
          </div>
          {(brushMode === 'straight' || brushMode === 'freeform') && <>
            {brushMode === 'freeform' && <label className="flex items-center gap-2"><input type="checkbox" checked={fillArea} onChange={event => setFillArea(event.target.checked)} />Fill enclosed area as a plateau</label>}
            <p className="text-muted-foreground">Filled plateaus close the freeform outline and use Start elevation throughout the interior. Drag on the Terrain to draw. Drag a saved path's point handles to reshape it. Equal start/end elevations make a plateau; different elevations make a slope. Radius controls width.</p>
            <div className="flex gap-1">
              <Button type="button" size="xs" variant="success" disabled={busy || drawnPath.length < 2} onClick={applyPath}>Apply elevation</Button>
              <Button type="button" size="xs" variant="outline" disabled={drawnPath.length === 0} onClick={() => { setDrawnPath([]); setSelectedDrawingId(null); }}>Clear draft</Button>
            </div>
          </>}
          <p className="text-muted-foreground">{definition.widthM} × {definition.lengthM} m · {definition.columns} × {definition.rows} grid · {definition.appearance.authoring?.operations.length ?? 0}/{maxTerrainOperations} shaping operations</p>
        </TerrainEditorPanel>
        <TerrainEditorPanel label="Terrain drawings" title="Terrain drawings">
          {(definition.appearance.authoring?.operations.filter(operation => operation.type === 'path') ?? []).map(operation => {
            if (operation.type !== 'path') return null;
            const drawing = operation.drawing;
            return <div key={drawing.id} className="flex items-center gap-1 rounded border p-1">
              <Button type="button" size="xs" variant={selectedDrawingId === drawing.id ? 'secondary' : 'ghost'} onClick={() => selectDrawing(drawing)}>{drawing.fillArea ? 'Plateau' : drawing.mode === 'straight' ? 'Straight' : 'Freeform'} · {drawing.startHeightM}–{drawing.endHeightM} m</Button>
              <Button type="button" size="xs" variant="outline" onClick={() => changeDrawing(drawing.id, 'hide')}>{drawing.hidden ? 'Show' : 'Hide'}</Button>
              <Button type="button" size="xs" variant="outline" onClick={() => changeDrawing(drawing.id, 'delete')}>Delete</Button>
            </div>;
          })}
          {!definition.appearance.authoring?.operations.some(operation => operation.type === 'path') && <p className="text-muted-foreground">Draw and apply a path to keep it here.</p>}
        </TerrainEditorPanel>
        <TerrainEditorPanel label="2D height map" title="2D height map">
          <p className="text-muted-foreground">Height range: {Math.min(...definition.heightsM).toFixed(2)} to {Math.max(...definition.heightsM).toFixed(2)} m. Colors emphasize relative heights; the 3D preview uses actual scale.</p>
          <svg role="img" aria-label="Top view of Terrain heights" viewBox={`0 0 ${sampleColumns} ${sampleRows}`} preserveAspectRatio="none" className="h-44 w-full rounded-md border">{preview}</svg>
        </TerrainEditorPanel>
      </div>
    </div>}
    {!recordUnavailable && <footer aria-label="Terrain actions" className="admin-editor-actions shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-50 p-2 dark:bg-emerald-950/50 [&_button]:h-8 [&_button]:text-xs">
      <Button variant="success" size="sm" disabled={saveDisabled} onClick={() => void save()}><Save className="size-4" />{busy ? 'Saving…' : 'Save Changes'}</Button>
    </footer>}
  </main>;
}
