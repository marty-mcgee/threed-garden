// Actual slot service with offline DB queue; no live database or storage.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date, require: name => { assert(name in deps, name); return deps[name]; } });
 return exports;
}
const animation = load('src/libraries/utils/animation.ts');
const contracts = load('src/libraries/services/threed/animations/contracts.ts', { '@/libraries/utils/animation': animation });
const schema = new Proxy({}, { get: (_, table) => new Proxy({}, { get: (_, column) => `${String(table)}.${String(column)}` }) });
const orm = Object.fromEntries(['and','asc','eq','inArray'].map(kind => [kind, (...args) => ({ kind, args })]));
orm.sql = (strings, ...args) => ({ strings: [...strings], args });
let queue = [], queries = [];
const tx = {};
for (const operation of ['select','insert','update','delete']) tx[operation] = () => {
 const query = { operation }, chain = {};
 for (const method of ['from','leftJoin','where','orderBy','for','limit','values','set','returning']) chain[method] = (...args) => { query[method] = args; return chain; };
 chain.then = (resolve, reject) => { queries.push(query); assert(queue.length, 'Unexpected query'); return Promise.resolve(queue.shift()).then(resolve, reject); };
 return chain;
};
const service = load('src/libraries/services/threed/animations/slots.ts', { 'node:crypto': { randomUUID: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, 'drizzle-orm': orm, '@/libraries/db/client': { db: { ...tx, transaction: fn => fn(tx) } }, '@/libraries/schema/threed': schema, './contracts': contracts });
const slot = { id: 1, actionKey: 'custom_' + 'a'.repeat(32), name: 'My Action', categoryId: null, categoryName: null, isActive: true };
async function run(results, fn) { queue = results; queries = []; const result = await fn(); assert.equal(queue.length, 0); return result; }
(async () => {
 await run([[slot]], () => service.listActionSlots('owner'));
 assert(JSON.stringify(queries[0].where).includes('owner'));
 assert(JSON.stringify(queries[0].leftJoin).includes('threedAnimationCategories.userId'));
 for (const body of [null, { name: '', categoryId: null, isActive: true }, { name: 'N', categoryId: null, isActive: 'yes' }, { name: 'N', categoryId: null, isActive: true, actionKey: 'watering' }]) assert.throws(() => service.parseActionSlot(body));
 await run([[slot]], () => service.saveActionSlot('owner', { name: slot.name, categoryId: slot.categoryId, isActive: true }));
 assert.equal(queries[0].values[0].actionKey, slot.actionKey); assert.equal(queries[0].values[0].userId, 'owner');
 await run([[slot]], () => service.saveActionSlot('owner', { id: 1, name: 'Renamed', categoryId: null, isActive: false }));
 assert(!('actionKey' in queries[0].set[0])); assert(JSON.stringify(queries[0].where).includes('owner'));
 await assert.rejects(run([[]], () => service.saveActionSlot('other', { id: 1, name: 'N', categoryId: null, isActive: true })), e => e.status === 404);
 await run([[{ id: 7 }], [slot]], () => service.saveActionSlot('owner', { name: 'Categorized', categoryId: 7, isActive: true }));
 assert.equal(queries[0].for[0], 'share'); assert(JSON.stringify(queries[0].where).includes('owner')); assert.equal(queries[1].values[0].categoryId, 7);
 await assert.rejects(run([[]], () => service.saveActionSlot('other', { name: 'N', categoryId: 7, isActive: true })), e => e.status === 400);
 await run([[slot]], () => service.validateActionSlots(tx, 'owner', [slot.actionKey]));
 assert.equal(queries[0].for[0], 'share'); assert(JSON.stringify(queries[0].where).includes('owner'));
 await assert.rejects(run([[]], () => service.validateActionSlots(tx, 'other', [slot.actionKey])), e => e.status === 400);
 await run([], () => service.validateActionSlots(tx, 'owner', ['pickFruit']));
 for (let reference = 0; reference < 3; reference++) {
  await assert.rejects(run([[slot], ...Array.from({ length: reference }, () => []), [{ id: 8 }]], () => service.deleteActionSlot('owner', 1)), e => e.status === 409);
  assert(!queries.some(q => q.operation === 'delete'));
 }
 await run([[slot], [], [], [], []], () => service.deleteActionSlot('owner', 1)); assert.equal(queries[0].for[0], 'update');
 assert(JSON.stringify(queries.at(-1).where).includes('owner'));
 console.log('PASS: User-owned slot creation, immutable identity, rename/disable, input rejection, owner validation, locks and protected deletion (offline)');
})().catch(error => { console.error(error); process.exitCode = 1; });


const schemaSource = fs.readFileSync('src/libraries/schema/threed/index.ts','utf8');
assert(schemaSource.includes("name: 'animation_action_slot_category_owner_fk'"));
assert(schemaSource.includes('columns: [t.categoryId, t.userId]'));
assert(schemaSource.includes("groupName: varchar('group_name'"));
assert(schemaSource.includes(".notNull().default('Custom Actions')"));
