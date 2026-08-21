import 'server-only';

import {
  completeAcknowledgedFarmBotCommand,
  recordFarmBotCommandAcknowledgement,
} from '@/lib/services/threed/farmbot/command-repository';
import { recordAndCompleteFarmBotCommandAcknowledgement } from './command-completion-core';

export function persistFarmBotCommandAcknowledgement(input: {
  userId: string;
  commandId: string;
  rpcLabel: string;
  outcome: 'ok' | 'error';
  receivedAt: Date;
}) {
  return recordAndCompleteFarmBotCommandAcknowledgement(input, {
    recordAcknowledgement: recordFarmBotCommandAcknowledgement,
    completeAcknowledged: completeAcknowledgedFarmBotCommand,
  });
}
