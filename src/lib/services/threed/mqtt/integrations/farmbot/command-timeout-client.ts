import { randomBytes } from 'node:crypto';
import { signMqttWorkerRequest } from '../../worker/auth';
import type { FarmBotWorkerCommandTimeoutReport } from './command-timeout-report-core';
import { parseFarmBotCommandTimeoutReceipt } from './command-timeout-response-core';

const TIMEOUT_PATH = '/api/internal/threed-mqtt/farmbot/commands/timeouts';
const FLUSH_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 10_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

export interface FarmBotWorkerCommandTimeoutSink {
  record(report: Readonly<FarmBotWorkerCommandTimeoutReport>): void;
  flush(): Promise<void>;
}

export class DisabledFarmBotWorkerCommandTimeoutSink implements FarmBotWorkerCommandTimeoutSink {
  record(): void {}
  async flush(): Promise<void> {}
}

function appBaseUrl(value: string): URL {
  const url = new URL(value);
  const localHttp = url.protocol === 'http:'
    && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password
    || url.search || url.hash) {
    throw new Error('FarmBot App timeout URL must use HTTPS');
  }
  url.pathname = '/';
  return url;
}

export class HttpFarmBotWorkerCommandTimeoutSink implements FarmBotWorkerCommandTimeoutSink {
  private readonly pending = new Map<string, Readonly<FarmBotWorkerCommandTimeoutReport>>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> | null = null;
  private retryDelayMs = INITIAL_RETRY_DELAY_MS;
  private flushHadFailure = false;
  private readonly baseUrl: URL;

  constructor(baseUrl: string, private readonly encodedHmacKey: string) {
    this.baseUrl = appBaseUrl(baseUrl);
  }

  record(report: Readonly<FarmBotWorkerCommandTimeoutReport>): void {
    this.pending.set(report.commandId, report);
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
        this.schedule(this.flushHadFailure ? this.retryDelayMs : FLUSH_DELAY_MS);
      }
      this.retryDelayMs = this.flushHadFailure
        ? Math.min(this.retryDelayMs * 2, MAX_RETRY_DELAY_MS)
        : INITIAL_RETRY_DELAY_MS;
    });
    return this.flushing;
  }

  private async flushPending(): Promise<void> {
    const pending = [...this.pending.values()];
    this.pending.clear();
    for (const report of pending) {
      try {
        await this.send(report);
      } catch {
        this.flushHadFailure = true;
        this.pending.set(report.commandId, report);
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

  private async send(report: Readonly<FarmBotWorkerCommandTimeoutReport>): Promise<void> {
    const body = Buffer.from(JSON.stringify({
      ...report,
      acceptedAt: report.acceptedAt.toISOString(),
      timedOutAt: report.timedOutAt.toISOString(),
    }));
    const auth = signMqttWorkerRequest({
      method: 'POST',
      path: TIMEOUT_PATH,
      timestamp: String(Date.now()),
      nonce: randomBytes(18).toString('base64url'),
      body,
    }, this.encodedHmacKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL(TIMEOUT_PATH, this.baseUrl), {
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
      if (!response.ok) throw new Error('FarmBot command timeout request failed');
      parseFarmBotCommandTimeoutReceipt({ response: await response.json(), report });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createFarmBotWorkerCommandTimeoutSink(
  environment: NodeJS.ProcessEnv = process.env
): FarmBotWorkerCommandTimeoutSink {
  const baseUrl = environment.THREED_MQTT_APP_BASE_URL;
  const encodedHmacKey = environment.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!baseUrl && !encodedHmacKey) return new DisabledFarmBotWorkerCommandTimeoutSink();
  if (!baseUrl || !encodedHmacKey) {
    throw new Error('FarmBot timeout reporting requires App URL and HMAC key');
  }
  return new HttpFarmBotWorkerCommandTimeoutSink(baseUrl, encodedHmacKey);
}
