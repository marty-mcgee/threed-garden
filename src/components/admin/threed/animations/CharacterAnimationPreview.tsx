'use client';

import { Component, Suspense, useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, OrbitControls, useBounds } from '@react-three/drei';
import { GardenCharacter } from '@/components/threed/shared/GardenCharacter';
import type { AssignedAnimationClip } from '@/lib/utils/assignedCharacterAnimations';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { positiveId } from '@/lib/services/threed/animations/contracts';

type Character = ComponentProps<typeof GardenCharacter>['character'];
type Clip = AssignedAnimationClip & { name: string };
type Preview = { character: Character; target: 'model' | 'character' };
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">Preview could not render. Close and retry with WebGL enabled.</p> : this.props.children; }
}
type CameraTools = { preset: (front: boolean) => void; save: () => void; reset: () => void };
function PreviewCamera({ ready, characterId, target, tools, report }: {
  ready: boolean; characterId: number; target: 'model' | 'character'; tools: RefObject<CameraTools | null>; report: (message: string) => void;
}) {
  const bounds = useBounds();
  const { camera, invalidate } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    if (!ready || !controls.current) return;
    const orbit = controls.current;
    const key = `threed:${target}-preview-camera:v1:${characterId}`;
    bounds.refresh().clip();
    const { center, distance } = bounds.getSize();
    const apply = (position: number[], target: number[]) => {
      camera.position.fromArray(position);
      orbit.target.fromArray(target);
      camera.lookAt(orbit.target);
      orbit.update(); invalidate();
    };
    const preset = (front: boolean) => {
      const direction = front ? new Vector3(0, 0, 1) : new Vector3(1, 0.35, 1).normalize();
      apply(center.clone().addScaledVector(direction, distance).toArray(), center.toArray());
      report(front ? 'Front view · Save view to remember it.' : 'Three-quarter view · Save view to remember it.');
    };
    const save = () => {
      orbit.update();
      try {
        localStorage.setItem(key, JSON.stringify({ position: camera.position.toArray(), target: orbit.target.toArray(), quaternion: camera.quaternion.toArray() }));
        report(`View saved for this ${target === 'model' ? 'Model' : 'Character'} in this browser.`);
      } catch { report('This browser could not save the view.'); }
    };
    const reset = () => {
      try { localStorage.removeItem(key); } catch { report('Could not remove the saved view.'); return; }
      preset(true); report('Saved view cleared. Default is Front.');
    };
    tools.current = { preset, save, reset };
    preset(true);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const vector = (value: unknown): value is number[] => Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1e8);
      if (saved && vector(saved.position) && vector(saved.target) && new Vector3().fromArray(saved.position).distanceTo(new Vector3().fromArray(saved.target)) > 0.001) {
        apply(saved.position, saved.target); report('Saved camera view restored.');
      }
    } catch { /* Keep the front view if storage is unavailable or invalid. */ }
    return () => { tools.current = null; };
  }, [ready, characterId, target, bounds, camera, invalidate, tools, report]);
  return <OrbitControls ref={controls} makeDefault enableDamping={false} />;
}
export function CharacterAnimationPreview() {
  const cameraTools = useRef<CameraTools | null>(null);
  const [cameraNotice, setCameraNotice] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selection, setSelection] = useState<Clip | null | undefined>(null);
  const [request, setRequest] = useState<{ animationId: number | null }>({ animationId: null });
  const playingName = useRef('T-Pose');
  const [playbackStatus, setPlaybackStatus] = useState('Loading Model…');
  const [switching, setSwitching] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settled = useCallback((message: string | null) => { clearTimeout(deadline.current); setSwitching(false); if (message) setError(message); else { setError(''); setReady(true); setPlaybackStatus(playingName.current === 'T-Pose' ? 'T-Pose' : `Playing: ${playingName.current}`); } }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); setError('Preview timed out. Close and retry.'); }, 60000);
    deadline.current = timeout;
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const target = params.has('modelId') ? 'model' : 'character';
        const targetId = positiveId(params.get(`${target}Id`));

        const get = async (url: string) => {
          const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Preview data unavailable');
          return result.data;
        };
        const source = await get(`/api/threed/${target === 'model' ? 'models' : 'characters'}?id=${targetId}`);
        const character: Character = target === 'character' ? source : {
          id: source.id, characterId: `model-preview-${source.id}`, name: source.modelName,
          type: 'model', status: 'active', modelId: source.id, model: source,
          defaultAnimation: '', animationSpeed: 1, movementType: 'stationary',
          movementRadius: 0, movementSpeed: 0, patrolWaypoints: [], followTarget: '', followDistance: 0,
          teleportPositions: [], teleportInterval: 0, interactable: false, interactionMessage: '',
          defaultEmote: '', positionX: 0, positionY: 0, positionZ: 0, rotation: 0, scale: 1,
          visible: true, activeStartHour: null, activeEndHour: null,
        };
        if (!character.model?.filePath) throw new Error('No accessible primary Model file is available for preview.');
        if (!controller.signal.aborted) setPreview({ target, character: { ...character, positionX: 0, positionY: 0, positionZ: 0,
          rotation: 0, scale: 1, animationSpeed: 1, status: 'active', visible: true, movementType: 'stationary',
          movementSpeed: 0, movementRadius: 0, interactable: false, activeStartHour: null, activeEndHour: null } });
      } catch (cause) { clearTimeout(timeout); if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Preview failed'); }
    }
    void load();
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'threed-preview-animation') return;
      try { setRequest({ animationId: event.data.animationId === null ? null : positiveId(event.data.animationId) }); } catch { /* Ignore invalid messages. */ }
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'threed-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (!preview) return;
    const requestedId = request.animationId;
    if (requestedId === null) { playingName.current = 'T-Pose'; setSelection(null); setSwitching(false); setError(''); return; }
    const controller = new AbortController();
    setSwitching(true); setError(''); setSelection(undefined);
    const timeout = setTimeout(() => { controller.abort(); setSwitching(false); setError('Animation timed out. Choose another animation to retry.'); }, 60000);
    void (async () => {
      const response = await fetch(`/api/threed/animations?id=${requestedId}`, { signal: controller.signal, cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data.isActive || !result.data.filePath) throw new Error(result.error || 'Selected animation is unavailable.');
      if (!controller.signal.aborted) { playingName.current = result.data.name; setSelection(result.data); }
    })().catch(cause => {
      if (!controller.signal.aborted) { setSwitching(false); setError(cause instanceof Error ? cause.message : 'Animation unavailable'); }
    }).finally(() => clearTimeout(timeout));
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [request, preview]);
  // Removing the frame tears down the entire preview world, caches and renderer.
  return <div className="flex h-dvh flex-col gap-2 bg-background p-3 text-foreground">
    <p className="text-sm">{preview ? preview.character.name : 'Animation preview'}</p>
    <p role="status" className="text-xs text-green-500">{playbackStatus}</p>
    <p className="text-xs text-muted-foreground">Drag to orbit · Scroll to zoom · Preview does not save changes.</p>
    <div className="flex flex-wrap gap-1 text-xs">
      <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!ready} onClick={() => cameraTools.current?.preset(true)}>Front</button>
      <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!ready} onClick={() => cameraTools.current?.preset(false)}>Three-quarter</button>
      <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!ready} onClick={() => cameraTools.current?.save()}>Save view</button>
      <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={!ready} onClick={() => cameraTools.current?.reset()}>Reset view</button>
    </div>
    <p role="status" className="text-xs text-muted-foreground">{cameraNotice || 'Orbit and zoom, then Save view to remember your angle.'}</p>
    {error && <p role="alert" className="text-sm text-orange-500">{error}{ready ? ' The previous animation remains visible.' : ''}</p>}
    <>
      {switching && ready && <p role="status" className="text-xs">Loading animation…</p>}
      {!ready && <p role="status" className="text-sm">Loading Model and textures…</p>}
      <div className="relative min-h-0 flex-1">
        {preview && <PreviewBoundary><div className="h-full" style={{ visibility: ready ? 'visible' : 'hidden' }}>
          <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
            <ambientLight intensity={1.5} /><directionalLight position={[3, 6, 4]} intensity={2} />
            <Suspense fallback={null}><Bounds margin={1.3}>
              <GardenCharacter character={preview.character} previewMode previewSelection={selection} onPreviewState={settled} />
              <PreviewCamera ready={ready} characterId={preview.character.id} target={preview.target} tools={cameraTools} report={setCameraNotice} />
            </Bounds></Suspense>
          </Canvas>
        </div></PreviewBoundary>}
      </div>
    </>
  </div>;
}
