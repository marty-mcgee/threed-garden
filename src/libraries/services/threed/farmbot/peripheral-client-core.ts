import {
  FarmBotConnectionUnavailableError,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from './connection-client-core.ts';

export const FARMBOT_PERIPHERALS_ENDPOINT = 'https://my.farm.bot/api/peripherals';
export const MAX_FARMBOT_PERIPHERALS = 100;

export interface FarmBotPeripheralSummary {
  id: number;
  pin: number;
  label: string;
  mode: 0 | 1;
}

export interface FarmBotPeripheralInventory {
  peripherals: FarmBotPeripheralSummary[];
  totalCount: number;
  truncated: boolean;
}

function readPeripheral(value: unknown): FarmBotPeripheralSummary {
  if (typeof value !== 'object' || value === null
    || !('id' in value) || typeof value.id !== 'number'
    || !Number.isSafeInteger(value.id) || value.id <= 0
    || !('pin' in value) || typeof value.pin !== 'number'
    || !Number.isSafeInteger(value.pin) || value.pin < 0
    || !('label' in value) || typeof value.label !== 'string'
    || !value.label.trim() || value.label.length > 200
    || !('mode' in value) || (value.mode !== 0 && value.mode !== 1)) {
    throw new FarmBotConnectionUnavailableError();
  }

  return {
    id: value.id,
    pin: value.pin,
    label: value.label.trim(),
    mode: value.mode,
  };
}

export function readFarmBotPeripheralInventory(value: unknown): FarmBotPeripheralInventory {
  if (!Array.isArray(value)) {
    throw new FarmBotConnectionUnavailableError();
  }

  return {
    peripherals: value.slice(0, MAX_FARMBOT_PERIPHERALS).map(readPeripheral),
    totalCount: value.length,
    truncated: value.length > MAX_FARMBOT_PERIPHERALS,
  };
}
