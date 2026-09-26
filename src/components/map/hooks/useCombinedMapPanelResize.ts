'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

const MIN_PANEL_PERCENT = 20;
const MAX_PANEL_PERCENT = 80;

export function useCombinedMapPanelResize(initialPanelHeight = 50) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(initialPanelHeight);
  const [isDragging, setIsDragging] = useState(false);

  const beginResize = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      if (bounds.height <= 0) return;
      const percentage = ((event.clientY - bounds.top) / bounds.height) * 100;
      setPanelHeight(Math.min(Math.max(percentage, MIN_PANEL_PERCENT), MAX_PANEL_PERCENT));
    };
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return {
    containerRef,
    panelHeight,
    setPanelHeight,
    beginResize,
  };
}
