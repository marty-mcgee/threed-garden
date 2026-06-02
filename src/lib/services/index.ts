// src/lib/services/index.ts
// export { CaltransPoller } from './CaltransPoller';
// export { CHPPoller } from './CHPPoller-1';
// export { CHPCADPoller } from './CHPCADPoller-1';
// export { BayArea511Poller } from './BayArea511Poller1';
// // [MM] needed?..
// export { CCTVPoller } from './CCTVPoller';
// export { TravelTimesPoller } from './TravelTimesPoller';

import { musicPoller } from './music/MusicPoller';

// Initialize music poller
if (process.env.MUSIC_AUTO_SYNC_METADATA === 'true') {
  musicPoller.startPolling();
  console.log('Music poller started');
}

export { musicPoller };