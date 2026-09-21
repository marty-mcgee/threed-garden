import type {
  MqttIntegrationIdentity,
  MqttReadonlyIntegrationAdapter,
} from '../../core/integration-adapter';
import type { MqttReadonlyConnectionRequest } from '../../core/transport';
import type { FarmBotWorkerConnectionGrant } from './grant';
import {
  farmBotWorkerTopics,
  parseFarmBotWorkerStatusPayload,
  type FarmBotWorkerPosition,
} from './status';
import {
  parseFarmBotWorkerRpcResponse,
  type FarmBotWorkerRpcResponse,
} from './rpc';

export type FarmBotMqttNormalizedMessage =
  | { kind: 'status'; position: FarmBotWorkerPosition }
  | { kind: 'response'; response: FarmBotWorkerRpcResponse };

export class FarmBotMqttReadonlyAdapter implements MqttReadonlyIntegrationAdapter<
  FarmBotWorkerConnectionGrant,
  FarmBotMqttNormalizedMessage
> {
  readonly integrationType = 'farmbot';
  readonly capabilities = ['read_status', 'receive_responses'] as const;

  identify(grant: FarmBotWorkerConnectionGrant): MqttIntegrationIdentity {
    return {
      integrationType: this.integrationType,
      integrationId: grant.farmbotId,
      ownerId: grant.ownerId,
      clientId: grant.brokerDeviceId,
    };
  }

  buildConnection(grant: FarmBotWorkerConnectionGrant): MqttReadonlyConnectionRequest {
    const topics = farmBotWorkerTopics(grant.brokerDeviceId);
    return {
      brokerUrl: `mqtts://${grant.mqttHost}:8883`,
      username: grant.brokerDeviceId,
      password: grant.credential,
      clientId: `marty_mcgee_farmbot_${grant.farmbotId}`,
      topics: [topics.status, topics.fromDevice],
    };
  }

  acceptsTopic(grant: FarmBotWorkerConnectionGrant, topic: string): boolean {
    const topics = farmBotWorkerTopics(grant.brokerDeviceId);
    return topic === topics.status || topic === topics.fromDevice;
  }

  normalizeMessage(
    grant: FarmBotWorkerConnectionGrant,
    topic: string,
    payload: Uint8Array
  ): FarmBotMqttNormalizedMessage | null {
    const topics = farmBotWorkerTopics(grant.brokerDeviceId);
    if (topic === topics.status) {
      return { kind: 'status', position: parseFarmBotWorkerStatusPayload(payload) };
    }
    if (topic === topics.fromDevice) {
      return { kind: 'response', response: parseFarmBotWorkerRpcResponse(payload) };
    }
    return null;
  }
}

export const farmBotMqttReadonlyAdapter = new FarmBotMqttReadonlyAdapter();
