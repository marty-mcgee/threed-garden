import { randomBytes } from 'node:crypto';
import {
  signMqttWorkerRequest,
} from '../../worker/auth';
import type {
  FarmBotMqttEventInput,
  FarmBotMqttIngestionBatch,
} from './persistence-core';
import type { FarmBotWorkerRuntimeStatus } from './session-registry';

const INGESTION_PATH = '/api/internal/threed-mqtt/farmbot/events';
const FLUSH_DELAY_MS = 250;
const MAX_PENDING_EVENTS_PER_FARMBOT = 1_000;
const REQUEST_TIMEOUT_MS = 10_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

export interface FarmBotWorkerPersistenceRecord {
  ownerId: string;
  farmbotId: number;
  brokerDeviceId: string;
  workerSessionId: string;
  runtime: FarmBotWorkerRuntimeStatus;
  event: FarmBotMqttEventInput | null;
}

export interface FarmBotWorkerPersistenceSink {
  record(record: FarmBotWorkerPersistenceRecord): void;
  flush(): Promise<void>;
}

export class DisabledFarmBotWorkerPersistenceSink implements FarmBotWorkerPersistenceSink {
  record(): void {}
  async flush(): Promise<void> {}
}

interface PendingBatch {
  latest: FarmBotWorkerPersistenceRecord;
  events: FarmBotMqttEventInput[];
}

function validateBaseUrl(value: string): URL {
  const url = new URL(value);
  const localHttp = url.protocol === 'http:'
    && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password
    || url.search || url.hash) {
    throw new Error('FarmBot App ingestion URL must use HTTPS');
  }
  url.pathname = '/';
  return url;
}

export class HttpFarmBotWorkerPersistenceSink implements FarmBotWorkerPersistenceSink {
  private readonly pending = new Map<number, PendingBatch>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> | null = null;
  private retryDelayMs = INITIAL_RETRY_DELAY_MS;
  private flushHadFailure = false;
  private readonly baseUrl: URL;

  constructor(baseUrl: string, private readonly encodedHmacKey: string) {
    this.baseUrl = validateBaseUrl(baseUrl);
  }

  record(record: FarmBotWorkerPersistenceRecord): void {
    const current = this.pending.get(record.farmbotId) ?? { latest: record, events: [] };
    current.latest = record;
    if (record.event) {
      current.events.push(record.event);
      if (current.events.length > MAX_PENDING_EVENTS_PER_FARMBOT) {
        current.events.splice(0, current.events.length - MAX_PENDING_EVENTS_PER_FARMBOT);
      }
    }
    this.pending.set(record.farmbotId, current);
    this.schedule(FLUSH_DELAY_MS);
  }

  async flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flushHadFailure = false;
    this.flushing = this.flushPending().finally(() => {
      this.flushing = null;
      if (this.pending.size > 0 && !this.timer) {
        const delay = this.flushHadFailure ? this.retryDelayMs : FLUSH_DELAY_MS;
        this.schedule(delay);
      }
      if (this.flushHadFailure) {
        this.retryDelayMs = Math.min(this.retryDelayMs * 2, MAX_RETRY_DELAY_MS);
      } else {
        this.retryDelayMs = INITIAL_RETRY_DELAY_MS;
      }
    });
    return this.flushing;
  }

  private async flushPending(): Promise<void> {
    const batches = [...this.pending.entries()];
    this.pending.clear();
    for (const [farmbotId, pending] of batches) {
      for (let offset = 0; offset < Math.max(1, pending.events.length); offset += 100) {
        const events = pending.events.slice(offset, offset + 100);
        try {
          await this.send({
            version: 1,
            farmbotId,
            ownerId: pending.latest.ownerId,
            brokerDeviceId: pending.latest.brokerDeviceId,
            workerSessionId: pending.latest.workerSessionId,
            runtime: {
              connectionState: pending.latest.runtime.connectionState,
              stateChangedAt: new Date(pending.latest.runtime.stateChangedAt),
              lastMessageAt: pending.latest.runtime.lastMessageAt
                ? new Date(pending.latest.runtime.lastMessageAt) : null,
              lastStatusAt: pending.latest.runtime.lastStatusAt
                ? new Date(pending.latest.runtime.lastStatusAt) : null,
              position: pending.latest.runtime.position,
              tokenExpiresAt: new Date(pending.latest.runtime.tokenExpiresAt),
              isStale: pending.latest.runtime.stale,
              reconnectAttempts: pending.latest.runtime.reconnectAttempts,
              invalidMessageCount: pending.latest.runtime.invalidMessageCount,
              errorCode: pending.latest.runtime.errorCode,
            },
            events,
          });
        } catch {
          this.flushHadFailure = true;
          const retry = this.pending.get(farmbotId) ?? { latest: pending.latest, events: [] };
          retry.events.unshift(...pending.events.slice(offset));
          if (retry.events.length > MAX_PENDING_EVENTS_PER_FARMBOT) {
            retry.events.length = MAX_PENDING_EVENTS_PER_FARMBOT;
          }
          this.pending.set(farmbotId, retry);
          break;
        }
      }
    }
  }

  private schedule(delayMs: number): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
  }

  private async send(batch: FarmBotMqttIngestionBatch): Promise<void> {
    const body = Buffer.from(JSON.stringify({
      ...batch,
      runtime: {
        ...batch.runtime,
        stateChangedAt: batch.runtime.stateChangedAt.toISOString(),
        lastMessageAt: batch.runtime.lastMessageAt?.toISOString() ?? null,
        lastStatusAt: batch.runtime.lastStatusAt?.toISOString() ?? null,
        tokenExpiresAt: batch.runtime.tokenExpiresAt.toISOString(),
      },
      events: batch.events.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString(),
        summary: undefined,
      })),
    }));
    const timestamp = String(Date.now());
    const nonce = randomBytes(18).toString('base64url');
    const auth = signMqttWorkerRequest({
      method: 'POST',
      path: INGESTION_PATH,
      timestamp,
      nonce,
      body,
    }, this.encodedHmacKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL(INGESTION_PATH, this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ThreeD-MQTT-Worker-Version': auth.version,
          'X-ThreeD-MQTT-Worker-Timestamp': auth.timestamp,
          'X-ThreeD-MQTT-Worker-Nonce': auth.nonce,
          'X-ThreeD-MQTT-Worker-Signature': auth.signature,
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('FarmBot MQTT persistence request failed');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createFarmBotWorkerPersistenceSink(
  environment: NodeJS.ProcessEnv = process.env
): FarmBotWorkerPersistenceSink {
  const baseUrl = environment.THREED_MQTT_APP_BASE_URL;
  const encodedHmacKey = environment.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!baseUrl && !encodedHmacKey) return new DisabledFarmBotWorkerPersistenceSink();
  if (!baseUrl || !encodedHmacKey) {
    throw new Error('FarmBot worker persistence requires both App URL and HMAC key');
  }
  return new HttpFarmBotWorkerPersistenceSink(baseUrl, encodedHmacKey);
}
