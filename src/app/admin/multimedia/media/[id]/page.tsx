import { notFound } from 'next/navigation';
import { MultimediaRecordPage } from '@/components/admin/multimedia/shared/MultimediaRecordPage';
import { positiveId } from '@/libraries/services/multimedia/access';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = positiveId((await params).id);
  if (!id) notFound();
  return <MultimediaRecordPage key={`media-${id}`} kind="media" id={id} />;
}
