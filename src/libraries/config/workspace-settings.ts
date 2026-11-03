import { InputValidationError, readBoolean, readChoice, readGuid, readStrictObject } from '@/libraries/utils/input-validation';

export const workspaceModules = ['threed', 'multimedia', 'traffic'] as const;
export type WorkspaceModule = typeof workspaceModules[number];
export const workspaceModuleLabels = { threed: 'ThreeD', multimedia: 'Multimedia', traffic: 'Traffic' };
export const workspaceLinks = [
  { key: 'weather', module: 'threed', label: 'Weather' },
  { key: 'analytics', module: 'threed', label: 'Garden Analytics' },
  { key: 'chpCad', module: 'traffic', label: 'CHP Live' },
  { key: 'chpHistorical', module: 'traffic', label: 'CHP Historical' },
  { key: 'caltrans', module: 'traffic', label: 'Caltrans' },
  { key: 'bayArea511', module: 'traffic', label: 'Bay Area 511' },
  { key: 'calfire', module: 'traffic', label: 'CalFire' },
] as const;

export interface WorkspaceSettings {
  version: 2;
  theme: 'browser' | 'light' | 'dark' | 'system';
  modules: Record<WorkspaceModule, boolean>;
  links: Record<typeof workspaceLinks[number]['key'], boolean>;
}
export interface WorkspaceSnapshot {
  preferences: WorkspaceSettings;
  revision: string | null;
}

export function parseWorkspaceSettings(value: unknown): WorkspaceSettings {
  const input = readStrictObject(value, ['version', 'theme', 'modules', 'links']);
  if (input.version !== 2) throw new InputValidationError();
  const modules = readStrictObject(input.modules, workspaceModules);
  const links = readStrictObject(input.links, workspaceLinks.map(link => link.key));
  return {
    version: 2,
    theme: readChoice(input.theme, ['browser', 'light', 'dark', 'system']),
    modules: {
      threed: readBoolean(modules.threed),
      multimedia: readBoolean(modules.multimedia),
      traffic: readBoolean(modules.traffic),
    },
    links: {
      weather: readBoolean(links.weather),
      analytics: readBoolean(links.analytics),
      chpCad: readBoolean(links.chpCad),
      chpHistorical: readBoolean(links.chpHistorical),
      caltrans: readBoolean(links.caltrans),
      bayArea511: readBoolean(links.bayArea511),
      calfire: readBoolean(links.calfire),
    },
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
    version: 2, theme: 'browser',
    modules: { threed: true, multimedia: true, traffic: true },
    links: { weather: true, analytics: true, chpCad: true, chpHistorical: true, caltrans: true, bayArea511: true, calfire: true },
  };
}

export function workspaceLinkVisible(settings: WorkspaceSettings, module: WorkspaceModule, service?: string) {
  if (!settings.modules[module]) return false;
  if (!service) return true;
  return Object.hasOwn(settings.links, service) && settings.links[service as keyof WorkspaceSettings['links']];
}
