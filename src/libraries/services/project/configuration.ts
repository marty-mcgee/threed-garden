import { parseMeasurementUnits, readProjectMeasurementUnits, type MeasurementUnits } from './measurement-units';
import { parseThreeDProjectViewState, type ProjectViewMode, type ProjectCameraMode, type ProjectThreeDViewState } from '../threed/markers/project-view-state-core';

export class ProjectConfigurationError extends Error {}
export class ProjectConfigurationConflict extends Error {
  constructor() { super('Project settings changed in another window. Your edits are retained. Review the latest Project settings before saving again.'); }
}
export interface ProjectConfigurationStamp { savedAt: string | null; measurementUnits: MeasurementUnits }
export type ProjectSceneConfiguration = Pick<ProjectThreeDViewState, 'environment' | 'autoRotate' | 'showGrid' | 'showGizmo'>
  & Partial<Pick<ProjectThreeDViewState, 'showControls' | 'showSimulations' | 'designTransparency' | 'sunlight' | 'ground' | 'activeLayers'>>;
export interface ProjectConfigurationChanges {
  measurementUnits?: MeasurementUnits;
  viewMode?: ProjectViewMode;
  cameraMode?: ProjectCameraMode;
  threeD?: Partial<ProjectSceneConfiguration>;
}
export interface ProjectConfigurationRequest { expected: ProjectConfigurationStamp; changes: ProjectConfigurationChanges }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProjectConfigurationError('Expected Project configuration fields.');
  return value as Record<string, unknown>;
}
function only(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new ProjectConfigurationError('Unsupported Project configuration field.');
}
export function projectConfigurationStamp(config: unknown): ProjectConfigurationStamp {
  const source = config && typeof config === 'object' ? config as Record<string, unknown> : {};
  const view = source.threeDViewState as { savedAt?: unknown } | undefined;
  return { savedAt: typeof view?.savedAt === 'string' ? view.savedAt : null, measurementUnits: readProjectMeasurementUnits(source) };
}
export function assertProjectConfigurationCurrent(config: unknown, expected: unknown) {
  const stamp = record(expected); only(stamp, ['savedAt', 'measurementUnits']);
  if (stamp.savedAt !== null && (typeof stamp.savedAt !== 'string' || !Number.isFinite(Date.parse(stamp.savedAt)))) throw new ProjectConfigurationError('Invalid saved Project settings timestamp.');
  const units = parseMeasurementUnits(stamp.measurementUnits), current = projectConfigurationStamp(config);
  if (stamp.savedAt !== current.savedAt || units !== current.measurementUnits) throw new ProjectConfigurationConflict();
}
/** Called under the owned Project row lock. Returns only changed JSONB top-level keys. */
export function projectConfigurationPatch(config: unknown, input: unknown, now = new Date()): Record<string, unknown> {
  const request = record(input); only(request, ['expected', 'changes']);
  assertProjectConfigurationCurrent(config, request.expected);
  const changes = record(request.changes); only(changes, ['measurementUnits', 'viewMode', 'cameraMode', 'threeD']);
  if (!Object.keys(changes).length) throw new ProjectConfigurationError('Change a setting before saving.');
  const patch: Record<string, unknown> = {};
  if ('measurementUnits' in changes) patch.measurementUnits = parseMeasurementUnits(changes.measurementUnits);
  const source = config && typeof config === 'object' ? config as Record<string, unknown> : {};
  if ('viewMode' in changes || 'cameraMode' in changes || 'threeD' in changes) {
    if (!source.threeDViewState) throw new ProjectConfigurationError('Open the Project Scene and Save Project once before editing its saved Scene settings.');
    const saved = record(source.threeDViewState);
    try { parseThreeDProjectViewState(saved); } catch { throw new ProjectConfigurationError('Saved workspace is invalid. Open and review the Project Scene before saving its settings.'); }
    const next = { ...saved };
    if ('viewMode' in changes) next.viewMode = changes.viewMode;
    if ('cameraMode' in changes) next.cameraMode = changes.cameraMode;
    if ('threeD' in changes) {
      const scene = record(changes.threeD);
      only(scene, ['environment', 'autoRotate', 'showGrid', 'showGizmo', 'showControls', 'showSimulations', 'designTransparency', 'sunlight', 'ground', 'activeLayers']);
      if (!saved.threeD) throw new ProjectConfigurationError('Save a 3D Scene view before editing environment settings.');
      for (const field of ['sunlight', 'ground'] as const) if (field in scene) only(record(scene[field]), field === 'sunlight' ? ['azimuth', 'elevation'] : ['enabled', 'size', 'height']);
      next.threeD = { ...record(saved.threeD), ...scene };
    }
    // Advance even for two rapid saves in the same millisecond.
    next.savedAt = new Date(Math.max(now.getTime(), Date.parse(String(saved.savedAt)) + 1)).toISOString();
    try { parseThreeDProjectViewState(next); } catch { throw new ProjectConfigurationError('Invalid Scene settings. Check the selected values and numeric ranges.'); }
    patch.threeDViewState = next;
  }
  return patch;
}
