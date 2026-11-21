'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RecordMutationDialog } from './RecordMutationDialog';
import { catalogBulkFields, type BulkField, type CatalogBulkResource } from '@/libraries/services/threed/bulk-edit/fields';
import {
  parseBulkRequest,
  type CatalogBulkScope,
  type CatalogBulkSelection,
} from '@/libraries/services/threed/bulk-edit/contract';

type Row = {
  id: number;
  updatedAt: Date | string | null;
  name?: string | null;
  modelId?: number | null;
  revision?: number;
  sortOrder?: number | null;
};
type Props = {
  resource: CatalogBulkResource;
  rows: readonly Row[];
  scope?: CatalogBulkScope;
  disabled?: boolean;
  onSaved: () => void;
};
type CapturedRow = CatalogBulkSelection & { name?: string | null };

function CatalogBulkControl({ resource, rows, scope, disabled, onSaved }: Props) {
  const [captured, setCaptured] = useState<CapturedRow[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [renames, setRenames] = useState<Record<string, string>>({});
  const refreshCurrentList = useRef<Props['onSaved'] | null>(null);
  useLayoutEffect(() => {
    refreshCurrentList.current = onSaved;
    return () => { refreshCurrentList.current = null; };
  }, [onSaved]);
  const namesOnly = resource === 'animation-categories';
  const fields: readonly BulkField[] = catalogBulkFields[resource];
  const query = new URLSearchParams();
  if (scope?.projectId !== undefined) query.set('projectId', String(scope.projectId));
  if (scope?.modelId !== undefined) query.set('modelId', String(scope.modelId));
  const endpoint = '/api/threed/bulk-edit/' + resource + (query.size ? '?' + query.toString() : '');
  const changes: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.hasOwn(draft, field.key)) continue;
    const value = draft[field.key];
    if (field.kind === 'boolean') changes[field.key] = value === 'true';
    else if (field.kind === 'integer') changes[field.key] = value.trim() ? Number(value) : null;
    else if (field.kind === 'text') changes[field.key] = value.trim() || null;
    else changes[field.key] = value;
  }
  if (namesOnly && Object.keys(renames).length) changes.names = renames;

  function change(key: string, value?: string) {
    setDraft(previous => {
      const next = { ...previous };
      if (value === undefined) delete next[key]; else next[key] = value;
      return next;
    });
  }
  function open() {
    setDraft({});
    setRenames({});
    setCaptured(rows.map(row => ({
      id: row.id,
      expectedUpdatedAt: row.updatedAt === null ? null : new Date(row.updatedAt).toISOString(),
      ...(resource === 'simulations' && { revision: row.revision }),
      ...(resource === 'plantings' && typeof row.sortOrder === 'number' && { expectedSortOrder: row.sortOrder }),
      ...(resource === 'model-files' && { modelId: row.modelId ?? undefined }),
      ...(namesOnly && { name: row.name }),
    })));
  }
  const ready = rows.length > 0 && rows.length <= 200 && rows.every(row =>
    (row.updatedAt === null || Number.isFinite(new Date(row.updatedAt).getTime()))
    && (resource !== 'simulations' || Number.isInteger(row.revision))
    && (resource !== 'model-files' || Number.isInteger(row.modelId))
    && (!namesOnly || typeof row.name === 'string'));
  const selection = captured?.map(({ name: _name, expectedSortOrder, ...item }) =>
    Object.hasOwn(changes, 'sortOrder') ? { ...item, expectedSortOrder } : item);

  return <>
    <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
      disabled={disabled || !ready} onClick={open}>
      <Pencil className="mr-1 size-3" />Bulk Edit
    </Button>
    {rows.length > 200 && <span className="text-xs" role="status">Choose up to 200 records for Bulk Edit.</span>}
    {captured && selection && <RecordMutationDialog mode="bulk" record={null} endpoint={endpoint} selection={selection}
      title={`Bulk Edit · ${captured.length} selected`}
      description={namesOnly ? 'Edit the names you want to change. Each Category needs a unique name.' : 'Choose the fields to change for every selected record.'}
      createLabel="" deleteLabel="" changes={changes}
      validate={values => parseBulkRequest(resource, { action: 'set', selection, changes: values })}
      onClose={() => setCaptured(null)}
      onSaved={() => {
        // The response can arrive after navigation has unmounted this selection.
        const refresh = refreshCurrentList.current;
        if (!refresh) return;
        setCaptured(null);
        refresh();
      }}>
      {namesOnly && captured.map(row => <label key={row.id} className="space-y-1">
        <span>{row.name} (#{row.id})</span>
        <Input value={renames[row.id] ?? row.name ?? ''} maxLength={120} onChange={event => {
          const value = event.target.value;
          setRenames(previous => {
            const next = { ...previous };
            if (value === row.name) delete next[row.id]; else next[row.id] = value;
            return next;
          });
        }} />
      </label>)}
      {fields.map(field => {
        if (field.kind === 'choice' || field.kind === 'boolean') {
          const options = field.kind === 'choice' ? field.options : [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ];
          return <label key={field.key} className="space-y-1"><span>{field.label}</span>
            <select value={draft[field.key] ?? ''} className="h-8 w-full rounded-md border bg-background px-2"
              onChange={event => change(field.key, event.target.value || undefined)}>
              <option value="">Keep current</option>
              {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>;
        }
        const enabled = Object.hasOwn(draft, field.key);
        const available = field.key !== 'sortOrder' || captured.every(row => row.expectedSortOrder !== undefined);
        return <div key={field.key} className="space-y-1">
          <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} disabled={!available}
            onChange={event => change(field.key, event.target.checked ? '' : undefined)} />Change {field.label}</label>
          {field.kind === 'text'
            ? <Textarea aria-label={field.label} disabled={!enabled} maxLength={field.max} placeholder="Leave blank to clear"
              value={draft[field.key] ?? ''} onChange={event => change(field.key, event.target.value)} />
            : <Input aria-label={field.label} type="number" disabled={!enabled} min={field.min} max={field.max} step={1}
              value={draft[field.key] ?? ''} onChange={event => change(field.key, event.target.value)} />}
        </div>;
      })}
    </RecordMutationDialog>}
  </>;
}

export function CatalogBulkEditButton(props: Props) {
  // Navigation or a new selection invalidates an open draft. A record refresh keeps its captured conflict stamp.
  const scope = [props.resource, props.scope?.projectId, props.scope?.modelId, ...props.rows.map(row => row.id)].join(':');
  return <CatalogBulkControl key={scope} {...props} />;
}
