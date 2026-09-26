export interface DashboardProject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  assetCount: number;
  sceneAssetCount: number;
  modules: { multimedia: number; threed: number; traffic: number };
}
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Project response');
  return value as Record<string, unknown>;
};
const count = (value: unknown): number => {
  const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid Project count');
  return number;
};
export function readDashboardProjectPage(value: unknown, expectedOffset: number) {
  const data = record(value), pagination = record(data.pagination);
  if (data.success !== true || !Array.isArray(data.projects)) throw new Error('Invalid Project response');
  const offset = count(pagination.offset), total = count(pagination.total), limit = count(pagination.limit);
  if (offset !== expectedOffset || limit < 1 || data.projects.length > limit) throw new Error('Invalid Project page');
  const projects: DashboardProject[] = data.projects.map(value => {
    const project = record(value), modules = record(project.moduleCounts);
    const id = count(project.id);
    if (id < 1 || typeof project.name !== 'string' || typeof project.isPublic !== 'boolean') throw new Error('Invalid Project');
    return { id, name: project.name.trim() || 'Untitled', slug: typeof project.slug === 'string' ? project.slug : '',
      description: typeof project.description === 'string' ? project.description : null,
      isPublic: project.isPublic, assetCount: count(project.assetCount), sceneAssetCount: count(project.sceneAssetCount ?? 0),
      modules: { multimedia: count(modules.multimedia), threed: count(modules.threed), traffic: count(modules.traffic) } };
  });
  const nextOffset = offset + projects.length;
  return { projects, total, nextOffset, hasMore: projects.length > 0 && nextOffset < total };
}
export function mergeDashboardProjects(current: DashboardProject[], incoming: DashboardProject[]) {
  return Array.from(new Map([...current, ...incoming].map(project => [project.id, project])).values());
}
export function filterDashboardProjects(projects: DashboardProject[], search: string, module: 'all' | keyof DashboardProject['modules']) {
  const query = search.trim().toLocaleLowerCase();
  return projects.filter(project => (module === 'all' || project.modules[module] > 0)
    && `${project.name} ${project.description ?? ''} ${project.slug}`.toLocaleLowerCase().includes(query));
}
