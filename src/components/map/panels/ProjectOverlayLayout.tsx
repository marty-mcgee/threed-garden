'use client';

import { createContext, useContext, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import type { ProjectOverlayPositions } from '@/libraries/services/threed/markers/project-view-state-core';

export const ProjectOverlayLayoutContext = createContext<{
  positions: ProjectOverlayPositions;
  move: (id: keyof ProjectOverlayPositions, position: { x: number; y: number }) => void;
} | null>(null);

/** Positions are fractions of available travel, independent of screen resolution. */
export function useProjectOverlayPosition(id: keyof ProjectOverlayPositions) {
  const layout = useContext(ProjectOverlayLayoutContext);
  const ref = useRef<HTMLElement | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0, top: 40 });
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const position = layout?.positions[id];
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const parent = element.offsetParent;
      if (!(parent instanceof HTMLElement)) return;
      const box = parent.getBoundingClientRect();
      const width = Math.max(0, Math.min(parent.clientWidth, window.innerWidth - box.left) - element.offsetWidth);
      const height = Math.max(0, Math.min(parent.clientHeight, window.innerHeight - box.top) - element.offsetHeight - 8);
      // Scene and Dashboard panels have different containing blocks. Reserve
      // only the toolbar's actual overlap, rather than adding another fixed gap.
      const toolbar = document.querySelector('.threed-project-toolbar');
      const top = Math.min(height, Math.max(0, (toolbar?.getBoundingClientRect().bottom ?? box.top) - box.top));
      setBounds(current => current.width === width && current.height === height && current.top === top ? current : { width, height, top });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.offsetParent instanceof HTMLElement) observer.observe(element.offsetParent);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  });
  const move = (left: number, top: number) => layout?.move(id, {
    x: bounds.width ? Math.max(0, Math.min(1, left / bounds.width)) : 0,
    y: bounds.height > bounds.top ? Math.max(0, Math.min(1, (top - bounds.top) / (bounds.height - bounds.top))) : 0,
  });
  const origin = () => {
    const element = ref.current;
    const parent = element?.offsetParent;
    if (!element || !(parent instanceof HTMLElement)) return null;
    const box = element.getBoundingClientRect(), parentBox = parent.getBoundingClientRect();
    return { left: box.left - parentBox.left, top: box.top - parentBox.top };
  };
  return {
    ref,
    // Tailwind 4 centering uses the independent translate property; clearing
    // transform alone still leaves the panel shifted by half its own width.
    style: position ? { left: position.x * bounds.width, top: bounds.top + position.y * (bounds.height - bounds.top), transform: 'none', translate: 'none' } : undefined,
    handle: {
      role: 'button' as const, tabIndex: 0, 'aria-label': `Move ${id === 'tour' ? 'Project Tour' : id} panel`,
      title: 'Drag to move. Arrow keys move the panel. Save Project to keep its position.',
      className: 'cursor-grab touch-none select-none active:cursor-grabbing',
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!layout || event.button !== 0 || (event.target as HTMLElement).closest('a,button,input,select,textarea,summary,[data-overlay-control]')) return;
        const start = origin(); if (!start) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, ...start };
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        const start = drag.current; if (!start || start.pointer !== event.pointerId) return;
        event.stopPropagation(); move(start.left + event.clientX - start.x, start.top + event.clientY - start.y);
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); },
      onPointerCancel: () => { drag.current = null; },
      onLostPointerCapture: () => { drag.current = null; },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        const start = origin(); if (!start) return;
        event.preventDefault(); event.stopPropagation();
        move(start.left + (event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0), start.top + (event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0));
      },
    },
  };
}
