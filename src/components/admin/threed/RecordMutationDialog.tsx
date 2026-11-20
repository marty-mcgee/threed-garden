'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
  mode: 'create' | 'edit' | 'delete' | 'bulk';
  endpoint: string;
  record: { id: number; updatedAt: Date } | null;
  selection?: { id: number; expectedUpdatedAt: string | null }[];
  title: string;
  description?: string;
  createLabel: string;
  deleteLabel: string;
  changes: Record<string, unknown>;
  validate: (changes: unknown) => unknown;
  onClose: () => void;
  onSaved: () => void;
  children: ReactNode;
};

export function RecordMutationDialog({ mode, endpoint, record, selection, title, description, createLabel, deleteLabel, changes, validate, onClose, onSaved, children }: Props) {
  const deleting = mode === 'delete';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams();
      const request: RequestInit = { method: mode === 'create' ? 'POST' : deleting ? 'DELETE' : 'PATCH', signal: AbortSignal.timeout(30000) };
      if (mode === 'bulk') {
        validate(changes);
        request.body = JSON.stringify({ action: 'set', selection, changes });
      } else if (record) {
        const expectedUpdatedAt = new Date(record.updatedAt).toISOString();
        params.set('id', String(record.id));
        if (deleting) {
          params.set('expectedUpdatedAt', expectedUpdatedAt);
        } else {
          validate(changes);
          request.body = JSON.stringify({ expectedUpdatedAt, changes });
        }
      } else {
        validate(changes);
        request.body = JSON.stringify(changes);
      }
      if (request.body) request.headers = { 'Content-Type': 'application/json' };
      const response = await fetch(record ? `${endpoint}?${params}` : endpoint, request);
      const result = await response.json();
      const confirmed = mode === 'bulk' ? Boolean(selection?.length && selection.length === result.data?.updated)
        : Number.isInteger(result.data?.id) && result.data.id > 0 && (!record || result.data.id === record.id);
      if (!response.ok || !result.success || !confirmed) {
        throw new Error(result.error || 'Could not confirm the change.');
      }
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not confirm the change.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving.current) onClose(); }}>
      <DialogContent className={deleting ? 'sm:max-w-md' : 'max-h-[90dvh] overflow-y-auto sm:max-w-3xl'} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form noValidate className="space-y-4" onSubmit={submit}>
          {!deleting && <fieldset disabled={busy} className="grid gap-3 text-xs sm:grid-cols-3">{children}</fieldset>}
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
            <Button type="submit" variant={deleting ? 'destructive' : 'success'} disabled={busy || ((mode === 'edit' || mode === 'bulk') && !Object.keys(changes).length)}>
              {deleting ? busy ? 'Deleting…' : deleteLabel : busy ? 'Saving…' : mode === 'create' ? createLabel : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
