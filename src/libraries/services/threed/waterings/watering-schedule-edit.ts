import type { ThreedWateringSchedule } from '@/libraries/schema/threed';

export const wateringFrequencies = [
  'daily',
  'weekly',
  'custom',
  'moisture-based',
  'hourly',
  'bi-daily',
] as const satisfies readonly ThreedWateringSchedule['frequency'][];

const maxInteger = 2147483647;

export const wateringNumberFields = {
  intervalDays: { label: 'Interval (days)', minimum: 1, maximum: maxInteger, optional: true },
  durationMs: { label: 'Duration (ms)', minimum: 1, maximum: maxInteger, optional: false },
  volumeMl: { label: 'Volume (mL)', minimum: 0, maximum: maxInteger, optional: true },
  moistureThreshold: { label: 'Moisture threshold (%)', minimum: 0, maximum: 100, optional: true },
  repeatCount: { label: 'Repeat count', minimum: 0, maximum: maxInteger, optional: true },
  minTemperature: { label: 'Minimum temperature', minimum: -2147483648, maximum: maxInteger, optional: true },
  maxTemperature: { label: 'Maximum temperature', minimum: -2147483648, maximum: maxInteger, optional: true },
  maxWindSpeed: { label: 'Maximum wind speed', minimum: 0, maximum: maxInteger, optional: true },
} as const;

type NumberField = keyof typeof wateringNumberFields;
type AdditionalField = 'frequency' | 'daysOfWeek' | 'timeOfDay' | 'nextWatering' | 'isActive' | 'skipIfRain' | 'notes';
export type WateringScheduleChanges = Partial<Pick<ThreedWateringSchedule, NumberField | AdditionalField>>;

export const wateringScheduleDefaults = {
  frequency: 'daily',
  isActive: true,
  skipIfRain: true,
} as const satisfies WateringScheduleChanges;

export const wateringScheduleTargets = {
  plantId: 'Plant ID',
  plantingId: 'Planting ID',
  bedId: 'Bed ID',
  farmbotId: 'FarmBot ID',
} as const;

type TargetField = keyof typeof wateringScheduleTargets;

export class WateringScheduleInputError extends Error {}

export function parseWateringScheduleVersion(value: unknown, record = 'Watering Schedule') {
  if (typeof value !== 'string') throw new WateringScheduleInputError(`Invalid ${record} version.`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw new WateringScheduleInputError(`Invalid ${record} version.`);
  return date;
}

export function isLocalDateTime(value: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(value)) return false;
  const instant = new Date(`${value}Z`);
  return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === value.slice(0, 10);
}

export function parseWateringScheduleChanges(value: unknown): WateringScheduleChanges {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WateringScheduleInputError('Invalid Watering Schedule changes.');
  const entries = Object.entries(value);
  if (!entries.length) throw new WateringScheduleInputError('Change at least one schedule setting.');
  const changes: WateringScheduleChanges = {};
  for (const [field, setting] of entries) {
    if (Object.hasOwn(wateringNumberFields, field)) {
      const key = field as NumberField;
      const rule = wateringNumberFields[key];
      if (!(rule.optional && setting === null) &&
          (typeof setting !== 'number' || !Number.isInteger(setting) || setting < rule.minimum || setting > rule.maximum)) {
        throw new WateringScheduleInputError(`${rule.label} must be a whole number between ${rule.minimum} and ${rule.maximum}.`);
      }
      if (key === 'durationMs') changes.durationMs = setting as number;
      else changes[key] = setting as number | null;
      continue;
    }
    switch (field) {
      case 'frequency': {
        const frequency = wateringFrequencies.find(option => option === setting);
        if (!frequency) throw new WateringScheduleInputError('Choose a watering frequency.');
        changes.frequency = frequency;
        break;
      }
      case 'daysOfWeek':
        if (setting !== null && (!Array.isArray(setting) || setting.length > 7 || new Set(setting).size !== setting.length ||
            !setting.every(day => Number.isInteger(day) && day >= 0 && day <= 6))) throw new WateringScheduleInputError('Choose valid days of the week.');
        changes.daysOfWeek = setting;
        break;
      case 'timeOfDay':
        if (setting !== null && (typeof setting !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(setting))) {
          throw new WateringScheduleInputError('Enter a valid time of day.');
        }
        changes.timeOfDay = setting;
        break;
      case 'nextWatering':
        if (typeof setting !== 'string' || !isLocalDateTime(setting)) throw new WateringScheduleInputError('Enter a valid next watering date and time.');
        changes.nextWatering = setting.replace('T', ' ');
        break;
      case 'isActive':
      case 'skipIfRain':
        if (typeof setting !== 'boolean') throw new WateringScheduleInputError('Choose a valid switch setting.');
        changes[field] = setting;
        break;
      case 'notes':
        if (setting !== null && (typeof setting !== 'string' || setting.length > 4000 || setting.includes('\0'))) {
          throw new WateringScheduleInputError('Notes must be 4,000 characters or fewer.');
        }
        changes.notes = setting;
        break;
      default:
        throw new WateringScheduleInputError('Unsupported Watering Schedule setting.');
    }
  }
  return changes;
}

export function parseNewWateringSchedule(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WateringScheduleInputError('Invalid Watering Schedule.');
  const { scheduleId: inputId, plantId, plantingId, bedId, farmbotId, ...settings } = value as Record<string, unknown>;
  const scheduleId = typeof inputId === 'string' ? inputId.trim() : '';
  if (!scheduleId || scheduleId.length > 50 || /[\u0000-\u001f\u007f]/.test(scheduleId)) {
    throw new WateringScheduleInputError('Enter a Schedule ID of 1–50 characters.');
  }
  const { durationMs, nextWatering, ...changes } = parseWateringScheduleChanges({ ...wateringScheduleDefaults, ...settings });
  if (durationMs === undefined) throw new WateringScheduleInputError('Enter a watering duration.');
  if (nextWatering === undefined) throw new WateringScheduleInputError('Enter a next watering date and time.');
  if (changes.minTemperature != null && changes.maxTemperature != null && changes.minTemperature > changes.maxTemperature) {
    throw new WateringScheduleInputError('Minimum temperature cannot exceed maximum temperature.');
  }
  const targets: Partial<Record<TargetField, number>> = {};
  for (const [field, id] of Object.entries({ plantId, plantingId, bedId, farmbotId })) {
    if (id === undefined || id === null) continue;
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > maxInteger) {
      throw new WateringScheduleInputError(`Enter a valid ${wateringScheduleTargets[field as TargetField]}.`);
    }
    targets[field as TargetField] = id;
  }
  return { ...wateringScheduleDefaults, ...changes, scheduleId, durationMs, nextWatering, ...targets };
}
