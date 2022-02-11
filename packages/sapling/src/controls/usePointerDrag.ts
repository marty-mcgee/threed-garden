import { useEffect, useState, useMemo } from 'react';
import { useLatest } from './useLatest';

export interface DragState {
  /** Whether a drag is in progress. */
  dragging: boolean;
  /** X-coordinate of the pointer relative to the element bounds. */
  x: number;
  /** Y-coordinate of the pointer relative to the element bounds. */
  y: number;
  /** X-coordinate of the pointer in client coordinates. */
  clientX: number;
  /** Y-coordinate of the pointer in client coordinates. */
  clientY: number;
  /** Client rect of element. */
  rect: DOMRect;
  /** Whether the pointer has dragged outside the bounds of the element. */
  inBounds: boolean;
  /** The target element that was clicked on to initiate the drag. */
  target: HTMLElement | undefined;
}

type DragMethod<T extends HTMLElement, R> = (
  dragState: DragState,
  e: React.PointerEvent<T>
) => R;

export interface DragMethods<T extends HTMLElement = HTMLElement> {
  onDragStart?: DragMethod<T, boolean | void>;
  onDragEnd?: DragMethod<T, void>;
  onDragMove?: DragMethod<T, void>;
  onDragEnter?: DragMethod<T, void>;
  onDragLeave?: DragMethod<T, void>;
}

export interface PointerEventHandlers<T extends HTMLElement = HTMLElement> {
  onPointerDown(ev: React.PointerEvent<T>): void;
  onPointerUp?(ev: React.PointerEvent<T>): void;
  onPointerMove?(ev: React.PointerEvent<T>): void;
  onPointerEnter?(ev: React.PointerEvent<T>): void;
  onPointerLeave?(ev: React.PointerEvent<T>): void;
}

/** Hook that manages dragging on a control using pointer events.

    This is not 'drag and drop', but merely dragging within a single widget.
 */
export const usePointerDrag = <T extends HTMLElement = HTMLElement>(
  callbacks: DragMethods<T>
): PointerEventHandlers<T> => {
  const [target, setTarget] = useState<T>();
  const [pointerId, setPointerId] = useState(-1);
  const [dragState] = useState<DragState>({
    target: undefined,
    dragging: false,
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    rect: new DOMRect(),
    inBounds: false,
  });

  // Mutable reference to latest callbacks. We don't want the effects to re-run when
  // callbacks change, but we do want them to use the latest callbacks.
  const cbs = useLatest(callbacks);

  useEffect(() => {
    if (target && pointerId >= 0) {
      target.setPointerCapture(pointerId);
      return () => target.releasePointerCapture(pointerId);
    }
  }, [target, pointerId]);

  return useMemo(() => {
    const updateDragPosition = (e: React.PointerEvent<T>) => {
      dragState.dragging = true;
      dragState.target = e.target as HTMLElement;
      dragState.rect = e.currentTarget.getBoundingClientRect();
      dragState.clientX = e.clientX;
      dragState.clientX = e.clientY;
      dragState.x = e.clientX - dragState.rect.left;
      dragState.y = e.clientY - dragState.rect.top;
    };

    const onPointerUp = (e: React.PointerEvent<T>) => {
      if (e.pointerId === pointerId) {
        setTarget(undefined);
        setPointerId(-1);
        dragState.dragging = false;
        cbs.current.onDragEnd && cbs.current.onDragEnd(dragState, e);
      }
    };

    const onPointerEnter = (e: React.PointerEvent<T>) => {
      if (e.pointerId === pointerId) {
        dragState.inBounds = true;
        updateDragPosition(e);
        cbs.current.onDragEnter && cbs.current.onDragEnter(dragState, e);
      }
    };

    const onPointerLeave = (e: React.PointerEvent<T>) => {
      if (e.pointerId === pointerId) {
        dragState.inBounds = false;
        updateDragPosition(e);
        cbs.current.onDragLeave && cbs.current.onDragLeave(dragState, e);
      }
    };

    const onPointerMove = (e: React.PointerEvent<T>) => {
      if (e.pointerId === pointerId) {
        updateDragPosition(e);
        cbs.current.onDragMove && cbs.current.onDragMove(dragState, e);
      }
    };

    const onPointerDown = (e: React.PointerEvent<T>) => {
      e.stopPropagation();
      updateDragPosition(e);
      dragState.inBounds = true;
      // Cancel the drag if onDragStart explicitly returns false (not falsey)
      if (cbs.current.onDragStart && cbs.current.onDragStart(dragState, e) === false) {
        return;
      }
      setPointerId(e.pointerId);
      setTarget(e.currentTarget);
    };

    if (target) {
      return {
        onPointerDown,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerUp,
      };
    } else {
      return {
        onPointerDown,
      };
    }
  }, [target, dragState, pointerId, cbs]);
};
