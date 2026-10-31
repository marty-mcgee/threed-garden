'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SoccerSimulationRunner, type SimulationRunState } from '@/libraries/services/threed/simulations/soccer-simulation-runner';
import { captureMultimediaSimulation, multimediaSimulationReadiness } from '@/libraries/services/threed/simulations/multimedia-simulation';
import { simulationActionLabel } from '@/libraries/services/threed/simulations/simulation-input';
import { simulationSensorSnapshot, simulationObservesSensor, type SoccerSceneContext } from '@/libraries/services/threed/simulations/soccer-simulation-scene';
import { simulationResultJournal, type SimulationRunStart } from '@/libraries/services/threed/simulations/simulation-result-journal';
import type { SimulationLaunch } from '@/libraries/services/threed/simulations/simulation-launch';
import type { SimulationResultReport } from '@/libraries/services/threed/simulations/simulation-result-input';
import { NAVIGATION_REQUEST, NAVIGATION_STATUS, type NavigationRequest } from '@/libraries/services/threed/orchestration/navigation-events';
import type { ThreeDPhysicsEventV1 } from '@/libraries/services/threed/physics/physics-event-core';
import { isMultimediaAction } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { useSceneMultimedia } from './SceneMultimediaProvider';
import { Button } from '@/components/ui/button';
import { THREED_MODEL_PLACEMENT_EVENT } from '@/libraries/services/threed/models/project-model-instance-core';

export type MultimediaSimulationProps = {
  context: SoccerSceneContext;
  subscribeSensors: (listener: (event: Readonly<ThreeDPhysicsEventV1>) => void) => () => void;
  launch: SimulationLaunch & {
    saveResults: boolean;
    request: number;
    stopRequest: number;
    onStatus: (busy: boolean, state: SimulationRunState | null, error?: string) => void;
  };
};

/** Uses the existing correlated runner/journal; Multimedia never drives a rig mixer. */
export function MultimediaSimulationControls({ context, subscribeSensors, launch }: MultimediaSimulationProps) {
  const multimedia = useSceneMultimedia();
  const [state, setState] = useState<SimulationRunState | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const current = useRef({
    context,
    launch,
    multimedia
  });
  current.current = {
    context,
    launch,
    multimedia
  };
  const runner = useRef<SoccerSimulationRunner | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const consumed = useRef(0);
  const stopped = useRef(0);
  const reply = useRef<((value: import('@/libraries/services/threed/simulations/soccer-simulation-runner').SimulationReply) => void) | null>(null);
  const running = state?.phase === 'running';
  const readiness = multimedia ? multimediaSimulationReadiness(launch.simulation, context) : 'Project Multimedia is not ready.';

  useEffect(() => { launch.onStatus(checking || running, state, error); }, [checking, running, state, error, launch.onStatus]);
  function stop(reason = 'Stopped by user.') {
    if (lock.current || runner.current?.running) setError(reason);
    abort.current?.abort();
    abort.current = null;
    lock.current = false;
    runner.current?.stop(reason);
    setChecking(false);
  }
  useEffect(() => () => stop('Scene or Simulation closed.'), []);
  useEffect(() => () => stop('Simulation selection changed.'), [launch.simulation.id, launch.simulation.revision]);
  useEffect(() => {
    if (launch.stopRequest !== stopped.current) {
      stopped.current = launch.stopRequest;
      stop();
    }
  }, [launch.stopRequest]);
  useEffect(() => {
    if (launch.request !== consumed.current) {
      consumed.current = launch.request;
      void run();
    }
  }, [launch.request]);
  useEffect(() => {
    if (runner.current?.running && readiness) stop(readiness);
  }, [readiness]);

  async function run() {
    if (lock.current || runner.current?.running) return;
    const initial = current.current;
    if (!initial.multimedia || readiness) { setError(readiness || 'Project Multimedia is unavailable.'); return; }
    const player = initial.multimedia.player;
    const controller = new AbortController();
    abort.current = controller;
    lock.current = true;
    setChecking(true);
    setState(null);
    setError('');
    setResult('');
    let capture: SimulationRunStart | null = null;
    let terminal = false;
    const original = initial.launch.simulation;
    let captured = original;
    let observations = simulationSensorSnapshot(original, initial.context);
    let latestReadings = observations;
    let activeInstance: SoccerSimulationRunner | null = null;
    const finish = (phase: SimulationResultReport['phase'], outcomes: SimulationRunState['outcomes'], reason?: string) => {
      if (!capture || terminal) return;
      terminal = true;
      if (!initial.launch.saveResults || !simulationResultJournal.list().some(entry => entry.start.runId === capture!.runId)) return;
      setResult('Saving result…');
      void simulationResultJournal.finish(capture.runId, {
        version: 1,
        source: 'browser-scene',
        phase,
        clientStartedAt: capture.clientStartedAt,
        clientEndedAt: Date.now(),
        outcomes,
        observations,
        ...(reason ? { reason: reason.slice(0, 200) } : {}),
      }).then(() => {
        const entry = simulationResultJournal.list().find(item => item.start.runId === capture!.runId);
        setResult(entry?.status === 'saved' ? 'Result saved.' : `Result not saved: ${entry?.error ?? 'Retry saving results.'}`);
      }).catch(cause => setResult(cause instanceof Error ? cause.message : 'Result save failed.'));
    };
    try {
      const response = await fetch(`/api/project/simulations?projectId=${original.projectId}&id=${original.id}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !body.success) throw Error(body.error || 'Simulation is unavailable.');
      captured = captureMultimediaSimulation(body.data.simulation, original);
      if (captured.id !== original.id || captured.revision !== original.revision || JSON.stringify(captured.definition) !== JSON.stringify(original.definition)) throw Error('Simulation changed. Review its details and Run again.');
      const ready = multimediaSimulationReadiness(captured, current.current.context);
      if (ready) throw Error(ready);
      capture = {
        simulationId: captured.id,
        revision: captured.revision,
        runId: crypto.randomUUID(),
        clientStartedAt: Date.now(),
      };
      observations = simulationSensorSnapshot(captured, current.current.context);
      latestReadings = observations;
      // Capture must complete before any navigation or Multimedia command dispatch.
      if (initial.launch.saveResults) await simulationResultJournal.begin(capture, captured.projectId);
      if (controller.signal.aborted) { finish('cancelled', [], 'Stopped during run capture.'); return; }
      const first = captured.definition.steps[0];
      const membership = JSON.stringify(current.current.context.sensorMembers);
      let requestId = '';
      let observed = 0;
      const validate = () => multimediaSimulationReadiness(captured, current.current.context)
        ?? (JSON.stringify(current.current.context.sensorMembers) !== membership ? 'Sensor membership changed.' : null)
        ?? (current.current.launch.simulation.id !== captured.id || current.current.launch.simulation.revision !== captured.revision ? 'Simulation selection changed.' : null);
      const instance = new SoccerSimulationRunner({
        capture: captureMultimediaSimulation,
        requestId: () => crypto.randomUUID(),
        now: () => Date.now(),
        schedule: (callback, ms) => setTimeout(callback, ms),
        clear: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
        validate,
        subscribe: receive => {
          reply.current = receive;
          const navigation = (event: Event) => {
            const value = (event as CustomEvent).detail;
            if (value && value.phase !== 'walking') receive({
              ...value,
              kind: 'navigation',
              success: value.phase === 'arrived',
              reason: value.phase === 'arrived' ? undefined : `Navigation ${value.phase}`
            });
          };
          const manual = (event: KeyboardEvent) => { if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Escape'].includes(event.code)) instance.stop('Manual control interrupted the Simulation.'); };
          const pageHide = () => instance.stop('Scene closed.');
          const navigationRequest = (event: Event) => {
            const value = (event as CustomEvent<NavigationRequest>).detail;
            if (value?.actorMarkerId === first.actorMarkerId && value.requestId !== requestId && !value.cancelRequestId) instance.stop('Character navigation changed.');
          };
          const placement = (event: Event) => {
            const value = (event as CustomEvent).detail;
            if (value?.projectId === captured.projectId && [first.actorMarkerId, first.targetMarkerId].includes(value.markerId)) instance.stop('A Simulation participant was repositioned.');
          };
          const action = (event: Event) => {
            const value = (event as CustomEvent).detail;
            if ((value?.markerId === first.actorMarkerId || (!value?.markerId && value?.characterId === current.current.context.controlledCharacterId))
              && value?.target?.actionRequestId !== requestId) instance.stop('Another Character Action interrupted the Simulation.');
          };
          const unsubscribeCommands = player.subscribeCommands((command, id) => {
            if ((command.markerId === null || command.markerId === first.targetMarkerId) && id !== requestId) instance.stop('Another Multimedia Action interrupted the Simulation.');
          });
          const unsubscribeSensors = subscribeSensors(event => {
            if (event.projectId !== captured.projectId || !event.sensor) return;
            const member = current.current.context.sensorMembers.find(item => item.ownerMarkerId === event.sensor!.ownerMarkerId && item.id === event.sensor!.id);
            const source = member && captured.definition.observations.find(item => simulationObservesSensor(item, member));
            if (!source) return;
            latestReadings = simulationSensorSnapshot(captured, current.current.context);
            if (observed++ >= 256) { observations = observations.map(item => ({
              ...item,
              truncated: true
            })); return; }
            observations = observations.map(item => item.groupId === source.sensorGroupId ? {
              ...item,
              events: item.events + 1
            } : item);
          });
          const timer = setInterval(() => { const reason = validate(); if (reason) instance.stop(reason); else latestReadings = simulationSensorSnapshot(captured, current.current.context); }, 200);
          window.addEventListener(NAVIGATION_STATUS, navigation);
          window.addEventListener(NAVIGATION_REQUEST, navigationRequest);
          window.addEventListener('keydown', manual);
          window.addEventListener('pagehide', pageHide);
          window.addEventListener(THREED_MODEL_PLACEMENT_EVENT, placement);
          window.addEventListener('garden-character-action', action);
          return () => {
            clearInterval(timer);
            unsubscribeCommands();
            unsubscribeSensors();
            if (reply.current === receive) reply.current = null;
            window.removeEventListener(NAVIGATION_STATUS, navigation);
            window.removeEventListener(NAVIGATION_REQUEST, navigationRequest);
            window.removeEventListener('keydown', manual);
            window.removeEventListener('pagehide', pageHide);
            window.removeEventListener(THREED_MODEL_PLACEMENT_EVENT, placement);
            window.removeEventListener('garden-character-action', action);
          };
        },
        dispatch: (step, id) => {
          requestId = id;
          if (step.action === 'runToTarget') {
            window.dispatchEvent(new CustomEvent<NavigationRequest>(NAVIGATION_REQUEST, { detail: {
              requestId: id,
              actorMarkerId: step.actorMarkerId,
              targetMarkerId: step.targetMarkerId,
              command: 'run'
            } }));
          } else {
            if (!isMultimediaAction(step.action) || !step.multimedia) throw Error('Multimedia command is unavailable.');
            void player.execute({
              projectId: captured.projectId,
              markerId: step.targetMarkerId,
              actorMarkerId: step.actorMarkerId,
              ...step.multimedia,
              action: step.action
            }, id, controller.signal)
              .then(() => instanceReply(true)).catch(cause => instanceReply(false, cause instanceof Error ? cause.message : 'Multimedia failed.'));
            function instanceReply(success: boolean, reason?: string) {
              // Replies use the same channel installed by subscribe, without a global event.
              reply.current?.({
                requestId: id,
                actorMarkerId: step.actorMarkerId,
                targetMarkerId: step.targetMarkerId,
                projectId: captured.projectId,
                kind: 'multimedia',
                success,
                reason
              });
            }
          }
        },
        cancel: (step, id) => {
          if (step.action === 'runToTarget') window.dispatchEvent(new CustomEvent<NavigationRequest>(NAVIGATION_REQUEST, { detail: {
            requestId: crypto.randomUUID(),
            actorMarkerId: step.actorMarkerId,
            targetMarkerId: step.targetMarkerId,
            command: 'stop',
            cancelRequestId: id
          } }));
          else player.cancel(id);
        },
        update: next => {
          setState(next);
          if (next.phase === 'running') return;
          lock.current = false;
          const final = current.current.context.projectId === captured.projectId ? simulationSensorSnapshot(captured, current.current.context) : latestReadings;
          observations = observations.map(item => {
            const next = final.find(value => value.groupId === item.groupId);
            return {
              ...item,
              final: next?.final ?? item.baseline,
              delta: (next?.final ?? item.baseline) - item.baseline,
              countersReset: (next?.final ?? item.baseline) < item.baseline,
              sensors: item.sensors.map(sensor => ({
                ...sensor,
                final: next?.sensors.find(value => value.ownerMarkerId === sensor.ownerMarkerId && value.id === sensor.id)?.final ?? sensor.baseline
              })),
            };
          });
          finish(next.phase, next.outcomes, next.reason);
        },
      });
      runner.current = instance;
      activeInstance = instance;
      instance.start(captured, capture.runId);
    } catch (cause) {
      activeInstance?.stop('Simulation could not continue.');
      const message = cause instanceof Error ? cause.message : 'Simulation failed.';
      finish(controller.signal.aborted ? 'cancelled' : 'failed', [], message);
      if (!controller.signal.aborted && abort.current === controller) setError(message);
    } finally {
      if (abort.current === controller) {
        setChecking(false);
        if (!runner.current?.running) lock.current = false;
      }
    }
  }
  return <section aria-label="Multimedia Simulation" className="mt-2 space-y-2 border-t pt-2 text-xs">
    <p>Multimedia commands execute on the saved target's Project Albums. Play completes when playback starts.</p>
    {readiness && !running && <p role="status">{readiness}</p>}
    {error && <p role="alert">{error}</p>}
    {state && <ol className="space-y-1">{state.outcomes.map(outcome => <li key={outcome.requestId}>{simulationActionLabel(outcome.action)}: {outcome.status}{outcome.reason ? ` · ${outcome.reason}` : ''}</li>)}</ol>}
    {result && <p role="status">{result}</p>}
    {launch.saveResults && simulationResultJournal.list().some(entry => entry.projectId === context.projectId && entry.status === 'error' && entry.report) && <Button size="xs" variant="outline" onClick={() => void simulationResultJournal.retry(context.projectId!).then(() => setResult('Result save retried.')).catch(cause => setResult(cause.message))}>Retry saving results</Button>}
    {launch.saveResults && state && simulationResultJournal.list().some(entry => entry.start.runId === state.runId && entry.status === 'saved') && <Link className="underline" href={`/admin/threed/simulation-results/${state.runId}`}>View saved Result</Link>}
  </section>;
}
