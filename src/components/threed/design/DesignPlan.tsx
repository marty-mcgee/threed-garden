'use client';

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode, type SetStateAction, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, Focus, Maximize, RotateCcw, Ruler, type LucideIcon } from 'lucide-react';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { DesignAction } from './DesignAction';
import { Button } from '@/components/ui/button';
import { distance, insidePolygon, roofFrame, roofOpeningFootprint, INCH, levelDocument, visibleLevelsDocument, mergeNodes, moveNodes, openingFootprint, openingMargin, roundMetres, screenToPlan, snapPoint, validateDesign, wallFrame,
  type DesignDocument, type PlanPoint, type PlanView } from '@/libraries/services/threed/design/document';
import { formatPlanLength, framePlan, gridFeet as planGridFeet, rulerTicks, RULER_SIZE, zoomPlan } from '@/libraries/services/threed/design/plan-navigation';
import { entityPoints } from '@/libraries/services/threed/design/object-properties';
import type { ModelPlanImage } from '@/libraries/services/threed/models/model-plan-image';
import { wallFootprint } from '@/libraries/services/threed/design/geometry';

export type DesignTool = 'select' | 'wall' | 'floor' | 'roof' | 'door' | 'window' | 'cutout' | 'skylight' | 'pan';
type DrawPoint = PlanPoint & { nodeId?: string };
export interface DesignContextGroup { label: string; color: string; actions: { label: string; icon: LucideIcon; disabled?: boolean; active?: boolean; run: () => void }[] }
interface Props { visibleLevelIds?: string[]; onToggleLevel?: (id: string) => void; contextActions?: DesignContextGroup[]; showMeasurements?: boolean; onShowMeasurementsChange?: (show: boolean) => void; selectedModelId?: string | null; modelImages?: ModelPlanImage[]; metersPerSceneUnit?: number; onModelSelect?: (id: string) => void; measurementUnits?: 'imperial' | 'metric'; frameRequest?: { id: string; sequence: number } | null; drawingActions?: ReactNode; planView?: PlanView; onViewChange?: (view: PlanView) => void; toolbarHost?: HTMLDivElement | null; embedded?: boolean; active?: boolean; disabled?: boolean; document: DesignDocument; displayDocument?: DesignDocument; activeLevelId: string; selected: string | null; tool: DesignTool; gridSnap: boolean;
  onSelect: (id: string | null) => void; onCommit: (doc: DesignDocument) => void;
  onPreview: (doc: DesignDocument | null) => void; onMessage: (text: string) => void;
  onDrawComplete: (id: string) => void; cancelToken: number }
interface Gesture { pointerId: number; base: DesignDocument; point: PlanPoint; screenStart?: { x: number; y: number }; view: PlanView; nodes: string[]; pan: boolean; pendingClick?: { shiftKey: boolean }; node?: string; opening?: string; roofOpening?: string; merge?: string; latest: DesignDocument }
const PAN_DRAG_THRESHOLD = 4; // CSS pixels: allow ordinary click jitter without drawing during a pan.
const makeId = () => crypto.randomUUID();

function addShape(doc: DesignDocument, points: DrawPoint[], tool: 'wall' | 'floor' | 'roof', levelId: string, draft = false): DesignDocument {
  const nodes = [...doc.nodes];
  const levelNodes = new Set(levelDocument(doc, levelId).nodes.map(node => node.id));
  const used = new Set([...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings].map(entity => entity.id));
  const allocate = (prefix: string) => { let candidate = draft ? prefix : makeId(), suffix = 0; while (used.has(candidate)) candidate = draft ? `${prefix}-${++suffix}` : makeId(); used.add(candidate); return candidate; };
  const ids = points.map((point, index) => {
    const existing = point.nodeId ?? nodes.find(node => levelNodes.has(node.id) && distance(node, point) < .000001)?.id;
    if (existing) return existing;
    const id = allocate(`preview-node-${index}`); nodes.push({ id, x: point.x, z: point.z }); return id;
  });
  const id = allocate('preview-entity');
  return { ...doc, nodes, walls: tool === 'wall' ? [...doc.walls, { id, levelId, start: ids[0], end: ids[1], height: doc.defaults.wallHeight, thickness: doc.defaults.wallThickness, elevation: 0 }] : doc.walls,
    floors: tool === 'floor' ? [...doc.floors, { id, levelId, vertices: ids, thickness: doc.defaults.floorThickness, elevation: 0 }] : doc.floors, roofs: tool === 'roof' ? [...doc.roofs, { id, levelId, vertices: ids, kind: 'gable', pitch: 6, direction: 0, thickness: 6 * INCH, elevation: doc.defaults.wallHeight }] : doc.roofs };
}

export function DesignPlan({ visibleLevelIds, onToggleLevel, contextActions = [], showMeasurements, onShowMeasurementsChange, selectedModelId, modelImages = [], metersPerSceneUnit = 1, onModelSelect, measurementUnits = 'imperial', frameRequest, drawingActions, planView, onViewChange, toolbarHost, embedded = false, active: enabled = true, disabled = false, document: doc, displayDocument = doc, activeLevelId, selected, tool, gridSnap, onSelect, onCommit, onPreview, onMessage, onDrawComplete, cancelToken }: Props) {
  const shownLevels = visibleLevelIds ?? [activeLevelId];
  const editingHidden = !shownLevels.includes(activeLevelId);
  const [localMeasurements, setLocalMeasurements] = useState(false);
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
  const [draftOpeningId] = useState(makeId);
  const gesture = useRef<Gesture | null>(null);
  const nodes = new Map(visible.nodes.map(node => [node.id, node]));
  const wall = doc.walls.find(entity => entity.id === selected), floor = doc.floors.find(entity => entity.id === selected);
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
    if ((tool !== 'wall' && tool !== 'floor' && tool !== 'roof') || !points.length || !hover) { onPreview(null); return; }
    const draft = [...points, hover];
    try { onPreview(validateDesign(addShape(doc, draft, tool, activeLevelId, true))); } catch { onPreview(null); }
  }, [points, hover, tool, doc, activeLevelId, onPreview]);
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
  function finishPolygon() {
    if (tool !== 'floor' && tool !== 'roof') return;
    try { const next = validateDesign(addShape(doc, points, tool, activeLevelId)); const entities = tool === 'roof' ? next.roofs : next.floors; onCommit(next); setPoints([]); setHover(null); onPreview(null); onDrawComplete(entities[entities.length - 1].id); onMessage(`${tool === 'roof' ? 'Roof' : 'Floor'} finished and selected. Drag a corner or edit its properties.`); }
    catch (error) { onMessage((error as Error).message); }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!enabled || disabled || editingHidden || event.key !== 'Enter' || (tool !== 'floor' && tool !== 'roof') || points.length < 3 || event.repeat
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
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.roofOpenings, ...doc.openings].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), kind: tool, wallId: wall.id,
      offset: roundMetres(Math.max(margin, Math.min(frame.length - margin - width, snapped))), width,
      height: tool === 'door' ? doc.defaults.doorHeight : doc.defaults.windowHeight, sill: tool === 'door' ? 0 : doc.defaults.windowSill };
    return { next: validateDesign({ ...doc, openings: [...doc.openings, opening] }), id: opening.id };
  }
  function placeRoofOpening(point: PlanPoint, draft: boolean) {
    if (tool !== 'cutout' && tool !== 'skylight') return null;
    const selectedRoof = doc.roofOpenings.find(opening => opening.id === selected)?.roofId ?? selected;
    const roof = active.roofs.find(roof => roof.id === selectedRoof) ?? [...active.roofs].reverse().find(roof => insidePolygon(point, roof.vertices.map(id => doc.nodes.find(node => node.id === id)!)));
    if (!roof) return null;
    const frame = roofFrame(doc, roof), local = frame.local(point), step = 6 * INCH, width = 24 * INCH, length = 36 * INCH;
    const snap = (value: number) => roundMetres(gridSnap ? Math.round(value / step) * step : value);
    const opening = { id: draft && ![...doc.levels, ...doc.nodes, ...doc.walls, ...doc.floors, ...doc.roofs, ...doc.openings, ...doc.roofOpenings].some(entity => entity.id === draftOpeningId) ? draftOpeningId : makeId(), roofId: roof.id, kind: tool, along: snap(local.along - width / 2), across: snap(local.across - length / 2), width, length };
    return { next: validateDesign({ ...doc, roofOpenings: [...doc.roofOpenings, opening] }), id: opening.id };
  }
  function down(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || gesture.current || (event.button !== 0 && event.button !== 1) || local(event).x < RULER_SIZE || local(event).y < RULER_SIZE) return;
    event.preventDefault(); svg.current?.focus();
    const point = pointer(event), target = (event.target as Element).closest('[data-entity]'), targetId = target?.getAttribute('data-entity') ?? null;
    // A transient drawing/placement preview is still blank canvas, not a saved object.
    const entityId = targetId && [...active.walls, ...active.floors, ...active.roofs, ...active.openings, ...active.roofOpenings].some(entity => entity.id === targetId) ? targetId : null;
    const hitNodeId = (event.target as Element).getAttribute('data-node');
    const nodeId = active.nodes.some(node => node.id === hitNodeId) ? hitNodeId : null;
    const explicitPan = editingHidden || tool === 'pan' || event.button === 1 || event.altKey;
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
      const keys = nodeId ? [nodeId] : entity ? 'vertices' in entity ? entity.vertices : [entity.start, entity.end] : [];
      gesture.current = { pointerId: event.pointerId, base: doc, latest: doc, point, view, nodes: keys, pan: false, node: nodeId ?? undefined, opening: doc.openings.some(o => o.id === entityId) ? entityId! : undefined, roofOpening: doc.roofOpenings.some(o => o.id === entityId) ? entityId! : undefined };
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
    if (tool === 'cutout' || tool === 'skylight') {
      try { const placed = placeRoofOpening(point, false); if (!placed) { onMessage('Choose a host roof in the active plan. Draw Roof first if needed.'); return; } onCommit(placed.next); onDrawComplete(placed.id); onMessage('Roof opening placed and selected. Drag within its roof or edit its dimensions.'); }
      catch (error) { onPreview(null); onMessage((error as Error).message); }
      return;
    }
    if (tool === 'wall' || tool === 'floor' || tool === 'roof') {
      const hit = snapped(point, [], shiftKey);
      if ((tool === 'floor' || tool === 'roof') && points.length >= 3 && distance(hit, points[0]) < 10 / view.scale) { finishPolygon(); return; }
      if (tool === 'wall' && points.length) {
        try { const next = validateDesign(addShape(doc, [points[0], hit], 'wall', activeLevelId)); onCommit(next); setPoints([{ ...hit, nodeId: next.walls[next.walls.length - 1].end }]); setHover(null); onPreview(null); onMessage('Wall added. Click the next endpoint, or Escape to finish.'); }
        catch (error) { onMessage((error as Error).message); }
      } else if (!points.some(existing => distance(existing, hit) < .000001)) { setPoints([...points, hit]); setHover(hit); onMessage(tool !== 'wall' ? 'Click corners, then Finish, Enter, or the first corner to save. Escape cancels the draft.' : 'Click an endpoint. Escape cancels.'); }
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
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || ((disabled || editingHidden) && !gesture.current?.pan)) return;
    const active = gesture.current;
    if (!active) {
      if ((tool === 'wall' || tool === 'floor' || tool === 'roof') && points.length) setHover(snapped(pointer(event), [], event.shiftKey));
      if (tool === 'cutout' || tool === 'skylight') { try { onPreview(placeRoofOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      if (tool === 'door' || tool === 'window') { try { onPreview(placeOpening(pointer(event), true)?.next ?? null); } catch (error) { onPreview(null); onMessage((error as Error).message); } }
      return;
    }
    if (event.pointerId !== active.pointerId) return;
    if (active.pan) { panGesture(active, local(event)); return; }
    const p = screenToPlan(local(event), active.view), baseNodes = new Map(active.base.nodes.map(node => [node.id, node]));
    if (active.roofOpening) {
      const opening = active.base.roofOpenings.find(opening => opening.id === active.roofOpening)!, roof = active.base.roofs.find(roof => roof.id === opening.roofId)!, frame = roofFrame(active.base, roof);
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
      const snap = snapPoint(p, levelDocument(active.base, activeLevelId).nodes, active.view.scale, gridSnap, active.nodes); active.merge = snap.nodeId;
      positions.set(active.node, snap.point);
    } else {
      if (gridSnap) { dx = Math.round(dx / (6 * INCH)) * 6 * INCH; dz = Math.round(dz / (6 * INCH)) * 6 * INCH; }
      for (const key of active.nodes) { const n = baseNodes.get(key)!; positions.set(key, { x: n.x + dx, z: n.z + dz }); }
    }
    try { active.latest = validateDesign(moveNodes(active.base, positions)); onPreview(active.latest); onMessage('Moving connected geometry. Release to commit; Escape cancels.'); }
    catch (error) { active.merge = undefined; onMessage((error as Error).message); }
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const active = gesture.current; if (!active || event.pointerId !== active.pointerId) return;
    if (active.pan) panGesture(active, local(event));
    gesture.current = null;
    try {
      if (active.pendingClick) activateTool(active.point, active.pendingClick.shiftKey);
      else if (!active.pan) onCommit(active.node && active.merge ? mergeNodes(active.latest, active.node, active.merge) : active.latest);
    }
    catch (error) { onMessage((error as Error).message); }
    onPreview(null); if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
  }
  const polygon = (points: PlanPoint[]) => points.map(point => `${point.x},${point.z}`).join(' ');
  const gridFeet = planGridFeet(view.scale), grid = gridFeet * 12 * INCH * view.scale;
  const selectedWall = doc.walls.find(wall => wall.id === selected);
  const modelPoints = (images: ModelPlanImage[]) => images.flatMap(image => { const [a,b,c] = image.corners; return [a,b,c,{x:b.x+c.x-a.x,z:b.z+c.z-a.z}].map(p => ({x:p.x*metersPerSceneUnit,z:p.z*metersPerSceneUnit})); });
  const selectionPoints = selectedModelId ? modelPoints(modelImages.filter(image => image.id === selectedModelId)) : selectedWall ? wallFootprint(doc, selectedWall) : entityPoints(doc, selected);
  const xTicks = rulerTicks(view.x, view.scale, size.width, measurementUnits), zTicks = rulerTicks(view.y, view.scale, size.height, measurementUnits);
  function fitPlan(selection = false) {
    const next = framePlan(selection ? selectionPoints : [...visible.nodes, ...visible.walls.flatMap(wall => wallFootprint(displayDocument, wall)), ...modelPoints(modelImages)], size); if (next) setView(next);
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
    { label: measurementsVisible ? 'Hide Measurements' : 'Show Measurements', icon: Ruler, active: measurementsVisible, run: toggleMeasurements },
    { label: 'Fit Plan', icon: Maximize, disabled: !visible.nodes.length && !modelImages.length, run: () => fitPlan() },
    { label: 'Zoom to Selection', icon: Focus, disabled: !selectionPoints.length, run: () => fitPlan(true) },
    { label: 'Reset View', icon: RotateCcw, run: () => setView({ x: 80, y: 80, scale: 45 }) },
  ] };
  const viewActions = <div role="group" aria-label={viewGroup.label} className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/40 p-1 [&_svg]:text-cyan-700 dark:[&_svg]:text-cyan-300">{viewGroup.actions.map(action => <DesignAction key={action.label} label={action.label} disabled={action.disabled} aria-pressed={action.active} variant={action.active ? 'secondary' : 'outline'} onClick={action.run}><action.icon className="h-3.5 w-3.5" /></DesignAction>)}</div>;
  return <section aria-label="Design plan canvas" className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#091423] ${embedded ? '' : 'rounded-lg border border-white/10'}`}>
    {embedded && enabled && <div data-testid="design-canvas-tools" role="toolbar" aria-label="Design drawing and view tools" className="threed-workspace-panel threed-scene-panel-surface absolute z-10 flex max-w-[calc(100%-40px)] flex-nowrap items-center gap-1 overflow-x-auto [&>nav]:flex-nowrap [&>nav]:shrink-0 rounded-md border p-1 shadow-md" style={{ right: 8, top: RULER_SIZE + 8 }} onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>{drawingActions}{viewActions}</div>}
    {!embedded && <div data-testid="design-plan-header" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs">
      <span className="font-semibold">2D Plan · {doc.levels.find(level => level.id === activeLevelId)?.name} · X / Z · {measurementUnits === 'metric' ? `${Number((gridFeet * 12 * INCH).toFixed(4))} m` : `${gridFeet} ft`} grid</span>
      <div className="flex items-center gap-2"><span>{Number(view.scale.toFixed(2))} px/m</span>{viewActions}</div>
    </div>}
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
    <ContextMenu><ContextMenuTrigger asChild><svg ref={svg} data-testid="home-plan" aria-label="ThreeD Design 2D plan" tabIndex={0} width="100%" height="100%" className="block min-h-0 w-full flex-1 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
      onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { gesture.current = null; setPoints([]); setHover(null); onPreview(null); onMessage('Gesture cancelled.'); }}
      onLostPointerCapture={() => { if (gesture.current) { gesture.current = null; onPreview(null); } }}
      onPointerLeave={() => { if (!gesture.current && (tool === 'door' || tool === 'window' || tool === 'cutout' || tool === 'skylight')) onPreview(null); }}
      >
      <defs><pattern id={patternId} width={grid} height={grid} patternUnits="userSpaceOnUse" x={view.x % grid} y={view.y % grid}><path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="#204259" strokeWidth=".7" /></pattern></defs>
      <rect width={size.width} height={size.height} fill={`url(#${patternId})`} />
      <g pointerEvents="none" stroke="#4d91a6" strokeWidth="1"><line x1={view.x} x2={view.x} y1={RULER_SIZE} y2={size.height}/><line y1={view.y} y2={view.y} x1={RULER_SIZE} x2={size.width}/></g>
      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {hover && points.length > 0 && <g pointerEvents="none" stroke="#38bdf8" strokeWidth={1 / view.scale} strokeDasharray={`${4 / view.scale} ${4 / view.scale}`}>
          {active.nodes.some(node => Math.abs(node.x - hover.x) < .000001) && <line x1={hover.x} x2={hover.x} y1={(RULER_SIZE - view.y) / view.scale} y2={(size.height - view.y) / view.scale}/>}
          {active.nodes.some(node => Math.abs(node.z - hover.z) < .000001) && <line y1={hover.z} y2={hover.z} x1={(RULER_SIZE - view.x) / view.scale} x2={(size.width - view.x) / view.scale}/>}
        </g>}
        {visible.floors.map(floor => <polygon key={floor.id} data-entity={floor.id} points={polygon(floor.vertices.map(id => nodes.get(id)!))} fill={selected === floor.id ? '#177986' : '#405a76'} fillOpacity=".55" stroke="#7694b8" strokeWidth={1 / view.scale} />)}
        {modelImages.map(image => {
          const [a,b,c] = image.corners.map(p => ({ x: p.x * metersPerSceneUnit, z: p.z * metersPerSceneUnit }));
          if (![a.x,a.z,b.x,b.z,c.x,c.z].every(Number.isFinite)) return null;
          return <image key={image.id} href={image.url} x={0} y={0} width={1} height={1} preserveAspectRatio="none" transform={`matrix(${b.x-a.x} ${b.z-a.z} ${c.x-a.x} ${c.z-a.z} ${a.x} ${a.z})`} role="button" tabIndex={enabled && !disabled ? 0 : -1} aria-label={`Select Project Model ${image.id}`} onKeyDown={event => { if (!enabled || disabled || !['Enter', ' '].includes(event.key)) return; event.preventDefault(); event.stopPropagation(); onModelSelect?.(image.id); }} style={{ cursor: 'pointer' }} onPointerDown={event => { if (!enabled || disabled || editingHidden || tool !== 'select' || event.button !== 0 || event.altKey) return; event.stopPropagation(); onModelSelect?.(image.id); }} />;
        })}
        {modelImages.filter(image => image.id === selectedModelId).map(image => {
          const [a, b, c] = image.corners;
          const corners = [a, b, {
            x: b.x + c.x - a.x,
            z: b.z + c.z - a.z,
          }, c]
            .map(point => ({
              x: point.x * metersPerSceneUnit,
              z: point.z * metersPerSceneUnit,
            }));
          return <polygon key={`selected-${image.id}`} data-selected-model={image.id} points={polygon(corners)}
            fill="none" stroke="#22d3ee" strokeWidth={2 / view.scale} pointerEvents="none" />;
        })}
        {visible.roofs.map(roof => { const points = roof.vertices.map(id => nodes.get(id)!); return <g key={roof.id} data-entity={roof.id} data-roof={roof.kind}><polygon points={polygon(points)} fill="#c084fc" fillOpacity={selected === roof.id ? .18 : .06} stroke="#c084fc" strokeWidth={3 / view.scale} pointerEvents="stroke" /></g>; })}
        {visible.walls.map(wall => <g key={wall.id}><polygon data-entity={wall.id} points={polygon(wallFootprint(displayDocument, wall))} fill={selected === wall.id ? '#36b8c8' : '#b4c8df'} stroke="#5b8baf" strokeWidth={1 / view.scale} /><line data-entity={wall.id} x1={nodes.get(wall.start)!.x} y1={nodes.get(wall.start)!.z} x2={nodes.get(wall.end)!.x} y2={nodes.get(wall.end)!.z} stroke="transparent" strokeWidth={Math.max(wall.thickness, 10 / view.scale)} />{measurementsVisible && <text data-measurement={wall.id} x={(nodes.get(wall.start)!.x + nodes.get(wall.end)!.x) / 2} y={(nodes.get(wall.start)!.z + nodes.get(wall.end)!.z) / 2 - .2} fill="#dde8f6" fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{formatPlanLength(distance(nodes.get(wall.start)!, nodes.get(wall.end)!), measurementUnits)}</text>}</g>)}
        {visible.openings.map(opening => {
          const footprint = openingFootprint(displayDocument, opening), host = displayDocument.walls.find(w => w.id === opening.wallId)!, frame = wallFrame(displayDocument, host);
          const a = frame.point(opening.offset), b = frame.point(opening.offset + opening.width), color = selected === opening.id ? '#facc15' : opening.kind === 'door' ? '#f0ab65' : '#67e8f9';
          return <g key={opening.id} data-entity={opening.id} data-opening={opening.kind}><polygon points={polygon(footprint)} fill="#091423" stroke={color} strokeWidth={1.5 / view.scale} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke={color} strokeWidth={3 / view.scale} strokeDasharray={opening.kind === 'door' ? `${5 / view.scale} ${3 / view.scale}` : undefined} /><line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke="transparent" strokeWidth={Math.max(host.thickness, 12 / view.scale)} /><text x={(a.x + b.x) / 2} y={(a.z + b.z) / 2 + .35} fill={color} fontSize={11 / view.scale} textAnchor="middle" pointerEvents="none">{opening.kind === 'door' ? 'Door' : 'Window'}</text></g>;
        })}
        {visible.roofOpenings.map(opening => { const points = roofOpeningFootprint(displayDocument, opening), center = points.reduce((sum, p) => ({ x: sum.x + p.x / 4, z: sum.z + p.z / 4 }), { x: 0, z: 0 }); const color = selected === opening.id ? '#facc15' : opening.kind === 'skylight' ? '#67e8f9' : '#fb923c'; return <g key={opening.id} data-entity={opening.id} data-roof-opening={opening.kind}><polygon points={polygon(points)} fill={opening.kind === 'skylight' ? '#164e63' : '#091423'} fillOpacity={opening.kind === 'skylight' ? .65 : .9} stroke={color} strokeWidth={2 / view.scale} /><text x={center.x} y={center.z} fill={color} fontSize={10 / view.scale} textAnchor="middle" pointerEvents="none">{opening.kind === 'skylight' ? 'Skylight' : 'Cutout'}</text></g>; })}
        {measurementsVisible && <g pointerEvents="none" fill="#dde8f6" fontSize={11 / view.scale} textAnchor="middle">
          {[...visible.floors, ...visible.roofs].map(entity => {
            const points = entity.vertices.map(id => nodes.get(id)!);
            const xs = points.map(p => p.x), zs = points.map(p => p.z);
            const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
            return <text key={entity.id} data-measurement={entity.id} x={(minX + maxX) / 2} y={maxZ + .3}>{formatPlanLength(maxX-minX, measurementUnits)} ? {formatPlanLength(maxZ-minZ, measurementUnits)}</text>;
          })}
          {visible.openings.map(opening => { const points = openingFootprint(displayDocument, opening); return <text key={opening.id} data-measurement={opening.id} x={points.reduce((sum,p)=>sum+p.x/points.length,0)} y={Math.max(...points.map(p=>p.z))+.65}>{formatPlanLength(opening.width, measurementUnits)} ? {formatPlanLength(opening.height, measurementUnits)}</text>; })}
          {visible.roofOpenings.map(opening => { const points = roofOpeningFootprint(displayDocument, opening); return <text key={opening.id} data-measurement={opening.id} x={points.reduce((sum,p)=>sum+p.x/points.length,0)} y={Math.max(...points.map(p=>p.z))+.3}>{formatPlanLength(opening.width, measurementUnits)} ? {formatPlanLength(opening.length, measurementUnits)}</text>; })}
          {modelImages.map(image => { const [a,b,c] = image.corners; return <text key={image.id} data-measurement={image.id} x={(b.x+c.x)/2*metersPerSceneUnit} y={Math.max(a.z,b.z,c.z,b.z+c.z-a.z)*metersPerSceneUnit+.3}>{formatPlanLength(distance(a,b)*metersPerSceneUnit,measurementUnits)} ? {formatPlanLength(distance(a,c)*metersPerSceneUnit,measurementUnits)}</text>; })}
        </g>}
        {handles.map(key => <circle key={key} data-node={key} cx={nodes.get(key)!.x} cy={nodes.get(key)!.z} r={6 / view.scale} fill="#facc15" stroke="#101827" strokeWidth={1 / view.scale} />)}
        {!!points.length && <><polyline points={polygon(hover ? [...points, hover] : points)} fill={tool !== 'wall' ? '#15b8a633' : 'none'} stroke="#2dd4bf" strokeWidth={2 / view.scale} strokeDasharray={`${6 / view.scale} ${4 / view.scale}`} pointerEvents="none" />{points.map((p, index) => <circle key={index} cx={p.x} cy={p.z} r={4 / view.scale} fill="#2dd4bf" pointerEvents="none" />)}{hover && <circle cx={hover.x} cy={hover.z} r={6 / view.scale} fill="none" stroke={hover.nodeId ? '#facc15' : '#2dd4bf'} strokeWidth={2 / view.scale} pointerEvents="none" />}</>}
      </g>
      <g data-testid="design-rulers" pointerEvents="none" fontSize="10" fill="#cbd5e1">
        <title>Project coordinates in {measurementUnits === 'metric' ? 'metres' : 'feet'}. +X points right; +Z points down. Cyan axes mark zero.</title>
        <rect width={size.width} height={RULER_SIZE} fill="#111e30"/><rect width={RULER_SIZE} height={size.height} fill="#111e30"/>
        {xTicks.map(tick => <g key={tick.index} data-axis="x" data-world={tick.world} data-pixel={tick.pixel}><line x1={tick.pixel} x2={tick.pixel} y1={tick.major ? 16 : 22} y2={28} stroke={tick.index === 0 ? '#22d3ee' : '#64748b'}/>{tick.major && <text x={tick.pixel + 3} y={12}>{tick.label}</text>}</g>)}
        {zTicks.map(tick => <g key={tick.index} data-axis="z" data-world={tick.world} data-pixel={tick.pixel}><line y1={tick.pixel} y2={tick.pixel} x1={tick.major ? 16 : 22} x2={28} stroke={tick.index === 0 ? '#22d3ee' : '#64748b'}/>{tick.major && <text transform={`translate(12 ${tick.pixel + 3}) rotate(-90)`}>{tick.label}</text>}</g>)}
        <rect width={28} height={28} fill="#111e30"/><text x={3} y={11} fill="#22d3ee">X +</text><text x={3} y={24} fill="#22d3ee">Z +</text>
      </g>
    </svg></ContextMenuTrigger>
    <ContextMenuContent aria-label="2D Design Tools" className="z-[5000] w-60" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      {[...contextActions, viewGroup].map((group, index) => <div key={group.label}>
        {index > 0 && <ContextMenuSeparator className="my-0.5" />}
        {group.actions.map(action => <ContextMenuItem key={action.label} disabled={action.disabled || !enabled} onSelect={action.run} className={`py-0.5 ${action.active ? 'bg-accent/50' : ''}`}>
          <action.icon aria-hidden="true" className={`size-4 ${group.color}`} /><span>{action.label}</span>{action.active && <><Check aria-hidden="true" className="ml-auto size-3.5" /><span className="sr-only">Selected</span></>}
        </ContextMenuItem>)}
      </div>)}
    </ContextMenuContent></ContextMenu>
    {onToggleLevel && enabled && <nav aria-label="Design levels" className="threed-workspace-panel threed-scene-panel-surface absolute bottom-6 left-9 z-10 flex max-w-[calc(100%-44px)] items-center gap-1 overflow-x-auto rounded-md border p-1 shadow-md" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      {[...doc.levels].sort((a,b) => a.elevation-b.elevation).map(level => <Button key={level.id} type="button" size="sm" variant="outline" className={`h-7 shrink-0 px-2 text-xs ${shownLevels.includes(level.id) ? 'border-cyan-600/60 bg-cyan-100 text-cyan-900 hover:bg-cyan-200 dark:border-cyan-400/60 dark:bg-cyan-400/20 dark:text-cyan-200 dark:hover:bg-cyan-400/30' : 'bg-transparent text-muted-foreground'}`} aria-pressed={shownLevels.includes(level.id)} onClick={() => onToggleLevel(level.id)}>{level.name}</Button>)}
    </nav>}
    </div>
    {((tool === 'floor' || tool === 'roof') && !editingHidden) && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#111a28] px-3 py-2 pb-6 text-xs" data-testid={`home-${tool}-draft`}>
      <span>{points.length} corners. Choose at least 3; Enter or the first corner finishes. Escape cancels.</span>
      <div className="flex gap-2"><Button size="sm" variant="outline" disabled={!points.length} onClick={() => { setPoints([]); setHover(null); onPreview(null); onMessage('Draft cancelled. Completed geometry is retained.'); }}>Cancel Draft</Button><Button size="sm" disabled={points.length < 3} onClick={finishPolygon}>Finish {tool === 'roof' ? 'Roof' : 'Floor'}</Button></div>
    </div>}
  </section>;
}
