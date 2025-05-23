import { fetchCategories } from '~/src/lib/api/data/getCategories';
import { Boundary } from '#/layout/ui/playground/Boundary';
import { ClickCounter } from '#/layout/ui/playground/ClickCounter';
import { TabGroup } from '#/layout/ui/playground/TabGroup';
import React from 'react';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await fetchCategories();
  return (
    <Boundary
      labels={['main layout']}
      color="orange"
      animateRerendering={false}
    >
      <div className="space-y-9">
        <div className="flex justify-between">
          <TabGroup
            path="/route-groups"
            items={[
              {
                text: 'Home',
              },
              ...categories.map((x) => ({
                text: x.name,
                slug: x.slug,
              })),
              { text: 'Checkout', slug: 'checkout' },
              { text: 'Blog', slug: 'blog' },
            ]}
          />

          <div className="self-start">
            <ClickCounter />
          </div>
        </div>

        <div>{children}</div>
      </div>
    </Boundary>
  );
}
