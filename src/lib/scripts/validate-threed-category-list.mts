import assert from 'node:assert/strict';
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
