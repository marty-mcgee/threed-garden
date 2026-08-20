import { createHash, randomUUID } from 'node:crypto';
import type { FarmBotWorkerConnectionGrant } from './grant-core';
import {
  farmBotWorkerTopics,
  parseFarmBotWorkerStatusPayload,
  type FarmBotWorkerPosition,
} from './status-core';
import type {
  MqttReadonlyTransport,
  MqttReadonlyTransportConnection,
} from '../../mqtt/transport';
import { MqttReadonlyTransportError } from '../../mqtt/transport';
import { parseFarmBotWorkerRpcResponse } from './rpc-core';
import {
  DisabledFarmBotWorkerPersistenceSink,
  type FarmBotWorkerPersistenceSink,
} from './persistence-client';

export type FarmBotWorkerConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'expired'
  | 'error';

export interface FarmBotWorkerRuntimeStatus {
  farmbotId: number;
  brokerDeviceId: string;
  workerSessionId: string;
  connectionState: FarmBotWorkerConnectionState;
  stateChangedAt: string;
  lastMessageAt: string | null;
  lastStatusAt: string | null;
  position: FarmBotWorkerPosition | null;
  tokenExpiresAt: string;
  stale: boolean;
  reconnectAttempts: number;
  invalidMessageCount: number;
  errorCode: string | null;
}

interface Session {
  grant: FarmBotWorkerConnectionGrant;
  credentialFingerprint: string;
  connection: MqttReadonlyTransportConnection | null;
  status: FarmBotWorkerRuntimeStatus;
  generation: number;
  lastPositionEventAt: number | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

export interface FarmBotWorkerRegistryOptions {
  now?: () => Date;
  staleAfterMs?: number;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
}

export class FarmBotWorkerSessionScopeError extends Error {
  constructor() {
    super('owner_scope_mismatch');
    this.name = 'FarmBotWorkerSessionScopeError';
  }
}

export class FarmBotWorkerSessionRegistry {
  private readonly sessions = new Map<number, Session>();
  private readonly now: () => Date;
  private readonly staleAfterMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;

  constructor(
    private readonly transport: MqttReadonlyTransport,
    options: FarmBotWorkerRegistryOptions = {},
    private readonly persistence: FarmBotWorkerPersistenceSink
      = new DisabledFarmBotWorkerPersistenceSink()
  ) {
    this.now = options.now ?? (() => new Date());
    this.staleAfterMs = options.staleAfterMs ?? 30_000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 1_000;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 30_000;
  }

  async connect(grant: FarmBotWorkerConnectionGrant): Promise<FarmBotWorkerRuntimeStatus> {
    const fingerprint = createHash('sha256').update(grant.credential).digest('base64url');
    const existing = this.sessions.get(grant.farmbotId);
    if (existing && existing.grant.ownerId !== grant.ownerId) {
      throw new FarmBotWorkerSessionScopeError();
    }
    if (existing?.credentialFingerprint === fingerprint
      && existing.grant.brokerDeviceId === grant.brokerDeviceId
      && existing.status.connectionState !== 'error'
      && existing.status.connectionState !== 'expired') {
      return this.publicStatus(existing);
    }

    if (existing) await this.disconnect(grant.farmbotId);

    const now = this.now();
    const session: Session = {
      grant,
      credentialFingerprint: fingerprint,
      connection: null,
      generation: (existing?.generation ?? 0) + 1,
      lastPositionEventAt: null,
      reconnectTimer: null,
      status: {
        farmbotId: grant.farmbotId,
        brokerDeviceId: grant.brokerDeviceId,
        workerSessionId: randomUUID(),
        connectionState: 'connecting',
        stateChangedAt: now.toISOString(),
        lastMessageAt: null,
        lastStatusAt: null,
        position: null,
        tokenExpiresAt: grant.tokenExpiresAt.toISOString(),
        stale: true,
        reconnectAttempts: 0,
        invalidMessageCount: 0,
        errorCode: null,
      },
    };
    this.sessions.set(grant.farmbotId, session);
    this.record(session, {
      source: 'lifecycle',
      eventType: 'connection_state',
      connectionState: 'connecting',
      outcome: 'observed',
      rpcLabel: null,
      errorCode: null,
      position: null,
      payloadBytes: 0,
      payloadSha256: createHash('sha256').update('').digest('hex'),
    });
    try {
      session.connection = await this.openTransport(session);
    } catch (error) {
      this.transition(
        session,
        'error',
        error instanceof MqttReadonlyTransportError
          ? error.code
          : 'broker_connect_failed'
      );
      this.recordLifecycle(session);
    }

    return this.publicStatus(session);
  }

  get(farmbotId: number): FarmBotWorkerRuntimeStatus | null {
    const session = this.sessions.get(farmbotId);
    if (!session) return null;
    if (session.grant.tokenExpiresAt <= this.now()) {
      this.transition(session, 'expired', 'token_expired');
      void session.connection?.close().catch(() => undefined);
      session.connection = null;
    }
    return this.publicStatus(session);
  }

  async disconnect(farmbotId: number): Promise<boolean> {
    const session = this.sessions.get(farmbotId);
    if (!session) return false;
    session.generation += 1;
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
    try {
      await session.connection?.close();
    } finally {
      session.connection = null;
      this.transition(session, 'disconnected', null);
      this.recordLifecycle(session);
      session.grant.credential = '';
      this.sessions.delete(farmbotId);
    }
    return true;
  }

  async shutdown(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((farmbotId) => this.disconnect(farmbotId)));
    await this.persistence.flush();
  }

  private current(farmbotId: number, generation: number): Session | null {
    const session = this.sessions.get(farmbotId);
    return session?.generation === generation ? session : null;
  }

  private handleConnected(farmbotId: number, generation: number): void {
    const session = this.current(farmbotId, generation);
    if (session) {
      this.transition(session, 'connected', null);
      session.status.reconnectAttempts = 0;
      this.recordLifecycle(session);
    }
  }

  private handleDisconnected(farmbotId: number, generation: number, code: string): void {
    const session = this.current(farmbotId, generation);
    if (!session) return;
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
    session.connection = null;
    session.status.reconnectAttempts += 1;
    if (session.grant.tokenExpiresAt <= this.now()) {
      this.transition(session, 'expired', 'token_expired');
    } else if (session.status.reconnectAttempts >= this.maxReconnectAttempts) {
      this.transition(session, 'error', 'reconnect_limit_reached');
    } else {
      this.transition(session, 'reconnecting', code || 'transport_disconnected');
      const delay = Math.min(
        this.reconnectBaseDelayMs * (2 ** (session.status.reconnectAttempts - 1)),
        this.reconnectMaxDelayMs
      );
      session.reconnectTimer = setTimeout(() => {
        session.reconnectTimer = null;
        void this.reconnect(session);
      }, delay);
    }
    this.recordLifecycle(session);
  }

  private openTransport(session: Session): Promise<MqttReadonlyTransportConnection> {
    const farmbotId = session.grant.farmbotId;
    const generation = session.generation;
    const topics = farmBotWorkerTopics(session.grant.brokerDeviceId);
    return this.transport.connect({
      brokerUrl: `mqtts://${session.grant.mqttHost}:8883`,
      username: session.grant.brokerDeviceId,
      password: session.grant.credential,
      clientId: `marty_mcgee_farmbot_${session.grant.farmbotId}`,
      topics: [topics.status, topics.fromDevice],
    }, {
      onConnected: () => this.handleConnected(farmbotId, generation),
      onDisconnected: (code) => this.handleDisconnected(farmbotId, generation, code),
      onMessage: (topic, payload) => this.handleMessage(
        farmbotId,
        generation,
        topic,
        payload
      ),
    });
  }

  private async reconnect(session: Session): Promise<void> {
    if (this.current(session.grant.farmbotId, session.generation) !== session
      || session.status.connectionState !== 'reconnecting') return;
    if (session.grant.tokenExpiresAt <= this.now()) {
      this.transition(session, 'expired', 'token_expired');
      this.recordLifecycle(session);
      return;
    }
    try {
      session.connection = await this.openTransport(session);
    } catch {
      this.handleDisconnected(
        session.grant.farmbotId,
        session.generation,
        'transport_reconnect_failed'
      );
    }
  }

  private handleMessage(
    farmbotId: number,
    generation: number,
    topic: string,
    payload: Uint8Array
  ): void {
    const session = this.current(farmbotId, generation);
    if (!session || session.status.connectionState !== 'connected') return;
    const topics = farmBotWorkerTopics(session.grant.brokerDeviceId);
    const receivedAt = this.now().toISOString();
    if (topic !== topics.status && topic !== topics.fromDevice) {
      session.status.invalidMessageCount += 1;
      this.recordInvalidSummary(session, payload);
      return;
    }
    session.status.lastMessageAt = receivedAt;
    if (topic === topics.status) {
      try {
        const nextPosition = parseFarmBotWorkerStatusPayload(payload);
        const positionChanged = !session.status.position
          || session.status.position.x !== nextPosition.x
          || session.status.position.y !== nextPosition.y
          || session.status.position.z !== nextPosition.z;
        session.status.position = nextPosition;
        session.status.lastStatusAt = receivedAt;
        const nowMs = this.now().getTime();
        if (positionChanged || session.lastPositionEventAt === null
          || nowMs - session.lastPositionEventAt >= 30_000) {
          session.lastPositionEventAt = nowMs;
          this.record(session, {
            source: 'status',
            eventType: 'position',
            connectionState: null,
            outcome: 'observed',
            rpcLabel: null,
            errorCode: null,
            position: session.status.position,
            payloadBytes: payload.byteLength,
            payloadSha256: createHash('sha256').update(payload).digest('hex'),
          });
        } else {
          this.record(session, null);
        }
      } catch {
        session.status.invalidMessageCount += 1;
        this.recordInvalidSummary(session, payload);
      }
    } else {
      try {
        const rpc = parseFarmBotWorkerRpcResponse(payload);
        this.record(session, {
          source: 'from_device',
          eventType: rpc.eventType,
          connectionState: null,
          outcome: rpc.outcome,
          rpcLabel: rpc.rpcLabel,
          errorCode: rpc.errorCode,
          position: null,
          payloadBytes: payload.byteLength,
          payloadSha256: createHash('sha256').update(payload).digest('hex'),
        });
      } catch {
        session.status.invalidMessageCount += 1;
        this.recordInvalidSummary(session, payload);
      }
    }
  }

  private transition(
    session: Session,
    connectionState: FarmBotWorkerConnectionState,
    errorCode: string | null
  ): void {
    session.status.connectionState = connectionState;
    session.status.stateChangedAt = this.now().toISOString();
    session.status.errorCode = errorCode;
  }

  private publicStatus(session: Session): FarmBotWorkerRuntimeStatus {
    const lastStatusMs = session.status.lastStatusAt
      ? new Date(session.status.lastStatusAt).getTime()
      : 0;
    return {
      ...session.status,
      position: session.status.position ? { ...session.status.position } : null,
      stale: !lastStatusMs || this.now().getTime() - lastStatusMs > this.staleAfterMs,
    };
  }

  private recordLifecycle(session: Session): void {
    this.record(session, {
      source: 'lifecycle',
      eventType: 'connection_state',
      connectionState: session.status.connectionState,
      outcome: session.status.connectionState === 'error' ? 'error' : 'observed',
      rpcLabel: null,
      errorCode: session.status.errorCode,
      position: null,
      payloadBytes: 0,
      payloadSha256: createHash('sha256').update('').digest('hex'),
    });
  }

  private recordInvalidSummary(session: Session, payload: Uint8Array): void {
    if (session.status.invalidMessageCount % 10 !== 0) {
      this.record(session, null);
      return;
    }
    this.record(session, {
      source: 'lifecycle',
      eventType: 'invalid_message_summary',
      connectionState: null,
      outcome: 'rejected',
      rpcLabel: null,
      errorCode: 'invalid_broker_message',
      position: null,
      payloadBytes: Math.min(payload.byteLength, 262_144),
      payloadSha256: createHash('sha256').update(payload).digest('hex'),
    });
  }

  private record(
    session: Session,
    event: Omit<import('../mqtt-persistence-core')
      .FarmBotMqttEventInput, 'eventId' | 'occurredAt' | 'summary'> | null
  ): void {
    this.persistence.record({
      ownerId: session.grant.ownerId,
      farmbotId: session.grant.farmbotId,
      brokerDeviceId: session.grant.brokerDeviceId,
      workerSessionId: session.status.workerSessionId,
      runtime: this.publicStatus(session),
      event: event ? {
        ...event,
        eventId: randomUUID(),
        occurredAt: this.now(),
        summary: '',
      } : null,
    });
  }
}
