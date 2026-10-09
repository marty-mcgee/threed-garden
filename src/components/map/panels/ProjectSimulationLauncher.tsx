'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FlaskConical, LoaderCircle, Play, Plus, RotateCw, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { useToast } from '@/components/ui/toast';
import { useProjectOverlayPosition } from './ProjectOverlayLayout';
import { ProjectSimulationControls } from './ProjectSimulationControls';
import { getCharacterAnimationAvailability, subscribeCharacterAnimationAvailability } from '@/libraries/services/threed/animations/runtime-availability';
import { soccerSimulationReadiness, type SoccerSceneContext } from '@/libraries/services/threed/simulations/soccer-simulation-scene';
import { simulationLaunchParticipants, type SimulationLaunch, type SimulationLaunchSummary } from '@/libraries/services/threed/simulations/simulation-launch';
import type { SimulationRunState } from '@/libraries/services/threed/simulations/soccer-simulation-runner';
import type { ThreeDPhysicsEventV1 } from '@/libraries/services/threed/physics/physics-event-core';

type Props = { context: SoccerSceneContext; saveResults: boolean;
  onPrepare: (launch: SimulationLaunch) => void;
  subscribeSensors: (listener: (event: Readonly<ThreeDPhysicsEventV1>) => void) => () => void };
async function read(projectId: number, signal: AbortSignal, suffix = '') {
  const response = await fetch(`/api/project/simulations?projectId=${projectId}${suffix}`, { signal, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Project Simulations unavailable.');
  return result;
}

export function ProjectSimulationLauncher({ context, saveResults, onPrepare, subscribeSensors }: Props) {
  const overlay = useProjectOverlayPosition('simulations');
  const { showToast, ToastComponent } = useToast();
  const [rows, setRows] = useState<SimulationLaunchSummary[]>([]), [page, setPage] = useState(0), [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [launch, setLaunch] = useState<SimulationLaunch | null>(null), [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false), [state, setState] = useState<SimulationRunState | null>(null);
  const [runError, setRunError] = useState('');
  const [request, setRequest] = useState(0), [stopRequest, setStopRequest] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const toggle = (event: Event) => {
      if ((event as CustomEvent<{ projectId: number }>).detail?.projectId !== context.projectId) return;
      setHidden(false);
    };
    window.addEventListener('threed:simulation-panel', toggle);
    return () => window.removeEventListener('threed:simulation-panel', toggle);
  }, [context.projectId]);
  const current = useRef(context); current.current = context;
  const lock = useRef(false), controller = useRef<AbortController | null>(null), pending = useRef<SimulationLaunch | null>(null);
  const actor = context.markers.find(marker => marker.id === launch?.simulation.definition.steps[0]?.actorMarkerId);
  const availability = useSyncExternalStore(subscribeCharacterAnimationAvailability,
    () => getCharacterAnimationAvailability(Number(actor?.data?.id), String(actor?.data?.model?.filePath ?? '')), () => null);
  const mapping = launch?.kickMappings.find(item => availability?.has(item.action.toLowerCase())) ?? null;
  const readiness = launch ? soccerSimulationReadiness(launch.simulation, context, mapping) : null;
  const onStatus = useCallback((running: boolean, next: SimulationRunState | null, message?: string) => { setBusy(running); setState(next); setRunError(message ?? ''); }, []);

  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError('');
    read(context.projectId!, abort.signal, `&offset=${page * 25}`).then(result => {
      if (abort.signal.aborted) return;
      const count = Number(result.pagination.total);
      if (page && page * 25 >= count) { setPage(Math.max(0, Math.ceil(count / 25) - 1)); return; }
      setRows(result.data); setTotal(count);
      if (count === 1) setSelectedId(String(result.data[0].id));
      else if (!count) { setSelectedId(''); setLaunch(null); setState(null); }
      else if (refresh) setSelectedId(value => result.data.some((row: SimulationLaunchSummary) => String(row.id) === value) ? value : '');
    }).catch(cause => { if (!abort.signal.aborted) { setRows([]); setTotal(0); setSelectedId(''); setLaunch(null); setState(null); setError(cause instanceof Error ? cause.message : 'Project Simulations unavailable.'); } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [context.projectId, page, refresh]);

  useEffect(() => () => { controller.current?.abort(); pending.current = null; lock.current = false; }, []);
  useEffect(() => {
    if (!preparing || !pending.current || !launch) return;
    if (!context.allowed || !context.ready || context.busy) { stop('Scene preparation was interrupted.'); return; }
    try {
      const participants = simulationLaunchParticipants(launch, context);
      if (context.controlledCharacterId !== participants.characterId || context.target?.markerId !== participants.target.markerId) {
        stop('Simulation participants changed during preparation.'); return;
      }
    } catch (cause) { stop(cause instanceof Error ? cause.message : 'Simulation participants are unavailable.'); return; }
    if (!readiness) { pending.current = null; lock.current = false; setPreparing(false); setBusy(true); setRequest(value => value + 1); }
  }, [preparing, launch, readiness, context.allowed, context.ready, context.busy]);
  useEffect(() => {
    if (!preparing) return;
    const timer = setTimeout(() => stop('The participants are not ready. Open Simulation details to review preparation.'), 20000);
    const cancel = () => stop('Simulation preparation was interrupted.');
    const input = (event: KeyboardEvent) => { if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'Escape'].includes(event.code)) cancel(); };
    window.addEventListener('pagehide', cancel); window.addEventListener('keydown', input);
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', cancel); window.removeEventListener('keydown', input); };
  }, [preparing]);

  function stop(reason?: string) {
    controller.current?.abort(); controller.current = null; pending.current = null; lock.current = false;
    setPreparing(false); setStopRequest(value => value + 1);
    if (reason) { setError(reason); showToast(reason, 'info'); }
  }
  useEffect(() => {
    const cancel = () => stop();
    window.addEventListener('threed:design:entered', cancel);
    return () => window.removeEventListener('threed:design:entered', cancel);
  }, []);
  async function start() {
    if (!selectedId || lock.current || busy || !current.current.ready || current.current.busy || !current.current.allowed) return;
    const abort = new AbortController(); controller.current = abort; lock.current = true; setPreparing(true); setError(''); setRunError('');
    try {
      const result = await read(current.current.projectId!, abort.signal, `&id=${selectedId}`);
      if (abort.signal.aborted) return;
      const next = result.data as SimulationLaunch;
      if (next.simulation.id !== Number(selectedId) || next.simulation.projectId !== current.current.projectId) throw new Error('Project Simulation changed.');
      simulationLaunchParticipants(next, current.current);
      if (launch?.simulation.id === next.simulation.id && launch.simulation.revision !== next.simulation.revision) {
        setLaunch(next); throw new Error('This Simulation changed. Review Simulation details, then Run again.');
      }
      pending.current = next; setLaunch(next); setState(null); onPrepare(next);
    } catch (cause) {
      if (!abort.signal.aborted) { const message = cause instanceof Error ? cause.message : 'Simulation could not start.'; setError(message); showToast(message, 'error'); }
      pending.current = null; lock.current = false; setPreparing(false);
    }
  }

  function reload() {
    if (preparing || busy || lock.current) return;
    setPage(0); setSelectedId(''); setLaunch(null); setRequest(0); setStopRequest(0); setState(null); setRunError(''); setLoading(true);
    setRefresh(value => value + 1);
  }
  const disabledReason = loading ? 'Checking saved Simulations…' : !context.allowed ? 'This Project is unavailable.'
    : !context.ready ? 'Waiting for the Scene and physics to be ready.' : context.busy ? 'Finish placing or editing an asset to enable Run.'
    : !total ? 'No runnable Simulation is available in this Project.'
    : !selectedId ? 'Choose a Simulation above to enable Run.' : null;
  const selectedRow = rows.find(row => String(row.id) === selectedId);
  const draftParams = new URLSearchParams({ projectId: String(context.projectId) });

  return <div ref={overlay.ref as React.Ref<HTMLDivElement>} style={overlay.style} data-scene-hover-obstacle aria-label="Run Simulation" hidden={hidden} aria-hidden={hidden} inert={hidden}
    className={`threed-workspace-panel threed-toolbar-dropdown-surface absolute left-1/2 top-10 z-40 max-h-[calc(100%_-_4rem)] overflow-y-auto overscroll-contain w-[min(22rem,calc(100%_-_1.5rem))] -translate-x-1/2 space-y-2 rounded-lg border border-foreground/15 bg-background/85 p-2 text-center shadow-lg backdrop-blur-md transition-opacity pointer-events-auto opacity-100`}>
    <div {...overlay.handle} className={`${overlay.handle.className} flex items-center justify-between gap-3 text-left`}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><FlaskConical aria-hidden="true" className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Simulations</h2>
      <span data-overlay-control><ModelFieldHelp label="Run Simulation">Choose a saved Simulation, then Run to activate its participants and Actions. {disabledReason || 'Ready to run.'} Owner runs record Results; public runs stay in your browser. A Scenario is a separate plan. Close hides these controls; Setup reopens them.</ModelFieldHelp></span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
      {saveResults && <Button asChild variant="ghost" size="icon" className="h-7 w-7"><Link aria-label="Create Simulation" title="Create Simulation" href={`/dashboard/simulations/new?${draftParams}`}><Plus aria-hidden="true" className="h-3.5 w-3.5" /></Link></Button>}
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Refresh Simulations" title="Refresh Simulations" disabled={preparing || busy || loading} onClick={reload}><RotateCw className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Close Simulations" onClick={() => { stop(); setHidden(true); }}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
    {total > 1 && <label className="block text-left text-xs"><span className="sr-only">Simulation</span>
      <select aria-label="Simulation" value={selectedId} disabled={preparing || busy || loading} onChange={event => { setSelectedId(event.target.value); setLaunch(null); setRequest(0); setStopRequest(0); setState(null); setError(''); setRunError(''); }}
        className="h-8 w-full rounded-md border border-foreground/15 bg-background/60 px-2 text-xs">
        <option value="">Choose a Simulation</option>{selectedId && !rows.some(row => String(row.id) === selectedId) && <option value={selectedId}>{launch?.simulation.name ?? 'Selected Simulation'}</option>}
        {rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
      </select>
      {total > 25 && <span className="mt-1 flex items-center justify-between"><Button variant="ghost" size="sm" disabled={!page || preparing || busy || loading} onClick={() => setPage(value => value - 1)}>Previous</Button>Page {page + 1} of {Math.ceil(total / 25)}<Button variant="ghost" size="sm" disabled={(page + 1) * 25 >= total || preparing || busy || loading} onClick={() => setPage(value => value + 1)}>Next</Button></span>}
    </label>}
    <Button className="h-8 w-full bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 disabled:bg-muted/60 disabled:text-muted-foreground"
      aria-busy={preparing || busy}
      aria-describedby="simulation-launch-status" disabled={!preparing && !busy && !!disabledReason} onClick={() => preparing || busy ? stop() : void start()}>
      {preparing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : busy ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      {preparing ? 'Preparing… · Stop' : busy ? 'Stop Simulation' : 'Run Simulation'}
    </Button>
    <div id="simulation-launch-status" role="status" className={error || runError || preparing || busy || state || (disabledReason && selectedId) ? 'text-left text-[11px]' : 'sr-only'}>
      {error || runError || (preparing ? readiness ?? 'Preparing the Simulation’s participants…' : busy ? 'Simulation running…'
        : disabledReason ?? (state ? `Simulation ${state.phase}${state.reason ? ` · ${state.reason}` : ''}` : `Ready · ${selectedRow?.name ?? launch?.simulation.name}`))}
    </div>
    {!loading && !total && !preparing && !busy && <div className="mt-1 space-y-2 rounded-lg border border-foreground/15 bg-background/90 p-2 text-left text-xs backdrop-blur-md">
      {saveResults ? <>
        <ol className="list-inside list-decimal space-y-1 text-[11px]">
          <li>Prepare a Simulation and choose its participants and target Sensors.</li>
          <li>Save the Simulation with Active enabled, then refresh here.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-emerald-700 underline dark:text-emerald-300" href={`/dashboard/simulations/new?${draftParams}`}>Prepare Simulation</Link>
          <Link className="text-muted-foreground underline" href={`/admin/threed/simulations?projectId=${context.projectId}`}>Review saved Simulations</Link>
        </div>
      </> : <p>The Project owner needs to make an active Simulation available. Refresh after the owner saves it.</p>}
    </div>}
    {launch && <details className="mt-1 max-h-[min(28rem,calc(100dvh-13rem))] overflow-y-auto rounded-lg border border-foreground/15 bg-background/90 p-2 text-left text-xs backdrop-blur-md">
      <summary className="cursor-pointer">Simulation details · {launch.simulation.name}</summary>
      <ProjectSimulationControls context={context} subscribeSensors={subscribeSensors} launch={{ ...launch, saveResults, request, stopRequest, onStatus }} />
    </details>}
    {ToastComponent}
  </div>;
}
