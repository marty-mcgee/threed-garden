'use client';

import { useRef, useState } from 'react';

/** Saved Combined sizing; pointer/keyboard interaction belongs to ScenePanelDivider. */
export function useCombinedMapPanelResize(initialPanelHeight = 50) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(initialPanelHeight);
  return { containerRef, panelHeight, setPanelHeight };
}
