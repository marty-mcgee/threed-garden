import {
  fetchCategoryBySlug,
  PageProps,
  type Category,
} from '~/src/lib/api/data/getCategories';
import { SkeletonCard } from '#/layout/ui/playground/SkeletonCard';

const fetchCategory = async (
  categorySlug: string | undefined,
): Promise<Category | undefined> => {
  // artificial delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!categorySlug) return;

  return await fetchCategoryBySlug(categorySlug);
};

export default async function Page({ params }: PageProps) {
  const category = await fetchCategory(params.categorySlug);
  if (!category) return null;

  return (
    <div className="space-y-4">
      <div className="text-xl font-medium text-gray-500">{category.name}</div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: category.count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
