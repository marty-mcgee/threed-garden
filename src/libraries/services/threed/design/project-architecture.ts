import { entityLevelId, newDesign, validateDesign, type DesignDocument } from './document';
import { designHistory, type DesignHistory } from './history';
import { defaultDesignWorkspace, parseDesignWorkspace, type ProjectDesignWorkspaceState } from './workspace-state';

/** Editable architectural content in project.config; not a separate record or Scene. */
export interface ProjectArchitecture { version: 1; document: DesignDocument }
export class ProjectArchitectureError extends Error {}
export function parseProjectArchitecture(value: unknown): ProjectArchitecture {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected architectural content.');
    const item = value as Record<string, unknown>;
    if (item.version !== 1 || Object.keys(item).some(key => !['version', 'document'].includes(key))) throw new Error('Unsupported architecture fields.');
    const document = validateDesign(item.document);
    if (new TextEncoder().encode(JSON.stringify(document)).length > 1_048_576) throw new Error('Architectural content exceeds 1 MiB.');
    return { version: 1, document };
  } catch (error) { throw new ProjectArchitectureError(error instanceof Error ? error.message : 'Invalid architectural content.'); }
}
export function readProjectArchitecture(config: unknown): ProjectArchitecture | undefined {
  if (!config || typeof config !== 'object' || !('threeDArchitecture' in config)) return undefined;
  return parseProjectArchitecture((config as Record<string, unknown>).threeDArchitecture);
}
export interface ProjectArchitectureDraft { history: DesignHistory; saved: string; selected: string | null; workspace?: ProjectDesignWorkspaceState; savedWorkspace?: string }
export function projectArchitectureDraft(content?: ProjectArchitecture, preferences?: ProjectDesignWorkspaceState): ProjectArchitectureDraft {
  const document = content ? parseProjectArchitecture(content).document : newDesign();
  const history = designHistory(document);
  const workspace = preferences ? parseDesignWorkspace(preferences) : defaultDesignWorkspace();
  const ids = [...history.present.walls, ...history.present.floors, ...history.present.roofs, ...history.present.openings, ...history.present.roofOpenings];
  const selected = ids.some(item => item.id === workspace.selectedEntityId) ? workspace.selectedEntityId : null;
  return { history, saved: JSON.stringify(history.present), selected, workspace, savedWorkspace: JSON.stringify(workspace) };
}
/** Hydrate clean placeholders/caches only; never erase an actual unsaved edit. */
export function hydrateArchitectureDraft(draft: ProjectArchitectureDraft | undefined, content?: ProjectArchitecture, preferences?: ProjectDesignWorkspaceState): ProjectArchitectureDraft {
  return draft && architectureIsDirty(draft) ? draft : projectArchitectureDraft(content, preferences);
}
export const architectureIsDirty = (draft: ProjectArchitectureDraft) => JSON.stringify(draft.history.present) !== draft.saved
  || (draft.workspace !== undefined && JSON.stringify(draft.workspace) !== draft.savedWorkspace);
/** Acknowledges captured source only, retaining edits completed during Project Save. */
export function acknowledgeArchitecture(draft: ProjectArchitectureDraft, captured: ProjectArchitecture, workspace?: ProjectDesignWorkspaceState): ProjectArchitectureDraft {
  return { ...draft, saved: JSON.stringify(parseProjectArchitecture(captured).document), ...(workspace ? { savedWorkspace: JSON.stringify(parseDesignWorkspace(workspace)) } : {}) };
}
/** Imported IDs are local portability references, never overwrite or access authority. */
export function importProjectArchitecture(current: DesignDocument, input: unknown, mode: 'merge' | 'replace', makeId: () => string): DesignDocument {
  const incoming = validateDesign(input), ids = new Map<string, string>();
  const used = new Set([current.levels, current.nodes, current.walls, current.floors, current.roofs, current.openings, current.roofOpenings].flatMap(items => items.map(item => item.id)));
  for (const item of [incoming.levels, incoming.nodes, incoming.walls, incoming.floors, incoming.roofs, incoming.openings, incoming.roofOpenings].flat()) {
    let next = makeId(); let attempts = 0;
    while (used.has(next)) { if (++attempts > 20) throw new Error('Unable to allocate imported entity IDs.'); next = makeId(); }
    used.add(next); ids.set(item.id, next);
  }
  const id = (old: string) => ids.get(old)!;
  const names = new Set(mode === 'merge' ? current.levels.map(level => level.name.toLowerCase()) : []);
  const levels = incoming.levels.map(level => {
    const base = level.name.slice(0, 48); let name = level.name, suffix = 2;
    while (names.has(name.toLowerCase())) name = `${base} (${suffix++})`;
    names.add(name.toLowerCase()); return { ...level, id: id(level.id), name };
  });
  const imported = { ...incoming, levels,
    nodes: incoming.nodes.map(node => ({ ...node, id: id(node.id) })),
    walls: incoming.walls.map(wall => ({ ...wall, id: id(wall.id), levelId: id(wall.levelId), start: id(wall.start), end: id(wall.end) })),
    floors: incoming.floors.map(floor => ({ ...floor, id: id(floor.id), levelId: id(floor.levelId), vertices: floor.vertices.map(id) })),
    roofs: incoming.roofs.map(roof => ({ ...roof, id: id(roof.id), levelId: id(roof.levelId), vertices: roof.vertices.map(id) })),
    openings: incoming.openings.map(opening => ({ ...opening, id: id(opening.id), wallId: id(opening.wallId) })),
    roofOpenings: incoming.roofOpenings.map(opening => ({ ...opening, id: id(opening.id), roofId: id(opening.roofId) })),
  };
  if (mode === 'replace') return validateDesign(imported);
  return validateDesign({ ...current, levels: [...current.levels, ...imported.levels], nodes: [...current.nodes, ...imported.nodes], walls: [...current.walls, ...imported.walls], floors: [...current.floors, ...imported.floors], roofs: [...current.roofs, ...imported.roofs], openings: [...current.openings, ...imported.openings], roofOpenings: [...current.roofOpenings, ...imported.roofOpenings] });
}

/** Normalize selection after edits, cascading deletions, Undo or document replacement. */
export function reconcileArchitectureSelection(draft: ProjectArchitectureDraft): ProjectArchitectureDraft {
  if (!draft.selected || entityLevelId(draft.history.present, draft.selected)) return draft;
  return { ...draft, selected: null, workspace: { ...(draft.workspace ?? defaultDesignWorkspace()), selectedEntityId: null } };
}
