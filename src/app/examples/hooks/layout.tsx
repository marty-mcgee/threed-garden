import { fetchCategories } from '~/src/lib/api/data/getCategories';
import { Boundary } from '#/layout/ui/playground/Boundary';
import { ClickCounter } from '#/layout/ui/playground/ClickCounter';
// import HooksClient from '#/layout/ui/playground/HooksClient';
import HooksServer from '#/layout/ui/playground/HooksServer';
import { TabGroup } from '#/layout/ui/playground/TabGroup';
import React from 'react';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await fetchCategories();
  if (!categories) return null;
  return (
    <div className="space-y-9">
      <div className="flex justify-between">
        <TabGroup
          path="/hooks"
          items={[
            {
              text: 'Home',
            },
            ...categories.map((x) => ({
              text: x.name,
              slug: x.slug,
            })),
          ]}
        />

        <div className="self-start">
          <ClickCounter />
        </div>
      </div>

      <Boundary labels={['Client Component Hooks']}>
        {/* <HooksClient /> */}
        <h2>HooksClient</h2>
      </Boundary>
      <Boundary labels={['Server Component Hooks']}>
        <HooksServer />
      </Boundary>

      <div>{children}</div>
    </div>
  );
}
