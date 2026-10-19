import { notFound } from 'next/navigation';
import LegacyAlbumDetail from '@/components/admin/multimedia/albums/LegacyAlbumDetail';
import { positiveId } from '@/libraries/services/multimedia/access';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = positiveId((await params).id);
  if (!id) notFound();
  return <LegacyAlbumDetail key={id} />;
}
