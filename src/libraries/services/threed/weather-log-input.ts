import { InputValidationError, readBoolean, readStrictObject, readString } from '@/libraries/utils/input-validation';

const decimalRanges = {
  temperature: [-150, 160],
  humidity: [0, 100],
  rainfallInches: [0, 999.99],
  windSpeed: [0, 500],
  soilMoisture: [0, 100],
  sunlightHours: [0, 24],
} as const;

const warningKeys = [
  'frostWarning',
  'heatWarning',
  'droughtWarning',
] as const;

export type WeatherLogInput = Partial<Record<keyof typeof decimalRanges, string | null>> & {
  recordedAt?: string;
  frostWarning?: boolean;
  heatWarning?: boolean;
  droughtWarning?: boolean;
  source?: string;
};

function readRecordedAt(value: unknown): string {
  const text = readString(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z$/.exec(text);
  if (!match) throw new InputValidationError();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) throw new InputValidationError();
  return text;
}

export function parseWeatherLogInput(value: unknown): WeatherLogInput {
  const input = readStrictObject(value, [
    ...Object.keys(decimalRanges),
    'recordedAt',
    ...warningKeys,
    'source',
  ]);
  const result: WeatherLogInput = {};
  for (const key of Object.keys(decimalRanges) as (keyof typeof decimalRanges)[]) {
    if (!Object.hasOwn(input, key)) continue;
    const raw = input[key];
    if (raw === undefined || raw === null) {
      result[key] = raw;
      continue;
    }
    if (typeof raw !== 'number' && (typeof raw !== 'string' || raw.length === 0)) throw new InputValidationError();
    const number = Number(raw);
    const [minimum, maximum] = decimalRanges[key];
    if (!Number.isFinite(number) || number < minimum || number > maximum) throw new InputValidationError();
    result[key] = String(number);
  }
  for (const key of warningKeys) {
    if (Object.hasOwn(input, key)) result[key] = input[key] === undefined ? undefined : readBoolean(input[key]);
  }
  if (Object.hasOwn(input, 'recordedAt')) result.recordedAt = input.recordedAt === undefined ? undefined : readRecordedAt(input.recordedAt);
  if (Object.hasOwn(input, 'source')) result.source = input.source === undefined ? undefined : readString(input.source, 1, 50);
  return result;
}
