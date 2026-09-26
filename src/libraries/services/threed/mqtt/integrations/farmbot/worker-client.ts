import 'server-only';

import { mqttWorkerRequest } from '../../worker/client';
import {
  prepareFarmBotWorkerWaterCommandSubmission,
} from './command-request-core';
import { parseFarmBotWorkerCommandAcceptedResponse } from './command-response-core';
import {
  prepareFarmBotWorkerWaterOffRecoverySubmission,
} from './command-recovery-request-core';
import { parseFarmBotWorkerRecoveryAcceptedResponse } from './command-recovery-response-core';
import { prepareFarmBotWorkerEmergencyWaterOffSubmission } from './emergency-water-off-request-core';
import { parseFarmBotWorkerEmergencyWaterOffAcceptedResponse } from './emergency-water-off-response-core';

export function connectFarmBotWorkerSession(farmbotId: number, grant: unknown) {
  return mqttWorkerRequest('PUT', `/internal/v1/farmbots/${farmbotId}/session`, grant);
}

export function getFarmBotWorkerSession(farmbotId: number) {
  return mqttWorkerRequest('GET', `/internal/v1/farmbots/${farmbotId}/status`);
}

export function disconnectFarmBotWorkerSession(farmbotId: number) {
  return mqttWorkerRequest('DELETE', `/internal/v1/farmbots/${farmbotId}/session`);
}

export async function submitFarmBotWorkerWaterCommand(farmbotId: number, payload: unknown) {
  const submission = prepareFarmBotWorkerWaterCommandSubmission(farmbotId, payload);
  const response = await mqttWorkerRequest('POST', submission.path, submission.command);
  return parseFarmBotWorkerCommandAcceptedResponse({
    response,
    command: submission.command,
  });
}

export async function submitFarmBotWorkerWaterOffRecovery(farmbotId: number, payload: unknown) {
  const submission = prepareFarmBotWorkerWaterOffRecoverySubmission(farmbotId, payload);
  const response = await mqttWorkerRequest('POST', submission.path, submission.recovery);
  return parseFarmBotWorkerRecoveryAcceptedResponse({
    response,
    recovery: submission.recovery,
  });
}

export async function submitFarmBotWorkerEmergencyWaterOff(farmbotId: number, payload: unknown) {
  const submission = prepareFarmBotWorkerEmergencyWaterOffSubmission(farmbotId, payload);
  const response = await mqttWorkerRequest('POST', submission.path, submission.emergency);
  return parseFarmBotWorkerEmergencyWaterOffAcceptedResponse({
    response,
    emergency: submission.emergency,
  });
}
