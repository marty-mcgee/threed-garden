import { ThreeDAnimationsWorkspace } from '@/components/admin/threed/animations/ThreeDAnimationsWorkspace';

export default async function AnimationsPage({ searchParams }: { searchParams: Promise<{ categoryId?: string | string[] }> }) {
  const { categoryId } = await searchParams;
  const value = typeof categoryId === 'string' && /^\d+$/.test(categoryId) ? Number(categoryId) : NaN;
  const initialCategoryId = Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647 ? value : undefined;
  return <ThreeDAnimationsWorkspace key={initialCategoryId ?? 'all'} initialCategoryId={initialCategoryId} />;
}
