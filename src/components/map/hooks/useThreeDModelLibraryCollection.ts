'use client';

import { useMemo } from 'react';
import type { ThreeDModelLibraryItem } from '@/libraries/types/threed';
import {
  buildThreeDModelLibraryCollections,
  filterThreeDModelLibrary,
  type ThreeDModelLibraryCollection as ModelLibraryCollection,
} from '@/libraries/services/threed/models/model-library-collections-core';

export type ThreeDModelLibraryReadinessFilter = 'all' | ThreeDModelLibraryItem['libraryReadiness']['status'];

interface ThreeDModelLibraryCollection {
  collections: ModelLibraryCollection[];
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
    const inspectedModel = models.find((model) => model.id === inspectedModelId) ?? null;
    const collections = buildThreeDModelLibraryCollections(models);
    const visibleModels = filterThreeDModelLibrary(models, categorySlug, search, readiness);

    return { collections, inspectedModel, visibleModels };
  }, [categorySlug, inspectedModelId, models, readiness, search]);
}
