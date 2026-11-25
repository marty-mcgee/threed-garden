'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CopyPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { workspaceFingerprint } from '@/components/map/hooks/useWorkspaceSaveFeedback';
import type { ProjectArchitectureDraft } from '@/libraries/services/threed/design/project-architecture';
import type { ThreeDProjectViewState } from '@/libraries/services/threed/markers/project-view-state-core';

type Snapshot = { viewState: ThreeDProjectViewState };

// Keep the exact request in memory across dialog closures. A retry of an
// uncertain creation must use the same key and the original captured edits.
export interface ProjectDuplicateAttempt {
  name: string;
  body: string;
  capturedDraft: ProjectArchitectureDraft;
  createdId?: number;
}

interface Props {
  sourceProjectId: number;
  sourceName: string;
  attempts: Map<number, ProjectDuplicateAttempt>;
  capture: () => { snapshot: Snapshot; capturedDraft: ProjectArchitectureDraft };
  begin: () => () => void;
  onOpenProject: (id: number, capturedDraft?: ProjectArchitectureDraft) => boolean;
  onClose: () => void;
}

function fingerprint(snapshot: Snapshot) {
  return JSON.stringify({ ...snapshot, viewState: workspaceFingerprint(snapshot.viewState) });
}

function suggestedName(source: string) {
  const previous = / v(\d{1,9})$/i.exec(source);
  const suffix = previous ? String(Number(previous[1]) + 1).padStart(previous[1].length, '0') : '001';
  const base = previous ? source.slice(0, previous.index) : source;
  return `${base.slice(0, 118 - suffix.length).trimEnd()} v${suffix}`;
}

export function ProjectDuplicateDialog({ sourceProjectId, sourceName, attempts, capture, begin, onOpenProject, onClose }: Props) {
  const attempt = attempts.get(sourceProjectId);
  const [name, setName] = useState(attempt?.name ?? suggestedName(sourceName));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(true);
  const latest = useRef({ capture, onOpenProject });
  latest.current = { capture, onOpenProject };
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const openCreated = (request: ProjectDuplicateAttempt, automatic: boolean) => {
    if (!request.createdId) return;
    // Compare the editor history as well as the visible content. An edit
    // followed by Undo can produce the same snapshot with newer history.
    let unchanged = false;
    try {
      const current = latest.current.capture();
      const submitted = JSON.parse(request.body).snapshot as Snapshot;
      unchanged = current.capturedDraft === request.capturedDraft && fingerprint(current.snapshot) === fingerprint(submitted);
    } catch { /* An unready workspace stays open until the User chooses the copy. */ }
    if (automatic && !unchanged) return;
    if (!latest.current.onOpenProject(request.createdId, unchanged ? request.capturedDraft : undefined)) return;
    attempts.delete(sourceProjectId);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || !name.trim()) return;
    let request = attempts.get(sourceProjectId);
    if (request?.createdId) {
      openCreated(request, false);
      return;
    }
    let finish: (() => void) | undefined;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      finish = begin();
      if (!request) {
        const trimmedName = name.trim();
        const { snapshot, capturedDraft } = capture();
        request = {
          name: trimmedName,
          capturedDraft,
          body: JSON.stringify({
            sourceProjectId,
            name: trimmedName,
            requestKey: crypto.randomUUID(),
            snapshot,
          }),
        };
        attempts.set(sourceProjectId, request);
      }
      const response = await fetch('/api/project/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: request.body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.success === false && response.status >= 400 && response.status < 500 && response.status !== 408) {
          attempts.delete(sourceProjectId);
        }
        throw new Error(result?.error || `Could not confirm the Project copy (${response.status}).`);
      }
      const id = result?.data?.projectId;
      if (result?.success !== true || !Number.isSafeInteger(id) || id <= 0 || id === sourceProjectId || result.data.name !== request.name) {
        throw new Error('The server did not confirm the new Project.');
      }
      request.createdId = id;
      if (!mounted.current) return;
      openCreated(request, true);
    } catch (caught) {
      if (mounted.current && !request?.createdId) {
        setError(caught instanceof Error ? caught.message : 'Could not confirm the Project copy.');
      }
    } finally {
      finish?.();
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const close = () => {
    if (submitting.current) return;
    if (attempt?.createdId) attempts.delete(sourceProjectId);
    onClose();
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) close(); }}>
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Save As: New Version</DialogTitle>
          <DialogDescription>{attempt?.createdId
            ? `Created “${attempt.name}” (Project #${attempt.createdId}). “${sourceName}” is still open.`
            : `Save the current Scene and Design edits from “${sourceName}” in a new private Project.`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!attempt?.createdId && (
            <div className="space-y-2">
              <Label htmlFor="duplicate-project-name">New Project name</Label>
              <Input id="duplicate-project-name" autoFocus required maxLength={120} value={name} disabled={pending || !!attempt} onChange={event => setName(event.target.value)} />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {attempt && !attempt.createdId && !pending && <p className="text-sm text-muted-foreground">Retry with the original edits to confirm this copy.</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={close}>{attempt?.createdId ? 'Stay here' : attempt ? 'Close' : 'Cancel'}</Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
              {attempt?.createdId ? 'Open created Project' : pending ? 'Creating Project' : attempt ? 'Retry same copy' : 'Create and open copy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
