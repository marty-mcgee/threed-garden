'use client';
import type { ThreeDGroup } from '@/libraries/services/threed/design/groups';
import type { DesignModelSelection, SaveDesignModel } from './DesignModelProperties';

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode, type SetStateAction, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Group, Ungroup, Scissors, Link2, Unlink2, CircleMinus, Check, Eye, EyeOff, Focus, Maximize, RotateCcw, Tags, Ruler, type LucideIcon } from 'lucide-react';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { WallCutoutEditor } from './WallCutoutEditor';
import { DesignAction } from './DesignAction';
import { Button } from '@/components/ui/button';
import { doorIsOpen, nearestRoofEdge, withinRoof, cutoutBounds, distance, insidePolygon, roofFrame, roofOpeningFootprint, INCH, levelDocument, visibleLevelsDocument, mergeNodes, moveNodes, openingFootprint, openingMargin, roundMetres, screenToPlan, snapPoint, validateDesign, signedArea, wallFrame, wallHeightAt,
  stairFootprint, stairLayout, planObjectColor, floorSurfaceLabel, type DesignStairs, type FloorSurface, type PlanObject, type DesignDocument, type PlanPoint, type PlanView } from '@/libraries/services/threed/design/document';
import { formatPlanLength, framePlan, gridFeet as planGridFeet, rulerTicks, RULER_SIZE, zoomPlan } from '@/libraries/services/threed/design/plan-navigation';
import { entityPoints, setStairFootprint } from '@/libraries/services/threed/design/object-properties';
import type { ModelPlanImage } from '@/libraries/services/threed/models/model-plan-image';
import { terrainHeightAt, terrainPlanCells, type ProjectTerrainSurface } from '@/libraries/services/threed/terrains/terrain-core';
import { wallFootprint } from '@/libraries/services/threed/design/geometry';

type FloorTool = 'floor' | 'deck' | 'patio';
export type DesignTool = 'objects' | 'stairs' | 'wall-cutout' | 'select' | 'wall' | FloorTool | 'roof' | 'door' | 'window' | 'cutout' | 'skylight' | 'pan';
function isFloorTool(tool: DesignTool): tool is FloorTool {
  return tool === 'floor' || tool === 'deck' || tool === 'patio';
}
type DrawPoint = PlanPoint & { nodeId?: string };
export interface DesignContextGroup { label: string; color: string; actions: { label: string; icon: LucideIcon; disabled?: boolean; active?: boolean; run: () => void }[] }
interface Props {
  onChooseLevel?: (id: string) => void;
  groups?: ThreeDGroup[];
  onGroupChange?: (groups: ThreeDGroup[]) => void;
  onMixedMove?: (doc: DesignDocument, ids: string[], dx: number, dz: number) => void;
  selectAllRequest?: number;
  placedModelIds?: string[]; selectedModel?: DesignModelSelection | null; onSaveModel?: SaveDesignModel; modelBusy?: boolean; visibleLevelIds?: string[]; onToggleLevel?: (id: string) => void; contextActions?: DesignContextGroup[]; showObjectLabels?: boolean; onShowObjectLabelsChange?: (show: boolean) => void; showMeasurements?: boolean; onShowMeasurementsChange?: (show: boolean) => void; selectedModelId?: string | null; modelImages?: ModelPlanImage[]; terrain?: ProjectTerrainSurface | null; metersPerSceneUnit?: number; onModelSelect?: (id: string) => void; measurementUnits?: 'imperial' | 'metric'; frameRequest?: { id: string; sequence: number } | null; drawingActions?: (groupControls: ReactNode) => ReactNode; planView?: PlanView; onViewChange?: (view: PlanView) => void; toolbarHost?: HTMLDivElement | null; embedded?: boolean; active?: boolean; disabled?: boolean; document: DesignDocument; displayDocument?: DesignDocument; activeLevelId: string; selected: string | null; tool: DesignTool; gridSnap: boolean;
  onSelect: (id: string | null) => void; onCommit: (doc: DesignDocument) => void;
  onPreview: (doc: DesignDocument | null) => void; onMessage: (text: string) => void;
  onDrawComplete: (id: string) => void; cancelToken: number }
const stairCorners = ['startLeft', 'startRight', 'endRight', 'endLeft'] as const;
const stairHandleNames = ['end', 'width', ...stairCorners] as const;
type StairHandle = typeof stairHandleNames[number];
function isStairHandle(value: unknown): value is StairHandle {
  return stairHandleNames.some(name => name === value);
}
interface Gesture { stairEdit?: { stair: DesignStairs; handle: StairHandle | 'move'; origin: PlanPoint; detachedAnchorId: string }; pointerId: number; base: DesignDocument; point: PlanPoint; screenStart?: { x: number; y: number }; view: PlanView; nodes: string[]; pan: boolean; boxStart?: PlanPoint; pickedEntity?: string; pickedModel?: string; movableBase?: DesignDocument; wallPress?: { started: boolean; shiftKey: boolean }; pendingClick?: { shiftKey: boolean }; node?: string; opening?: string; roofOpening?: string; cutoutVertex?: number; merge?: string; latest: DesignDocument }
const PAN_DRAG_THRESHOLD = 4; // CSS pixels: allow ordinary click jitter without drawing during a pan.
const makeId = () => crypto.randomUUID();

function addShape(doc: DesignDocument, points: DrawPoint[], tool: 'wall' | 'stairs' | FloorTool | 'roof', levelId: string, draft = false, oneSidedRoof = false, shareNodes = true, surface?: FloorSurface): DesignDocument {
  const nodes = [...doc.nodes];
  const levelNodes = new Set(levelDocument(doc, levelId).nodes.map(node => node.id));
  const used = new Set([...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings, ...(doc.stairs ?? [])].map(entity => entity.id));
  const allocate = (prefix: string) => { let candidate = draft ? prefix : makeId(), suffix = 0; while (used.has(candidate)) candidate = draft ? `${prefix}-${++suffix}` : makeId(); used.add(candidate); return candidate; };
  // Stairs use one independent anchor. The second click defines their direction and run.
  const corners = tool === 'stairs' ? points.slice(0, 1) : points;
  const ids = corners.map((point, index) => {
    const existing = !shareNodes || tool === 'stairs' ? undefined : point.nodeId ?? nodes.find(node => levelNodes.has(node.id) && distance(node, point) < .000001)?.id;
    if (existing) return existing;
    const id = allocate(`preview-node-${index}`); nodes.push({ id, x: point.x, z: point.z }); return id;
  });
  const id = allocate('preview-entity');
  if (tool === 'stairs') {
    const [start, end] = points;
    const length = distance(start, end);
    if (length < 0.000001) throw new Error('Click away from the start to set the direction of the Stairs.');
    const stepLength = 10 * INCH;
    const stepHeight = 7 * INCH;
    const count = Math.max(1, Math.round(length / stepLength));
    return {
      ...doc,
      version: 13,
      nodes,
      stairs: [...(doc.stairs ?? []), {
        id,
        levelId,
        anchor: ids[0],
        direction: (Math.atan2(end.z - start.z, end.x - start.x) * 180 / Math.PI + 360) % 360,
        startY: 0,
        endY: roundMetres(count * stepHeight),
        stepLength,
        stepHeight,
        width: 36 * INCH,
      }],
    };
  }
  if (isFloorTool(tool)) {
    return {
      ...doc,
      version: surface && doc.version < 12 ? 12 : doc.version,
      nodes,
      floors: [...doc.floors, {
        id,
        levelId,
        vertices: ids,
        thickness: doc.defaults.floorThickness,
        elevation: surface === 'deck' ? 24 * INCH : surface ? INCH : 0,
        ...(surface && { surface }),
      }],
    };
  }
  return { ...doc, nodes, walls: tool === 'wall' ? [...doc.walls, { id, levelId, start: ids[0], end: ids[1], height: doc.defaults.wallHeight, thickness: doc.defaults.wallThickness, elevation: 0 }] : doc.walls,
    roofs: tool === 'roof' ? [...doc.roofs, { id, levelId, vertices: ids, kind: oneSidedRoof ? 'shed' : 'gable', pitch: 6, direction: 0, thickness: 6 * INCH, elevation: doc.defaults.wallHeight }] : doc.roofs };
}

function stairHandlePoints(doc: DesignDocument, stair: DesignStairs) {
  const [startLeft, startRight, endRight, endLeft] = stairFootprint(doc, stair);
  const midpoint = (a: PlanPoint, b: PlanPoint) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
  return {
    startLeft,
    startRight,
    endRight,
    endLeft,
    end: midpoint(endRight, endLeft),
    width: midpoint(startRight, endRight),
  };
}

function planDimensionChains(points: PlanPoint[], scale: number, units: 'imperial' | 'metric') {
  return (['x', 'z'] as const).map(axis => {
    const anchors = new Map<number, number>();
    for (const point of points) {
      // Rotate the left chain into the same local coordinate system as the top chain.
      const along = axis === 'x' ? point.x : -point.z;
      const across = axis === 'x' ? point.z : point.x;
      const station = Math.round(along * 1000) / 1000;
      anchors.set(station, Math.min(anchors.get(station) ?? Infinity, across));
    }
    const stations = [...anchors.keys()].sort((a, b) => a - b);
    if (stations.length < 2) return null;
    const px = 1 / scale;
    const chain = Math.min(...anchors.values()) - 24 * px;
    const total = chain - 20 * px;
    const first = stations[0], last = stations[stations.length - 1];
    function span(start: number, end: number, row: number) {
      const label = formatPlanLength(end - start, units);
      return <g key={start} data-dimension-span={axis}>
        <line x1={start} x2={end} y1={row} y2={row} />
        {(end - start) * scale >= label.length * 6 + 4 &&
          <text x={(start + end) / 2} y={row - 4 * px} stroke="#091423" strokeWidth={3 * px} paintOrder="stroke">{label}</text>}
      </g>;
    }
    return <g key={axis} transform={axis === 'z' ? 'rotate(-90)' : undefined} stroke="#94b8ce" strokeWidth={px}>
      {stations.map(station => {
        const outer = stations.length > 2 && (station === first || station === last);
        const tick = (row: number) => <line x1={station - 3 * px} x2={station + 3 * px} y1={row + 3 * px} y2={row - 3 * px} />;
        return <g key={station}>
          <line x1={station} x2={station} y1={anchors.get(station)! - 3 * px} y2={(outer ? total : chain) - 5 * px} opacity=".55" />
          {tick(chain)}
          {outer && tick(total)}
        </g>;
      })}
      {stations.slice(1).map((end, index) => span(stations[index], end, chain))}
      {stations.length > 2 && span(first, last, total)}
    </g>;
  });
}

export function DesignPlan({ groups = [], placedModelIds, onGroupChange, onMixedMove, selectAllRequest = 0, selectedModel, onSaveModel, modelBusy = false, visibleLevelIds, onChooseLevel, onToggleLevel, contextActions = [], showObjectLabels, onShowObjectLabelsChange, showMeasurements, onShowMeasurementsChange, selectedModelId, modelImages = [], terrain, metersPerSceneUnit = 1, onModelSelect, measurementUnits = 'imperial', frameRequest, drawingActions, planView, onViewChange, toolbarHost, embedded = false, active: enabled = true, disabled = false, document: doc, displayDocument = doc, activeLevelId, selected, tool, gridSnap, onSelect, onCommit, onPreview, onMessage, onDrawComplete, cancelToken }: Props) {
  const [connectFloors, setConnectFloors] = useState(true);
  const [splitStart, setSplitStart] = useState<string | null>(null);
  const [connectWalls, setConnectWalls] = useState(true);
  const shownLevels = visibleLevelIds ?? [activeLevelId];
  const editingHidden = !shownLevels.includes(activeLevelId);
  const [localMeasurements, setLocalMeasurements] = useState(false);
  const [localLabels, setLocalLabels] = useState(true);
  function paint(entity: PlanObject) {
    return entity.appearance?.texture ? 'url(#' + patternId + '-' + entity.id + ')' : planObjectColor(entity);
  }
  const labelsVisible = showObjectLabels ?? localLabels;
  const measurementsVisible = showMeasurements ?? localMeasurements;
  const toggleMeasurements = () => { const next = !measurementsVisible; if (onShowMeasurementsChange) onShowMeasurementsChange(next); else setLocalMeasurements(next); };
  const visible = visibleLevelsDocument(displayDocument, shownLevels), active = levelDocument(doc, activeLevelId);
  const svg = useRef<SVGSVGElement>(null), patternId = useId();
  const [localView, setLocalView] = useState<PlanView>({ x: 80, y: 80, scale: 45 });
  const view = planView ?? localView;
  const viewRef = useRef(view); viewRef.current = view;
  const changeViewRef = useRef(onViewChange); changeViewRef.current = onViewChange;
  const setView = useCallback((update: SetStateAction<PlanView>) => {
    const next = typeof update === 'function' ? update(viewRef.current) : update;
    viewRef.current = next;
    if (changeViewRef.current) changeViewRef.current(next); else setLocalView(next);
  }, []);
  const [size, setSize] = useState({ width: 600, height: 280 });
  const [points, setPoints] = useState<DrawPoint[]>([]), [hover, setHover] = useState<DrawPoint | null>(null);
  const [oneSidedRoof, setOneSidedRoof] = useState(false);
  const [paving, setPaving] = useState<'patio' | 'driveway'>('patio');
  const surface = tool === 'deck' ? 'deck' : tool === 'patio' ? paving : undefined;
  const cutoutHost = useRef<string | null>(null);
  const [draftOpeningId] = useState(makeId);
  const [boxed, setBoxed] = useState<Set<string>>(() => new Set());
  const [modelIds, setModelIds] = useState<string[]>([]);
  const lastSelectAll = useRef(0);
  const [marquee, setMarquee] = useState<{ start: PlanPoint; end: PlanPoint } | null>(null);
  useEffect(() => {
    setBoxed(new Set());
    setModelIds([]);
    setMarquee(null);
    if (tool === 'objects') svg.current?.focus();
  }, [tool, cancelToken, activeLevelId, enabled, disabled, shownLevels.join('|')]);
  useEffect(() => {
    if (selectAllRequest === lastSelectAll.current) return;
    lastSelectAll.current = selectAllRequest;
    setBoxed(new Set([...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings, ...(doc.stairs ?? [])].map(item => item.id)));
    setModelIds(placedModelIds ?? modelImages.map(image => image.id));
  }, [selectAllRequest]);
  const groupSelected = (id: string) => tool === 'objects' && boxed.has(id);
  const gesture = useRef<Gesture | null>(null);
  const modelGesture = useRef<{ pointerId: number; start: PlanPoint; model: DesignModelSelection; resize: boolean; factor: number; dx: number; dz: number } | null>(null);
  const modelSaving = useRef(false);
  const [modelPreview, setModelPreview] = useState<{ id: string; x: number; z: number; factor: number; dx: number; dz: number } | null>(null);
  const [groupOffset, setGroupOffset] = useState<PlanPoint | null>(null);
  const [failedModelImages, setFailedModelImages] = useState<Record<string, string>>({});
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const displayedImages = modelImages.map(image => image.id === modelPreview?.id ? { ...image, corners: image.corners.map(point => ({
    x: modelPreview.x + (point.x - modelPreview.x) * modelPreview.factor + modelPreview.dx,
    z: modelPreview.z + (point.z - modelPreview.z) * modelPreview.factor + modelPreview.dz,
  })) as ModelPlanImage['corners'] } : groupOffset && modelIds.includes(image.id) ? {
    ...image,
    corners: image.corners.map(p => ({ x: p.x + groupOffset.x, z: p.z + groupOffset.z })) as ModelPlanImage['corners'],
  } : image).sort((left, right) => {
    const area = (image: ModelPlanImage) => {
      const [a, b, c] = image.corners;
      return Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
    };
    // Draw large environments first so their footprints cannot cover smaller Models.
    return area(right) - area(left);
  });
  const terrainCells = useMemo(() => terrain ? terrainPlanCells(terrain.definition) : [], [terrain?.definition]);
  const terrainRelief = useMemo(() => terrain ? Math.max(1, ...terrain.definition.heightsM.map(Math.abs)) : 1, [terrain?.definition]);
  const cancelModel = () => {
    const current = modelGesture.current;
    modelGesture.current = null;
    setModelPreview(null);
    setGroupOffset(null);
    if (current && svg.current?.hasPointerCapture(current.pointerId)) svg.current.releasePointerCapture(current.pointerId);
  };
  useEffect(() => { cancelModel(); }, [selectedModelId, selectedModel?.locked, cancelToken, tool, enabled, disabled]);
  function startModel(event: PointerEvent<SVGElement>, id: string, resize = false) {
    if (!enabled || disabled || modelBusy || modelSaving.current || tool !== 'select' || event.button !== 0 || event.altKey) return;
    event.preventDefault(); event.stopPropagation();
    if (!selectedModel || selectedModel.id !== id || !onSaveModel) { onModelSelect?.(id); return; }
    if (selectedModel.locked) { onMessage('Model placement is protected. Unlock it in DetailsCard before editing.'); return; }
    if (!window.dispatchEvent(new Event('threed:design:model-selection', { cancelable: true }))) return;
    svg.current?.focus();
    modelGesture.current = { pointerId: event.pointerId, start: pointer(event), model: { ...selectedModel }, resize, factor: 1, dx: 0, dz: 0 };
    svg.current?.setPointerCapture(event.pointerId);
  }
  const nodes = new Map(visible.nodes.map(node => [node.id, node]));
  const wall = doc.walls.find(entity => entity.id === selected), floor = doc.floors.find(entity => entity.id === selected);
  const editableCutout = enabled && !disabled && !editingHidden && tool === 'select' ? active.roofOpenings.find(o => o.id === selected && o.kind === 'cutout') : undefined;
  const selectedWallCutout = active.openings.find(o => o.id === selected && o.kind === 'wall-cutout');
  const cutoutWall = tool === 'wall-cutout' && enabled && !disabled && !editingHidden ? active.walls.find(w => w.id === (selectedWallCutout?.wallId ?? selected)) : undefined;
  const editableStair = enabled && !disabled && !editingHidden && tool === 'select'
    ? visible.stairs?.find(stair => stair.id === selected && stair.levelId === activeLevelId)
    : undefined;
  const stairHandles = editableStair && stairHandlePoints(displayDocument, editableStair);
  const editableWall = enabled && !disabled && !editingHidden && tool === 'select' ? active.walls.find(w => w.id === selected) : undefined;
  const wallMidpoint = editableWall ? wallFrame(doc, editableWall).point(wallFrame(doc, editableWall).length / 2) : null;
  const editableFloor = enabled && !disabled && !editingHidden && tool === 'select' ? active.floors.find(f => f.id === selected) : undefined;
  const floorLabel = floorSurfaceLabel(editableFloor ?? { surface });
  const editableRoof = enabled && !disabled && tool === 'select' ? active.roofs.find(roof => roof.id === selected) : undefined;
  const polygonShape = editableFloor ?? editableRoof;
  const handles = (wall ? [wall.start, wall.end] : floor?.vertices ?? doc.roofs.find(entity => entity.id === selected)?.vertices ?? []).filter(key => nodes.has(key));
  useEffect(() => { const element = svg.current; if (!element) return; const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(element); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const element = svg.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      const rect = element.getBoundingClientRect(), p = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (!gesture.current) setView(current => zoomPlan(current, p, event.deltaY));
    };
    element.addEventListener('wheel', wheel, { passive: false }); return () => element.removeEventListener('wheel', wheel);
  }, []);
  useEffect(() => {
    const active = gesture.current; gesture.current = null; setPoints([]); setHover(null); onPreview(null);
    const element = svg.current;
    if (active && element?.hasPointerCapture(active.pointerId)) element.releasePointerCapture(active.pointerId);
  }, [cancelToken, tool, activeLevelId, enabled, disabled, onPreview]);
  useEffect(() => {
    if (tool === 'cutout') {
      const draft = hover && !points.some(p => distance(p, hover) < .000001) ? [...points, hover] : points;
      try { onPreview(draft.length >= 3 ? polygonCutout(draft, draftOpeningId) : null); } catch { onPreview(null); }
      return;
    }
    if ((tool !== 'wall' && tool !== 'stairs' && !isFloorTool(tool) && tool !== 'roof') || !points.length || !hover) { onPreview(null); return; }
    const draft = [...points, hover];
    try { onPreview(validateDesign(addShape(doc, draft, tool, activeLevelId, true, oneSidedRoof, isFloorTool(tool) ? connectFloors : tool !== 'wall' || connectWalls, surface))); } catch { onPreview(null); }
  }, [points, hover, tool, doc, activeLevelId, oneSidedRoof, connectWalls, connectFloors, surface, onPreview]);
  const local = (event: { clientX: number; clientY: number }) => { const rect = svg.current!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const pointer = (event: { clientX: number; clientY: number }) => screenToPlan(local(event), view);
  function snapped(point: PlanPoint, exclude: string[] = [], orthogonal = false): DrawPoint {
    const start = points[points.length - 1];
    if (orthogonal && start) point = Math.abs(point.x - start.x) > Math.abs(point.z - start.z) ? { x: point.x, z: start.z } : { x: start.x, z: point.z };
    const result = snapPoint(point, [...active.nodes, ...points.map((point, index) => ({ ...point, id: point.nodeId ?? `drawing-${index}` }))], view.scale, gridSnap, exclude);
    if (orthogonal && start) {
      if (point.x === start.x) result.point = { x: start.x, z: result.point.z }; else result.point = { x: result.point.x, z: start.z };
      const node = doc.nodes.find(node => node.id === result.nodeId);
      if (node && distance(node, result.point) > .000001) result.nodeId = undefined;
    }
    return { ...result.point, nodeId: doc.nodes.some(node => node.id === result.nodeId) ? result.nodeId : undefined };
  }
  function reshapeCutout(base: DesignDocument, id: string, ring: PlanPoint[]) {
    const opening = base.roofOpenings.find(item => item.id === id)!;
    const frame = roofFrame(base, base.roofs.find(roof => roof.id === opening.roofId)!);
    const bounds = cutoutBounds(ring.map(frame.local));
    return validateDesign({ ...base, version: Math.max(base.version, 7), roofOpenings: base.roofOpenings.map(item => item.id === id ? { ...item, ...bounds } : item) });
  }
  function polygonCutout(corners: PlanPoint[], id: string) {
    const roof = doc.roofs.find(item => item.id === cutoutHost.current);
    if (!roof) throw new Error('Choose a host roof.');
    const opening = { id, roofId: roof.id, kind: 'cutout', ...cutoutBounds(corners.map(roofFrame(doc, roof).local)) };
    return validateDesign({ ...doc, version: Math.max(doc.version, 7), roofOpenings: [...doc.roofOpenings, opening] });
  }
  function finishPolygon() {
    if (tool === 'cutout') {
      try {
        const id = makeId();
        onCommit(polygonCutout(points, id));
        setPoints([]); setHover(null); onPreview(null); onDrawComplete(id);
        onMessage('Cutout finished. Drag its corners or use an edge + to add another.');
      } catch (error) { onMessage((error as Error).message); }
      return;
    }
    if (!isFloorTool(tool) && tool !== 'roof') return;
    try { const next = validateDesign(addShape(doc, points, tool, activeLevelId, false, oneSidedRoof, !isFloorTool(tool) || connectFloors, surface)); const entities = tool === 'roof' ? next.roofs : next.floors; onCommit(next); setPoints([]); setHover(null); onPreview(null); onDrawComplete(entities[entities.length - 1].id); onMessage(`${tool === 'roof' ? 'Roof' : floorLabel} finished and selected. Drag a corner or edit its properties.`); }
    catch (error) { onMessage((error as Error).message); }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!enabled || disabled || editingHidden || event.key !== 'Enter' || (!isFloorTool(tool) && tool !== 'roof' && tool !== 'cutout') || points.length < 3 || event.repeat
        || (event.target as Element)?.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
      event.preventDefault(); finishPolygon();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  function placeOpening(point: PlanPoint, draft: boolean) {
    if (tool !== 'door' && tool !== 'window') return null;
    const hosts = active.walls.map(wall => {
      const frame = wallFrame(doc, wall), offset = frame.project(point), closest = frame.point(Math.max(0, Math.min(frame.length, offset)));
      return { wall, frame, offset, distance: distance(point, closest) };
    }).filter(hit => hit.distance <= Math.max(hit.wall.thickness / 2, 12 / view.scale)).sort((a, b) => a.distance - b.distance);
    if (!hosts.length) return null;
    const { wall, frame, offset } = hosts[0], width = tool === 'door' ? doc.defaults.doorWidth : doc.defaults.windowWidth;
    const margin = openingMargin(wall), raw = offset - width / 2, snapped = gridSnap ? Math.round(raw / (6 * INCH)) * 6 * INCH : raw;
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings, ...(doc.stairs ?? [])].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), kind: tool, wallId: wall.id,
      offset: roundMetres(Math.max(margin, Math.min(frame.length - margin - width, snapped))), width,
      height: tool === 'door' ? doc.defaults.doorHeight : doc.defaults.windowHeight, sill: tool === 'door' ? 0 : doc.defaults.windowSill };
    return { next: validateDesign({ ...doc, openings: [...doc.openings, opening] }), id: opening.id };
  }
  function placeRoofOpening(point: PlanPoint, draft: boolean) {
    if (tool !== 'skylight') return null;
    const selectedRoof = doc.roofOpenings.find(opening => opening.id === selected)?.roofId ?? selected;
    const roof = active.roofs.find(roof => roof.id === selectedRoof) ?? [...active.roofs].reverse().find(roof => insidePolygon(point, roof.vertices.map(id => doc.nodes.find(node => node.id === id)!)));
    if (!roof) return null;
    const frame = roofFrame(doc, roof), local = frame.local(point), step = 6 * INCH, width = 24 * INCH, length = 36 * INCH;
    const snap = (value: number) => roundMetres(gridSnap ? Math.round(value / step) * step : value);
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings, ...(doc.stairs ?? [])].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), roofId: roof.id, kind: tool, along: snap(local.along - width / 2), across: snap(local.across - length / 2), width, length };
    return { next: validateDesign({ ...doc, roofOpenings: [...doc.roofOpenings, opening] }), id: opening.id };
  }
  function finishBox(start: PlanPoint, end: PlanPoint) {
    const contained = (p: PlanPoint) => p.x >= Math.min(start.x, end.x) && p.x <= Math.max(start.x, end.x)
      && p.z >= Math.min(start.z, end.z) && p.z <= Math.max(start.z, end.z);
    const ids = new Set<string>();
    for (const wall of visible.walls) if (wallFootprint(doc, wall).every(contained)) ids.add(wall.id);
    for (const shape of [...visible.floors, ...visible.roofs]) {
      if (shape.vertices.every(id => contained(nodes.get(id)!))) ids.add(shape.id);
    }
    for (const stair of visible.stairs ?? []) {
      if (stairFootprint(doc, stair).every(contained)) ids.add(stair.id);
    }
    for (const opening of visible.openings) if (ids.has(opening.wallId)) ids.add(opening.id);
    for (const opening of visible.roofOpenings) if (ids.has(opening.roofId)) ids.add(opening.id);
    setBoxed(ids);
    const models = modelImages.filter(image => modelPoints([image]).every(contained));
    setModelIds(models.map(image => image.id));
    onMessage(ids.size || models.length ? 'Drag a highlighted object to move the selection.' : 'No Design objects enclosed.');
  }

  function prepareBoxMove() {
    const moving = new Set<string>(), stationary = new Set<string>();
    for (const shape of [...doc.walls, ...doc.floors, ...doc.roofs]) {
      const refs = boxed.has(shape.id) ? moving : stationary;
      for (const id of 'vertices' in shape ? shape.vertices : [shape.start, shape.end]) refs.add(id);
    }
    for (const stair of doc.stairs ?? []) {
      (boxed.has(stair.id) ? moving : stationary).add(stair.anchor);
    }
    // Split shared boundary nodes only for the moving group. Preview and commit reuse the same IDs.
    const replacements = new Map<string, string>();
    for (const id of moving) if (stationary.has(id)) replacements.set(id, makeId());
    const remap = (id: string) => replacements.get(id) ?? id;
    const movableBase = replacements.size ? {
      ...doc,
      nodes: [...doc.nodes, ...doc.nodes.filter(n => replacements.has(n.id)).map(n => ({ ...n, id: remap(n.id) }))],
      walls: doc.walls.map(w => boxed.has(w.id) ? { ...w, start: remap(w.start), end: remap(w.end) } : w),
      floors: doc.floors.map(f => boxed.has(f.id) ? { ...f, vertices: f.vertices.map(remap) } : f),
      ...(doc.stairs && { stairs: doc.stairs.map(s => boxed.has(s.id) ? { ...s, anchor: remap(s.anchor) } : s) }),
      roofs: doc.roofs.map(r => boxed.has(r.id) ? { ...r, vertices: r.vertices.map(remap) } : r),
    } : doc;
    return { movableBase, nodes: [...moving].map(remap) };
  }

  function groupOffsetInScene(drag: Gesture, point: PlanPoint) {
    const delta = (value: number) => (gridSnap ? Math.round(value / (6 * INCH)) * 6 * INCH : value) / metersPerSceneUnit;
    return { x: delta(point.x - drag.point.x), z: delta(point.z - drag.point.z) };
  }
  function groupTranslation(drag: Gesture, point: PlanPoint) {
    const delta = (value: number) => gridSnap ? Math.round(value / (6 * INCH)) * 6 * INCH : value;
    const dx = delta(point.x - drag.point.x);
    const dz = delta(point.z - drag.point.z);
    if (!dx && !dz) return drag.base;
    const base = drag.movableBase ?? drag.base;
    const subset = drag.movableBase ? new Set(drag.nodes) : null;
    return validateDesign(moveNodes(base, new Map(base.nodes.filter(node => !subset || subset.has(node.id)).map(node => [
      node.id,
      { x: node.x + dx, z: node.z + dz },
    ]))));
  }
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [menuPoint, setMenuPoint] = useState<string | null>(null);
  useEffect(() => { setActivePoint(null); setMenuPoint(null); setSplitStart(null); }, [selected, activeLevelId, tool, cancelToken]);
  function pointKey(target: Element) {
    const draft = target.getAttribute('data-draft-corner');
    if (draft != null) return 'draft:' + draft;
    const handle = target.closest('[data-cutout-vertex]');
    const vertex = handle?.getAttribute('data-cutout-vertex');
    if (vertex != null && !handle?.hasAttribute?.('data-insert')) return 'cutout:' + vertex;
    const node = target.getAttribute('data-node');
    return node ? 'node:' + node : null;
  }
  function pointRemoval(key: string | null) {
    if (!key || !enabled || disabled || editingHidden) return null;
    const draft = key.startsWith('draft:') ? key.slice(6) : null;
    if (draft != null && (isFloorTool(tool) || tool === 'roof' || tool === 'cutout') && points[Number(draft)]) {
      return { disabled: false, run() {
        setActivePoint(null);
        setPoints(points.filter((_, i) => i !== Number(draft)));
        setHover(null);
        onPreview(null);
      } };
    }
    const index = key.startsWith('cutout:') ? key.slice(7) : null;
    const nodeId = key.startsWith('node:') ? key.slice(5) : null;
    const shape = editableRoof ?? (tool === 'select' ? floor : undefined);
    let count: number;
    let update: () => DesignDocument;
    if (editableCutout && index != null) {
      const ring = roofOpeningFootprint(doc, editableCutout);
      if (!ring[Number(index)]) return null;
      count = ring.length;
      update = () => reshapeCutout(doc, editableCutout.id, ring.filter((_, i) => i !== Number(index)));
    } else if (shape && nodeId && shape.vertices.includes(nodeId)) {
      count = shape.vertices.length;
      update = () => {
        const vertices = shape.vertices.filter(id => id !== nodeId);
        const next = editableRoof
          ? { ...doc, roofs: doc.roofs.map(r => r.id === shape.id ? { ...r, vertices } : r) }
          : { ...doc, floors: doc.floors.map(f => f.id === shape.id ? { ...f, vertices } : f) };
        const stillUsed = next.walls.some(w => w.start === nodeId || w.end === nodeId)
          || [...next.floors, ...next.roofs].some(polygon => polygon.vertices.includes(nodeId));
        return validateDesign(stillUsed ? next : { ...next, nodes: next.nodes.filter(n => n.id !== nodeId) });
      };
    } else return null;
    return { disabled: count <= 3, run() {
      if (count <= 3) { onMessage('Keep at least three corners.'); return; }
      try { onCommit(update()); setActivePoint(null); } catch (error) { onMessage((error as Error).message); }
    } };
  }
  const menuRemoval = pointRemoval(menuPoint);
  const toolbarRemoval = pointRemoval(activePoint);
  function down(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || gesture.current || (event.button !== 0 && event.button !== 1) || local(event).x < RULER_SIZE || local(event).y < RULER_SIZE) return;
    event.preventDefault(); svg.current?.focus();
    const point = pointer(event), target = (event.target as Element).closest('[data-entity]'), targetId = target?.getAttribute('data-entity') ?? null;
    // A transient drawing/placement preview is still blank canvas, not a saved object.
    const entityId = targetId && [...active.walls, ...active.floors, ...active.roofs, ...active.openings, ...active.roofOpenings, ...(active.stairs ?? [])].some(entity => entity.id === targetId) ? targetId : null;
    // Rendered levels can differ from the drawing level. Activate a visible saved
    // object first; the editor selects its level before a later editing gesture.
    if (!entityId && targetId && tool === 'select' && event.button === 0 && !event.altKey) {
      const selectable = visibleLevelsDocument(doc, shownLevels);
      if ([...selectable.walls, ...selectable.floors, ...selectable.roofs, ...selectable.openings, ...selectable.roofOpenings, ...(selectable.stairs ?? [])].some(entity => entity.id === targetId)) {
        onSelect(targetId);
        return;
      }
    }
    const hitNodeId = (event.target as Element).getAttribute('data-node');
    const nodeId = active.nodes.some(node => node.id === hitNodeId) ? hitNodeId : null;
    if (tool === 'objects' && !disabled && event.button === 0 && !event.altKey) {
      const modelId = (event.target as Element).closest('[data-plan-model]')?.getAttribute('data-plan-model');
      const moveHandle = (event.target as Element).closest('[data-selection-handle]')?.getAttribute('data-selection-handle') === 'move';
      const moveSelection = moveHandle || Boolean((targetId && boxed.has(targetId)) || (modelId && modelIds.includes(modelId)));
      gesture.current = {
        pointerId: event.pointerId,
        base: doc,
        latest: doc,
        point,
        view,
        pan: false,
        pickedEntity: targetId ?? undefined,
        pickedModel: modelId ?? undefined,
        screenStart: local(event),
        ...(moveSelection
          ? prepareBoxMove()
          : { nodes: [], boxStart: point }),
      };
      if (gesture.current.boxStart) setMarquee({ start: point, end: point });
      svg.current!.setPointerCapture(event.pointerId);
      return;
    }
    const explicitPan = editingHidden || tool === 'pan' || event.button === 1 || event.altKey;
    const stairHandle = (event.target as Element).closest('[data-stair-handle]')?.getAttribute('data-stair-handle');
    if (!explicitPan && editableStair && stairHandles && entityId === editableStair.id && isStairHandle(stairHandle)) {
      setActivePoint('stair:' + stairHandle);
      gesture.current = {
        pointerId: event.pointerId,
        base: doc,
        latest: doc,
        point,
        view,
        nodes: [],
        pan: false,
        stairEdit: {
          detachedAnchorId: makeId(),
          stair: editableStair,
          handle: stairHandle,
          origin: stairHandles[stairHandle],
        },
      };
      svg.current!.setPointerCapture(event.pointerId);
      return;
    }
    if (!explicitPan && editableFloor && splitStart && nodeId && editableFloor.vertices.includes(nodeId)) {
      const vertices = editableFloor.vertices;
      const [a, b] = [vertices.indexOf(splitStart), vertices.indexOf(nodeId)].sort((x,y) => x-y);
      const first = vertices.slice(a,b+1), second = [...vertices.slice(b), ...vertices.slice(0,a+1)];
      if (a < 0 || first.length < 3 || second.length < 3) { onMessage(`Choose a non-adjacent ${floorLabel} corner.`); return; }
      const area = (ids: string[]) => signedArea(ids.map(id => nodes.get(id)!));
      if (area(first) * area(second) <= 0) { onMessage(`Keep the split inside the ${floorLabel}.`); return; }
      const copies = new Map((connectFloors ? [] : [splitStart,nodeId]).map(id => [id, { ...nodes.get(id)!, id:makeId() }]));
      try {
        onCommit(validateDesign({
          ...doc,
          nodes: [...doc.nodes, ...copies.values()],
          floors: doc.floors.flatMap(f => f.id === editableFloor.id ? [
            { ...f, vertices:first },
            { ...f, id:makeId(), vertices:second.map(id => copies.get(id)?.id ?? id) },
          ] : [f]),
        }));
        setSplitStart(null);
        setActivePoint(null);
        onMessage(`${floorLabel} split into two ${floorLabel} objects.`);
      } catch (error) { onMessage((error as Error).message); }
      return;
    }
    const clickedPoint = pointKey(event.target as Element);
    if (!explicitPan) setActivePoint(clickedPoint);
    if (!explicitPan && !event.shiftKey && clickedPoint?.startsWith('draft:') && (clickedPoint !== 'draft:0' || points.length < 3)) return;
    if (!explicitPan && event.shiftKey) {
      const action = pointRemoval(clickedPoint);
      if (action) {
        action.run();
        return;
      }
    }
    if (!explicitPan && !disabled && tool === 'wall') {
      const started = points.length === 0;
      if (started) activateTool(point, event.shiftKey);
      gesture.current = {
        pointerId: event.pointerId,
        base: doc,
        latest: doc,
        point,
        screenStart: local(event),
        view,
        nodes: [],
        pan: false,
        wallPress: { started, shiftKey: event.shiftKey },
      };
      svg.current!.setPointerCapture(event.pointerId);
      return;
    }
    const cutoutHandle = (event.target as Element).closest('[data-cutout-vertex]');
    if (!explicitPan && editableCutout && cutoutHandle?.getAttribute('data-cutout-vertex')?.match(/^\d+$/)) {
      const ring = roofOpeningFootprint(doc, editableCutout);
      const index = Number(cutoutHandle.getAttribute('data-cutout-vertex'));
      const insert = cutoutHandle.hasAttribute('data-insert');
      const vertex = insert ? index + 1 : index;
      setActivePoint('cutout:' + vertex);
      let base = doc;
      if (insert) {
        const a = ring[index], b = ring[(index + 1) % ring.length];
        ring.splice(vertex, 0, { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
        try { base = reshapeCutout(doc, editableCutout.id, ring); }
        catch (error) { onMessage((error as Error).message); return; }
      }
      gesture.current = { pointerId: event.pointerId, base, latest: base, point, view, nodes: [], pan: false, roofOpening: editableCutout.id, cutoutVertex: vertex };
      svg.current!.setPointerCapture(event.pointerId);
      if (insert) onPreview(base);
      return;
    }
    if (!explicitPan && editableWall && wallMidpoint && (event.target as Element).closest('[data-wall-split]')?.getAttribute('data-wall-split') === editableWall.id) {
      const frame = wallFrame(doc, editableWall);
      const half = frame.length / 2;
      const joint = makeId();
      const secondId = makeId();
      try {
        const openings = doc.openings.map(opening => {
          if (opening.wallId !== editableWall.id) return opening;
          if (opening.offset >= half) return { ...opening, wallId: secondId, offset: opening.offset - half };
          if (opening.offset + opening.width > half) throw new Error('Move the opening clear of the split point first.');
          return opening;
        });
        const jointHeight = wallHeightAt(editableWall, half, frame.length);
        const first = { ...editableWall, end: joint, ...(editableWall.endHeight === undefined ? {} : { endHeight: jointHeight }) };
        const secondStart = connectWalls ? joint : makeId();
        const second = { ...editableWall, id: secondId, start: secondStart, height: jointHeight };
        const next = validateDesign({
          ...doc,
          nodes: [...doc.nodes, { id: joint, ...wallMidpoint }, ...(connectWalls ? [] : [{ id: secondStart, ...wallMidpoint }])],
          walls: doc.walls.flatMap(w => w.id === editableWall.id ? [first, second] : [w]),
          openings,
        });
        gesture.current = { pointerId: event.pointerId, base: next, latest: next, point, view, nodes: [joint], node: joint, pan: false };
        svg.current!.setPointerCapture(event.pointerId);
        setActivePoint('node:' + joint);
        onPreview(next);
        onMessage(connectWalls ? 'Release to split the Wall, or drag the shared point to bend it.' : 'Release to create separate Walls, or drag the first endpoint.');
      } catch (error) { onMessage((error as Error).message); }
      return;
    }
    const edgeAttribute = editableFloor ? 'data-floor-edge' : 'data-roof-edge';
    const edge = (event.target as Element).closest('[' + edgeAttribute + ']')?.getAttribute(edgeAttribute);
    if (!explicitPan && polygonShape && edge != null && /^\d+$/.test(edge)) {
      const index = Number(edge);
      const vertices = polygonShape.vertices;
      const a = nodes.get(vertices[index]), b = nodes.get(vertices[(index + 1) % vertices.length]);
      if (!a || !b) return;
      const id = makeId();
      try {
        const next = validateDesign({
          ...doc,
          nodes: [...doc.nodes, { id, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }],
          [editableFloor ? 'floors' : 'roofs']: (editableFloor ? doc.floors : doc.roofs).map(shape => shape.id === polygonShape.id ? { ...shape, vertices: [...vertices.slice(0,index+1), id, ...vertices.slice(index+1)] } : shape),
        });
        gesture.current = { pointerId: event.pointerId, base: next, latest: next, point, view, nodes: [id], node: id, pan: false };
        svg.current!.setPointerCapture(event.pointerId);
        setActivePoint('node:' + id);
        onPreview(next);
        onMessage('Drag to reshape the outline, or release to keep the new corner at the midpoint.');
      } catch (error) { onMessage((error as Error).message); }
      return;
    }
    if (!explicitPan && !disabled && tool === 'wall-cutout') {
      if (entityId && (active.walls.some(w=>w.id===entityId) || active.openings.some(o=>o.id===entityId && o.kind==='wall-cutout'))) onSelect(entityId);
      else onMessage('Click a wall or an existing Wall Cutout.');
      return;
    }
    if (explicitPan || (!entityId && !nodeId)) {
      gesture.current = { pointerId: event.pointerId, base: doc, latest: doc, point, screenStart: local(event), view, nodes: [], pan: true,
        pendingClick: explicitPan ? undefined : { shiftKey: event.shiftKey } };
      svg.current!.setPointerCapture(event.pointerId); return;
    }
    if (disabled) { onSelect(entityId); return; }
    if (tool !== 'select') { activateTool(point, event.shiftKey); return; }
    if (nodeId || entityId) {
      if (entityId) onSelect(entityId);
      const entity = doc.walls.find(wall => wall.id === entityId) ?? doc.floors.find(floor => floor.id === entityId) ?? doc.roofs.find(roof => roof.id === entityId);
      const stair = active.stairs?.find(item => item.id === entityId);
      const keys = nodeId ? [nodeId] : entity ? 'vertices' in entity ? entity.vertices : [entity.start, entity.end] : [];
      gesture.current = { pointerId: event.pointerId, base: doc, latest: doc, point, view, nodes: keys, pan: false,
        ...(stair && !nodeId && { stairEdit: {
          stair,
          handle: 'move',
          origin: nodes.get(stair.anchor)!,
          detachedAnchorId: makeId(),
        } as const }),
        node: nodeId ?? undefined, opening: doc.openings.some(o => o.id === entityId) ? entityId! : undefined, roofOpening: doc.roofOpenings.some(o => o.id === entityId) ? entityId! : undefined };
      svg.current!.setPointerCapture(event.pointerId);
    }
  }
  // Blank-space clicks run only on release, once we know the user did not drag to pan.
  function activateTool(point: PlanPoint, shiftKey: boolean) {
    if (disabled || tool === 'select') { onSelect(null); return; }
    if (tool === 'door' || tool === 'window') {
      try { const placed = placeOpening(point, false); if (!placed) { onMessage('Choose a host wall in the plan.'); return; } onCommit(placed.next); onDrawComplete(placed.id); onMessage(`${tool === 'door' ? 'Door' : 'Window'} placed and selected. Drag along its wall or edit its dimensions.`); }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (tool === 'cutout') {
      let hit = snapped(point, [], shiftKey);
      if (!points.length) {
        const hosts = active.roofs.filter(roof => nearestRoofEdge(point, roof.vertices.map(id => nodes.get(id)!)).gap <= 6 / view.scale || withinRoof(hit, roof.vertices.map(id => nodes.get(id)!)));
        const preferred = active.roofOpenings.find(o => o.id === selected)?.roofId ?? selected;
        cutoutHost.current = (hosts.find(roof => roof.id === preferred) ?? hosts[hosts.length - 1])?.id ?? null;
        if (!cutoutHost.current) { onMessage('Start the cutout inside a roof.'); return; }
      }
      const host = active.roofs.find(item => item.id === cutoutHost.current);
      const perimeter = host?.vertices.map(id => nodes.get(id)!);
      const edge = perimeter && nearestRoofEdge(point, perimeter);
      if (edge && edge.gap <= 6 / view.scale) hit = edge.point;
      if (points.length >= 3 && distance(hit, points[0]) < 10 / view.scale) { finishPolygon(); return; }
      if (!perimeter || !withinRoof(hit, perimeter)) {
        onMessage('Keep every cutout corner inside the same roof.');
        return;
      }
      if (points.length >= 64) { onMessage('A cutout supports up to 64 corners.'); return; }
      if (!points.some(p => distance(hit, p) < .000001)) { setActivePoint('draft:' + points.length); setPoints([...points, hit]); setHover(hit); }
      return;
    }
    if (tool === 'skylight') {
      try { const placed = placeRoofOpening(point, false); if (!placed) { onMessage('Choose a host roof in the active plan. Draw Roof first if needed.'); return; } onCommit(placed.next); onDrawComplete(placed.id); onMessage('Roof opening placed and selected. Drag within its roof or edit its dimensions.'); }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (tool === 'stairs') {
      const hit = snapped(point, [], shiftKey);
      if (!points.length) {
        setPoints([hit]);
        setHover(hit);
        onMessage('Click the end of the flight to set its direction and length.');
        return;
      }
      try {
        const next = validateDesign(addShape(doc, [points[0], hit], 'stairs', activeLevelId));
        const stair = next.stairs?.at(-1);
        if (!stair) throw new Error('Could not create the Stairs.');
        onCommit(next);
        setPoints([]);
        setHover(null);
        onPreview(null);
        onDrawComplete(stair.id);
        onMessage('Stairs added. Edit the start and end elevations and step dimensions in Design Properties.');
      } catch (error) { onMessage((error as Error).message); }
      return;
    }
    if (tool === 'wall' || isFloorTool(tool) || tool === 'roof') {
      const hit = snapped(point, [], shiftKey);
      if ((isFloorTool(tool) || tool === 'roof') && points.length >= 3 && distance(hit, points[0]) < 10 / view.scale) { finishPolygon(); return; }
      if (tool === 'wall' && points.length) {
        try { const next = validateDesign(addShape(doc, [points[0], hit], 'wall', activeLevelId, false, false, connectWalls)); onCommit(next); setPoints(connectWalls ? [{ ...hit, nodeId: next.walls[next.walls.length - 1].end }] : []); setHover(null); onPreview(null); onMessage(connectWalls ? 'Wall added. Click the next endpoint, or Escape to finish.' : 'Separate Wall added. Click the start of another Wall.'); }
        catch (error) { onMessage((error as Error).message); }
      } else if (!points.some(existing => distance(existing, hit) < .000001)) { setActivePoint('draft:' + points.length); setPoints([...points, hit]); setHover(hit); onMessage(tool !== 'wall' ? 'Click corners, then Finish, Enter, or the first corner to save. Escape cancels the draft.' : 'Click an endpoint. Escape cancels.'); }
      return;
    }
  }
  function panGesture(active: Gesture, here: { x: number; y: number }) {
    const start = active.screenStart!, dx = here.x - start.x, dy = here.y - start.y;
    if (active.pendingClick) {
      if (Math.hypot(dx, dy) < PAN_DRAG_THRESHOLD) return;
      active.pendingClick = undefined;
      setHover(null); onPreview(null);
    }
    setView({ ...active.view, x: active.view.x + dx, y: active.view.y + dy });
  }
  function editStairFromDrag(drag: Gesture, point: PlanPoint): DesignDocument {
    const edit = drag.stairEdit!;
    if (distance(point, drag.point) * drag.view.scale < PAN_DRAG_THRESHOLD) return drag.base;
    const { stair, origin, handle, detachedAnchorId } = edit;
    if (handle === 'move') {
      const delta = (v: number) => gridSnap ? Math.round(v / (6 * INCH)) * 6 * INCH : v;
      const start = {
        x: origin.x + delta(point.x - drag.point.x),
        z: origin.z + delta(point.z - drag.point.z),
      };
      return setStairFootprint(drag.base, stair.id, start, stair, detachedAnchorId);
    }
    const target = {
      x: origin.x + point.x - drag.point.x,
      z: origin.z + point.z - drag.point.z,
    };
    const { point: hit } = snapPoint(target, active.nodes, drag.view.scale, gridSnap, [stair.anchor]);
    const anchor = drag.base.nodes.find(node => node.id === stair.anchor)!;
    const dx = hit.x - anchor.x, dz = hit.z - anchor.z;
    const angle = stair.direction * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const { count } = stairLayout(stair);
    let start: PlanPoint = anchor;
    let resized: DesignStairs;
    if (handle === 'end') {
      const run = Math.hypot(dx, dz);
      if (run < .000001) return drag.base;
      resized = {
        ...stair,
        direction: (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360,
        stepLength: Math.max(INCH, run / count),
      };
    } else if (handle === 'width') {
      const halfWidth = -sin * dx + cos * dz;
      resized = { ...stair, width: Math.max(INCH, 2 * halfWidth) };
    } else {
      const index = stairCorners.indexOf(handle);
      const fixed = stairFootprint(drag.base, stair)[(index + 2) % 4];
      const fromFixedX = hit.x - fixed.x, fromFixedZ = hit.z - fixed.z;
      const atStart = index < 2;
      const rightSide = handle === 'startRight' || handle === 'endRight' ? 1 : -1;
      const along = (cos * fromFixedX + sin * fromFixedZ) * (atStart ? -1 : 1);
      const across = (-sin * fromFixedX + cos * fromFixedZ) * rightSide;
      const width = roundMetres(Math.max(INCH, across));
      const stepLength = roundMetres(Math.max(INCH, along / count));
      const startOffset = atStart ? -count * stepLength : 0;
      const sideOffset = rightSide * width / 2;
      start = {
        x: fixed.x + cos * startOffset - sin * sideOffset,
        z: fixed.z + sin * startOffset + cos * sideOffset,
      };
      resized = { ...stair, width, stepLength };
    }
    return setStairFootprint(drag.base, stair.id, start, resized, detachedAnchorId);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    const modelDrag = modelGesture.current;
    if (modelDrag && modelDrag.pointerId === event.pointerId) {
      const here = pointer(event), model = modelDrag.model;
      if (modelDrag.resize) {
        const origin = { x: model.positionX * metersPerSceneUnit, z: model.positionZ * metersPerSceneUnit };
        const before = distance(modelDrag.start, origin);
        if (before > .000001) modelDrag.factor = Math.max(.0001 / model.scaleMultiplier, Math.min(10000 / model.scaleMultiplier, distance(here, origin) / before));
      } else {
        const snap = (value: number) => gridSnap ? Math.round(value / (6 * INCH)) * (6 * INCH) : value;
        modelDrag.dx = snap(here.x - modelDrag.start.x) / metersPerSceneUnit;
        modelDrag.dz = snap(here.z - modelDrag.start.z) / metersPerSceneUnit;
      }
      setModelPreview({ id: model.id, x: model.positionX, z: model.positionZ, factor: modelDrag.factor, dx: modelDrag.dx, dz: modelDrag.dz });
      return;
    }
    if (!enabled || ((disabled || (editingHidden && tool !== 'objects')) && !gesture.current?.pan)) return;
    const active = gesture.current;
    if (!active) {
      if ((tool === 'wall' || tool === 'stairs' || isFloorTool(tool) || tool === 'roof' || tool === 'cutout') && points.length) {
        const p = pointer(event);
        const roof = tool === 'cutout' && doc.roofs.find(item => item.id === cutoutHost.current);
        const edge = roof && nearestRoofEdge(p, roof.vertices.map(id => nodes.get(id)!));
        setHover(edge && edge.gap <= 6 / view.scale ? edge.point : snapped(p, [], event.shiftKey));
      }
      if (tool === 'skylight') { try { onPreview(placeRoofOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      if (tool === 'door' || tool === 'window') { try { onPreview(placeOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      return;
    }
    if (event.pointerId !== active.pointerId) return;
    if (active.stairEdit) {
      if (doc !== active.base || selected !== active.stairEdit.stair.id) { onPreview(null); return; }
      try {
        onPreview(editStairFromDrag(active, screenToPlan(local(event), active.view)));
      } catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (active.boxStart) {
      setMarquee({ start: active.boxStart, end: screenToPlan(local(event), active.view) });
      return;
    }
    if (active.movableBase && !active.pan) {
      try {
        const end = screenToPlan(local(event), active.view);
        onPreview(groupTranslation(active, end));
        if (modelIds.length) setGroupOffset(groupOffsetInScene(active, end));
      }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (active.wallPress) {
      setHover(snapped(pointer(event), [], event.shiftKey));
      return;
    }
    if (active.pan) { panGesture(active, local(event)); return; }
    const p = screenToPlan(local(event), active.view), baseNodes = new Map(active.base.nodes.map(node => [node.id, node]));
    if (active.roofOpening) {
      const opening = active.base.roofOpenings.find(opening => opening.id === active.roofOpening)!, roof = active.base.roofs.find(roof => roof.id === opening.roofId)!, frame = roofFrame(active.base, roof);
      if (active.cutoutVertex !== undefined) {
        const ring = roofOpeningFootprint(active.base, opening);
        const edge = nearestRoofEdge(p, roof.vertices.map(id => nodes.get(id)!));
        ring[active.cutoutVertex] = edge.gap <= 6 / view.scale ? edge.point : snapped(p);
        try { active.latest = reshapeCutout(active.base, opening.id, ring); onPreview(active.latest); }
        catch (error) { onMessage((error as Error).message); }
        return;
      }
      const start = frame.local(active.point), here = frame.local(p), step = 6 * INCH;
      const snap = (value: number) => roundMetres(gridSnap ? Math.round(value / step) * step : value);
      const along = snap(opening.along + here.along - start.along), across = snap(opening.across + here.across - start.across);
      try { active.latest = validateDesign({ ...active.base, roofOpenings: active.base.roofOpenings.map(item => item.id === opening.id ? { ...item, along, across } : item) }); onPreview(active.latest); onMessage('Moving roof opening. Release to commit; Escape cancels.'); }
      catch (error) { onMessage((error as Error).message); }
      return;
    }
    if (active.opening) {
      const opening = active.base.openings.find(o => o.id === active.opening)!, wall = active.base.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(active.base, wall);
      const raw = opening.offset + frame.project(p) - frame.project(active.point), offset = roundMetres(gridSnap ? Math.round(raw / (6 * INCH)) * 6 * INCH : raw);
      try { active.latest = validateDesign({ ...active.base, openings: active.base.openings.map(o => o.id === opening.id ? { ...o, offset } : o) }); onPreview(active.latest); onMessage('Moving opening along its host wall. Release to commit; Escape cancels.'); }
      catch (error) { onMessage((error as Error).message); }
      return;
    }
    let dx = p.x - active.point.x, dz = p.z - active.point.z;
    const positions = new Map<string, PlanPoint>();
    if (active.node) {
      const snap = snapPoint(p, levelDocument(active.base, activeLevelId).nodes, active.view.scale, gridSnap, active.nodes); active.merge = ((!connectWalls && editableWall) || (!connectFloors && editableFloor)) ? undefined : snap.nodeId;
      positions.set(active.node, snap.point);
    } else {
      if (gridSnap) { dx = Math.round(dx / (6 * INCH)) * 6 * INCH; dz = Math.round(dz / (6 * INCH)) * 6 * INCH; }
      for (const key of active.nodes) { const n = baseNodes.get(key)!; positions.set(key, { x: n.x + dx, z: n.z + dz }); }
    }
    try { active.latest = validateDesign(moveNodes(active.base, positions)); onPreview(active.latest); onMessage('Moving connected geometry. Release to commit; Escape cancels.'); }
    catch (error) { active.merge = undefined; onMessage((error as Error).message); }
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const modelDrag = modelGesture.current;
    if (modelDrag && modelDrag.pointerId === event.pointerId) {
      modelGesture.current = null;
      if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
      if (onSaveModel && !selectedModel?.locked && (modelDrag.dx !== 0 || modelDrag.dz !== 0 || modelDrag.factor !== 1)) {
        modelSaving.current = true;
        const oldHeight = terrain ? terrainHeightAt(terrain.definition, terrain.placement, modelDrag.model.positionX * metersPerSceneUnit, modelDrag.model.positionZ * metersPerSceneUnit) ?? 0 : 0;
        const newHeight = terrain ? terrainHeightAt(terrain.definition, terrain.placement, (modelDrag.model.positionX + modelDrag.dx) * metersPerSceneUnit, (modelDrag.model.positionZ + modelDrag.dz) * metersPerSceneUnit) ?? 0 : 0;
        void onSaveModel(modelDrag.model.id, {
          positionX: modelDrag.model.positionX + modelDrag.dx,
          positionY: modelDrag.model.positionY + (newHeight - oldHeight) / metersPerSceneUnit,
          positionZ: modelDrag.model.positionZ + modelDrag.dz,
          scaleMultiplier: modelDrag.model.scaleMultiplier * modelDrag.factor,
        }).then(saved => onMessage(saved ? 'Model placement saved.' : 'Model update failed. Saved placement retained.'))
          .catch(() => onMessage('Model update failed. Saved placement retained.'))
          .finally(() => { modelSaving.current = false; setModelPreview(null); });
      } else setModelPreview(null);
      return;
    }
    const active = gesture.current; if (!active || event.pointerId !== active.pointerId) return;
    if (active.pan) panGesture(active, local(event));
    gesture.current = null;
    try {
      if (active.stairEdit) {
        if (doc === active.base && selected === active.stairEdit.stair.id && enabled && !disabled && !editingHidden) {
          const next = editStairFromDrag(active, screenToPlan(local(event), active.view));
          if (next !== active.base) onCommit(next);
        }
      } else if (active.boxStart) {
        setMarquee(null);
        if (doc === active.base && enabled && !disabled) {
          const release = local(event);
          const click = active.screenStart && Math.hypot(release.x - active.screenStart.x, release.y - active.screenStart.y) < PAN_DRAG_THRESHOLD;
          if (click && active.pickedEntity) {
            const id = active.pickedEntity;
            const host = visible.openings.find(item => item.id === id)?.wallId ?? visible.roofOpenings.find(item => item.id === id)?.roofId ?? id;
            const ids = new Set(boxed);
            ids.add(host);
            for (const opening of visible.openings) if (opening.wallId === host) ids.add(opening.id);
            for (const opening of visible.roofOpenings) if (opening.roofId === host) ids.add(opening.id);
            setBoxed(ids);
          } else if (click && active.pickedModel) {
            setModelIds([...new Set([...modelIds, active.pickedModel])]);
          } else finishBox(active.boxStart, screenToPlan(release, active.view));
        }
      } else if (active.movableBase && !active.pan) {
        if (doc === active.base && !disabled && enabled) {
          const release = local(event);
          if (active.screenStart && Math.hypot(release.x - active.screenStart.x, release.y - active.screenStart.y) < PAN_DRAG_THRESHOLD) {
            setGroupOffset(null);
            onPreview(null);
            if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
            return;
          }
          const next = groupTranslation(active, screenToPlan(release, active.view));
          const end = screenToPlan(local(event), active.view);
          const { x: dx, z: dz } = groupOffsetInScene(active, end);
          if (modelIds.length && (dx || dz)) {
            if (!onMixedMove) throw new Error('Model movement is unavailable.');
            onMixedMove(next, modelIds, dx, dz);
          } else if (active.nodes.length && next !== active.base) onCommit(next);
        }
      } else if (active.wallPress) {
        const start = active.screenStart!, release = local(event);
        const dragged = Math.hypot(release.x - start.x, release.y - start.y) >= PAN_DRAG_THRESHOLD;
        if (dragged) activateTool(pointer(event), event.shiftKey);
        else if (!active.wallPress.started) activateTool(active.point, active.wallPress.shiftKey);
      } else if (active.pendingClick) activateTool(active.point, active.pendingClick.shiftKey);
      else if (!active.pan) onCommit(active.node && active.merge ? mergeNodes(active.latest, active.node, active.merge) : active.latest);
    }
    catch (error) { onMessage((error as Error).message); }
    setGroupOffset(null);
    onPreview(null); if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
  }
  const polygon = (points: PlanPoint[]) => points.map(point => `${point.x},${point.z}`).join(' ');
  const gridFeet = planGridFeet(view.scale), grid = gridFeet * 12 * INCH * view.scale;
  const selectedWall = doc.walls.find(wall => wall.id === selected);
  const modelPoints = (images: ModelPlanImage[]) => images.flatMap(image => { const [a,b,c] = image.corners; return [a,b,c,{x:b.x+c.x-a.x,z:b.z+c.z-a.z}].map(p => ({x:p.x*metersPerSceneUnit,z:p.z*metersPerSceneUnit})); });
  const selectionPoints = selectedModelId ? modelPoints(modelImages.filter(image => image.id === selectedModelId)) : selectedWall ? wallFootprint(doc, selectedWall) : entityPoints(doc, selected);
  const xTicks = rulerTicks(view.x, view.scale, size.width, measurementUnits), zTicks = rulerTicks(view.y, view.scale, size.height, measurementUnits);
  function fitPlan(selection = false) {
    const next = framePlan(selection ? selectionPoints : [...visible.nodes, ...(visible.stairs ?? []).flatMap(stair => stairFootprint(displayDocument, stair)), ...visible.walls.flatMap(wall => wallFootprint(displayDocument, wall)), ...modelPoints(modelImages)], size); if (next) setView(next);
  }
  const framedRequest = useRef<typeof frameRequest>(null);
  useEffect(() => {
    if (!enabled || !frameRequest || framedRequest.current === frameRequest) return;
    // Selection's level is reconciled by the editor first; hidden plans never consume a request.
    if (!entityPoints(active, frameRequest.id).length) return;
    const next = framePlan(doc.walls.some(w => w.id === frameRequest.id) ? wallFootprint(doc, doc.walls.find(w => w.id === frameRequest.id)!) : entityPoints(doc, frameRequest.id), size);
    if (next) { framedRequest.current = frameRequest; setView(next); }
  }, [frameRequest, enabled, activeLevelId, size.width, size.height, doc, setView]);
  const viewGroup: DesignContextGroup = { label: 'Design plan navigation', color: 'text-cyan-700 dark:text-cyan-300', actions: [
    { label: labelsVisible ? 'Hide Object Labels' : 'Show Object Labels', icon: Tags, active: labelsVisible, run: () => (onShowObjectLabelsChange ?? setLocalLabels)(!labelsVisible) },
    { label: measurementsVisible ? 'Hide Dimensions' : 'Show Dimensions', icon: Ruler, active: measurementsVisible, run: toggleMeasurements },
    { label: 'Fit Plan', icon: Maximize, disabled: !visible.nodes.length && !modelImages.length, run: () => fitPlan() },
    { label: 'Zoom to Selection', icon: Focus, disabled: !selectionPoints.length, run: () => fitPlan(true) },
    { label: 'Reset View', icon: RotateCcw, run: () => setView({ x: 80, y: 80, scale: 45 }) },
  ] };
  const groupActions: DesignContextGroup['actions'] = [];
  if (onGroupChange) {
    const matched = groups.find(group => boxed.size === group.entityIds.length && modelIds.length === group.markerIds.length
      && group.entityIds.every(id => boxed.has(id)) && group.markerIds.every(id => modelIds.includes(id)));
    if (matched) groupActions.unshift({
      label: 'Ungroup',
      icon: Ungroup,
      disabled,
      run: () => onGroupChange(groups.filter(group => group.id !== matched.id)),
    });
    groupActions.unshift({
      label: 'Create ThreeD Group',
      icon: Group,
      disabled: disabled || tool !== 'objects' || Boolean(matched) || boxed.size + modelIds.length < 2,
      run: () => {
        const name = window.prompt('Name this ThreeD Group')?.trim();
        if (!name) return;
        if (name.length > 120) { onMessage('Use a group name of 120 characters or fewer.'); return; }
        onGroupChange([...groups, { id: crypto.randomUUID(), name, entityIds: [...boxed], markerIds: modelIds }]);
        onMessage('ThreeD Group created. Save Project to keep it.');
      },
    });
  }
  const selectionCount = tool === 'objects' ? boxed.size + modelIds.length : 0;
  const outlines = selectionCount ? [
    ...(visible.stairs ?? []).filter(s => boxed.has(s.id)).map(s => stairFootprint(displayDocument, s)),
    ...visible.walls.filter(w => boxed.has(w.id)).map(w => wallFootprint(displayDocument, w)),
    ...[...visible.floors, ...visible.roofs].filter(shape => boxed.has(shape.id)).map(shape => shape.vertices.map(id => nodes.get(id)!)),
    ...visible.openings.filter(o => boxed.has(o.id)).map(o => openingFootprint(displayDocument, o)),
    ...visible.roofOpenings.filter(o => boxed.has(o.id)).map(o => roofOpeningFootprint(displayDocument, o)),
    ...displayedImages.filter(image => modelIds.includes(image.id)).map(image => {
      const [a, b, c, d] = modelPoints([image]);
      return [a, b, d, c];
    }),
  ] : [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity;
  for (const outline of outlines) for (const point of outline) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
  }
  const handleX = Number.isFinite(minX) ? view.x + (minX + maxX) / 2 * view.scale - 102 : size.width / 2 - 102;
  const handleY = Number.isFinite(minZ) ? view.y + minZ * view.scale - 46 : size.height / 2;
  const groupPicker = tool === 'objects' && groups.length > 0 && <select aria-label="Select ThreeD Group" value="" onChange={event => {
    const group = groups.find(item => item.id === event.target.value);
    if (group) { setBoxed(new Set(group.entityIds)); setModelIds(group.markerIds); }
  }}><option value="">ThreeD Groups</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select>;
  const sharedEnds = (editableWall ? [editableWall.start, editableWall.end] : editableFloor?.vertices ?? []).filter(id =>
    doc.walls.some(w => w.id !== editableWall?.id && (w.start === id || w.end === id))
    || doc.stairs?.some(s => s.anchor === id)
    || [...doc.floors, ...doc.roofs].some(shape => shape.id !== editableFloor?.id && shape.vertices.includes(id)));
  function detachShape() {
    if (!sharedEnds.length) return;
    const copies = new Map(sharedEnds.map(id => [id, { ...doc.nodes.find(n => n.id === id)!, id: makeId() }]));
    try {
      onCommit(validateDesign({
        ...doc,
        nodes: [...doc.nodes, ...copies.values()],
        floors: doc.floors.map(f => f.id === editableFloor?.id ? { ...f, vertices:f.vertices.map(id => copies.get(id)?.id ?? id) } : f),
        walls: doc.walls.map(w => w.id === editableWall?.id ? {
          ...w,
          start: copies.get(w.start)?.id ?? w.start,
          end: copies.get(w.end)?.id ?? w.end,
        } : w),
      }));
      setActivePoint(null);
      onMessage(editableFloor ? `${floorLabel} detached.` : 'Wall detached.');
    } catch (error) { onMessage((error as Error).message); }
  }
  const wallControls = (tool === 'wall' || editableWall) && <>
    <DesignAction label="Connect Wall Endpoints" aria-pressed={connectWalls} variant={connectWalls ? 'secondary' : 'outline'} onClick={() => setConnectWalls(!connectWalls)}><Link2 aria-hidden="true" className="size-3.5" /></DesignAction>
    {editableWall && <DesignAction label="Detach Wall" disabled={!sharedEnds.length} onClick={detachShape}><Unlink2 aria-hidden="true" className="size-3.5" /></DesignAction>}
  </>;
  const floorControls = (isFloorTool(tool) || editableFloor) && <>
    <DesignAction label={`Connect ${floorLabel} Corners`} aria-pressed={connectFloors} onClick={() => setConnectFloors(!connectFloors)}><Link2 className="size-3.5" /></DesignAction>
    {editableFloor && <>
      <DesignAction label={`Detach ${floorLabel}`} disabled={!sharedEnds.length} onClick={detachShape}><Unlink2 className="size-3.5" /></DesignAction>
      <DesignAction label={`Split ${floorLabel}`} aria-pressed={Boolean(splitStart)} disabled={!activePoint?.startsWith('node:') || editableFloor.vertices.length < 4} onClick={() => {
        setSplitStart(splitStart ? null : activePoint!.slice(5));
        if (!splitStart) onMessage(`Click a non-adjacent corner to split the ${floorLabel}.`);
      }}><Scissors className="size-3.5" /></DesignAction>
    </>}
  </>;
  const removeButton = <DesignAction label="Remove Point" disabled={!toolbarRemoval || toolbarRemoval.disabled} onClick={() => toolbarRemoval?.run()}><CircleMinus className="size-3.5" aria-hidden="true" /></DesignAction>;
  const groupControls = groupActions.map(action => <DesignAction key={action.label} label={action.label} disabled={action.disabled} onClick={action.run}><action.icon className="size-3.5" aria-hidden="true" /></DesignAction>);
  const viewActions = <div role="group" aria-label={viewGroup.label} className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/40 p-1 [&_svg]:text-cyan-700 dark:[&_svg]:text-cyan-300">{viewGroup.actions.map(action => <DesignAction key={action.label} label={action.label} disabled={action.disabled} aria-pressed={action.active} variant={action.active ? 'secondary' : 'outline'} onClick={action.run}><action.icon className="h-3.5 w-3.5" /></DesignAction>)}</div>;
  return <section aria-label="Design plan canvas" className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#091423] ${embedded ? '' : 'rounded-lg border border-white/10'}`}>
    {cutoutWall && <WallCutoutEditor key={cutoutWall.id + (selectedWallCutout?.id ?? '')} doc={doc} wall={cutoutWall} opening={selectedWallCutout} units={measurementUnits}
      onCancel={() => onDrawComplete(selectedWallCutout?.id ?? cutoutWall.id)}
      onFinish={(next,id) => { onCommit(next); onDrawComplete(id); onMessage('Wall Cutout finished. Save Project to keep it.'); }} />}
    {embedded && enabled && <div data-testid="design-canvas-tools" role="toolbar" aria-label="Design drawing and view tools" className="threed-workspace-panel threed-scene-panel-surface absolute z-10 flex max-w-[calc(100%-40px)] flex-nowrap items-center gap-1 overflow-x-auto [&>nav]:flex-nowrap [&>nav]:shrink-0 rounded-md border p-1 shadow-md" style={{ right: 8, top: RULER_SIZE + 8 }} onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>{drawingActions ? drawingActions(groupControls) : groupControls}{wallControls}{floorControls}{removeButton}{groupPicker}{viewActions}</div>}
    {!embedded && <div data-testid="design-plan-header" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs">
      <span className="font-semibold">2D Plan · {doc.levels.find(level => level.id === activeLevelId)?.name ?? 'No active Level'} · X / Z · {measurementUnits === 'metric' ? `${Number((gridFeet * 12 * INCH).toFixed(4))} m` : `${gridFeet} ft`} grid</span>
      <div className="flex items-center gap-2"><span>{Number(view.scale.toFixed(2))} px/m</span>{groupControls}{wallControls}{floorControls}{removeButton}{viewActions}</div>
    </div>}
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
    <ContextMenu onOpenChange={open => { if (!open) setMenuPoint(null); }}><ContextMenuTrigger asChild><svg onContextMenuCapture={event => { const key = pointKey(event.target as Element); setMenuPoint(key); setActivePoint(key); }} ref={svg} data-testid="home-plan" aria-label="ThreeD Design 2D plan" tabIndex={0} width="100%" height="100%" className="block min-h-0 w-full flex-1 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
      onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { setMarquee(null); cancelModel(); gesture.current = null; setPoints([]); setHover(null); onPreview(null); onMessage('Gesture cancelled.'); }}
      onLostPointerCapture={() => { setGroupOffset(null); setMarquee(null); if (gesture.current) { if (gesture.current.wallPress?.started) setPoints([]); gesture.current = null; setHover(null); onPreview(null); } }}
      onPointerLeave={() => { if (!gesture.current && (tool === 'door' || tool === 'window' || tool === 'cutout' || tool === 'skylight')) onPreview(null); }}
      >
      <defs>{[...visible.walls, ...visible.floors, ...visible.roofs, ...visible.openings, ...visible.roofOpenings, ...(visible.stairs ?? [])].filter(entity => entity.appearance?.texture).map(entity =>
        <pattern key={entity.id} id={patternId + '-' + entity.id} width={1} height={1} patternUnits="userSpaceOnUse">
          <rect width={1} height={1} fill={entity.appearance?.color ?? '#ffffff'} />
          <image width={1} height={1} href={entity.appearance?.texture} preserveAspectRatio="none" style={{ mixBlendMode: 'multiply' }} />
        </pattern>)}<pattern id={patternId} width={grid} height={grid} patternUnits="userSpaceOnUse" x={view.x % grid} y={view.y % grid}><path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="#204259" strokeWidth=".7" /></pattern></defs>
      <rect width={size.width} height={size.height} fill={`url(#${patternId})`} />
      <g pointerEvents="none" stroke="#4d91a6" strokeWidth="1"><line x1={view.x} x2={view.x} y1={RULER_SIZE} y2={size.height}/><line y1={view.y} y2={view.y} x1={RULER_SIZE} x2={size.width}/></g>
      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {terrain && <g data-plan-terrain={terrain.placement.terrainId} pointerEvents="none" transform={`translate(${terrain.placement.centerXM} ${terrain.placement.centerZM}) rotate(${-terrain.placement.rotationYDeg}) scale(${terrain.placement.scale})`}>
          <title>{`${terrain.name} Terrain elevation plan`}</title>
          <rect x={-terrain.definition.widthM / 2} y={-terrain.definition.lengthM / 2} width={terrain.definition.widthM} height={terrain.definition.lengthM} fill={terrain.definition.appearance.color} fillOpacity=".8" />
          {terrainCells.map((cell, index) => <rect key={index} x={cell.x} y={cell.z} width={cell.width} height={cell.length} fill={cell.height >= 0 ? '#f8fafc' : '#091423'} fillOpacity={Math.min(.48, Math.abs(cell.height) / terrainRelief * .48)} />)}
          <rect x={-terrain.definition.widthM / 2} y={-terrain.definition.lengthM / 2} width={terrain.definition.widthM} height={terrain.definition.lengthM} fill="none" stroke="#86efac" strokeWidth={2 / (view.scale * terrain.placement.scale)} />
        </g>}
        {hover && points.length > 0 && <g pointerEvents="none" stroke="#38bdf8" strokeWidth={1 / view.scale} strokeDasharray={`${4 / view.scale} ${4 / view.scale}`}>
          {active.nodes.some(node => Math.abs(node.x - hover.x) < .000001) && <line x1={hover.x} x2={hover.x} y1={(RULER_SIZE - view.y) / view.scale} y2={(size.height - view.y) / view.scale}/>}
          {active.nodes.some(node => Math.abs(node.z - hover.z) < .000001) && <line y1={hover.z} y2={hover.z} x1={(RULER_SIZE - view.x) / view.scale} x2={(size.width - view.x) / view.scale}/>}
        </g>}
        {visible.floors.map(floor => <polygon key={floor.id} data-entity={floor.id} data-surface={floor.surface} points={polygon(floor.vertices.map(id => nodes.get(id)!))} fill={paint(floor)} fillOpacity={.55} stroke={(groupSelected(floor.id) || selected === floor.id) ? '#36b8c8' : '#7694b8'} strokeWidth={1 / view.scale} />)}
        {displayedImages.map(image => {
          const [a,b,c] = image.corners.map(p => ({ x: p.x * metersPerSceneUnit, z: p.z * metersPerSceneUnit }));
          if (![a.x,a.z,b.x,b.z,c.x,c.z].every(Number.isFinite)) return null;
          const imageAvailable = image.url !== null && failedModelImages[image.id] !== image.url;
          const corners = [a, b, {
            x: b.x + c.x - a.x,
            z: b.z + c.z - a.z,
          }, c];
          const interaction = {
            role: 'button',
            tabIndex: enabled && !disabled ? 0 : -1,
            'aria-label': `Select Project Model ${image.id}`,
            onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
              if (!enabled || disabled || !['Enter', ' '].includes(event.key)) return;
              event.preventDefault();
              event.stopPropagation();
              onModelSelect?.(image.id);
            },
            onPointerDown: (event: PointerEvent<SVGElement>) => startModel(event, image.id),
            onPointerEnter: () => setHoveredModelId(image.id),
            onPointerLeave: () => setHoveredModelId(null),
          };
          return <g key={image.id} data-plan-model={image.id}>
            <title>{image.name ?? `Model ${image.id}`}</title>
            {imageAvailable ? <image {...interaction} href={image.url!} x={0} y={0} width={1} height={1} preserveAspectRatio="none"
              transform={`matrix(${b.x-a.x} ${b.z-a.z} ${c.x-a.x} ${c.z-a.z} ${a.x} ${a.z})`} style={{ cursor: 'pointer' }}
              onError={() => setFailedModelImages(current => ({
                ...current,
                [image.id]: image.url!,
              }))} /> : <g>
              <polygon {...interaction} data-model-footprint={image.id} points={polygon(corners)}
                fill="#38bdf8" fillOpacity=".12" stroke="#7dd3fc" strokeWidth={1.5 / view.scale} style={{ cursor: 'pointer' }} />
            </g>}
            {tool === 'objects' && modelIds.includes(image.id) && <polygon points={polygon(corners)} fill="#22d3ee" fillOpacity=".24" stroke="#22d3ee" strokeWidth={2 / view.scale} pointerEvents="none" />}
            {labelsVisible && (selectedModelId === image.id || hoveredModelId === image.id) && <text x={Math.min(...corners.map(point => point.x))} y={Math.min(...corners.map(point => point.z)) - 6 / view.scale}
                fill="#e0f2fe" stroke="#091423" strokeWidth={3 / view.scale} paintOrder="stroke" fontSize={11 / view.scale} pointerEvents="none">
                {image.name ?? `Model ${image.id}`}
              </text>}
          </g>;
        })}
        {terrain && <g data-plan-terrain-outline={terrain.placement.terrainId} pointerEvents="none" transform={`translate(${terrain.placement.centerXM} ${terrain.placement.centerZM}) rotate(${-terrain.placement.rotationYDeg}) scale(${terrain.placement.scale})`}>
          <rect x={-terrain.definition.widthM / 2} y={-terrain.definition.lengthM / 2} width={terrain.definition.widthM} height={terrain.definition.lengthM} fill="none" stroke="#a3e635" strokeWidth={2 / (view.scale * terrain.placement.scale)} strokeDasharray={`${6 / (view.scale * terrain.placement.scale)} ${4 / (view.scale * terrain.placement.scale)}`} />
        </g>}
        {displayedImages.filter(image => image.id === selectedModelId).map(image => {
          const [a, b, c] = image.corners;
          const corners = [a, b, {
            x: b.x + c.x - a.x,
            z: b.z + c.z - a.z,
          }, c]
            .map(point => ({
              x: point.x * metersPerSceneUnit,
              z: point.z * metersPerSceneUnit,
            }));
          return <g key={`selected-${image.id}`}><polygon data-selected-model={image.id} points={polygon(corners)}
            fill="none" stroke="#22d3ee" strokeWidth={2 / view.scale} pointerEvents="none" />
            {selectedModel?.id === image.id && !selectedModel.locked && onSaveModel && !disabled && !modelBusy && <circle data-model-resize={image.id} cx={corners[2].x} cy={corners[2].z} r={6 / view.scale} fill="#facc15" stroke="#101827" strokeWidth={1 / view.scale} style={{ cursor: 'nwse-resize' }} onPointerDown={event => startModel(event, image.id, true)} />}
          </g>;
        })}
        {(visible.stairs ?? []).map(stair => {
          const { count, run, rise } = stairLayout(stair);
          const anchor = nodes.get(stair.anchor)!;
          const half = stair.width / 2;
          const ink = selected === stair.id || groupSelected(stair.id) ? '#36b8c8' : '#e2e8f0';
          const from = rise > 0 ? run * .15 : run * .85;
          const to = run - from;
          const head = Math.min(run * .16, half * .42) * Math.sign(rise);
          return <g key={stair.id} transform={`translate(${anchor.x} ${anchor.z}) rotate(${stair.direction})`} data-entity={stair.id} data-stairs={stair.id}>
            <rect width={run} y={-half} height={stair.width} fill={paint(stair)} stroke={ink} strokeWidth={1.5 / view.scale} />
            <g stroke={ink} strokeWidth={1 / view.scale} pointerEvents="none">
              {Array.from({ length: count - 1 }, (_, index) => {
                const x = (index + 1) * stair.stepLength;
                return <line key={index} x1={x} x2={x} y1={-half} y2={half} />;
              })}
              <path d={`M ${from} 0 H ${to} m ${-head} ${-Math.abs(head)} l ${head} ${Math.abs(head)} l ${-head} ${Math.abs(head)}`} fill="none" strokeWidth={2 / view.scale} />
            </g>
          </g>;
        })}
        {visible.roofs.map(roof => { const points = roof.vertices.map(id => nodes.get(id)!); return <g key={roof.id} data-entity={roof.id} data-roof={roof.kind}><polygon points={polygon(points)} fill={paint(roof)} fillOpacity={roof.appearance?.color || roof.appearance?.texture ? 1 : (groupSelected(roof.id) || selected === roof.id) ? .18 : .06} stroke={groupSelected(roof.id) || selected === roof.id ? '#facc15' : planObjectColor(roof)} strokeWidth={3 / view.scale} pointerEvents="stroke" /></g>; })}
        {visible.walls.map(wall => <g key={wall.id}><polygon data-entity={wall.id} points={polygon(wallFootprint(displayDocument, wall))} fill={paint(wall)} stroke={(groupSelected(wall.id) || selected === wall.id) ? '#36b8c8' : '#5b8baf'} strokeWidth={1 / view.scale} /><line data-entity={wall.id} x1={nodes.get(wall.start)!.x} y1={nodes.get(wall.start)!.z} x2={nodes.get(wall.end)!.x} y2={nodes.get(wall.end)!.z} stroke="transparent" strokeWidth={Math.max(wall.thickness, 10 / view.scale)} />{measurementsVisible && <text data-measurement={wall.id} x={(nodes.get(wall.start)!.x + nodes.get(wall.end)!.x) / 2} y={(nodes.get(wall.start)!.z + nodes.get(wall.end)!.z) / 2 - .2} fill="#dde8f6" fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{formatPlanLength(distance(nodes.get(wall.start)!, nodes.get(wall.end)!), measurementUnits)}</text>}</g>)}
        {labelsVisible && [...visible.walls, ...visible.floors, ...visible.roofs, ...(visible.stairs ?? [])].filter(entity => entity.name).map(entity => {
          const ring = 'anchor' in entity ? stairFootprint(displayDocument, entity) : ("vertices" in entity ? entity.vertices : [entity.start, entity.end]).map(id => nodes.get(id)!);
          const x = ring.reduce((sum,p) => sum+p.x,0)/ring.length, z = ring.reduce((sum,p) => sum+p.z,0)/ring.length;
          return <text key={entity.id} x={x} y={z + 12/view.scale} fill="#fff" stroke="#101827" strokeWidth={3/view.scale} paintOrder="stroke" fontSize={12/view.scale} textAnchor="middle" pointerEvents="none">{entity.name}</text>;
        })}
        {visible.openings.map(opening => {
          const footprint = openingFootprint(displayDocument, opening), host = displayDocument.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(displayDocument, host);
          const a = frame.point(opening.offset), b = frame.point(opening.offset + opening.width), color = planObjectColor(opening);
          const width = opening.width;
          const sign = opening.operation === 'outward' ? 1 : -1;
          const hinged = opening.operation !== 'slidingGlass' && opening.operation !== 'slidingWood';
          const open = doorIsOpen(opening);
          return <g key={opening.id} data-entity={opening.id} data-opening={opening.kind}><polygon points={polygon(footprint)} fill={paint(opening)} stroke={groupSelected(opening.id) || selected === opening.id ? '#facc15' : color} strokeWidth={1.5 / view.scale} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke={color} strokeWidth={3 / view.scale} strokeDasharray={opening.kind === 'door' && !opening.operation ? `${5 / view.scale} ${3 / view.scale}` : undefined} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke="transparent" strokeWidth={Math.max(host.thickness, 12 / view.scale)} />{opening.kind === 'door' && (opening.operation || opening.isOpen !== undefined) && <g data-door-operation={opening.operation ?? 'inward'} transform={'translate(' + a.x + ' ' + a.z + ') rotate(' + Math.atan2(frame.dz,frame.dx)*180/Math.PI + ')'} fill="none" stroke={color} strokeWidth={1.5/view.scale}>
            {opening.operation === 'garage' ? <rect x={0} y={open ? -opening.height : -host.thickness/4}
              width={width} height={open ? opening.height : host.thickness/2}
              strokeDasharray={open ? 4/view.scale : undefined} /> : hinged ? <>
              <line x1={0} y1={0} x2={open ? 0 : width} y2={open ? sign * width : 0} />
              {open && <path d={['M',width,0,'A',width,width,0,0,sign > 0 ? 1 : 0,0,sign*width].join(' ')} strokeDasharray={3/view.scale} />}
            </> : <g stroke={color} strokeWidth={3/view.scale}>
              <line x1={0} x2={width/2} y1={-host.thickness/4} y2={-host.thickness/4} />
              <line x1={open ? 0 : width/2} x2={open ? width/2 : width} y1={host.thickness/4} y2={host.thickness/4} />
            </g>}
          </g>}{labelsVisible && <text x={(a.x + b.x) / 2} y={(a.z + b.z) / 2 + .35} fill={color} fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{opening.name ?? (opening.kind === 'wall-cutout' ? 'Wall Cutout' : opening.kind === 'door' ? (opening.operation === 'garage' ? 'Garage Door' : 'Door') : 'Window')}</text>}</g>;
        })}
        {visible.roofOpenings.map(opening => { const points = roofOpeningFootprint(displayDocument, opening), center = points.reduce((sum, p) => ({ x: sum.x + p.x / points.length, z: sum.z + p.z / points.length }), { x: 0, z: 0 }); const color = (groupSelected(opening.id) || selected === opening.id) ? '#facc15' : planObjectColor(opening); return <g key={opening.id} data-entity={opening.id} data-roof-opening={opening.kind}><polygon points={polygon(points)} fill={paint(opening)} fillOpacity={opening.kind === 'skylight' ? .65 : .9} stroke={color} strokeWidth={2 / view.scale} />{labelsVisible && <text x={center.x} y={center.z} fill={color} fontSize={10 / view.scale} textAnchor="middle" pointerEvents="none">{opening.name ?? (opening.kind === 'skylight' ? 'Skylight' : 'Cutout')}</text>}</g>; })}
        {measurementsVisible && <g pointerEvents="none" fill="#dde8f6" fontSize={11 / view.scale} textAnchor="middle">
          {planDimensionChains([
            ...visible.walls.flatMap(wall => [nodes.get(wall.start)!, nodes.get(wall.end)!]),
            ...(visible.stairs ?? []).flatMap(stair => stairFootprint(displayDocument, stair)),
            ...visible.floors.flatMap(floor => floor.vertices.map(id => nodes.get(id)!)),
          ], view.scale, measurementUnits)}
          {[...visible.floors, ...visible.roofs].map(entity => {
            const points = entity.vertices.map(id => nodes.get(id)!);
            const xs = points.map(p => p.x), zs = points.map(p => p.z);
            const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
            return <text key={entity.id} data-measurement={entity.id} x={(minX + maxX) / 2} y={maxZ + .3}>{formatPlanLength(maxX-minX, measurementUnits)} × {formatPlanLength(maxZ-minZ, measurementUnits)}</text>;
          })}
          {(visible.stairs ?? []).map(stair => {
            const points = stairFootprint(displayDocument, stair);
            return <text key={stair.id} data-measurement={stair.id} x={(points[0].x + points[2].x) / 2} y={Math.max(...points.map(p => p.z)) + .3}>{formatPlanLength(stairLayout(stair).run, measurementUnits)} × {formatPlanLength(stair.width, measurementUnits)}</text>;
          })}
          {visible.openings.map(opening => { const points = openingFootprint(displayDocument, opening); return <text key={opening.id} data-measurement={opening.id} x={points.reduce((sum,p)=>sum+p.x/points.length,0)} y={Math.max(...points.map(p=>p.z))+.65}>{formatPlanLength(opening.width, measurementUnits)} × {formatPlanLength(opening.height, measurementUnits)}</text>; })}
          {visible.roofOpenings.map(opening => { const points = roofOpeningFootprint(displayDocument, opening); return <text key={opening.id} data-measurement={opening.id} x={points.reduce((sum,p)=>sum+p.x/points.length,0)} y={Math.max(...points.map(p=>p.z))+.3}>{formatPlanLength(opening.width, measurementUnits)} × {formatPlanLength(opening.length, measurementUnits)}</text>; })}
          {modelImages.map(image => { const [a,b,c] = image.corners; return <text key={image.id} data-measurement={image.id} x={(b.x+c.x)/2*metersPerSceneUnit} y={Math.max(a.z,b.z,c.z,b.z+c.z-a.z)*metersPerSceneUnit+.3}>{formatPlanLength(distance(a,b)*metersPerSceneUnit,measurementUnits)} × {formatPlanLength(distance(a,c)*metersPerSceneUnit,measurementUnits)}</text>; })}
        </g>}
        {editableCutout && roofOpeningFootprint(displayDocument, displayDocument.roofOpenings.find(o => o.id === editableCutout.id) ?? editableCutout).map((a, index, ring) => {
          const b = ring[(index + 1) % ring.length];
          return <g key={index}>
            <g data-cutout-vertex={index} data-insert="" transform={`translate(${(a.x + b.x)/2} ${(a.z + b.z)/2}) scale(${1/view.scale})`} style={{cursor:'crosshair'}}>
              <title>Add cutout corner</title><circle r={7} fill="#172033" stroke="#67e8f9" /><path d="M-4 0h8 M0 -4v8" stroke="#67e8f9" />
            </g>
            <circle data-cutout-vertex={index} cx={a.x} cy={a.z} r={5/view.scale} fill={activePoint === 'cutout:' + index ? '#f472b6' : '#facc15'} style={{cursor:'move'}}><title>Drag to move. Shift-click to remove this corner.</title></circle>
          </g>;
        })}
        {editableStair && stairHandles && stairHandleNames.map(handle => {
          const point = stairHandles[handle];
          const label = handle === 'end' ? 'Drag to change Stairs direction and run'
            : handle === 'width' ? 'Drag to change Stairs width'
            : 'Drag this corner to resize the Stairs around the opposite corner';
          return <circle key={handle} data-stair-handle={handle} data-entity={editableStair.id} aria-label={label}
            cx={point.x} cy={point.z} r={6 / view.scale} stroke="#101827" strokeWidth={1 / view.scale}
            fill={activePoint === 'stair:' + handle ? '#f472b6' : handle === 'end' ? '#67e8f9' : '#facc15'} style={{ cursor: 'grab' }}><title>{label}</title></circle>;
        })}
        {editableWall && wallMidpoint && <g data-wall-split={editableWall.id} transform={'translate(' + wallMidpoint.x + ' ' + wallMidpoint.z + ') scale(' + 1 / view.scale + ')'} style={{cursor:'crosshair'}}>
          <title>Add a point to split this Wall. Click or drag the shared point.</title>
          <circle r={8} fill="#172033" stroke="#67e8f9" strokeWidth={1.5} />
          <path d="M-4 0h8 M0 -4v8" stroke="#67e8f9" strokeWidth={2} />
        </g>}
        {polygonShape?.vertices.map((key, index, vertices) => {
          const a = nodes.get(key), b = nodes.get(vertices[(index + 1) % vertices.length]);
          if (!a || !b) return null;
          return <g key={key} data-roof-edge={editableRoof ? index : undefined} data-floor-edge={editableFloor ? index : undefined} transform={`translate(${(a.x + b.x) / 2} ${(a.z + b.z) / 2}) scale(${1 / view.scale})`} style={{ cursor: 'crosshair' }}>
            <title>Add a {editableFloor ? floorLabel.toLowerCase() : 'roof'} corner here. Click or drag to place it.</title>
            <circle r={8} fill="#172033" stroke="#67e8f9" strokeWidth={1.5} />
            <path d="M-4 0h8 M0 -4v8" fill="none" stroke="#67e8f9" strokeWidth={2} />
          </g>;
        })}
        {handles.map(key => <circle key={key} data-node={key} cx={nodes.get(key)!.x} cy={nodes.get(key)!.z} r={6 / view.scale} fill={activePoint === 'node:' + key ? '#f472b6' : '#facc15'} stroke="#101827" strokeWidth={1 / view.scale}><title>{wall ? "Drag endpoint" : "Drag to move. Shift-click to remove this corner."}</title></circle>)}
        {!!points.length && <><polyline points={polygon(hover ? [...points, hover] : points)} fill={tool !== 'wall' ? '#15b8a633' : 'none'} stroke="#2dd4bf" strokeWidth={2 / view.scale} strokeDasharray={`${6 / view.scale} ${4 / view.scale}`} pointerEvents="none" />{points.map((p, index) => <circle key={index} cx={p.x} cy={p.z} r={4 / view.scale} fill={activePoint === 'draft:' + index ? '#f472b6' : '#2dd4bf'} data-draft-corner={index} pointerEvents={tool === "wall" ? "none" : "auto"} />)}{hover && <circle cx={hover.x} cy={hover.z} r={6 / view.scale} fill="none" stroke={hover.nodeId ? '#facc15' : '#2dd4bf'} strokeWidth={2 / view.scale} pointerEvents="none" />}</>}
        {outlines.map((points, index) => <polygon key={index} data-selection-outline="" points={polygon(points)} pointerEvents="none"
          fill="#fbbf24" fillOpacity=".24" stroke="#fde047" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeDasharray="7 2" />)}
      </g>
      <g data-testid="design-rulers" pointerEvents="none" fontSize="10" fill="#cbd5e1">
        <title>Project coordinates in {measurementUnits === 'metric' ? 'metres' : 'feet'}. +X points right; +Z points down. Cyan axes mark zero.</title>
        <rect width={size.width} height={RULER_SIZE} fill="#111e30"/><rect width={RULER_SIZE} height={size.height} fill="#111e30"/>
        {xTicks.map(tick => <g key={tick.index} data-axis="x" data-world={tick.world} data-pixel={tick.pixel}><line x1={tick.pixel} x2={tick.pixel} y1={tick.major ? 16 : 22} y2={28} stroke={tick.index === 0 ? '#22d3ee' : '#64748b'}/>{tick.major && <text x={tick.pixel + 3} y={12}>{tick.label}</text>}</g>)}
        {zTicks.map(tick => <g key={tick.index} data-axis="z" data-world={tick.world} data-pixel={tick.pixel}><line y1={tick.pixel} y2={tick.pixel} x1={tick.major ? 16 : 22} x2={28} stroke={tick.index === 0 ? '#22d3ee' : '#64748b'}/>{tick.major && <text transform={`translate(12 ${tick.pixel + 3}) rotate(-90)`}>{tick.label}</text>}</g>)}
        <rect width={28} height={28} fill="#111e30"/><text x={3} y={11} fill="#22d3ee">X +</text><text x={3} y={24} fill="#22d3ee">Z +</text>
      </g>
      {selectionCount > 0 && !marquee && <g data-selection-handle="move" transform={`translate(${Math.max(RULER_SIZE + 4, Math.min(handleX, size.width - 212))} ${Math.max(RULER_SIZE + 62, Math.min(handleY, size.height - 52))})`} style={{ cursor: 'move' }}>
        <title>Drag to move the selected objects on X and Z</title>
        <rect width="204" height="38" rx="7" fill="#fde047" stroke="#172033" strokeWidth="2" />
        <text x="12" y="24" fill="#172033" fontSize="14" fontWeight="700">Drag to move ({selectionCount} selected)</text>
      </g>}
      {marquee && <rect data-selection-box="" pointerEvents="none"
        x={view.x + Math.min(marquee.start.x, marquee.end.x) * view.scale}
        y={view.y + Math.min(marquee.start.z, marquee.end.z) * view.scale}
        width={Math.abs(marquee.end.x - marquee.start.x) * view.scale}
        height={Math.abs(marquee.end.z - marquee.start.z) * view.scale}
        fill="#22d3ee" fillOpacity={0.12} stroke="#22d3ee" strokeDasharray="5 3" />}
    </svg></ContextMenuTrigger>
    <ContextMenuContent aria-label="2D Design Tools" className="z-[5000] w-60" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      {menuRemoval && <><ContextMenuItem disabled={menuRemoval.disabled} onSelect={menuRemoval.run} aria-label="Remove Point"><CircleMinus className="size-3.5" aria-hidden="true" />Remove Point</ContextMenuItem><ContextMenuSeparator /></>}
      {[...contextActions.map(group => ({ ...group, actions: group.actions.flatMap(action => action.label === 'Select Objects' ? [action, ...groupActions] : [action]) })), viewGroup].map((group, index) => <div key={group.label}>
        {index > 0 && <ContextMenuSeparator className="my-0.5" />}
        {group.actions.map(action => <ContextMenuItem key={action.label} disabled={action.disabled || !enabled} onSelect={action.run} className={`py-0.5 ${action.active ? 'bg-accent/50' : ''}`}>
          <action.icon aria-hidden="true" className={`size-4 ${group.color}`} /><span>{action.label}</span>{action.active && <><Check aria-hidden="true" className="ml-auto size-3.5" /><span className="sr-only">Selected</span></>}
        </ContextMenuItem>)}
      </div>)}
    </ContextMenuContent></ContextMenu>
    {onToggleLevel && enabled && <nav aria-label="Design levels" className="threed-workspace-panel threed-scene-panel-surface absolute bottom-6 left-9 z-10 flex max-w-[calc(100%-44px)] items-center gap-1 overflow-x-auto rounded-md border p-1 shadow-md" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      {[...doc.levels].sort((a, b) => a.elevation - b.elevation).map(level => {
        const isVisible = shownLevels.includes(level.id);
        const isActive = isVisible && level.id === activeLevelId;
        const VisibilityIcon = isVisible ? Eye : EyeOff;
        return <div key={level.id} role="group" aria-label={level.name}
          className={`flex shrink-0 items-center rounded-md border ${isActive ? 'border-cyan-600 bg-cyan-100 text-cyan-900 dark:border-cyan-400 dark:bg-cyan-400/20 dark:text-cyan-100' : 'border-border'}`}>
          <Button type="button" size="sm" variant="ghost" disabled={disabled || !onChooseLevel}
            className={`h-7 gap-1.5 rounded-r-none px-2 text-xs ${isVisible ? '' : 'text-muted-foreground hover:text-muted-foreground disabled:opacity-100'}`}
            aria-current={isActive ? 'true' : undefined} aria-label={`Set ${level.name} as active Level`}
            title={`Edit ${level.name}`} onClick={() => onChooseLevel?.(level.id)}>
            {level.name}
            {isActive && <span className="text-[10px] font-semibold">Active</span>}
          </Button>
          <Button type="button" size="icon" variant="ghost" className="size-7 rounded-l-none border-l border-current/20"
            aria-label={`Show ${level.name} in 2D and 3D`} aria-pressed={isVisible}
            title={`${isVisible ? 'Hide' : 'Show'} ${level.name} in 2D and 3D`}
            onClick={() => onToggleLevel(level.id)}>
            <VisibilityIcon aria-hidden="true" className={isVisible ? 'size-3.5' : 'size-3.5 text-muted-foreground'} />
          </Button>
        </div>;
      })}
    </nav>}
    </div>
    {editableStair && <p className="shrink-0 border-t px-3 py-2 text-xs">
      Drag a corner to resize the Stairs, the cyan end handle to turn them, or the body to move them.
    </p>}
    {tool === 'stairs' && !editingHidden && <p className="shrink-0 border-t px-3 py-2 text-xs">
      {points.length ? 'Click the end to set the direction and length. Escape cancels.' : 'Click the starting point of the Stairs.'}
    </p>}
    {((isFloorTool(tool) || tool === 'roof' || tool === 'cutout') && !editingHidden) && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#111a28] px-3 py-2 pb-6 text-xs" data-testid={`home-${tool}-draft`}>
      <span>{points.length} corners. Shift-click a corner to remove it. Choose at least 3; Enter or the first corner finishes. Escape cancels.</span>
      {tool === 'patio' && <label className="flex items-center gap-2">Surface
        <select className="rounded border border-white/20 bg-[#111a28] px-2 py-1" value={paving} disabled={!enabled || disabled}
          onChange={event => setPaving(event.target.value === 'driveway' ? 'driveway' : 'patio')}>
          <option value="patio">Patio</option>
          <option value="driveway">Driveway</option>
        </select>
      </label>}
      {tool === 'roof' && <label className="flex items-center gap-2">
        <input type="checkbox" checked={oneSidedRoof} disabled={!enabled || disabled} onChange={event => setOneSidedRoof(event.target.checked)} />
        One-sided roof
      </label>}
      <div className="flex gap-2"><Button size="sm" variant="outline" disabled={!points.length} onClick={() => { setPoints([]); setHover(null); onPreview(null); onMessage('Draft cancelled. Completed geometry is retained.'); }}>Cancel Draft</Button><Button size="sm" disabled={points.length < 3} onClick={finishPolygon}>Finish {tool === 'cutout' ? 'Cutout' : tool === 'roof' ? 'Roof' : floorLabel}</Button></div>
    </div>}
  </section>;
}
