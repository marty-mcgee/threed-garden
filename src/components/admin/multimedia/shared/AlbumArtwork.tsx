'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function AlbumArtwork({ url, title, artist, unsaved }: { url: string; title: string; artist: string; unsaved: boolean }) {
  const [failed, setFailed] = useState(false);
  return <aside aria-label="Album artwork" className="shrink-0 space-y-2 rounded-md border p-3 md:w-52">
    <h2 className="text-xs font-semibold">Artwork</h2>
    {url.trim() && !failed ? <img src={url} alt={`${title} artwork`} className="mx-auto h-32 w-full rounded object-contain md:h-48" onError={() => setFailed(true)} /> :
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded bg-muted p-2 text-center text-muted-foreground md:h-48">
        <p role={failed ? 'alert' : undefined}>{failed ? 'Artwork could not be loaded.' : 'No cover art'}</p>
        {failed && <Button type="button" variant="outline" size="sm" onClick={() => setFailed(false)}>Retry artwork</Button>}
      </div>}
    <p className="break-words font-medium">{title}</p>
    <p className="break-words text-muted-foreground">{artist}</p>
    {unsaved && <p className="text-muted-foreground">Unsaved artwork preview</p>}
  </aside>;
}
