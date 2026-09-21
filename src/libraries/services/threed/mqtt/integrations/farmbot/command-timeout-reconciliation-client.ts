import { randomBytes } from 'node:crypto';
import { signMqttWorkerRequest } from '../../worker/auth';
import {
  parseFarmBotTimeoutReconciliationResponse,
} from './command-timeout-reconciliation-request-core';

const RECONCILIATION_PATH = '/api/internal/threed-mqtt/farmbot/commands/timeouts/reconcile';
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_LIMIT = 50;

function appBaseUrl(value: string): URL {
  const url = new URL(value);
  const localHttp = url.protocol === 'http:'
    && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password
    || url.search || url.hash) {
    throw new Error('FarmBot App reconciliation URL must use HTTPS');
  }
  url.pathname = '/';
  return url;
}

export interface FarmBotWorkerTimeoutReconciliationRunner {
  start(): void;
  shutdown(): Promise<void>;
}

export class DisabledFarmBotWorkerTimeoutReconciliationRunner
implements FarmBotWorkerTimeoutReconciliationRunner {
  start(): void {}
  async shutdown(): Promise<void> {}
}

export class HttpFarmBotWorkerTimeoutReconciliationRunner
implements FarmBotWorkerTimeoutReconciliationRunner {
  private interval: ReturnType<typeof setInterval> | null = null;
  private active: Promise<void> | null = null;
  private readonly baseUrl: URL;

  constructor(
    baseUrl: string,
    private readonly encodedHmacKey: string,
    private readonly limit = DEFAULT_LIMIT,
    private readonly intervalMs = DEFAULT_INTERVAL_MS
  ) {
    this.baseUrl = appBaseUrl(baseUrl);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100
      || !Number.isSafeInteger(intervalMs) || intervalMs < 1_000) {
      throw new Error('Invalid FarmBot timeout reconciliation settings');
    }
  }

  start(): void {
    if (this.interval) return;
    void this.run();
    this.interval = setInterval(() => void this.run(), this.intervalMs);
  }

  async shutdown(): Promise<void> {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    await this.active;
  }

  private async run(): Promise<void> {
    if (this.active) return this.active;
    this.active = this.request().catch(() => undefined).finally(() => {
      this.active = null;
    });
    return this.active;
  }

  private async request(): Promise<void> {
    const body = Buffer.from(JSON.stringify({ version: 1, limit: this.limit }));
    const auth = signMqttWorkerRequest({
      method: 'POST',
      path: RECONCILIATION_PATH,
      timestamp: String(Date.now()),
      nonce: randomBytes(18).toString('base64url'),
      body,
    }, this.encodedHmacKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL(RECONCILIATION_PATH, this.baseUrl), {
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
      if (!response.ok) throw new Error('FarmBot timeout reconciliation request failed');
      parseFarmBotTimeoutReconciliationResponse(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createFarmBotWorkerTimeoutReconciliationRunner(
  environment: NodeJS.ProcessEnv = process.env
): FarmBotWorkerTimeoutReconciliationRunner {
  const baseUrl = environment.THREED_MQTT_APP_BASE_URL;
  const encodedHmacKey = environment.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!baseUrl && !encodedHmacKey) {
    return new DisabledFarmBotWorkerTimeoutReconciliationRunner();
  }
  if (!baseUrl || !encodedHmacKey) {
    throw new Error('FarmBot timeout reconciliation requires App URL and HMAC key');
  }
  return new HttpFarmBotWorkerTimeoutReconciliationRunner(baseUrl, encodedHmacKey);
}
