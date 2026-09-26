import type { MqttReadonlyConnectionRequest } from './transport';

export const MQTT_READONLY_INTEGRATION_CAPABILITIES = [
  'read_status',
  'receive_responses',
] as const;

export type MqttReadonlyIntegrationCapability =
  typeof MQTT_READONLY_INTEGRATION_CAPABILITIES[number];

export interface MqttIntegrationIdentity {
  integrationType: string;
  integrationId: number;
  ownerId: string;
  clientId: string;
}

export interface MqttReadonlyIntegrationAdapter<TGrant, TMessage> {
  readonly integrationType: string;
  readonly capabilities: readonly MqttReadonlyIntegrationCapability[];

  identify(grant: TGrant): MqttIntegrationIdentity;
  buildConnection(grant: TGrant): MqttReadonlyConnectionRequest;
  acceptsTopic(grant: TGrant, topic: string): boolean;
  normalizeMessage(grant: TGrant, topic: string, payload: Uint8Array): TMessage | null;
}

export function validateMqttReadonlyIntegrationAdapter<TGrant, TMessage>(
  adapter: MqttReadonlyIntegrationAdapter<TGrant, TMessage>
): void {
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(adapter.integrationType)) {
    throw new Error('invalid_mqtt_integration_type');
  }
  if (adapter.capabilities.length === 0
    || new Set(adapter.capabilities).size !== adapter.capabilities.length
    || adapter.capabilities.some(
      (capability) => !MQTT_READONLY_INTEGRATION_CAPABILITIES.includes(capability)
    )) {
    throw new Error('invalid_mqtt_readonly_capabilities');
  }
}
