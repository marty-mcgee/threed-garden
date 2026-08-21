import 'server-only';

import { getOwnedFarmBotCommand } from '@/lib/services/threed/farmbot/command-repository';
import { recordDormantFarmBotWaterTimeout } from './command-timeout';
import { ingestFarmBotWorkerCommandTimeout } from './command-timeout-ingestion-core';
import type { FarmBotWorkerCommandTimeoutReport } from './command-timeout-report-core';

export function persistFarmBotWorkerCommandTimeout(
  report: Readonly<FarmBotWorkerCommandTimeoutReport>
) {
  return ingestFarmBotWorkerCommandTimeout(report, {
    loadCommand: ({ userId, commandId }) => getOwnedFarmBotCommand(userId, commandId),
    recordTimeoutAndRequireRecovery: recordDormantFarmBotWaterTimeout,
  });
}
