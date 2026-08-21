import 'server-only';

import {
  getRequiredFarmBotCommandRecoveryContext,
  recordFarmBotWorkerRecoveryDispatch,
} from '@/lib/services/threed/farmbot/command-repository';
import { handOffAndRecordFarmBotWaterOffRecovery } from './command-recovery-dispatch-coordinator-core';
import { requestFarmBotWorkerRecoveryAcceptance } from './command-recovery-handoff-core';
import { submitFarmBotWorkerWaterOffRecovery } from './worker-client';

export function handOffRequiredFarmBotWaterOffRecovery(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return requestFarmBotWorkerRecoveryAcceptance(input, {
    loadContext: getRequiredFarmBotCommandRecoveryContext,
    submitToWorker: submitFarmBotWorkerWaterOffRecovery,
  });
}

export function dispatchRequiredFarmBotWaterOffRecovery(input: {
  userId: string;
  commandId: string;
  now?: Date;
}) {
  return handOffAndRecordFarmBotWaterOffRecovery(input, {
    handOff: handOffRequiredFarmBotWaterOffRecovery,
    recordDispatch: recordFarmBotWorkerRecoveryDispatch,
  });
}
