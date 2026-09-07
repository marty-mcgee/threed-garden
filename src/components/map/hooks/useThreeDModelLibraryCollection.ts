'use client';

import { useMemo } from 'react';
import type { ThreeDModelLibraryItem } from '@/lib/types/threed';

type ThreeDModelLibraryCategory = ThreeDModelLibraryItem['categories'][number];
export type ThreeDModelLibraryReadinessFilter = 'all' | ThreeDModelLibraryItem['libraryReadiness']['status'];

interface ThreeDModelLibraryCollection {
  categories: ThreeDModelLibraryCategory[];
  inspectedModel: ThreeDModelLibraryItem | null;
  visibleModels: ThreeDModelLibraryItem[];
}

export function useThreeDModelLibraryCollection(
  models: ThreeDModelLibraryItem[],
  categorySlug: string,
  inspectedModelId: number | null,
  search: string,
  readiness: ThreeDModelLibraryReadinessFilter,
): ThreeDModelLibraryCollection {
  return useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const inspectedModel = models.find((model) => model.id === inspectedModelId) ?? null;
    const categories = Array.from(
      new Map(
        models
          .flatMap((model) => model.categories ?? [])
          .map((category) => [category.slug, category]),
      ).values(),
    ).sort((left, right) => left.name.localeCompare(right.name));
    const visibleModels = models.filter((model) => (
      (categorySlug === 'all'
        || model.categories?.some((category) => category.slug === categorySlug))
      && (normalizedSearch.length === 0
        || model.modelName.toLowerCase().includes(normalizedSearch))
      && (readiness === 'all' || model.libraryReadiness.status === readiness)
    ));

    return { categories, inspectedModel, visibleModels };
  }, [categorySlug, inspectedModelId, models, readiness, search]);
}
