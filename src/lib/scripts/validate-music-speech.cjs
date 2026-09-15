const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
let user = null, calls = [], providerStatus = 200, output = 'audio';
const env = {};
class Reply { constructor(body, options) { this.body = body; this.options = options; } static json(body, options) { return new Reply(body, options); } }
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/music/audio/generate/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: exportsObject, Buffer, AbortSignal, process: { env },
  require: name => { if (name === 'next/server') return { NextResponse: Reply }; if (name === '@/lib/auth') return { auth: async () => user }; throw Error(name); },
  fetch: async (url, options) => { calls.push({ url, options }); return new Response(output, { status: providerStatus }); },
});
const valid = { text: 'Hello', voiceId: 'a'.repeat(32) };
const post = body => exportsObject.POST({ json: async () => body, signal: new AbortController().signal });
(async () => {
  assert.equal((await post(valid)).options.status, 401);
  user = { user: { id: 'owner' } };
  assert.equal((await exportsObject.GET()).body.configured, false);
  for (const body of [null, {}, { ...valid, text: '' }, { ...valid, text: 'a'.repeat(2001) }, { ...valid, voiceId: 'bad' }]) assert.equal((await post(body)).options.status, 400);
  assert.equal((await post(valid)).options.status, 503); assert.equal(calls.length, 0);
  env.FISH_AUDIO_API_KEY = 'fixture-secret';
  const response = await post(valid);
  assert.equal(response.body.toString(), 'audio'); assert.equal(response.options.headers['Cache-Control'], 'private, no-store');
  assert.equal(calls[0].options.headers.model, 's2.1-pro-free');
  assert.equal(calls[0].url, 'https://api.fish.audio/v1/tts');
  assert.equal(JSON.parse(calls[0].options.body).reference_id, valid.voiceId);
  providerStatus = 429; output = 'provider private details';
  const failed = await post(valid); assert.equal(failed.options.status, 502); assert.ok(!JSON.stringify(failed).includes(output));
  for (const code of [400, 401, 402, 403, 404, 422, 429, 500]) {
    providerStatus = code;
    const rejected = await post(valid);
    assert.equal(rejected.body.providerStatus, code);
    assert.ok(rejected.body.error.includes(`HTTP ${code}`));
    assert.ok(!JSON.stringify(rejected).includes(output));
  }
  providerStatus = 200; output = '';
  assert.equal((await post(valid)).options.status, 502);
  console.log('PASS: Speech auth, validation, configuration, provider request, audio response and sanitized failures (offline).');
})().catch(error => { console.error(error); process.exitCode = 1; });
