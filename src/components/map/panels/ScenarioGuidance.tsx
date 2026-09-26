'use client';

import { useState } from 'react';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import type { RuntimeMarker } from '@/libraries/types/map';
import { evaluateScenario, type ScenarioKind } from '@/libraries/services/threed/scenario-core';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import { useFarmBotLiveState } from '@/components/map/useFarmBotLiveState';

function Observation({ marker, projectId }: { marker: RuntimeMarker; projectId: string }) {
  const { state, loading, error } = useFarmBotLiveState({ projectId, farmbotId: Number(marker.data?.id) });
  return <p className="mt-2 text-xs" role="status">{marker.name}: {error ? 'Observation unavailable' : state ? state.condition : loading ? 'Reading observation…' : 'No observation available'}. Read-only equipment observation; independent of setup readiness.</p>;
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
  const inputClass = 'mt-1 w-full rounded border border-white/15 p-1.5 text-xs';
  return <section className="mt-3 space-y-3 rounded-lg border border-white/15 p-3" aria-label="Scenario guidance">
    <h3 className="text-sm font-semibold">Scenario guidance</h3>
    <p className="text-xs text-white/70">Review this Project’s setup. Choices here last until guidance closes; they do not save or alter Scene assets.</p>
    <label className="block text-xs">Reference Scenario
      <select className={inputClass} value={kind} onChange={event => setKind(event.target.value as ScenarioKind)}>
        <option value="soccer">Soccer</option><option value="farming">Farming</option>
      </select>
    </label>
    <label className="block text-xs">{kind === 'soccer' ? 'Field Model' : 'Environment Model'}
      <select className={inputClass} value={environmentId} onChange={event => setEnvironmentId(event.target.value)}>
        <option value="">Choose an assigned Model</option>
        {active.filter(marker => marker.type === 'models').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
      </select>
    </label>
    {kind === 'soccer' && <label className="block text-xs">Sensor Group
      <select className={inputClass} value={groupId} onChange={event => setGroupId(event.target.value)} disabled={!workspace || workspace.loading || !!workspace.error}>
        <option value="">{workspace?.loading ? 'Loading groups…' : workspace?.error || !workspace ? 'Groups unavailable' : 'Choose a group'}</option>
        {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select>
    </label>}
    <p className="text-xs font-medium">{checks.filter(check => check.complete).length} / {checks.length} setup checks met</p>
    <ul className="space-y-1 text-xs">{checks.map(check => <li key={check.id}><span className={check.complete ? 'text-emerald-300' : 'text-amber-200'}>{check.complete ? 'Ready' : 'Needed'}</span> · {check.label}</li>)}</ul>
    {kind === 'soccer' ? <p className="text-xs text-white/70">Use Project Assets to edit sensors and their groups. Verify each sensor’s placement, then use Environment → Show Sensors to observe entries and reset counts. Counts are session-only. Setup checks do not prove ball entry or collision behavior.</p> : <>
      <label className="block text-xs">Read a FarmBot observation (optional)
        <select className={inputClass} value={farmbotId} onChange={event => setFarmbotId(event.target.value)}>
          <option value="">Choose an assigned FarmBot</option>
          {active.filter(marker => marker.type === 'farmbots').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
        </select>
      </label>
      {observed && <Observation key={observed.id} marker={observed} projectId={projectId} />}
      <p className="text-xs text-white/70">Inspect saved asset positions in Project Assets. Equipment observations do not move assets or send device commands.</p>
    </>}
  </section>;
}
