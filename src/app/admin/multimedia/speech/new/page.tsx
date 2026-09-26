'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Music2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { SpeechHistory } from '../SpeechHistory';
import { VersionTrack } from '../VersionTrack';
import { Button } from '@/components/ui/button';

export default function NewSpeechPage() {
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState<{ id: number; revision: number } | null>(null);
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [history, setHistory] = useState(false);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [audio, setAudio] = useState<{ url: string; title: string; text: string; voiceId: string; versionNumber: number } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const savedRef = useRef<{ id: number; revision: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/multimedia/audio/generate', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw Error('Unable to check Fish Audio configuration.'); return response.json(); })
      .then(result => setConfigured(result.configured))
      .catch(() => { if (!controller.signal.aborted) setError('Unable to check Fish Audio. Refresh to retry.'); });
    return () => {
      controller.abort();
      requestRef.current?.abort();

    };
  }, []);

  async function persist(signal: AbortSignal) {
    const current = savedRef.current;
    const response = await fetch(`/api/multimedia/speech${current ? `/${current.id}` : ''}`, {
      method: current ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ title, text, voiceId: voiceId.trim(), ...(current ? { revision: current.revision } : {}) }),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Could not save Speech.');
    const next = { id: result.data.id, revision: result.data.revision };
    savedRef.current = next; setSaved(next);
    return next;
  }

  async function saveOrGenerate(generateAudio: boolean) {
    if (requestRef.current || uncertain) return;
    const controller = new AbortController(); requestRef.current = controller;
    setBusy(true); setError(''); setNotice('');
    try {
      const record = await persist(controller.signal);
      setNotice('Speech saved.');
      if (generateAudio) {
        const response = await fetch(`/api/multimedia/speech/${record.id}/versions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
          body: JSON.stringify({ revision: record.revision, requestId: crypto.randomUUID() }),
        });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || 'Generation did not complete. Check version history.');
        if (result.data.status !== 'ready' || !result.data.storageKey) throw Error('Generation is not ready. Check version history.');
        setAudio({ url: `/api/multimedia/files?key=${encodeURIComponent(result.data.storageKey)}`, title, text, voiceId: voiceId.trim(), versionNumber: result.data.versionNumber });
        setNotice(`Version ${result.data.versionNumber} saved. Preview it, then Accept in version history.`);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setUncertain(true);
        setError(reason instanceof Error ? reason.message : 'Request interrupted. Check All Speeches before retrying.');
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      requestRef.current = null;
    }
  }

  async function refreshSaved() {
    if (!savedRef.current || requestRef.current) return;
    const controller = new AbortController(); requestRef.current = controller; setBusy(true);
    try {
      const response = await fetch(`/api/multimedia/speech/${savedRef.current.id}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not reload Speech.');
      // Explicit reload discards stale input rather than overwriting another session's work.
      setTitle(result.data.title); setText(result.data.text); setVoiceId(result.data.voiceId ?? '');
      const current = { id: result.data.id, revision: result.data.revision };
      savedRef.current = current; setSaved(current); setUncertain(false); setError(''); setNotice('Saved Speech reloaded.');
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not reload Speech.'); }
    finally { if (!controller.signal.aborted) setBusy(false); requestRef.current = null; }
  }

  return <div className="space-y-3">
    <AdminWorkspaceHeader icon={Music2} title="New Speech" description="Create speech with Fish Audio">
      <Link href="/admin/multimedia/speech" className="ml-auto text-xs underline">All Speeches</Link>
    </AdminWorkspaceHeader>
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">1. Create speech</h2>
        <label htmlFor="speech-title" className="block text-xs">Title</label>
        <input id="speech-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={255} disabled={busy} className="h-9 w-full rounded border bg-background px-2 text-sm" placeholder="Name this Speech" />
        <label htmlFor="speech-text" className="block text-xs">Text</label>
        <textarea id="speech-text" value={text} onChange={event => setText(event.target.value)} maxLength={2000} rows={9} disabled={busy} className="w-full rounded border bg-background p-3 text-sm" placeholder="What would you like the voice to say?" />
        <p className="text-right text-xs text-muted-foreground">{text.length}/2,000</p>
        <label htmlFor="speech-voice" className="block text-xs">Fish Audio voice ID</label>
        <input id="speech-voice" value={voiceId} onChange={event => setVoiceId(event.target.value)} disabled={busy} className="h-9 w-full rounded border bg-background px-2 text-sm" placeholder="Paste a voice ID" />
        <a href="https://fish.audio/discovery" target="_blank" rel="noreferrer" className="text-xs underline">Browse Fish Audio voices</a>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => saveOrGenerate(false)} disabled={busy || uncertain || !title.trim()}>Save Speech</Button>
          <Button size="sm" onClick={() => saveOrGenerate(true)} disabled={!configured || busy || uncertain || !title.trim() || !text.trim() || !/^[a-f\d]{32}$/i.test(voiceId.trim())}>{busy ? 'Working…' : 'Generate speech'}</Button>
          <span className="text-xs text-muted-foreground">Model: s2.1-pro-free</span>
        </div>
        {configured === false && <p role="status" className="text-sm text-muted-foreground">Fish Audio connection needs setup.</p>}
        {configured === null && !error && <p role="status" className="text-xs">Checking connection…</p>}
        {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}
        {uncertain && saved && <Button size="sm" variant="outline" disabled={busy} onClick={refreshSaved}>Reload saved Speech</Button>}
        {uncertain && !saved && <p className="text-xs text-red-500">Check All Speeches before creating another record.</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </section>
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">2. Preview speech</h2>
        {audio ? <>
          <audio key={audio.url} controls src={audio.url} className="w-full" aria-label="Generated speech preview" />
          <p className="text-xs text-muted-foreground">{audio.text !== text || audio.voiceId !== voiceId.trim() ? 'Preview uses your previous text and voice.' : `Version ${audio.versionNumber} saved.`}</p>
          {saved && <VersionTrack key={`${saved.id}:${audio.versionNumber}`} speechId={saved.id} versionNumber={audio.versionNumber} defaultTitle={audio.title} trackId={null} disabled={busy || uncertain} onSaved={() => setNotice(`Version ${audio.versionNumber} saved as a Track.`)} />}

        </> : <p className="text-sm text-muted-foreground">Your generated speech will appear here.</p>}
      </section>
    </div>
    {saved && <Button variant="outline" disabled={busy} onClick={() => setHistory(true)}>Version history · Speech #{saved.id}</Button>}
    {history && saved && <SpeechHistory id={saved.id} onClose={() => setHistory(false)} onChange={() => { setUncertain(true); setNotice('History changed. Reload saved Speech before editing again.'); }} />}
  </div>;
}
