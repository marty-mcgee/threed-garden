const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const file = 'src/app/api/threed/layers/route.ts';
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const api = {};
vm.runInNewContext(code, { exports: api, require(name) {
  assert.equal(name, 'next/server');
  return { NextResponse: { json: (body, options) => ({ body, ...options }) } };
} });
for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(api[method]().status, 410);
console.log('PASS: retired Layer record endpoints return Gone without accessing storage.');
