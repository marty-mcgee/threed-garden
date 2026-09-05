export type ThreeDLibraryWorkspace = 'models' | 'characters' | 'farmbots';

export function transitionThreeDLibraryWorkspace(
  current: ThreeDLibraryWorkspace | null,
  library: ThreeDLibraryWorkspace,
  open: boolean,
): ThreeDLibraryWorkspace | null {
  if (open) return library;
  return current === library ? null : current;
}
