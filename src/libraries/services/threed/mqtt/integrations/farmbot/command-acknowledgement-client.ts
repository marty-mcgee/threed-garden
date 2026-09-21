import { randomBytes } from 'node:crypto';
import { signMqttWorkerRequest } from '../../worker/auth';
import type { FarmBotWorkerCommandAcknowledgement } from './command-execution-gate';
import { parseFarmBotCommandAcknowledgementReceipt } from './command-acknowledgement-response-core';

const ACKNOWLEDGEMENT_PATH = '/api/internal/threed-mqtt/farmbot/commands/acknowledgements';
const FLUSH_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 10_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

export interface FarmBotWorkerCommandAcknowledgementSink {
  record(acknowledgement: Readonly<FarmBotWorkerCommandAcknowledgement>): void;
  flush(): Promise<void>;
}

export class DisabledFarmBotWorkerCommandAcknowledgementSink
implements FarmBotWorkerCommandAcknowledgementSink {
  record(): void {}
  async flush(): Promise<void> {}
}

function appBaseUrl(value: string): URL {
  const url = new URL(value);
  const localHttp = url.protocol === 'http:'
    && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password
    || url.search || url.hash) {
    throw new Error('FarmBot App acknowledgement URL must use HTTPS');
  }
  url.pathname = '/';
  return url;
}

export class HttpFarmBotWorkerCommandAcknowledgementSink
implements FarmBotWorkerCommandAcknowledgementSink {
  private readonly pending = new Map<string, Readonly<FarmBotWorkerCommandAcknowledgement>>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> | null = null;
  private retryDelayMs = INITIAL_RETRY_DELAY_MS;
  private flushHadFailure = false;
  private readonly baseUrl: URL;

  constructor(baseUrl: string, private readonly encodedHmacKey: string) {
    this.baseUrl = appBaseUrl(baseUrl);
  }

  record(acknowledgement: Readonly<FarmBotWorkerCommandAcknowledgement>): void {
    this.pending.set(acknowledgement.commandId, acknowledgement);
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
    for (const acknowledgement of pending) {
      try {
        await this.send(acknowledgement);
      } catch {
        this.flushHadFailure = true;
        this.pending.set(acknowledgement.commandId, acknowledgement);
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

  private async send(
    acknowledgement: Readonly<FarmBotWorkerCommandAcknowledgement>
  ): Promise<void> {
    const body = Buffer.from(JSON.stringify({ version: 1, ...acknowledgement }));
    const auth = signMqttWorkerRequest({
      method: 'POST',
      path: ACKNOWLEDGEMENT_PATH,
      timestamp: String(Date.now()),
      nonce: randomBytes(18).toString('base64url'),
      body,
    }, this.encodedHmacKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL(ACKNOWLEDGEMENT_PATH, this.baseUrl), {
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
      if (!response.ok) throw new Error('FarmBot command acknowledgement request failed');
      parseFarmBotCommandAcknowledgementReceipt({
        response: await response.json() as unknown,
        acknowledgement,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createFarmBotWorkerCommandAcknowledgementSink(
  environment: NodeJS.ProcessEnv = process.env
): FarmBotWorkerCommandAcknowledgementSink {
  const baseUrl = environment.THREED_MQTT_APP_BASE_URL;
  const encodedHmacKey = environment.THREED_MQTT_WORKER_TO_APP_HMAC_KEY;
  if (!baseUrl && !encodedHmacKey) {
    return new DisabledFarmBotWorkerCommandAcknowledgementSink();
  }
  if (!baseUrl || !encodedHmacKey) {
    throw new Error('FarmBot command acknowledgement reporting requires App URL and HMAC key');
  }
  return new HttpFarmBotWorkerCommandAcknowledgementSink(baseUrl, encodedHmacKey);
}
