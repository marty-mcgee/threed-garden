'use client';

import { useSession } from 'next-auth/react';
import { LyricsPanel } from '@/components/multimedia/LyricsPanel';

export function TrackLyrics({ trackId, trackTitle }: { trackId: number; trackTitle: string }) {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user?.id) {
    return <p className="text-sm text-muted-foreground">{status === 'loading' ? 'Loading Lyrics…' : 'Sign in to view your Lyrics.'}</p>;
  }
  // Separate Track/account lifetimes prevent an old response or page appearing after selection changes.
  return (
    <LyricsPanel
      key={`${session.user.id}:${trackId}`}
      endpoint={`/api/multimedia/lyrics?trackId=${trackId}`}
      title={`Lyrics — ${trackTitle}`}
      emptyMessage="No active Lyrics assigned to this Track."
    />
  );
}
