'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModelFieldHelp } from '../models/ModelFieldHelp';
import { SIMULATION_ACTIONS, SIMULATION_PLANTING_ACTIONS, MAX_SIMULATION_STEPS, MAX_SIMULATION_OBSERVATIONS, simulationActionLabel, type SimulationDefinition, type SimulationStep } from '@/libraries/services/threed/simulations/simulation-input';

export type SimulationChoices = {
  markers: { markerId: string; markerType: string; name: string; movableCharacter?: boolean; movableBall?: boolean }[];
  groups: { id: string; name: string }[];
  sensors?: { ownerMarkerId: number; id: string; name: string; ownerName: string; groupId: string | null; behavior: 'counter' | 'trigger' }[];
};
export const emptySimulationChoices: SimulationChoices = { markers: [], groups: [], sensors: [] };
export function SimulationDefinitionEditor({ value, onChange, choices, readOnly = false }: { value: SimulationDefinition; onChange: (value: SimulationDefinition) => void; choices: SimulationChoices; readOnly?: boolean }) {
  const changeStep = (index: number, changes: Partial<SimulationStep>) => onChange({ ...value, steps: value.steps.map((step, i) => i === index ? { ...step, ...changes } : step) });
  const move = (index: number, offset: number) => {
    const steps = [...value.steps], target = index + offset;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]]; onChange({ ...value, steps });
  };
  const plantingAction = (action: SimulationStep['action']) => SIMULATION_PLANTING_ACTIONS.some(value => value === action);
  const soccerAction = (action: SimulationStep['action']) => action === 'runToTarget' || action === 'kickBall';
  const soccerSteps = value.steps.filter(step => soccerAction(step.action));
  const shared = (field: 'actorMarkerId' | 'targetMarkerId') => soccerSteps.every(step => step[field] === soccerSteps[0]?.[field]) ? soccerSteps[0]?.[field] ?? '' : '';
  const changeParticipants = (field: 'actorMarkerId' | 'targetMarkerId', selected: string) => onChange({ ...value, steps: value.steps.map(step => soccerAction(step.action) ? { ...step, [field]: selected } : step) });
  const compatibleMarkers = (character: boolean, planting: boolean, soccer: boolean) => choices.markers.filter(marker => (!character || marker.markerType === 'characters')
    && (!planting || marker.markerType === 'plantings') && (!soccer || (character ? marker.movableCharacter : marker.movableBall)));
  const markerOptions = (selected: string, character = false, planting = false, soccer = false) => <>
    <option value="">Choose {character ? 'a Character' : 'a target'}</option>
    {selected && !compatibleMarkers(character, planting, soccer).some(marker => marker.markerId === selected) && <option value={selected}>Unavailable or incompatible marker ({selected})</option>}
    {compatibleMarkers(character, planting, soccer).map(marker => <option key={marker.markerId} value={marker.markerId}>{marker.name} · {marker.markerType}</option>)}
  </>;
  return <>
    {!!soccerSteps.length && <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1"><h2 className="text-xs font-semibold">Soccer participants</h2><ModelFieldHelp label="Soccer participants">Choose once for all Run-to-ball and Kick-ball Actions. Other Actions keep their own participants. Choose observation groups and optional target Sensors below.</ModelFieldHelp></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div><Label htmlFor="soccer-character">Character *</Label><select id="soccer-character" required aria-invalid={!shared('actorMarkerId')} aria-describedby={!shared('actorMarkerId') ? 'soccer-character-help' : undefined} disabled={readOnly} className="w-full" value={shared('actorMarkerId')} onChange={event => changeParticipants('actorMarkerId', event.target.value)}>{markerOptions(shared('actorMarkerId'), true, false, true)}</select>
          {!shared('actorMarkerId') && <p id="soccer-character-help" className="text-xs text-amber-600 dark:text-amber-300">Choose one movable Character for the Soccer Actions.</p>}</div>
        <div><Label htmlFor="soccer-ball">Target ball *</Label><select id="soccer-ball" required aria-invalid={!shared('targetMarkerId')} aria-describedby={!shared('targetMarkerId') ? 'soccer-ball-help' : undefined} disabled={readOnly} className="w-full" value={shared('targetMarkerId')} onChange={event => changeParticipants('targetMarkerId', event.target.value)}>{markerOptions(shared('targetMarkerId'), false, false, true)}</select>
          {!shared('targetMarkerId') && <p id="soccer-ball-help" className="text-xs text-amber-600 dark:text-amber-300">Choose one movable ball for the Soccer Actions.</p>}</div>
      </div>
    </section>}
    <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1"><h2 className="text-xs font-semibold">Actions ({value.steps.length})</h2><ModelFieldHelp label="Simulation Actions">The Soccer Scene runner supports Run to target ball, followed by Kick ball through foot contact. Use the same movable Character and ball for both Actions. A blocked or interrupted approach always stops; Continue applies to failed kicks. Other Actions remain definition-only. Saving never executes Actions.</ModelFieldHelp>
        {!readOnly && <Button type="button" variant="outline" size="sm" className="ml-auto h-7 text-xs" disabled={value.steps.length >= MAX_SIMULATION_STEPS} onClick={() => onChange({ ...value, steps: [...value.steps, { id: crypto.randomUUID(), action: 'point', actorMarkerId: '', targetMarkerId: '', timeoutMs: 30000, onFailure: 'stop' }] })}><Plus className="h-3.5 w-3.5" /> Add Action</Button>}
      </div>
      {!value.steps.length && <p className="text-xs text-muted-foreground">No Actions yet.</p>}
      {value.steps.map((step, index) => <fieldset key={step.id} disabled={readOnly} className="space-y-2 rounded-md border p-2">
        <div className="flex items-center gap-2"><span className="text-xs font-medium">Action {index + 1}</span>{!readOnly && <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Move Action ${index + 1} up`} disabled={!index} onClick={() => move(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Move Action ${index + 1} down`} disabled={index === value.steps.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" aria-label={`Remove Action ${index + 1}`} onClick={() => onChange({ ...value, steps: value.steps.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>}</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><Label htmlFor={`action-${step.id}`}>Action</Label><select id={`action-${step.id}`} className="w-full" value={step.action} onChange={event => { const action = event.target.value as SimulationStep['action']; changeStep(index, { action,
            actorMarkerId: compatibleMarkers(true, false, soccerAction(action)).some(marker => marker.markerId === step.actorMarkerId) ? step.actorMarkerId : '',
            targetMarkerId: compatibleMarkers(false, plantingAction(action), soccerAction(action)).some(marker => marker.markerId === step.targetMarkerId) ? step.targetMarkerId : '' }); }}>{SIMULATION_ACTIONS.map(action => <option key={action} value={action}>{simulationActionLabel(action)}</option>)}</select></div>
          {!soccerAction(step.action) && <><div><Label htmlFor={`actor-${step.id}`}>Character *</Label><select id={`actor-${step.id}`} required aria-invalid={!step.actorMarkerId} className="w-full" value={step.actorMarkerId} onChange={event => changeStep(index, { actorMarkerId: event.target.value })}>{markerOptions(step.actorMarkerId, true)}</select></div>
          <div><Label htmlFor={`target-${step.id}`}>Target *</Label><select id={`target-${step.id}`} required aria-invalid={!step.targetMarkerId} className="w-full" value={step.targetMarkerId} onChange={event => changeStep(index, { targetMarkerId: event.target.value })}>{markerOptions(step.targetMarkerId, false, plantingAction(step.action))}</select></div></>}
          {soccerAction(step.action) && <p className="self-center text-xs text-muted-foreground sm:col-span-2">Uses the shared Soccer Character and ball.</p>}
          <div><Label htmlFor={`timeout-${step.id}`}>Timeout (seconds)</Label><Input id={`timeout-${step.id}`} type="number" min={1} max={300} step={1} value={step.timeoutMs / 1000} onChange={event => changeStep(index, { timeoutMs: Number(event.target.value) * 1000 })} /></div>
          <div><Label htmlFor={`failure-${step.id}`}>On failure</Label><select id={`failure-${step.id}`} className="w-full" value={step.onFailure} onChange={event => changeStep(index, { onFailure: event.target.value as SimulationStep['onFailure'] })}><option value="stop">Stop</option><option value="continue">Continue</option></select></div>
        </div>
      </fieldset>)}
    </section>
    <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1"><h2 className="text-xs font-semibold">Target Sensors ({value.observations.length} groups)</h2><ModelFieldHelp label="Simulation observations">Choose Project groups and optionally specific Sensors. Reports include run-window counts and selected Sensor readings; they do not prove an Action caused a goal. Saving does not collect readings or reset shared counters.</ModelFieldHelp>
        {!readOnly && <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" disabled={value.observations.length >= MAX_SIMULATION_OBSERVATIONS} onClick={() => onChange({ ...value, observations: [...value.observations, { id: crypto.randomUUID(), kind: 'sensor-group', sensorGroupId: '' }] })}><Plus className="h-3.5 w-3.5" /> Add observation</Button>}
      </div>
      {!value.observations.length && <p className="text-xs text-muted-foreground">No observation sources yet.</p>}
      {value.observations.map((source, index) => <div key={source.id} className="rounded-md border p-2"><div className="flex items-end gap-2"><div className="flex-1"><Label htmlFor={`source-${source.id}`}>Sensor Group {index + 1} *</Label><select id={`source-${source.id}`} required aria-invalid={!source.sensorGroupId} disabled={readOnly} className="w-full" value={source.sensorGroupId} onChange={event => onChange({ ...value, observations: value.observations.map((item, i) => i === index ? { id: item.id, kind: item.kind, sensorGroupId: event.target.value } : item) })}>
        <option value="">Choose a Sensor Group</option>{source.sensorGroupId && !choices.groups.some(group => group.id === source.sensorGroupId) && <option value={source.sensorGroupId}>Unavailable group ({source.sensorGroupId})</option>}{choices.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select></div>{!readOnly && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" aria-label={`Remove observation ${index + 1}`} onClick={() => onChange({ ...value, observations: value.observations.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
        {!!source.sensorGroupId && <div className="mt-2 space-y-1 text-xs"><label className="flex items-center gap-2"><input type="checkbox" disabled={readOnly} checked={!source.sensors} onChange={event => onChange({ ...value, observations: value.observations.map((item, i) => i === index ? { id: item.id, kind: item.kind, sensorGroupId: item.sensorGroupId, ...(event.target.checked ? {} : { sensors: [] }) } : item) })} />All Sensors in this group</label>
          {source.sensors && <><div className="grid gap-1 sm:grid-cols-2">{(choices.sensors ?? []).filter(sensor => sensor.groupId === source.sensorGroupId).map(sensor => {
            const selected = source.sensors!.some(item => item.ownerMarkerId === sensor.ownerMarkerId && item.id === sensor.id);
            return <label key={`${sensor.ownerMarkerId}:${sensor.id}`} className="flex items-center gap-2"><input type="checkbox" disabled={readOnly || (!selected && source.sensors!.length >= 32)} checked={selected} onChange={event => onChange({ ...value, observations: value.observations.map((item, i) => i === index ? { ...item, sensors: event.target.checked ? [...(item.sensors ?? []), { ownerMarkerId: sensor.ownerMarkerId, id: sensor.id }] : item.sensors?.filter(choice => choice.ownerMarkerId !== sensor.ownerMarkerId || choice.id !== sensor.id) } : item) })} />{sensor.name} <span className="text-muted-foreground">· {sensor.ownerName}</span></label>;
          })}</div>{!source.sensors.length && <p className="text-amber-600 dark:text-amber-300">Choose at least one Sensor, or observe the whole group.</p>}
          {source.sensors.some(sensor => !(choices.sensors ?? []).some(choice => choice.ownerMarkerId === sensor.ownerMarkerId && choice.id === sensor.id && choice.groupId === source.sensorGroupId)) && <p role="alert" className="text-destructive">A selected Sensor is unavailable in this group.</p>}</>}
        </div>}
      </div>)}
    </section>
  </>;
}
