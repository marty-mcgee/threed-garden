import { fetchSubCategory, PageProps } from '~/src/lib/api/data/getCategories';
import BuggyButton from '#/layout/ui/playground/BuggyButton';
import { SkeletonCard } from '#/layout/ui/playground/SkeletonCard';

export default async function Page({ params }: PageProps) {
  const category = await fetchSubCategory(
    params.categorySlug,
    params.subCategorySlug,
  );
  if (!category) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between  space-x-3">
        <div className="text-xl font-medium text-gray-500">{category.name}</div>

        <BuggyButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: category.count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
