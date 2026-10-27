'use client';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FileText, Plus, SquarePen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultimediaWorkspaceHeader } from '../shared/MultimediaWorkspaceHeader';
import { MultimediaRecordsSearch, MultimediaRecordsTable, MultimediaStatus, useMultimediaRecords } from '../shared/MultimediaRecordsWorkspace';
import { LyricsAssignmentPicker, type LyricsAssignment, type LyricsAssignmentKind } from './LyricsAssignmentPicker';
import { LYRICS_CONTENT_LIMIT } from '@/libraries/services/multimedia/lyrics-input';

type Form = { title: string; content: string; sortOrder: string; isActive: boolean; metadata: string; projects: LyricsAssignment[]; albums: LyricsAssignment[]; tracks: LyricsAssignment[] };
const blank = (): Form => ({ title: '', content: '', sortOrder: '0', isActive: true, metadata: '{}', projects: [], albums: [], tracks: [] });
function assignmentBadges(value: unknown, kind: LyricsAssignmentKind) {
  const assignments = value as LyricsAssignment[] | undefined;
  const basePath = kind === 'projects' ? '/admin/projects' : `/admin/multimedia/${kind}`;
  return <div className="flex max-w-xs flex-wrap gap-1">{assignments?.length
    ? assignments.map(item => <Badge key={item.id} asChild variant="secondary" className="max-w-full whitespace-normal break-words text-[10px] hover:underline"><Link href={`${basePath}/${item.id}`}>{item.title}</Link></Badge>)
    : '—'}</div>;
}
function LyricsWorkspace() {
  const records = useMultimediaRecords('lyrics', true);
  const [open, setOpen] = useState(false), [id, setId] = useState<number | null>(null), [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false), [reading, setReading] = useState(false), [readFailed, setReadFailed] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const baseline = useRef(JSON.stringify(blank())), token = useRef(0), saving = useRef(false);
  const workspace = { ...records, busy: records.busy || busy || reading };
  function close(value: boolean) {
    if (value || saving.current) return;
    if (!reading && JSON.stringify(form) !== baseline.current && !window.confirm('Discard unsaved Lyrics changes?')) return;
    token.current++; setOpen(false); setReading(false);
  }
  async function edit(nextId: number | null) {
    if (workspace.busy) return;
    const generation = ++token.current;
    setId(nextId); setError(''); setNotice(''); setReadFailed(false); setForm(blank()); baseline.current = JSON.stringify(blank()); setOpen(true);
    if (nextId === null) return;
    setReading(true);
    try {
      const response = await fetch(`/api/multimedia/lyrics?id=${nextId}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Lyrics could not be opened.');
      if (generation !== token.current) return;
      const next = { title: result.data.title, content: result.data.content, sortOrder: String(result.data.sortOrder), isActive: result.data.isActive,
        metadata: JSON.stringify(result.data.metadata, null, 2), projects: result.data.projects, albums: result.data.albums, tracks: result.data.tracks };
      setForm(next); baseline.current = JSON.stringify(next);
    } catch (reason) { if (generation === token.current) { setReadFailed(true); setError(reason instanceof Error ? reason.message : 'Lyrics could not be opened.'); } }
    finally { if (generation === token.current) setReading(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving.current || reading || readFailed) return;
    setError('');
    let metadata: unknown;
    try { metadata = JSON.parse(form.metadata || '{}'); }
    catch { setError('Metadata must be a valid JSON object.'); return; }
    if (!form.sortOrder.trim()) { setError('Sort Order is required.'); return; }
    saving.current = true; setBusy(true);
    try {
      const response = await fetch('/api/multimedia/lyrics', { method: id === null ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(id === null ? {} : { id }), title: form.title, content: form.content, sortOrder: Number(form.sortOrder), isActive: form.isActive, metadata,
          projectIds: form.projects.map(item => item.id), albumIds: form.albums.map(item => item.id), trackIds: form.tracks.map(item => item.id) }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Lyrics could not be saved.');
      setOpen(false); setNotice('Lyrics saved.'); records.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Lyrics could not be saved.'); }
    finally { saving.current = false; setBusy(false); }
  }
  return <div className="flex h-full min-h-0 flex-col gap-2">
    <MultimediaWorkspaceHeader moduleKey="lyrics" pageHeader icon={FileText} title="Lyrics" count={records.total} search={<MultimediaRecordsSearch workspace={workspace} />}>
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={workspace.busy} onClick={records.reload}>Refresh</Button>
      <Button size="sm" className="h-7 px-2 text-xs" disabled={workspace.busy} onClick={() => void edit(null)}><Plus className="mr-1 h-3.5 w-3.5" />Add Lyrics</Button>
    </MultimediaWorkspaceHeader>
    {notice && <p role="status" className="text-xs text-green-600 dark:text-green-400">{notice}</p>}
    <MultimediaRecordsTable workspace={workspace} label="Lyrics" columns={[
      { field: 'title', label: 'Title', render: row => <span className="inline-flex items-center gap-2"><ModuleIcon moduleKey="lyrics" className="h-3.5 w-3.5" />{String(row.title)} <span className="text-muted-foreground">#{row.id}</span></span> },
      { field: 'albums', label: 'Albums', sortable: false, render: row => assignmentBadges(row.albums, 'albums') },
      { field: 'tracks', label: 'Tracks', sortable: false, render: row => assignmentBadges(row.tracks, 'tracks') },
      { field: 'projects', label: 'Projects', sortable: false, render: row => assignmentBadges(row.projects, 'projects') },
      { field: 'sortOrder', label: 'Sort Order' }, { field: 'isActive', label: 'Active', render: row => <MultimediaStatus value={row.isActive} /> },
      { field: 'updatedAt', label: 'Updated', render: row => row.updatedAt ? new Date(String(row.updatedAt)).toLocaleDateString() : '—' },
    ]} actions={row => <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={workspace.busy} onClick={() => void edit(row.id)}><SquarePen className="mr-1 h-3.5 w-3.5" />Edit</Button>} />
    <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{id === null ? 'Add Lyrics' : `Edit Lyrics #${id}`}</DialogTitle></DialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {reading && <p role="status" className="text-xs text-muted-foreground">Loading Lyrics…</p>}
      <form onSubmit={save} className="space-y-3"><fieldset disabled={busy || reading || readFailed} className="space-y-3">
        <div className="space-y-1"><Label htmlFor="lyrics-title">Title</Label><Input id="lyrics-title" required maxLength={255} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="lyrics-content">Lyrics</Label><Textarea id="lyrics-content" rows={10} maxLength={LYRICS_CONTENT_LIMIT} value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} /></div>
        <div className="flex flex-wrap items-end gap-4"><div className="space-y-1"><Label htmlFor="lyrics-order">Sort Order</Label><Input id="lyrics-order" className="w-36" type="number" required min={-10000} max={10000} step={1} value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} /></div><div className="flex h-9 items-center gap-2"><Switch id="lyrics-active" checked={form.isActive} onCheckedChange={isActive => setForm({ ...form, isActive })} /><Label htmlFor="lyrics-active">Active</Label></div></div>
        <div className="space-y-2"><p className="text-xs text-muted-foreground">Assignments are optional. Lyrics can stand alone.</p>{(['projects', 'albums', 'tracks'] as LyricsAssignmentKind[]).map(kind => <LyricsAssignmentPicker key={`${id ?? 'new'}-${kind}`} kind={kind} selected={form[kind]} disabled={busy || reading} onChange={items => setForm(current => ({ ...current, [kind]: items }))} />)}</div>
        <details className="rounded-md border p-2"><summary className="cursor-pointer text-xs font-medium">Metadata (optional)</summary><Label htmlFor="lyrics-metadata" className="sr-only">Metadata JSON</Label><Textarea id="lyrics-metadata" className="mt-2 font-mono text-xs" rows={4} value={form.metadata} onChange={event => setForm({ ...form, metadata: event.target.value })} /></details>
      </fieldset><div className="flex gap-2 rounded-md border border-green-500/20 bg-green-500/5 p-2"><Button type="submit" size="sm" disabled={busy || reading || readFailed}>{busy ? 'Saving…' : 'Save Changes'}</Button><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => close(false)}>Cancel</Button></div></form>
    </DialogContent></Dialog>
  </div>;
}
export function MultimediaLyricsCRUD() {
  const { data: session } = useSession();
  return <LyricsWorkspace key={session?.user?.id ?? 'anonymous'} />;
}
