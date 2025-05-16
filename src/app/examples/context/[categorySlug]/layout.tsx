import { fetchCategoryBySlug, PageProps } from '~/src/lib/api/data/getCategories';
import { Boundary } from '#/layout/ui/playground/Boundary';
import { TabGroup } from '#/layout/ui/playground/TabGroup';
import { Counter } from '../ContextClickCounter';

export default async function Layout({ children, params }: PageProps) {
  const category = await fetchCategoryBySlug(params.categorySlug);
  if (!category) return null;

  return (
    <Boundary labels={['Layout [Server Component]']} animateRerendering={false}>
      <div className="space-y-9">
        <TabGroup
          path={`/context/${category.slug}`}
          items={[
            {
              text: 'All',
            },
            ...category.items.map((x) => ({
              text: x.name,
              slug: x.slug,
            })),
          ]}
        />
        <Counter />
        <div>{children}</div>
      </div>
    </Boundary>
  );
}
