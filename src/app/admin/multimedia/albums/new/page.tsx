import { notFound } from 'next/navigation';
import { MultimediaRecordPage } from '@/components/admin/multimedia/shared/MultimediaRecordPage';
import { positiveId } from '@/libraries/services/multimedia/access';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const albumId = query.albumId === undefined ? undefined : positiveId(query.albumId);
  const trackId = query.trackId === undefined ? undefined : positiveId(query.trackId);
  if (albumId === null || trackId === null || albumId !== undefined || trackId !== undefined) notFound();
  return <MultimediaRecordPage key={`albums-new-${albumId ?? ''}-${trackId ?? ''}`} kind="albums" albumId={albumId} trackId={trackId} />;
}
