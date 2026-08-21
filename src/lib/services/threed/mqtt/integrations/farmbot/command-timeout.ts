import 'server-only';

import {
  requireFarmBotCommandRecovery,
  timeOutDispatchedFarmBotCommand,
} from '@/lib/services/threed/farmbot/command-repository';
import { timeOutAndRequireFarmBotWaterRecovery } from './command-timeout-core';

export function recordDormantFarmBotWaterTimeout(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return timeOutAndRequireFarmBotWaterRecovery(input, {
    recordTimeout: timeOutDispatchedFarmBotCommand,
    requireRecovery: requireFarmBotCommandRecovery,
  });
}
