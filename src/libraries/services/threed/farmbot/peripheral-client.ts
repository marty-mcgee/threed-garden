import 'server-only';

import {
  FARMBOT_CONNECTION_TIMEOUT_MS,
  FarmBotConnectionUnavailableError,
  FarmBotCredentialRejectedError,
} from './connection-client-core';
import {
  FARMBOT_PERIPHERALS_ENDPOINT,
  readFarmBotPeripheralInventory,
  type FarmBotPeripheralInventory,
} from './peripheral-client-core';

export async function listFarmBotPeripherals(token: string): Promise<FarmBotPeripheralInventory> {
  let response: Response;
  try {
    response = await fetch(FARMBOT_PERIPHERALS_ENDPOINT, {
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

  return readFarmBotPeripheralInventory(body);
}
