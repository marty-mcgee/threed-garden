'use client';

import { useState } from 'react';
import { RecordMutationDialog as WateringRecordDialog } from '../RecordMutationDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseNewWateringSchedule, parseWateringScheduleChanges, wateringFrequencies, wateringNumberFields, wateringScheduleDefaults, wateringScheduleTargets } from '@/libraries/services/threed/waterings/watering-schedule-edit';
import type { ThreedWateringSchedule } from '@/libraries/schema/threed';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const endpoint = '/api/threed/watering-schedules';

export type WateringScheduleAction = { mode: 'create' } | { mode: 'edit' | 'delete'; schedule: ThreedWateringSchedule };

export function WateringScheduleDialog({ action, onClose, onSaved }: {
  action: WateringScheduleAction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mode } = action;
  const creating = mode === 'create';
  const deleting = mode === 'delete';
  const schedule = action.mode === 'create' ? null : action.schedule;
  const initial: Partial<ThreedWateringSchedule> = schedule ?? wateringScheduleDefaults;
  const [changes, setChanges] = useState<Record<string, unknown>>({});
  function change(field: string, value: unknown) {
    setChanges(previous => {
      const next = { ...previous, [field]: value };
      const original = initial[field as keyof ThreedWateringSchedule];
      if (Object.is(value, original) || JSON.stringify(value) === JSON.stringify(original)) delete next[field];
      return next;
    });
  }

  const value = <K extends keyof ThreedWateringSchedule>(field: K) => Object.hasOwn(changes, field)
    ? changes[field] as ThreedWateringSchedule[K]
    : initial[field];
  const selectedDays = value('daysOfWeek') ?? [];
  const title = creating ? 'Add Watering Schedule' : deleting ? 'Delete Watering Schedule' : 'Edit Watering Schedule';
  const description = creating ? 'Enter a unique Schedule ID, duration, and next watering time.' : deleting ? `Permanently delete “${schedule?.scheduleId}”?` : schedule?.scheduleId;
  return (
    <WateringRecordDialog mode={mode} record={schedule} endpoint={endpoint} title={title} description={description}
      createLabel="Add Watering Schedule" deleteLabel="Delete Schedule" changes={changes}
      validate={creating ? parseNewWateringSchedule : parseWateringScheduleChanges} onClose={onClose} onSaved={onSaved}>
      {creating && <label className="space-y-1 sm:col-span-3">
        <span>Schedule ID</span>
        <Input required maxLength={50} className="h-8 text-xs" value={value('scheduleId') ?? ''} onChange={event => change('scheduleId', event.target.value)} />
      </label>}
      <label className="space-y-1">
        <span>Frequency</span>
        <select className="h-8 w-full rounded-md border bg-background px-2" value={value('frequency')} onChange={event => change('frequency', event.target.value)}>
          {wateringFrequencies.map(frequency => <option key={frequency} value={frequency}>{frequency}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span>Next Watering</span>
        <Input type="datetime-local" required step={1} className="h-8 text-xs" value={(value('nextWatering') ?? '').replace(' ', 'T').slice(0, 19)} onChange={event => change('nextWatering', event.target.value)} />
      </label>
      <label className="space-y-1">
        <span>Time of Day</span>
        <Input type="time" step={1} className="h-8 text-xs" value={value('timeOfDay')?.slice(0, 8) ?? ''} onChange={event => change('timeOfDay', event.target.value || null)} />
      </label>
      {creating && <fieldset className="grid gap-3 sm:col-span-3 sm:grid-cols-4">
        <legend>Targets (optional)</legend>
        {(Object.keys(wateringScheduleTargets) as (keyof typeof wateringScheduleTargets)[]).map(field => (
          <label key={field} className="space-y-1">
            <span>{wateringScheduleTargets[field]}</span>
            <Input type="number" step={1} min={1} max={2147483647} className="h-8 text-xs" value={value(field) ?? ''}
              onChange={event => change(field, event.target.value === '' ? null : event.target.valueAsNumber)} />
          </label>
        ))}
      </fieldset>}
      <fieldset className="grid gap-1 sm:col-span-3">
        <legend>Days of the Week</legend>
        <div className="flex flex-wrap gap-3">
          {days.map((label, day) => <label key={label} className="flex items-center gap-1">
            <input type="checkbox" checked={selectedDays.includes(day)} onChange={event => {
              const next = event.target.checked ? [...selectedDays, day].sort((a, b) => a - b) : selectedDays.filter(selected => selected !== day);
              change('daysOfWeek', next.length ? next : null);
            }} />{label}
          </label>)}
        </div>
      </fieldset>
      {(Object.keys(wateringNumberFields) as (keyof typeof wateringNumberFields)[]).map(field => {
        const rule = wateringNumberFields[field];
        return <label key={field} className="space-y-1">
          <span>{rule.label}</span>
          <Input type="number" step={1} required={!rule.optional} min={rule.minimum} max={rule.maximum} className="h-8 text-xs" value={value(field) ?? ''}
            onChange={event => change(field, event.target.value === '' ? null : event.target.valueAsNumber)} />
        </label>;
      })}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={value('isActive') === true} onChange={event => change('isActive', event.target.checked)} />Active</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={value('skipIfRain') === true} onChange={event => change('skipIfRain', event.target.checked)} />Skip If Rain</label>
      </div>
      <label className="space-y-1 sm:col-span-3">
        <span>Notes</span>
        <Textarea className="text-xs" maxLength={4000} value={value('notes') ?? ''} onChange={event => change('notes', event.target.value || null)} />
      </label>
    </WateringRecordDialog>
  );
}
