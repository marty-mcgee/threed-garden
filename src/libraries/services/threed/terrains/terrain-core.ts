export class TerrainInputError extends Error {}

export interface TerrainDefinition {
  formatVersion: 1;
  widthM: number;
  lengthM: number;
  columns: number;
  rows: number;
  heightsM: number[];
  appearance: { color: string };
}

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
  if (Object.keys(appearance).length !== 1 || typeof appearance.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(appearance.color)) {
    throw new TerrainInputError('Terrain appearance must contain one hex color.');
  }
  return { formatVersion: 1, widthM, lengthM, columns, rows, heightsM, appearance: { color: appearance.color } };
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

export function generateTerrainDefinition(seed: number, widthM = 40, lengthM = 40, columns = 33, rows = 33): TerrainDefinition {
  if (!Number.isSafeInteger(seed)) throw new TerrainInputError('Invalid Terrain seed.');
  if (!Number.isSafeInteger(columns) || !Number.isSafeInteger(rows) || columns < 2 || columns > 129 || rows < 2 || rows > 129) {
    throw new TerrainInputError('Invalid Terrain grid size.');
  }
  const heightsM: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      const edge = Math.sin(Math.PI * u) ** 2 * Math.sin(Math.PI * v) ** 2;
      const wave = Math.sin(u * 9.7 + seed * 0.17) * Math.cos(v * 8.3 - seed * 0.11)
        + 0.35 * Math.sin(u * 18.1 - v * 13.7 + seed * 0.07);
      heightsM.push(row === 0 || column === 0 || row === rows - 1 || column === columns - 1
        ? 0
        : Number((edge * wave * 2).toFixed(4)));
    }
  }
  return parseTerrainDefinition({ formatVersion: 1, widthM, lengthM, columns, rows, heightsM, appearance: { color: '#58823f' } });
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
