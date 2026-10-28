import { notFound } from 'next/navigation';
import { LearnGuideEditor } from '@/components/admin/learn/LearnGuideEditor';

export default async function EditLearnGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) notFound();
  return <LearnGuideEditor key={id} id={Number(id)} />;
}
