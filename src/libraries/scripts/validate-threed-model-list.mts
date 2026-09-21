import assert from 'node:assert/strict';
// @ts-expect-error Native validator requires explicit extensions.
import { parseModelListQuery, MODEL_LIST_SORT_FIELDS } from '../services/threed/models/model-list-query.ts';
const parse = (query: string) => parseModelListQuery(new URLSearchParams(query));
assert.deepEqual(parse(''), { limit: 50, offset: 0, sort: 'createdAt', direction: 'desc' });
for (const size of [25, 50, 100, 200]) {
  for (const offset of [0, 200, 1000, 10000]) {
    assert.equal(parse(`limit=${size}&offset=${offset}`).offset, offset);
  }
}
for (const sort of MODEL_LIST_SORT_FIELDS) for (const direction of ['asc', 'desc']) {
  assert.equal(parse(`sort=${sort}&direction=${direction}`).sort, sort);
  assert.equal(parse(`sort=${sort}&direction=${direction}`).direction, direction);
}
for (const query of ['limit=0', 'limit=-1', 'limit=201', 'limit=50abc', 'limit=1.5', 'limit=',
  'offset=-1', 'offset=NaN', 'offset=Infinity', 'offset=2147483648', 'offset=1.5',
  'sort=name;drop table threed_models', 'sort=unknown', 'direction=desc nulls first']) {
  assert.throws(() => parse(query), /Invalid/);
}
console.log('PASS: Model pagination accepts offsets beyond 200, bounds page sizes, preserves legacy ordering defaults, and rejects invalid numbers/sort injection');
