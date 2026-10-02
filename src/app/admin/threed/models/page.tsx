import { redirect } from 'next/navigation';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))) {
    redirect('/admin/threed/models/' + id);
  }
  return <ThreeDModelsCRUD scrollRecords />;
}
