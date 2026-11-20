import { isSortOrder, sortOrderError } from '../list-sort-order';
import type { NewThreedHarvest } from '@/libraries/schema/threed';

export const harvestUnits = [
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'each', label: 'Each' },
  { value: 'bunch', label: 'Bunch' },
] as const;

export class HarvestInputError extends Error {}

export function parseHarvestDate(value: unknown): Date | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
    throw new HarvestInputError('Enter a valid harvest date.');
  }
  const day = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const date = new Date(value.includes('T') && !/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? `${value}Z` : value);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value.slice(0, 10)) {
    throw new HarvestInputError('Enter a valid harvest date.');
  }
  return date;
}

export type HarvestChanges = Partial<Pick<NewThreedHarvest, 'sortOrder' | 'quantity' | 'unit' | 'weightLbs' | 'harvestDate' | 'isActive' | 'notes'>>;

export function parseHarvestBulkChanges(value: unknown): HarvestChanges {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length) throw new HarvestInputError('Choose a field to update.');
  const changes: HarvestChanges = {};
  for (const [field, setting] of Object.entries(value)) {
    switch (field) {
      case 'sortOrder':
        if (!isSortOrder(setting)) throw new HarvestInputError(sortOrderError);
        changes.sortOrder = setting;
        break;
      case 'quantity':
      case 'weightLbs':
        if (setting === null && field === 'weightLbs') { changes.weightLbs = null; break; }
        if (typeof setting !== 'string' || !/^(?:\d{1,6}(?:\.\d{1,2})?|\.\d{1,2})$/.test(setting) || (field === 'quantity' && Number(setting) <= 0)) {
          throw new HarvestInputError(field === 'quantity' ? 'Enter a positive quantity with up to two decimal places.' : 'Enter a nonnegative weight with up to two decimal places.');
        }
        changes[field] = setting;
        break;
      case 'unit': {
        const unit = harvestUnits.find(option => option.value === setting);
        if (!unit) throw new HarvestInputError('Choose a harvest unit.');
        changes.unit = unit.value;
        break;
      }
      case 'harvestDate':
        changes.harvestDate = parseHarvestDate(setting);
        break;
      case 'isActive':
        if (typeof setting !== 'boolean') throw new HarvestInputError('Choose Active or Inactive.');
        changes.isActive = setting;
        break;
      case 'notes':
        if (setting !== null && (typeof setting !== 'string' || setting.length > 4000 || setting.includes('\0'))) throw new HarvestInputError('Notes must be 4,000 characters or fewer.');
        changes.notes = setting;
        break;
      default:
        throw new HarvestInputError('Unsupported Harvest field.');
    }
  }
  return changes;
}
