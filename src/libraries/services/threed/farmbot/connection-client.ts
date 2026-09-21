import 'server-only';

import {
  FARMBOT_CONNECTION_TIMEOUT_MS,
  FARMBOT_DEVICE_ENDPOINT,
  FarmBotConnectionUnavailableError,
  FarmBotCredentialRejectedError,
  readFarmBotConnectionSummary,
  type FarmBotConnectionSummary,
} from './connection-client-core';
import { readFarmBotJwtMetadata } from './token-client-core';

export async function testFarmBotConnection(token: string): Promise<FarmBotConnectionSummary> {
  let response: Response;
  try {
    response = await fetch(FARMBOT_DEVICE_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(FARMBOT_CONNECTION_TIMEOUT_MS),
    });
  } catch {
    throw new FarmBotConnectionUnavailableError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new FarmBotCredentialRejectedError();
  }
  if (!response.ok) {
    throw new FarmBotConnectionUnavailableError();
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new FarmBotConnectionUnavailableError();
  }

  return readFarmBotConnectionSummary(body, readFarmBotJwtMetadata(token));
}
