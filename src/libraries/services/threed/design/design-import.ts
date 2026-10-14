import { legacyCentimetresToMetres, newDesign, parseDesign, roundMetres, validateDesign, type DesignDocument, type PlanPoint } from './document';

export interface DesignImportPreview {
  document: DesignDocument;
  source: 'native' | 'legacy';
  /** Conversion losses must be reviewed before applying any content. */
  warnings: string[];
}

type RecordValue = Record<string, unknown>;
const maps = ['levels', 'walls', 'floors', 'roofs', 'threed', 'dimensions', 'texts', 'verticalGuides', 'horizontalGuides'];
const settings = ['wallDiffuse', 'wallOpacity', 'wallSpecular', 'roofDiffuse', 'roofOpacity', 'roofSpecular', 'floorDiffuse', 'floorOpacity', 'floorSpecular', 'groundDiffuse', 'groundOpacity', 'groundSpecular', 'depthWrite', 'sortObjects', 'compassHdg', 'azimuth', 'inclination'];
const history = ['threed', 'wall', 'roof', 'floor', 'dimension', 'text'].flatMap(kind => ['AddedKey', 'DirtyKey', 'EditedKey', 'DeletedKey'].map(suffix => kind + suffix));
const fail = (message: string): never => { throw new Error(message); };
function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(`${label} must be an object.`);
  return value as RecordValue;
}
function entries(value: unknown, label: string, max: number): [string, unknown][] {
  const result = Object.entries(record(value, label));
  if (result.length > max) fail(`${label} exceeds the import limit of ${max}.`);
  return result;
}
function key(value: unknown): string {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^[a-zA-Z0-9_-]{1,40}$/.test(String(value))) return fail('Invalid legacy entity ID.');
  return String(value);
}
function number(value: unknown, label: string): number {
  const result = typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ? Number(value) : value;
  if (typeof result !== 'number' || !Number.isFinite(result)) return fail(`${label} must be a finite number.`);
  return result;
}
const metres = (value: unknown, label: string) => roundMetres(legacyCentimetresToMetres(number(value, label)));
function path(value: unknown, field: string, sourceKey: string) {
  const item = record(value, field);
  if (key(item.id) !== sourceKey) fail('Legacy record ID does not match its map key.');
  const serialized = item[field];
  if (!Array.isArray(serialized) || serialized.length !== 2 || serialized[0] !== 'Path') return fail('Expected a legacy Paper Path.');
  const shape = record(serialized[1], field), data = record(shape.data, `${field} data`);
  if (key(data.id) !== sourceKey) fail('Legacy path ID does not match its record.');
  const expected = field === 'floorPath' ? 'floor' : field;
  if (data.type !== expected) fail('Unsupported legacy path type.');
  if ('matrix' in shape && (!Array.isArray(shape.matrix) || shape.matrix.length !== 6 || shape.matrix.some((v, i) => v !== [1, 0, 0, 1, 0, 0][i]))) fail('Transformed Paper paths are not supported.');
  const segments = shape.segments;
  if (!Array.isArray(segments) || segments.length > 100) return fail('A legacy path supports at most 100 vertices.');
  const points: PlanPoint[] = segments.map(segment => {
    if (!Array.isArray(segment)) return fail('Unsupported Paper segment.');
    let point = segment;
    if (Array.isArray(segment[0])) {
      if (segment.length !== 3 || segment.slice(1).some(handle => !Array.isArray(handle) || handle.length !== 2 || handle.some(v => v !== 0))) fail('Curved Paper paths are not supported.');
      point = segment[0];
    }
    if (point.length !== 2) fail('Expected an X/Y point.');
    return { x: metres(point[0], 'Plan X'), z: metres(point[1], 'Plan Z') };
  });
  return { item, shape, data, points };
}

/** File-only adapter. Never relaxes the native document/Project persistence validator. */
export function parseDesignImport(text: string, fileName = ''): DesignImportPreview {
  if (new TextEncoder().encode(text).length > 1_048_576) fail('Design JSON must be at most 1 MiB.');
  const input = record(JSON.parse(text), 'Design JSON');
  if ('format' in input || 'version' in input) return { document: parseDesign(text), source: 'native', warnings: [] };
  if (!['levels', 'walls', 'floors', 'roofs'].every(field => field in input)) fail('Choose a ThreeD Design JSON document or a legacy Home Design plan with levels, walls, floors and roofs.');
  if (Object.keys(input).some(field => ![...maps, ...settings, ...history].includes(field))) fail('Unsupported legacy plan fields. Import a Home Design plan without Project or ownership metadata.');

  const warnings: string[] = [], levelIds = new Map<string, string>();
  const levels = entries(input.levels, 'Levels', 20).map(([sourceKey, value]) => {
    key(sourceKey);
    const level = record(value, 'Level');
    if (key(level.id) !== sourceKey) fail('Legacy level ID does not match its map key.');
    const id = `legacy-level-${sourceKey}`;
    levelIds.set(sourceKey, id);
    return { id, name: sourceKey === '0' ? 'Ground' : `Level ${sourceKey}`, elevation: metres(level.height, 'Level height') };
  });
  const name = fileName.replace(/^.*[\\/]/, '').replace(/\.(json|threed)$/i, '').trim().slice(0, 120) || 'Imported legacy design';
  let document = validateDesign({ ...newDesign(), name, levels });
  const nodeLevels = new Map<string, string>();
  // Assign shared nodes only for identical coordinates on the same level. Do not snap near endpoints.
  function candidateNodes(points: PlanPoint[], levelId: string) {
    const nodes = [...document.nodes];
    const vertices = points.map(point => {
      const rounded = { x: roundMetres(point.x), z: roundMetres(point.z) };
      const existing = nodes.find(node => node.x === rounded.x && node.z === rounded.z && (nodeLevels.get(node.id) === levelId || !nodeLevels.has(node.id)));
      if (existing) return existing.id;
      const id = `legacy-node-${nodes.length + 1}`;
      nodes.push({ id, ...rounded });
      return id;
    });
    return { nodes, vertices };
  }
  function importEntity(kind: 'walls' | 'floors' | 'roofs', sourceKey: string, value: unknown) {
    const singular = kind.slice(0, -1), { item, shape, data, points } = path(value, `${singular}Path`, key(sourceKey));
    const levelId = levelIds.get(key(data.level)) ?? fail('The referenced legacy level is missing.');
    const id = `legacy-${singular}-${sourceKey}`;
    if (kind !== 'floors' && (points.length !== 2 || shape.closed === true)) fail('Expected an open, two-point path.');
    let footprint = points;
    let roof: Omit<DesignDocument['roofs'][number], 'vertices'> | undefined;
    if (kind === 'roofs') {
      for (const joint of [data.join0, data.join1]) {
        if (joint !== undefined && record(joint, 'Roof join').id != null) fail('Joined legacy roof miters are not supported.');
      }
      const width = metres(data.width, 'Roof width'), rise = metres(data.rise, 'Roof rise');
      if (width <= 0 || rise < 0) fail('Roof width must be positive and rise must be non-negative.');
      const [a, b] = points, length = Math.hypot(b.x - a.x, b.z - a.z);
      if (length < .0254) fail('Roof axis must be at least one inch long.');
      const dx = (b.x - a.x) / length, dz = (b.z - a.z) / length;
      footprint = [{ x: a.x + dz * width / 2, z: a.z - dx * width / 2 }, { x: b.x + dz * width / 2, z: b.z - dx * width / 2 }, { x: b.x - dz * width / 2, z: b.z + dx * width / 2 }, { x: a.x - dz * width / 2, z: a.z + dx * width / 2 }];
      roof = { id, levelId, kind: rise === 0 ? 'flat' : 'shed', pitch: 12 * rise / width, direction: (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360, thickness: metres(data.thickness, 'Roof thickness'), elevation: metres(data.startHeight, 'Roof base offset') };
    }
    const { nodes, vertices } = candidateNodes(footprint, levelId);
    let next: DesignDocument;
    if (kind === 'walls') {
      const heights = Array.isArray(data.height) ? data.height : [data.height, data.height];
      if (heights.length !== 2) fail('Expected two wall endpoint heights.');
      const height = metres(heights[0], 'Wall height');
      if (height !== metres(heights[1], 'Wall height')) fail('Tapered walls with different endpoint heights are not supported.');
      next = { ...document, nodes, walls: [...document.walls, { id, levelId, start: vertices[0], end: vertices[1], height, thickness: metres(data.thickness, 'Wall thickness'), elevation: 0 }] };
    } else if (kind === 'floors') {
      if (shape.closed !== true) fail('Floor path must be closed.');
      const thickness = metres(item.thickness ?? data.thickness ?? 25, 'Floor thickness');
      // Legacy floors grow up from the level; the current floor elevation is its top.
      next = { ...document, nodes, floors: [...document.floors, { id, levelId, vertices, thickness, elevation: thickness }] };
    } else {
      next = { ...document, nodes, roofs: [...document.roofs, { ...roof!, vertices }] };
    }
    document = validateDesign(next);
    vertices.forEach(id => nodeLevels.set(id, levelId));
  }
  for (const [kind, max] of [['walls', 500], ['floors', 100], ['roofs', 100]] as const) {
    for (const [sourceKey, value] of entries(input[kind], kind, max)) {
      // Invalid geometry is never approximated; the user must acknowledge every omission.
      key(sourceKey);
      try { importEntity(kind, sourceKey, value); }
      catch (error) { warnings.push(`${kind.slice(0, -1)} ${sourceKey} skipped: ${error instanceof Error ? error.message : 'Unsupported geometry.'}`); }
    }
  }
  if (!document.walls.length && !document.floors.length && !document.roofs.length) fail('This legacy plan contains no supported architectural geometry to import.');
  if ('threed' in input) {
    const count = entries(input.threed, 'Catalog objects', 2000).length;
    if (count) warnings.push(`${count} catalog objects are not imported, including any doors, windows, skylights, furniture or plants. Their cutout masks are also omitted, so walls, floors and roofs will not have those apertures. Recreate supported openings with the current Design tools.`);
  }
  const omitted: [string, string, number][] = [
    ['dimensions', 'dimension annotations', 2000], ['texts', 'text annotations', 2000],
    ['verticalGuides', 'vertical guides', 2000], ['horizontalGuides', 'horizontal guides', 2000],
  ];
  for (const [field, label, max] of omitted) {
    if (!(field in input)) continue;
    const count = entries(input[field], field, max).length;
    if (count) warnings.push(`${count} ${label} not imported.`);
  }
  if ([...settings, ...history].some(field => field in input)) warnings.push('Legacy appearance, lighting, camera and edit-history settings are not imported.');
  return { document, source: 'legacy', warnings };
}
