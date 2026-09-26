import type { MqttReadonlyIntegrationAdapter } from './integration-adapter';
import {
  isMqttReadonlySessionExpired,
  mqttReadonlySessionTransition,
  planMqttReadonlyReconnect,
  type MqttReadonlySessionConnectionState,
} from './session-lifecycle';
import {
  MqttReadonlyTransportError,
  type MqttReadonlyTransport,
  type MqttReadonlyTransportConnection,
} from './transport';

export interface MqttReadonlySessionSnapshot {
  connectionState: MqttReadonlySessionConnectionState;
  stateChangedAt: string;
  lastMessageAt: string | null;
  reconnectAttempts: number;
  invalidMessageCount: number;
  errorCode: string | null;
}

export interface MqttReadonlySessionMessage<TMessage> {
  message: TMessage;
  topic: string;
  payload: Uint8Array;
  receivedAt: string;
  snapshot: MqttReadonlySessionSnapshot;
}

export type MqttReadonlySessionTransitionReason =
  | 'start'
  | 'transport'
  | 'reconnect'
  | 'expiry_check'
  | 'stop';

export interface MqttReadonlySessionObserver<TMessage> {
  onTransition?(input: {
    snapshot: MqttReadonlySessionSnapshot;
    reason: MqttReadonlySessionTransitionReason;
  }): void;
  onMessage?(event: MqttReadonlySessionMessage<TMessage>): void;
  onInvalidMessage?(input: {
    topic: string;
    payload: Uint8Array;
    receivedAt: string;
    approvedTopic: boolean;
    snapshot: MqttReadonlySessionSnapshot;
  }): void;
}

export interface MqttReadonlySessionControllerOptions<TGrant, TMessage> {
  grant: TGrant;
  expiresAt(grant: TGrant): Date;
  adapter: MqttReadonlyIntegrationAdapter<TGrant, TMessage>;
  transport: MqttReadonlyTransport;
  observer?: MqttReadonlySessionObserver<TMessage>;
  now?: () => Date;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
}

export class MqttReadonlySessionController<TGrant, TMessage> {
  private connection: MqttReadonlyTransportConnection | null = null;
  private generation = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly now: () => Date;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private state: MqttReadonlySessionSnapshot;

  constructor(private readonly options: MqttReadonlySessionControllerOptions<TGrant, TMessage>) {
    this.now = options.now ?? (() => new Date());
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 1_000;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 30_000;
    this.state = {
      ...mqttReadonlySessionTransition('disconnected', null, this.now()),
      lastMessageAt: null,
      reconnectAttempts: 0,
      invalidMessageCount: 0,
    };
  }

  snapshot(): MqttReadonlySessionSnapshot {
    this.expireIfNeeded('expiry_check');
    return { ...this.state };
  }

  async start(): Promise<MqttReadonlySessionSnapshot> {
    if (this.state.connectionState === 'connecting'
      || this.state.connectionState === 'connected'
      || this.state.connectionState === 'reconnecting') {
      return this.snapshot();
    }
    if (this.expireIfNeeded('start')) return this.snapshot();
    this.generation += 1;
    const generation = this.generation;
    this.state.reconnectAttempts = 0;
    this.applyTransition('connecting', null, 'start');
    try {
      const connection = await this.open(generation);
      if (generation !== this.generation) {
        await connection.close();
      } else {
        this.connection = connection;
      }
    } catch (error) {
      if (generation === this.generation) {
        this.applyTransition(
          'error',
          error instanceof MqttReadonlyTransportError ? error.code : 'broker_connect_failed',
          'transport'
        );
      }
    }
    return this.snapshot();
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.clearReconnectTimer();
    const connection = this.connection;
    this.connection = null;
    try {
      await connection?.close();
    } finally {
      this.applyTransition('disconnected', null, 'stop');
    }
  }

  private open(generation: number): Promise<MqttReadonlyTransportConnection> {
    return this.options.transport.connect(
      this.options.adapter.buildConnection(this.options.grant),
      {
        onConnected: () => this.handleConnected(generation),
        onDisconnected: (code) => this.handleDisconnected(generation, code),
        onMessage: (topic, payload) => this.handleMessage(generation, topic, payload),
      }
    );
  }

  private handleConnected(generation: number): void {
    if (generation !== this.generation) return;
    this.state.reconnectAttempts = 0;
    this.applyTransition('connected', null, 'transport');
  }

  private handleDisconnected(generation: number, code: string): void {
    if (generation !== this.generation) return;
    this.clearReconnectTimer();
    this.connection = null;
    const reconnect = planMqttReadonlyReconnect({
      now: this.now(),
      expiresAt: this.options.expiresAt(this.options.grant),
      reconnectAttempts: this.state.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectBaseDelayMs: this.reconnectBaseDelayMs,
      reconnectMaxDelayMs: this.reconnectMaxDelayMs,
      disconnectCode: code,
    });
    this.state = {
      ...this.state,
      connectionState: reconnect.connectionState,
      stateChangedAt: reconnect.stateChangedAt,
      reconnectAttempts: reconnect.reconnectAttempts,
      errorCode: reconnect.errorCode,
    };
    this.emitTransition('transport');
    if (reconnect.reconnectDelayMs !== null) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        void this.reconnect(generation);
      }, reconnect.reconnectDelayMs);
    }
  }

  private async reconnect(generation: number): Promise<void> {
    if (generation !== this.generation || this.state.connectionState !== 'reconnecting') return;
    if (this.expireIfNeeded('reconnect')) return;
    try {
      const connection = await this.open(generation);
      if (generation !== this.generation) {
        await connection.close();
      } else {
        this.connection = connection;
      }
    } catch {
      this.handleDisconnected(generation, 'transport_reconnect_failed');
    }
  }

  private handleMessage(generation: number, topic: string, payload: Uint8Array): void {
    if (generation !== this.generation || this.state.connectionState !== 'connected') return;
    const receivedAt = this.now().toISOString();
    const approvedTopic = this.options.adapter.acceptsTopic(this.options.grant, topic);
    if (!approvedTopic) {
      this.invalidMessage(topic, payload, receivedAt, false);
      return;
    }
    this.state.lastMessageAt = receivedAt;
    let message: TMessage | null;
    try {
      message = this.options.adapter.normalizeMessage(this.options.grant, topic, payload);
    } catch {
      this.invalidMessage(topic, payload, receivedAt, true);
      return;
    }
    if (message === null) {
      this.invalidMessage(topic, payload, receivedAt, true);
      return;
    }
    this.options.observer?.onMessage?.({
      message,
      topic,
      payload,
      receivedAt,
      snapshot: { ...this.state },
    });
  }

  private invalidMessage(
    topic: string,
    payload: Uint8Array,
    receivedAt: string,
    approvedTopic: boolean
  ): void {
    this.state.invalidMessageCount += 1;
    this.options.observer?.onInvalidMessage?.({
      topic,
      payload,
      receivedAt,
      approvedTopic,
      snapshot: { ...this.state },
    });
  }

  private expireIfNeeded(reason: MqttReadonlySessionTransitionReason): boolean {
    if (!isMqttReadonlySessionExpired(
      this.options.expiresAt(this.options.grant),
      this.now()
    )) return false;
    if (this.state.connectionState !== 'expired') {
      this.clearReconnectTimer();
      const connection = this.connection;
      this.connection = null;
      void connection?.close().catch(() => undefined);
      this.applyTransition('expired', 'token_expired', reason);
    }
    return true;
  }

  private applyTransition(
    connectionState: MqttReadonlySessionConnectionState,
    errorCode: string | null,
    reason: MqttReadonlySessionTransitionReason
  ): void {
    this.state = {
      ...this.state,
      ...mqttReadonlySessionTransition(connectionState, errorCode, this.now()),
    };
    this.emitTransition(reason);
  }

  private emitTransition(reason: MqttReadonlySessionTransitionReason): void {
    this.options.observer?.onTransition?.({
      snapshot: { ...this.state },
      reason,
    });
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
