import { useEffect, useState } from 'react';
import type { ModelFileRow } from '@/components/admin/threed/models/ModelFileList';
import type { threedPlants } from '@/libraries/schema/threed';

interface PlantModel {
  id: number;
  modelName: string;
  modelType: string;
  files?: ModelFileRow[];
}

export type Plant = Omit<typeof threedPlants.$inferSelect, 'userId' | 'createdAt' | 'updatedAt'> & {
  createdAt: string | null;
  updatedAt: string | null;
  model?: PlantModel | null;
};

export const PLANT_TYPE_OPTIONS = [
  {
    value: 'Vegetable',
    label: 'Vegetable',
  },
  {
    value: 'Fruit',
    label: 'Fruit',
  },
  {
    value: 'Herb',
    label: 'Herb',
  },
  {
    value: 'Flower',
    label: 'Flower',
  },
  {
    value: 'Tree',
    label: 'Tree',
  },
  {
    value: 'Shrub',
    label: 'Shrub',
  },
  {
    value: 'CoverCrop',
    label: 'Cover Crop',
  },
];

export const PLANT_STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
  {
    value: 'archived',
    label: 'Archived',
  },
];

export const SUNLIGHT_OPTIONS = [
  {
    value: 'Full Sun',
    label: 'Full Sun',
  },
  {
    value: 'Partial Sun',
    label: 'Partial Sun',
  },
  {
    value: 'Partial Shade',
    label: 'Partial Shade',
  },
  {
    value: 'Full Shade',
    label: 'Full Shade',
  },
];

export const WATER_NEEDS_OPTIONS = [
  {
    value: 'Low',
    label: 'Low',
  },
  {
    value: 'Medium',
    label: 'Medium',
  },
  {
    value: 'High',
    label: 'High',
  },
];

export function plantFormData(plant?: Plant) {
  return {
    plantId: plant?.plantId ?? '',
    commonName: plant?.commonName ?? '',
    scientificName: plant?.scientificName ?? '',
    variety: plant?.variety ?? '',
    family: plant?.family ?? '',
    type: plant ? plant.type ?? '' : 'Vegetable',
    isActive: plant?.isActive ?? true,
    status: plant ? plant.status ?? '' : 'active',
    modelId: plant?.modelId?.toString() ?? '',
    growthHabit: plant?.growthHabit ?? '',
    daysToMaturity: plant?.daysToMaturity?.toString() ?? '',
    daysToGermination: plant?.daysToGermination?.toString() ?? '',
    daysToHarvest: plant?.daysToHarvest?.toString() ?? '',
    spacingInches: plant?.spacingInches?.toString() ?? '',
    rowSpacingInches: plant?.rowSpacingInches?.toString() ?? '',
    plantingDepthInches: plant?.plantingDepthInches ?? '',
    sunlight: plant ? plant.sunlight ?? '' : 'Full Sun',
    waterNeeds: plant ? plant.waterNeeds ?? '' : 'Medium',
    soilType: plant?.soilType ?? '',
    soilPH: plant?.soilPH ?? '',
    hardinessZone: plant?.hardinessZone ?? '',
    frostTolerant: plant?.frostTolerant ?? false,
    perennial: plant?.perennial ?? false,
    imageUrl: plant?.imageUrl ?? '',
    thumbnailUrl: plant?.thumbnailUrl ?? '',
    description: plant?.description ?? '',
    careInstructions: plant?.careInstructions ?? '',
    harvestInstructions: plant?.harvestInstructions ?? '',
    companionPlants: plant?.companionPlants ?? '',
    avoidPlants: plant?.avoidPlants ?? '',
    source: plant?.source ?? '',
    rawData: JSON.stringify(plant?.rawData ?? {}),
  };
}

type PlantFormData = ReturnType<typeof plantFormData>;

export function plantFormPayload(draft: PlantFormData, initial?: PlantFormData) {
  const payload = {
    ...draft,
    modelId: draft.modelId && draft.modelId !== 'none' ? Number.parseInt(draft.modelId, 10) : null,
    daysToMaturity: draft.daysToMaturity ? Number.parseInt(draft.daysToMaturity, 10) : null,
    daysToGermination: draft.daysToGermination ? Number.parseInt(draft.daysToGermination, 10) : null,
    daysToHarvest: draft.daysToHarvest ? Number.parseInt(draft.daysToHarvest, 10) : null,
    spacingInches: draft.spacingInches ? Number.parseInt(draft.spacingInches, 10) : null,
    rowSpacingInches: draft.rowSpacingInches ? Number.parseInt(draft.rowSpacingInches, 10) : null,
    plantingDepthInches: draft.plantingDepthInches || null,
    soilPH: draft.soilPH || null,
    rawData: JSON.parse(draft.rawData),
  };
  if (!initial) return payload;

  const fields = Object.keys(draft) as (keyof PlantFormData)[];
  return Object.fromEntries(fields
    .filter(field => draft[field] !== initial[field])
    .map(field => [field, payload[field]]));
}

export function usePlantModels(enabled: boolean) {
  const [models, setModels] = useState<PlantModel[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/threed/models?isActive=true&limit=100', { signal: controller.signal });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data) && !controller.signal.aborted) {
          setModels(result.data);
        }
      } catch {
        if (!controller.signal.aborted) setModels([]);
      }
    }
    void load();
    return () => controller.abort();
  }, [enabled]);

  return models;
}
