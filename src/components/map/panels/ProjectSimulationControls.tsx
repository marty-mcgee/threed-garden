'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { FlaskConical, Play, Square, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { useAnimationActionSlots } from '@/components/admin/threed/animations/AnimationActionSlots';
import { getCharacterAnimationAvailability, subscribeCharacterAnimationAvailability } from '@/libraries/services/threed/animations/runtime-availability';
import { NAVIGATION_REQUEST, NAVIGATION_STATUS, type NavigationRequest } from '@/libraries/services/threed/orchestration/navigation-events';
import { defaultKickCollisionPoints } from '@/libraries/services/threed/physics/action-collision-core';
import { THREED_SOCCER_KICK_REQUEST_EVENT, THREED_SOCCER_KICK_RESULT_EVENT, THREED_SOCCER_KICK_CANCEL_EVENT,
  THREED_CHARACTER_ACTION_CANCEL_EVENT, type SoccerKickResult } from '@/libraries/services/threed/physics/soccer-kick-core';
import { THREED_MODEL_PLACEMENT_EVENT, isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import type { ThreeDPhysicsEventV1 } from '@/libraries/services/threed/physics/physics-event-core';
import { captureSoccerSimulation, SoccerSimulationRunner, type SoccerSimulation, type SimulationRunState, type SimulationReply } from '@/libraries/services/threed/simulations/soccer-simulation-runner';
import { soccerSimulationReadiness, soccerSimulationKickReady, simulationSensorSnapshot, type SoccerSceneContext,
  simulationObservesSensor, type SimulationSensorObservation, type SoccerKickMapping } from '@/libraries/services/threed/simulations/soccer-simulation-scene';
import { simulationActionLabel } from '@/libraries/services/threed/simulations/simulation-input';
import { simulationResultJournal, type SimulationRunStart } from '@/libraries/services/threed/simulations/simulation-result-journal';
import type { SimulationResultReport } from '@/libraries/services/threed/simulations/simulation-result-input';

type Summary = Pick<SoccerSimulation, 'id' | 'name' | 'revision'>;
type Props = { context: SoccerSceneContext; subscribeSensors: (listener: (event: Readonly<ThreeDPhysicsEventV1>) => void) => () => void };
async function read(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Simulation unavailable.');
  return result;
}

export function ProjectSimulationControls({ context, subscribeSensors }: Props) {
  const { showToast, ToastComponent } = useToast();
  const { slots } = useAnimationActionSlots();
  useSyncExternalStore(simulationResultJournal.subscribe, simulationResultJournal.snapshot, () => 0);
  const [rows, setRows] = useState<Summary[]>([]), [page, setPage] = useState(0), [total, setTotal] = useState(0), [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState(''), [simulation, setSimulation] = useState<SoccerSimulation | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [checking, setChecking] = useState(false);
  const [state, setState] = useState<SimulationRunState | null>(null), [observations, setObservations] = useState<SimulationSensorObservation[]>([]);
  const current = useRef(context); current.current = context;
  const runner = useRef<SoccerSimulationRunner | null>(null), runAbort = useRef<AbortController | null>(null);
  const runLock = useRef(false), activeRequest = useRef('');
  const observationSubscription = useRef<(() => void) | null>(null);
  const selectedActor = context.markers.find(marker => marker.id === simulation?.definition.steps[0]?.actorMarkerId);
  const availability = useSyncExternalStore(subscribeCharacterAnimationAvailability,
    () => getCharacterAnimationAvailability(Number(selectedActor?.data?.id), String(selectedActor?.data?.model?.filePath ?? '')), () => null);
  const slot = slots.find(slot => slot.isActive !== false && defaultKickCollisionPoints(slot.name).length && availability?.has(slot.actionKey.toLowerCase()));
  const mapping: SoccerKickMapping | null = slot ? { action: slot.actionKey, points: defaultKickCollisionPoints(slot.name) } : null;
  const currentMapping = useRef(mapping); currentMapping.current = mapping;
  const scenarioId = context.scenario?.scenarioId, threedId = context.scenario?.threedId, sequence = context.scenario?.sequence;
  const running = state?.phase === 'running';
  const readiness = simulation ? soccerSimulationReadiness(simulation, context, mapping) : null;
  const controlledActor = context.markers.find(marker => marker.type === 'characters' && Number(marker.data?.id) === context.controlledCharacterId);
  const draftParams = new URLSearchParams({ projectId: String(context.projectId ?? ''), recipe: 'soccer', threedId: String(threedId ?? ''), scenarioId: String(scenarioId ?? ''),
    actorMarkerId: controlledActor?.id ?? '', ballMarkerId: context.target?.type === 'models' ? context.target.markerId : '', sensorGroupId: context.scenario?.groupId ?? '' });
  const targetBall = context.markers.find(marker => marker.id === context.target?.markerId && marker.type === 'models' && isProjectModelMovableBall(marker.metadata));
  const preparation = [
    { label: 'Saved Scenario started', ready: !!scenarioId && !!threedId },
    { label: 'Character controlled', ready: !!controlledActor },
    { label: 'Movable ball targeted', ready: !!targetBall },
    { label: 'Active Simulation selected', ready: !!simulation },
    { label: 'Runtime ready', ready: !!simulation && !readiness },
  ];
  const pendingResults = simulationResultJournal.list().filter(entry => entry.projectId === context.projectId && entry.status === 'error' && entry.report);
  const resultEntry = simulationResultJournal.list().find(entry => entry.start.runId === state?.runId);

  useEffect(() => {
    setPage(0); setSelectedId(''); setSimulation(null); setState(null); setObservations([]); setError(''); setChecking(false);
    return () => {
      runAbort.current?.abort(); runAbort.current = null; runLock.current = false;
      runner.current?.stop('Project or Scenario changed.'); runner.current = null;
      observationSubscription.current?.(); observationSubscription.current = null;
    };
  }, [context.projectId, scenarioId, threedId, sequence]);

  useEffect(() => {
    if (!context.allowed || !context.projectId || !scenarioId || !threedId) { setRows([]); setTotal(0); return; }
    const controller = new AbortController(); setLoading(true); setRows([]); setTotal(0); setError('');
    const params = new URLSearchParams({ projectId: String(context.projectId), threedId: String(threedId), scenarioId: String(scenarioId), isActive: 'true', limit: '25', offset: String(page * 25) });
    read(`/api/threed/simulations?${params}`, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      const count = Number(result.pagination?.total ?? 0);
      if (page && page * 25 >= count) { setPage(Math.max(0, Math.ceil(count / 25) - 1)); return; }
      setRows(result.data); setTotal(count);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Simulations unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [context.allowed, context.projectId, scenarioId, threedId, page, refresh]);

  useEffect(() => {
    if (!selectedId) { setSimulation(null); return; }
    const controller = new AbortController(); setSimulation(null); setError(''); setLoading(true);
    read(`/api/threed/simulations?id=${selectedId}`, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (result.data.id !== Number(selectedId)) throw new Error('Simulation unavailable.');
      setSimulation(captureSoccerSimulation(result.data, { projectId: context.projectId!, scenarioId, threedId }));
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Simulation unavailable.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedId, context.projectId, scenarioId, threedId, refresh]);

  // Context changes are observed even while this panel is visually collapsed/obscured.
  useEffect(() => {
    if (!runner.current?.running || !simulation) return;
    const reason = soccerSimulationReadiness(simulation, context, mapping);
    if (reason) runner.current.stop(reason);
  }, [context, simulation, mapping]);

  function stop() {
    runAbort.current?.abort(); runAbort.current = null; runLock.current = false; setChecking(false);
    runner.current?.stop();
  }
  async function run() {
    if (!simulation || runLock.current || runner.current?.running) return;
    const initialReason = soccerSimulationReadiness(simulation, current.current, currentMapping.current);
    if (initialReason) { showToast(initialReason, 'error'); return; }
    const controller = new AbortController(); runAbort.current = controller; runLock.current = true; setChecking(true); setError('');
    const binding = { projectId: simulation.projectId, threedId: simulation.threedId, scenarioId: simulation.scenarioId! };
    const startedScenario = current.current.scenario!;
    let capture: SimulationRunStart | null = null, initialObservations: SimulationSensorObservation[] = [], terminalReported = false, activeInstance: SoccerSimulationRunner | null = null;
    const finalizeCapture = (phase: SimulationResultReport['phase'], reason: string) => {
      if (!capture || terminalReported || !simulationResultJournal.list().some(entry => entry.start.runId === capture!.runId)) return;
      terminalReported = true;
      void simulationResultJournal.finish(capture.runId, { version: 1, source: 'browser-scene', phase,
        clientStartedAt: capture.clientStartedAt, clientEndedAt: Date.now(), outcomes: [], observations: initialObservations, reason: reason.slice(0, 200) }).catch(() => {});
    };
    try {
      // Re-read exact owner records and module membership immediately before execution.
      const [latest, savedScenario, choices] = await Promise.all([
        read(`/api/threed/simulations?id=${simulation.id}`, controller.signal),
        read(`/api/threed/scenarios?id=${binding.scenarioId}`, controller.signal),
        read(`/api/threed/simulations?options=1&projectId=${binding.projectId}&threedId=${binding.threedId}`, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      const captured = captureSoccerSimulation(latest.data, binding);
      if (captured.id !== simulation.id) throw new Error('Simulation unavailable.');
      if (captured.revision !== simulation.revision) { setSimulation(captured); throw new Error('This Simulation changed. Review the updated Actions, then Run again.'); }
      const scenario = savedScenario.data;
      if (scenario.id !== binding.scenarioId || !scenario.isActive || scenario.projectId !== binding.projectId || scenario.threedId !== binding.threedId
        || scenario.setup?.kind !== 'soccer' || scenario.setup.environmentMarkerId !== startedScenario.environmentMarkerId
        || scenario.setup.sensorGroupId !== startedScenario.groupId) throw new Error('Scenario settings changed. Reload and start its saved setup.');
      for (const step of captured.definition.steps) {
        if (!choices.data.markers.some((marker: { markerId: string; movableCharacter: boolean }) => marker.markerId === step.actorMarkerId && marker.movableCharacter)
          || !choices.data.markers.some((marker: { markerId: string; movableBall: boolean }) => marker.markerId === step.targetMarkerId && marker.movableBall)) throw new Error('Save the Character and ball assignments in this Project module before running.');
      }
      const reason = soccerSimulationReadiness(captured, current.current, currentMapping.current);
      if (reason || current.current.scenario?.sequence !== startedScenario.sequence) throw new Error(reason || 'Scenario changed.');
      capture = { simulationId: captured.id, revision: captured.revision, runId: crypto.randomUUID(), clientStartedAt: Date.now() };
      initialObservations = simulationSensorSnapshot(captured, current.current);
      await simulationResultJournal.begin(capture, binding.projectId);
      if (controller.signal.aborted) { finalizeCapture('cancelled', 'Stopped during run capture.'); return; }
      const afterCaptureReason = soccerSimulationReadiness(captured, current.current, currentMapping.current);
      if (afterCaptureReason || current.current.scenario?.sequence !== startedScenario.sequence) throw new Error(afterCaptureReason || 'Scenario changed during run capture.');
      const actor = captured.definition.steps[0].actorMarkerId, ball = captured.definition.steps[0].targetMarkerId;
      const characterId = Number(current.current.markers.find(marker => marker.id === actor)?.data?.id);
      const kick = currentMapping.current;
      let readings = simulationSensorSnapshot(captured, current.current), observedEvents = 0;
      let latestReadings = readings;
      const members = current.current.sensorMembers.map(member => ({ ...member }));
      const membership = (scene: SoccerSceneContext) => JSON.stringify(scene.sensorMembers.map(member => [member.ownerMarkerId, member.id, member.groupId, member.behavior]));
      const savedMembership = membership(current.current);
      const validateContext = () => soccerSimulationReadiness(captured, current.current, currentMapping.current)
        ?? (current.current.scenario?.sequence !== startedScenario.sequence ? 'Scenario changed.' : null)
        ?? (membership(current.current) !== savedMembership ? 'Sensor membership changed.' : null)
        ?? (kick && (kick.action !== currentMapping.current?.action || JSON.stringify(kick.points) !== JSON.stringify(currentMapping.current?.points)) ? 'Foot-kick mapping changed.' : null);
      const finishObservations = () => {
        observationSubscription.current?.(); observationSubscription.current = null;
        const final = current.current.projectId === binding.projectId && current.current.scenario?.scenarioId === binding.scenarioId
          ? simulationSensorSnapshot(captured, current.current) : latestReadings;
        readings = readings.map(item => { const group = final.find(next => next.groupId === item.groupId), count = group?.final ?? item.baseline;
          return { ...item, final: count, delta: count - item.baseline, countersReset: count < item.baseline,
            sensors: item.sensors.map(sensor => ({ ...sensor, final: group?.sensors.find(next => next.ownerMarkerId === sensor.ownerMarkerId && next.id === sensor.id)?.final ?? sensor.baseline })) }; });
        setObservations(readings);
        return readings;
      };
      const emitCancel = (requestId: string, action: string) => {
        if (action === 'runToTarget') window.dispatchEvent(new CustomEvent<NavigationRequest>(NAVIGATION_REQUEST, { detail: {
          requestId: crypto.randomUUID(), actorMarkerId: actor, targetMarkerId: ball, command: 'stop', cancelRequestId: requestId,
        } }));
        else {
          const detail = { requestId, projectId: binding.projectId, characterMarkerId: actor, ballMarkerId: ball };
          window.dispatchEvent(new CustomEvent(THREED_SOCCER_KICK_CANCEL_EVENT, { detail }));
          window.dispatchEvent(new CustomEvent(THREED_CHARACTER_ACTION_CANCEL_EVENT, { detail }));
        }
      };
      const instance = new SoccerSimulationRunner({
        now: () => Date.now(), requestId: () => crypto.randomUUID(), schedule: (fn, ms) => setTimeout(fn, ms), clear: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
        subscribe: receive => {
          const navigation = (event: Event) => { const reply = (event as CustomEvent).detail;
            if (reply && reply.phase !== 'walking') receive({ ...reply, kind: 'navigation', success: reply.phase === 'arrived', reason: reply.phase === 'arrived' ? undefined : `Navigation ${reply.phase}: ${reply.reason ?? 'unavailable'}` }); };
          const result = (event: Event) => { const reply = (event as CustomEvent<SoccerKickResult>).detail;
            if (reply) receive({ requestId: reply.requestId, projectId: reply.projectId, targetMarkerId: reply.ballMarkerId, kind: 'kick', success: reply.applied === true, reason: reply.applied ? undefined : `Kick ${reply.reason ?? 'not applied'}` }); };
          const input = (event: KeyboardEvent) => { if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'Escape'].includes(event.code)) instance.stop('Manual control interrupted the Simulation.'); };
          const placement = (event: Event) => { const value = (event as CustomEvent).detail; if (value?.projectId === binding.projectId && [actor, ball, startedScenario.environmentMarkerId].includes(value.markerId)) instance.stop('A Simulation participant was repositioned.'); };
          const action = (event: Event) => { const value = (event as CustomEvent).detail; if ((value?.markerId === actor || (!value?.markerId && value?.characterId === characterId)) && value?.target?.actionRequestId !== activeRequest.current) instance.stop('Another Character Action interrupted the Simulation.'); };
          const navigationRequest = (event: Event) => { const value = (event as CustomEvent<NavigationRequest>).detail;
            if (value?.actorMarkerId === actor && value.requestId !== activeRequest.current && !value.cancelRequestId) instance.stop('Character navigation changed.'); };
          const pageHide = () => instance.stop('Scene page closed.');
          const monitor = setInterval(() => { const reason = validateContext();
            if (reason) instance.stop(reason);
            else latestReadings = simulationSensorSnapshot(captured, current.current);
          }, 100);
          window.addEventListener(NAVIGATION_STATUS, navigation); window.addEventListener(THREED_SOCCER_KICK_RESULT_EVENT, result);
          window.addEventListener('keydown', input); window.addEventListener(THREED_MODEL_PLACEMENT_EVENT, placement);
          window.addEventListener('garden-character-action', action); window.addEventListener(NAVIGATION_REQUEST, navigationRequest);
          window.addEventListener('pagehide', pageHide);
          return () => { clearInterval(monitor); window.removeEventListener(NAVIGATION_STATUS, navigation); window.removeEventListener(THREED_SOCCER_KICK_RESULT_EVENT, result);
            window.removeEventListener('keydown', input); window.removeEventListener(THREED_MODEL_PLACEMENT_EVENT, placement);
            window.removeEventListener('garden-character-action', action); window.removeEventListener(NAVIGATION_REQUEST, navigationRequest); window.removeEventListener('pagehide', pageHide); };
        },
        validate: step => validateContext()
          ?? (step.action === 'kickBall' && !soccerSimulationKickReady(captured, current.current) ? 'The ball moved out of kick range.' : null),
        dispatch: (step, requestId) => {
          activeRequest.current = requestId;
          if (step.action === 'runToTarget') window.dispatchEvent(new CustomEvent<NavigationRequest>(NAVIGATION_REQUEST, { detail: { requestId, actorMarkerId: actor, targetMarkerId: ball, command: 'run' } }));
          else if (kick) window.dispatchEvent(new CustomEvent(THREED_SOCCER_KICK_REQUEST_EVENT, { detail: { version: 1, requestId, projectId: binding.projectId,
            characterId, characterMarkerId: actor, ballMarkerId: ball, action: kick.action, timing: 'contact', pointIds: kick.points } }));
          else throw new Error('Foot-kick mapping unavailable.');
        },
        cancel: (step, requestId) => emitCancel(requestId, step.action),
        update: next => {
          setState(next);
          if (next.phase !== 'running') {
            activeRequest.current = ''; const finalObservations = finishObservations(); terminalReported = true;
            void simulationResultJournal.finish(next.runId, { version: 1, source: 'browser-scene', phase: next.phase,
              clientStartedAt: capture!.clientStartedAt, clientEndedAt: Date.now(), outcomes: next.outcomes, observations: finalObservations,
              ...(next.reason ? { reason: next.reason } : {}) }).catch(cause => showToast(cause instanceof Error ? cause.message : 'Result save failed.', 'error'));
            showToast(next.phase === 'completed' ? `Simulation completed${next.outcomes.some(item => item.action === 'kickBall') ? ': the ball received its contact kick.' : '.'}` : `Simulation ${next.phase}${next.reason ? `: ${next.reason}` : '.'}`, next.phase === 'completed' ? 'success' : next.phase === 'cancelled' ? 'info' : 'error');
          }
        },
      });
      runner.current = instance; activeInstance = instance;
      observationSubscription.current = subscribeSensors(event => {
        if (event.projectId !== binding.projectId || !event.sensor) return;
        const member = members.find(member => member.ownerMarkerId === event.sensor!.ownerMarkerId && member.id === event.sensor!.id);
        const source = member && captured.definition.observations.find(source => simulationObservesSensor(source, member));
        const groupId = source?.sensorGroupId;
        if (!groupId || !readings.some(item => item.groupId === groupId)) return;
        latestReadings = simulationSensorSnapshot(captured, current.current);
        if (observedEvents++ >= 256) { readings = readings.map(item => ({ ...item, truncated: true })); return; }
        readings = readings.map(item => item.groupId === groupId ? { ...item, events: item.events + 1 } : item);
      });
      setObservations([]); instance.start(captured, capture.runId);
    } catch (cause) {
      if (activeInstance?.running) activeInstance.stop('Simulation could not continue.');
      finalizeCapture(controller.signal.aborted ? 'cancelled' : 'failed', cause instanceof Error ? cause.message : 'Run preparation failed.');
      if (!controller.signal.aborted) { const message = cause instanceof Error ? cause.message : 'Simulation could not start.'; setError(message); showToast(message, 'error'); }
    } finally {
      if (runAbort.current === controller) { runAbort.current = null; runLock.current = false; setChecking(false); }
    }
  }

  if (!context.allowed || context.scenario?.kind !== 'soccer') return null;
  return <section aria-label="ThreeD Simulation" className="mt-2 space-y-2 border-t border-foreground/15 pt-2">
    <div className="flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5 text-cyan-500" /><h3 className="text-xs font-semibold">Simulation</h3>
      <ModelFieldHelp label="Scene Simulation">Take Control and choose the ball with Use as Action Target. Run captures a database record before executing Actions through current physics owners. Stop cancels pending work. Results report Scene activity and selected Sensors; unfinished browser sessions remain identifiable.</ModelFieldHelp>
      <Button aria-label="Refresh Simulations" variant="ghost" size="icon" className="ml-auto h-6 w-6" disabled={running || checking || loading} onClick={() => setRefresh(value => value + 1)}><RotateCw className="h-3 w-3" /></Button>
    </div>
    <ol aria-label="Simulation preparation" className="grid gap-1 text-[11px]">{preparation.map(item => <li key={item.label} className={item.ready ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}><span aria-hidden="true">{item.ready ? '✓' : '○'}</span> {item.label}</li>)}</ol>
    {!controlledActor && <p className="text-[11px] text-amber-600 dark:text-amber-300">Select your Character and choose Take Control.</p>}
    {controlledActor && !targetBall && <p className="text-[11px] text-amber-600 dark:text-amber-300">Select a movable ball and choose Use as Action Target.</p>}
    {!scenarioId || !threedId ? <p>Reload and start the saved Scenario to enable Simulations.</p> : <>
      <label className="block text-xs">Saved Simulation<select aria-label="Saved Simulation" className="mt-1 w-full rounded border border-foreground/15 bg-background/60 p-1.5 text-xs" value={selectedId} disabled={running || checking || loading} onChange={event => { setSelectedId(event.target.value); setState(null); setObservations([]); }}>
        <option value="">{loading ? 'Loading…' : 'Choose a Simulation'}</option>
        {selectedId && !rows.some(row => String(row.id) === selectedId) && <option value={selectedId}>{simulation?.name ?? 'Selected Simulation'}</option>}
        {rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
      </select></label>
      {total > 25 && <div className="flex items-center gap-2 text-[11px]"><span>Page {page + 1} of {Math.ceil(total / 25)}</span><Button variant="outline" size="sm" className="h-6 text-xs" disabled={!page || running || checking || loading} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outline" size="sm" className="h-6 text-xs" disabled={(page + 1) * 25 >= total || running || checking || loading} onClick={() => setPage(value => value + 1)}>Next</Button></div>}
      {!rows.length && !loading && !error && <p className="text-muted-foreground">No active Simulations linked to this Scenario. {controlledActor && targetBall ? <Link className="underline" href={`/admin/threed/simulations/new?${draftParams}`}>Prepare Soccer Simulation</Link> : <span>Take Control and target the ball to prepare a prefilled Simulation.</span>}</p>}
      {simulation && <><p className="text-[11px] text-muted-foreground">Character: {selectedActor?.name ?? 'Unavailable'} · Ball: {context.markers.find(marker => marker.id === simulation.definition.steps[0].targetMarkerId)?.name ?? 'Unavailable'} · Revision {simulation.revision}</p>
        <ol className="list-inside list-decimal text-xs">{simulation.definition.steps.map((step, index) => <li key={step.id} className={running && state.stepIndex === index ? 'text-cyan-500' : ''}>{simulationActionLabel(step.action)}</li>)}</ol>
        {readiness && !running && <p role="status" className="text-xs text-amber-600 dark:text-amber-300">{readiness}</p>}
      </>}
      <div className="flex items-center gap-2"><Button className="h-7 bg-emerald-600 text-xs text-white hover:bg-emerald-500" disabled={!simulation || !!readiness || running || checking || loading} onClick={run}><Play className="h-3 w-3" />{checking ? 'Checking…' : 'Run'}</Button>
        <Button variant="outline" className="h-7 text-xs" disabled={!running && !checking} onClick={stop}><Square className="h-3 w-3" /> Stop</Button></div>
      {state && <div role="status" className="space-y-1 text-xs"><p className="font-medium">{state.phase === 'running' ? `Running Action ${state.stepIndex + 1}` : `Simulation ${state.phase}`}</p>
        {state.reason && <p>{state.reason}</p>}<ul>{state.outcomes.map(item => <li key={item.requestId}>{simulationActionLabel(item.action)}: {item.status}{item.reason ? ` · ${item.reason}` : ''}</li>)}</ul></div>}
      {resultEntry && <p role="status" className="text-[11px] text-muted-foreground">{resultEntry.status === 'saved' ? `Result #${resultEntry.resultId} saved.` : resultEntry.status === 'error' ? `Result not saved: ${resultEntry.error}` : resultEntry.status === 'saving' ? 'Saving result…' : 'Run record captured.'}</p>}
      {!!observations.length && <details><summary className="cursor-pointer text-xs">Sensor observations during run</summary><p className="mt-1 text-[11px] text-muted-foreground">Run-window activity; a completed kick does not certify a goal. Counts remain shared.</p><ul className="text-[11px]">{observations.map(item => <li key={item.groupId}>{item.name}: {item.baseline} → {item.final} ({item.countersReset ? 'counter reset observed' : `+${item.delta}`}); {item.events} events{item.truncated ? ' (report limit reached)' : ''}</li>)}</ul></details>}
    </>}
    {!!pendingResults.length && <div role="alert" className="space-y-1 text-xs text-destructive"><p>{pendingResults.length} result{pendingResults.length === 1 ? '' : 's'} awaiting save. Retrying does not run Actions.</p><Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void simulationResultJournal.retry(context.projectId!)}>Retry result save</Button></div>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}{ToastComponent}
  </section>;
}
