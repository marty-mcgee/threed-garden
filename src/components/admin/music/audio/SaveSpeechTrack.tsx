'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Speech { blob: Blob; text: string; voiceId: string }
interface SavedFile { fileUrl: string; fileSize: number; fileType: string }
export function SaveSpeechTrack({ speech, disabled, onBusyChange }: {
  speech: Speech; disabled: boolean; onBusyChange: (busy: boolean) => void;
}) {
  const [title, setTitle] = useState('Speech');
  const [albumId, setAlbumId] = useState('');
  const [albums, setAlbums] = useState<{ id: number; title: string }[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [albumError, setAlbumError] = useState('');
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const uploaded = useRef<SavedFile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setAlbumError('');
    void fetch(`/api/music/albums?scope=owner&limit=50&offset=${page * 50}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.success) throw Error('Unable to load Albums.');
        if (!controller.signal.aborted) { setAlbums(data.data); setTotal(data.pagination.total); }
      }).catch(() => { if (!controller.signal.aborted) setAlbumError('Unable to load Albums.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, reload]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function save() {
    if (controllerRef.current || saved || uncertain || !albumId || !title.trim()) return;
    const controller = new AbortController(); controllerRef.current = controller;
    setBusy(true); onBusyChange(true); setError('');
    let registering = false;
    try {
      if (!uploaded.current) {
        setStatus('Uploading speech to S3…');
        const name = `${title.trim().replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0, 200)}.mp3`;
        const details = { name, size: speech.blob.size, kind: 'audio' };
        const api = async (body: object) => {
          const response = await fetch('/api/music/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || 'S3 upload failed.');
          return data;
        };
        const start = await api({ ...details, action: 'start' });
        const transfer = await fetch(start.url, { method: 'PUT', headers: { 'Content-Type': start.contentType }, body: speech.blob, signal: controller.signal });
        if (!transfer.ok) throw Error('S3 rejected the speech upload.');
        setStatus('Verifying uploaded speech…');
        uploaded.current = await api({ ...details, action: 'complete', key: start.key });
      }
      setStatus('Saving Track…');
      registering = true;
      const response = await fetch('/api/music/tracks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ ...uploaded.current, title: title.trim(), albumId: Number(albumId), status: 'active',
          lyrics: speech.text, metadata: { source: 'fish-audio', voiceId: speech.voiceId, model: 's2.1-pro-free' } }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        // Validation failures are safe to correct; a server failure may follow a committed write.
        registering = response.status >= 500;
        throw Error(data.error || 'Unable to save Track.');
      }
      registering = false;
      if (!controller.signal.aborted) { setSaved(true); setStatus('Saved to Music Tracks.'); }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setUncertain(registering);
        setStatus('');
        setError(registering ? 'Save result could not be confirmed. Check Music Tracks before saving again.' : reason instanceof Error ? reason.message : 'Unable to save speech.');
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      controllerRef.current = null; onBusyChange(false);
    }
  }

  return <section className="space-y-3 rounded-lg border p-3">
    <h2 className="text-sm font-semibold">3. Save as Track</h2>
    <label className="block text-xs">Track title
      <input value={title} maxLength={200} disabled={disabled || busy || saved || uncertain} onChange={event => setTitle(event.target.value)} className="mt-1 h-9 w-full rounded border bg-background px-2 text-sm" />
    </label>
    <label className="block text-xs">Album
      <select value={albumId} disabled={disabled || busy || saved || uncertain || loading || !!albumError} onChange={event => setAlbumId(event.target.value)} className="mt-1 h-9 w-full rounded border bg-background px-2 text-sm">
        <option value="">{loading ? 'Loading Albums…' : 'Choose an Album'}</option>
        {albums.map(album => <option key={album.id} value={album.id}>{album.title}</option>)}
      </select>
    </label>
    {total > 50 && <div className="flex items-center gap-2 text-xs">
      <Button size="sm" variant="ghost" disabled={busy || saved || uncertain || loading || page === 0} onClick={() => { setAlbumId(''); setPage(page - 1); }}>Previous</Button>
      <span>Page {page + 1} of {Math.ceil(total / 50)}</span>
      <Button size="sm" variant="ghost" disabled={busy || saved || uncertain || loading || (page + 1) * 50 >= total} onClick={() => { setAlbumId(''); setPage(page + 1); }}>Next</Button>
    </div>}
    {albumError && <div role="alert" className="text-xs text-red-500">{albumError} <Button variant="ghost" size="sm" onClick={() => setReload(reload + 1)}>Retry</Button></div>}
    {!loading && !albumError && total === 0 && <Link href="/admin/music/albums" className="text-xs underline">Create an Album first</Link>}
    <Button size="sm" onClick={save} disabled={disabled || busy || saved || uncertain || loading || !!albumError || !albumId || !title.trim()}>{saved ? 'Saved' : busy ? 'Saving…' : 'Save as Track'}</Button>
    {status && <p role="status" className={`text-xs ${saved ? 'text-emerald-500' : 'text-muted-foreground'}`}>{status}</p>}
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {(saved || uncertain) && <Link href="/admin/music/tracks" className="block text-sm underline">Open Music Tracks</Link>}
  </section>;
}
