class DesignWorkspaceError extends Error { constructor() { super('invalid_project_design_workspace'); } }
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function finite(value: unknown, min: number, max: number): number { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new DesignWorkspaceError(); return value; }
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') throw new DesignWorkspaceError(); return value; }
function boundedText(value: unknown, max: number): string { if (typeof value !== 'string' || !value.length || value.length > max) throw new DesignWorkspaceError(); return value; }
/** Workspace preferences only; geometry remains in threeDArchitecture. */
export interface ProjectDesignWorkspaceState {
  measurementUnits?: 'imperial' | 'metric';
  plan: { x: number; y: number; scale: number };
  levelId: string;
  selectedEntityId: string | null;
  showAllLevels: boolean;
  showRoofs: boolean;
  showMeasurements?: boolean;
  gridSnap: boolean;
  split: number;
  sections: Record<string, boolean>;
}
export const defaultDesignWorkspace = (): ProjectDesignWorkspaceState => ({
  measurementUnits: 'imperial',
  plan: { x: 80, y: 80, scale: 45 }, levelId: 'ground', selectedEntityId: null,
  showMeasurements: false, showAllLevels: true, showRoofs: true, gridSnap: true, split: 45, sections: {},
});
export function parseDesignWorkspace(value: unknown): ProjectDesignWorkspaceState {
  const item = record(value), plan = record(item?.plan), sections = record(item?.sections);
  if (!item || !plan || !sections || Object.keys(sections).length > 500) throw new DesignWorkspaceError();
  const result = Object.create(null) as Record<string, boolean>;
  for (const [key, value] of Object.entries(sections)) {
    if (!key || key.length > 500 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new DesignWorkspaceError();
    result[key] = boolean(value);
  }
  if (item.measurementUnits !== undefined && !['imperial', 'metric'].includes(String(item.measurementUnits))) throw new DesignWorkspaceError();
  return { measurementUnits: item.measurementUnits === 'metric' ? 'metric' : 'imperial', plan: { x: finite(plan.x, -1e7, 1e7), y: finite(plan.y, -1e7, 1e7), scale: finite(plan.scale, .05, 300) },
    levelId: boundedText(item.levelId, 200), selectedEntityId: item.selectedEntityId === null ? null : boundedText(item.selectedEntityId, 200),
    showMeasurements: item.showMeasurements === undefined ? false : boolean(item.showMeasurements),
    showAllLevels: boolean(item.showAllLevels), showRoofs: boolean(item.showRoofs), gridSnap: boolean(item.gridSnap),
    split: finite(item.split, 10, 90), sections: result };
}

