'use client';

import { BookOpen, CheckCircle2, Circle, Compass, Goal, LayoutTemplate, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isProjectModelMovableBall } from '@/libraries/services/threed/models/project-model-instance-core';
import type { RuntimeMarker } from '@/libraries/types/map';
import { evaluateScenario, type ScenarioKind, type ScenarioStart } from '@/libraries/services/threed/scenario-core';
import { readPhysicsSensorCuboids } from '@/libraries/services/threed/physics/sensor-cuboid-core';
import { useSensorGroups } from '@/components/threed/physics/SensorGroupsWorkspace';
import { useFarmBotLiveState } from '@/components/map/useFarmBotLiveState';
import type { ProjectScenarioGuideState, ProjectScenarioSelection } from '@/libraries/services/threed/markers/project-view-state-core';

function Observation({ marker, projectId }: { marker: RuntimeMarker; projectId: string }) {
  const { state, loading, error } = useFarmBotLiveState({ projectId, farmbotId: Number(marker.data?.id) });
  return <p className="rounded-md bg-sky-500/10 px-2.5 py-2 text-xs" role="status">{marker.name}: {error ? 'Observation unavailable' : state ? state.condition : loading ? 'Reading observation…' : 'No observation available'}.</p>;
}

export function ScenarioGuidance({ markers, projectId, loadedScenario, guide, onGuideChange, onChooseTemplate, onClearLoaded, onStartScenario }: { markers: RuntimeMarker[]; projectId: string; loadedScenario: ProjectScenarioSelection | null; guide: ProjectScenarioGuideState; onGuideChange: (guide: ProjectScenarioGuideState) => void; onChooseTemplate: () => void; onClearLoaded: () => void; onStartScenario: (scenario: ScenarioStart) => void }) {
  const { kind, environmentId, groupId, farmbotId } = guide;
  const workspace = useSensorGroups();
  const groups = workspace && !workspace.loading && !workspace.error ? workspace.groups : [];
  const active = markers.filter(marker => marker.isActive);
  const checks = evaluateScenario({ kind, environmentId, groupId, groupIds: groups.map(group => group.id),
    assets: markers.map(marker => ({ id: marker.id, type: marker.type, active: marker.isActive,
      ball: isProjectModelMovableBall(marker.metadata), sensors: readPhysicsSensorCuboids(marker.metadata) })) });
  const observed = active.find(marker => marker.type === 'farmbots' && marker.id === farmbotId);
  const completed = checks.filter(check => check.complete).length;
  const inputClass = 'mt-1.5 w-full rounded-md border border-foreground/15 bg-background/50 px-2.5 py-2 text-xs text-foreground';
  return <section className="mt-3 space-y-3 rounded-lg border border-foreground/15 bg-foreground/[0.03] p-3" aria-label="Scenario guidance" aria-description="Guide selections are saved with the Project when you choose Save ThreeD Project; they do not alter Scene assets.">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300"><Compass aria-hidden="true" className="h-4 w-4" /></span> Setup guide</h3>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onChooseTemplate}><LayoutTemplate aria-hidden="true" className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" /> Templates (Choose a Scenario)</Button>
    </div>
    {loadedScenario && <div role="status" className="flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-2 text-xs">
      <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" />
      <span className="min-w-0 flex-1 truncate"><span className="font-semibold">Loaded:</span> {loadedScenario.name}</span>
      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Clear loaded Scenario" onClick={onClearLoaded}><X aria-hidden="true" className="h-3.5 w-3.5" /></Button>
    </div>}
    {loadedScenario && !loadedScenario.setup && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">This saved outline has no setup yet. Edit it to choose a Model and Sensor Group.</p>}
    {loadedScenario?.setup?.environmentMarkerId && !active.some(marker => marker.type === 'models' && marker.id === loadedScenario.setup?.environmentMarkerId) && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">The saved Model is missing or inactive. Choose an assigned Model.</p>}
    {loadedScenario?.setup?.sensorGroupId && !groups.some(group => group.id === loadedScenario.setup?.sensorGroupId) && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">The saved Sensor Group is missing. Choose a Project group.</p>}
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block text-xs font-medium">Scenario type
        <select className={inputClass} value={kind} onChange={event => onGuideChange({ ...guide, kind: event.target.value as ScenarioKind })}>
          <option value="soccer">Soccer</option><option value="farming">Farming</option>
        </select>
      </label>
      <label className="block text-xs font-medium">{kind === 'soccer' ? 'Field Model' : 'Environment Model'}
        <select className={inputClass} value={environmentId} onChange={event => onGuideChange({ ...guide, environmentId: event.target.value })}>
          <option value="">Choose an assigned Model</option>
          {environmentId && !active.some(marker => marker.type === 'models' && marker.id === environmentId) && <option value={environmentId}>Missing Model ({environmentId})</option>}
          {active.filter(marker => marker.type === 'models').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
        </select>
      </label>
      {kind === 'soccer' && <label className="block text-xs font-medium">Sensor Group
        <select className={inputClass} value={groupId} onChange={event => onGuideChange({ ...guide, groupId: event.target.value })} disabled={!workspace || workspace.loading || !!workspace.error}>
          <option value="">{workspace?.loading ? 'Loading groups…' : workspace?.error || !workspace ? 'Groups unavailable' : 'Choose a group'}</option>
          {groupId && !groups.some(group => group.id === groupId) && <option value={groupId}>Missing group ({groupId})</option>}
          {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </label>}
    </div>
    <div className="rounded-lg border border-foreground/10 bg-background/30 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs font-semibold"><Goal aria-hidden="true" className="h-4 w-4 text-sky-700 dark:text-sky-300" /> Setup checks</span><span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">{completed} / {checks.length} ready</span></div>
      <ul className="space-y-1.5 text-xs">{checks.map(check => <li key={check.id} className="flex items-start gap-2"><span className="sr-only">{check.complete ? 'Ready: ' : 'Needed: '}</span>{check.complete ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> : <Circle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" />}<span className={check.complete ? 'text-foreground/75' : 'text-foreground'}>{check.label}</span></li>)}</ul>
    </div>
    {kind === 'soccer' && <p className="text-xs text-muted-foreground">After starting, take control of a movable Character, select a movable ball with Use as Action Target, and approach it. A mapped foot kick appears in Character Animations when available. Sensor counts change only when the ball enters a goal.</p>}
    <div className="flex items-center justify-end">
      <Button type="button" size="sm" className="gap-1.5" disabled={!loadedScenario || !loadedScenario.setup || completed !== checks.length}
        onClick={() => {
          if (!loadedScenario?.setup || completed !== checks.length) return;
          const environmentName = active.find(marker => marker.id === environmentId && marker.type === 'models')?.name ?? 'the selected Model';
          const groupName = groups.find(group => group.id === groupId)?.name ?? 'the selected Sensor Group';
          onStartScenario({ projectId: Number(projectId), name: loadedScenario.name, kind, environmentName, groupId: kind === 'soccer' ? groupId : '', groupName });
        }}><Play aria-hidden="true" className="h-3.5 w-3.5" /> Start Scenario</Button>
    </div>
    {kind === 'farming' && <>
      <label className="block text-xs font-medium">FarmBot observation (optional)
        <select className={inputClass} value={farmbotId} onChange={event => onGuideChange({ ...guide, farmbotId: event.target.value })}>
          <option value="">Choose an assigned FarmBot</option>
          {active.filter(marker => marker.type === 'farmbots').map(marker => <option key={marker.id} value={marker.id}>{marker.name}</option>)}
        </select>
      </label>
      {observed && <Observation key={observed.id} marker={observed} projectId={projectId} />}
    </>}
  </section>;
}
