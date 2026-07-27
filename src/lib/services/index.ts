// src/lib/services/index.ts

export { TrafficService } from './traffic/TrafficService';

export { CaltransPoller } from './traffic/CaltransPoller';
export { CHPPoller } from './traffic/CHPPoller';
export { CHPCADPoller } from './traffic/CHPCADPoller';
export { BayArea511Poller } from './traffic/BayArea511Poller';

// [MM] needed?..
export { CaltransCCTVPoller } from './traffic/CaltransCCTVPoller';
export { TravelTimesPoller } from './traffic/TravelTimesPoller';




// POTENTIAL MUSIC POLLER, IF NEEDED

import { musicPoller } from './music/MusicPoller';

// Initialize music poller
if (process.env.MUSIC_AUTO_SYNC_METADATA === 'true') {
  musicPoller.startPolling();
  console.log('Music poller started');
}

export { musicPoller };