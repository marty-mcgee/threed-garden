import assert from 'node:assert/strict';
// @ts-expect-error Native validators use explicit TypeScript extensions.
import { buildCategoryTree, flattenCategoryTree, reorderCategorySiblings, saveCategoryOrder } from '../../components/admin/threed/models/category-tree-core.ts';
// @ts-expect-error Native validators use explicit TypeScript extensions.
import { mergedModelCategories, updateBulkModelCategories } from '../../components/admin/threed/models/bulk-model-categories-core.ts';
// @ts-expect-error Native validators use explicit TypeScript extensions.
import { parseCategoryListQuery, CATEGORY_SORT_FIELDS } from '../services/threed/models/category-list-query.ts';
const parse = (query: string) => parseCategoryListQuery(new URLSearchParams(query));
assert.equal(parse(''), null, 'Existing full-taxonomy consumers must not become paginated');
assert.equal(parse('id=12'), null);
assert.deepEqual(parse('limit=25'), { limit: 25, offset: 0, search: '', sort: 'order', direction: 'asc' });
assert.equal(parse('limit=50&offset=1000')?.offset, 1000);
assert.equal(parse('search=%20Garden%20')?.search, 'Garden');
for (const field of CATEGORY_SORT_FIELDS) for (const direction of ['asc', 'desc']) {
  assert.equal(parse(`sort=${field}&direction=${direction}`)?.sort, field);
  assert.equal(parse(`sort=${field}&direction=${direction}`)?.direction, direction);
}
for (const query of ['limit=0', 'limit=201', 'limit=50x', 'limit=1.5', 'offset=-1', 'offset=2147483648',
  'offset=NaN', 'sort=name;drop table', 'sort=unknown', 'direction=desc nulls first']) {
  assert.throws(() => parse(query), /Invalid/);
}
console.log('PASS: full taxonomy compatibility, bounded pagination beyond 200, category sort allowlist and invalid query rejection');

const category = (id: number, parentId: number | null, name: string, sortOrder = 0) => ({ id, parentId, name, slug: name.toLowerCase(), description: null, sortOrder, isActive: true });
const records = [category(3, 2, 'Grandchild'), category(4, null, 'Other'), category(2, 1, 'Child'), category(1, null, 'Parent')];
const sort = { field: 'order' as const, direction: 'asc' as const };
const ids = (tree: ReturnType<typeof buildCategoryTree<typeof records[number]>>, collapsed = new Set<number>()) => flattenCategoryTree(tree, collapsed, row => row.id).map(row => row.category.id);
const tree = buildCategoryTree(records, '', sort);
assert.deepEqual(ids(tree), [4, 1, 2, 3], 'Unordered input renders parent before all descendants');
assert.deepEqual(flattenCategoryTree(tree, new Set(), row => row.id).map(row => row.depth), [0, 0, 1, 2]);
assert.deepEqual(ids(tree, new Set([1])), [4, 1], 'Collapsed branches hide descendants only');
assert.deepEqual(ids(buildCategoryTree(records, 'grandchild', sort)), [1, 2, 3], 'Search retains the complete ancestor path');
assert.deepEqual(ids(buildCategoryTree(records, 'missing', sort)), []);
assert.deepEqual(ids(buildCategoryTree(records, '', { field: 'name', direction: 'desc' })), [1, 2, 3, 4], 'Sorting applies to siblings');
assert.deepEqual(ids(tree.slice(1, 2)), [1, 2, 3], 'Branch pagination never splits a family');
const malformed = [category(10, 11, 'Cycle A'), category(11, 10, 'Cycle B'), category(12, 12, 'Self'), category(13, 999, 'Missing parent')];
assert.deepEqual(ids(buildCategoryTree(malformed, '', sort)).sort((a, b) => a - b), [10, 11, 12, 13], 'Legacy cycles, self links and absent parents appear exactly once');
const many = Array.from({ length: 250 }, (_, index) => category(index + 20, null, `Root ${index}`, index));
assert.equal(ids(buildCategoryTree(many, '', sort).slice(200, 250)).length, 50, 'Complete taxonomy retains roots beyond 200');
console.log('PASS: category tree grouping, depth, collapse, ancestor search, sibling sorting, whole-branch pagination and invalid legacy relationships');

const sortable = [category(1, null, 'A', 10), category(2, null, 'B', 20), category(3, null, 'C', 30), category(4, 1, 'Child', 7)];
const updates = reorderCategorySiblings(sortable, 3, 1, false);
assert.deepEqual(updates, [{ id: 3, sortOrder: 0 }, { id: 1, sortOrder: 1 }, { id: 2, sortOrder: 2 }]);
assert.deepEqual(reorderCategorySiblings(sortable, 1, 3, true).map(row => row.id), [2, 3, 1]);
assert.deepEqual(reorderCategorySiblings(sortable, 4, 1, false), [], 'Cross-parent moves are rejected');
assert.deepEqual(reorderCategorySiblings(sortable, 1, 2, false), [], 'Same-position drops do not write');
assert.deepEqual(reorderCategorySiblings(sortable, 1, 1, true), []);
assert.equal(sortable[3].sortOrder, 7, 'Descendants are not renumbered when a root moves');
const calls: { url: string; body: unknown }[] = [];
const request = (async (url, options) => {
  assert.equal(options?.method, 'PATCH');
  calls.push({ url: String(url), body: JSON.parse(String(options?.body)) });
  return Response.json({ success: true });
}) as typeof fetch;
assert.deepEqual(await saveCategoryOrder(updates, request), { saved: 3, error: null });
assert.deepEqual(calls, updates.map(update => ({ url: `/api/threed/model-categories?id=${update.id}`, body: { sortOrder: update.sortOrder } })), 'Only Order is persisted through the existing scoped API');
let count = 0;
const failing = (async () => ++count === 1 ? Response.json({ success: true }) : Response.json({ success: false, error: 'Rejected' }, { status: 409 })) as typeof fetch;
assert.deepEqual(await saveCategoryOrder(updates, failing), { saved: 1, error: 'Rejected' });
assert.equal(count, 2, 'Stop on first failure rather than silently continuing partial writes');
console.log('PASS: sibling drop placement, parent/descendant preservation, no-op rejection, Order-only saves and partial failure reporting');

assert.deepEqual(mergedModelCategories([1, 2], [2, 3], 'add'), [1, 2, 3]);
assert.deepEqual(mergedModelCategories([1, 2], [2], 'remove'), [1]);
assert.deepEqual(mergedModelCategories([1, 2], [], 'replace'), []);
const bulkCalls: { url: string; body: unknown }[] = [];
const bulkRequest = (async (url, options) => {
  const id = Number(new URL(String(url), 'https://fixture.invalid').searchParams.get('id'));
  if (options?.method !== 'PATCH') return Response.json({ success: true, data: { id, categories: [{ id: 9 }] } });
  bulkCalls.push({ url: String(url), body: JSON.parse(String(options.body)) });
  return id === 2 ? Response.json({ success: false, error: 'Denied' }, { status: 403 }) : Response.json({ success: true });
}) as typeof fetch;
const bulkResult = await updateBulkModelCategories([{ id: 1, modelName: 'One' }, { id: 2, modelName: 'Two' }, { id: 3, modelName: 'Three' }], [4], 'add', bulkRequest);
assert.equal(bulkResult.updated, 2);
assert.deepEqual(bulkResult.failures, ['Two (#2): Denied']);
assert.deepEqual(bulkCalls.map(call => call.body), [{ categoryIds: [9, 4] }, { categoryIds: [9, 4] }, { categoryIds: [9, 4] }], 'Fresh assignments retained; no geometry or other Model fields sent');
assert.deepEqual(bulkCalls.map(call => call.url), ['/api/threed/models?id=1', '/api/threed/models?id=2', '/api/threed/models?id=3']);
console.log('PASS: bulk category Add/Remove/Replace, explicit clearing, fresh assignment preservation, category-only PATCH and partial failure continuation');
