'use client';

import { useMemo } from 'react';
import type { ThreeDModelLibraryItem } from '@/libraries/types/threed';
import {
  buildThreeDModelLibraryCollections,
  filterThreeDModelLibrary,
  type ThreeDModelLibraryCollection as ModelLibraryCollection,
} from '@/libraries/services/threed/models/model-library-collections-core';

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
): ThreeDModelLibraryCollection {
  return useMemo(() => {
    const inspectedModel = models.find((model) => model.id === inspectedModelId) ?? null;
    const collections = buildThreeDModelLibraryCollections(models);
    const visibleModels = filterThreeDModelLibrary(models, categorySlug, search, 'all');

    return { collections, inspectedModel, visibleModels };
  }, [categorySlug, inspectedModelId, models, search]);
}
