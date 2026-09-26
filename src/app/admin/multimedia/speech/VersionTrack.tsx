'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function VersionTrack({ speechId, versionNumber, defaultTitle, trackId, disabled, onSaved }: { speechId: number; versionNumber: number; defaultTitle: string; trackId: number | null; disabled: boolean; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [albums, setAlbums] = useState<{id: number; title: string}[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [albumId, setAlbumId] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<number | null>(null);
  const lock = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setLoading(true); setError('');
    fetch(`/api/multimedia/albums?scope=owner&limit=50&offset=${page * 50}`, { signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw Error('Could not load Albums.');
      if (!controller.signal.aborted) { setAlbums(result.data); setTotal(result.pagination.total); }
    }).catch(() => { if (!controller.signal.aborted) setError('Could not load Albums.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, page, retry]);
  async function save() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/multimedia/speech/${speechId}/versions/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versionNumber, title, albumId: Number(albumId) }) });
      const result = await response.json(); if (!response.ok) throw Error(result.error || 'Could not save Track.');
      setSavedId(result.trackId); onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save Track. You can retry safely.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (trackId || savedId) return <Link className="text-xs text-green-500 underline" href="/admin/multimedia/tracks">Track #{trackId || savedId} saved · View Tracks</Link>;
  return <div className="space-y-2">
    {!open ? <Button size="sm" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>Save as Track</Button> : <>
      <input aria-label="Track title" className="h-8 w-full rounded border bg-background px-2 text-sm" maxLength={255} value={title} disabled={busy || disabled} onChange={event => setTitle(event.target.value)} />
      <select aria-label="Track Album" className="h-8 w-full rounded border bg-background px-2 text-sm" value={albumId} disabled={busy || disabled || loading} onChange={event => setAlbumId(event.target.value)}><option value="">Choose Album…</option>{albums.map(album => <option key={album.id} value={album.id}>{album.title}</option>)}</select>
      {total > 50 && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy || loading || !page} onClick={() => { setPage(page - 1); setAlbumId(''); }}>Previous Albums</Button><Button size="sm" variant="outline" disabled={busy || loading || (page + 1) * 50 >= total} onClick={() => { setPage(page + 1); setAlbumId(''); }}>Next Albums</Button></div>}
      <Button size="sm" disabled={busy || disabled || loading || !albumId || !title.trim()} onClick={save}>{busy ? 'Saving…' : 'Save Track'}</Button>
      {error && <p role="alert" className="text-xs text-red-500">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Reload Albums</button></p>}
    </>}
  </div>;
}
