export interface MqttReadonlyConnectionRequest {
  brokerUrl: string;
  username: string;
  password: string;
  clientId: string;
  topics: string[];
}

export interface MqttReadonlyTransportCallbacks {
  onConnected(): void;
  onDisconnected(code: string): void;
  onMessage(topic: string, payload: Uint8Array): void;
}

export interface MqttReadonlyTransportConnection {
  close(): Promise<void>;
}

export interface MqttReadonlyTransport {
  connect(
    request: MqttReadonlyConnectionRequest,
    callbacks: MqttReadonlyTransportCallbacks
  ): Promise<MqttReadonlyTransportConnection>;
}

export type MqttReadonlyTransportErrorCode =
  | 'broker_auth_rejected'
  | 'broker_tls_failed'
  | 'broker_timeout'
  | 'broker_unreachable'
  | 'broker_connect_failed'
  | 'subscription_failed';

export class MqttReadonlyTransportError extends Error {
  constructor(readonly code: MqttReadonlyTransportErrorCode) {
    super(code);
    this.name = 'MqttReadonlyTransportError';
  }
}

export class MqttReadonlyTransportUnavailable implements MqttReadonlyTransport {
  async connect(): Promise<MqttReadonlyTransportConnection> {
    throw new Error('read_only_transport_not_configured');
  }
}
