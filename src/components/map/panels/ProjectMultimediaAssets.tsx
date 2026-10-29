'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';

type Album = {
  id: number;
  title: string;
  artist: string;
};

export function ProjectMultimediaAssets({ projectId, search }: { projectId: string; search: string }) {
  const { data: session, status } = useSession();
  const scope = `${status}:${session?.user?.id ?? 'public'}:${projectId}:${search}`;
  const [page, setPage] = useState({
    scope: '',
    offset: 0,
  });
  const offset = page.scope === scope ? page.offset : 0;
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    albums: Album[];
    hasMore: boolean;
    error: string;
  } | null>(null);
  const key = `${status}:${session?.user?.id ?? 'public'}:${projectId}:${search}:${offset}:${retry}`;
  useEffect(() => {
    if (status === 'loading') return;
    const abort = new AbortController();
    const query = new URLSearchParams({ projectId, search, offset: String(offset) });
    void fetch(`/api/project/multimedia-albums?${query}`, { signal: abort.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw Error('Multimedia could not be loaded.');
        return response.json();
      })
      .then(data => {
        if (!abort.signal.aborted) setResult({ key, albums: data.albums, hasMore: data.hasMore, error: '' });
      })
      .catch(() => {
        if (!abort.signal.aborted) setResult({ key, albums: [], hasMore: false, error: 'Multimedia could not be loaded.' });
      });
    return () => abort.abort();
  }, [projectId, search, offset, retry, key, status]);

  const current = result?.key === key ? result : null;
  return <details open className="rounded-md border border-foreground/10 p-2">
    <summary className="cursor-pointer text-xs font-semibold">
      <ModuleIcon moduleKey="multimedia" className="mr-1 inline size-3.5" />Multimedia
    </summary>
    <div className="mt-2 space-y-2 text-xs" aria-live="polite">
      {!current && <p>Loading Albums…</p>}
      {current?.error && <p role="alert">{current.error}</p>}
      {current && !current.error && !current.albums.length && <p>No available Albums{search ? ' match this search' : ' assigned to this Project'}.</p>}
      {current?.albums.map(album => <div key={album.id} className="rounded border border-foreground/10 p-2">
        <p className="font-medium">{album.title}</p>
        <p className="text-muted-foreground">{album.artist}</p>
      </div>)}
      <div className="flex gap-1">
        <Button size="xs" variant="ghost" onClick={() => setRetry(value => value + 1)}>Refresh</Button>
        {offset > 0 && <Button size="xs" variant="ghost" onClick={() => setPage({ scope, offset: Math.max(0, offset - 50) })}>Previous</Button>}
        {current?.hasMore && <Button size="xs" variant="ghost" onClick={() => setPage({ scope, offset: offset + 50 })}>Next</Button>}
      </div>
    </div>
  </details>;
}
