'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type Lyrics = {
  id: number;
  title: string;
  content: string;
  assignedToAlbum?: boolean;
  tracks?: { id: number; title: string }[];
};
type LyricsPage = { endpoint: string; offset: number; data: Lyrics[]; hasMore: boolean };

export function LyricsPanel({ endpoint, title, emptyMessage }: {
  endpoint: string;
  title: string;
  emptyMessage: string;
}) {
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState<LyricsPage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setPage(null);
    setError('');
    async function read() {
      try {
        const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}offset=${offset}`, {
          signal: controller.signal, cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Lyrics could not be loaded.');
        if (!cancelled) setPage({ endpoint, offset, data: result.data, hasMore: result.hasMore === true });
      } catch {
        if (!cancelled) setError('Lyrics could not be loaded. Please try again.');
      }
    }
    void read();
    return () => { cancelled = true; controller.abort(); };
  }, [endpoint, offset, reload]);

  const currentPage = page?.endpoint === endpoint && page.offset === offset ? page : null;
  return (
    <ScrollArea className="h-96 lg:h-[28rem]">
      <div className="space-y-4 pr-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
          <h3 className="break-words min-w-0">{title}</h3>
        </div>
        {error ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setReload(value => value + 1)}>Retry Lyrics</Button>
          </div>
        ) : !currentPage ? (
          <div role="status" aria-label="Loading Lyrics" className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <span className="sr-only">Loading Lyrics…</span>
          </div>
        ) : (
          <>
            {currentPage.data.length ? currentPage.data.map(lyrics => (
              <article key={lyrics.id} className="space-y-3 rounded-lg bg-muted/50 p-4">
                <h4 className="break-words text-sm font-semibold">{lyrics.title}</h4>
                {(lyrics.assignedToAlbum || !!lyrics.tracks?.length) && (
                  <div className="flex flex-wrap gap-2">
                    {lyrics.assignedToAlbum && <Badge variant="secondary">Album</Badge>}
                    {lyrics.tracks?.map(track => (
                      <Badge key={track.id} variant="secondary" className="whitespace-normal break-words">Track: {track.title}</Badge>
                    ))}
                  </div>
                )}
                {lyrics.content ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{lyrics.content}</p>
                ) : <p className="text-sm text-muted-foreground">No Lyrics text added yet.</p>}
              </article>
            )) : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
            {(offset > 0 || currentPage.hasMore) && (
              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 10))}>Previous Lyrics</Button>
                <span className="text-xs text-muted-foreground">Page {offset / 10 + 1}</span>
                <Button size="sm" variant="outline" disabled={!currentPage.hasMore} onClick={() => setOffset(value => value + 10)}>Next Lyrics</Button>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
