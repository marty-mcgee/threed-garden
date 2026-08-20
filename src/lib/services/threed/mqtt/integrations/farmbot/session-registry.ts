import { createHash, randomUUID } from 'node:crypto';
import type { FarmBotWorkerConnectionGrant } from './grant';
import {
  type FarmBotWorkerPosition,
} from './status';
import type {
  MqttReadonlyTransport,
} from '../../core/transport';
import type { MqttReadonlyIntegrationAdapter } from '../../core/integration-adapter';
import {
  type MqttReadonlySessionConnectionState,
} from '../../core/session-lifecycle';
import {
  MqttReadonlySessionController,
  type MqttReadonlySessionMessage,
  type MqttReadonlySessionSnapshot,
  type MqttReadonlySessionTransitionReason,
} from '../../core/session-controller';
import {
  farmBotMqttReadonlyAdapter,
  type FarmBotMqttNormalizedMessage,
} from './adapter';
import {
  DisabledFarmBotWorkerPersistenceSink,
  type FarmBotWorkerPersistenceSink,
} from './persistence-client';

export type FarmBotWorkerConnectionState = MqttReadonlySessionConnectionState;

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
  controller: MqttReadonlySessionController<
    FarmBotWorkerConnectionGrant,
    FarmBotMqttNormalizedMessage
  >;
  status: FarmBotWorkerRuntimeStatus;
  lastPositionEventAt: number | null;
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
      = new DisabledFarmBotWorkerPersistenceSink(),
    private readonly adapter: MqttReadonlyIntegrationAdapter<
      FarmBotWorkerConnectionGrant,
      FarmBotMqttNormalizedMessage
    > = farmBotMqttReadonlyAdapter
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
    let session: Session;
    const controller = new MqttReadonlySessionController({
      grant,
      expiresAt: (connectionGrant) => connectionGrant.tokenExpiresAt,
      adapter: this.adapter,
      transport: this.transport,
      now: this.now,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectBaseDelayMs: this.reconnectBaseDelayMs,
      reconnectMaxDelayMs: this.reconnectMaxDelayMs,
      observer: {
        onTransition: (transition) => this.handleTransition(session, transition),
        onMessage: (message) => this.handleMessage(session, message),
        onInvalidMessage: ({ payload, snapshot }) => {
          this.syncControllerStatus(session, snapshot);
          this.recordInvalidSummary(session, payload);
        },
      },
    });
    session = {
      grant,
      credentialFingerprint: fingerprint,
      controller,
      lastPositionEventAt: null,
      status: {
        farmbotId: grant.farmbotId,
        brokerDeviceId: grant.brokerDeviceId,
        workerSessionId: randomUUID(),
        connectionState: 'disconnected',
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
    await controller.start();

    return this.publicStatus(session);
  }

  get(farmbotId: number): FarmBotWorkerRuntimeStatus | null {
    const session = this.sessions.get(farmbotId);
    if (!session) return null;
    this.syncControllerStatus(session, session.controller.snapshot());
    return this.publicStatus(session);
  }

  async disconnect(farmbotId: number): Promise<boolean> {
    const session = this.sessions.get(farmbotId);
    if (!session) return false;
    try {
      await session.controller.stop();
    } finally {
      session.grant.credential = '';
      this.sessions.delete(farmbotId);
    }
    return true;
  }

  async shutdown(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((farmbotId) => this.disconnect(farmbotId)));
    await this.persistence.flush();
  }

  private handleMessage(
    session: Session,
    event: MqttReadonlySessionMessage<FarmBotMqttNormalizedMessage>
  ): void {
    this.syncControllerStatus(session, event.snapshot);
    if (event.message.kind === 'status') {
      const nextPosition = event.message.position;
      const positionChanged = !session.status.position
        || session.status.position.x !== nextPosition.x
        || session.status.position.y !== nextPosition.y
        || session.status.position.z !== nextPosition.z;
      session.status.position = nextPosition;
      session.status.lastStatusAt = event.receivedAt;
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
          payloadBytes: event.payload.byteLength,
          payloadSha256: createHash('sha256').update(event.payload).digest('hex'),
        });
      } else {
        this.record(session, null);
      }
    } else {
      const rpc = event.message.response;
      this.record(session, {
        source: 'from_device',
        eventType: rpc.eventType,
        connectionState: null,
        outcome: rpc.outcome,
        rpcLabel: rpc.rpcLabel,
        errorCode: rpc.errorCode,
        position: null,
        payloadBytes: event.payload.byteLength,
        payloadSha256: createHash('sha256').update(event.payload).digest('hex'),
      });
    }
  }

  private handleTransition(
    session: Session,
    transition: {
      snapshot: MqttReadonlySessionSnapshot;
      reason: MqttReadonlySessionTransitionReason;
    }
  ): void {
    this.syncControllerStatus(session, transition.snapshot);
    if (transition.reason !== 'expiry_check') this.recordLifecycle(session);
  }

  private syncControllerStatus(
    session: Session,
    snapshot: MqttReadonlySessionSnapshot
  ): void {
    session.status.connectionState = snapshot.connectionState;
    session.status.stateChangedAt = snapshot.stateChangedAt;
    session.status.lastMessageAt = snapshot.lastMessageAt;
    session.status.reconnectAttempts = snapshot.reconnectAttempts;
    session.status.invalidMessageCount = snapshot.invalidMessageCount;
    session.status.errorCode = snapshot.errorCode;
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
    event: Omit<import('./persistence-core')
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
