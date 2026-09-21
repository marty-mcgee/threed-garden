// Client-only intent/status bridge. No action-completion event or persistence is emitted.
export const NAVIGATION_REQUEST = 'threed-character-navigation-request';
export const NAVIGATION_STATUS = 'threed-character-navigation-status';
export type NavigationRequest = {
  actorMarkerId: string;
  requestId: string;
  targetMarkerId: string;
  command: 'walk' | 'stop' | 'teleport';
};
