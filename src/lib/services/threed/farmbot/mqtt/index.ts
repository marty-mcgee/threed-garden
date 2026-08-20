import { startFarmBotWorker } from './server';

void startFarmBotWorker().catch((error: unknown) => {
  console.error('FarmBot worker failed to start', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  process.exitCode = 1;
});
