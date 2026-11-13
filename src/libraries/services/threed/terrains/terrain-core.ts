export class TerrainInputError extends Error {}

export interface TerrainDefinition {
  formatVersion: 1;
  widthM: number;
  lengthM: number;
  columns: number;
  rows: number;
  heightsM: number[];
  appearance: {
    color: string;
    authoring?: TerrainAuthoring;
    generation?: TerrainGenerationOptions & { version: 1; seed: number };
  };
}

export interface TerrainDrawing {
  id: string;
  mode: 'straight' | 'freeform';
  points: { xM: number; zM: number }[];
  radiusM: number;
  startHeightM: number;
  endHeightM: number;
  feather: number;
  hidden: boolean;
  fillArea?: boolean;
}

export interface TerrainBrushStroke {
  xM: number;
  zM: number;
  radiusM: number;
  changeM: number;
}

export interface TerrainAuthoring {
  baseHeightsM: number[];
  operations: ({ type: 'path'; drawing: TerrainDrawing } | { type: 'brush'; stroke: TerrainBrushStroke })[];
}

export const maxTerrainOperations = 256;

export interface TerrainPlacementDraft {
  id: string | null;
  threedId: number;
  terrainId: number;
  terrainRevision: number;
  centerXM: number;
  centerZM: number;
  rotationYDeg: number;
  scale: number;
}

export interface ProjectTerrainSurface {
  name: string;
  placement: TerrainPlacementDraft;
  definition: TerrainDefinition;
}

export function confirmsTerrainPlacement(requested: TerrainPlacementDraft | null, saved: unknown): boolean {
  let actual: TerrainPlacementDraft | null;
  try { actual = parseTerrainPlacement(saved); }
  catch { return false; }
  if (requested === null) return actual === null;
  if (!actual || !actual.id || (requested.id !== null && actual.id !== requested.id)) return false;
  return actual.threedId === requested.threedId
    && actual.terrainId === requested.terrainId
    && actual.terrainRevision === requested.terrainRevision
    && actual.centerXM === requested.centerXM
    && actual.centerZM === requested.centerZM
    && actual.rotationYDeg === requested.rotationYDeg
    && actual.scale === requested.scale;
}

export function parseProjectTerrainSurface(value: unknown): ProjectTerrainSurface | null {
  if (value === null || value === undefined) return null;
  const input = object(value);
  const placement = parseTerrainPlacement(input.placement);
  if (!placement || typeof input.name !== 'string') throw new TerrainInputError('Invalid Project Terrain.');
  return {
    name: input.name,
    placement,
    definition: parseTerrainDefinition(input.definition),
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TerrainInputError('Invalid Terrain data.');
  return value as Record<string, unknown>;
}

function bounded(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new TerrainInputError(`Invalid Terrain ${name}.`);
  }
  return value;
}

function positiveId(value: unknown, name: string): number {
  const number = bounded(value, 1, Number.MAX_SAFE_INTEGER, name);
  if (!Number.isSafeInteger(number)) throw new TerrainInputError(`Invalid Terrain ${name}.`);
  return number;
}

export function parseTerrainDefinition(value: unknown): TerrainDefinition {
  const input = object(value);
  if (input.formatVersion !== 1) throw new TerrainInputError('Unsupported Terrain format.');
  const columns = positiveId(input.columns, 'columns');
  const rows = positiveId(input.rows, 'rows');
  if (columns < 2 || columns > 129 || rows < 2 || rows > 129) throw new TerrainInputError('Terrain grid must have 2–129 columns and rows.');
  const widthM = bounded(input.widthM, 0.01, 1000, 'width');
  const lengthM = bounded(input.lengthM, 0.01, 1000, 'length');
  if (!Array.isArray(input.heightsM) || input.heightsM.length !== columns * rows) {
    throw new TerrainInputError('Terrain height count does not match its grid.');
  }
  const heightsM = input.heightsM.map(height => bounded(height, -1000, 1000, 'height'));
  for (let column = 0; column < columns; column++) {
    if (heightsM[column] !== 0 || heightsM[(rows - 1) * columns + column] !== 0) throw new TerrainInputError('Terrain border must meet flat ground at zero height.');
  }
  for (let row = 0; row < rows; row++) {
    if (heightsM[row * columns] !== 0 || heightsM[row * columns + columns - 1] !== 0) throw new TerrainInputError('Terrain border must meet flat ground at zero height.');
  }
  const appearance = object(input.appearance);
  if (Object.keys(appearance).some(key => key !== 'color' && key !== 'authoring' && key !== 'generation') || typeof appearance.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(appearance.color)) {
    throw new TerrainInputError('Invalid Terrain appearance.');
  }
  const authoring = appearance.authoring === undefined ? undefined : parseTerrainAuthoring(appearance.authoring, columns * rows);
  const generation = appearance.generation === undefined ? undefined : parseTerrainGeneration(appearance.generation);
  return { formatVersion: 1, widthM, lengthM, columns, rows, heightsM, appearance: { color: appearance.color, ...(authoring ? { authoring } : {}), ...(generation ? { generation } : {}) } };
}

function parseTerrainAuthoring(value: unknown, heightCount: number): TerrainAuthoring {
  const input = object(value);
  if (!Array.isArray(input.baseHeightsM) || input.baseHeightsM.length !== heightCount || !Array.isArray(input.operations) || input.operations.length > maxTerrainOperations) {
    throw new TerrainInputError('Invalid Terrain drawing history.');
  }
  const baseHeightsM = input.baseHeightsM.map(height => bounded(height, -1000, 1000, 'base height'));
  const operations = input.operations.map((raw): TerrainAuthoring['operations'][number] => {
    const operation = object(raw);
    if (operation.type === 'brush') {
      const stroke = object(operation.stroke);
      return { type: 'brush', stroke: {
        xM: bounded(stroke.xM, -1000, 1000, 'brush X'),
        zM: bounded(stroke.zM, -1000, 1000, 'brush Z'),
        radiusM: bounded(stroke.radiusM, 0.01, 1000, 'brush radius'),
        changeM: bounded(stroke.changeM, -1000, 1000, 'brush change'),
      } };
    }
    if (operation.type !== 'path') throw new TerrainInputError('Invalid Terrain drawing operation.');
    const drawing = object(operation.drawing);
    if (typeof drawing.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(drawing.id)
      || (drawing.mode !== 'straight' && drawing.mode !== 'freeform') || typeof drawing.hidden !== 'boolean'
      || !Array.isArray(drawing.points) || drawing.points.length < 2 || drawing.points.length > 256) {
      throw new TerrainInputError('Invalid Terrain drawing.');
    }
    const points = drawing.points.map(rawPoint => {
      const point = object(rawPoint);
      return { xM: bounded(point.xM, -1000, 1000, 'drawing X'), zM: bounded(point.zM, -1000, 1000, 'drawing Z') };
    });
    if (drawing.fillArea !== undefined && typeof drawing.fillArea !== 'boolean') throw new TerrainInputError('Invalid filled plateau option.');
    if (drawing.fillArea) {
      if (drawing.mode !== 'freeform' || drawing.startHeightM !== drawing.endHeightM) throw new TerrainInputError('Filled plateaus require a freeform boundary and one elevation.');
      validatePlateau(points);
    }
    return { type: 'path', drawing: {
      id: drawing.id,
      mode: drawing.mode,
      points,
      radiusM: bounded(drawing.radiusM, 0.01, 1000, 'drawing radius'),
      startHeightM: bounded(drawing.startHeightM, -1000, 1000, 'start elevation'),
      endHeightM: bounded(drawing.endHeightM, -1000, 1000, 'end elevation'),
      feather: bounded(drawing.feather, 0, 1, 'edge feather'),
      hidden: drawing.hidden,
      ...(drawing.fillArea !== undefined ? { fillArea: drawing.fillArea } : {}),
    } };
  });
  return { baseHeightsM, operations };
}

export function parseTerrainPlacement(value: unknown): TerrainPlacementDraft | null {
  if (value === null) return null;
  const input = object(value);
  const id = input.id === null ? null : typeof input.id === 'string' && /^[0-9a-fA-F-]{36}$/.test(input.id) ? input.id : null;
  if (input.id !== null && id === null) throw new TerrainInputError('Invalid Terrain placement identity.');
  return {
    id,
    threedId: positiveId(input.threedId, 'ThreeD Module'),
    terrainId: positiveId(input.terrainId, 'identity'),
    terrainRevision: positiveId(input.terrainRevision, 'revision'),
    centerXM: bounded(input.centerXM, -100000, 100000, 'X position'),
    centerZM: bounded(input.centerZM, -100000, 100000, 'Z position'),
    rotationYDeg: bounded(input.rotationYDeg, -360, 360, 'rotation'),
    scale: bounded(input.scale, 0.01, 100, 'scale'),
  };
}

export interface TerrainGenerationOptions {
  reliefM: number;
  hillSize: number;
  detail: number;
}

function parseTerrainGeneration(value: unknown): TerrainGenerationOptions & { version: 1; seed: number } {
  const input = object(value);
  if (Object.keys(input).some(key => !['version', 'seed', 'reliefM', 'hillSize', 'detail'].includes(key)) || input.version !== 1 || !Number.isSafeInteger(input.seed)) throw new TerrainInputError('Invalid Terrain generation settings.');
  return {
    version: 1,
    seed: input.seed as number,
    reliefM: bounded(input.reliefM, 0, 20, 'relief (0–20 m)'),
    hillSize: bounded(input.hillSize, 0.5, 4, 'hill size (0.5–4)'),
    detail: bounded(input.detail, 0, 1, 'detail (0–100%)'),
  };
}

function validatePlateau(points: { xM: number; zM: number }[]): void {
  const area = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.xM * next.zM - next.xM * point.zM;
  }, 0);
  if (points.length < 3 || Math.abs(area) < 0.0001) throw new TerrainInputError('Draw a freeform boundary enclosing an area for a filled plateau.');
}

export function generateTerrainDefinition(seed: number, widthM = 40, lengthM = 40, columns = 33, rows = 33, options: TerrainGenerationOptions = { reliefM: 2, hillSize: 1, detail: 0.35 }): TerrainDefinition {
  if (!Number.isSafeInteger(seed)) throw new TerrainInputError('Invalid Terrain seed.');
  const { reliefM, hillSize, detail } = options;
  if (!Number.isFinite(reliefM) || reliefM < 0 || reliefM > 20 || !Number.isFinite(hillSize) || hillSize < 0.5 || hillSize > 4 || !Number.isFinite(detail) || detail < 0 || detail > 1) {
    throw new TerrainInputError('Relief must be 0–20 m, hill size 0.5–4, and detail 0–100%.');
  }
  if (!Number.isSafeInteger(columns) || !Number.isSafeInteger(rows) || columns < 2 || columns > 129 || rows < 2 || rows > 129) {
    throw new TerrainInputError('Columns and rows must each be whole numbers from 2 to 129. The current Terrain is unchanged.');
  }
  const heightsM: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      const edge = Math.sin(Math.PI * u) ** 2 * Math.sin(Math.PI * v) ** 2;
      const wave = Math.sin(u * 9.7 / hillSize + seed * 0.17) * Math.cos(v * 8.3 / hillSize - seed * 0.11)
        + detail * Math.sin((u * 18.1 - v * 13.7) / hillSize + seed * 0.07);
      heightsM.push(row === 0 || column === 0 || row === rows - 1 || column === columns - 1
        ? 0
        : Number((edge * wave * reliefM).toFixed(4)));
    }
  }
  return parseTerrainDefinition({ formatVersion: 1, widthM, lengthM, columns, rows, heightsM, appearance: { color: '#58823f', generation: { version: 1, seed, reliefM, hillSize, detail } } });
}

export function sculptTerrainDefinition(
  definition: TerrainDefinition,
  xM: number,
  zM: number,
  radiusM: number,
  changeM: number,
): TerrainDefinition {
  if (![xM, zM, radiusM, changeM].every(Number.isFinite) || radiusM <= 0 || radiusM > 1000 || Math.abs(changeM) > 1000) {
    throw new TerrainInputError('Invalid Terrain brush.');
  }
  const heightsM = definition.heightsM.map((height, index) => {
    const column = index % definition.columns;
    const row = Math.floor(index / definition.columns);
    if (column === 0 || row === 0 || column === definition.columns - 1 || row === definition.rows - 1) return 0;
    const x = (column / (definition.columns - 1) - 0.5) * definition.widthM;
    const z = (row / (definition.rows - 1) - 0.5) * definition.lengthM;
    const distance = Math.hypot(x - xM, z - zM);
    if (distance >= radiusM) return height;
    const falloff = (1 + Math.cos(Math.PI * distance / radiusM)) / 2;
    return Number(Math.max(-1000, Math.min(1000, height + changeM * falloff)).toFixed(4));
  });
  return { ...definition, heightsM };
}

function terrainBrushWeight(distance: number, radiusM: number, feather: number): number {
  if (distance >= radiusM) return 0;
  const innerRadius = radiusM * (1 - feather);
  if (distance <= innerRadius || feather === 0) return 1;
  const progress = (distance - innerRadius) / (radiusM - innerRadius);
  return (1 + Math.cos(Math.PI * progress)) / 2;
}

function validateTerrainShape(radiusM: number, feather: number, heights: number[]): void {
  if (!Number.isFinite(radiusM) || radiusM <= 0 || radiusM > 1000 || !Number.isFinite(feather) || feather < 0 || feather > 1
    || heights.some(height => !Number.isFinite(height) || height < -1000 || height > 1000)) {
    throw new TerrainInputError('Invalid Terrain shaping controls.');
  }
}

/** Shape a corridor around a drawn straight or freeform path. */
export function shapeTerrainPathDefinition(
  definition: TerrainDefinition,
  path: { xM: number; zM: number }[],
  radiusM: number,
  startHeightM: number,
  endHeightM: number,
  feather: number,
  fillArea = false,
): TerrainDefinition {
  validateTerrainShape(radiusM, feather, [startHeightM, endHeightM, ...path.flatMap(point => [point.xM, point.zM])]);
  if (path.length < 2 || path.length > 256) throw new TerrainInputError('Draw a path with 2 to 256 points.');
  if (fillArea) {
    validatePlateau(path);
    if (startHeightM !== endHeightM) throw new TerrainInputError('A filled plateau requires one elevation.');
    path = [...path, path[0]];
  }
  const lengths = [0];
  for (let index = 1; index < path.length; index++) {
    lengths.push(lengths[index - 1] + Math.hypot(path[index].xM - path[index - 1].xM, path[index].zM - path[index - 1].zM));
  }
  const totalLength = lengths.at(-1) ?? 0;
  if (totalLength < 0.01) throw new TerrainInputError('Draw a longer Terrain path.');
  const heightsM = definition.heightsM.map((height, index) => {
    const column = index % definition.columns;
    const row = Math.floor(index / definition.columns);
    if (column === 0 || row === 0 || column === definition.columns - 1 || row === definition.rows - 1) return 0;
    const x = (column / (definition.columns - 1) - 0.5) * definition.widthM;
    const z = (row / (definition.rows - 1) - 0.5) * definition.lengthM;
    let nearestDistance = Infinity;
    let nearestProgress = 0;
    for (let segment = 1; segment < path.length; segment++) {
      const from = path[segment - 1];
      const to = path[segment];
      const dx = to.xM - from.xM;
      const dz = to.zM - from.zM;
      const segmentLengthSquared = dx * dx + dz * dz;
      if (segmentLengthSquared === 0) continue;
      const fraction = Math.max(0, Math.min(1, ((x - from.xM) * dx + (z - from.zM) * dz) / segmentLengthSquared));
      const distance = Math.hypot(x - from.xM - fraction * dx, z - from.zM - fraction * dz);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestProgress = (lengths[segment - 1] + fraction * Math.sqrt(segmentLengthSquared)) / totalLength;
      }
    }
    let inside = false;
    if (fillArea) {
      for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
        const a = path[i];
        const b = path[j];
        if ((a.zM > z) !== (b.zM > z) && x < (b.xM - a.xM) * (z - a.zM) / (b.zM - a.zM) + a.xM) inside = !inside;
      }
    }
    const weight = inside ? 1 : terrainBrushWeight(nearestDistance, radiusM, feather);
    const target = startHeightM + (endHeightM - startHeightM) * nearestProgress;
    return weight === 0 ? height : Number((height + (target - height) * weight).toFixed(4));
  });
  return { ...definition, heightsM };
}

export function updateTerrainAuthoring(definition: TerrainDefinition, operations: TerrainAuthoring['operations']): TerrainDefinition {
  if (operations.length > maxTerrainOperations) throw new TerrainInputError(`Terrain supports up to ${maxTerrainOperations} drawing and brush operations.`);
  const baseHeightsM = definition.appearance.authoring?.baseHeightsM ?? definition.heightsM;
  let next: TerrainDefinition = {
    ...definition,
    heightsM: [...baseHeightsM],
    appearance: { ...definition.appearance },
  };
  for (const operation of operations) {
    if (operation.type === 'brush') {
      next = sculptTerrainDefinition(next, operation.stroke.xM, operation.stroke.zM, operation.stroke.radiusM, operation.stroke.changeM);
    } else {
      const drawing = operation.drawing;
      next = shapeTerrainPathDefinition(next, drawing.points, drawing.radiusM, drawing.startHeightM, drawing.endHeightM, drawing.feather, drawing.fillArea);
    }
  }
  return { ...next, appearance: { ...next.appearance, authoring: { baseHeightsM: [...baseHeightsM], operations } } };
}

export function terrainHeightAt(definition: TerrainDefinition, placement: TerrainPlacementDraft, xM: number, zM: number): number | null {
  const angle = placement.rotationYDeg * Math.PI / 180;
  const dx = xM - placement.centerXM;
  const dz = zM - placement.centerZM;
  const localX = (dx * Math.cos(angle) - dz * Math.sin(angle)) / placement.scale;
  const localZ = (dx * Math.sin(angle) + dz * Math.cos(angle)) / placement.scale;
  const u = localX / definition.widthM + 0.5;
  const v = localZ / definition.lengthM + 0.5;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const gx = u * (definition.columns - 1);
  const gz = v * (definition.rows - 1);
  const col = Math.min(Math.floor(gx), definition.columns - 2);
  const row = Math.min(Math.floor(gz), definition.rows - 2);
  const fx = gx - col;
  const fz = gz - row;
  const a = definition.heightsM[row * definition.columns + col];
  const b = definition.heightsM[row * definition.columns + col + 1];
  const c = definition.heightsM[(row + 1) * definition.columns + col];
  const d = definition.heightsM[(row + 1) * definition.columns + col + 1];
  return (fx + fz <= 1 ? a + fx * (b - a) + fz * (c - a) : d + (1 - fx) * (c - d) + (1 - fz) * (b - d)) * placement.scale;
}

// A saved marker keeps its own height. Terrain can raise its initial Scene
// presentation, but never lower an intentionally elevated placement.
export function terrainSpawnFloorY(
  surface: ProjectTerrainSurface | null | undefined,
  metersPerSceneUnit: number,
  position: { x: number; y: number; z: number },
): number {
  if (!surface || !Number.isFinite(metersPerSceneUnit) || metersPerSceneUnit <= 0) return position.y;
  const terrainY = terrainHeightAt(
    surface.definition,
    surface.placement,
    position.x * metersPerSceneUnit,
    position.z * metersPerSceneUnit,
  );
  return terrainY === null ? position.y : Math.max(position.y, terrainY / metersPerSceneUnit);
}

export function terrainPlanCells(definition: TerrainDefinition, columns = 16, rows = 16) {
  const cells: { x: number; z: number; width: number; length: number; height: number }[] = [];
  const width = definition.widthM / columns;
  const length = definition.lengthM / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = -definition.widthM / 2 + column * width;
      const z = -definition.lengthM / 2 + row * length;
      const sourceColumn = Math.round((column + 0.5) * (definition.columns - 1) / columns);
      const sourceRow = Math.round((row + 0.5) * (definition.rows - 1) / rows);
      cells.push({ x, z, width, length, height: definition.heightsM[sourceRow * definition.columns + sourceColumn] });
    }
  }
  return cells;
}
