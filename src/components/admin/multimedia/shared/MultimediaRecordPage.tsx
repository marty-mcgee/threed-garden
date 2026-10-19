'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Music, RefreshCw } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { multimediaDraft, multimediaEditors, multimediaPayload, type MultimediaDraft, type MultimediaKind, type MultimediaRecord } from '@/libraries/services/multimedia/editor';
import { positiveId } from '@/libraries/services/multimedia/access';
import { OwnedMultimediaPicker } from './OwnedMultimediaPicker';
import { RelatedMultimediaRecords } from './RelatedMultimediaRecords';
import { AlbumArtwork } from './AlbumArtwork';
import { S3Upload } from './S3Upload';
import { ModelFieldHelp as FieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';

export function MultimediaRecordPage({ kind, id, albumId, trackId }: { kind: MultimediaKind; id?: number; albumId?: number; trackId?: number }) {
  const router = useRouter();
  const definition = multimediaEditors[kind];
  const [record, setRecord] = useState<MultimediaRecord | null>(null);
  const [draft, setDraft] = useState<MultimediaDraft>(() => ({ ...multimediaDraft(kind), ...(albumId ? { albumId: String(albumId) } : {}), ...(trackId ? { trackId: String(trackId) } : {}) }));
  const [baseline, setBaseline] = useState<MultimediaDraft>(draft);
  const [loading, setLoading] = useState(Boolean(id)), [readError, setReadError] = useState(''), [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false), [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [previewError, setPreviewError] = useState(false);
  const [albumValid, setAlbumValid] = useState(!draft.albumId), [trackValid, setTrackValid] = useState(!draft.trackId);
  const [tab, setTab] = useState('details');
  const [relatedBusy, setRelatedBusy] = useState(false);
  const lock = useRef(false), leaving = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const busy = saving || uploading || relatedBusy;
  const blocked = busy || loading || uncertain || Boolean(readError);
  const validateAlbum = useCallback((valid: boolean) => setAlbumValid(valid), []);
  const validateTrack = useCallback((valid: boolean) => setTrackValid(valid), []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController(); setLoading(true); setReadError('');
    void fetch(`/api/multimedia/${kind}?scope=owner&id=${id}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !result.success || result.data?.id !== id) throw Error(result.error || `${definition.title} unavailable.`);
        const next = multimediaDraft(kind, result.data);
        setRecord(result.data); setDraft(next); setBaseline(next); setUncertain(false); setError('');
      }).catch(reason => { if (!controller.signal.aborted) setReadError(reason instanceof Error ? reason.message : 'Could not load record.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, kind, definition.title, revision]);

  useEffect(() => {
    if (!dirty && !busy && !uncertain) return;
    const warn = (event: BeforeUnloadEvent) => { if (!leaving.current) { event.preventDefault(); event.returnValue = ''; } };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.href === window.location.href || leaving.current) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (busy || !window.confirm(uncertain ? 'The save result is uncertain. Leave this page and check your records before saving again?' : 'Discard unsaved changes and leave this page?')) return;
      leaving.current = true; window.removeEventListener('beforeunload', warn); window.location.assign(anchor.href);
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, busy, uncertain]);

  function change(key: string, value: string | boolean) {
    if (key === 'albumId') setAlbumValid(!value);
    if (key === 'trackId') setTrackValid(!value);
    setDraft(current => ({ ...current, [key]: value })); setNotice(''); setError('');
  }
  let validation = '';
  try { multimediaPayload(kind, draft, id ? baseline : undefined); } catch (reason) { validation = reason instanceof Error ? reason.message : 'Check required fields.'; }
  if (!albumValid || !trackValid) validation = 'Choose available owned parent records, or clear an optional unavailable association.';

  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current || blocked || validation || (id && !dirty)) return;
    lock.current = true; setSaving(true); setError(''); setNotice('');
    let dispatched = false;
    try {
      const payload = multimediaPayload(kind, draft, id ? baseline : undefined);
      dispatched = true;
      const response = await fetch(`/api/multimedia/${kind}${id ? `?id=${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { if (response.status < 500) dispatched = false; const result = await response.json(); throw Error(result.error || 'Save failed.'); }
      const result = await response.json();
      if (!result.success || !positiveId(result.data?.id) || (id && result.data.id !== id)) throw Error('Save response could not be verified.');
      const next = multimediaDraft(kind, result.data);
      setRecord(result.data); setDraft(next); setBaseline(next); setPreviewError(false); setNotice('Saved.');
      if (!id) { leaving.current = true; router.replace(`/admin/multimedia/${kind}/${result.data.id}`); }
    } catch (reason) {
      setUncertain(dispatched); setError(reason instanceof Error ? reason.message : 'Save failed. Your draft is retained.');
    } finally { lock.current = false; setSaving(false); }
  }
  function reload() {
    if (busy || (dirty && !window.confirm('Discard this draft and reload the saved record?'))) return;
    setRevision(value => value + 1);
  }
  const parent = positiveId(record?.albumId ?? albumId);
  const trackParent = positiveId(record?.trackId ?? trackId);
  const title = String(record?.[kind === 'media' ? 'fileName' : 'title'] ?? `New ${definition.title}`);
  const fileUrl = String(record?.[kind === 'albums' ? 'coverArt' : 'fileUrl'] ?? '');
  const fileType = String(record?.fileType ?? '');
  const previewUrl = kind === 'tracks' && record ? `/api/multimedia/stream/${record.id}` : fileUrl;
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden text-xs [&_button]:text-xs">
    <AdminWorkspaceHeader icon={Music} title={title} description={`Manage your Multimedia ${definition.title.toLowerCase()}`}>
      <FieldHelp label={`Multimedia ${definition.title}`}>Manage your own {definition.title.toLowerCase()}. Save updates this record; related records save independently. Published public Albums expose eligible content to visitors, while drafts and unrelated uploaded files remain private.</FieldHelp>
      <Button asChild type="button" variant="outline" size="sm" className="h-7 text-xs"><Link href={`/admin/multimedia/${kind}`}><ArrowLeft className="mr-1 h-4 w-4" />{kind === 'media' ? 'Media' : `${definition.title}s`}</Link></Button>
      {parent && <Button asChild variant="outline" size="sm" className="h-7 text-xs"><Link href={`/admin/multimedia/albums/${parent}`}>Parent Album #{parent}</Link></Button>}
      {kind === 'links' && trackParent && <Button asChild variant="outline" size="sm" className="h-7 text-xs"><Link href={`/admin/multimedia/tracks/${trackParent}`}>Parent Track #{trackParent}</Link></Button>}
      <Button asChild type="button" variant="outline" size="sm" className="h-7 text-xs"><Link href="/admin/multimedia">Multimedia</Link></Button>
      {id && <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={busy || loading} onClick={reload}><RefreshCw className="mr-1 h-4 w-4" />Reload</Button>}
    </AdminWorkspaceHeader>
    {loading ? <p role="status">Loading {definition.title.toLowerCase()}…</p> : readError ? <div role="alert" className="rounded border p-4"><p>{readError}</p><Button type="button" variant="outline" onClick={reload}>Retry</Button></div> : <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        {kind === 'albums' && <AlbumArtwork key={String(draft.coverArt)} url={String(draft.coverArt ?? '')} title={String(draft.title || title)} artist={String(draft.artist ?? '')} unsaved={draft.coverArt !== baseline.coverArt} />}
      <Tabs value={tab} onValueChange={value => { if (!busy) setTab(value); }} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TabsList className="flex h-auto shrink-0 flex-wrap justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          {id && kind === 'albums' && <><TabsTrigger value="tracks">Tracks</TabsTrigger><TabsTrigger value="media">Media</TabsTrigger><TabsTrigger value="links">Links</TabsTrigger></>}
          {id && kind === 'tracks' && <TabsTrigger value="links">Links</TabsTrigger>}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="details">
            <form id="multimedia-record" onSubmit={save} className="space-y-3 pb-3">
              <section className="admin-editor-panel space-y-3 rounded-md border p-3">
                <h2 className="text-xs font-semibold">{definition.title} details {id ? `· #${id}` : ''}</h2>
                <fieldset disabled={blocked} className="grid min-w-0 gap-3 md:grid-cols-2">
                  {definition.fields.map(field => <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : 'min-w-0'}>
                    <Label className="text-xs" htmlFor={`record-${field.key}`}>{field.label}{field.required ? ' *' : ''}</Label>
                    {field.type === 'boolean' ? <input id={`record-${field.key}`} type="checkbox" className="ml-2" checked={Boolean(draft[field.key])} onChange={event => change(field.key, event.target.checked)} /> :
                      field.type === 'textarea' ? <Textarea className="min-h-24 text-xs" id={`record-${field.key}`} value={String(draft[field.key])} onChange={event => change(field.key, event.target.value)} /> :
                      field.type === 'select' ? <select id={`record-${field.key}`} className="block h-7 w-full rounded-md border bg-background px-2 text-xs" value={String(draft[field.key])} onChange={event => change(field.key, event.target.value)}>{field.choices?.map(value => <option key={value}>{value}</option>)}</select> :
                      <Input className="h-7 text-xs" id={`record-${field.key}`} type={field.type === 'number' ? 'number' : 'text'} min={field.type === 'number' ? field.min ?? 0 : undefined} max={field.max} step={field.type === 'number' ? 1 : undefined} required={field.required} value={String(draft[field.key])} onChange={event => change(field.key, event.target.value)} />}
                    {['sortOrder', 'trackNumber', 'displayOrder'].includes(field.key) && <p className="mt-1 text-xs text-muted-foreground">-10000 to 10000; 0 is neutral. Lower values appear first within the parent. Equal values use record ID.</p>}
                  </div>)}
                </fieldset>
              </section>
              {kind !== 'albums' && <section className="admin-editor-panel space-y-3 rounded-md border p-3"><h2 className="text-xs font-semibold">Owned associations</h2>
                <OwnedMultimediaPicker kind="albums" value={String(draft.albumId)} disabled={blocked} onChange={value => change('albumId', value)} onValidityChange={validateAlbum} />
                {kind === 'links' && <OwnedMultimediaPicker kind="tracks" value={String(draft.trackId)} albumId={positiveId(draft.albumId) ?? undefined} disabled={blocked} onChange={value => change('trackId', value)} onValidityChange={validateTrack} />}
              </section>}
              {kind !== 'links' && <section className="admin-editor-panel space-y-3 rounded-md border p-3"><h2 className="text-xs font-semibold">Upload</h2>
                <S3Upload kind={kind === 'albums' ? 'image' : 'media'} disabled={blocked} onBusyChange={setUploading} onUploaded={file => {
                  setDraft(current => kind === 'albums' ? { ...current, coverArt: file.fileUrl } : { ...current, fileUrl: file.fileUrl, fileType: file.fileType, fileSize: String(file.fileSize), ...(kind === 'media' ? { fileName: file.fileName } : {}) }); setNotice('Uploaded. Save to attach this file.');
                }} />
              </section>}
              {kind !== 'albums' && fileUrl && <section className="admin-editor-panel space-y-3 rounded-md border p-3"><h2 className="text-xs font-semibold">Saved preview</h2>
                {fileType.startsWith('image/') ? <img src={previewUrl} alt={title} className="max-h-64 max-w-full rounded" onError={() => setPreviewError(true)} /> : fileType.startsWith('video/') ? <video controls preload="metadata" src={previewUrl} className="max-h-80 max-w-full" onError={() => setPreviewError(true)} /> : fileType.startsWith('audio/') ? <audio controls preload="metadata" src={previewUrl} onError={() => setPreviewError(true)} /> : <p>No supported preview for this file type.</p>}
                {previewError && <p role="alert">This saved file could not be previewed. Check access and browser format support.</p>}
              </section>}
            </form>
          </TabsContent>
          {id && kind === 'albums' && (['tracks', 'media', 'links'] as const).map(child => <TabsContent key={child} value={child}><RelatedMultimediaRecords kind={child} albumId={id} disabled={saving || uploading || dirty || uncertain} onBusyChange={setRelatedBusy} /></TabsContent>)}
          {id && kind === 'tracks' && <TabsContent value="links"><RelatedMultimediaRecords kind="links" trackId={id} albumId={parent ?? undefined} disabled={saving || uploading || dirty || uncertain} onBusyChange={setRelatedBusy} /></TabsContent>}
        </div>
      </Tabs>
      </div>
      <div className="shrink-0 space-y-1 border-t pt-2">
        {error && <p role="alert" className="text-sm text-red-500">{error} Your draft is retained.</p>}
        {uncertain && <p role="alert" className="text-sm text-yellow-500">Save outcome is uncertain. {id ? 'Reload the saved record before trying again.' : 'Check the list before creating this record again.'}</p>}
        {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}
        {validation && <p className="text-xs text-muted-foreground">{validation}</p>}
        {tab !== 'details' && dirty && <p className="text-xs">Save or discard Details changes before modifying related records.</p>}
        <div className="admin-editor-actions">
          <Button type="button" variant="success" size="sm" className="h-7 text-xs" disabled={blocked || Boolean(validation) || (Boolean(id) && !dirty)} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={busy || uncertain || !dirty} onClick={() => { if (window.confirm('Discard unsaved changes?')) { setDraft(baseline); setError(''); setNotice('Draft discarded.'); } }}>Discard</Button>
          <Button asChild type="button" variant="outline" size="sm" className="h-7 text-xs"><Link href={kind === 'links' && trackParent ? `/admin/multimedia/tracks/${trackParent}` : parent ? `/admin/multimedia/albums/${parent}` : `/admin/multimedia/${kind}`}>Cancel</Link></Button>
        </div>
      </div>
    </>}
  </div>;
}
