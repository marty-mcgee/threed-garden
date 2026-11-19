import { InputValidationError, readBoolean, readChoice, readGuid, readStrictObject } from '@/libraries/utils/input-validation';

export const workspaceModules = ['threed', 'multimedia', 'traffic'] as const;
export type WorkspaceModule = typeof workspaceModules[number];
export const workspaceModuleLabels = { threed: 'ThreeD', multimedia: 'Multimedia', traffic: 'Traffic' };
export const workspaceLinkDefinitions = {
  weather: {
    module: 'threed',
    label: 'Weather',
    path: '/dashboard/threed/weather',
  },
  analytics: {
    module: 'threed',
    label: 'Garden Analytics',
    path: '/dashboard/threed/garden/analytics',
  },
  chpCad: {
    module: 'traffic',
    label: 'CHP Live',
    path: '/dashboard/traffic/chp-live',
  },
  chpHistorical: {
    module: 'traffic',
    label: 'CHP Historical',
    path: '/dashboard/traffic/chp-historical',
  },
  caltrans: {
    module: 'traffic',
    label: 'Caltrans',
    path: '/dashboard/traffic/caltrans',
  },
  bayArea511: {
    module: 'traffic',
    label: 'Bay Area 511',
    path: '/dashboard/traffic/511org',
  },
  calfire: {
    module: 'traffic',
    label: 'CalFire',
    path: '/dashboard/traffic/calfire',
  },
} as const satisfies Record<string, { module: WorkspaceModule; label: string; path: `/${string}` }>;

export type WorkspaceLinkKey = keyof typeof workspaceLinkDefinitions;
const workspaceLinkKeys = Object.keys(workspaceLinkDefinitions) as WorkspaceLinkKey[];
export const workspaceLinks = workspaceLinkKeys.map(key => ({
  key,
  ...workspaceLinkDefinitions[key],
}));

export interface WorkspaceSettings {
  version: 2;
  theme: 'browser' | 'light' | 'dark' | 'system';
  modules: Record<WorkspaceModule, boolean>;
  links: Record<WorkspaceLinkKey, boolean>;
}
export interface WorkspaceSnapshot {
  preferences: WorkspaceSettings;
  revision: string | null;
}

function booleanSettings<Key extends string>(keys: readonly Key[], read: (key: Key) => boolean): Record<Key, boolean> {
  return Object.fromEntries(keys.map(key => [key, read(key)])) as Record<Key, boolean>;
}

export function parseWorkspaceSettings(value: unknown): WorkspaceSettings {
  const input = readStrictObject(value, ['version', 'theme', 'modules', 'links']);
  if (input.version !== 2) throw new InputValidationError();
  const modules = readStrictObject(input.modules, workspaceModules);
  const links = readStrictObject(input.links, workspaceLinkKeys);
  return {
    version: 2,
    theme: readChoice(input.theme, ['browser', 'light', 'dark', 'system']),
    modules: booleanSettings(workspaceModules, key => readBoolean(modules[key])),
    links: booleanSettings(workspaceLinkKeys, key => readBoolean(links[key])),
  };
}

export function parseWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const input = readStrictObject(value, ['preferences', 'revision']);
  return {
    preferences: parseWorkspaceSettings(input.preferences),
    revision: input.revision === null ? null : readGuid(input.revision),
  };
}

export function defaultWorkspaceSettings(): WorkspaceSettings {
  return {
    version: 2,
    theme: 'browser',
    modules: booleanSettings(workspaceModules, () => true),
    links: booleanSettings(workspaceLinkKeys, () => true),
  };
}

export function workspaceLinkVisible(settings: WorkspaceSettings, module: WorkspaceModule, service?: string) {
  if (!settings.modules[module]) return false;
  if (!service) return true;
  return Object.hasOwn(settings.links, service) && settings.links[service as WorkspaceLinkKey];
}
