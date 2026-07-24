// src/app/dashboard/music/player/page.tsx
import MusicContent from '@/components/music/MusicContent';

export const metadata = {
  title: 'Music by Marty McGee',
  description: 'Albums and Tracks Player',
};

export default function MusicPage() {
  return <MusicContent />;
}