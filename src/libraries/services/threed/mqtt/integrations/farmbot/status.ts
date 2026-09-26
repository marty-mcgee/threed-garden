export const MAX_FARMBOT_STATUS_PAYLOAD_BYTES = 256 * 1024;
const MAX_ABSOLUTE_COORDINATE = 1_000_000;

export interface FarmBotWorkerPosition {
  x: number;
  y: number;
  z: number;
}

export class FarmBotWorkerStatusError extends Error {
  constructor(readonly code: 'payload_too_large' | 'invalid_json' | 'invalid_status') {
    super(code);
    this.name = 'FarmBotWorkerStatusError';
  }
}

function coordinate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || Math.abs(value) > MAX_ABSOLUTE_COORDINATE) {
    throw new FarmBotWorkerStatusError('invalid_status');
  }
  return value;
}

export function parseFarmBotWorkerStatusPayload(
  payload: Uint8Array
): FarmBotWorkerPosition {
  if (payload.byteLength > MAX_FARMBOT_STATUS_PAYLOAD_BYTES) {
    throw new FarmBotWorkerStatusError('payload_too_large');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload).toString('utf8')) as unknown;
  } catch {
    throw new FarmBotWorkerStatusError('invalid_json');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new FarmBotWorkerStatusError('invalid_status');
  }
  const locationData = (parsed as Record<string, unknown>).location_data;
  if (typeof locationData !== 'object' || locationData === null
    || Array.isArray(locationData)) {
    throw new FarmBotWorkerStatusError('invalid_status');
  }
  const position = (locationData as Record<string, unknown>).position;
  if (typeof position !== 'object' || position === null || Array.isArray(position)) {
    throw new FarmBotWorkerStatusError('invalid_status');
  }
  const values = position as Record<string, unknown>;
  return {
    x: coordinate(values.x),
    y: coordinate(values.y),
    z: coordinate(values.z),
  };
}

export function farmBotWorkerTopics(brokerDeviceId: string): {
  status: string;
  fromDevice: string;
} {
  if (!/^device_[1-9]\d*$/.test(brokerDeviceId)) {
    throw new FarmBotWorkerStatusError('invalid_status');
  }
  return {
    status: `bot/${brokerDeviceId}/status`,
    fromDevice: `bot/${brokerDeviceId}/from_device`,
  };
}
