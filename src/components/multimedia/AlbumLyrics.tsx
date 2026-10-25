'use client';

import { LyricsPanel } from './LyricsPanel';

export function AlbumLyrics({ albumId, albumTitle }: { albumId: number; albumTitle: string }) {
  return (
    <LyricsPanel
      key={albumId}
      endpoint={`/api/multimedia/albums/${albumId}/lyrics`}
      title={`Lyrics — ${albumTitle}`}
      emptyMessage="No Lyrics available for this Album."
    />
  );
}
