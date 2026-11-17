// Temporary App-wide pause. Reopen deliberately after reviewing signup safeguards.
// Shared by the UI and every App-owned account creation boundary.
export const registrationEnabled: boolean = false;
export const registrationPausedMessage = 'New account registration is temporarily unavailable. Please check back later. Existing users can still sign in.';

export class RegistrationPaused extends Error {
  constructor() {
    super(registrationPausedMessage);
    this.name = 'RegistrationPaused';
  }
}

export function assertRegistrationEnabled() {
  if (!registrationEnabled) throw new RegistrationPaused();
}
