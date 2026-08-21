import 'server-only';

import {
  acceptValidatedFarmBotCommand,
} from '@/lib/services/threed/farmbot/command-repository';
import { dispatchAcceptedFarmBotWaterCommand } from './command-handoff';
import { acceptAndDispatchFarmBotWaterCommand } from './command-pilot-core';

export function runDormantFarmBotWaterPilot(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return acceptAndDispatchFarmBotWaterCommand(input, {
    acceptValidated: acceptValidatedFarmBotCommand,
    dispatchAccepted: dispatchAcceptedFarmBotWaterCommand,
  });
}
