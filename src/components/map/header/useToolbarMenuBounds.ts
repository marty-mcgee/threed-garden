'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

/** Bound custom toolbar menus without changing their action or focus owners. */
export function useToolbarMenuBounds(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>();

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!open || !menu) return;
    const trigger = menu.parentElement;
    if (!trigger) return;
    const measure = () => {
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 8;
      const right = left + (viewport?.width ?? window.innerWidth) - 16;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 8;
      const anchor = trigger.getBoundingClientRect();
      const toolbar = trigger.closest('.threed-project-toolbar')?.getBoundingClientRect();
      const top = Math.min(bottom - 44, Math.max((viewport?.offsetTop ?? 0) + 8, toolbar?.bottom ?? anchor.bottom));
      setStyle({
        position: 'fixed',
        top,
        left: Math.max(left, Math.min(anchor.left, right - menu.offsetWidth)),
        right: 'auto',
        marginTop: 0,
        maxWidth: Math.max(0, right - left),
        maxHeight: Math.max(44, bottom - top),
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(trigger);
    const toolbar = trigger.closest('.threed-project-toolbar');
    if (toolbar) observer.observe(toolbar);
    window.addEventListener('resize', measure);
    viewportSubscribe(true);
    measure();
    function viewportSubscribe(add: boolean) {
      const viewport = window.visualViewport;
      if (add) {
        viewport?.addEventListener('resize', measure);
        viewport?.addEventListener('scroll', measure);
      } else {
        viewport?.removeEventListener('resize', measure);
        viewport?.removeEventListener('scroll', measure);
      }
    }
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      viewportSubscribe(false);
    };
  }, [open]);

  return { ref, style };
}
