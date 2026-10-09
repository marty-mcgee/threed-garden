/** Editable design data. Metres internally; plan +Z points down, Three uses Y up. */
export interface PlanPoint { x: number; z: number }
export interface DesignNode extends PlanPoint { id: string }
export interface DesignLevel { id: string; name: string; elevation: number }
export interface DesignWall { id: string; levelId: string; start: string; end: string; height: number; thickness: number; elevation: number }
export interface DesignFloor { id: string; levelId: string; vertices: string[]; thickness: number; elevation: number }
export interface DesignRoof { id: string; levelId: string; vertices: string[]; kind: 'flat' | 'shed' | 'gable'; pitch: number; direction: number; thickness: number; elevation: number }
export interface DesignOpening { id: string; wallId: string; kind: 'door' | 'window'; offset: number; width: number; height: number; sill: number }
/** Rectangles in the host roof's direction/perpendicular frame, from its first corner. */
export interface DesignRoofOpening { id: string; roofId: string; kind: 'cutout' | 'skylight'; along: number; across: number; width: number; length: number }
export interface DesignDocument {
  format: 'threed-home-design'; version: 5; units: 'metres'; name: string;
  levels: DesignLevel[]; nodes: DesignNode[]; walls: DesignWall[]; floors: DesignFloor[]; roofs: DesignRoof[]; openings: DesignOpening[]; roofOpenings: DesignRoofOpening[];
  defaults: { wallHeight: number; wallThickness: number; floorThickness: number; doorHeight: number; doorWidth: number; windowHeight: number; windowWidth: number; windowSill: number };
}
export const INCH = 0.0254;
export const EPS = 0.000001;
export const inchesToMetres = (inches: number) => inches * INCH;
export const legacyCentimetresToMetres = (centimetres: number) => centimetres / 100;
export const roundMetres = (value: number) => Math.round(value * 1e6) / 1e6;
export const distance = (a: PlanPoint, b: PlanPoint) => Math.hypot(a.x - b.x, a.z - b.z);
export const newDesign = (): DesignDocument => ({ format: 'threed-home-design', version: 5, units: 'metres', name: 'Untitled Home Design',
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
  const leveled = version === 3 || version === 4 || version === 5, roofed = version === 4 || version === 5;
  const doc = object(value, ['format', 'version', 'units', 'name', 'nodes', 'walls', 'floors', 'defaults', ...(legacy ? [] : ['openings']), ...(leveled ? ['levels'] : []), ...(roofed ? ['roofs'] : []), ...(version === 5 ? ['roofOpenings'] : [])]);
  if (doc.format !== 'threed-home-design' || ![1, 2, 3, 4, 5].includes(doc.version as number) || doc.units !== 'metres') fail('Import a ThreeD Home Design version 1–5 JSON document (metres). Legacy .threed files require a separate converter.');
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
  const walls = list(doc.walls, 500).map(value => { const w = object(value, ['id', 'start', 'end', 'height', 'thickness', 'elevation', ...(leveled ? ['levelId'] : [])]); return { id: id(w.id), levelId: leveled ? id(w.levelId) : groundId, start: id(w.start), end: id(w.end), height: finite(w.height, .0254, 30, 'Wall height'), thickness: finite(w.thickness, .0254, 3, 'Wall thickness'), elevation: finite(w.elevation, -100, 100, 'Elevation') }; });
  const floors = list(doc.floors, 100).map(value => { const f = object(value, ['id', 'vertices', 'thickness', 'elevation', ...(leveled ? ['levelId'] : [])]); return { id: id(f.id), levelId: leveled ? id(f.levelId) : groundId, vertices: list(f.vertices, 100).map(id), thickness: finite(f.thickness, .0254, 3, 'Floor thickness'), elevation: finite(f.elevation, -100, 100, 'Elevation') }; });
  const roofs: DesignRoof[] = (roofed ? list(doc.roofs, 100) : []).map(value => {
    const r = object(value, ['id', 'levelId', 'vertices', 'kind', 'pitch', 'direction', 'thickness', 'elevation']);
    if (r.kind !== 'flat' && r.kind !== 'shed' && r.kind !== 'gable') fail('Choose a Flat, Shed or Gable roof.');
    if (typeof r.pitch !== 'number' || !Number.isFinite(r.pitch) || r.pitch < 0 || r.pitch > 24) fail('Roof pitch must be 0–24 inches of rise per 12 inches of run.');
    if (typeof r.direction !== 'number' || !Number.isFinite(r.direction) || r.direction < 0 || r.direction >= 360) fail('Roof direction must be at least 0 and less than 360 degrees.');
    return { id: id(r.id), levelId: id(r.levelId), vertices: list(r.vertices, 100).map(id), kind: r.kind as DesignRoof['kind'], pitch: roundMetres(r.pitch as number), direction: Math.min(359.999999, roundMetres(r.direction as number)), thickness: finite(r.thickness, INCH, 3, 'Roof thickness'), elevation: finite(r.elevation, -100, 100, 'Roof eave offset') };
  });
  const openings = (legacy ? [] : list(doc.openings, 200)).map(value => {
    const o = object(value, ['id', 'wallId', 'kind', 'offset', 'width', 'height', 'sill']);
    if (o.kind !== 'door' && o.kind !== 'window') fail('Choose a Door or Window opening.');
    return { id: id(o.id), wallId: id(o.wallId), kind: o.kind as 'door' | 'window', offset: finite(o.offset, 0, 3000, 'Opening offset'), width: finite(o.width, INCH, 30, 'Opening width'), height: finite(o.height, INCH, 30, 'Opening height'), sill: finite(o.sill, 0, 30, 'Sill height') };
  });
  const roofOpenings: DesignRoofOpening[] = (version === 5 ? list(doc.roofOpenings, 200) : []).map(value => {
    const o = object(value, ['id', 'roofId', 'kind', 'along', 'across', 'width', 'length']);
    if (o.kind !== 'cutout' && o.kind !== 'skylight') fail('Choose a Roof Cutout or Skylight.');
    return { id: id(o.id), roofId: id(o.roofId), kind: o.kind as DesignRoofOpening['kind'], along: finite(o.along, -3000, 3000, 'Roof opening along offset'), across: finite(o.across, -3000, 3000, 'Roof opening across offset'), width: finite(o.width, INCH, 30, 'Roof opening width'), length: finite(o.length, INCH, 30, 'Roof opening length') };
  });
  const ids = [...levels, ...nodes, ...walls, ...floors, ...roofs, ...openings, ...roofOpenings].map(entity => entity.id);
  if (new Set(ids).size !== ids.length) fail('Entity IDs must be unique.');
  const byId = new Map(nodes.map(node => [node.id, node]));
  const pairs = new Set<string>();
  const nodeLevels = new Map<string, string>();
  for (const entity of [...walls, ...floors, ...roofs]) {
    if (!levels.some(level => level.id === entity.levelId)) fail('A wall, floor or roof references a missing level.');
    for (const key of 'vertices' in entity ? entity.vertices : [entity.start, entity.end]) {
      if (nodeLevels.has(key) && nodeLevels.get(key) !== entity.levelId) fail('Different levels must not share corner nodes.');
      nodeLevels.set(key, entity.levelId);
    }
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
    if (opening.offset < openingMargin(wall) - EPS || opening.offset + opening.width > length - openingMargin(wall) + EPS)
      fail(`${label} does not fit its host wall. Keep ${formatLength(openingMargin(wall))} clear at both ends; move/resize the opening before shortening the wall.`);
    if (opening.sill + opening.height > wall.height - INCH + EPS) fail(`${label} is taller than its host wall allows. Keep at least one inch of wall above the opening.`);
    if (opening.kind === 'door' && opening.sill !== 0) fail('Door sill must be zero relative to its host wall base.');
    if (opening.kind === 'window' && opening.sill < INCH) fail('Window sill must be at least one inch above its host wall base.');
    const hosted = openings.filter(other => other.wallId === opening.wallId);
    if (hosted.length > 20) fail('A wall supports at most 20 openings.');
    if (hosted.some(other => other.id !== opening.id && opening.offset < other.offset + other.width + INCH - EPS && opening.offset + opening.width + INCH > other.offset + EPS && opening.sill < other.sill + other.height + INCH - EPS && opening.sill + opening.height + INCH > other.sill + EPS)) fail('Openings must not overlap. Keep at least one inch between their edges.');
  }
  for (const opening of roofOpenings) { const issue = roofOpeningIssue({ nodes, roofs, roofOpenings }, opening); if (issue) fail(issue); }
  return { format: 'threed-home-design', version: 5, units: 'metres', name: (doc.name as string).trim(), levels, nodes, walls, floors, roofs, openings, roofOpenings,
    defaults: { wallHeight: finite(defaults.wallHeight, .0254, 30, 'Default height'), wallThickness: finite(defaults.wallThickness, .0254, 3, 'Default wall thickness'), floorThickness: finite(defaults.floorThickness, .0254, 3, 'Default floor thickness'), doorHeight: finite(defaults.doorHeight, .0254, 30, 'Door height'), doorWidth: finite(defaults.doorWidth, .0254, 30, 'Door width'),
      windowHeight: finite(legacy ? 48 * INCH : defaults.windowHeight, INCH, 30, 'Window height'), windowWidth: finite(legacy ? 36 * INCH : defaults.windowWidth, INCH, 30, 'Window width'), windowSill: finite(legacy ? 36 * INCH : defaults.windowSill, INCH, 30, 'Window sill') } };
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
export function roofOpeningFootprint(doc: Pick<DesignDocument, 'nodes' | 'roofs'>, opening: DesignRoofOpening) {
  const roof = doc.roofs.find(roof => roof.id === opening.roofId)!, frame = roofFrame(doc, roof);
  return [frame.point(opening.along, opening.across), frame.point(opening.along + opening.width, opening.across), frame.point(opening.along + opening.width, opening.across + opening.length), frame.point(opening.along, opening.across + opening.length)];
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
  if (footprint.some(p => !insidePolygon(p, points)) || footprint.some((p, i) => points.some((q, j) => segmentDistance(p, footprint[(i + 1) % 4], q, points[(j + 1) % points.length]) < INCH - EPS)))
    return 'Roof opening does not fit. Keep at least one inch inside every roof edge; move or resize the opening before changing its host.';
  const hosted = doc.roofOpenings.filter(other => other.roofId === roof.id);
  if (hosted.length > 20) return 'A roof supports at most 20 openings.';
  if (hosted.some(other => other.id !== opening.id && opening.along < other.along + other.width + INCH - EPS && opening.along + opening.width + INCH > other.along + EPS && opening.across < other.across + other.length + INCH - EPS && opening.across + opening.length + INCH > other.across + EPS))
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
  return doc.walls.find(wall => wall.id === hostId)?.levelId ?? doc.floors.find(floor => floor.id === hostId)?.levelId ?? doc.roofs.find(roof => roof.id === hostId)?.levelId;
}
/** A view only. Always commit edits against the full document, never against this filtered copy. */
export function levelDocument(doc: DesignDocument, levelId: string): DesignDocument {
  const walls = doc.walls.filter(wall => wall.levelId === levelId), floors = doc.floors.filter(floor => floor.levelId === levelId);
  const hosts = new Set(walls.map(wall => wall.id));
  const roofs = doc.roofs.filter(roof => roof.levelId === levelId), roofIds = new Set(roofs.map(roof => roof.id));
  return pruneNodes({ ...doc, walls, floors, roofs, roofOpenings: doc.roofOpenings.filter(opening => roofIds.has(opening.roofId)), openings: doc.openings.filter(opening => hosts.has(opening.wallId)) });
}
export function removeLevel(doc: DesignDocument, levelId: string): DesignDocument {
  if (!doc.levels.some(level => level.id === levelId)) return fail('Missing level.');
  if (doc.levels.length === 1) return fail('Keep at least one level in the design.');
  const walls = doc.walls.filter(wall => wall.levelId !== levelId), hosts = new Set(walls.map(wall => wall.id));
  const roofs = doc.roofs.filter(roof => roof.levelId !== levelId), roofIds = new Set(roofs.map(roof => roof.id));
  return pruneNodes({ ...doc, levels: doc.levels.filter(level => level.id !== levelId), walls,
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
export function openingFootprint(doc: DesignDocument, opening: DesignOpening): PlanPoint[] {
  const wall = doc.walls.find(w => w.id === opening.wallId)!;
  const frame = wallFrame(doc, wall), a = frame.point(opening.offset), b = frame.point(opening.offset + opening.width), half = wall.thickness / 2;
  return [{ x: a.x - frame.dz * half, z: a.z + frame.dx * half }, { x: b.x - frame.dz * half, z: b.z + frame.dx * half }, { x: b.x + frame.dz * half, z: b.z - frame.dx * half }, { x: a.x + frame.dz * half, z: a.z - frame.dx * half }];
}
export function removeEntity(doc: DesignDocument, entityId: string): DesignDocument {
  return pruneNodes({ ...doc, walls: doc.walls.filter(w => w.id !== entityId), floors: doc.floors.filter(f => f.id !== entityId), roofs: doc.roofs.filter(r => r.id !== entityId), roofOpenings: doc.roofOpenings.filter(o => o.id !== entityId && o.roofId !== entityId), openings: doc.openings.filter(o => o.id !== entityId && o.wallId !== entityId) });
}
export function parseDesign(text: string) { if (new TextEncoder().encode(text).length > 1024 * 1024) fail('Design JSON must be at most 1 MiB.'); return validateDesign(JSON.parse(text)); }
export function pruneNodes(doc: DesignDocument): DesignDocument {
  const used = new Set([...doc.walls.flatMap(wall => [wall.start, wall.end]), ...doc.floors.flatMap(floor => floor.vertices), ...doc.roofs.flatMap(roof => roof.vertices)]);
  return { ...doc, nodes: doc.nodes.filter(node => used.has(node.id)) };
}
/** Node identity makes adjacent walls and any snapped floor move together. */
export function moveNodes(doc: DesignDocument, positions: Map<string, PlanPoint>): DesignDocument {
  return { ...doc, nodes: doc.nodes.map(node => positions.has(node.id) ? { ...node, x: roundMetres(positions.get(node.id)!.x), z: roundMetres(positions.get(node.id)!.z) } : node) };
}
export function mergeNodes(doc: DesignDocument, source: string, target: string): DesignDocument {
  if (source === target) return doc;
  return pruneNodes({ ...doc, nodes: doc.nodes.filter(node => node.id !== source), walls: doc.walls.map(wall => ({ ...wall, start: wall.start === source ? target : wall.start, end: wall.end === source ? target : wall.end })), floors: doc.floors.map(floor => ({ ...floor, vertices: floor.vertices.map(key => key === source ? target : key) })), roofs: doc.roofs.map(roof => ({ ...roof, vertices: roof.vertices.map(key => key === source ? target : key) })) });
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
