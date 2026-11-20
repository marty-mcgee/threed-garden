import { isLocalDateTime } from './watering-schedule-edit';
import type { ThreedWateringHistory } from '@/libraries/schema/threed';

export const wateringHistoryStatuses = ['success', 'failed', 'skipped'] as const;
export const wateringHistoryTargets = {
  scheduleId: 'Schedule record ID',
  plantId: 'Plant ID',
  plantingId: 'Planting ID',
  farmbotId: 'FarmBot ID',
} as const;

const maxInteger = 2147483647;
type TargetField = keyof typeof wateringHistoryTargets;
type HistoryChanges = Partial<Pick<ThreedWateringHistory, 'executedAt' | 'status' | 'durationMs' | 'volumeMl' | 'skipReason' | 'errorMessage'>>;

export class WateringHistoryInputError extends Error {}

export function parseWateringHistoryChanges(input: unknown): HistoryChanges {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Object.keys(input).length) {
    throw new WateringHistoryInputError('Enter at least one watering history value.');
  }
  const result: HistoryChanges = {};
  for (const [field, value] of Object.entries(input)) {
    switch (field) {
      case 'executedAt':
        if (typeof value !== 'string' || !isLocalDateTime(value)) throw new WateringHistoryInputError('Enter a valid watering date and time.');
        result.executedAt = value.replace('T', ' ');
        break;
      case 'status': {
        const status = wateringHistoryStatuses.find(option => option === value);
        if (!status) throw new WateringHistoryInputError('Choose a watering status.');
        result.status = status;
        break;
      }
      case 'durationMs':
      case 'volumeMl':
        if (value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > maxInteger)) {
          throw new WateringHistoryInputError('Duration and volume must be nonnegative whole numbers.');
        }
        result[field] = value;
        break;
      case 'skipReason':
      case 'errorMessage':
        if (value !== null && (typeof value !== 'string' || value.length > 4000 || value.includes('\0'))) {
          throw new WateringHistoryInputError('Reasons must be 4,000 characters or fewer.');
        }
        result[field] = value;
        break;
      default:
        throw new WateringHistoryInputError('Unsupported watering history field.');
    }
  }
  return result;
}

export function parseNewWateringHistory(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new WateringHistoryInputError('Invalid watering history.');
  const { historyId: rawId, scheduleId, plantId, plantingId, farmbotId, ...fields } = input as Record<string, unknown>;
  const historyId = typeof rawId === 'string' ? rawId.trim() : '';
  if (!historyId || historyId.length > 50 || /[\u0000-\u001f\u007f]/.test(historyId)) throw new WateringHistoryInputError('Enter a History ID of 1–50 characters.');
  const { executedAt, status, ...changes } = parseWateringHistoryChanges(fields);
  if (!executedAt || !status) throw new WateringHistoryInputError('Enter the watering date, time, and status.');
  const targets: Partial<Record<TargetField, number>> = {};
  for (const [field, id] of Object.entries({ scheduleId, plantId, plantingId, farmbotId })) {
    if (id === undefined || id === null) continue;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0 || id > maxInteger) {
      throw new WateringHistoryInputError(`Enter a valid ${wateringHistoryTargets[field as TargetField]}.`);
    }
    targets[field as TargetField] = id;
  }
  return { historyId, executedAt, status, ...changes, ...targets };
}
