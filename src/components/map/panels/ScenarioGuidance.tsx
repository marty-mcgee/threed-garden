'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Compass, Goal, Radar } from 'lucide-react';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import type { RuntimeMarker } from '@/libraries/types/map';
import { evaluateScenario, type ScenarioKind } from '@/libraries/services/threed/scenario-core';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import { useFarmBotLiveState } from '@/components/map/useFarmBotLiveState';

function Observation({ marker, projectId }: { marker: RuntimeMarker; projectId: string }) {
  const { state, loading, error } = useFarmBotLiveState({ projectId, farmbotId: Number(marker.data?.id) });
  return <p className="rounded-md bg-sky-500/10 px-2.5 py-2 text-xs" role="status">{marker.name}: {error ? 'Observation unavailable' : state ? state.condition : loading ? 'Reading observation…' : 'No observation available'}. Read-only; separate from setup checks.</p>;
}

export function ScenarioGuidance({ markers, projectId }: { markers: RuntimeMarker[]; projectId: string }) {
  const [kind, setKind] = useState<ScenarioKind>('soccer');
  const [environmentId, setEnvironmentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [farmbotId, setFarmbotId] = useState('');
  const workspace = useSensorGroups();
  const groups = workspace && !workspace.loading && !workspace.error ? workspace.groups : [];
  const active = markers.filter(marker => marker.isActive);
  const checks = evaluateScenario({ kind, environmentId, groupId, groupIds: groups.map(group => group.id),
    assets: markers.map(marker => ({ id: marker.id, type: marker.type, active: marker.isActive,
      ball: isProjectModelMovableBall(marker.metadata), sensors: readPhysicsSensorCuboids(marker.metadata) })) });
  const observed = active.find(marker => marker.type === 'farmbots' && marker.id === farmbotId);
  const completed = checks.filter(check => check.complete).length;
  const inputClass = 'mt-1.5 w-full rounded-md border border-foreground/15 bg-background/50 px-2.5 py-2 text-xs text-foreground';
  return <section className="mt-3 space-y-3 rounded-lg border border-foreground/15 bg-foreground/[0.03] p-3" aria-label="Scenario guidance">
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300"><Compass aria-hidden="true" className="h-4 w-4" /></span>
      <div><h3 className="text-sm font-semibold">Setup guide</h3><p className="text-[11px] text-muted-foreground">Selections are temporary.</p></div>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block text-xs font-medium">Scenario type
        <select className={inputClass} value={kind} onChange={event => setKind(event.target.value as ScenarioKind)}>
          <option value="soccer">Soccer</option><option value="farming">Farming</option>
        </select>
      </label>
      <label className="block text-xs font-medium">{kind === 'soccer' ? 'Field Model' : 'Environment Model'}
        <select className={inputClass} value={environmentId} onChange={event => setEnvironmentId(event.target.value)}>
          <option value="">Choose an assigned Model</option>
          {active.filter(marker => marker.type === 'models').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
        </select>
      </label>
      {kind === 'soccer' && <label className="block text-xs font-medium">Sensor Group
        <select className={inputClass} value={groupId} onChange={event => setGroupId(event.target.value)} disabled={!workspace || workspace.loading || !!workspace.error}>
          <option value="">{workspace?.loading ? 'Loading groups…' : workspace?.error || !workspace ? 'Groups unavailable' : 'Choose a group'}</option>
          {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </label>}
    </div>
    <div className="rounded-lg border border-foreground/10 bg-background/30 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs font-semibold"><Goal aria-hidden="true" className="h-4 w-4 text-sky-700 dark:text-sky-300" /> Setup checks</span><span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">{completed} / {checks.length} ready</span></div>
      <ul className="space-y-1.5 text-xs">{checks.map(check => <li key={check.id} className="flex items-start gap-2"><span className="sr-only">{check.complete ? 'Ready: ' : 'Needed: '}</span>{check.complete ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Circle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" />}<span className={check.complete ? 'text-foreground/75' : 'text-foreground'}>{check.label}</span></li>)}</ul>
    </div>
    {kind === 'soccer' ? <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><Radar aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-300" /><span>Edit sensors in Project Assets; view entries in Environment → Show Sensors. Counts reset each session; checks do not test ball collisions.</span></p> : <>
      <label className="block text-xs font-medium">FarmBot observation (optional)
        <select className={inputClass} value={farmbotId} onChange={event => setFarmbotId(event.target.value)}>
          <option value="">Choose an assigned FarmBot</option>
          {active.filter(marker => marker.type === 'farmbots').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
        </select>
      </label>
      {observed && <Observation key={observed.id} marker={observed} projectId={projectId} />}
      <p className="text-[11px] text-muted-foreground">Inspect positions in Project Assets. Observations do not move assets or send commands.</p>
    </>}
  </section>;
}
