import { ThreeDAnimationSlotsWorkspace } from '@/components/admin/threed/animations/ThreeDAnimationSlotsWorkspace';
export default async function AnimationSlotsPage({ searchParams }: { searchParams: Promise<{ categoryId?: string | string[] }> }) {
  const { categoryId } = await searchParams;
  const value = typeof categoryId === 'string' && /^\d+$/.test(categoryId) ? Number(categoryId) : NaN;
  const initialCategoryId = Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647 ? value : undefined;
  return <ThreeDAnimationSlotsWorkspace key={initialCategoryId ?? 'all'} initialCategoryId={initialCategoryId} />;
}
