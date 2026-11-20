'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { harvestUnits, parseHarvestBulkChanges } from '@/libraries/services/threed/harvests/harvest-edit';
import { SORT_ORDER_LIMIT } from '@/libraries/services/threed/list-sort-order';
import { RecordMutationDialog } from '../RecordMutationDialog';

const rankField = { key: 'sortOrder', label: 'Sort Order', type: 'number', min: -SORT_ORDER_LIMIT, max: SORT_ORDER_LIMIT, step: 1 } as const;
const settings = [
  { key: 'quantity', label: 'Quantity', type: 'number', min: 0.01, max: 999999.99, step: 0.01 },
  { key: 'weightLbs', label: 'Weight (lbs)', type: 'number', min: 0, max: 999999.99, step: 0.01 },
  { key: 'harvestDate', label: 'Harvest Date', type: 'date', min: undefined, max: undefined, step: undefined },
] as const;

export type HarvestSelection = { id: number; expectedUpdatedAt: string | null }[];

export function HarvestBulkEditDialog({ selection, rank, ranksReady, projectId, onClose, onSaved }: {
  selection: HarvestSelection;
  rank?: number;
  ranksReady: boolean;
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const rankOnly = rank !== undefined;
  const [values, setValues] = useState<Record<string, string>>((): Record<string, string> => rankOnly ? { sortOrder: String(rank) } : {});
  const [unit, setUnit] = useState('');
  const [activity, setActivity] = useState('');
  function change(key: string, value?: string) {
    setValues(previous => {
      const next = { ...previous };
      if (value === undefined) delete next[key]; else next[key] = value;
      return next;
    });
  }
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) changes[key] = !value.trim() ? null : key === 'sortOrder' ? Number(value) : value;
  if (unit) changes.unit = unit;
  if (activity) changes.isActive = activity === 'active';
  const fields = rankOnly ? [rankField] : [...(ranksReady ? [rankField] : []), ...settings];
  const endpoint = '/api/threed/harvests/manage' + (projectId === 'all' ? '' : `?${new URLSearchParams({ projectId })}`);

  return <RecordMutationDialog mode="bulk" record={null} endpoint={endpoint} selection={selection}
    title={rankOnly ? 'Edit Sort Order' : `Bulk Edit · ${selection.length} selected`}
    description={rankOnly ? 'Set the rank for this Harvest.' : 'Choose which fields to update. Leave an enabled optional field blank to clear it.'}
    createLabel="" deleteLabel="" changes={changes} validate={parseHarvestBulkChanges} onClose={onClose} onSaved={onSaved}>
    {!rankOnly && <>
      <label className="space-y-1"><span>Unit</span>
        <select className="h-8 w-full rounded-md border bg-background px-2" value={unit} onChange={event => setUnit(event.target.value)}>
          <option value="">Keep current</option>
          {harvestUnits.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="space-y-1"><span>Activity</span>
        <select className="h-8 w-full rounded-md border bg-background px-2" value={activity} onChange={event => setActivity(event.target.value)}>
          <option value="">Keep current</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </label>
    </>}
    {fields.map(({ key, label, type, min, max, step }) => {
      const enabled = Object.hasOwn(values, key);
      return <div key={key} className="space-y-1">
        <label className="flex items-center gap-2">
          {!rankOnly && <input type="checkbox" checked={enabled} onChange={event => change(key, event.target.checked ? '' : undefined)} />}
          {rankOnly ? label : `Change ${label}`}
        </label>
        <Input aria-label={label} type={type} min={min} max={max} step={step} disabled={!enabled} className="h-8 text-xs" value={values[key] ?? ''} onChange={event => change(key, event.target.value)} />
      </div>;
    })}
    {!rankOnly && <div className="space-y-1 sm:col-span-3">
      <label className="flex items-center gap-2"><input type="checkbox" checked={Object.hasOwn(values, 'notes')} onChange={event => change('notes', event.target.checked ? '' : undefined)} />Change Notes</label>
      <Textarea aria-label="Notes" className="text-xs" disabled={!Object.hasOwn(values, 'notes')} maxLength={4000} value={values.notes ?? ''} onChange={event => change('notes', event.target.value)} />
    </div>}
  </RecordMutationDialog>;
}
