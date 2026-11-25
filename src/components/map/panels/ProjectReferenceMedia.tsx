'use client';

import { useEffect, useState } from 'react';
import { useSceneMultimedia } from '../multimedia/SceneMultimediaProvider';
import { referenceMediaFile, referenceMediaUrl } from '@/libraries/services/project/reference-media-file';

type Item = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  assigned: number | null;
  direct: boolean;
  viaModule: boolean;
};

const assignmentChanged = 'project-reference-media-changed';

export function ProjectReferenceMedia({ projectId, search, manage = true }: { projectId: string; search: string; manage?: boolean }) {
  const multimedia = useSceneMultimedia();
  const [library, setLibrary] = useState(false);
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; items: Item[]; hasMore: boolean }>();
  const [previewId, setPreviewId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const query = new URLSearchParams({ projectId, search, library: library ? '1' : '0', offset: String(offset) });
  const url = '/api/project/reference-media?' + query;
  const key = url + ':' + revision;
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const changed = (event: Event) => {
      if ((event as CustomEvent<string>).detail === projectId) refresh();
    };
    window.addEventListener(assignmentChanged, changed);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(assignmentChanged, changed);
      window.removeEventListener('focus', refresh);
    };
  }, [projectId]);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    fetch(url, { signal: abort.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!abort.signal.aborted) setResult({ key, items: data.items, hasMore: data.hasMore });
    }).catch(() => { if (!abort.signal.aborted) setError('Could not load reference Media.'); });
    return () => abort.abort();
  }, [key, url]);
  async function assign(item: Item) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(url + '&mediaId=' + item.id, { method: item.direct ? 'DELETE' : 'PUT' });
      if (!response.ok) throw Error();
      if (!library && offset && !item.viaModule && result?.items.length === 1) setOffset(offset - 25);
      window.dispatchEvent(new CustomEvent(assignmentChanged, { detail: projectId }));
    } catch { setError('Could not update this Project assignment.'); }
    finally { setBusy(false); }
  }
  const current = result?.key === key ? result : undefined;
  const preview = current?.items.find(item => item.id === previewId);
  const href = preview && referenceMediaUrl(preview.fileUrl, window.location.origin);
  function openItem(item: Item) {
    if (!item.fileType.startsWith('image/') && !item.fileType.startsWith('video/')) {
      setPreviewId(item.id);
      return;
    }
    const file = referenceMediaFile(item, window.location.origin);
    if (!file || multimedia?.projectId !== Number(projectId)) {
      setError('This file could not be opened.');
      return;
    }
    setError('');
    setPreviewId(undefined);
    multimedia.openReference(file, library && !item.direct && !item.viaModule);
  }
  return <section aria-label="Reference Media" className="space-y-2 rounded border p-2 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>Reference Media</strong>
      {manage && <button type="button" className="underline" onClick={() => { setLibrary(!library); setOffset(0); }}>{library ? 'Show Project Media' : 'Add Media'}</button>}
    </div>
    {library && <a className="underline" href="/admin/multimedia/media/new" target="_blank" rel="noopener noreferrer">Upload Media in a new tab</a>}
    {current?.items.map(item => {
      const image = item.fileType.startsWith('image/') && referenceMediaUrl(item.fileUrl, window.location.origin);
      const action = item.direct ? (item.viaModule ? 'Remove direct reference' : 'Remove') : 'Add';
      return <div key={item.id} className="flex items-center justify-between gap-2">
        <button type="button" className="flex min-w-0 items-center gap-2 text-left" onClick={() => openItem(item)}>
          {image && <img src={image} alt="" loading="lazy" className="size-12 shrink-0 rounded border object-cover" />}
          <span className="min-w-0 break-words underline">{item.fileName}</span>
        </button>
        {manage && (item.viaModule && !item.direct
          ? <span className="text-muted-foreground">Assigned in Admin</span>
          : <button type="button" disabled={busy} aria-label={action + ': ' + item.fileName} onClick={() => assign(item)}>{action}</button>)}
      </div>;
    })}
    {!current && !error && <p role="status">Loading Media…</p>}
    {current && !current.items.length && <p>{library ? 'No matching Media in your library.' : 'No matching reference Media in this Project.'}</p>}
    {error && <p role="alert">{error}</p>}
    <div className="flex gap-2"><button type="button" onClick={() => setRevision(value => value + 1)}>Refresh</button>
      {offset > 0 && <button type="button" onClick={() => setOffset(offset - 25)}>Previous</button>}
      {current?.hasMore && <button type="button" onClick={() => setOffset(offset + 25)}>Next</button>}
    </div>
    {preview && <figure className="space-y-1">
      {href && preview.fileType.startsWith('audio/') && <audio controls src={href} className="w-full" />}
      <figcaption>{preview.fileName}</figcaption>
      {href && <a href={href} target="_blank" rel="noopener noreferrer" className="mr-3 underline">Open file</a>}
      <button type="button" onClick={() => setPreviewId(undefined)}>Close preview</button>
    </figure>}
  </section>;
}
