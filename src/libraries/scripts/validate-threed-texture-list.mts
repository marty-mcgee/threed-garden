import assert from 'node:assert/strict';
// @ts-expect-error Native validators use explicit TypeScript extensions.
import { parseTextureListQuery, TEXTURE_SORT_FIELDS } from '../services/threed/models/texture-list-query.ts';
const parse = (query: string) => parseTextureListQuery(new URLSearchParams(query));
assert.equal(parse(''), null, 'Importer catalogs must retain their full-list response');
assert.deepEqual(parse('limit=25'), { limit: 25, offset: 0, search: '', sort: 'name', direction: 'asc' });
assert.equal(parse('limit=200&offset=1200')?.offset, 1200);
assert.equal(parse('search=%20image/png%20')?.search, 'image/png');
for (const sort of TEXTURE_SORT_FIELDS) for (const direction of ['asc', 'desc']) {
  assert.equal(parse(`sort=${sort}&direction=${direction}`)?.sort, sort);
  assert.equal(parse(`sort=${sort}&direction=${direction}`)?.direction, direction);
}
for (const query of ['limit=0', 'limit=201', 'limit=50abc', 'offset=-1', 'offset=1.5', 'offset=Infinity',
  'offset=2147483648', 'sort=file_path', 'sort=name;drop table', 'direction=desc nulls first']) {
  assert.throws(() => parse(query), /Invalid/);
}
console.log('PASS: full Texture catalog compatibility, page bounds beyond 200, sortable fields and invalid-query rejection');
