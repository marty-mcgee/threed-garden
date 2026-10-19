'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Monitor, Ruler, Sun, Box, Settings2, Save, RotateCcw, Loader2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectMeasurementUnits } from '@/components/project/ProjectMeasurementUnits';
import { projectConfigurationStamp, type ProjectConfigurationChanges, type ProjectConfigurationRequest } from '@/libraries/services/project/configuration';
import { readThreeDProjectViewStateFromConfig, type ProjectViewMode, type ProjectCameraMode } from '@/libraries/services/threed/markers/project-view-state-core';
import { THREE_D_ENVIRONMENT_PRESETS } from '@/libraries/services/threed/environment-presets';

function settings(config: unknown) {
  const view = readThreeDProjectViewStateFromConfig(config), scene = view?.threeD;
  return {
    measurementUnits: projectConfigurationStamp(config).measurementUnits,
    viewMode: view?.viewMode ?? '3d' as ProjectViewMode, cameraMode: view?.cameraMode ?? 'stationary' as ProjectCameraMode,
    environment: scene?.environment ?? 'default-daylight', autoRotate: scene?.autoRotate ?? false,
    showGrid: scene?.showGrid ?? false, showGizmo: scene?.showGizmo ?? false, showSimulations: scene?.showSimulations ?? true, designTransparency: scene?.designTransparency ?? false,
    azimuth: String(scene?.sunlight?.azimuth ?? 0), elevation: String(scene?.sunlight?.elevation ?? 45),
    groundEnabled: scene?.ground?.enabled ?? false, groundSize: String(scene?.ground?.size ?? 200), groundHeight: String(scene?.ground?.height ?? -.1),
    activeLayers: scene?.activeLayers ?? [],
  };
}
type Settings = ReturnType<typeof settings>;
function changes(before: Settings, after: Settings): ProjectConfigurationChanges {
  const result: ProjectConfigurationChanges = {}, scene: NonNullable<ProjectConfigurationChanges['threeD']> = {};
  if (before.measurementUnits !== after.measurementUnits) result.measurementUnits = after.measurementUnits;
  if (before.viewMode !== after.viewMode) result.viewMode = after.viewMode;
  if (before.cameraMode !== after.cameraMode) result.cameraMode = after.cameraMode;
  for (const key of ['environment', 'autoRotate', 'showGrid', 'showGizmo', 'showSimulations', 'designTransparency'] as const) if (before[key] !== after[key]) Object.assign(scene, { [key]: after[key] });
  if (before.azimuth !== after.azimuth || before.elevation !== after.elevation) scene.sunlight = { azimuth: Number(after.azimuth), elevation: Number(after.elevation) };
  if (before.groundEnabled !== after.groundEnabled || before.groundSize !== after.groundSize || before.groundHeight !== after.groundHeight) scene.ground = { enabled: after.groundEnabled, size: Number(after.groundSize), height: Number(after.groundHeight) };
  if (JSON.stringify([...before.activeLayers].sort()) !== JSON.stringify([...after.activeLayers].sort())) scene.activeLayers = after.activeLayers;
  if (Object.keys(scene).length) result.threeD = scene;
  return result;
}
const layers = [['beds','Beds'],['characters','Characters'],['farmbots','FarmBots'],['models','Models'],['plantings','Plantings'],['layers','Layers'],['designs','Designs']] as const;

export function ProjectConfigurations({ project, disabled, onSaved, onCalibrate, details, detailsDirty, onReset, onSave, rightColumnFooter }: {
  project: { id: number | null; config?: unknown; metersPerSceneUnit: string; headingDegrees: string; originLatitude: string | null; originLongitude: string | null };
  disabled: boolean; onSaved: (config: unknown) => void; onCalibrate: () => void;
  rightColumnFooter?: ReactNode;
  details: ReactNode; detailsDirty: boolean; onReset: () => void;
  onSave: (configuration: ProjectConfigurationRequest | undefined, signal: AbortSignal) => Promise<unknown>;
}) {
  // Keyed by Project in the parent; unrelated identity/module refreshes retain this draft.
  const [baseline, setBaseline] = useState(project.config);
  const [draft, setDraft] = useState(() => settings(project.config));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  const saving = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  const view = readThreeDProjectViewStateFromConfig(baseline), scene = view?.threeD;
  const creating = project.id === null;
  const patch = changes(settings(baseline), draft), dirty = Object.keys(patch).length > 0;
  const projectDirty = dirty || detailsDirty;
  useEffect(() => {
    if (!projectDirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download') || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (busy || !window.confirm('Discard unsaved Project changes?')) return;
      window.removeEventListener('beforeunload', warn); window.location.assign(anchor.href);
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [projectDirty, busy]);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => { setDraft(current => ({ ...current, [key]: value })); setMessage(''); };
  async function save() {
    if (saving.current || busy || disabled || !projectDirty) return;
    saving.current = true;
    setBusy(true); setError(''); setMessage('');
    controller.current = new AbortController();
    try {
      const savedConfig = await onSave(dirty ? { expected: projectConfigurationStamp(baseline), changes: patch } : undefined, controller.current.signal);
      setBaseline(savedConfig); onSaved(savedConfig);
      // Keep edits made while Save was pending; acknowledge only the submitted values.
      const saved = settings(savedConfig), captured = draft;
      setDraft(current => Object.fromEntries(Object.entries(current).map(([key,value]) => [key, JSON.stringify(value) === JSON.stringify(captured[key as keyof Settings]) ? saved[key as keyof Settings] : value])) as Settings);
      setMessage(creating ? 'Project created.' : 'Project changes saved. Reopen the Project Scene to use updated settings.');
    } catch (reason) { if (!controller.current?.signal.aborted) setError(reason instanceof Error ? reason.message : 'Save failed. Your edits are retained.'); }
    finally { saving.current = false; setBusy(false); }
  }
  async function reload() {
    if (dirty && !window.confirm('Discard unsaved configuration edits and load the latest Project settings?')) return;
    setBusy(true); setError(''); controller.current = new AbortController();
    try {
      const response = await fetch(`/api/project?id=${project.id}`, { signal: controller.current.signal }); const result = await response.json();
      if (!response.ok || !result.success || result.data?.id !== project.id) throw new Error(result.error || 'Could not reload Project settings.');
      setBaseline(result.data.config); setDraft(settings(result.data.config)); onSaved(result.data.config); setMessage('Latest Project settings loaded.');
    } catch(reason) { if (!controller.current?.signal.aborted) setError(reason instanceof Error ? reason.message : 'Reload failed.'); }
    finally { setBusy(false); }
  }
  const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return <form className="grid min-w-0 items-start gap-4 xl:grid-cols-2" onSubmit={event => { event.preventDefault(); void save(); }}>
    <div className="min-w-0 space-y-4">
    {details}
    <Card className="gap-0 overflow-hidden border-t-2 border-t-cyan-500/60"><CardHeader className="px-5 pt-5 pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Monitor aria-hidden="true" className="size-5 shrink-0 text-cyan-600 dark:text-cyan-400" />Workspace setup</CardTitle><p className="text-sm text-muted-foreground">Units, coordinates and your saved view.</p></CardHeader><CardContent className="space-y-4 px-5 pb-5"><fieldset disabled={disabled} className="min-w-0 space-y-4">
        <section className="space-y-3 rounded-xl border bg-muted/15 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><Ruler aria-hidden="true" className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />Measurements and coordinates</h3>
          <ProjectMeasurementUnits value={draft.measurementUnits} onChange={value => set('measurementUnits',value)} disabled={disabled} />
          <p className="text-xs text-muted-foreground">Calibration: {project.metersPerSceneUnit} metres per Scene unit · heading {project.headingDegrees}°. Origin: {project.originLatitude ?? 'not set'}, {project.originLongitude ?? 'not set'}. Measurement preference changes display and inputs, preserving physical size.</p>
          {creating ? <p className="text-xs text-muted-foreground">Coordinate calibration is available after creation in Project Setup.</p> : <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCalibrate}>Edit coordinate calibration</Button>}
        </section>
        {!view && <p role="status" className="text-sm text-muted-foreground">{creating ? 'Create the Project, add its modules and content, then Save Project in the Scene to configure its saved workspace and environment here.' : 'Save Project in the Scene once to configure its saved view and environment here. Measurements can be saved now. Any existing unreadable workspace is retained.'}</p>}
        <fieldset disabled={!view} className="grid min-w-0 gap-3 rounded-xl border bg-muted/15 p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold"><Monitor aria-hidden="true" className="mr-2 inline size-4 text-cyan-600 dark:text-cyan-400" />Saved workspace</legend>
          <label className="space-y-1 text-sm">View Mode<select aria-label="Saved View Mode" className={selectClass} value={draft.viewMode} onChange={e=>set('viewMode',e.target.value as ProjectViewMode)}>{['3d','design','2d','combined'].map(mode=><option key={mode} value={mode}>{mode}</option>)}</select></label>
          <label className="space-y-1 text-sm">Camera mode<select aria-label="Saved camera mode" className={selectClass} value={draft.cameraMode} onChange={e=>set('cameraMode',e.target.value as ProjectCameraMode)}>{['stationary','orbit','follow','topdown','firstperson'].map(mode=><option key={mode} value={mode}>{mode}</option>)}</select></label>
          <p className="text-xs text-muted-foreground sm:col-span-2">{view ? `Last saved: ${new Date(view.savedAt).toLocaleString()}.` : 'No saved workspace.'} Camera positions, named views, DetailsCards, panel layout and Design level are preserved. Position the cameras in the Scene and use Save Project to update them.</p>
        </fieldset>

    </fieldset></CardContent></Card>
    </div>
    <div className="min-w-0 space-y-4">
    <Card id="project-configurations" className="min-w-0 gap-0 overflow-hidden border-t-2 border-t-violet-500/60">
    <CardHeader className="px-5 pt-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Settings2 aria-hidden="true" className="h-4 w-4 text-violet-600 dark:text-violet-400" />Scene appearance</CardTitle><p className="text-sm text-muted-foreground">Choose the environment and visible Scene layers.</p></CardHeader>
    <CardContent className="space-y-4 px-5 pb-5">
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
        <fieldset disabled={!scene} className="space-y-3 rounded-xl border bg-muted/15 p-4"><legend className="px-1 text-sm font-semibold"><Sun aria-hidden="true" className="mr-2 inline size-4 text-amber-600 dark:text-amber-400" />Scene environment</legend>
          <label className="block space-y-1 text-sm">Environment<select aria-label="Scene environment" className={selectClass} value={draft.environment} onChange={e=>set('environment',e.target.value)}>{THREE_D_ENVIRONMENT_PRESETS.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
          <div className="grid gap-2 sm:grid-cols-2">{([['autoRotate','Auto-rotate'],['showGrid','Grid'],['showGizmo','Orientation gizmo'],['showSimulations','Simulations panel'],['designTransparency','Transparent Design objects']] as const).map(([key,label])=><label key={key} className="flex min-h-10 items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm"><input type="checkbox" checked={draft[key]} onChange={e=>set(key,e.target.checked)} />{label}</label>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">{([['azimuth','Sun direction (°)',0,360],['elevation','Sun elevation (°)',5,90],['groundSize','Ground size (Scene units)',10,2000],['groundHeight','Ground height (Scene units)',-1000,1000]] as const).map(([key,label,min,max])=><label key={key} className="space-y-1 text-sm">{label}<Input required type="number" step="any" min={min} max={max} value={draft[key]} onChange={e=>set(key,e.target.value)} /></label>)}</div>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm"><input type="checkbox" checked={draft.groundEnabled} onChange={e=>set('groundEnabled',e.target.checked)} />Extra ground plane</label>
          {!scene && <p className="text-xs text-muted-foreground">Save a 3D Scene view to configure its environment.</p>}
        </fieldset>
        <fieldset disabled={!scene} className="rounded-xl border bg-muted/15 p-4"><legend className="px-1 text-sm font-semibold"><Layers aria-hidden="true" className="mr-1 inline h-4 w-4 text-cyan-500" />Scene layers</legend><div className="flex flex-wrap gap-x-5 gap-y-2">{layers.map(([id,label])=>{const available=(scene?.availableLayers ?? scene?.activeLayers ?? []).includes(id);return <label key={id} className="flex min-h-10 items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm"><input type="checkbox" disabled={!available} checked={draft.activeLayers.includes(id)} onChange={e=>set('activeLayers',e.target.checked?[...draft.activeLayers,id]:draft.activeLayers.filter(key=>key!==id))} />{label}{!available && <span className="text-xs text-muted-foreground">(not in saved view)</span>}</label>;})}</div></fieldset>
      </fieldset>
    </CardContent>
  </Card>
  {rightColumnFooter}
  </div>
  <div className="min-w-0 space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 xl:col-span-2">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{projectDirty ? 'Unsaved Project changes' : message || (creating ? 'Enter Project details to create your Project.' : 'Project unchanged')}</p>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy||disabled||!projectDirty} className="bg-emerald-600 text-white hover:bg-emerald-700">{busy?<Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />:<Save aria-hidden="true" className="mr-2 h-4 w-4" />}{creating ? 'Create Project' : 'Save Changes'}</Button><Button type="button" variant="outline" disabled={busy||disabled||!projectDirty} onClick={()=>{setDraft(settings(baseline));onReset();setError('');setMessage('');}}><RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />Reset changes</Button>{!creating && <><Button type="button" variant="outline" disabled={busy||disabled} onClick={()=>void reload()}>Reload configuration</Button><Button variant="outline" asChild><Link href={`/dashboard/scene?projectId=${project.id}`}><Box aria-hidden="true" className="mr-2 h-4 w-4" />Open Project Scene</Link></Button></>}</div>
  </div>
  </form>;
}
