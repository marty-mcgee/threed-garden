import 'server-only';

import {
  FARMBOT_TOKEN_ENDPOINT,
  FARMBOT_TOKEN_TIMEOUT_MS,
  FarmBotLoginRejectedError,
  FarmBotTokenServiceUnavailableError,
  readFarmBotEncodedToken,
} from './token-client-core';
import { FarmBotCredentialRejectedError } from './connection-client-core';

export async function requestFarmBotToken(email: string, password: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(FARMBOT_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: { email, password } }),
      cache: 'no-store',
      signal: AbortSignal.timeout(FARMBOT_TOKEN_TIMEOUT_MS),
    });
  } catch {
    throw new FarmBotTokenServiceUnavailableError();
  }

  if (response.status === 401 || response.status === 403 || response.status === 422) {
    throw new FarmBotLoginRejectedError();
  }
  if (!response.ok) {
    throw new FarmBotTokenServiceUnavailableError();
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new FarmBotTokenServiceUnavailableError();
  }

  return readFarmBotEncodedToken(body);
}

export async function refreshFarmBotToken(token: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(FARMBOT_TOKEN_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(FARMBOT_TOKEN_TIMEOUT_MS),
    });
  } catch {
    throw new FarmBotTokenServiceUnavailableError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new FarmBotCredentialRejectedError();
  }
  if (!response.ok) {
    throw new FarmBotTokenServiceUnavailableError();
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new FarmBotTokenServiceUnavailableError();
  }

  return readFarmBotEncodedToken(body);
}
