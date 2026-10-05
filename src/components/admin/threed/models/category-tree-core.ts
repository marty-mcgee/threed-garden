import type { CategorySortField } from '@/libraries/services/threed/models/category-list-query';

interface Category {
  id: number; parentId: number | null; name: string; slug: string;
  description: string | null; sortOrder: number; isActive: boolean;
}

export interface CategoryTreeNode<T> { category: T; children: CategoryTreeNode<T>[] }

export function buildCategoryTree<T extends Category>(categories: T[], search: string,
  sort: { field: CategorySortField; direction: 'asc' | 'desc' }): CategoryTreeNode<T>[] {
  const byId = new Map(categories.map(category => [category.id, category]));
  const parents = new Map<number, number | null>();
  // Break invalid legacy cycles deterministically without changing saved relationships.
  for (const category of [...categories].sort((a, b) => a.id - b.id)) {
    let parent = category.parentId !== null && byId.has(category.parentId) ? category.parentId : null;
    const seen = new Set([category.id]);
    let cursor = parent;
    while (cursor !== null) {
      if (seen.has(cursor)) { parent = null; break; }
      seen.add(cursor);
      cursor = parents.has(cursor) ? parents.get(cursor)! : byId.get(cursor)?.parentId ?? null;
    }
    parents.set(category.id, parent);
  }
  const query = search.trim().toLocaleLowerCase();
  const included = new Set<number>();
  for (const category of categories) {
    if (query && ![category.name, category.slug, category.description ?? ''].some(value => value.toLocaleLowerCase().includes(query))) continue;
    let cursor: number | null = category.id;
    while (cursor !== null && !included.has(cursor)) {
      included.add(cursor); cursor = parents.get(cursor) ?? null;
    }
  }
  const nodes = new Map(categories.filter(category => included.has(category.id))
    .map(category => [category.id, { category, children: [] } as CategoryTreeNode<T>]));
  const roots: CategoryTreeNode<T>[] = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(parents.get(node.category.id) ?? -1);
    (parent ? parent.children : roots).push(node);
  }
  function value(category: T): string | number {
    switch (sort.field) {
      case 'order': return category.sortOrder;
      case 'active': return category.isActive ? 0 : 1;
      case 'parent': return byId.get(category.parentId ?? -1)?.name.toLocaleLowerCase() ?? '';
      default: return category[sort.field].toLocaleLowerCase();
    }
  }
  const pending = [roots];
  while (pending.length) {
    const siblings = pending.pop()!;
    siblings.sort((a, b) => {
      const left = value(a.category), right = value(b.category);
      const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
      return result * (sort.direction === 'asc' ? 1 : -1) || a.category.name.localeCompare(b.category.name) || a.category.id - b.category.id;
    });
    for (const node of siblings) if (node.children.length) pending.push(node.children);
  }
  return roots;
}

export function flattenCategoryTree<T>(roots: CategoryTreeNode<T>[], collapsed: Set<number>, getId: (category: T) => number) {
  const rows: { category: T; depth: number; hasChildren: boolean }[] = [];
  const stack = roots.slice().reverse().map(node => ({ node, depth: 0 }));
  while (stack.length) {
    const { node, depth } = stack.pop()!;
    rows.push({ category: node.category, depth, hasChildren: node.children.length > 0 });
    if (!collapsed.has(getId(node.category))) {
      for (let index = node.children.length - 1; index >= 0; index--) stack.push({ node: node.children[index], depth: depth + 1 });
    }
  }
  return rows;
}

/** Move before/after a sibling and assign unique Orders without changing parentage. */
export function reorderCategorySiblings<T extends Category>(categories: T[], sourceId: number, targetId: number, after: boolean) {
  const source = categories.find(category => category.id === sourceId);
  const target = categories.find(category => category.id === targetId);
  if (!source || !target || sourceId === targetId || source.parentId !== target.parentId) return [];
  const siblings = categories.filter(category => category.parentId === source.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
  const next = siblings.filter(category => category.id !== sourceId);
  const targetIndex = next.findIndex(category => category.id === targetId);
  next.splice(targetIndex + (after ? 1 : 0), 0, source);
  if (next.every((category, index) => category.id === siblings[index].id)) return [];
  if (next.length > 1_000_001) throw new Error('Too many siblings to reorder');
  return next.map((category, sortOrder) => ({ id: category.id, sortOrder }))
    .filter(update => categories.find(category => category.id === update.id)?.sortOrder !== update.sortOrder);
}

export async function saveCategoryOrder(updates: { id: number; sortOrder: number }[], request: typeof fetch = fetch) {
  let saved = 0;
  for (const update of updates) {
    try {
      const response = await request(`/api/threed/model-categories?id=${update.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: update.sortOrder }), signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Order update was not confirmed');
      saved++;
    } catch (error) {
      return { saved, error: error instanceof Error ? error.message : 'Order update was not confirmed' };
    }
  }
  return { saved, error: null };
}
