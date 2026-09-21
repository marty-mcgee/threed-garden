import type { FarmBotPeripheralSummary } from './peripheral-client-core.ts';

export const FARMBOT_SEMANTIC_ACTIONS = ['water'] as const;
export type FarmBotSemanticAction = typeof FARMBOT_SEMANTIC_ACTIONS[number];

export interface FarmBotPeripheralBindingSnapshot {
  semanticAction: string;
  peripheralId: number;
  peripheralLabel: string;
  peripheralPin: number;
  peripheralMode: number;
  isActive: boolean;
}

export type FarmBotPeripheralBindingValidation =
  | { valid: true; reason: 'valid'; peripheral: FarmBotPeripheralSummary }
  | {
      valid: false;
      reason: 'binding_inactive' | 'peripheral_missing' | 'metadata_changed';
      peripheral: FarmBotPeripheralSummary | null;
    };

export function isFarmBotSemanticAction(value: string): value is FarmBotSemanticAction {
  return FARMBOT_SEMANTIC_ACTIONS.includes(value as FarmBotSemanticAction);
}

export function validateFarmBotPeripheralBindingSnapshot(
  binding: FarmBotPeripheralBindingSnapshot,
  peripherals: FarmBotPeripheralSummary[]
): FarmBotPeripheralBindingValidation {
  const peripheral = peripherals.find((item) => item.id === binding.peripheralId) ?? null;

  if (!binding.isActive) {
    return { valid: false, reason: 'binding_inactive', peripheral };
  }
  if (!peripheral) {
    return { valid: false, reason: 'peripheral_missing', peripheral: null };
  }
  if (peripheral.label !== binding.peripheralLabel
    || peripheral.pin !== binding.peripheralPin
    || peripheral.mode !== binding.peripheralMode) {
    return { valid: false, reason: 'metadata_changed', peripheral };
  }

  return { valid: true, reason: 'valid', peripheral };
}
