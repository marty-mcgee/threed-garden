import { fetchSubCategory, type PageProps } from '~/src/lib/api/data/getCategories';
import { Boundary } from '#/layout/ui/playground/Boundary';
import { Counter } from '../../ContextClickCounter';

export default async function Page({ params }: PageProps) {
  const category = await fetchSubCategory(
    params.categorySlug,
    params.subCategorySlug,
  );
  if (!category) return null;

  return (
    <Boundary labels={['Page [Server Component]']} animateRerendering={false}>
      <div className="space-y-8">
        <div className="text-xl font-medium text-gray-500">{category.name}</div>

        <Counter />
      </div>
    </Boundary>
  );
}
