'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VersionTrack } from './VersionTrack';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Version = { trackId: number | null; id: number; versionNumber: number; draftRevision: number; status: string; storageKey: string | null; errorCode: string | null; providerStatus: number | null; createdAt: string };
type RecordState = { title: string; revision: number; archivedAt: string | null; acceptedVersionNumber: number | null };

export function SpeechHistory({ id, onClose, onChange }: { id: number; onClose: () => void; onChange: () => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [record, setRecord] = useState<RecordState | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const sequence = useRef(0);
  const [uncertain, setUncertain] = useState(false);
  const load = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/multimedia/speech/${id}/versions?offset=${offset}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load history.');
      if (sequence.current !== current) return;
      setVersions(result.data); setRecord(result.speech); setHasMore(result.hasMore); setUncertain(false);
    } catch (reason) { if (sequence.current === current) setError(reason instanceof Error ? reason.message : 'Could not load history.'); }
    finally { if (sequence.current === current) setLoading(false); }
  }, [id, offset]);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  async function action(versionNumber?: number) {
    if (!record || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/multimedia/speech/${id}/versions`, {
        method: versionNumber ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionNumber ? { versionNumber, revision: record.revision } : { revision: record.revision, requestId: crypto.randomUUID() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not complete this action.');
      if (offset) setOffset(0);
      else await load();
      onChange();
    } catch (reason) {
      setUncertain(true);
      setError(reason instanceof Error ? reason.message : 'Request interrupted. Refresh history before trying again.');
    } finally { lock.current = false; setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
    <DialogHeader><DialogTitle>{record?.title ?? 'Speech'} — Versions</DialogTitle></DialogHeader>
    <div className="flex flex-wrap items-center gap-2"><Button disabled={busy || loading || uncertain || !record || !!record.archivedAt} onClick={() => action()}>{busy ? 'Working…' : 'Generate new version'}</Button><Button variant="outline" disabled={busy || loading} onClick={() => { setError(''); void load(); }}>Refresh history</Button></div>
    <p className="text-xs text-muted-foreground">Uses the saved draft. Preview a ready version, then choose Accept. Generating keeps your accepted audio.</p>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {!loading && !versions.length && <p className="text-sm text-muted-foreground">No generated versions yet.</p>}
    {versions.map(version => <div key={version.id} className="space-y-2 rounded border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><span>Version {version.versionNumber} · {version.status}{record?.acceptedVersionNumber === version.versionNumber ? ' · Accepted' : ''}</span><span className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</span></div>
      {version.status === 'ready' && version.storageKey && <><audio controls preload="none" className="w-full" src={`/api/music/files?key=${encodeURIComponent(version.storageKey)}`} /><Button size="sm" variant="outline" disabled={busy || loading || uncertain || !!record?.archivedAt || record?.acceptedVersionNumber === version.versionNumber} onClick={() => action(version.versionNumber)}>Accept version {version.versionNumber}</Button></>}
      {version.status === 'ready' && <VersionTrack speechId={id} versionNumber={version.versionNumber} defaultTitle={record?.title ?? 'Speech'} trackId={version.trackId} disabled={busy || loading || !!record?.archivedAt} onSaved={() => { void load(); onChange(); }} />}
      {version.errorCode && <p className="text-xs text-red-500">{version.errorCode.replaceAll('_', ' ')}{version.providerStatus ? ` · Fish Audio HTTP ${version.providerStatus}` : ''}</p>}
      {(version.status === 'generating' || version.status === 'pending') && <p className="text-xs text-muted-foreground">Refresh to check completion. Interrupted attempts can be superseded by a new generation after 10 minutes.</p>}
    </div>)}
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy || loading || !offset} onClick={() => setOffset(offset - 25)}>Previous</Button><Button variant="outline" disabled={busy || loading || !hasMore} onClick={() => setOffset(offset + 25)}>Next</Button></div>
  </DialogContent></Dialog>;
}
