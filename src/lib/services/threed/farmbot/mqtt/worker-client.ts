import 'server-only';

import { mqttWorkerRequest } from '../../mqtt/worker-client';

export function connectFarmBotWorkerSession(farmbotId: number, grant: unknown) {
  return mqttWorkerRequest('PUT', `/internal/v1/farmbots/${farmbotId}/session`, grant);
}

export function getFarmBotWorkerSession(farmbotId: number) {
  return mqttWorkerRequest('GET', `/internal/v1/farmbots/${farmbotId}/status`);
}

export function disconnectFarmBotWorkerSession(farmbotId: number) {
  return mqttWorkerRequest('DELETE', `/internal/v1/farmbots/${farmbotId}/session`);
}
