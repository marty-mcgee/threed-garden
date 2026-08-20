import { randomBytes } from 'node:crypto';
import {
  connectAsync,
  type IClientOptions,
  type ISubscriptionGrant,
} from 'mqtt';
import type {
  MqttReadonlyConnectionRequest,
  MqttReadonlyTransport,
  MqttReadonlyTransportCallbacks,
  MqttReadonlyTransportConnection,
} from './transport';
import { MqttReadonlyTransportError } from './transport';

interface ReadonlyMqttClient {
  on(event: 'message', listener: (topic: string, payload: Buffer) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: () => void): this;
  off(event: 'message', listener: (topic: string, payload: Buffer) => void): this;
  off(event: 'close', listener: () => void): this;
  off(event: 'error', listener: () => void): this;
  subscribeAsync(topics: string[], options: { qos: 0 }): Promise<ISubscriptionGrant[]>;
  endAsync(force?: boolean): Promise<void>;
}

export type MqttConnector = (
  brokerUrl: string,
  options: IClientOptions
) => Promise<ReadonlyMqttClient>;

const defaultConnector: MqttConnector = (brokerUrl, options) => (
  connectAsync(brokerUrl, options, false)
);

function connectionErrorCode(error: unknown): ConstructorParameters<
  typeof MqttReadonlyTransportError
>[0] {
  const rawCode = typeof error === 'object' && error !== null && 'code' in error
    ? error.code
    : null;
  const code = rawCode === null ? '' : String(rawCode);
  const reasonCode = typeof error === 'object' && error !== null && 'reasonCode' in error
    ? Number(error.reasonCode)
    : typeof rawCode === 'number' ? rawCode : null;
  if (reasonCode === 4 || reasonCode === 5) return 'broker_auth_rejected';
  if (code === 'CERT_HAS_EXPIRED' || code === 'DEPTH_ZERO_SELF_SIGNED_CERT'
    || code === 'ERR_TLS_CERT_ALTNAME_INVALID' || code.startsWith('ERR_SSL')) {
    return 'broker_tls_failed';
  }
  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return 'broker_timeout';
  if (code === 'ECONNREFUSED' || code === 'ENETUNREACH' || code === 'EHOSTUNREACH'
    || code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'broker_unreachable';
  return 'broker_connect_failed';
}

export class MqttJsReadonlyTransport implements MqttReadonlyTransport {
  constructor(private readonly connector: MqttConnector = defaultConnector) {}

  async connect(
    request: MqttReadonlyConnectionRequest,
    callbacks: MqttReadonlyTransportCallbacks
  ): Promise<MqttReadonlyTransportConnection> {
    const requestedTopics = [...request.topics];
    if (requestedTopics.length === 0 || new Set(requestedTopics).size !== requestedTopics.length) {
      throw new Error('invalid_read_only_topics');
    }
    let client: ReadonlyMqttClient;
    try {
      client = await this.connector(request.brokerUrl, {
        username: request.username,
        password: Buffer.from(request.password, 'utf8'),
        clientId: `${request.clientId}_${randomBytes(8).toString('hex')}`,
        protocolVersion: 4,
        clean: true,
        keepalive: 60,
        connectTimeout: 15_000,
        reconnectPeriod: 0,
        reconnectOnConnackError: false,
        resubscribe: false,
        rejectUnauthorized: true,
      });
    } catch (error) {
      throw new MqttReadonlyTransportError(connectionErrorCode(error));
    }

    let closedByWorker = false;
    let disconnectReported = false;
    const reportDisconnect = (code: string) => {
      if (closedByWorker || disconnectReported) return;
      disconnectReported = true;
      callbacks.onDisconnected(code);
    };
    const onMessage = (topic: string, payload: Buffer) => {
      callbacks.onMessage(topic, payload);
    };
    const onClose = () => reportDisconnect('transport_closed');
    const onError = () => reportDisconnect('transport_error');
    client.on('message', onMessage);
    client.on('close', onClose);
    client.on('error', onError);

    try {
      const granted = await client.subscribeAsync(requestedTopics, { qos: 0 });
      const acceptedTopics = new Set(
        granted.filter((entry) => entry.qos === 0).map((entry) => entry.topic)
      );
      if (acceptedTopics.size !== requestedTopics.length
        || requestedTopics.some((topic) => !acceptedTopics.has(topic))) {
        throw new Error('read_only_subscription_rejected');
      }
    } catch {
      closedByWorker = true;
      client.off('message', onMessage);
      client.off('close', onClose);
      client.off('error', onError);
      await client.endAsync(true).catch(() => undefined);
      throw new MqttReadonlyTransportError('subscription_failed');
    }

    callbacks.onConnected();
    return {
      close: async () => {
        if (closedByWorker) return;
        closedByWorker = true;
        client.off('message', onMessage);
        client.off('close', onClose);
        client.off('error', onError);
        await client.endAsync(false);
      },
    };
  }
}
