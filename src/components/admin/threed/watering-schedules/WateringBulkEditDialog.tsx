'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { isSortOrder, SORT_ORDER_LIMIT, sortOrderError } from '@/libraries/services/threed/list-sort-order';
import { parseWateringHistoryChanges, wateringHistoryStatuses } from '@/libraries/services/threed/waterings/watering-history-edit';
import { parseWateringScheduleChanges, wateringFrequencies, wateringNumberFields } from '@/libraries/services/threed/waterings/watering-schedule-edit';
import { RecordMutationDialog as WateringRecordDialog } from '../RecordMutationDialog';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type InputField = { field: string; label: string; kind: 'number' | 'text' | 'time' | 'datetime-local'; min?: number; max?: number };
const rankField: InputField = { field: 'sortOrder', label: 'Sort Order', kind: 'number', min: -SORT_ORDER_LIMIT, max: SORT_ORDER_LIMIT };
const scheduleFields: InputField[] = [
  { field: 'nextWatering', label: 'Next Watering', kind: 'datetime-local' },
  { field: 'timeOfDay', label: 'Time of Day', kind: 'time' },
  ...Object.entries(wateringNumberFields).map(([field, rule]): InputField => ({ field, label: rule.label, kind: 'number', min: rule.minimum, max: rule.maximum })),
  { field: 'notes', label: 'Notes', kind: 'text' },
];
const historyFields: InputField[] = [
  { field: 'executedAt', label: 'Executed', kind: 'datetime-local' },
  { field: 'durationMs', label: 'Duration (ms)', kind: 'number', min: 0, max: 2147483647 },
  { field: 'volumeMl', label: 'Volume (mL)', kind: 'number', min: 0, max: 2147483647 },
  { field: 'skipReason', label: 'Skip Reason', kind: 'text' },
  { field: 'errorMessage', label: 'Error Message', kind: 'text' },
];
const booleanChoices = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
const selectFields = {
  schedules: [
    { field: 'frequency', label: 'Frequency', options: wateringFrequencies.map(value => ({ value, label: value })) },
    { field: 'isActive', label: 'Activity', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
    { field: 'skipIfRain', label: 'Skip If Rain', options: booleanChoices },
  ],
  history: [{ field: 'status', label: 'Status', options: wateringHistoryStatuses.map(value => ({ value, label: value })) }],
};

export type WateringBulkSelection = { id: number; expectedUpdatedAt: string }[];

export function WateringBulkEditDialog({ view, selection, ranksReady, rank, onClose, onSaved }: {
  view: 'schedules' | 'history';
  selection: WateringBulkSelection;
  ranksReady: boolean;
  rank?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const rankOnly = rank !== undefined;
  const [drafts, setDrafts] = useState<Record<string, string>>((): Record<string, string> => rankOnly ? { sortOrder: String(rank) } : {});
  const [daysOfWeek, setDaysOfWeek] = useState<number[] | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const update = (field: string, value?: string) => setDrafts(previous => {
    const next = { ...previous };
    if (value === undefined) delete next[field];
    else next[field] = value;
    return next;
  });
  const fields = rankOnly ? [rankField] : [...(ranksReady ? [rankField] : []), ...(view === 'schedules' ? scheduleFields : historyFields)];
  const changes: Record<string, unknown> = {};
  for (const { field, kind } of fields) {
    const value = drafts[field];
    if (value === undefined) continue;
    changes[field] = !value.trim() ? null : kind === 'number' ? Number(value) : value;
  }
  for (const [field, value] of Object.entries(choices)) {
    if (value !== '') changes[field] = field === 'isActive' || field === 'skipIfRain' ? value === 'true' : value;
  }
  if (daysOfWeek !== null) changes.daysOfWeek = daysOfWeek.length ? daysOfWeek : null;
  function validate() {
    const { sortOrder, ...settings } = changes;
    if (Object.hasOwn(changes, 'sortOrder') && !isSortOrder(sortOrder)) throw new Error(sortOrderError);
    if (Object.keys(settings).length) {
      if (view === 'schedules') parseWateringScheduleChanges(settings);
      else parseWateringHistoryChanges(settings);
    }
  }

  return <WateringRecordDialog mode="bulk" record={null} endpoint={`/api/threed/waterings/manage?view=${view}`} selection={selection}
    title={rankOnly ? 'Edit Sort Order' : `Bulk Edit · ${selection.length} selected`} description={rankOnly ? 'Set the rank for this record.' : 'Choose which fields to update for the selected records.'}
    createLabel="" deleteLabel="" changes={changes} validate={validate} onClose={onClose} onSaved={onSaved}>
    {!rankOnly && selectFields[view].map(({ field, label, options }) => <label key={field} className="space-y-1">
      <span>{label}</span>
      <select className="h-8 w-full rounded-md border bg-background px-2" value={choices[field] ?? ''} onChange={event => setChoices(previous => ({ ...previous, [field]: event.target.value }))}>
        <option value="">Keep current</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>)}
    {fields.map(({ field, label, kind, min, max }) => {
      const enabled = Object.hasOwn(drafts, field);
      return <div key={field} className={kind === 'text' ? 'space-y-1 sm:col-span-3' : 'space-y-1'}>
        <label className="flex items-center gap-2">
          {!rankOnly && <input type="checkbox" checked={enabled} onChange={event => update(field, event.target.checked ? '' : undefined)} />}
          {rankOnly ? label : `Change ${label}`}
        </label>
        {kind === 'text'
          ? <Textarea aria-label={label} disabled={!enabled} maxLength={4000} className="text-xs" value={drafts[field] ?? ''} onChange={event => update(field, event.target.value)} />
          : <Input aria-label={label} type={kind} step={1} min={min} max={max} disabled={!enabled} className="h-8 text-xs" value={drafts[field] ?? ''} onChange={event => update(field, event.target.value)} />}
      </div>;
    })}
    {!rankOnly && view === 'schedules' && <fieldset className="grid gap-1 sm:col-span-3">
      <legend><label className="flex items-center gap-2"><input type="checkbox" checked={daysOfWeek !== null} onChange={event => setDaysOfWeek(event.target.checked ? [] : null)} />Change Days of the Week</label></legend>
      <div className="flex flex-wrap gap-3">
        {days.map((day, index) => <label key={day} className="flex items-center gap-1">
          <input type="checkbox" disabled={daysOfWeek === null} checked={daysOfWeek?.includes(index) ?? false} onChange={event => {
            const current = daysOfWeek ?? [];
            setDaysOfWeek(event.target.checked ? [...current, index].sort((a, b) => a - b) : current.filter(value => value !== index));
          }} />{day}
        </label>)}
      </div>
    </fieldset>}
  </WateringRecordDialog>;
}
