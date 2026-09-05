'use client';

import { useMemo } from 'react';
import type { UnifiedMapData } from '@/lib/types/map';

interface ThreeDPlacedLibraryAssets {
  placedCharacterIds: ReadonlySet<number>;
  placedFarmBotIds: ReadonlySet<number>;
}

export function useThreeDPlacedLibraryAssets(
  rawData: UnifiedMapData['threed']['raw'],
): ThreeDPlacedLibraryAssets {
  return useMemo(() => ({
    placedCharacterIds: new Set<number>([
      ...(rawData?.projectThreedMarkers ?? [])
        .filter((marker) => marker.markerType === 'characters')
        .map((marker) => Number(marker.sourceAssetId)),
      ...(rawData?.characters ?? []).map((character) => Number(character.id)),
    ]),
    placedFarmBotIds: new Set<number>([
      ...(rawData?.projectThreedMarkers ?? [])
        .filter((marker) => marker.markerType === 'farmbots')
        .map((marker) => Number(marker.sourceAssetId)),
      ...(rawData?.farmbots ?? []).map((farmBot) => Number(farmBot.id)),
    ]),
  }), [rawData]);
}
