export interface ThreeDModelLibraryCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

export interface CategorizedThreeDModel {
  id: number;
  modelName: string;
  categories: readonly ThreeDModelLibraryCategory[];
  libraryReadiness: { status: 'ready' | 'needs_configuration' | 'unavailable' };
}

export interface ThreeDModelLibraryCollection extends ThreeDModelLibraryCategory {
  modelCount: number;
}

export function buildThreeDModelLibraryCollections(
  models: readonly CategorizedThreeDModel[],
): ThreeDModelLibraryCollection[] {
  const collections = new Map<string, ThreeDModelLibraryCollection>();

  for (const model of models) {
    const seenCategories = new Set<string>();
    for (const category of model.categories) {
      if (seenCategories.has(category.slug)) continue;
      seenCategories.add(category.slug);
      const existing = collections.get(category.slug);
      if (existing) existing.modelCount += 1;
      else collections.set(category.slug, { ...category, modelCount: 1 });
    }
  }

  return [...collections.values()].sort((left, right) => (
    left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug)
  ));
}

export function filterThreeDModelLibrary<T extends CategorizedThreeDModel>(
  models: readonly T[],
  categorySlug: string,
  search: string,
  readiness: 'all' | CategorizedThreeDModel['libraryReadiness']['status'],
): T[] {
  const normalizedSearch = search.trim().toLowerCase();
  return models.filter((model) => (
    (categorySlug === 'all' || model.categories.some((category) => category.slug === categorySlug))
    && (normalizedSearch.length === 0 || model.modelName.toLowerCase().includes(normalizedSearch))
    && (readiness === 'all' || model.libraryReadiness.status === readiness)
  ));
}
