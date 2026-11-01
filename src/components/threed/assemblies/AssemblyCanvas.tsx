'use client';

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Bounds, Grid, OrbitControls, TransformControls, useBounds } from '@react-three/drei';
import { Box3, Box3Helper, Color, Group, MathUtils } from 'three';
import { Expand, Focus, Move3D, Rotate3D, Scaling } from 'lucide-react';
import { SafeCanvas } from '@/components/threed/shared/SafeCanvas';
import { ModelMarker3D, type ModelData } from '@/components/threed/markers/ModelMarker3D';
import { Button } from '@/components/ui/button';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { resolveActiveModelGeometry } from '@/libraries/services/threed/models/model-source-core';
import { type AssemblyTransform } from '@/libraries/services/threed/models/assembly-group-core';
import { assemblyDraftTransform, assemblyUniformScale, type AssemblyComponentDraft } from '@/libraries/services/threed/models/assembly-editor-core';

interface AssemblyCanvasProps {
  ownerId: string;
  components: AssemblyComponentDraft[];
  selectedId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onTransform: (id: string, transform: AssemblyTransform) => void;
  onManipulating: (active: boolean) => void;
}

type Asset = {
  model?: ModelData;
  error?: string;
};
type Mode = 'translate' | 'rotate' | 'scale';
type FrameRequest = {
  id: string | null;
  revision: number;
};
type RuntimeStatus = {
  state: 'loading' | 'ready' | 'error';
  error?: string;
};
const modes = [
  {
    mode: 'translate',
    label: 'Move',
    icon: Move3D,
  },
  {
    mode: 'rotate',
    label: 'Rotate',
    icon: Rotate3D,
  },
  {
    mode: 'scale',
    label: 'Scale',
    icon: Scaling,
  },
] as const;

/** One authorized read per source Model, shared by repeated component occurrences. */
function useAssemblyModels(ownerId: string, components: AssemblyComponentDraft[]) {
  const identity = [...new Set(components.map(component => component.modelId))].sort((a, b) => a - b).join(',');
  const cache = useRef({
    owner: ownerId,
    assets: new Map<number, Asset>(),
  });
  const [state, setState] = useState(cache.current);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const ids = identity ? identity.split(',').map(Number) : [];
    const prior = cache.current.owner === ownerId ? cache.current.assets : new Map<number, Asset>();
    const assets = new Map(ids.filter(id => prior.get(id)?.model).map(id => [id, prior.get(id)!]));
    const publish = () => {
      if (controller.signal.aborted) return;
      cache.current = {
        owner: ownerId,
        assets: new Map(assets),
      };
      setState(cache.current);
    };
    publish();
    const pending = ids.filter(id => !assets.has(id));
    async function worker() {
      while (pending.length && !controller.signal.aborted) {
        const id = pending.shift()!;
        const timeout = AbortSignal.timeout(20_000);
        try {
          const response = await fetch(`/api/threed/models?id=${id}`, {
            cache: 'no-store',
            signal: AbortSignal.any([controller.signal, timeout]),
          });
          const result = await response.json();
          if (!response.ok || !result.success || result.data?.id !== id || typeof result.data.modelName !== 'string' || typeof result.data.modelType !== 'string') throw new Error();
          // The existing endpoint authorizes owned Models/public Library reads and
          // serializes public resources. No identity-only selector row is rendered.
          assets.set(id, {
            model: {
              ...result.data,
              renderingAssetsResolved: true,
            },
          });
        } catch {
          assets.set(id, { error: `Model #${id} could not be loaded. Its component is retained.` });
        }
        publish();
      }
    }
    void Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
    return () => controller.abort();
  }, [ownerId, identity, retry]);
  return {
    assets: state.owner === ownerId ? state.assets : new Map<number, Asset>(),
    retry: (failedIds: number[]) => {
      // Retry only failed sources; keep other loaded assets and their resources mounted.
      for (const id of failedIds) cache.current.assets.delete(id);
      setRetry(value => value + 1);
    },
  };
}

function ComponentObject({ component, asset, selected, mode, disabled, register, report, onSelect, onTransform, onManipulating }: {
  component: AssemblyComponentDraft;
  asset?: Asset;
  selected: boolean;
  mode: Mode;
  disabled: boolean;
  register: (id: string, object: Group | null) => void;
  report: (id: string, status: RuntimeStatus) => void;
  onSelect: AssemblyCanvasProps['onSelect'];
  onTransform: AssemblyCanvasProps['onTransform'];
  onManipulating: AssemblyCanvasProps['onManipulating'];
}) {
  const [object, setObject] = useState<Group | null>(null);
  const dragScale = useRef(1);
  const dragging = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const model = useMemo(() => asset?.model ? resolveActiveModelGeometry(asset.model) : null, [asset?.model]);
  const transform = useMemo(() => {
    try { return assemblyDraftTransform(component); } catch { return null; }
  }, [component]);
  const attach = useCallback((value: Group | null) => {
    setObject(value);
    register(component.id, value);
  }, [register, component.id]);
  useLayoutEffect(() => {
    if (!object || !transform) return; // Retain the last valid pose while typing an incomplete field.
    const { position, rotation, scale } = transform;
    object.position.set(position.x, position.y, position.z);
    object.rotation.set(rotation.x, rotation.y, rotation.z, 'XYZ');
    object.scale.setScalar(scale);
    object.updateMatrixWorld(true);
  }, [object, transform]);
  useEffect(() => {
    if (!selected || disabled) {
      if (dragging.current) { dragging.current = false; onManipulating(false); }
    }
    return () => {
      if (dragging.current) { dragging.current = false; onManipulating(false); }
    };
  }, [selected, disabled, onManipulating]);
  useLayoutEffect(() => { setSettled(false); setLoadError(null); }, [model]);
  useEffect(() => {
    const error = asset?.error || loadError;
    report(component.id, {
      state: error ? 'error' : model && settled ? 'ready' : 'loading',
      error: error ? `${component.label || `Model #${component.modelId}`}: ${error}` : undefined,
    });
  }, [asset?.error, component.id, component.label, component.modelId, loadError, model, report, settled]);
  const ready = useCallback(() => setSettled(true), []);
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!disabled && event.delta < 4) onSelect(component.id);
  };
  const procedural = model?.modelType === 'procedural' && !model.filePath;
  const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return <>
    <group ref={attach} name={`assembly-component:${component.id}`} onClick={select} userData={{
      assemblyComponentId: component.id,
    }}>
      {model ? <group
        position={procedural ? [finite(model.offsetX), finite(model.offsetY), finite(model.offsetZ)] : [0, 0, 0]}
        rotation={procedural ? [0, finite(model.rotationY) * Math.PI / 180, 0] : [0, 0, 0]}
      >
        <ModelMarker3D model={model} position={[0, 0, 0]} scale={procedural ? Math.max(0.01, finite(model.scale, 1)) : 1} onRuntimeSettled={ready} onRuntimeError={setLoadError} />
      </group> : <mesh position={[0, 0.5, 0]}>
        <boxGeometry />
        <meshBasicMaterial color={asset?.error ? '#f59e0b' : '#64748b'} wireframe />
      </mesh>}
    </group>
    {selected && object && <>
      <SelectionOutline object={object} />
      <TransformControls object={object} mode={mode} space={mode === 'translate' ? 'world' : 'local'} size={0.85} enabled={!disabled}
        onMouseDown={() => { dragScale.current = object.scale.x; dragging.current = true; onManipulating(true); }}
        onMouseUp={() => { dragging.current = false; onManipulating(false); }}
        onObjectChange={() => {
          if (disabled || !dragging.current) return;
          const limit = (value: number, bound: number) => MathUtils.clamp(value, -bound, bound);
          object.position.set(limit(object.position.x, 1_000_000), limit(object.position.y, 1_000_000), limit(object.position.z, 1_000_000));
          object.rotation.set(limit(object.rotation.x, 10_000), limit(object.rotation.y, 10_000), limit(object.rotation.z, 10_000), 'XYZ');
          const changedAxis = (['x', 'y', 'z'] as const).reduce((best, current) =>
            Math.abs(object.scale[current] - dragScale.current) > Math.abs(object.scale[best] - dragScale.current) ? current : best, 'x');
          object.scale.setScalar(assemblyUniformScale(object.scale, changedAxis.toUpperCase()));
          onTransform(component.id, {
            position: {
              x: object.position.x,
              y: object.position.y,
              z: object.position.z,
            },
            rotation: {
              x: object.rotation.x,
              y: object.rotation.y,
              z: object.rotation.z,
            },
            scale: object.scale.x,
          });
        }} />
    </>}
  </>;
}

function SelectionOutline({ object }: { object: Group }) {
  const [helper] = useState(() => new Box3Helper(new Box3(), new Color('#22d3ee')));
  useFrame(() => {
    object.updateWorldMatrix(true, true);
    helper.box.setFromObject(object);
  });
  useEffect(() => () => helper.dispose(), [helper]);
  return <primitive object={helper} dispose={null} raycast={() => {}} />;
}

function CameraFrame({ request, objects }: { request: FrameRequest; objects: React.RefObject<Map<string, Group>> }) {
  const bounds = useBounds();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const box = new Box3();
      const targets = request.id ? [objects.current.get(request.id)].filter(Boolean) as Group[] : [...objects.current.values()];
      for (const target of targets) {
        target.updateWorldMatrix(true, true);
        box.union(new Box3().setFromObject(target));
      }
      if (!box.isEmpty()) bounds.refresh(box).clip().fit();
    });
    return () => cancelAnimationFrame(frame);
  }, [bounds, objects, request]);
  return null;
}

export function AssemblyCanvas({ ownerId, components, selectedId, disabled, onSelect, onTransform, onManipulating }: AssemblyCanvasProps) {
  const { assets, retry } = useAssemblyModels(ownerId, components);
  const [mode, setMode] = useState<Mode>('translate');
  const [frame, setFrame] = useState<FrameRequest>({
    id: null,
    revision: 0,
  });
  const [statuses, setStatuses] = useState<Record<string, RuntimeStatus>>({});
  const initiallyFramed = useRef(false);
  const objects = useRef(new Map<string, Group>());
  const register = useCallback((id: string, object: Group | null) => {
    if (object) objects.current.set(id, object);
    else objects.current.delete(id);
  }, []);
  const report = useCallback((id: string, status: RuntimeStatus) => {
    setStatuses(previous => previous[id]?.state === status.state && previous[id]?.error === status.error ? previous : { ...previous, [id]: status });
  }, []);
  const errors = components.map(component => statuses[component.id]).filter(status => status?.state === 'error');
  const pending = components.filter(component => !statuses[component.id] || statuses[component.id].state === 'loading').length;
  useEffect(() => {
    if (initiallyFramed.current || !components.length || pending) return;
    initiallyFramed.current = true;
    setFrame(previous => ({
      id: null,
      revision: previous.revision + 1,
    }));
  }, [components.length, pending]);
  const frameView = (id: string | null) => setFrame(previous => ({
    id,
    revision: previous.revision + 1,
  }));
  return <section aria-label="Assembly 3D canvas" className="flex min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-lg border lg:h-full lg:min-h-0">
    <div className="relative min-h-[26rem] flex-1 bg-slate-950 lg:min-h-0">
      <SafeCanvas camera={{
        position: [8, 6, 10],
        fov: 45,
        near: 0.01,
        far: 1_000_000,
      }} dpr={[1, 1.5]}>
        <color attach="background" args={['#071426']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[5, 8, 5]} intensity={2.4} />
        <directionalLight position={[-4, 3, -5]} intensity={1.1} color="#8ec5ff" />
        <Grid position={[0, -0.01, 0]} args={[100, 100]} cellSize={1} cellColor="#24435d" sectionSize={5} sectionColor="#3b82a6" fadeDistance={150} infiniteGrid />
        <axesHelper args={[2]} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <Bounds margin={1.3} maxDuration={0.2}>
          {components.map(component => <Suspense key={component.id} fallback={null}>
            <ComponentObject component={component} asset={assets.get(component.modelId)} selected={component.id === selectedId} mode={mode} disabled={disabled} register={register} report={report} onSelect={onSelect} onTransform={onTransform} onManipulating={onManipulating} />
          </Suspense>)}
          <CameraFrame request={frame} objects={objects} />
        </Bounds>
      </SafeCanvas>
      <div role="toolbar" aria-label="Assembly canvas tools" className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1 rounded-md border border-white/15 bg-slate-900/85 p-1 text-slate-100 shadow-md backdrop-blur-md [&_button]:text-slate-100"
        onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
        {modes.map(item => <Button key={item.mode} type="button" size="sm" variant={mode === item.mode ? 'secondary' : 'ghost'} className={mode === item.mode ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'hover:bg-slate-800/60'} aria-pressed={mode === item.mode} disabled={disabled} onClick={() => setMode(item.mode)}><item.icon className="size-3.5" />{item.label}</Button>)}
        <Button type="button" size="sm" variant="ghost" className="hover:bg-slate-800/60" disabled={!selectedId} onClick={() => frameView(selectedId)}><Focus className="size-3.5" />Focus selected</Button>
        <Button type="button" size="sm" variant="ghost" className="hover:bg-slate-800/60" disabled={!components.length} onClick={() => frameView(null)}><Expand className="size-3.5" />Fit all</Button>
        <ModelFieldHelp label="Assembly canvas">Add Models from the library, then select a component and drag its handles to assemble the group. Drag colored handles to {mode === 'translate' ? 'move' : mode}. Drag empty space to orbit; right-drag to pan; scroll to zoom. Grid: 1 Scene unit. Save Changes retains the arrangement.</ModelFieldHelp>
      </div>
      {!!pending && <p role="status" className="pointer-events-none absolute bottom-2 left-2 rounded bg-slate-900/90 p-2 text-xs text-slate-200">Loading {pending} Model{pending === 1 ? '' : 's'}…</p>}
    </div>
    {!!errors.length && <div role="alert" className="flex items-center gap-2 border-t p-2 text-xs text-amber-600"><span>{errors.map(asset => asset.error).join(' ')}</span><Button size="sm" variant="outline" onClick={() => retry(components.filter(component => statuses[component.id]?.state === 'error').map(component => component.modelId))}>Retry Models</Button></div>}
  </section>;
}
