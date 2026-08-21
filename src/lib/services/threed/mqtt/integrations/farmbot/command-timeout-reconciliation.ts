import 'server-only';

import {
  FarmBotCommandTransitionConflictError,
  listOverdueDispatchedFarmBotCommands,
} from '@/lib/services/threed/farmbot/command-repository';
import { FarmBotCommandTimeoutCoordinatorError } from './command-timeout-core';
import { recordDormantFarmBotWaterTimeout } from './command-timeout';
import { reconcileOverdueFarmBotCommands } from './command-timeout-reconciliation-core';

export function reconcileDormantFarmBotCommandTimeouts(input: {
  now?: Date;
  limit?: number;
} = {}) {
  return reconcileOverdueFarmBotCommands(input, {
    loadOverdue: listOverdueDispatchedFarmBotCommands,
    async reconcile(command) {
      try {
        return await recordDormantFarmBotWaterTimeout(command);
      } catch (error) {
        if (error instanceof FarmBotCommandTransitionConflictError
          || error instanceof FarmBotCommandTimeoutCoordinatorError) return null;
        throw error;
      }
    },
  });
}
