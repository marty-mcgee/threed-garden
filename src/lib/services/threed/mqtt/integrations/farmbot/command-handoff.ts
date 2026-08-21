import 'server-only';

import {
  getAcceptedFarmBotCommandDeliveryContext,
  recordFarmBotWorkerCommandDispatch,
} from '@/lib/services/threed/farmbot/command-repository';
import { handOffAndRecordFarmBotWaterCommand } from './command-dispatch-coordinator-core';
import { requestFarmBotWorkerCommandAcceptance } from './command-handoff-core';
import { submitFarmBotWorkerWaterCommand } from './worker-client';

export function handOffAcceptedFarmBotWaterCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return requestFarmBotWorkerCommandAcceptance(input, {
    loadContext: getAcceptedFarmBotCommandDeliveryContext,
    submitToWorker: submitFarmBotWorkerWaterCommand,
  });
}

export function dispatchAcceptedFarmBotWaterCommand(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return handOffAndRecordFarmBotWaterCommand(input, {
    handOff: handOffAcceptedFarmBotWaterCommand,
    recordDispatch: recordFarmBotWorkerCommandDispatch,
  });
}
