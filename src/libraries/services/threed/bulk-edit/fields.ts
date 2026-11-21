import {
  CHARACTER_STATUS_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  PLANT_STATUS_OPTIONS,
  PLANT_TYPE_OPTIONS,
  PLANTING_STATUS_OPTIONS,
  type ThreeDSelectOption,
} from '@/libraries/types/threed';
import { MAX_MODEL_FILE_LOAD_ORDER } from '../models/model-file-edit-core';
import { SORT_ORDER_LIMIT } from '../list-sort-order';

export type BulkField =
  | { key: string; label: string; kind: 'boolean' }
  | { key: string; label: string; kind: 'choice'; options: readonly ThreeDSelectOption[] }
  | { key: string; label: string; kind: 'integer'; min: number; max: number }
  | { key: string; label: string; kind: 'text'; max: number };

const active: BulkField = {
  key: 'isActive',
  label: 'Active',
  kind: 'boolean',
};
const description: BulkField = {
  key: 'description',
  label: 'Description',
  kind: 'text',
  max: 2000,
};
const choice = (key: string, label: string, options: readonly ThreeDSelectOption[]): BulkField => ({
  key,
  label,
  kind: 'choice',
  options,
});
const inventoryStatuses = [
  'active',
  'pending',
  'maintenance',
  'dormant',
  'retired',
];
const inventoryStatus = choice('status', 'Status', inventoryStatuses.map(value => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
})));

// Keys are the standalone catalog routes. Only fields already editable on that catalog belong here.
export const catalogBulkFields = {
  plants: [
    active,
    choice('status', 'Status', PLANT_STATUS_OPTIONS),
    choice('type', 'Plant Type', PLANT_TYPE_OPTIONS),
  ],
  plantings: [
    {
      key: 'sortOrder',
      label: 'Sort Order',
      kind: 'integer',
      min: -SORT_ORDER_LIMIT,
      max: SORT_ORDER_LIMIT,
    },
    active,
    choice('status', 'Status', PLANTING_STATUS_OPTIONS),
    choice('growthStage', 'Growth Stage', GROWTH_STAGE_OPTIONS),
  ],
  beds: [
    active,
    inventoryStatus,
  ],
  farmbots: [active],
  layers: [
    active,
    {
      key: 'isVisible',
      label: 'Visible',
      kind: 'boolean',
    },
  ],
  models: [inventoryStatus],
  'model-files': [{
    key: 'loadOrder',
    label: 'Load Order',
    kind: 'integer',
    min: 0,
    max: MAX_MODEL_FILE_LOAD_ORDER,
  }],
  'model-categories': [active],
  'model-textures': [active],
  characters: [
    active,
    choice('status', 'Status', CHARACTER_STATUS_OPTIONS),
  ],
  scenarios: [
    active,
    description,
  ],
  simulations: [
    active,
    description,
  ],
  animations: [active],
  'animation-slots': [{
    ...active,
    label: 'Enabled',
  }],
  'animation-categories': [], // Each selected Category has its own unique name.
} satisfies Record<string, readonly BulkField[]>;

export type CatalogBulkResource = keyof typeof catalogBulkFields;
export function isCatalogBulkResource(value: string): value is CatalogBulkResource {
  return Object.hasOwn(catalogBulkFields, value);
}
