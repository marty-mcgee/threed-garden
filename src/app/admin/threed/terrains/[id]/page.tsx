import { notFound } from 'next/navigation';
import { ThreeDTerrainsCRUD } from '@/components/admin/threed/terrains/ThreeDTerrainsCRUD';

export default async function EditTerrainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terrainId = Number(id);
  if (!Number.isSafeInteger(terrainId) || terrainId <= 0) notFound();
  return <ThreeDTerrainsCRUD view="edit" recordId={terrainId} />;
}
