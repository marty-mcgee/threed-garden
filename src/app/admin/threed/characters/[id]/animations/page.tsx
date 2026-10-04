import { notFound } from 'next/navigation';
import { ThreeDCharactersCRUD } from '@/components/admin/threed/characters/ThreeDCharactersCRUD';

export default async function CharacterAnimationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const characterId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(characterId)) notFound();
  return <ThreeDCharactersCRUD key={characterId} view="animations" characterId={characterId} />;
}
