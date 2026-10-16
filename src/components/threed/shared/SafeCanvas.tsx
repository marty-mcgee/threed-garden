'use client';

import { Canvas, useThree, type CanvasProps } from '@react-three/fiber';
import { Component, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { isRecursionFailure, renderFailsafe } from './render-failsafe';

export function StoppedViewport() {
  return <div role="alert" className="flex h-full min-h-32 w-full items-center justify-center bg-background/95 p-4 text-foreground">
    <div className="max-w-md text-sm">
      <p className="font-semibold">3D rendering stopped for safety</p>
      <p className="mt-2">A rendering failure occurred. Save any available Project edits before reloading. Close other 3D tabs or previews first. Rendering will not restart automatically.</p>
    </div>
  </div>;
}

class RenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    console.error('[ThreeD rendering fail-safe]', error);
    renderFailsafe.trip('render-error');
  }
  render() { return this.state.failed ? <StoppedViewport /> : this.props.children; }
}

function RenderGuard() {
  const gl = useThree(state => state.gl);
  const setFrameloop = useThree(state => state.setFrameloop);
  useEffect(() => {
    const unregister = renderFailsafe.register(() => setFrameloop('never'));
    const lost = (event: Event) => {
      event.preventDefault();
      renderFailsafe.trip('webgl-context-lost');
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      unregister();
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, setFrameloop]);
  return null;
}

const serverSnapshot = () => null;

export function useRenderFailure() {
  return useSyncExternalStore(renderFailsafe.subscribe, renderFailsafe.getSnapshot, serverSnapshot);
}

/** Retains the caller's Canvas children, context and callbacks during normal use. */
export function SafeCanvas({ children, gl, ...props }: CanvasProps) {
  const failure = useRenderFailure();
  useEffect(() => {
    const error = (event: ErrorEvent) => {
      if (isRecursionFailure(event.error) || isRecursionFailure(event.message)) renderFailsafe.trip('recursion');
    };
    const rejection = (event: PromiseRejectionEvent) => {
      if (isRecursionFailure(event.reason)) renderFailsafe.trip('recursion');
    };
    window.addEventListener('error', error);
    window.addEventListener('unhandledrejection', rejection);
    return () => {
      window.removeEventListener('error', error);
      window.removeEventListener('unhandledrejection', rejection);
    };
  }, []);
  if (failure) return <StoppedViewport />;
  return <RenderBoundary><Canvas {...props} gl={gl}>
    <RenderGuard />
    {children}
  </Canvas></RenderBoundary>;
}
