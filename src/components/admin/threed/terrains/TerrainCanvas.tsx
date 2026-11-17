'use client';

import { TerrainMaterial } from '@/components/threed/terrains/TerrainMaterial';
import { TerrainDisplay } from '@/components/threed/terrains/TerrainDisplay';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Grid, Line, OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Eye, Grid2X2, Mountain, Pickaxe, PenLine, Redo2, Ruler, Save, Undo2 } from 'lucide-react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SafeCanvas } from '@/components/threed/shared/SafeCanvas';
import { Button } from '@/components/ui/button';
import { buildTerrainGeometry } from '@/components/map/presentation/ProjectTerrainGround';
import { terrainHeightAt, type TerrainDefinition, type TerrainPreviewCamera } from '@/libraries/services/threed/terrains/terrain-core';

export function updateTerrainPreviewClipping(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, radius: number) {
  const far = Math.max(1000, Math.ceil((camera.position.length() + radius * 2) / 100) * 100);
  if (camera.far !== far) {
    camera.far = far;
    camera.updateProjectionMatrix();
  }
}

function TerrainPreviewClipping({ radius }: { radius: number }) {
  const camera = useThree(state => state.camera);
  useFrame(() => updateTerrainPreviewClipping(camera, radius));
  return null;
}

function TerrainCameraControls({ restoredCamera, onCameraChange, enabled, extent, verticalExtent, peak }: {
  restoredCamera?: TerrainPreviewCamera;
  onCameraChange?: (view: TerrainPreviewCamera) => void;
  enabled: boolean;
  extent: number;
  verticalExtent: number;
  peak: number;
}) {
  const camera = useThree(state => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const tracking = useRef(false);
  useEffect(() => {
    tracking.current = false;
    if (!restoredCamera || !controls.current || !(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.fromArray(restoredCamera.position);
    camera.zoom = restoredCamera.zoom;
    camera.fov = restoredCamera.fov;
    camera.updateProjectionMatrix();
    controls.current.target.fromArray(restoredCamera.target);
    controls.current.update();
  }, [camera, restoredCamera]);
  return <OrbitControls ref={controls} makeDefault enabled={enabled}
    minDistance={Math.max(1, extent * 0.15)} maxDistance={Math.max(extent * 4, verticalExtent * 4)}
    target={restoredCamera?.target ?? [0, peak * 0.2, 0]}
    onStart={() => { tracking.current = true; }}
    onChange={() => {
      if (!tracking.current || !controls.current || !(camera instanceof THREE.PerspectiveCamera)) return;
      onCameraChange?.({
        position: camera.position.toArray(),
        target: controls.current.target.toArray(),
        zoom: camera.zoom,
        fov: camera.fov,
      });
    }} />;
}

interface Props {
  restoredCamera?: TerrainPreviewCamera;
  onCameraChange?: (view: TerrainPreviewCamera) => void;
  definition: TerrainDefinition;
  fillArea?: boolean;
  brushMode: 'inspect' | 'raise' | 'lower' | 'straight' | 'freeform';
  onBrushModeChange: (mode: Props['brushMode']) => void;
  onSculpt: (xM: number, zM: number) => void;
  drawnPath: { xM: number; zM: number; yM: number }[];
  onDrawnPathChange: Dispatch<SetStateAction<Props['drawnPath']>>;
  selectedDrawingId: string | null;
  onDrawingStart: () => void;
  onSelectDrawing: (id: string) => void;
  onMoveDrawingPoint: (id: string, index: number, xM: number, zM: number) => void;
  onUndo: () => void;
  undoDisabled: boolean;
  onRedo: () => void;
  redoDisabled: boolean;
  onSave: () => void;
  saveDisabled: boolean;
  disabled?: boolean;
}

function TerrainSurface({ definition, fillArea, brushMode, onSculpt, drawnPath, onDrawnPathChange, selectedDrawingId, onDrawingStart, onSelectDrawing, onMoveDrawingPoint, disabled }: Omit<Props, 'onUndo' | 'undoDisabled' | 'onRedo' | 'redoDisabled' | 'onSave' | 'saveDisabled'>) {
  const drawing = useRef(false);
  const moving = useRef<{ id: string; index: number; xM: number; zM: number } | null>(null);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const geometry = useMemo(() => buildTerrainGeometry({
    name: 'Preview',
    definition,
    placement: {
      id: null,
      threedId: 1,
      terrainId: 1,
      terrainRevision: 1,
      centerXM: 0,
      centerZM: 0,
      rotationYDeg: 0,
      scale: 1,
    },
  }, 1), [definition]);
  const pathHeight = (xM: number, zM: number) => (terrainHeightAt(definition, {
    id: null,
    threedId: 1,
    terrainId: 1,
    terrainRevision: 1,
    centerXM: 0,
    centerZM: 0,
    rotationYDeg: 0,
    scale: 1,
  }, xM, zM) ?? 0) + 0.15;
  const linePoints = (source: { xM: number; zM: number }[], closed = false) => {
    const points = closed && source.length > 2 ? [...source, source[0]] : source;
    return points.flatMap((point, index) => {
    if (index === 0) return [[point.xM, pathHeight(point.xM, point.zM), point.zM] as [number, number, number]];
    const previous = points[index - 1];
    const stepM = Math.min(definition.widthM / (definition.columns - 1), definition.lengthM / (definition.rows - 1));
    const steps = Math.max(1, Math.min(64, Math.ceil(Math.hypot(point.xM - previous.xM, point.zM - previous.zM) / stepM)));
    return Array.from({ length: steps }, (_, step) => {
      const fraction = (step + 1) / steps;
      const xM = previous.xM + (point.xM - previous.xM) * fraction;
      const zM = previous.zM + (point.zM - previous.zM) * fraction;
      return [xM, pathHeight(xM, zM), zM] as [number, number, number];
    });
  });
  };
  useEffect(() => () => geometry.mesh.dispose(), [geometry]);
  const paint = (event: ThreeEvent<PointerEvent>) => {
    if (disabled || brushMode === 'inspect' || event.button !== 0) return;
    event.stopPropagation();
    if (brushMode === 'raise' || brushMode === 'lower') {
      onSculpt(event.point.x, event.point.z);
      return;
    }
    drawing.current = true;
    onDrawingStart();
    (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
    onDrawnPathChange([{ xM: event.point.x, zM: event.point.z, yM: event.point.y }]);
  };
  const continueDrawing = (event: ThreeEvent<PointerEvent>) => {
    if (!drawing.current || disabled || (brushMode !== 'straight' && brushMode !== 'freeform')) return;
    event.stopPropagation();
    const point = { xM: event.point.x, zM: event.point.z, yM: event.point.y };
    onDrawnPathChange(current => {
      if (current.length === 0) return [point];
      const last = current.at(-1)!;
      if (Math.hypot(last.xM - point.xM, last.zM - point.zM) < 0.15) return current;
      if (brushMode === 'straight') return [current[0], point];
      return current.length < 256 ? [...current, point] : current;
    });
  };
  const stopDrawing = (event: ThreeEvent<PointerEvent>) => {
    if (!drawing.current) return;
    continueDrawing(event);
    drawing.current = false;
    (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
  };
  const movePoint = (event: ThreeEvent<PointerEvent>) => {
    if (!moving.current) return;
    event.stopPropagation();
    const intersection = event.ray.intersectPlane(groundPlane, new THREE.Vector3());
    if (!intersection) return;
    const xM = Math.max(-definition.widthM / 2, Math.min(definition.widthM / 2, intersection.x));
    const zM = Math.max(-definition.lengthM / 2, Math.min(definition.lengthM / 2, intersection.z));
    moving.current = { ...moving.current, xM, zM };
    onDrawnPathChange(current => current.map((point, index) => index === moving.current?.index ? { xM, zM, yM: point.yM } : point));
  };
  const finishPoint = (event: ThreeEvent<PointerEvent>) => {
    if (!moving.current) return;
    event.stopPropagation();
    movePoint(event);
    const point = moving.current;
    moving.current = null;
    (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
    onMoveDrawingPoint(point.id, point.index, point.xM, point.zM);
  };
  const handleRadius = Math.max(0.16, Math.min(0.65, Math.max(definition.widthM, definition.lengthM) * 0.008));
  return <>
    <TerrainDisplay definition={definition} />
    <mesh castShadow receiveShadow geometry={geometry.mesh} onPointerDown={paint} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing}>
      <TerrainMaterial appearance={definition.appearance} roughness={0.9} />
    </mesh>
    {drawnPath.length > 1 && <Line points={linePoints(drawnPath, fillArea)} color="#facc15" lineWidth={3} raycast={() => null} />}
    {definition.appearance.authoring?.operations.map(operation => {
      if (operation.type !== 'path' || operation.drawing.hidden || operation.drawing.id === selectedDrawingId || operation.drawing.points.length < 2) return null;
      return <Line key={operation.drawing.id} points={linePoints(operation.drawing.points, operation.drawing.fillArea)} color="#38bdf8" lineWidth={3} onPointerDown={event => { event.stopPropagation(); if (!disabled) onSelectDrawing(operation.drawing.id); }} />;
    })}
    {definition.appearance.authoring?.operations.map(operation => {
      if (operation.type !== 'path' || operation.drawing.hidden || operation.drawing.id !== selectedDrawingId) return null;
      const selected = operation.drawing.id === selectedDrawingId;
      const points = selected ? drawnPath : operation.drawing.points;
      return points.map((point, index) => <mesh
        key={`${operation.drawing.id}-${index}`}
        position={[point.xM, pathHeight(point.xM, point.zM) + handleRadius, point.zM]}
        onPointerDown={event => {
          if (disabled || event.button !== 0) return;
          event.stopPropagation();
          onSelectDrawing(operation.drawing.id);
          groundPlane.constant = -(pathHeight(point.xM, point.zM) + handleRadius);
          moving.current = { id: operation.drawing.id, index, xM: point.xM, zM: point.zM };
          (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={movePoint}
        onPointerUp={finishPoint}
        onPointerCancel={finishPoint}
      >
        <sphereGeometry args={[handleRadius, 12, 8]} />
        <meshBasicMaterial color={selected ? '#facc15' : '#38bdf8'} depthTest={false} />
      </mesh>);
    })}
  </>;
}

export function TerrainCanvas({ restoredCamera, onCameraChange, definition, fillArea, brushMode, onBrushModeChange, onSculpt, drawnPath, onDrawnPathChange, selectedDrawingId, onDrawingStart, onSelectDrawing, onMoveDrawingPoint, onUndo, undoDisabled, onRedo, redoDisabled, onSave, saveDisabled, disabled }: Props) {
  const [showGrid, setShowGrid] = useState(false);
  const extent = Math.max(definition.widthM, definition.lengthM);
  let peak = 0;
  let lowest = 0;
  for (const height of definition.heightsM) {
    peak = Math.max(peak, height);
    lowest = Math.min(lowest, height);
  }
  const verticalExtent = Math.max(Math.abs(lowest), peak);
  const gridY = lowest - 0.1;
  return <div className="relative h-full min-h-0 w-full overflow-hidden rounded-lg border bg-[#08182a]" aria-label="3D Terrain editor">
    <SafeCanvas shadows camera={{ position: [extent * 0.75, Math.max(extent * 0.55, peak * 2 + 8), extent * 0.75], fov: 48, near: 0.1, far: Math.max(1000, extent * 8, verticalExtent * 8) }}>
      <TerrainPreviewClipping radius={Math.hypot(extent * 0.75, extent * 0.75, verticalExtent + 0.1)} />
      <color attach="background" args={[definition.appearance.style?.background ?? '#08182a']} />
      {definition.appearance.style?.lighting === 'warm' ? <>
        <hemisphereLight args={['white', 'darkslategrey', 0.4]} />
        <directionalLight castShadow color="orange" position={[-extent * 0.6, extent * 0.8, -extent * 0.6]} intensity={2.5} shadow-mapSize={[2048, 2048]} shadow-camera-left={-extent} shadow-camera-right={extent} shadow-camera-top={extent} shadow-camera-bottom={-extent} shadow-camera-far={extent * 5} shadow-bias={-0.0002} />
        <directionalLight position={[extent, extent, extent]} intensity={0.3} />
      </> : <><ambientLight intensity={1.5} /><directionalLight position={[extent * 0.4, extent, extent * 0.3]} intensity={2} /></>}
      {showGrid && <Grid position={[0, gridY, 0]} args={[extent * 1.5, extent * 1.5]} sectionColor="#2b859f" cellColor="#315263" fadeDistance={extent * 3} />}
      <TerrainSurface fillArea={fillArea} definition={definition} brushMode={brushMode} onBrushModeChange={onBrushModeChange} onSculpt={onSculpt} drawnPath={drawnPath} onDrawnPathChange={onDrawnPathChange} selectedDrawingId={selectedDrawingId} onDrawingStart={onDrawingStart} onSelectDrawing={onSelectDrawing} onMoveDrawingPoint={onMoveDrawingPoint} disabled={disabled} />
      <TerrainCameraControls restoredCamera={restoredCamera} onCameraChange={onCameraChange} enabled={brushMode === 'inspect' && !disabled} extent={extent} verticalExtent={verticalExtent} peak={peak} />
    </SafeCanvas>
    <div role="toolbar" aria-label="Terrain canvas tools" className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1 rounded-md border border-white/15 bg-slate-900/85 p-1 text-slate-100 shadow-md backdrop-blur-md" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      <Button type="button" size="sm" variant={brushMode === 'inspect' ? 'secondary' : 'ghost'} className={brushMode === 'inspect' ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 hover:text-slate-100' : 'text-slate-100 hover:bg-slate-800/60 hover:text-slate-100'} aria-pressed={brushMode === 'inspect'} disabled={disabled} onClick={() => onBrushModeChange('inspect')}><Eye className="size-3.5" />Inspect</Button>
      <Button type="button" size="sm" variant={brushMode === 'raise' ? 'secondary' : 'ghost'} className={brushMode === 'raise' ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 hover:text-slate-100' : 'text-slate-100 hover:bg-slate-800/60 hover:text-slate-100'} aria-pressed={brushMode === 'raise'} disabled={disabled} onClick={() => onBrushModeChange('raise')}><Mountain className="size-3.5" />Raise</Button>
      <Button type="button" size="sm" variant={brushMode === 'lower' ? 'secondary' : 'ghost'} className={brushMode === 'lower' ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 hover:text-slate-100' : 'text-slate-100 hover:bg-slate-800/60 hover:text-slate-100'} aria-pressed={brushMode === 'lower'} disabled={disabled} onClick={() => onBrushModeChange('lower')}><Pickaxe className="size-3.5" />Lower</Button>
      <Button type="button" size="sm" variant={brushMode === 'straight' ? 'secondary' : 'ghost'} className={brushMode === 'straight' ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 hover:text-slate-100' : 'text-slate-100 hover:bg-slate-800/60 hover:text-slate-100'} aria-pressed={brushMode === 'straight'} disabled={disabled} onClick={() => onBrushModeChange('straight')}><Ruler className="size-3.5" />Straight</Button>
      <Button type="button" size="sm" variant={brushMode === 'freeform' ? 'secondary' : 'ghost'} className={brushMode === 'freeform' ? 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 hover:text-slate-100' : 'text-slate-100 hover:bg-slate-800/60 hover:text-slate-100'} aria-pressed={brushMode === 'freeform'} disabled={disabled} onClick={() => onBrushModeChange('freeform')}><PenLine className="size-3.5" />Freeform</Button>
      <Button type="button" size="icon-sm" variant={showGrid ? 'secondary' : 'ghost'} className="text-slate-100 hover:bg-slate-800/60 hover:text-slate-100" aria-label="Show grid" title="Show grid" aria-pressed={showGrid} onClick={() => setShowGrid(value => !value)}><Grid2X2 className="size-4" /></Button>
      <Button type="button" size="icon-sm" variant="ghost" className="text-slate-100 hover:bg-slate-800/60 hover:text-slate-100" aria-label="Undo" title="Undo" disabled={undoDisabled} onClick={onUndo}><Undo2 className="size-4" /></Button>
      <Button type="button" size="icon-sm" variant="ghost" className="text-slate-100 hover:bg-slate-800/60 hover:text-slate-100" aria-label="Redo" title="Redo" disabled={redoDisabled} onClick={onRedo}><Redo2 className="size-4" /></Button>
      <Button type="button" size="icon-sm" variant="ghost" className="border border-emerald-500/50 text-emerald-600 hover:bg-slate-800/60 hover:text-emerald-500 dark:text-emerald-400" aria-label="Save Changes" title="Save Changes" disabled={saveDisabled} onClick={onSave}><Save className="size-4" /></Button>
    </div>
  </div>;
}
