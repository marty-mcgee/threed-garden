'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Grip, MoveDiagonal2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectMediaViewerState } from '@/libraries/services/threed/markers/project-view-state-core';

type Frame = Omit<ProjectMediaViewerState, 'zoom'>;
type Gesture = 'move' | 'resize';
type ClientPoint = { clientX: number; clientY: number };
type Props = {
  src: string;
  name: string;
  kind: 'image' | 'video';
  presented: boolean;
  initialView?: ProjectMediaViewerState;
  onRegisterView?: (capture: (() => ProjectMediaViewerState) | null) => void;
  onClose: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const zoomStep = 25;
const minZoom = 25;
const maxZoom = 400;
const dragPixelsPerStep = 24;

export function ProjectMediaViewer({ src, name, kind, presented, initialView, onRegisterView, onClose }: Props) {
  const titleId = useId();
  const area = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; frame: Frame } | null>(null);
  const [frame, setFrame] = useState<Frame>({
    left: initialView?.left ?? 300,
    top: initialView?.top ?? 88,
    width: initialView?.width ?? 640,
    height: initialView?.height ?? 420,
  });
  const currentFrame = useRef(frame);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(kind === 'image' ? initialView?.zoom ?? 100 : 100);
  const currentZoom = useRef(zoom);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const imageViewport = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const zoomAnchor = useRef<{ imageX: number; imageY: number; point: ClientPoint } | null>(null);
  const middleDrag = useRef<{ id: number; lastY: number; origin: ClientPoint } | null>(null);

  useLayoutEffect(() => {
    currentFrame.current = frame;
  }, [frame]);

  useEffect(() => {
    if (!onRegisterView) return;
    onRegisterView(() => ({
      ...currentFrame.current,
      zoom: currentZoom.current,
    }));
    return () => onRegisterView(null);
  }, [onRegisterView]);

  const changeZoom = useCallback((percent: number, point?: ClientPoint) => {
    const next = clamp(percent, minZoom, maxZoom);
    if (next === currentZoom.current) return;
    const viewport = imageViewport.current;
    const bounds = photo.current?.getBoundingClientRect();
    if (viewport && bounds?.width && bounds.height) {
      const view = viewport.getBoundingClientRect();
      const target = point ?? {
        clientX: view.left + viewport.clientWidth / 2,
        clientY: view.top + viewport.clientHeight / 2,
      };
      zoomAnchor.current = {
        imageX: clamp((target.clientX - bounds.left) / bounds.width, 0, 1),
        imageY: clamp((target.clientY - bounds.top) / bounds.height, 0, 1),
        point: target,
      };
    }
    currentZoom.current = next;
    setZoom(next);
  }, []);

  useLayoutEffect(() => {
    const viewport = imageViewport.current;
    const anchor = zoomAnchor.current;
    const bounds = photo.current?.getBoundingClientRect();
    if (viewport && anchor && bounds) {
      viewport.scrollLeft += bounds.left + anchor.imageX * bounds.width - anchor.point.clientX;
      viewport.scrollTop += bounds.top + anchor.imageY * bounds.height - anchor.point.clientY;
    }
    zoomAnchor.current = null;
  }, [zoom]);

  useEffect(() => {
    const viewport = imageViewport.current;
    if (!viewport || kind !== 'image' || failed) return;
    let distance = 0;
    function wheel(event: WheelEvent) {
      if (event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      event.stopPropagation();
      if (Math.sign(distance) !== Math.sign(event.deltaY)) distance = 0;
      // Accumulate fine trackpad deltas, while a wheel notch advances one zoom step.
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 40 : 1;
      distance += event.deltaY * units;
      if (Math.abs(distance) < 40) return;
      changeZoom(currentZoom.current - Math.sign(distance) * zoomStep, event);
      distance = 0;
    }
    viewport.addEventListener('wheel', wheel, { passive: false });
    return () => viewport.removeEventListener('wheel', wheel);
  }, [changeZoom, failed, kind]);

  function startMiddleZoom(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    middleDrag.current = {
      id: event.pointerId,
      lastY: event.clientY,
      origin: {
        clientX: event.clientX,
        clientY: event.clientY,
      },
    };
  }

  function endMiddleZoom(event: PointerEvent<HTMLDivElement>) {
    if (middleDrag.current?.id !== event.pointerId) return;
    middleDrag.current = null;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveMiddleZoom(event: PointerEvent<HTMLDivElement>) {
    const drag = middleDrag.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!(event.buttons & 4)) return endMiddleZoom(event);
    event.preventDefault();
    event.stopPropagation();
    const steps = Math.trunc((drag.lastY - event.clientY) / dragPixelsPerStep);
    if (!steps) return;
    drag.lastY -= steps * dragPixelsPerStep;
    changeZoom(currentZoom.current + steps * zoomStep, drag.origin);
  }

  useLayoutEffect(() => {
    const viewport = area.current;
    if (!presented || !viewport) return;
    const previous = document.activeElement;
    close.current?.focus({ preventScroll: true });
    const fit = () => setFrame(current => {
      if (!viewport.clientWidth || !viewport.clientHeight) return current;
      const width = clamp(current.width, 224, viewport.clientWidth);
      const height = clamp(current.height, 144, viewport.clientHeight);
      return {
        width,
        height,
        left: clamp(current.left, 0, viewport.clientWidth - width),
        top: clamp(current.top, 0, viewport.clientHeight - height),
      };
    });
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      if (previous instanceof HTMLElement && previous.isConnected && viewport.contains(document.activeElement)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [presented]);

  function adjust(action: Gesture, start: Frame, dx: number, dy: number) {
    const viewport = area.current;
    if (!viewport) return;
    if (action === 'resize') {
      setFrame({
        ...start,
        width: clamp(start.width + dx, 224, viewport.clientWidth - start.left),
        height: clamp(start.height + dy, 144, viewport.clientHeight - start.top),
      });
    } else {
      setFrame({
        ...start,
        left: clamp(start.left + dx, 0, viewport.clientWidth - start.width),
        top: clamp(start.top + dy, 0, viewport.clientHeight - start.height),
      });
    }
  }

  function handle(action: Gesture) {
    return {
      onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (event.button !== 0 || !event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, frame };
      },
      onPointerMove(event: PointerEvent<HTMLButtonElement>) {
        const start = drag.current;
        if (start?.pointer === event.pointerId) adjust(action, start.frame, event.clientX - start.x, event.clientY - start.y);
      },
      onLostPointerCapture() { drag.current = null; },
      onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        const step = event.shiftKey ? 40 : 10;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        if (!dx && !dy) return;
        event.preventDefault();
        event.stopPropagation();
        adjust(action, frame, dx, dy);
      },
    };
  }

  return createPortal(
    <div ref={area} hidden={!presented} inert={!presented} className="pointer-events-none fixed inset-2 z-[60]">
      <section role="dialog" aria-labelledby={titleId} style={frame}
        className="threed-workspace-panel threed-scene-panel-surface pointer-events-auto absolute flex max-h-full max-w-full flex-col overflow-hidden rounded-lg border shadow-xl"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            onClose();
          }
        }}>
        <header className="flex shrink-0 items-center gap-1 border-b px-2">
          <button type="button" {...handle('move')} aria-label="Move Media viewer" title="Drag or use the arrow keys to move"
            className="flex min-w-0 flex-1 cursor-grab touch-none select-none items-center gap-2 py-2 text-left active:cursor-grabbing">
            <Grip aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span id={titleId} className="truncate text-sm font-semibold">{name}</span>
          </button>
          <Button ref={close} type="button" size="icon" variant="ghost" className="size-8" aria-label="Close Media viewer" onClick={onClose}>
            <X aria-hidden="true" className="size-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-black [container-type:size]">
          {failed ? <p role="status" className="px-3 text-center text-sm text-white">This file could not be displayed.</p> : kind === 'video'
            ? <video src={src} controls playsInline preload="metadata" aria-label={name} className="h-full w-full object-contain" onError={() => setFailed(true)} />
            : <div ref={imageViewport} role="region" aria-label="Photo viewport" tabIndex={0}
                className="size-full overflow-auto overscroll-contain"
                title="Roll the wheel or hold the middle mouse button and drag up or down to zoom"
                onPointerDown={startMiddleZoom} onPointerMove={moveMiddleZoom} onPointerUp={endMiddleZoom}
                onPointerCancel={endMiddleZoom} onLostPointerCapture={endMiddleZoom}
                onAuxClick={event => {
                  if (event.button === 1) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}>
                <div className="flex h-max min-h-full w-max min-w-full items-center justify-center">
                  <img ref={photo} src={src} alt={name} draggable={false} className="block h-auto max-w-none"
                    style={{ width: imageRatio ? `min(${zoom}cqw, ${zoom * imageRatio}cqh)` : `${zoom}cqw` }}
                    onLoad={({ currentTarget }) => {
                      if (currentTarget.naturalHeight > 0) setImageRatio(currentTarget.naturalWidth / currentTarget.naturalHeight);
                    }}
                    onError={() => setFailed(true)} />
                </div>
              </div>}
        </div>
        <footer className="flex shrink-0 items-center justify-end">
          {kind === 'image' && !failed && <div role="group" aria-label="Photo zoom" className="mr-auto flex items-center gap-1 px-1">
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Zoom out" title="Zoom out"
              disabled={zoom === minZoom} onClick={() => changeZoom(zoom - zoomStep)}>
              <ZoomOut aria-hidden="true" className="size-4" />
            </Button>
            <output aria-label="Photo zoom level" className="min-w-9 text-center text-xs tabular-nums">{zoom}%</output>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Zoom in" title="Zoom in"
              disabled={zoom === maxZoom} onClick={() => changeZoom(zoom + zoomStep)}>
              <ZoomIn aria-hidden="true" className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" aria-label="Fit image" title="Fit image to viewer"
              disabled={zoom === 100} onClick={() => changeZoom(100)}>Fit</Button>
          </div>}
          <button type="button" {...handle('resize')} aria-label="Resize Media viewer" title="Drag or use the arrow keys to resize"
            className="flex h-7 w-8 cursor-nwse-resize touch-none select-none items-center justify-center">
            <MoveDiagonal2 aria-hidden="true" className="size-4" />
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
