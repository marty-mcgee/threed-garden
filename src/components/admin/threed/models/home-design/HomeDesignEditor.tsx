'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Building2, Scissors, SquareDashed, House, DoorOpen, Download, Layers, MousePointer2, Move, PanelsTopLeft, Pentagon, PencilRuler, Plus, Redo2, Trash2, Undo2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModelFieldHelp } from '../ModelFieldHelp';
import { HomeDesignPlan, type DesignTool } from './HomeDesignPlan';
import { commitDesign, designHistory, redoDesign, undoDesign } from '@/libraries/services/threed/home-design/history';
import { distance, entityLevelId, formatLength, INCH, moveNodes, newDesign, parseDesign, removeEntity, removeLevel, validateDesign, type DesignDocument, type DesignRoof, type DesignRoofOpening, type DesignOpening } from '@/libraries/services/threed/home-design/document';
const Preview = dynamic(() => import('./HomeDesignPreview').then(module => module.HomeDesignPreview), { ssr: false, loading: () => <div className="h-full min-h-0 rounded border p-4 text-xs">Loading Live 3D…</div> });

function Dimension({ label, value, onChange, positive = true }: { label: string; value: number; onChange: (value: number) => void; positive?: boolean }) {
  const [text, setText] = useState(String(Number((value / INCH).toFixed(4))));
  useEffect(() => { setText(String(Number((value / INCH).toFixed(4)))); }, [value]);
  return <label className="block space-y-1 text-xs"><span>{label} (in)</span><Input type="number" aria-label={`${label} (in)`} className="h-8" step=".25" min={positive ? 1 : undefined} value={text}
    onChange={event => { setText(event.target.value); const number = Number(event.target.value); if (event.target.value.trim() && Number.isFinite(number) && (!positive || number >= 1)) onChange(number * INCH); }}
    onBlur={() => setText(String(Number((value / INCH).toFixed(4))))} /></label>;
}

function Scalar({ label, value, onChange, max }: { label: string; value: number; onChange: (value: number) => void; max: number }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return <label className="block space-y-1 text-xs">{label}<Input type="number" aria-label={label} min={0} max={max} step=".25" value={text} onChange={event => { setText(event.target.value); if (event.target.value.trim() && Number.isFinite(Number(event.target.value))) onChange(Number(event.target.value)); }} onBlur={() => setText(String(value))} /></label>;
}

export function HomeDesignEditor() {
  const [history, setHistory] = useState(() => designHistory(newDesign()));
  const [preview, setPreview] = useState<DesignDocument | null>(null), [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<DesignTool>('select'), [gridSnap, setGridSnap] = useState(true), [cancelToken, setCancelToken] = useState(0);
  const [showRoofs, setShowRoofs] = useState(true);
  const [levelChoice, setLevelChoice] = useState('ground'), [showAllLevels, setShowAllLevels] = useState(true);
  const [message, setMessage] = useState('Choose Wall or Floor to draw. Select to move shapes or yellow corner handles. Alt-drag pans; wheel zooms. Escape cancels.'), [error, setError] = useState('');
  const [saved, setSaved] = useState(() => JSON.stringify(validateDesign(newDesign()))), [importing, setImporting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const doc = history.present, displayed = preview ?? doc, dirty = JSON.stringify(doc) !== saved;
  const activeLevelId = doc.levels.some(level => level.id === levelChoice) ? levelChoice : doc.levels[0].id;
  const level = doc.levels.find(level => level.id === activeLevelId)!;
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const importingRef = useRef(importing); importingRef.current = importing;
  const skipGuard = useRef(false);
  const previewUpdate = useCallback((value: DesignDocument | null) => setPreview(value), []);
  const commit = useCallback((value: DesignDocument) => {
    try { const valid = validateDesign(value); setHistory(state => commitDesign(state, valid)); setPreview(null); setError(''); }
    catch (error) { setError((error as Error).message); }
  }, []);
  const select = useCallback((id: string | null) => {
    const nextLevel = id ? entityLevelId(doc, id) : undefined;
    if (nextLevel && nextLevel !== activeLevelId) { setLevelChoice(nextLevel); setCancelToken(value => value + 1); setPreview(null); setTool('select'); }
    setSelected(nextLevel ? id : null);
  }, [doc, activeLevelId]);
  const cancel = useCallback(() => { setCancelToken(value => value + 1); setPreview(null); setMessage('Draft cancelled. Completed design geometry is retained.'); }, []);
  function chooseLevel(id: string) { cancel(); setLevelChoice(id); setSelected(null); setTool('select'); setMessage('Editing this level in 2D. Live 3D can show all levels or only the active level.'); }
  function addLevel() {
    let number = 2; while (doc.levels.some(level => level.name.toLowerCase() === `level ${number}`)) number++;
    const next = { id: crypto.randomUUID(), name: `Level ${number}`, elevation: Math.min(100, Math.max(...doc.levels.map(level => level.elevation)) + 108 * INCH) };
    cancel(); commit({ ...doc, levels: [...doc.levels, next] }); setLevelChoice(next.id); setSelected(null); setTool('select'); setMessage('Empty level added. Set its elevation, then draw walls and floors. Other levels are retained.');
  }
  function deleteLevel() {
    const occupied = doc.walls.some(wall => wall.levelId === activeLevelId) || doc.floors.some(floor => floor.levelId === activeLevelId) || doc.roofs.some(roof => roof.levelId === activeLevelId);
    if (occupied && !window.confirm(`Delete ${level.name} and all of its walls, floors, roofs and all hosted openings? Undo can restore them.`)) return;
    cancel(); commit(removeLevel(doc, activeLevelId)); setLevelChoice(doc.levels.find(other => other.id !== activeLevelId)!.id); setSelected(null); setTool('select'); setMessage('Level removed. Undo restores the level and its geometry together.');
  }
  function remove() {
    if (!selected) return;
    cancel(); commit(removeEntity(doc, selected)); setSelected(null);
  }
  useEffect(() => {
    const key = 'threed:home-design:guard';
    if (!window.history.state?.[key]) window.history.pushState({ ...window.history.state, [key]: true }, '', window.location.href);
    const allowed = () => !importingRef.current && (!dirtyRef.current || window.confirm('Leave without exporting your Home Design changes?'));
    const back = (event: PopStateEvent) => {
      if (skipGuard.current) return;
      event.stopImmediatePropagation(); if (event.state?.[key]) return;
      if (!allowed()) window.history.forward(); else { skipGuard.current = true; window.history.back(); }
    };
    const unload = (event: BeforeUnloadEvent) => { if (!skipGuard.current && (dirtyRef.current || importingRef.current)) { event.preventDefault(); event.returnValue = ''; } };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download') || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!allowed()) { event.preventDefault(); event.stopImmediatePropagation(); }
      else { skipGuard.current = true; event.preventDefault(); event.stopImmediatePropagation(); window.location.assign(anchor.href); }
    };
    window.addEventListener('beforeunload', unload); window.addEventListener('popstate', back, true); window.document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', back, true); window.document.removeEventListener('click', navigate, true); };
  }, []);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (importing) return;
      if (event.key === 'Escape') { event.preventDefault(); cancel(); if (tool === 'door' || tool === 'window' || tool === 'cutout' || tool === 'skylight') setTool('select'); return; }
      if ((event.target as Element)?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) { event.preventDefault(); cancel(); setHistory(event.shiftKey || event.key.toLowerCase() === 'y' ? redoDesign : undoDesign); setSelected(null); }
      else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(); }
    };
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard);
  });
  const wall = displayed.walls.find(wall => wall.id === selected), floor = displayed.floors.find(floor => floor.id === selected), opening = displayed.openings.find(o => o.id === selected);
  const roof = displayed.roofs.find(roof => roof.id === selected);
  const roofOpening = displayed.roofOpenings.find(opening => opening.id === selected);
  const keys = wall ? [wall.start, wall.end] : floor?.vertices ?? roof?.vertices ?? [];
  const updateWall = (field: 'height' | 'thickness' | 'elevation', value: number) => commit({ ...doc, walls: doc.walls.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateFloor = (field: 'thickness' | 'elevation', value: number) => commit({ ...doc, floors: doc.floors.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateRoof = <K extends keyof Pick<DesignRoof, 'kind' | 'pitch' | 'direction' | 'thickness' | 'elevation'>>(field: K, value: DesignRoof[K]) => commit({ ...doc, roofs: doc.roofs.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateRoofOpening = <K extends keyof Pick<DesignRoofOpening, 'kind' | 'along' | 'across' | 'width' | 'length'>>(field: K, value: DesignRoofOpening[K]) => commit({ ...doc, roofOpenings: doc.roofOpenings.map(item => item.id === selected ? { ...item, [field]: value } : item) });
  const updateOpening = (field: 'offset' | 'width' | 'height' | 'sill', value: number) => commit({ ...doc, openings: doc.openings.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 1024 * 1024) { setError('Design JSON must be at most 1 MiB.'); if (input.current) input.current.value = ''; return; }
    if (dirty && !window.confirm('Replace this local design? Export it first to retain a copy.')) { if (input.current) input.current.value = ''; return; }
    setImporting(true); cancel();
    try { const next = parseDesign(await file.text()); commit(next); setLevelChoice(next.levels[0].id); setSelected(null); setTool('select'); setSaved(JSON.stringify(next)); setMessage('Design imported. Continue editing; Undo restores the previous design.'); }
    catch (error) { setError((error as Error).message); }
    finally { setImporting(false); if (input.current) input.current.value = ''; }
  }
  function exportFile() {
    const text = JSON.stringify(validateDesign(doc), null, 2), url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = 'threed-home-design.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setSaved(JSON.stringify(doc)); setMessage('Editable design exported. Incomplete drawing and camera/tool state are excluded.');
  }
  return <div className="flex h-full min-h-0 flex-col gap-2 text-foreground" data-testid="home-editor">
    <header className="grid shrink-0 grid-cols-1 items-center gap-x-3 gap-y-2 border-b pb-2 sm:grid-cols-[minmax(0,1fr)_auto] min-[120rem]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"><div className="flex min-w-0 flex-wrap items-center gap-2"><Building2 className="h-5 w-5 text-cyan-400" /><h1 className="text-base font-semibold">Home Design</h1><ModelFieldHelp label="Home Design">Draw an editable 2D plan and watch the live 3D preview. This local prototype exports JSON; it does not save a Project or register a Model. Wall centers and floor corners share node IDs.</ModelFieldHelp><span className="text-xs text-muted-foreground">Milestone 4 · Local draft</span></div>
      <nav aria-label="ThreeD Design Action Tools" className="col-span-1 row-start-3 flex max-w-full flex-wrap items-center justify-center gap-1 justify-self-center rounded-lg border border-white/10 bg-[#111a28] p-1 sm:col-span-2 sm:row-start-2 min-[120rem]:col-span-1 min-[120rem]:col-start-2 min-[120rem]:row-start-1">{([{ key: 'select', title: 'Select', icon: MousePointer2 }, { key: 'wall', title: 'Wall', icon: PencilRuler }, { key: 'floor', title: 'Floor', icon: Pentagon }, { key: 'roof', title: 'Roof', icon: House }, { key: 'cutout', title: 'Roof Cutout', icon: Scissors }, { key: 'skylight', title: 'Skylight', icon: SquareDashed }, { key: 'door', title: 'Door', icon: DoorOpen }, { key: 'window', title: 'Window', icon: PanelsTopLeft }, { key: 'pan', title: 'Pan', icon: Move }] as const).map(item => <Button key={item.key} size="sm" disabled={importing} variant={tool === item.key ? 'default' : 'outline'} aria-pressed={tool === item.key} onClick={() => { cancel(); setTool(item.key); if (item.key === 'cutout' || item.key === 'skylight') { setShowRoofs(true); setMessage('Choose a host roof in the active plan. Hover to preview a 24 by 36 inch opening. Select the roof first when roofs overlap.'); } if (item.key === 'door' || item.key === 'window') setMessage(`Choose a host wall in the plan to place a ${item.title.toLowerCase()}. Hover to preview; Escape cancels.`); }}><item.icon className="mr-1 h-3 w-3" />{item.title}</Button>)}</nav>
      <div className="col-start-1 row-start-2 flex max-w-full flex-wrap justify-end gap-1 justify-self-end sm:col-start-2 sm:row-start-1 min-[120rem]:col-start-3"><Button variant="outline" size="sm" disabled={!history.past.length || importing} onClick={() => { cancel(); setHistory(undoDesign); setSelected(null); }}><Undo2 className="mr-1 h-4 w-4" />Undo</Button><Button variant="outline" size="sm" disabled={!history.future.length || importing} onClick={() => { cancel(); setHistory(redoDesign); setSelected(null); }}><Redo2 className="mr-1 h-4 w-4" />Redo</Button><Button size="sm" variant="outline" disabled={importing} onClick={() => input.current?.click()}><Upload className="mr-1 h-4 w-4" />Import JSON</Button><Button size="sm" disabled={importing} onClick={exportFile}><Download className="mr-1 h-4 w-4" />Export JSON</Button><input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label="Import design JSON" onChange={event => void importFile(event.target.files?.[0])} /></div></header>
    <div className="min-h-0 flex-1 overflow-y-auto"><div data-testid="home-workspace" className="grid min-h-full min-w-0 gap-3 lg:h-full lg:min-h-[560px] lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="min-h-0 space-y-3 rounded-lg border border-white/10 bg-[#111a28] p-3 lg:overflow-y-auto">
        <label className="block space-y-1 text-xs">Design name<Input aria-label="Design name" value={doc.name} maxLength={120} onChange={event => commit({ ...doc, name: event.target.value })} /></label>
        <section className="space-y-2 border-y border-white/10 py-3" aria-label="Levels">
          <div className="flex items-center gap-2 text-xs font-semibold"><Layers className="h-4 w-4 text-cyan-400" />Levels<ModelFieldHelp label="Levels">The 2D plan edits the active level only. Level elevation moves its walls, floors, roofs and openings together. Wall/floor elevations are offsets from that level. New levels start empty; no geometry is copied.</ModelFieldHelp></div>
          <label className="block space-y-1 text-xs">Active level<select aria-label="Active level" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={activeLevelId} disabled={importing} onChange={event => chooseLevel(event.target.value)}>{[...doc.levels].sort((a, b) => a.elevation - b.elevation).map(level => <option key={level.id} value={level.id}>{level.name} · {formatLength(level.elevation)}</option>)}</select></label>
          <label className="block space-y-1 text-xs">Level name<Input aria-label="Level name" maxLength={60} value={level.name} disabled={importing} onChange={event => commit({ ...doc, levels: doc.levels.map(item => item.id === activeLevelId ? { ...item, name: event.target.value } : item) })} /></label>
          <Dimension label="Level elevation" positive={false} value={level.elevation} onChange={value => commit({ ...doc, levels: doc.levels.map(item => item.id === activeLevelId ? { ...item, elevation: value } : item) })} />
          <div className="flex gap-1"><Button size="sm" variant="outline" disabled={importing || doc.levels.length >= 20} onClick={addLevel}><Plus className="mr-1 h-3 w-3" />Add Level</Button><Button size="sm" variant="outline" disabled={importing || doc.levels.length === 1} onClick={deleteLevel}><Trash2 className="mr-1 h-3 w-3" />Delete Level</Button></div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label="Show all levels in 3D" checked={showAllLevels} onChange={event => setShowAllLevels(event.target.checked)} />Show all levels in 3D</label>
        </section>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label="Show roofs in 3D" checked={showRoofs} onChange={event => setShowRoofs(event.target.checked)} />Show roofs in 3D</label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={gridSnap} onChange={event => setGridSnap(event.target.checked)} />Snap to 6 in grid + endpoints</label>
        <p className="text-xs text-muted-foreground">Endpoint snap always uses a 10 px tolerance. Alt-drag pans; wheel zooms. Select a shape in either view.</p>
        <details open><summary className="mb-2 cursor-pointer text-xs font-semibold">Drawing defaults</summary><div className="grid grid-cols-2 gap-2">{([{ field: 'wallHeight', label: 'Wall height' }, { field: 'wallThickness', label: 'Wall thickness' }, { field: 'floorThickness', label: 'Floor thickness' }, { field: 'doorHeight', label: 'Door height' }, { field: 'doorWidth', label: 'Door width' }, { field: 'windowHeight', label: 'Window height' }, { field: 'windowWidth', label: 'Window width' }, { field: 'windowSill', label: 'Window sill' }] as const).map(item => <Dimension key={item.field} label={item.label} value={doc.defaults[item.field]} onChange={value => commit({ ...doc, defaults: { ...doc.defaults, [item.field]: value } })} />)}</div></details>
        <div className="border-t border-white/10 pt-3"><h2 className="mb-2 text-xs font-semibold">{wall ? 'Selected Wall' : floor ? 'Selected Floor' : roof ? 'Selected Roof' : roofOpening ? `Selected ${roofOpening.kind === 'skylight' ? 'Skylight' : 'Roof Cutout'}` : opening ? `Selected ${opening.kind === 'door' ? 'Door' : 'Window'}` : 'Properties'}</h2>
          {!wall && !floor && !roof && !opening && !roofOpening && <p className="text-xs text-muted-foreground">Select a shape. Drag walls/floors/roof labels to move shared nodes, yellow handles to edit corners, or an opening to slide along its host wall.</p>}
          {wall && <><p className="mb-2 text-xs">Length: {formatLength(distance(displayed.nodes.find(node => node.id === wall.start)!, displayed.nodes.find(node => node.id === wall.end)!))}</p><div className="grid grid-cols-2 gap-2"><Dimension label="Height" value={wall.height} onChange={value => updateWall('height', value)} /><Dimension label="Thickness" value={wall.thickness} onChange={value => updateWall('thickness', value)} /><Dimension label="Base offset" value={wall.elevation} positive={false} onChange={value => updateWall('elevation', value)} /></div></>}
          {floor && <div className="grid grid-cols-2 gap-2"><Dimension label="Thickness" value={floor.thickness} onChange={value => updateFloor('thickness', value)} /><Dimension label="Top offset" value={floor.elevation} positive={false} onChange={value => updateFloor('elevation', value)} /></div>}
          {roof && <div className="space-y-2"><ModelFieldHelp label="Roof properties">Roof elevation is the underside at its lowest eave, relative to the level. Thickness is vertical. Pitch is rise per 12 inches of run. Direction follows the gable ridge or shed contour from +X toward +Z. New roofs use Gable, 6/12 pitch, 0 degrees, 6 inch thickness and the default wall height. Roof Cutout and Skylight tools add hosted openings. Joins between roofs remain a later stage.</ModelFieldHelp><label className="block text-xs">Roof type<select aria-label="Roof type" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={roof.kind} onChange={event => updateRoof('kind', event.target.value as DesignRoof['kind'])}><option value="flat">Flat</option><option value="shed">Shed</option><option value="gable">Gable</option></select></label><div className="grid grid-cols-2 gap-2"><Scalar label="Pitch (rise / 12)" value={roof.pitch} max={24} onChange={value => updateRoof('pitch', value)} /><Scalar label="Direction (degrees)" value={roof.direction} max={359.999999} onChange={value => updateRoof('direction', value)} /><Dimension label="Roof thickness" value={roof.thickness} onChange={value => updateRoof('thickness', value)} /><Dimension label="Eave offset" positive={false} value={roof.elevation} onChange={value => updateRoof('elevation', value)} /></div></div>}
          {roofOpening && <div className="space-y-2"><ModelFieldHelp label="Roof opening properties">Width and length are measured in plan, not along the slope. Along/across offsets are from the host roof's first corner in its direction/perpendicular axes. Keep one inch from roof edges and other openings. Skylights also stay one inch from a pitched gable ridge. Drag within the host roof; deleting that roof removes its openings in the same Undo step.</ModelFieldHelp><p className="text-xs text-muted-foreground">Host roof: {displayed.roofs.find(roof => roof.id === roofOpening.roofId)?.kind} / {displayed.levels.find(level => level.id === entityLevelId(displayed, roofOpening.id))?.name}</p><label className="block text-xs">Opening type<select aria-label="Roof opening type" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={roofOpening.kind} onChange={event => updateRoofOpening('kind', event.target.value as DesignRoofOpening['kind'])}><option value="cutout">Roof Cutout</option><option value="skylight">Skylight</option></select></label><div className="grid grid-cols-2 gap-2">{(['width', 'length', 'along', 'across'] as const).map(field => <Dimension key={field} label={field === 'along' ? 'Along offset' : field === 'across' ? 'Across offset' : field[0].toUpperCase() + field.slice(1)} positive={field === 'width' || field === 'length'} value={roofOpening[field]} onChange={value => updateRoofOpening(field, value)} />)}</div></div>}
          {opening && <><p className="mb-2 text-xs text-muted-foreground">Offset is measured from the host wall's first corner. Drag along that wall to reposition. Deleting a host wall also removes its openings.</p><div className="grid grid-cols-2 gap-2">{(['offset', 'width', 'height', ...(opening.kind === 'window' ? ['sill'] : [])] as (keyof Pick<DesignOpening, 'offset' | 'width' | 'height' | 'sill'>)[]).map(field => <Dimension key={field} label={field === 'sill' ? 'Sill height' : field[0].toUpperCase() + field.slice(1)} positive={field !== 'offset'} value={opening[field]} onChange={value => updateOpening(field, value)} />)}</div></>}
          {keys.map((key, index) => { const node = displayed.nodes.find(node => node.id === key)!; return <div key={key} className="mt-2 grid grid-cols-2 gap-2"><Dimension label={`Corner ${index + 1} X`} positive={false} value={node.x} onChange={value => commit(moveNodes(doc, new Map([[key, { x: value, z: node.z }]])))} /><Dimension label={`Corner ${index + 1} Z`} positive={false} value={node.z} onChange={value => commit(moveNodes(doc, new Map([[key, { x: node.x, z: value }]])))} /></div>; })}
          {(!!keys.length || !!opening || !!roofOpening) && <Button className="mt-3" size="sm" variant="destructive" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Delete Selected</Button>}
        </div>
        <p className="text-xs text-muted-foreground">{doc.walls.length} walls · {doc.floors.length} floors · {doc.nodes.length} nodes · {doc.openings.length} openings / {doc.roofs.length} roofs / {doc.roofOpenings.length} roof openings</p>
      </aside>
      <div data-testid="home-viewports" className="grid min-h-[560px] min-w-0 grid-rows-2 gap-3"><HomeDesignPlan document={doc} displayDocument={displayed} activeLevelId={activeLevelId} selected={selected} tool={tool} gridSnap={gridSnap} onSelect={select} onCommit={commit} onPreview={previewUpdate} onMessage={setMessage} onDrawComplete={id => { setSelected(id); setTool('select'); }} cancelToken={cancelToken} /><Preview document={displayed} selected={selected} onSelect={select} visibleLevelId={showAllLevels ? undefined : activeLevelId} showRoofs={showRoofs} /></div>
    </div></div>
    <footer className="shrink-0 border-t pt-2 text-xs"><p role="status" aria-live="polite">{message}</p>{error && <p role="alert" className="mt-1 text-red-400">{error}</p>}<p className="mt-1 text-muted-foreground">{dirty ? 'Unexported local changes' : 'Local document ready'} · 1 in = 0.0254 m · No Project/database writes</p></footer>
  </div>;
}
