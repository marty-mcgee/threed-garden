const REQUEST_FIELDS = new Set(['version', 'limit']);
const RESPONSE_FIELDS = new Set(['success', 'data']);
const DATA_FIELDS = new Set(['examined', 'reconciled', 'skipped']);

export const MAX_FARMBOT_TIMEOUT_RECONCILIATION_REQUEST_BYTES = 256;

export class FarmBotTimeoutReconciliationRequestError extends Error {
  constructor() {
    super('invalid_farmbot_timeout_reconciliation_request');
    this.name = 'FarmBotTimeoutReconciliationRequestError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, fields: Set<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

export function parseFarmBotTimeoutReconciliationRequest(payload: unknown) {
  if (!isRecord(payload) || !exact(payload, REQUEST_FIELDS) || payload.version !== 1
    || !Number.isSafeInteger(payload.limit) || Number(payload.limit) < 1
    || Number(payload.limit) > 100) {
    throw new FarmBotTimeoutReconciliationRequestError();
  }
  return Object.freeze({ version: 1 as const, limit: Number(payload.limit) });
}

export function parseFarmBotTimeoutReconciliationResponse(payload: unknown) {
  if (!isRecord(payload) || !exact(payload, RESPONSE_FIELDS) || payload.success !== true
    || !isRecord(payload.data) || !exact(payload.data, DATA_FIELDS)) {
    throw new FarmBotTimeoutReconciliationRequestError();
  }
  const data = payload.data;
  if (!Number.isSafeInteger(data.examined) || Number(data.examined) < 0
    || !Number.isSafeInteger(data.reconciled) || Number(data.reconciled) < 0
    || !Number.isSafeInteger(data.skipped) || Number(data.skipped) < 0
    || Number(data.reconciled) + Number(data.skipped) !== Number(data.examined)
    || Number(data.examined) > 100) {
    throw new FarmBotTimeoutReconciliationRequestError();
  }
  return Object.freeze({
    examined: Number(data.examined),
    reconciled: Number(data.reconciled),
    skipped: Number(data.skipped),
  });
}
