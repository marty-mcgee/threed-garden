'use client';
import type { ModelPlanImage } from '@/libraries/services/threed/models/model-plan-image';
import { ProjectMeasurementUnits } from '@/components/project/ProjectMeasurementUnits';
import { DesignNameInput } from './DesignNameInput';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import dynamic from 'next/dynamic';
import { Eye, Settings2, SlidersHorizontal, Building2, Scissors, SquareDashed, House, DoorOpen, Download, Layers, MousePointer2, Move, PanelsTopLeft, Pentagon, PencilRuler, Plus, Redo2, Trash2, Undo2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DetailsSectionScope, PersistentDetails } from '@/components/map/details/PersistentDetails';
import { defaultDesignWorkspace, type ProjectDesignWorkspaceState } from '@/libraries/services/threed/markers/project-view-state-core';
import { DesignImportDialog } from './DesignImportDialog';
import { DesignAction } from './DesignAction';
import { DesignFieldHelp } from './DesignFieldHelp';
import { DesignPlan, type DesignTool } from './DesignPlan';
import { commitDesign, redoDesign, undoDesign, type DesignHistory } from '@/libraries/services/threed/design/history';
import { architectureIsDirty, importProjectArchitecture, projectArchitectureDraft, type ProjectArchitectureDraft } from '@/libraries/services/threed/design/project-architecture';
import { editObject, objectProperties, type ObjectEdit } from '@/libraries/services/threed/design/object-properties';
import { distance, entityLevelId, formatLength, INCH, moveNodes, parseDesign, removeEntity, removeLevel, signedArea, validateDesign, type DesignDocument, type DesignRoof, type DesignRoofOpening, type DesignOpening } from '@/libraries/services/threed/design/document';
const Preview = dynamic(() => import('./DesignPreview').then(module => module.DesignPreview), { ssr: false, loading: () => <div className="h-full min-h-0 rounded border p-4 text-xs">Loading Live 3D…</div> });

function Dimension({ units, label, value, onChange, positive = true }: { units: 'imperial' | 'metric'; label: string; value: number; onChange: (value: number) => void; positive?: boolean }) {
  const factor = units === 'metric' ? 0.01 : INCH;
  const suffix = units === 'metric' ? 'cm' : 'in';
  const [text, setText] = useState(String(Number((value / factor).toFixed(4))));
  useEffect(() => { setText(String(Number((value / factor).toFixed(4)))); }, [value, factor]);
  return <label className="block space-y-1 text-xs"><span>{label} ({suffix})</span><Input type="number" aria-label={`${label} (${suffix})`} className="h-8" step=".25" min={positive ? INCH / factor : undefined} value={text}
    onChange={event => { setText(event.target.value); const number = Number(event.target.value); if (event.target.value.trim() && Number.isFinite(number) && (!positive || number * factor >= INCH)) onChange(number * factor); }}
    onBlur={() => setText(String(Number((value / factor).toFixed(4))))} /></label>;
}

function Scalar({ label, value, onChange, max }: { label: string; value: number; onChange: (value: number) => void; max: number }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return <label className="block space-y-1 text-xs">{label}<Input type="number" aria-label={label} min={0} max={max} step=".25" value={text} onChange={event => { setText(event.target.value); if (event.target.value.trim() && Number.isFinite(Number(event.target.value))) onChange(Number(event.target.value)); }} onBlur={() => setText(String(value))} /></label>;
}

export interface DesignEditorProps {
  modelImages?: ModelPlanImage[];
  selectedModelId?: string | null;
  metersPerSceneUnit?: number;
  onModelSelect?: (id: string) => void;
  frameRequest?: { id: string; sequence: number } | null;
  toolbarHost?: HTMLDivElement | null;
  historyHost?: HTMLDivElement | null;
  onActionsBusyChange?: (busy: boolean) => void;
  active?: boolean;
  canSave?: boolean;
  scene?: {
    projectId: number; projectName: string; draft: ProjectArchitectureDraft;
    onChange: (update: (draft: ProjectArchitectureDraft) => ProjectArchitectureDraft) => void;
    onSave: () => Promise<void>; saving: boolean;
    onPreview: (document: DesignDocument | null) => void;
    onVisibility: (levelId: string | string[] | undefined, showRoofs: boolean) => void;
    error?: string;
  };
}
export function DesignEditor({ selectedModelId, modelImages, metersPerSceneUnit, onModelSelect, frameRequest, active = true, canSave = true, scene, onActionsBusyChange }: DesignEditorProps = {}) {
  const controlsHost = useRef<HTMLDivElement>(null);
  const [localDraft, setLocalDraft] = useState(() => projectArchitectureDraft());
  const draft = scene?.draft ?? localDraft, history = draft.history;
  const owner = useRef(scene); owner.current = scene;
  const updateDraft = useCallback((update: (draft: ProjectArchitectureDraft) => ProjectArchitectureDraft) => {
    if (owner.current) owner.current.onChange(update); else setLocalDraft(update);
  }, []);
  const setHistory = useCallback((update: SetStateAction<DesignHistory>) => updateDraft(draft => ({ ...draft, history: typeof update === 'function' ? update(draft.history) : update })), [updateDraft]);
  const selected = draft.selected;
  const setSelected = useCallback((selected: string | null) => updateDraft(draft => ({ ...draft, selected, workspace: { ...(draft.workspace ?? defaultDesignWorkspace()), selectedEntityId: selected } })), [updateDraft]);
  const saving = scene?.saving ?? false, loading = false;
  const [preview, setPreview] = useState<DesignDocument | null>(null);
  const [readOnlyMeasurements, setReadOnlyMeasurements] = useState(draft.workspace?.showMeasurements ?? false);
  const [tool, setTool] = useState<DesignTool>('select'), [cancelToken, setCancelToken] = useState(0);
  const workspace = draft.workspace ?? defaultDesignWorkspace();
  const changeWorkspace = useCallback((patch: Partial<ProjectDesignWorkspaceState>) => updateDraft(draft => ({ ...draft, workspace: { ...(draft.workspace ?? defaultDesignWorkspace()), ...patch } })), [updateDraft]);
  const units = workspace.measurementUnits ?? 'imperial';
  const displayLength = (value: number) => units === 'metric' ? `${Number(value.toFixed(4))} m` : formatLength(value);
  const gridSnap = workspace.gridSnap, showRoofs = workspace.showRoofs, levelChoice = workspace.levelId, showAllLevels = workspace.showAllLevels;
  const setGridSnap = (gridSnap: boolean) => changeWorkspace({ gridSnap });
  const setShowRoofs = (showRoofs: boolean) => changeWorkspace({ showRoofs });
  const setLevelChoice = (levelId: string) => changeWorkspace({ levelId });


  const [message, setMessage] = useState('Ready to draw.'), [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  useEffect(() => { onActionsBusyChange?.(importing || loading || !canSave); }, [importing, loading, canSave, onActionsBusyChange]);

  const importingRef = useRef(importing); importingRef.current = importing;
  useEffect(() => {
    const transition = (event: Event) => { if (importingRef.current || owner.current?.saving) event.preventDefault(); };
    window.addEventListener('threed:design:transition', transition);
    return () => window.removeEventListener('threed:design:transition', transition);
  }, []);
  const doc = history.present, displayed = preview ?? doc, dirty = architectureIsDirty(draft);
  const activeLevelId = doc.levels.some(level => level.id === levelChoice) ? levelChoice : doc.levels[0].id;
  const visibleLevelIds = workspace.visibleLevelIds ?? (showAllLevels ? doc.levels.map(level => level.id) : [activeLevelId]);
  const toggleLevel = (id: string) => {
    cancel();
    const hiding = visibleLevelIds.includes(id);
    changeWorkspace({ visibleLevelIds: hiding ? visibleLevelIds.filter(level => level !== id) : [...visibleLevelIds, id], ...(!hiding ? { levelId: id } : {}) });
    if (!hiding) { setSelected(null); setTool('select'); }
  };
  const level = doc.levels.find(level => level.id === activeLevelId)!;
  useEffect(() => {
    const selectedLevel = selected ? entityLevelId(doc, selected) : undefined;
    if (active && selectedLevel && selectedLevel !== activeLevelId) {
      setLevelChoice(selectedLevel); setCancelToken(value => value + 1); setPreview(null); setTool('select');
    }
  }, [active, selected, doc, activeLevelId]);
  useEffect(() => {
    if (active && selected) controlsHost.current?.scrollTo({ left: 0, top: 0 });
  }, [active, selected]);
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  useEffect(() => { scene?.onPreview(preview); }, [preview, scene?.onPreview]);
  useEffect(() => { scene?.onVisibility(active ? workspace.visibleLevelIds ?? (showAllLevels ? undefined : activeLevelId) : undefined, !active || showRoofs); }, [active, activeLevelId, workspace.visibleLevelIds, showAllLevels, showRoofs, scene?.onVisibility]);
  useEffect(() => { if (!active) { setCancelToken(value => value + 1); setPreview(null); } }, [active]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirtyRef.current || owner.current?.saving) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload);
  }, []);
  const previewUpdate = useCallback((value: DesignDocument | null) => setPreview(value), []);
  const commit = useCallback((value: DesignDocument) => {
    try { const valid = validateDesign(value); setHistory(state => commitDesign(state, valid)); setPreview(null); setError(''); }
    catch (error) { setError((error as Error).message); }
  }, [setHistory]);
  const select = useCallback((id: string | null) => {
    const nextLevel = id ? entityLevelId(doc, id) : undefined;
    if (nextLevel && nextLevel !== activeLevelId) { setLevelChoice(nextLevel); setCancelToken(value => value + 1); setPreview(null); setTool('select'); }
    setSelected(nextLevel ? id : null);
  }, [doc, activeLevelId, setSelected]);
  const cancel = useCallback(() => { setCancelToken(value => value + 1); setPreview(null); setMessage('Draft cancelled. Completed design geometry is retained.'); }, []);
  function chooseLevel(id: string) { cancel(); changeWorkspace({ levelId: id, visibleLevelIds: visibleLevelIds.includes(id) ? visibleLevelIds : [...visibleLevelIds, id] }); setSelected(null); setTool('select'); setMessage('Editing this visible level. Other level visibility is retained.'); }
  function addLevel() {
    let number = 2; while (doc.levels.some(level => level.name.toLowerCase() === `level ${number}`)) number++;
    const next = { id: crypto.randomUUID(), name: `Level ${number}`, elevation: Math.min(100, Math.max(...doc.levels.map(level => level.elevation)) + 108 * INCH) };
    cancel(); commit({ ...doc, levels: [...doc.levels, next] }); changeWorkspace({ levelId: next.id, visibleLevelIds: [...visibleLevelIds, next.id] }); setSelected(null); setTool('select'); setMessage('Empty level added. Set its elevation, then draw walls and floors. Other levels are retained.');
  }
  function deleteLevel() {
    const occupied = doc.walls.some(wall => wall.levelId === activeLevelId) || doc.floors.some(floor => floor.levelId === activeLevelId) || doc.roofs.some(roof => roof.levelId === activeLevelId);
    if (occupied && !window.confirm(`Delete ${level.name} and all of its walls, floors, roofs and all hosted openings? Undo can restore them.`)) return;
    cancel(); commit(removeLevel(doc, activeLevelId)); changeWorkspace({ levelId: doc.levels.find(other => other.id !== activeLevelId)!.id, visibleLevelIds: visibleLevelIds.filter(id => id !== activeLevelId) }); setSelected(null); setTool('select'); setMessage('Level removed. Undo restores the level and its geometry together.');
  }
  function remove() {
    if (!selected) return;
    cancel(); commit(removeEntity(doc, selected)); setSelected(null);
  }
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!active || !canSave || importing || loading) return;
      if ((event.target as Element)?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (event.key === 'Escape') { event.preventDefault(); cancel(); if (tool === 'door' || tool === 'window' || tool === 'cutout' || tool === 'skylight') setTool('select'); return; }
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) { event.preventDefault(); cancel(); setHistory(event.shiftKey || event.key.toLowerCase() === 'y' ? redoDesign : undoDesign); setSelected(null); }
      else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(); }
    };
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard);
  });
  const wall = displayed.walls.find(wall => wall.id === selected), floor = displayed.floors.find(floor => floor.id === selected), opening = displayed.openings.find(o => o.id === selected);
  const roof = displayed.roofs.find(roof => roof.id === selected);
  const roofOpening = displayed.roofOpenings.find(opening => opening.id === selected);
  const keys = wall ? [wall.start, wall.end] : floor?.vertices ?? roof?.vertices ?? [];
  const updateWall = (field: 'height' | 'endHeight' | 'thickness' | 'elevation', value: number) => commit({ ...doc, walls: doc.walls.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateFloor = (field: 'thickness' | 'elevation', value: number) => commit({ ...doc, floors: doc.floors.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateRoof = <K extends keyof Pick<DesignRoof, 'kind' | 'pitch' | 'direction' | 'thickness' | 'elevation'>>(field: K, value: DesignRoof[K]) => commit({ ...doc, roofs: doc.roofs.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const updateRoofOpening = <K extends keyof Pick<DesignRoofOpening, 'kind' | 'along' | 'across' | 'width' | 'length'>>(field: K, value: DesignRoofOpening[K]) => commit({ ...doc, roofOpenings: doc.roofOpenings.map(item => item.id === selected ? { ...item, [field]: value } : item) });
  const updateOpening = (field: 'offset' | 'width' | 'height' | 'sill', value: number) => commit({ ...doc, openings: doc.openings.map(entity => entity.id === selected ? { ...entity, [field]: value } : entity) });
  const properties = objectProperties(displayed, selected);
  function changeObject(edit: ObjectEdit) {
    if (!selected) return;
    try { commit(editObject(doc, selected, edit)); } catch (error) { setError((error as Error).message); }
  }
  function importFile(incoming: DesignDocument, mode: 'merge' | 'replace') {
    const next = importProjectArchitecture(doc, incoming, mode, () => crypto.randomUUID());
    cancel(); commit(next); setLevelChoice(next.levels[mode === 'merge' ? doc.levels.length : 0].id); setSelected(null); setTool('select'); setError('');
    setMessage('Architecture imported. Save Project to retain these changes.');
  }
  function exportFile() {
    const text = JSON.stringify(validateDesign(doc), null, 2), url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = 'threed-design.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setMessage('Editable JSON backup exported. Project save status is unchanged.');
  }
  const toolGroups = [
      { label: 'Selection and pan', color: 'text-cyan-700 dark:text-cyan-300', tools: [{ key: 'select', title: 'Select', icon: MousePointer2 }, { key: 'pan', title: 'Pan', icon: Move }] },
      { label: 'Structures', color: 'text-emerald-700 dark:text-emerald-300', tools: [{ key: 'wall', title: 'Wall', icon: PencilRuler }, { key: 'floor', title: 'Floor', icon: Pentagon }, { key: 'roof', title: 'Roof', icon: House }] },
      { label: 'Wall openings', color: 'text-amber-700 dark:text-amber-300', tools: [{ key: 'door', title: 'Door', icon: DoorOpen }, { key: 'window', title: 'Window', icon: PanelsTopLeft }] },
      { label: 'Roof openings', color: 'text-violet-700 dark:text-violet-300', tools: [{ key: 'skylight', title: 'Skylight', icon: SquareDashed }, { key: 'cutout', title: 'Roof Cutout', icon: Scissors }] },
    ] as const;
  const actionGroups = [
    ...toolGroups.map(group => ({ label: group.label, color: group.color, actions: group.tools.map(item => ({ label: item.title, icon: item.icon, active: tool === item.key, disabled: !canSave || importing || loading, run: () => { cancel(); setTool(item.key); if (item.key === 'cutout' || item.key === 'skylight') { setShowRoofs(true); setMessage('Choose a host roof in the active plan. Hover to preview a 24 by 36 inch opening. Select the roof first when roofs overlap.'); } if (item.key === 'door' || item.key === 'window') setMessage(`Choose a host wall in the plan to place a ${item.title.toLowerCase()}. Hover to preview; Escape cancels.`); } })) })),
    { label: 'Design history', color: 'text-sky-700 dark:text-sky-300', actions: [
      { label: 'Undo', icon: Undo2, disabled: !canSave || !history.past.length || importing || loading, run: () => { cancel(); setHistory(undoDesign); setSelected(null); } },
      { label: 'Redo', icon: Redo2, disabled: !canSave || !history.future.length || importing || loading, run: () => { cancel(); setHistory(redoDesign); setSelected(null); } },
    ] },
    { label: 'Design JSON files', color: 'text-teal-700 dark:text-teal-300', actions: [
      { label: 'Import JSON', icon: importing ? Loader2 : Upload, disabled: !canSave || saving || importing || loading, run: () => setImporting(true) },
      { label: 'Export JSON', icon: Download, disabled: importing || loading, run: exportFile },
    ] },
  ];
  const drawingActions = <nav aria-label="ThreeD Design Action Tools" className={`flex min-w-0 max-w-full flex-wrap items-center gap-1 ${scene ? "[&_button]:h-7 [&_button]:w-7 [&_svg]:size-3.5" : ""}`}>
    {actionGroups.map(group => <div key={group.label} role="group" aria-label={group.label} className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
      {group.actions.map(action => <DesignAction key={action.label} label={action.label} disabled={action.disabled} variant={'active' in action && action.active ? (scene ? 'secondary' : 'default') : 'outline'} aria-pressed={'active' in action ? action.active : undefined} onClick={action.run}><action.icon className={`h-4 w-4 ${'active' in action && action.active && !scene ? '' : group.color} ${action.label === 'Import JSON' && importing ? 'animate-spin' : ''}`} aria-hidden="true" /></DesignAction>)}
    </div>)}
  </nav>;
  const header =     <header className="flex shrink-0 flex-wrap items-center gap-2 border-b pb-2"><div className="flex min-w-0 flex-wrap items-center gap-2"><Building2 className="h-5 w-5 text-cyan-400" /><h1 className="text-base font-semibold">ThreeD Design</h1><DesignFieldHelp label="ThreeD Design">Draw architectural content in the active Project Scene. Save Project stores editable parameters and existing Scene objects together. Export JSON makes a portable architectural backup. Wall centers and floor corners share node IDs.</DesignFieldHelp><span className="text-xs text-muted-foreground">{scene?.projectName ?? 'Local tools preview'}</span></div>
{drawingActions}</header>;
  const importDialog = <DesignImportDialog open={importing} onOpenChange={setImporting} onImport={importFile} />;
  const importStatus = <div data-testid="design-save-status" aria-live="polite" className="text-xs text-muted-foreground">{saving ? 'Saving Project...' : scene?.error ? 'Project save failed - edits retained' : dirty ? 'Unsaved Project changes' : 'No unsaved architecture changes'}{!canSave && ' / Sign in as the Project owner to edit.'}</div>;
  const propertiesPanel = <aside data-testid="design-properties" className={`flex min-w-0 flex-col gap-3 [&>section]:min-w-0 ${scene ? '' : 'rounded-lg border border-white/10 bg-[#111a28] p-3'}`}>
        <PersistentDetails storageId="design-name" open className="rounded-md border border-foreground/10 p-1 space-y-2" aria-label="Design and navigation"><summary className="cursor-pointer px-1 py-0.5 text-xs font-semibold"><Settings2 aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-middle text-sky-500 dark:text-sky-400" />Design settings</summary><ProjectMeasurementUnits value={units} onChange={measurementUnits => changeWorkspace({ measurementUnits })} /><label className="block space-y-1 text-xs">Design name<DesignNameInput name={doc.name} onCommit={name => commit({ ...doc, name })} /></label>
        </PersistentDetails><PersistentDetails storageId="levels" open className="rounded-md border border-foreground/10 p-1 space-y-2" aria-label="Levels">
          <summary className="cursor-pointer px-1 py-0.5 text-xs font-semibold"><Layers aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-middle text-cyan-600 dark:text-cyan-400" />Levels<DesignFieldHelp label="Levels">The 2D plan edits the active level only. Level elevation moves its walls, floors, roofs and openings together. Wall/floor elevations are offsets from that level. New levels start empty; no geometry is copied.</DesignFieldHelp></summary>
          <label className="block space-y-1 text-xs">Active level<select aria-label="Active level" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={activeLevelId} disabled={importing} onChange={event => chooseLevel(event.target.value)}>{[...doc.levels].sort((a, b) => a.elevation - b.elevation).map(level => <option key={level.id} value={level.id}>{level.name} · {displayLength(level.elevation)}</option>)}</select></label>
          <label className="block space-y-1 text-xs">Level name<Input aria-label="Level name" maxLength={60} value={level.name} disabled={importing} onChange={event => commit({ ...doc, levels: doc.levels.map(item => item.id === activeLevelId ? { ...item, name: event.target.value } : item) })} /></label>
          <Dimension units={units} label="Level elevation" positive={false} value={level.elevation} onChange={value => commit({ ...doc, levels: doc.levels.map(item => item.id === activeLevelId ? { ...item, elevation: value } : item) })} />
          <div className="flex gap-1"><Button size="sm" variant="outline" disabled={importing || doc.levels.length >= 20} onClick={addLevel}><Plus className="mr-1 h-3 w-3" />Add Level</Button><Button size="sm" variant="outline" disabled={importing || doc.levels.length === 1} onClick={deleteLevel}><Trash2 className="mr-1 h-3 w-3" />Delete Level</Button></div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label="Show active level in 2D and 3D" checked={visibleLevelIds.includes(activeLevelId)} onChange={() => toggleLevel(activeLevelId)} />Show active level in 2D and 3D</label>
        </PersistentDetails>
        <PersistentDetails storageId="navigation" open className="rounded-md border border-foreground/10 p-1 space-y-2" aria-label="Drawing navigation"><summary className="cursor-pointer px-1 py-0.5 text-xs font-semibold"><Eye aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-middle text-violet-500 dark:text-violet-400" />View settings<DesignFieldHelp label="Drawing navigation">Drag blank canvas to pan with any tool; click to use the selected tool. Alt or middle drag pans anywhere; wheel zooms at the pointer. Endpoint snapping uses 10 pixels. Shift constrains angles. Fit Plan frames the active level.</DesignFieldHelp></summary><label className="flex items-center gap-2 text-xs"><input type="checkbox" aria-label="Show roofs in 3D" checked={showRoofs} onChange={event => setShowRoofs(event.target.checked)} />Show roofs in 3D</label>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={gridSnap} onChange={event => setGridSnap(event.target.checked)} />Snap to 6 in grid + endpoints</label>

        </PersistentDetails><PersistentDetails storageId="defaults" className="rounded-md border border-foreground/10 p-1"><summary className="cursor-pointer px-1 py-0.5 text-xs font-semibold"><PencilRuler aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-middle text-amber-600 dark:text-amber-400" />Drawing defaults<DesignFieldHelp label="Drawing defaults">Defaults apply to new geometry. Select an existing object to edit its properties.</DesignFieldHelp></summary><div className="grid grid-cols-2 gap-2">{([{ field: 'wallHeight', label: 'Wall height' }, { field: 'wallThickness', label: 'Wall thickness' }, { field: 'floorThickness', label: 'Floor thickness' }, { field: 'doorHeight', label: 'Door height' }, { field: 'doorWidth', label: 'Door width' }, { field: 'windowHeight', label: 'Window height' }, { field: 'windowWidth', label: 'Window width' }, { field: 'windowSill', label: 'Window sill' }] as const).map(item => <Dimension units={units} key={item.field} label={item.label} value={doc.defaults[item.field]} onChange={value => commit({ ...doc, defaults: { ...doc.defaults, [item.field]: value } })} />)}</div></PersistentDetails>
        <PersistentDetails storageId="selected-properties" open data-testid="design-selected-properties" className={`${scene ? 'order-first' : ''} space-y-2 rounded-md border border-foreground/10 p-1`}><summary className="cursor-pointer px-1 py-0.5 text-xs font-semibold"><SlidersHorizontal aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-middle text-emerald-600 dark:text-emerald-400" />{wall ? 'Selected Wall' : floor ? 'Selected Floor' : roof ? 'Selected Roof' : roofOpening ? `Selected ${roofOpening.kind === 'skylight' ? 'Skylight' : 'Roof Cutout'}` : opening ? `Selected ${opening.kind === 'door' ? 'Door' : 'Window'}` : 'Properties'}<DesignFieldHelp label="Object properties">Select in either view. Drag objects or corners to edit geometry. Hosted openings move along their host.</DesignFieldHelp></summary>
          {!wall && !floor && !roof && !opening && !roofOpening && <p className="text-xs text-muted-foreground">Select an object in either view to edit its properties.</p>}
          {(wall || floor || roof) && properties && <div className="space-y-2">
            <p className="break-all text-xs text-muted-foreground">ID: {selected} / Level: {displayed.levels.find(level => level.id === entityLevelId(displayed, selected!))?.name}</p>
            <DesignFieldHelp label="Object transforms">Position is the footprint center in Project metres, entered in the selected display units. Rotation is the first edge from +X toward +Z. Width/depth are world-axis extents. Shared corners also move connected entities; invalid host/opening changes reject together. Flip mirrors geometry, not a door handing flag.</DesignFieldHelp>
            <div className="grid grid-cols-2 gap-2"><Dimension units={units} label="Position X" positive={false} value={properties.x} onChange={value => changeObject({field:'x',value})}/><Dimension units={units} label="Position Z" positive={false} value={properties.z} onChange={value => changeObject({field:'z',value})}/>
            {!wall && !(roof && displayed.roofOpenings.some(o => o.roofId === roof.id)) && <><Dimension units={units} label="Width X" value={properties.width} onChange={value => changeObject({field:'width',value})}/><Dimension units={units} label="Depth Z" value={properties.depth} onChange={value => changeObject({field:'depth',value})}/></>}
            <Scalar label="Rotation (degrees)" value={Number(properties.rotation.toFixed(4))} max={359.9999} onChange={value => changeObject({field:'rotation',value})}/></div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => changeObject({field:'flipX'})}>Flip X</Button><Button size="sm" variant="outline" onClick={() => changeObject({field:'flipZ'})}>Flip Z</Button></div>
          </div>}
          {wall && <><Dimension units={units} label="Length" value={distance(displayed.nodes.find(node => node.id === wall.start)!, displayed.nodes.find(node => node.id === wall.end)!)} onChange={value => changeObject({field: 'length', value})} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={wall.endHeight !== undefined} onChange={event => commit({ ...doc, version: 6, walls: doc.walls.map(entity => { if (entity.id !== wall.id) return entity; if (event.target.checked) return { ...entity, endHeight: entity.height }; const { endHeight, ...constant } = entity; return { ...constant, height: Math.max(entity.height, endHeight ?? entity.height) }; }) })} />Sloped top</label>
            <DesignFieldHelp label="Wall endpoint heights">Start and End follow the numbered wall corners below. Heights are relative to the wall base. One endpoint may be zero; the other must be at least one inch. Openings must fit below the slope. Turning Sloped top off keeps the taller height.</DesignFieldHelp>
            <div className="grid grid-cols-2 gap-2"><Dimension units={units} label={wall.endHeight === undefined ? 'Height' : 'Start height'} value={wall.height} positive={wall.endHeight === undefined} onChange={value => updateWall('height', value)} />{wall.endHeight !== undefined && <Dimension units={units} label="End height" value={wall.endHeight} positive={false} onChange={value => updateWall('endHeight', value)} />}<Dimension units={units} label="Thickness" value={wall.thickness} onChange={value => updateWall('thickness', value)} /><Dimension units={units} label="Base offset" value={wall.elevation} positive={false} onChange={value => updateWall('elevation', value)} /></div></>}
          {floor && <><p className="text-xs">Area: {Number((Math.abs(signedArea(keys.map(key => displayed.nodes.find(node => node.id === key)!))) / (units === 'metric' ? 1 : (12 * INCH) ** 2)).toFixed(2))} {units === 'metric' ? 'm?' : 'sq ft'}</p><div className="grid grid-cols-2 gap-2"><Dimension units={units} label="Thickness" value={floor.thickness} onChange={value => updateFloor('thickness', value)} /><Dimension units={units} label="Top offset" value={floor.elevation} positive={false} onChange={value => updateFloor('elevation', value)} /></div></>}
          {roof && <div className="space-y-2"><DesignFieldHelp label="Roof properties">Roof elevation is the underside at its lowest eave, relative to the level. Thickness is vertical. Pitch is rise per 12 inches of run. Direction follows the gable ridge or shed contour from +X toward +Z. New roofs use Gable, 6/12 pitch, 0 degrees, 6 inch thickness and the default wall height. Roof Cutout and Skylight tools add hosted openings. Joins between roofs remain a later stage.</DesignFieldHelp><label className="block text-xs">Roof type<select aria-label="Roof type" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={roof.kind} onChange={event => updateRoof('kind', event.target.value as DesignRoof['kind'])}><option value="flat">Flat</option><option value="shed">Shed</option><option value="gable">Gable</option></select></label><div className="grid grid-cols-2 gap-2"><Scalar label="Pitch (rise / 12)" value={roof.pitch} max={24} onChange={value => updateRoof('pitch', value)} /><Scalar label="Direction (degrees)" value={roof.direction} max={359.999999} onChange={value => updateRoof('direction', value)} /><Dimension units={units} label="Roof thickness" value={roof.thickness} onChange={value => updateRoof('thickness', value)} /><Dimension units={units} label="Eave offset" positive={false} value={roof.elevation} onChange={value => updateRoof('elevation', value)} /></div></div>}
          {roofOpening && <div className="space-y-2"><DesignFieldHelp label="Roof opening properties">Width and length are measured in plan, not along the slope. Along/across offsets are from the host roof's first corner in its direction/perpendicular axes. Keep one inch from roof edges and other openings. Skylights also stay one inch from a pitched gable ridge. Drag within the host roof; deleting that roof removes its openings in the same Undo step.</DesignFieldHelp><p className="text-xs text-muted-foreground">Host roof: {displayed.roofs.find(roof => roof.id === roofOpening.roofId)?.kind} / {displayed.levels.find(level => level.id === entityLevelId(displayed, roofOpening.id))?.name}</p><label className="block text-xs">Opening type<select aria-label="Roof opening type" className="h-8 w-full rounded border border-white/15 bg-[#111a28] px-2" value={roofOpening.kind} onChange={event => updateRoofOpening('kind', event.target.value as DesignRoofOpening['kind'])}><option value="cutout">Roof Cutout</option><option value="skylight">Skylight</option></select></label><div className="grid grid-cols-2 gap-2">{(['width', 'length', 'along', 'across'] as const).map(field => <Dimension units={units} key={field} label={field === 'along' ? 'Along offset' : field === 'across' ? 'Across offset' : field[0].toUpperCase() + field.slice(1)} positive={field === 'width' || field === 'length'} value={roofOpening[field]} onChange={value => updateRoofOpening(field, value)} />)}</div></div>}
          {opening && <><DesignFieldHelp label="Opening properties">Position follows the host wall; elevation follows its level and base. Offset is from the first corner. Deleting the host removes its openings.</DesignFieldHelp><div className="grid grid-cols-2 gap-2">{(['offset', 'width', 'height', ...(opening.kind === 'window' ? ['sill'] : [])] as (keyof Pick<DesignOpening, 'offset' | 'width' | 'height' | 'sill'>)[]).map(field => <Dimension units={units} key={field} label={field === 'sill' ? 'Sill height' : field[0].toUpperCase() + field.slice(1)} positive={field !== 'offset'} value={opening[field]} onChange={value => updateOpening(field, value)} />)}</div></>}
          {keys.map((key, index) => { const node = displayed.nodes.find(node => node.id === key)!; return <div key={key} className="mt-2 grid grid-cols-2 gap-2"><Dimension units={units} label={`Corner ${index + 1} X`} positive={false} value={node.x} onChange={value => commit(moveNodes(doc, new Map([[key, { x: value, z: node.z }]])))} /><Dimension units={units} label={`Corner ${index + 1} Z`} positive={false} value={node.z} onChange={value => commit(moveNodes(doc, new Map([[key, { x: node.x, z: value }]])))} /></div>; })}
          {(!!keys.length || !!opening || !!roofOpening) && <Button className="mt-3" size="sm" variant="destructive" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Delete Selected</Button>}
        </PersistentDetails>
        <p className="max-w-48 text-xs text-muted-foreground">{doc.walls.length} walls · {doc.floors.length} floors · {doc.nodes.length} nodes · {doc.openings.length} openings / {doc.roofs.length} roofs / {doc.roofOpenings.length} roof openings</p>
      </aside>;
  const footer = <footer className="shrink-0 border-t pt-2 text-xs"><p role="status" aria-live="polite">{message}</p>{(error || scene?.error) && <p role="alert" className="mt-1 text-red-400">{error || scene?.error}</p>}<p className="mt-1 text-muted-foreground">{dirty ? 'Unsaved changes' : 'Saved Project architecture'} · 1 in = 0.0254 m · Project coordinates - Save Project retains these edits</p></footer>;
  const controls = <div ref={controlsHost} className="flex min-h-0 min-w-0 flex-col gap-2 overflow-auto overscroll-contain text-foreground [&_input]:min-w-0 [&_label]:min-w-0 [&_select]:max-w-full" data-testid="design-controls">{importStatus}<fieldset disabled={loading || importing || !canSave} className="min-w-0 border-0 p-0">{propertiesPanel}</fieldset>{footer}</div>;
  const plan = <DesignPlan visibleLevelIds={visibleLevelIds} onToggleLevel={toggleLevel} contextActions={actionGroups} showMeasurements={canSave ? workspace.showMeasurements ?? false : readOnlyMeasurements} onShowMeasurementsChange={showMeasurements => { if (canSave) changeWorkspace({ showMeasurements }); else setReadOnlyMeasurements(showMeasurements); }} selectedModelId={selectedModelId} modelImages={modelImages} metersPerSceneUnit={metersPerSceneUnit} onModelSelect={onModelSelect} measurementUnits={units} frameRequest={frameRequest} embedded={Boolean(scene)} drawingActions={scene ? drawingActions : undefined} planView={workspace.plan} onViewChange={plan => changeWorkspace({ plan })} active={active} disabled={!canSave || importing} document={doc} displayDocument={displayed} activeLevelId={activeLevelId} selected={selected} tool={tool} gridSnap={gridSnap} onSelect={select} onCommit={commit} onPreview={previewUpdate} onMessage={setMessage} onDrawComplete={id => { setSelected(id); setTool('select'); }} cancelToken={cancelToken} />;
  if (scene) return <div className="flex h-full min-h-0 min-w-0 overflow-hidden" data-testid="home-editor">
    {importDialog}
    <div data-testid="design-properties-panel" className="threed-workspace-panel threed-scene-panel-surface threed-scene-sidebar-size flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden rounded-md border p-3 shadow-xl backdrop-blur-md"><DetailsSectionScope.Provider value={`design:${scene.projectId}`}><div className="mb-2 flex shrink-0 items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />Design Properties<DesignFieldHelp label="Design Properties">Edit selected geometry and workspace settings. Save Project retains both.</DesignFieldHelp></div>{controls}</DetailsSectionScope.Provider></div>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">{plan}</div>
  </div>;
  return <div className="flex h-full min-h-0 flex-col gap-2 text-foreground" data-testid="home-editor">{header}{importDialog}{importStatus}
    <div className="min-h-0 flex-1 overflow-y-auto"><div data-testid="home-workspace" className="grid min-h-full min-w-0 gap-3 lg:h-full lg:min-h-[560px] lg:grid-cols-[minmax(10rem,15rem)_minmax(0,1fr)]"><fieldset disabled={loading || importing || !canSave} className="min-h-0 min-w-0 overflow-y-auto border-0 p-0">{propertiesPanel}</fieldset><div data-testid="home-viewports" className="grid min-h-[560px] min-w-0 grid-rows-2 gap-3">{plan}<Preview document={displayed} selected={selected} onSelect={select} visibleLevelId={visibleLevelIds} showRoofs={showRoofs} /></div></div></div>{footer}
  </div>;
}
