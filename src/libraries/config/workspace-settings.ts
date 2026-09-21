import { z } from 'zod';

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

export const workspaceSettingsSchema = z.object({
  version: z.literal(2),
  theme: z.enum(['browser', 'light', 'dark', 'system']),
  modules: z.object({ threed: z.boolean(), multimedia: z.boolean(), traffic: z.boolean() }).strict(),
  links: z.object({
    weather: z.boolean(), analytics: z.boolean(), chpCad: z.boolean(), chpHistorical: z.boolean(),
    caltrans: z.boolean(), bayArea511: z.boolean(), calfire: z.boolean(),
  }).strict(),
}).strict();
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export const workspaceSnapshotSchema = z.object({
  preferences: workspaceSettingsSchema,
  revision: z.string().uuid().nullable(),
}).strict();
export type WorkspaceSnapshot = z.infer<typeof workspaceSnapshotSchema>;

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
