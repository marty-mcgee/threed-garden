export type MqttReadonlySessionConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'expired'
  | 'error';

export interface MqttReadonlySessionTransition {
  connectionState: MqttReadonlySessionConnectionState;
  stateChangedAt: string;
  errorCode: string | null;
}

export interface MqttReadonlyReconnectPlan extends MqttReadonlySessionTransition {
  reconnectAttempts: number;
  reconnectDelayMs: number | null;
}

export function mqttReadonlySessionTransition(
  connectionState: MqttReadonlySessionConnectionState,
  errorCode: string | null,
  now: Date
): MqttReadonlySessionTransition {
  return {
    connectionState,
    stateChangedAt: now.toISOString(),
    errorCode,
  };
}

export function isMqttReadonlySessionExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt <= now;
}

export function planMqttReadonlyReconnect(input: {
  now: Date;
  expiresAt: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectBaseDelayMs: number;
  reconnectMaxDelayMs: number;
  disconnectCode: string;
}): MqttReadonlyReconnectPlan {
  const reconnectAttempts = input.reconnectAttempts + 1;
  if (isMqttReadonlySessionExpired(input.expiresAt, input.now)) {
    return {
      ...mqttReadonlySessionTransition('expired', 'token_expired', input.now),
      reconnectAttempts,
      reconnectDelayMs: null,
    };
  }
  if (reconnectAttempts >= input.maxReconnectAttempts) {
    return {
      ...mqttReadonlySessionTransition('error', 'reconnect_limit_reached', input.now),
      reconnectAttempts,
      reconnectDelayMs: null,
    };
  }
  return {
    ...mqttReadonlySessionTransition(
      'reconnecting',
      input.disconnectCode || 'transport_disconnected',
      input.now
    ),
    reconnectAttempts,
    reconnectDelayMs: Math.min(
      input.reconnectBaseDelayMs * (2 ** (reconnectAttempts - 1)),
      input.reconnectMaxDelayMs
    ),
  };
}
