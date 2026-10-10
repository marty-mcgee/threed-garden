'use client';

import { useRef, type RefObject } from 'react';

/** Bounded Scene split, shared by Design and Combined; never owns Canvas children. */
export function ScenePanelDivider({ containerRef, value, onChange, axis, label, hidden = false }: {
  containerRef: RefObject<HTMLDivElement | null>; value: number; onChange: (value: number) => void;
  axis: 'horizontal' | 'vertical'; label: string; hidden?: boolean;
}) {
  const pointer = useRef<number | null>(null);
  const change = (next: number) => onChange(Math.max(20, Math.min(80, next)));
  return <div hidden={hidden} role="separator" tabIndex={hidden ? -1 : 0} aria-label={label}
    aria-orientation={axis === 'horizontal' ? 'vertical' : 'horizontal'} aria-valuemin={20} aria-valuemax={80} aria-valuenow={Math.round(value)}
    className={`shrink-0 touch-none bg-border/50 hover:bg-cyan-500/50 focus-visible:bg-cyan-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${axis === 'horizontal' ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'}`}
    onDoubleClick={() => change(50)} onKeyDown={event => {
      const less = axis === 'horizontal' ? 'ArrowLeft' : 'ArrowUp', more = axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      if (![less, more, 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); change(event.key === 'Home' ? 20 : event.key === 'End' ? 80 : value + (event.key === less ? -1 : 1) * (event.shiftKey ? 10 : 2));
    }} onPointerDown={event => {
      if (event.button !== 0 || pointer.current !== null) return;
      event.preventDefault(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      if (pointer.current !== event.pointerId) return;
      const bounds = containerRef.current?.getBoundingClientRect(); if (!bounds) return;
      const size = axis === 'horizontal' ? bounds.width : bounds.height; if (size <= 0) return;
      change(100 * (axis === 'horizontal' ? event.clientX - bounds.left : event.clientY - bounds.top) / size);
    }} onPointerUp={event => { if (pointer.current !== event.pointerId) return; pointer.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => { pointer.current = null; }} onLostPointerCapture={() => { pointer.current = null; }} />;
}
