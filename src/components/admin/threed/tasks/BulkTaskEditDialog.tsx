'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseBulkTaskEdit } from '@/libraries/services/threed/tasks/bulk-edit';
import { TASK_SORT_ORDER_LIMIT } from '@/libraries/services/threed/tasks/sort-order';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '@/libraries/types/threed';

const keep = '';
const clear = '__clear';
const selectFields = [
  { field: 'type', label: 'Task Type', options: [{ value: clear, label: 'Clear Task Type' }, ...TASK_TYPE_OPTIONS] },
  { field: 'priority', label: 'Priority', options: TASK_PRIORITY_OPTIONS },
  { field: 'status', label: 'Status', options: TASK_STATUS_OPTIONS },
  { field: 'isActive', label: 'Activity', options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ] },
] as const;

export function BulkTaskEditDialog({ ids, onClose, onSaved }: {
  ids: number[];
  onClose: () => void;
  onSaved: (count: number) => Promise<void>;
}) {
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string | null>(null);
  const [choices, setChoices] = useState({ type: keep, priority: keep, status: keep, isActive: keep });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const changes = {
    ...(assignedTo !== null && { assignedTo: assignedTo.trim() || null }),
    ...(dueDate !== null && { dueDate: dueDate || null }),
    ...(sortOrder !== null && { sortOrder: sortOrder === '' ? NaN : Number(sortOrder) }),
    ...(choices.type !== keep && { type: choices.type === clear ? null : choices.type }),
    ...(choices.priority !== keep && { priority: choices.priority }),
    ...(choices.status !== keep && { status: choices.status }),
    ...(choices.isActive !== keep && { isActive: choices.isActive === 'active' }),
  };

  const apply = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const edit = parseBulkTaskEdit({ ids, changes });
      const response = await fetch('/api/threed/tasks/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.success || result.updated !== ids.length) {
        throw new Error(result.error || 'The bulk edit could not be confirmed.');
      }
      await onSaved(result.updated);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The bulk edit could not be confirmed.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose(); }}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!busy}
        onEscapeKeyDown={event => { if (saving.current) event.preventDefault(); }}
        onInteractOutside={event => { if (saving.current) event.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>Bulk Edit · {ids.length} {ids.length === 1 ? 'Task' : 'Tasks'}</DialogTitle>
          <DialogDescription>Choose which fields to update for the selected Tasks.</DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={assignedTo !== null} onChange={event => setAssignedTo(event.target.checked ? '' : null)} />
              Change Assigned To
            </Label>
            <Input aria-label="Assigned To" placeholder="Leave blank to clear" maxLength={100} disabled={assignedTo === null} value={assignedTo ?? ''} onChange={event => setAssignedTo(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={dueDate !== null} onChange={event => setDueDate(event.target.checked ? '' : null)} />
              Change Due Date
            </Label>
            <Input type="date" aria-label="Due Date" aria-describedby={dueDate === null ? undefined : 'bulk-task-due-date-help'} disabled={dueDate === null} value={dueDate ?? ''} onChange={event => setDueDate(event.target.value)} />
            {dueDate !== null && <p id="bulk-task-due-date-help" className="text-xs text-muted-foreground">Leave blank to clear the due date.</p>}
          </div>
          {selectFields.map(({ field, label, options }) => (
            <label key={field} className="space-y-1 text-sm">
              <span>{label}</span>
              <select className="h-9 w-full rounded-md border bg-background px-2" value={choices[field]} onChange={event => setChoices(current => ({ ...current, [field]: event.target.value }))}>
                <option value={keep}>Keep current</option>
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
          <div className="space-y-1">
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={sortOrder !== null} onChange={event => setSortOrder(event.target.checked ? '0' : null)} />
              Change Sort Order
            </Label>
            <Input aria-label="Sort Order" type="number" min={-TASK_SORT_ORDER_LIMIT} max={TASK_SORT_ORDER_LIMIT} step={1} disabled={sortOrder === null} value={sortOrder ?? ''} onChange={event => setSortOrder(event.target.value)} />
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button variant="success" disabled={busy || Object.keys(changes).length === 0} onClick={() => void apply()}>
            {busy ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
