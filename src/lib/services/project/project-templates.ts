export const PROJECT_TEMPLATE_KEYS = ['blank', 'threed-starter', 'complete-app'] as const;

export type ProjectTemplateKey = (typeof PROJECT_TEMPLATE_KEYS)[number];
export type ProjectTemplateModuleType = 'threed' | 'traffic' | 'music';

export interface ProjectTemplateDefinition {
  key: ProjectTemplateKey;
  name: string;
  description: string;
  modules: readonly ProjectTemplateModuleType[];
}

export const PROJECT_TEMPLATES: readonly ProjectTemplateDefinition[] = [
  {
    key: 'blank',
    name: 'Blank Project',
    description: 'Start with an empty Project and add each module deliberately.',
    modules: [],
  },
  {
    key: 'threed-starter',
    name: 'ThreeD Starter',
    description: 'Create a Project with a new ThreeD module, ready for Scene assets.',
    modules: ['threed'],
  },
  {
    key: 'complete-app',
    name: 'Complete App',
    description: 'Create new ThreeD, Traffic, and Music module foundations together.',
    modules: ['threed', 'traffic', 'music'],
  },
] as const;

export function getProjectTemplate(key: unknown): ProjectTemplateDefinition | null {
  if (typeof key !== 'string') return null;
  return PROJECT_TEMPLATES.find((template) => template.key === key) ?? null;
}
