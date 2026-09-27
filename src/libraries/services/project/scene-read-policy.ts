/** Publication authorizes rendering assigned assets, never arbitrary library browsing. */
export function canReadSceneProject(project: { userId: string | null; isPublic: boolean | null }, viewerId?: string) {
  return Boolean(project.userId && (project.isPublic || project.userId === viewerId));
}

export function canRenderAssignedModel(
  model: { userId: string | null; isPublic: boolean | null; isLibraryItem: boolean | null; isActive: boolean | null; status: string | null },
  projectOwnerId: string,
  canEdit: boolean,
) {
  const own = model.userId === projectOwnerId;
  const active = model.isActive === true && model.status === 'active';
  return own ? canEdit || active : active && model.isPublic === true && model.isLibraryItem === true;
}
