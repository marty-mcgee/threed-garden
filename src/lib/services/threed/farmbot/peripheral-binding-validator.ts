import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { threedFarmbotPeripheralBindings } from '@/lib/schema/threed';
import { loadFarmBotCredential } from './credential-repository';
import { listFarmBotPeripherals } from './peripheral-client';
import {
  validateFarmBotPeripheralBindingSnapshot,
  type FarmBotPeripheralBindingValidation,
  type FarmBotSemanticAction,
} from './peripheral-binding-core';

export class FarmBotPeripheralBindingNotFoundError extends Error {
  constructor() {
    super('FarmBot peripheral binding not found');
    this.name = 'FarmBotPeripheralBindingNotFoundError';
  }
}

export async function validateFarmBotPeripheralBinding(
  userId: string,
  farmbotId: number,
  semanticAction: FarmBotSemanticAction
): Promise<FarmBotPeripheralBindingValidation> {
  const [binding] = await db
    .select()
    .from(threedFarmbotPeripheralBindings)
    .where(and(
      eq(threedFarmbotPeripheralBindings.userId, userId),
      eq(threedFarmbotPeripheralBindings.farmbotId, farmbotId),
      eq(threedFarmbotPeripheralBindings.semanticAction, semanticAction)
    ))
    .limit(1);

  if (!binding) {
    throw new FarmBotPeripheralBindingNotFoundError();
  }

  const token = await loadFarmBotCredential(userId, farmbotId);
  const inventory = await listFarmBotPeripherals(token);
  return validateFarmBotPeripheralBindingSnapshot(binding, inventory.peripherals);
}
