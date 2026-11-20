'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ThreedWateringHistory } from '@/libraries/schema/threed';
import { parseNewWateringHistory, parseWateringHistoryChanges, wateringHistoryStatuses, wateringHistoryTargets } from '@/libraries/services/threed/waterings/watering-history-edit';
import { RecordMutationDialog as WateringRecordDialog } from '../RecordMutationDialog';

export type WateringHistoryAction = { mode: 'create' } | { mode: 'edit' | 'delete'; entry: ThreedWateringHistory };

export function WateringHistoryDialog({ action, onClose, onSaved }: { action: WateringHistoryAction; onClose: () => void; onSaved: () => void }) {
  const { mode } = action;
  const creating = mode === 'create';
  const entry = action.mode === 'create' ? null : action.entry;
  const [changes, setChanges] = useState<Record<string, unknown>>({});

  function change(field: keyof ThreedWateringHistory, next: string | number | null) {
    setChanges(previous => {
      const draft = { ...previous, [field]: next };
      if (Object.is(entry?.[field], next)) delete draft[field];
      return draft;
    });
  }
  function value<K extends keyof ThreedWateringHistory>(field: K) {
    return Object.hasOwn(changes, field) ? changes[field] as ThreedWateringHistory[K] : entry?.[field];
  }
  const title = creating ? 'Add Watering History' : mode === 'delete' ? 'Delete Watering History Entry' : 'Edit Watering History Entry';
  const description = creating ? 'Record a watering outcome manually.' : mode === 'delete' ? `Permanently delete “${entry?.historyId}”?` : entry?.historyId;

  return (
    <WateringRecordDialog mode={mode} record={entry} endpoint="/api/threed/watering-history" title={title} description={description}
      createLabel="Add Watering History" deleteLabel="Delete Entry" changes={changes}
      validate={creating ? parseNewWateringHistory : parseWateringHistoryChanges} onClose={onClose} onSaved={onSaved}>
      {creating && <label className="space-y-1">
        <span>History ID</span>
        <Input required maxLength={50} className="h-8 text-xs" value={value('historyId') ?? ''} onChange={event => change('historyId', event.target.value)} />
      </label>}
      <label className="space-y-1">
        <span>Executed</span>
        <Input type="datetime-local" step={1} required={creating} className="h-8 text-xs" value={(value('executedAt') ?? '').replace(' ', 'T').slice(0, 19)} onChange={event => change('executedAt', event.target.value)} />
      </label>
      <label className="space-y-1">
        <span>Status</span>
        <select required className="h-8 w-full rounded-md border bg-background px-2" value={value('status') ?? ''} onChange={event => change('status', event.target.value)}>
          <option value="" disabled>Choose status</option>
          {entry?.status && !wateringHistoryStatuses.some(status => status === entry.status) && <option value={entry.status} disabled>{entry.status}</option>}
          {wateringHistoryStatuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      {([['durationMs', 'Duration (ms)'], ['volumeMl', 'Volume (mL)']] as const).map(([field, label]) => <label key={field} className="space-y-1">
        <span>{label}</span>
        <Input type="number" step={1} min={0} max={2147483647} className="h-8 text-xs" value={value(field) ?? ''}
          onChange={event => change(field, event.target.value === '' ? null : event.target.valueAsNumber)} />
      </label>)}
      {creating && <fieldset className="grid gap-3 sm:col-span-3 sm:grid-cols-4">
        <legend>Targets (optional)</legend>
        {(Object.keys(wateringHistoryTargets) as (keyof typeof wateringHistoryTargets)[]).map(field => <label key={field} className="space-y-1">
          <span>{wateringHistoryTargets[field]}</span>
          <Input type="number" step={1} min={1} max={2147483647} className="h-8 text-xs" value={value(field) ?? ''}
            onChange={event => change(field, event.target.value === '' ? null : event.target.valueAsNumber)} />
        </label>)}
      </fieldset>}
      {([['skipReason', 'Skip Reason'], ['errorMessage', 'Error Message']] as const).map(([field, label]) => <label key={field} className="space-y-1 sm:col-span-3">
        <span>{label}</span>
        <Textarea className="text-xs" maxLength={4000} value={value(field) ?? ''} onChange={event => change(field, event.target.value || null)} />
      </label>)}
    </WateringRecordDialog>
  );
}
