// src/lib/services/index.ts
export { CaltransPoller } from './traffic/CaltransPoller';
export { CHPPoller } from './traffic/CHPPoller';
export { CHPCADPoller } from './traffic/CHPCADPoller';
export { BayArea511Poller } from './traffic/BayArea511Poller';
// [MM] needed?..
export { CCTVPoller } from './traffic/CCTVPoller';
export { TravelTimesPoller } from './traffic/TravelTimesPoller';

import { musicPoller } from './music/MusicPoller';

// Initialize music poller
if (process.env.MUSIC_AUTO_SYNC_METADATA === 'true') {
  musicPoller.startPolling();
  console.log('Music poller started');
}

export { musicPoller };