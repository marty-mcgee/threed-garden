'use client';

import { useCallback, useState } from 'react';
import {
  transitionThreeDLibraryWorkspace,
  type ThreeDLibraryWorkspace,
} from '@/lib/services/threed/markers/library-workspace-core';

export function useThreeDLibraryWorkspace() {
  const [activeLibrary, setActiveLibrary] = useState<ThreeDLibraryWorkspace | null>(null);

  const setLibraryOpen = useCallback((library: ThreeDLibraryWorkspace, open: boolean) => {
    setActiveLibrary((current) => transitionThreeDLibraryWorkspace(current, library, open));
  }, []);

  const setIsModelLibraryOpen = useCallback((open: boolean) => {
    setLibraryOpen('models', open);
  }, [setLibraryOpen]);

  const setIsCharacterLibraryOpen = useCallback((open: boolean) => {
    setLibraryOpen('characters', open);
  }, [setLibraryOpen]);

  const setIsFarmBotLibraryOpen = useCallback((open: boolean) => {
    setLibraryOpen('farmbots', open);
  }, [setLibraryOpen]);

  return {
    activeLibrary,
    isModelLibraryOpen: activeLibrary === 'models',
    isCharacterLibraryOpen: activeLibrary === 'characters',
    isFarmBotLibraryOpen: activeLibrary === 'farmbots',
    setIsModelLibraryOpen,
    setIsCharacterLibraryOpen,
    setIsFarmBotLibraryOpen,
  };
}
