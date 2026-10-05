export type BulkCategoryMode = 'add' | 'remove' | 'replace';

export function mergedModelCategories(existing: number[], chosen: number[], mode: BulkCategoryMode) {
  if (mode === 'replace') return [...new Set(chosen)];
  if (mode === 'remove') return existing.filter(id => !chosen.includes(id));
  return [...new Set([...existing, ...chosen])];
}

export async function updateBulkModelCategories(targets: { id: number; modelName: string }[], chosen: number[], mode: BulkCategoryMode, request: typeof fetch = fetch) {
  let updated = 0;
  const failures: string[] = [];
  for (const model of targets) {
    try {
      let existing: number[] = [];
      if (mode !== 'replace') {
        const response = await request(`/api/threed/models?id=${model.id}`, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
        const result = await response.json();
        if (!response.ok || !result.success || result.data?.id !== model.id || !Array.isArray(result.data.categories)) throw new Error(result.error || 'Current Model categories could not be loaded');
        existing = result.data.categories.map((category: { id: number }) => category.id);
      }
      const response = await request(`/api/threed/models?id=${model.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: mergedModelCategories(existing, chosen, mode) }), signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Category update not confirmed');
      updated++;
    } catch (error) { failures.push(`${model.modelName} (#${model.id}): ${error instanceof Error ? error.message : 'Category update not confirmed'}`); }
  }
  return { updated, failures };
}
