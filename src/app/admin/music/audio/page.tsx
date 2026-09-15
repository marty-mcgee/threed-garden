'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Music2 } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { SaveSpeechTrack } from '@/components/admin/music/audio/SaveSpeechTrack';
import { Button } from '@/components/ui/button';

export default function ThreeDAudioPage() {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [audio, setAudio] = useState<{ url: string; blob: Blob; text: string; voiceId: string } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const audioRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/music/audio/generate', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw Error('Unable to check Fish Audio configuration.'); return response.json(); })
      .then(result => setConfigured(result.configured))
      .catch(() => { if (!controller.signal.aborted) setError('Unable to check Fish Audio. Refresh to retry.'); });
    return () => {
      controller.abort();
      requestRef.current?.abort();
      if (audioRef.current) URL.revokeObjectURL(audioRef.current);
    };
  }, []);

  async function generate() {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true); setError('');
    const draft = { text, voiceId: voiceId.trim() };
    try {
      const response = await fetch('/api/music/audio/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft), signal: controller.signal,
      });
      if (!response.ok) { const result = await response.json(); throw Error(result.error || 'Speech generation failed.'); }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      if (audioRef.current) URL.revokeObjectURL(audioRef.current);
      audioRef.current = url;
      setAudio({ url, blob, ...draft });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Speech generation failed.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      requestRef.current = null;
    }
  }

  return <div className="space-y-3">
    <AdminWorkspaceHeader icon={Music2} title="ThreeD Audio" description="Create speech with Fish Audio">
      <Link href="/admin/music/tracks" className="ml-auto text-xs underline">Music Tracks</Link>
    </AdminWorkspaceHeader>
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">1. Create speech</h2>
        <label htmlFor="speech-text" className="block text-xs">Text</label>
        <textarea id="speech-text" value={text} onChange={event => setText(event.target.value)} maxLength={2000} rows={9} disabled={busy || saving} className="w-full rounded border bg-background p-3 text-sm" placeholder="What would you like the voice to say?" />
        <p className="text-right text-xs text-muted-foreground">{text.length}/2,000</p>
        <label htmlFor="speech-voice" className="block text-xs">Fish Audio voice ID</label>
        <input id="speech-voice" value={voiceId} onChange={event => setVoiceId(event.target.value)} disabled={busy || saving} className="h-9 w-full rounded border bg-background px-2 text-sm" placeholder="Paste a voice ID" />
        <a href="https://fish.audio/discovery" target="_blank" rel="noreferrer" className="text-xs underline">Browse Fish Audio voices</a>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={generate} disabled={!configured || busy || saving || !text.trim() || !/^[a-f\d]{32}$/i.test(voiceId.trim())}>{busy ? 'Generating…' : 'Generate speech'}</Button>
          <span className="text-xs text-muted-foreground">Model: s2.1-pro-free</span>
        </div>
        {configured === false && <p role="status" className="text-sm text-muted-foreground">Fish Audio connection needs setup.</p>}
        {configured === null && !error && <p role="status" className="text-xs">Checking connection…</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </section>
      <section className="space-y-3 rounded-lg border p-3">
        <h2 className="text-sm font-semibold">2. Preview speech</h2>
        {audio ? <>
          <audio key={audio.url} controls src={audio.url} className="w-full" aria-label="Generated speech preview" />
          <p className="text-xs text-muted-foreground">{audio.text !== text || audio.voiceId !== voiceId.trim() ? 'Preview uses your previous text and voice.' : 'Preview ready. Save it below to create a Track.'}</p>
          <a href={audio.url} download="speech.mp3" className="inline-block text-sm underline">Download MP3</a>
        </> : <p className="text-sm text-muted-foreground">Your generated speech will appear here.</p>}
      </section>
    </div>
    {audio && <SaveSpeechTrack key={audio.url} speech={audio} disabled={busy} onBusyChange={setSaving} />}
  </div>;
}
