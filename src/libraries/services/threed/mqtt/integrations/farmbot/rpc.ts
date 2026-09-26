export interface FarmBotWorkerRpcResponse {
  eventType: 'rpc_ok' | 'rpc_error';
  outcome: 'accepted' | 'rejected';
  rpcLabel: string;
  errorCode: string | null;
}

export class FarmBotWorkerRpcError extends Error {
  constructor() {
    super('invalid_rpc_response');
    this.name = 'FarmBotWorkerRpcError';
  }
}

export function parseFarmBotWorkerRpcResponse(payload: Uint8Array): FarmBotWorkerRpcResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload).toString('utf8')) as unknown;
  } catch {
    throw new FarmBotWorkerRpcError();
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new FarmBotWorkerRpcError();
  }
  const input = parsed as Record<string, unknown>;
  if (input.kind !== 'rpc_ok' && input.kind !== 'rpc_error') {
    throw new FarmBotWorkerRpcError();
  }
  if (typeof input.args !== 'object' || input.args === null || Array.isArray(input.args)) {
    throw new FarmBotWorkerRpcError();
  }
  const label = (input.args as Record<string, unknown>).label;
  if (typeof label !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(label)) {
    throw new FarmBotWorkerRpcError();
  }
  return {
    eventType: input.kind,
    outcome: input.kind === 'rpc_ok' ? 'accepted' : 'rejected',
    rpcLabel: label,
    errorCode: input.kind === 'rpc_error' ? 'rpc_error' : null,
  };
}
