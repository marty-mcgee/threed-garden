import { notFound } from 'next/navigation';
import LegacyTrackPlayer from '@/components/admin/multimedia/tracks/LegacyTrackPlayer';
import { positiveId } from '@/libraries/services/multimedia/access';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = positiveId((await params).id);
  if (!id) notFound();
  return <LegacyTrackPlayer key={id} />;
}
