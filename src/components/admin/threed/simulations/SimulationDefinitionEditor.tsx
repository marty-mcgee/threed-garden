'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModelFieldHelp } from '../models/ModelFieldHelp';
import { SIMULATION_ACTIONS, SIMULATION_PLANTING_ACTIONS, MAX_SIMULATION_STEPS, MAX_SIMULATION_OBSERVATIONS, type SimulationDefinition, type SimulationStep } from '@/libraries/services/threed/simulations/simulation-input';

export type SimulationChoices = {
  scenarios: { id: number; name: string; isActive: boolean }[];
  markers: { markerId: string; markerType: string; name: string }[];
  groups: { id: string; name: string }[];
};
export const emptySimulationChoices: SimulationChoices = { scenarios: [], markers: [], groups: [] };
export function SimulationDefinitionEditor({ value, onChange, choices, readOnly = false }: { value: SimulationDefinition; onChange: (value: SimulationDefinition) => void; choices: SimulationChoices; readOnly?: boolean }) {
  const changeStep = (index: number, changes: Partial<SimulationStep>) => onChange({ ...value, steps: value.steps.map((step, i) => i === index ? { ...step, ...changes } : step) });
  const move = (index: number, offset: number) => {
    const steps = [...value.steps], target = index + offset;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]]; onChange({ ...value, steps });
  };
  const plantingAction = (action: SimulationStep['action']) => SIMULATION_PLANTING_ACTIONS.some(value => value === action);
  const markerOptions = (selected: string, character = false, planting = false) => <>
    <option value="">Choose {character ? 'a Character' : 'a target'}</option>
    {selected && !choices.markers.some(marker => marker.markerId === selected && (!character || marker.markerType === 'characters') && (!planting || marker.markerType === 'plantings')) && <option value={selected}>Unavailable or incompatible marker ({selected})</option>}
    {choices.markers.filter(marker => (!character || marker.markerType === 'characters') && (!planting || marker.markerType === 'plantings')).map(marker => <option key={marker.markerId} value={marker.markerId}>{marker.name} · {marker.markerType}</option>)}
  </>;
  return <>
    <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1"><h2 className="text-xs font-semibold">Actions ({value.steps.length})</h2><ModelFieldHelp label="Simulation Actions">Actions run in the saved order when a future Scene runner is introduced. Choose a saved Character and target from this Project module. Saving stores the plan; it does not execute it.</ModelFieldHelp>
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
          <div><Label htmlFor={`action-${step.id}`}>Action</Label><select id={`action-${step.id}`} className="w-full" value={step.action} onChange={event => { const action = event.target.value as SimulationStep['action']; changeStep(index, { action, targetMarkerId: plantingAction(action) && !choices.markers.some(marker => marker.markerId === step.targetMarkerId && marker.markerType === 'plantings') ? '' : step.targetMarkerId }); }}>{SIMULATION_ACTIONS.map(action => <option key={action} value={action}>{action}</option>)}</select></div>
          <div><Label htmlFor={`actor-${step.id}`}>Character</Label><select id={`actor-${step.id}`} className="w-full" value={step.actorMarkerId} onChange={event => changeStep(index, { actorMarkerId: event.target.value })}>{markerOptions(step.actorMarkerId, true)}</select></div>
          <div><Label htmlFor={`target-${step.id}`}>Target</Label><select id={`target-${step.id}`} className="w-full" value={step.targetMarkerId} onChange={event => changeStep(index, { targetMarkerId: event.target.value })}>{markerOptions(step.targetMarkerId, false, plantingAction(step.action))}</select></div>
          <div><Label htmlFor={`timeout-${step.id}`}>Timeout (seconds)</Label><Input id={`timeout-${step.id}`} type="number" min={1} max={300} step={1} value={step.timeoutMs / 1000} onChange={event => changeStep(index, { timeoutMs: Number(event.target.value) * 1000 })} /></div>
          <div><Label htmlFor={`failure-${step.id}`}>On failure</Label><select id={`failure-${step.id}`} className="w-full" value={step.onFailure} onChange={event => changeStep(index, { onFailure: event.target.value as SimulationStep['onFailure'] })}><option value="stop">Stop</option><option value="continue">Continue</option></select></div>
        </div>
      </fieldset>)}
    </section>
    <section className="admin-editor-panel space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-1"><h2 className="text-xs font-semibold">Observations ({value.observations.length})</h2><ModelFieldHelp label="Simulation observations">Select Project Sensor Groups to observe during future Simulation execution. Saving does not collect readings or reset sensor counters. Other metadata sources can be added later.</ModelFieldHelp>
        {!readOnly && <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" disabled={value.observations.length >= MAX_SIMULATION_OBSERVATIONS} onClick={() => onChange({ ...value, observations: [...value.observations, { id: crypto.randomUUID(), kind: 'sensor-group', sensorGroupId: '' }] })}><Plus className="h-3.5 w-3.5" /> Add observation</Button>}
      </div>
      {!value.observations.length && <p className="text-xs text-muted-foreground">No observation sources yet.</p>}
      {value.observations.map((source, index) => <div key={source.id} className="flex items-end gap-2"><div className="flex-1"><Label htmlFor={`source-${source.id}`}>Sensor Group {index + 1}</Label><select id={`source-${source.id}`} disabled={readOnly} className="w-full" value={source.sensorGroupId} onChange={event => onChange({ ...value, observations: value.observations.map((item, i) => i === index ? { ...item, sensorGroupId: event.target.value } : item) })}>
        <option value="">Choose a Sensor Group</option>{source.sensorGroupId && !choices.groups.some(group => group.id === source.sensorGroupId) && <option value={source.sensorGroupId}>Unavailable group ({source.sensorGroupId})</option>}{choices.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select></div>{!readOnly && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" aria-label={`Remove observation ${index + 1}`} onClick={() => onChange({ ...value, observations: value.observations.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>)}
    </section>
  </>;
}
