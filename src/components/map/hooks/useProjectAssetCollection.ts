'use client';

import { useMemo } from 'react';
import type { RuntimeMarker } from '@/lib/types/map';
import { getThreeDLabel } from '@/lib/utils/map-helpers';

interface ProjectAssetCollection {
  assetTypes: string[];
  assetTypeCounts: Map<string, number>;
  visibleAssets: RuntimeMarker[];
}

export function useProjectAssetCollection(
  markers: RuntimeMarker[],
  search: string,
  typeFilter: string,
): ProjectAssetCollection {
  return useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const assetTypes = Array.from(new Set(markers.map((marker) => marker.type)))
      .sort((left, right) => getThreeDLabel(left).localeCompare(getThreeDLabel(right)));
    const assetTypeCounts = new Map<string, number>();

    markers.forEach((marker) => {
      assetTypeCounts.set(marker.type, (assetTypeCounts.get(marker.type) ?? 0) + 1);
    });

    const visibleAssets = markers
      .filter((marker) => (
        typeFilter === 'all' || marker.type === typeFilter
      ) && (
        normalizedSearch.length === 0
        || marker.name.toLowerCase().includes(normalizedSearch)
        || getThreeDLabel(marker.type).toLowerCase().includes(normalizedSearch)
      ))
      .sort((left, right) => (
        getThreeDLabel(left.type).localeCompare(getThreeDLabel(right.type))
        || left.name.localeCompare(right.name)
        || left.id.localeCompare(right.id)
      ));

    return { assetTypes, assetTypeCounts, visibleAssets };
  }, [markers, search, typeFilter]);
}
