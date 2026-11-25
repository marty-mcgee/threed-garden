/** Editable design data. Metres internally; plan +Z points down, Three uses Y up. */
export interface PlanPoint { x: number; z: number }
export interface DesignNode extends PlanPoint { id: string }
export interface DesignLevel { id: string; name: string; elevation: number }
/** height belongs to start; absent endHeight keeps the constant-height workflow. */
export interface DesignAppearance { color?: string; transparency?: number; texture?: string }
export interface DesignWall { id: string; appearance?: DesignAppearance; name?: string; levelId: string; start: string; end: string; height: number; endHeight?: number; thickness: number; elevation: number }
const outdoorSurfaceLabels = {
  deck: 'Deck',
  patio: 'Patio',
  driveway: 'Driveway',
} as const;
export type FloorSurface = keyof typeof outdoorSurfaceLabels;
export interface DesignFloor {
  id: string;
  appearance?: DesignAppearance;
  name?: string;
  levelId: string;
  vertices: string[];
  thickness: number;
  elevation: number;
  surface?: FloorSurface;
}
export function floorSurfaceLabel(floor: Pick<DesignFloor, 'surface'>): string {
  return floor.surface ? outdoorSurfaceLabels[floor.surface] : 'Floor';
}
export interface DesignStairs {
  id: string;
  levelId: string;
  anchor: string;
  direction: number;
  startY: number;
  endY: number;
  stepLength: number;
  width: number;
  stepHeight: number;
  name?: string;
  appearance?: DesignAppearance;
}
export interface DesignRoof { id: string; appearance?: DesignAppearance; name?: string; levelId: string; vertices: string[]; kind: 'flat' | 'shed' | 'gable'; pitch: number; direction: number; thickness: number; elevation: number }
export const doorOperations = {
  inward: "Door Opens Inwards",
  outward: "Door Opens Outwards",
  slidingGlass: "Sliding Glass Door",
  slidingWood: "Sliding Wood Door",
  garage: "Garage Door",
} as const;
export type DoorOperation = keyof typeof doorOperations;
export interface DesignOpening { isOpen?: boolean; operation?: DoorOperation; id: string; appearance?: DesignAppearance; name?: string; wallId: string; kind: 'door' | 'window' | 'wall-cutout'; outline?: PlanPoint[]; offset: number; width: number; height: number; sill: number }
export function doorIsOpen(opening: DesignOpening): boolean {
  return opening.isOpen ?? (opening.operation === undefined || opening.operation === 'inward' || opening.operation === 'outward');
}
/** Rectangles in the host roof's direction/perpendicular frame, from its first corner. */
export interface DesignRoofOpening { id: string; appearance?: DesignAppearance; name?: string; roofId: string; outline?: PlanPoint[]; kind: 'cutout' | 'skylight'; along: number; across: number; width: number; length: number }
const planColors = {
  wall: '#b4c8df',
  floor: '#405a76',
  deck: '#ac7852',
  patio: '#b4a596',
  driveway: '#66717a',
  stairs: '#b89170',
  roof: '#c084fc',
  door: '#f0ab65',
  window: '#67e8f9',
  'wall-cutout': '#f59e0b',
  cutout: '#fb923c',
  skylight: '#38bdf8',
} as const;

export type PlanObject = DesignWall | DesignFloor | DesignRoof | DesignOpening | DesignRoofOpening | DesignStairs;
export function planObjectColor(entity: PlanObject): string {
  const kind = 'wallId' in entity || 'roofId' in entity ? entity.kind
    : 'start' in entity ? 'wall' : 'pitch' in entity ? 'roof' : 'anchor' in entity ? 'stairs' : entity.surface ?? 'floor';
  return entity.appearance?.color ?? planColors[kind];
}

export interface DesignDocument {
  format: 'threed-home-design'; version: 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13; units: 'metres'; name: string;
  stairs?: DesignStairs[];
  levels: DesignLevel[]; nodes: DesignNode[]; walls: DesignWall[]; floors: DesignFloor[]; roofs: DesignRoof[]; openings: DesignOpening[]; roofOpenings: DesignRoofOpening[];
  defaults: { wallHeight: number; wallThickness: number; floorThickness: number; doorHeight: number; doorWidth: number; windowHeight: number; windowWidth: number; windowSill: number };
}
import { METRES_PER_INCH } from '../scene-units';
export const INCH = METRES_PER_INCH;
export const EPS = 0.000001;
export const inchesToMetres = (inches: number) => inches * INCH;
export const legacyCentimetresToMetres = (centimetres: number) => centimetres / 100;
export const roundMetres = (value: number) => Math.round(value * 1e6) / 1e6;
/** Work at stored precision so an exact multiple of the riser height keeps its step count. */
export function stairLayout(stair: Pick<DesignStairs, 'startY' | 'endY' | 'stepHeight' | 'stepLength'>) {
  const height = Math.round(stair.endY * 1e6) - Math.round(stair.startY * 1e6);
  const count = Math.max(1, Math.ceil(Math.abs(height) / Math.round(stair.stepHeight * 1e6)));
  return {
    count,
    rise: height / (count * 1e6),
    run: count * stair.stepLength,
  };
}
/** Start-left, start-right, end-right and end-left corners in the flight's local frame. */
export function stairFootprint(doc: Pick<DesignDocument, 'nodes'>, stair: DesignStairs): PlanPoint[] {
  const anchor = doc.nodes.find(node => node.id === stair.anchor) ?? fail('Stairs reference a missing anchor.');
  const angle = stair.direction * Math.PI / 180;
  const dx = Math.cos(angle), dz = Math.sin(angle);
  const half = stair.width / 2;
  const { run } = stairLayout(stair);
  const left = { x: anchor.x + dz * half, z: anchor.z - dx * half };
  const right = { x: anchor.x - dz * half, z: anchor.z + dx * half };
  return [
    left,
    right,
    { x: right.x + dx * run, z: right.z + dz * run },
    { x: left.x + dx * run, z: left.z + dz * run },
  ];
}
export const distance = (a: PlanPoint, b: PlanPoint) => Math.hypot(a.x - b.x, a.z - b.z);
export const newDesign = (): DesignDocument => ({ format: 'threed-home-design', version: 5, units: 'metres', name: 'Untitled ThreeD Design',
  levels: [{ id: 'ground', name: 'Ground', elevation: 0 }], nodes: [], walls: [], floors: [], roofs: [], openings: [], roofOpenings: [], defaults: { wallHeight: 96 * INCH, wallThickness: 6 * INCH, floorThickness: 6 * INCH, doorHeight: 80 * INCH, doorWidth: 36 * INCH, windowHeight: 48 * INCH, windowWidth: 36 * INCH, windowSill: 36 * INCH } });
export const formatLength = (metres: number) => `${Number((metres / INCH).toFixed(2))} in (${Number((metres / (12 * INCH)).toFixed(2))} ft)`;
export const signedArea = (points: PlanPoint[]) => points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.z - q.x * p.z; }, 0) / 2;
const cross = (a: PlanPoint, b: PlanPoint, c: PlanPoint) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
function intersects(a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) {
  const on = (p: PlanPoint, q: PlanPoint, r: PlanPoint) => Math.abs(cross(p, q, r)) < EPS && r.x >= Math.min(p.x, q.x) - EPS && r.x <= Math.max(p.x, q.x) + EPS && r.z >= Math.min(p.z, q.z) - EPS && r.z <= Math.max(p.z, q.z) + EPS;
  return (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) || on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}
export function polygonIssue(points: PlanPoint[]): string | null {
  if (points.length < 3) return 'A floor needs at least three vertices.';
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) if (distance(points[i], points[j]) < EPS) return 'Floor vertices must be distinct.';
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
    if (intersects(points[i], points[(i + 1) % points.length], points[j], points[(j + 1) % points.length])) return 'Floor edges must not cross or touch themselves.';
  }
  if (Math.abs(signedArea(points)) < 0.0001) return 'Floor area is too small.';
  return null;
}
const fail = (message: string): never => { throw new Error(message); };
function object(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Expected a design object.');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key)) || keys.some(key => !(key in record))) fail('Unsupported or missing design fields.');
  return record;
}
function finite(value: unknown, min: number, max: number, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return fail(`${label} must be between ${min} and ${max} metres.`);
  return roundMetres(value);
}
const id = (value: unknown): string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value) ? value : fail('Invalid entity ID.');
function list(value: unknown, max: number): unknown[] { if (!Array.isArray(value) || value.length > max) return fail(`Too many entities (limit ${max}).`); return value; }
/** Strict bounded parsing also serves as commit validation; no Paper payload or private metadata. */
export function validateDesign(value: unknown): DesignDocument {
  const legacy = !!value && typeof value === 'object' && (value as Record<string, unknown>).version === 1;
  const version = value && typeof value === 'object' ? (value as Record<string, unknown>).version : undefined;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 13)
    return fail('Import a ThreeD Design version 1-13 JSON document (metres). Legacy .threed files require a separate converter.');
  const leveled = version >= 3, roofed = version >= 4, roofOpened = version >= 5;
  const doc = object(value, ['format', 'version', 'units', 'name', 'nodes', 'walls', 'floors', 'defaults', ...(legacy ? [] : ['openings']), ...(leveled ? ['levels'] : []), ...(roofed ? ['roofs'] : []), ...(roofOpened ? ['roofOpenings'] : []), ...(version >= 13 ? ['stairs'] : [])]);
  if (doc.format !== 'threed-home-design' || doc.units !== 'metres') fail('Import a ThreeD Design version 1-13 JSON document (metres). Legacy .threed files require a separate converter.');
  if (typeof doc.name !== 'string' || !doc.name.trim() || doc.name.length > 120) fail('Design name must contain 1–120 characters.');
  // Pick a migration ID outside the old global ID namespace, including orphan nodes.
  const oldIds = new Set(['nodes', 'walls', 'floors', 'openings'].flatMap(key => Array.isArray(doc[key]) ? (doc[key] as { id?: unknown }[]).map(entity => entity?.id) : []));
  let groundId = 'ground', suffix = 0; while (oldIds.has(groundId)) groundId = `ground-level-${++suffix}`;
  const levels: DesignLevel[] = leveled ? list(doc.levels, 20).map(value => {
    const level = object(value, ['id', 'name', 'elevation']);
    if (typeof level.name !== 'string' || !level.name.trim() || level.name.length > 60) fail('Level name must contain 1–60 characters.');
    return { id: id(level.id), name: (level.name as string).trim(), elevation: finite(level.elevation, -100, 100, 'Level elevation') };
  }) : [{ id: groundId, name: 'Ground', elevation: 0 }];
  if (!levels.length) fail('Keep at least one level in the design.');
  if (new Set(levels.map(level => level.name.toLowerCase())).size !== levels.length) fail('Level names must be unique.');
  const defaults = object(doc.defaults, ['wallHeight', 'wallThickness', 'floorThickness', 'doorHeight', 'doorWidth', ...(legacy ? [] : ['windowHeight', 'windowWidth', 'windowSill'])]);
  const nodes = list(doc.nodes, 1200).map(value => { const n = object(value, ['id', 'x', 'z']); return { id: id(n.id), x: finite(n.x, -1000, 1000, 'X'), z: finite(n.z, -1000, 1000, 'Z') }; });
  const supportsNames = version >= 9;
  const supportsAppearance = version >= 11;
  function entityRecord(value: unknown, fields: string[]) {
    const named = supportsNames && value !== null && typeof value === "object" && "name" in value;
    if (supportsAppearance && value && typeof value === "object" && "appearance" in value) fields = [...fields, "appearance"];
    return object(value, named ? [...fields, "name"] : fields);
  }
  function entityPresentation(record: Record<string, unknown>): { name?: string; appearance?: DesignAppearance } {
    const result: { name?: string; appearance?: DesignAppearance } = {};
    if ('appearance' in record) {
      const raw = record.appearance;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('Invalid Design appearance.');
      const a = raw as Record<string, unknown>;
      const appearance: DesignAppearance = {};
      for (const key of Object.keys(a)) {
        const v = a[key];
        if (key === 'color' && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) appearance.color = v;
        else if (key === 'transparency' && typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100) appearance.transparency = v;
        else if (key === 'texture' && typeof v === 'string' && v.length <= 2048 && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s?#]+$/i.test(v)) appearance.texture = v;
        else return fail('Invalid Design appearance setting.');
      }
      result.appearance = appearance;
    }
    if (!("name" in record)) return result;
    if (typeof record.name !== "string" || !record.name.trim() || record.name.length > 120) return fail("Object name must contain 1?120 characters.");
    return { ...result, name: record.name.trim() };
  }
  const walls = list(doc.walls, 500).map(value => {
    const sloped = version >= 6 && !!value && typeof value === 'object' && 'endHeight' in value;
    const w = entityRecord(value, ['id', 'start', 'end', 'height', 'thickness', 'elevation', ...(leveled ? ['levelId'] : []), ...(sloped ? ['endHeight'] : [])]);
    const height = finite(w.height, sloped ? 0 : INCH, 30, 'Wall start height');
    const endHeight = sloped ? finite(w.endHeight, 0, 30, 'Wall end height') : height;
    if (Math.max(height, endHeight) < INCH) fail('At least one wall endpoint must be one inch high.');
    return { ...entityPresentation(w), id: id(w.id), levelId: leveled ? id(w.levelId) : groundId, start: id(w.start), end: id(w.end), height, ...(sloped ? { endHeight } : {}), thickness: finite(w.thickness, INCH, 3, 'Wall thickness'), elevation: finite(w.elevation, -100, 100, 'Elevation') };
  });
  const floors: DesignFloor[] = list(doc.floors, 100).map(value => {
    const hasSurface = version >= 12 && value !== null && typeof value === 'object' && 'surface' in value;
    const f = entityRecord(value, ['id', 'vertices', 'thickness', 'elevation', ...(leveled ? ['levelId'] : []), ...(hasSurface ? ['surface'] : [])]);
    const floor: DesignFloor = {
      ...entityPresentation(f),
      id: id(f.id),
      levelId: leveled ? id(f.levelId) : groundId,
      vertices: list(f.vertices, 100).map(id),
      thickness: finite(f.thickness, INCH, 3, 'Floor thickness'),
      elevation: finite(f.elevation, -100, 100, 'Elevation'),
    };
    if (hasSurface) {
      if (typeof f.surface !== 'string' || !Object.hasOwn(outdoorSurfaceLabels, f.surface)) return fail('Choose Deck, Patio or Driveway.');
      floor.surface = f.surface as FloorSurface;
    }
    return floor;
  });
  const stairs: DesignStairs[] = (version >= 13 ? list(doc.stairs, 100) : []).map(value => {
    const s = entityRecord(value, ['id', 'levelId', 'anchor', 'direction', 'startY', 'endY', 'stepHeight', 'stepLength', 'width']);
    if (typeof s.direction !== 'number' || !Number.isFinite(s.direction) || s.direction < 0 || s.direction >= 360)
      return fail('Stairs direction must be at least 0 and less than 360 degrees.');
    const flight = {
      ...entityPresentation(s),
      id: id(s.id),
      levelId: id(s.levelId),
      anchor: id(s.anchor),
      direction: Math.min(359.999999, roundMetres(s.direction)),
      startY: finite(s.startY, -100, 100, 'Start elevation'),
      endY: finite(s.endY, -100, 100, 'End elevation'),
      stepLength: finite(s.stepLength, INCH, 30, 'Step length'),
      width: finite(s.width, INCH, 30, 'Stair width'),
      stepHeight: finite(s.stepHeight, INCH, 30, 'Step height'),
    };
    if (flight.startY === flight.endY) return fail('Stairs need different start and end elevations.');
    if (stairLayout(flight).count > 256) return fail('Use at most 256 steps per flight.');
    return flight;
  });
  const roofs: DesignRoof[] = (roofed ? list(doc.roofs, 100) : []).map(value => {
    const r = entityRecord(value, ['id', 'levelId', 'vertices', 'kind', 'pitch', 'direction', 'thickness', 'elevation']);
    if (r.kind !== 'flat' && r.kind !== 'shed' && r.kind !== 'gable') fail('Choose a Flat, Shed or Gable roof.');
    if (typeof r.pitch !== 'number' || !Number.isFinite(r.pitch) || r.pitch < 0 || r.pitch > 24) fail('Roof pitch must be 0–24 inches of rise per 12 inches of run.');
    if (typeof r.direction !== 'number' || !Number.isFinite(r.direction) || r.direction < 0 || r.direction >= 360) fail('Roof direction must be at least 0 and less than 360 degrees.');
    return { ...entityPresentation(r), id: id(r.id), levelId: id(r.levelId), vertices: list(r.vertices, 100).map(id), kind: r.kind as DesignRoof['kind'], pitch: roundMetres(r.pitch as number), direction: Math.min(359.999999, roundMetres(r.direction as number)), thickness: finite(r.thickness, INCH, 3, 'Roof thickness'), elevation: finite(r.elevation, -100, 100, 'Roof eave offset') };
  });
  const openings: DesignOpening[] = (legacy ? [] : list(doc.openings, 200)).map(value => {
    const custom = version >= 8 && value !== null && typeof value === 'object' && 'kind' in value && value.kind === 'wall-cutout';
    const door = version >= 10 && value !== null && typeof value === 'object' && 'kind' in value && value.kind === 'door';
    const configured = door && 'operation' in value;
    const hasState = door && 'isOpen' in value;
    const o = entityRecord(value, [...(hasState ? ['isOpen'] : []), ...(configured ? ['operation'] : []), 'id', 'wallId', 'kind', 'offset', 'width', 'height', 'sill', ...(custom ? ['outline'] : [])]);
    const outline = custom ? list(o.outline, 64).map(vertex => {
      const p = object(vertex, ['x','z']);
      return { x: finite(p.x,0,1,'Wall cutout corner'), z: finite(p.z,0,1,'Wall cutout corner') };
    }) : undefined;
    if (!custom && o.kind !== 'door' && o.kind !== 'window') fail('Choose a Door or Window opening.');
    if (configured && (typeof o.operation !== 'string' || !Object.hasOwn(doorOperations, o.operation))) fail('Choose a supported Door operation.');
    if (hasState && typeof o.isOpen !== 'boolean') fail('Door Open must be a boolean.');
    return { ...(hasState ? { isOpen: o.isOpen as boolean } : {}), ...(configured ? { operation: o.operation as DoorOperation } : {}), ...(outline ? {outline} : {}), ...entityPresentation(o), id: id(o.id), wallId: id(o.wallId), kind: o.kind as DesignOpening['kind'], offset: finite(o.offset, 0, 3000, 'Opening offset'), width: finite(o.width, INCH, 30, 'Opening width'), height: finite(o.height, INCH, 30, 'Opening height'), sill: finite(o.sill, 0, 30, 'Sill height') };
  });
  const roofOpenings: DesignRoofOpening[] = (roofOpened ? list(doc.roofOpenings, 200) : []).map(value => {
    const polygonal = version >= 7 && value && typeof value === 'object' && 'outline' in value;
    const o = entityRecord(value, ['id', 'roofId', 'kind', 'along', 'across', 'width', 'length', ...(polygonal ? ['outline'] : [])]);
    const outline = polygonal ? list(o.outline, 64).map(vertex => {
      const p = object(vertex, ['x', 'z']);
      return { x: finite(p.x, 0, 1, 'Cutout corner'), z: finite(p.z, 0, 1, 'Cutout corner') };
    }) : undefined;
    if (outline && o.kind !== 'cutout') fail('Only Roof Cutouts support a custom outline.');
    if (o.kind !== 'cutout' && o.kind !== 'skylight') fail('Choose a Roof Cutout or Skylight.');
    return { ...(outline ? { outline } : {}), ...entityPresentation(o), id: id(o.id), roofId: id(o.roofId), kind: o.kind as DesignRoofOpening['kind'], along: finite(o.along, -3000, 3000, 'Roof opening along offset'), across: finite(o.across, -3000, 3000, 'Roof opening across offset'), width: finite(o.width, INCH, 30, 'Roof opening width'), length: finite(o.length, INCH, 30, 'Roof opening length') };
  });
  const ids = [...levels, ...nodes, ...walls, ...floors, ...roofs, ...openings, ...roofOpenings, ...stairs].map(entity => entity.id);
  if (new Set(ids).size !== ids.length) fail('Entity IDs must be unique.');
  const byId = new Map(nodes.map(node => [node.id, node]));
  const pairs = new Set<string>();
  const nodeLevels = new Map<string, string>();
  for (const entity of [...walls, ...floors, ...roofs, ...stairs]) {
    if (!levels.some(level => level.id === entity.levelId)) fail('A Design object references a missing level.');
    for (const key of 'vertices' in entity ? entity.vertices : 'anchor' in entity ? [entity.anchor] : [entity.start, entity.end]) {
      if (nodeLevels.has(key) && nodeLevels.get(key) !== entity.levelId) fail('Different levels must not share corner nodes.');
      nodeLevels.set(key, entity.levelId);
    }
  }
  for (const flight of stairs) {
    if (stairFootprint({ nodes }, flight).some(p => Math.abs(p.x) > 1000 + EPS || Math.abs(p.z) > 1000 + EPS))
      fail('Keep Stairs within the plan limits of ±1000 metres.');
  }
  for (const wall of walls) {
    const a = byId.get(wall.start), b = byId.get(wall.end);
    if (!a || !b) fail('A wall references a missing node.');
    if (distance(a!, b!) < .0254) fail('Walls must be at least one inch long.');
    const pair = [wall.start, wall.end].sort().join(':');
    if (pairs.has(pair)) fail('Duplicate wall segments are not allowed.'); pairs.add(pair);
  }
  for (const floor of floors) { const points = floor.vertices.map(key => byId.get(key) ?? fail('A floor references a missing node.')); const issue = polygonIssue(points); if (issue) fail(issue); }
  for (const roof of roofs) {
    const points = roof.vertices.map(key => byId.get(key) ?? fail('A roof references a missing node.'));
    const issue = polygonIssue(points); if (issue) fail(issue.replaceAll('floor', 'roof').replaceAll('Floor', 'Roof'));
    if (points.some((point, i) => distance(point, points[(i + 1) % points.length]) < INCH - EPS)) fail('Roof edges must be at least one inch long.');
    if (roofProfile(points, roof).rise > 30 + EPS) fail('Roof rise must not exceed 30 metres. Reduce its pitch or footprint.');
  }
  for (const opening of openings) {
    const wall = walls.find(w => w.id === opening.wallId) ?? fail('An opening references a missing host wall.');
    const length = distance(byId.get(wall.start)!, byId.get(wall.end)!);
    const label = opening.kind === 'door' ? 'Door' : 'Window';
    if (opening.kind === 'wall-cutout') {
      const ring = wallOpeningFace(opening);
      const issue = polygonIssue(ring);
      if (issue) fail(issue.replace(/floor/gi, 'Wall Cutout'));
      if (ring.some(p => p.x < -EPS || p.x > length + .00005 || p.z < -EPS || p.z > wallHeightAt(wall,p.x,length) + .00005)) fail('Keep the cutout within the wall face.');
    } else if (opening.offset < openingMargin(wall) - EPS || opening.offset + opening.width > length - openingMargin(wall) + EPS)
      fail(`${label} does not fit its host wall. Keep ${formatLength(openingMargin(wall))} clear at both ends; move/resize the opening before shortening the wall.`);
    const clearance = Math.min(wallHeightAt(wall, opening.offset, length), wallHeightAt(wall, opening.offset + opening.width, length));
    if (opening.kind !== 'wall-cutout' && opening.sill + opening.height > clearance - INCH + EPS) fail(`${label} is taller than its host wall allows. Keep at least one inch of wall above both opening edges.`);
    if (opening.kind === 'door' && opening.sill !== 0) fail('Door sill must be zero relative to its host wall base.');
    if (opening.kind === 'window' && opening.sill < INCH) fail('Window sill must be at least one inch above its host wall base.');
    const hosted = openings.filter(other => other.wallId === opening.wallId);
    if (hosted.length > 20) fail('A wall supports at most 20 openings.');
    if (hosted.some(other => {
      if (other.id === opening.id) return false;
      if (opening.outline || other.outline) {
        const a = wallOpeningFace(opening), b = wallOpeningFace(other);
        return insidePolygon(a[0], b) || insidePolygon(b[0], a) || a.some((p,i) => b.some((q,j) => segmentDistance(p,a[(i+1)%a.length],q,b[(j+1)%b.length]) < INCH-EPS));
      }
      return opening.offset < other.offset + other.width + INCH - EPS && opening.offset + opening.width + INCH > other.offset + EPS && opening.sill < other.sill + other.height + INCH - EPS && opening.sill + opening.height + INCH > other.sill + EPS;
    })) fail('Openings must not overlap. Keep at least one inch between their edges.');
  }
  for (const opening of roofOpenings) { const issue = roofOpeningIssue({ nodes, roofs, roofOpenings }, opening); if (issue) fail(issue); }
  return { format: 'threed-home-design', version: Math.max(version, 5) as DesignDocument['version'], units: 'metres', name: (doc.name as string).trim(), levels, nodes, walls, floors, roofs, openings, roofOpenings, ...(version >= 13 && { stairs }),
    defaults: { wallHeight: finite(defaults.wallHeight, .0254, 30, 'Default height'), wallThickness: finite(defaults.wallThickness, .0254, 3, 'Default wall thickness'), floorThickness: finite(defaults.floorThickness, .0254, 3, 'Default floor thickness'), doorHeight: finite(defaults.doorHeight, .0254, 30, 'Door height'), doorWidth: finite(defaults.doorWidth, .0254, 30, 'Door width'),
      windowHeight: finite(legacy ? 48 * INCH : defaults.windowHeight, INCH, 30, 'Window height'), windowWidth: finite(legacy ? 36 * INCH : defaults.windowWidth, INCH, 30, 'Window width'), windowSill: finite(legacy ? 36 * INCH : defaults.windowSill, INCH, 30, 'Window sill') } };
}
/** Clamp miter extensions to their endpoint height; shared by validation and solids. */
export function wallHeightAt(wall: DesignWall, offset: number, length: number): number {
  return wall.height + ((wall.endHeight ?? wall.height) - wall.height) * Math.max(0, Math.min(1, offset / length));
}
/** Elevations on walls/floors are offsets from their named level; openings inherit their host. */
export const entityElevation = (doc: DesignDocument, entity: DesignWall | DesignFloor | DesignRoof) => (doc.levels.find(level => level.id === entity.levelId)?.elevation ?? fail('Missing level.')) + entity.elevation;
/** Direction is ridge/contour bearing from +X toward +Z; pitch is rise per 12 run. */
export function roofProfile(points: PlanPoint[], roof: Pick<DesignRoof, 'direction' | 'kind' | 'pitch'>) {
  const radians = roof.direction * Math.PI / 180, dx = Math.cos(radians), dz = Math.sin(radians);
  const project = (point: PlanPoint) => -dz * point.x + dx * point.z;
  const values = points.map(project), min = Math.min(...values), max = Math.max(...values), ridge = (min + max) / 2;
  const rise = roof.kind === 'flat' ? 0 : (max - min) * roof.pitch / (roof.kind === 'gable' ? 24 : 12);
  return { project, ridge, rise, height: (point: PlanPoint) => roof.kind === 'flat' ? 0 : Math.max(0, roof.kind === 'gable' ? Math.min(project(point) - min, max - project(point)) : project(point) - min) * roof.pitch / 12 };
}
/** Strict interior test; clearance is checked separately against every polygon edge. */
export function insidePolygon(point: PlanPoint, points: PlanPoint[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.z > point.z) !== (b.z > point.z) && point.x < (b.x - a.x) * (point.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}
export function roofFrame(doc: Pick<DesignDocument, 'nodes'>, roof: DesignRoof) {
  const origin = doc.nodes.find(node => node.id === roof.vertices[0])!, angle = roof.direction * Math.PI / 180, dx = Math.cos(angle), dz = Math.sin(angle);
  return { point: (along: number, across: number): PlanPoint => ({ x: origin.x + along * dx - across * dz, z: origin.z + along * dz + across * dx }),
    local: (p: PlanPoint) => ({ along: (p.x - origin.x) * dx + (p.z - origin.z) * dz, across: -(p.x - origin.x) * dz + (p.z - origin.z) * dx }) };
}
/** Store the outline relative to its roof-local bounds so the existing size and offset controls still apply. */
export function cutoutBounds(corners: { along: number; across: number }[]) {
  const xs = corners.map(p => p.along), zs = corners.map(p => p.across);
  const along = Math.min(...xs), across = Math.min(...zs);
  const width = Math.max(...xs) - along, length = Math.max(...zs) - across;
  if (width < INCH || length < INCH) throw new Error('Draw a cutout at least one inch wide and long.');
  return { along, across, width, length, outline: corners.map(p => ({ x: (p.along - along) / width, z: (p.across - across) / length })) };
}
export function nearestRoofEdge(p: PlanPoint, ring: PlanPoint[]) {
  let closest = ring[0], gap = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((p.x-a.x)*dx + (p.z-a.z)*dz) / (dx*dx + dz*dz)));
    const point = { x: a.x+t*dx, z: a.z+t*dz };
    const d = distance(p, point);
    if (d < gap) { closest = point; gap = d; }
  }
  return { point: closest, gap };
}
export function withinRoof(p: PlanPoint, ring: PlanPoint[]) {
  return insidePolygon(p, ring) || nearestRoofEdge(p, ring).gap <= EPS;
}
export function roofOpeningFootprint(doc: Pick<DesignDocument, 'nodes' | 'roofs'>, opening: DesignRoofOpening) {
  const roof = doc.roofs.find(roof => roof.id === opening.roofId)!, frame = roofFrame(doc, roof);
  const corners = opening.outline ? opening.outline.map(p => frame.point(opening.along + p.x * opening.width, opening.across + p.z * opening.length)) : [frame.point(opening.along, opening.across), frame.point(opening.along + opening.width, opening.across), frame.point(opening.along + opening.width, opening.across + opening.length), frame.point(opening.along, opening.across + opening.length)];
  if (opening.kind !== 'cutout') return corners;
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  const perimeter = roof.vertices.map(id => nodes.get(id)!);
  // Normalized outline coordinates are stored to six decimal places over spans up to 30 m.
  return corners.map(p => { const edge = nearestRoofEdge(p, perimeter); return edge.gap <= .000025 ? edge.point : p; });
}
function segmentDistance(a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) {
  if (intersects(a, b, c, d)) return 0;
  const pointDistance = (p: PlanPoint, start: PlanPoint, end: PlanPoint) => {
    const length2 = (end.x - start.x) ** 2 + (end.z - start.z) ** 2;
    const t = Math.max(0, Math.min(1, ((p.x - start.x) * (end.x - start.x) + (p.z - start.z) * (end.z - start.z)) / length2));
    return distance(p, { x: start.x + (end.x - start.x) * t, z: start.z + (end.z - start.z) * t });
  };
  return Math.min(pointDistance(a, c, d), pointDistance(b, c, d), pointDistance(c, a, b), pointDistance(d, a, b));
}
export function roofOpeningIssue(doc: Pick<DesignDocument, 'nodes' | 'roofs' | 'roofOpenings'>, opening: DesignRoofOpening): string | null {
  const roof = doc.roofs.find(roof => roof.id === opening.roofId);
  if (!roof) return 'A roof opening references a missing host roof.';
  const points = roof.vertices.map(id => doc.nodes.find(node => node.id === id)!), footprint = roofOpeningFootprint(doc, opening);
  if (opening.outline) {
    const issue = polygonIssue(footprint);
    if (issue) return issue.replace(/floor/gi, 'cutout');
  }
  if (opening.kind === 'cutout') {
    if (footprint.some(p => !withinRoof(p, points))) return 'Cutout does not fit within its roof.';
    // Between successive boundary intersections a straight segment is entirely inside or outside.
    for (let i = 0; i < footprint.length; i++) {
      const a = footprint[i], b = footprint[(i + 1) % footprint.length];
      const dx = b.x-a.x, dz = b.z-a.z;
      const at = [0, 1];
      for (let j = 0; j < points.length; j++) {
        const c = points[j], d = points[(j+1)%points.length];
        const ex = d.x-c.x, ez = d.z-c.z, det = dx*ez-dz*ex;
        if (Math.abs(det) > 1e-12) {
          const u = ((c.x-a.x)*dz-(c.z-a.z)*dx)/det;
          const t = ((c.x-a.x)*ez-(c.z-a.z)*ex)/det;
          if (u >= -EPS && u <= 1+EPS && t > 0 && t < 1) at.push(t);
        }
      }
      at.sort((x,y)=>x-y);
      for (let k=1;k<at.length;k++) {
        const t = (at[k]+at[k-1])/2;
        if (!withinRoof({x:a.x+t*dx,z:a.z+t*dz},points)) return 'Cutout does not fit within its roof.';
      }
    }
  } else if (footprint.some(p => !insidePolygon(p, points)) || footprint.some((p, i) => points.some((q, j) => segmentDistance(p, footprint[(i + 1) % footprint.length], q, points[(j + 1) % points.length]) < INCH - EPS)))
    return 'Roof opening does not fit. Keep at least one inch inside every roof edge; move or resize the opening before changing its host.';
  const hosted = doc.roofOpenings.filter(other => other.roofId === roof.id);
  if (hosted.length > 20) return 'A roof supports at most 20 openings.';
  if (hosted.some(other => {
    if (other.id === opening.id) return false;
    const ring = roofOpeningFootprint(doc, other);
    return insidePolygon(footprint[0], ring) || insidePolygon(ring[0], footprint)
      || footprint.some((a, i) => ring.some((b, j) => segmentDistance(a, footprint[(i + 1) % footprint.length], b, ring[(j + 1) % ring.length]) < INCH - EPS));
  }))
    return 'Roof openings must not overlap. Keep at least one inch between their edges.';
  if (opening.kind === 'skylight' && roof.kind === 'gable' && roof.pitch > 0) {
    const profile = roofProfile(points, roof), projected = footprint.map(profile.project);
    if (Math.min(...projected) < profile.ridge + INCH - EPS && Math.max(...projected) > profile.ridge - INCH + EPS)
      return 'Skylights must stay on one roof plane, at least one inch from the gable ridge. Move the skylight or use Roof Cutout.';
  }
  return null;
}
export function entityLevelId(doc: DesignDocument, entityId: string) {
  const hostId = doc.openings.find(opening => opening.id === entityId)?.wallId ?? doc.roofOpenings.find(opening => opening.id === entityId)?.roofId ?? entityId;
  return doc.walls.find(wall => wall.id === hostId)?.levelId ?? doc.floors.find(floor => floor.id === hostId)?.levelId ?? doc.roofs.find(roof => roof.id === hostId)?.levelId ?? doc.stairs?.find(stair => stair.id === hostId)?.levelId;
}
/** A view only. Always commit edits against the full document, never against this filtered copy. */
export function levelDocument(doc: DesignDocument, levelId: string): DesignDocument {
  const walls = doc.walls.filter(wall => wall.levelId === levelId), floors = doc.floors.filter(floor => floor.levelId === levelId);
  const hosts = new Set(walls.map(wall => wall.id));
  const roofs = doc.roofs.filter(roof => roof.levelId === levelId), roofIds = new Set(roofs.map(roof => roof.id));
  return pruneNodes({ ...doc, walls, floors, roofs,
    ...(doc.stairs && { stairs: doc.stairs.filter(stair => stair.levelId === levelId) }),
    roofOpenings: doc.roofOpenings.filter(opening => roofIds.has(opening.roofId)), openings: doc.openings.filter(opening => hosts.has(opening.wallId)) });
}
export function removeLevel(doc: DesignDocument, levelId: string): DesignDocument {
  if (!doc.levels.some(level => level.id === levelId)) return fail('Missing level.');
  if (doc.levels.length === 1) return fail('Keep at least one level in the design.');
  const walls = doc.walls.filter(wall => wall.levelId !== levelId), hosts = new Set(walls.map(wall => wall.id));
  const roofs = doc.roofs.filter(roof => roof.levelId !== levelId), roofIds = new Set(roofs.map(roof => roof.id));
  return pruneNodes({ ...doc, levels: doc.levels.filter(level => level.id !== levelId), walls,
    ...(doc.stairs && { stairs: doc.stairs.filter(stair => stair.levelId !== levelId) }),
    floors: doc.floors.filter(floor => floor.levelId !== levelId), roofs, roofOpenings: doc.roofOpenings.filter(opening => roofIds.has(opening.roofId)), openings: doc.openings.filter(opening => hosts.has(opening.wallId)) });
}
/** Keep rectangular apertures outside the bounded miter corner region. */
export const openingMargin = (wall: DesignWall) => 2 * wall.thickness;
export function wallFrame(doc: DesignDocument, wall: DesignWall) {
  const start = doc.nodes.find(n => n.id === wall.start)!, end = doc.nodes.find(n => n.id === wall.end)!;
  const length = distance(start, end), dx = (end.x - start.x) / length, dz = (end.z - start.z) / length;
  return { start, end, length, dx, dz, project: (p: PlanPoint) => (p.x - start.x) * dx + (p.z - start.z) * dz,
    point: (offset: number): PlanPoint => ({ x: start.x + dx * offset, z: start.z + dz * offset }) };
}
/** x is distance along the host; z represents height above its base in this face view. */
export function wallOpeningFace(o: DesignOpening): PlanPoint[] {
  const outline = o.outline ?? [{x:0,z:0},{x:1,z:0},{x:1,z:1},{x:0,z:1}];
  return outline.map(p => ({ x:o.offset+p.x*o.width, z:o.sill+p.z*o.height }));
}
export function openingFootprint(doc: DesignDocument, opening: DesignOpening): PlanPoint[] {
  const wall = doc.walls.find(w => w.id === opening.wallId)!;
  const frame = wallFrame(doc, wall), a = frame.point(opening.offset), b = frame.point(opening.offset + opening.width), half = wall.thickness / 2;
  return [{ x: a.x - frame.dz * half, z: a.z + frame.dx * half }, { x: b.x - frame.dz * half, z: b.z + frame.dx * half }, { x: b.x + frame.dz * half, z: b.z - frame.dx * half }, { x: a.x + frame.dz * half, z: a.z - frame.dx * half }];
}
export function removeEntity(doc: DesignDocument, entityId: string): DesignDocument {
  return pruneNodes({ ...doc,
    ...(doc.stairs && { stairs: doc.stairs.filter(stair => stair.id !== entityId) }),
    walls: doc.walls.filter(w => w.id !== entityId), floors: doc.floors.filter(f => f.id !== entityId), roofs: doc.roofs.filter(r => r.id !== entityId), roofOpenings: doc.roofOpenings.filter(o => o.id !== entityId && o.roofId !== entityId), openings: doc.openings.filter(o => o.id !== entityId && o.wallId !== entityId) });
}
export function parseDesign(text: string) { if (new TextEncoder().encode(text).length > 1024 * 1024) fail('Design JSON must be at most 1 MiB.'); return validateDesign(JSON.parse(text)); }
export function pruneNodes(doc: DesignDocument): DesignDocument {
  const used = new Set([...doc.walls.flatMap(wall => [wall.start, wall.end]), ...doc.floors.flatMap(floor => floor.vertices), ...doc.roofs.flatMap(roof => roof.vertices), ...(doc.stairs ?? []).map(stair => stair.anchor)]);
  return { ...doc, nodes: doc.nodes.filter(node => used.has(node.id)) };
}
/** Node identity makes adjacent walls and any snapped floor move together. */
export function moveNodes(doc: DesignDocument, positions: Map<string, PlanPoint>): DesignDocument {
  return { ...doc, nodes: doc.nodes.map(node => positions.has(node.id) ? { ...node, x: roundMetres(positions.get(node.id)!.x), z: roundMetres(positions.get(node.id)!.z) } : node) };
}
export function mergeNodes(doc: DesignDocument, source: string, target: string): DesignDocument {
  if (source === target) return doc;
  return pruneNodes({ ...doc,
    ...(doc.stairs && { stairs: doc.stairs.map(stair => stair.anchor === source ? { ...stair, anchor: target } : stair) }),
    nodes: doc.nodes.filter(node => node.id !== source), walls: doc.walls.map(wall => ({ ...wall, start: wall.start === source ? target : wall.start, end: wall.end === source ? target : wall.end })), floors: doc.floors.map(floor => ({ ...floor, vertices: floor.vertices.map(key => key === source ? target : key) })), roofs: doc.roofs.map(roof => ({ ...roof, vertices: roof.vertices.map(key => key === source ? target : key) })) });
}
export interface PlanView { x: number; y: number; scale: number }
export const screenToPlan = (point: { x: number; y: number }, view: PlanView): PlanPoint => ({ x: (point.x - view.x) / view.scale, z: (point.y - view.y) / view.scale });
export const planToScreen = (point: PlanPoint, view: PlanView) => ({ x: point.x * view.scale + view.x, y: point.z * view.scale + view.y });
export function snapPoint(point: PlanPoint, nodes: DesignNode[], pixelsPerMetre: number, grid: boolean, exclude: string[] = []) {
  let nearest: DesignNode | undefined; let best = 10 / pixelsPerMetre;
  for (const node of nodes) if (!exclude.includes(node.id)) { const span = distance(point, node); if (span < best) { nearest = node; best = span; } }
  if (nearest) return { point: { x: nearest.x, z: nearest.z }, nodeId: nearest.id };
  const step = 6 * INCH;
  return { point: { x: roundMetres(grid ? Math.round(point.x / step) * step : point.x), z: roundMetres(grid ? Math.round(point.z / step) * step : point.z) }, nodeId: undefined };
}

/** Visibility projection only; the editable document remains unchanged. */
export function visibleLevelsDocument(doc: DesignDocument, ids: readonly string[]): DesignDocument {
  const levels = ids.map(id => levelDocument(doc, id));
  const collect = <T extends { id: string }>(items: T[][]): T[] => [...new Map(items.flat().map(item => [item.id, item])).values()];
  return { ...doc,
    ...(doc.stairs && { stairs: collect(levels.map(level => level.stairs ?? [])) }),
    nodes: collect(levels.map(level => level.nodes)), walls: collect(levels.map(level => level.walls)), floors: collect(levels.map(level => level.floors)), roofs: collect(levels.map(level => level.roofs)), openings: collect(levels.map(level => level.openings)), roofOpenings: collect(levels.map(level => level.roofOpenings)) };
}
