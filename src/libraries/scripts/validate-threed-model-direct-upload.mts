import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
// @ts-expect-error Native offline validator requires explicit extensions.
import * as server from '../services/threed/models/model-direct-upload-server.ts';
// @ts-expect-error Native offline validator requires explicit extensions.
import * as policy from '../services/threed/models/model-upload-policy-core.ts';
// @ts-expect-error Native offline validator requires explicit extensions.
import { triangleGltfFixture, encodeGlb } from './fixtures/gltf-bundle-fixtures.ts';
// @ts-expect-error Native offline validator requires explicit extensions.
import { validateBulkPrimary, validateBulkCompanion } from '../../components/admin/threed/models/model-bulk-preparation-core.ts';

const secret = 'offline-fixture-credential', owner = 'owner-123', id = '12345678-1234-4234-8234-123456789012';
const fixture = triangleGltfFixture();
const bytes = new Uint8Array(encodeGlb({ ...fixture.document, buffers: [{ byteLength: fixture.geometry.byteLength }] }, fixture.geometry));
const authorize = (size = bytes.length, name = 'cottage.glb') => server.authorizeThreeDDirectUpload(owner, name, size, secret, id);
const authorized = authorize(), receipt = server.verifyThreeDDirectUpload(authorized.authorization, owner, secret);
const object = { pathname: receipt.pathname, url: `https://fixture.public.blob.vercel-storage.com/${receipt.pathname}`,
  size: bytes.length, contentType: receipt.contentType };
let groups = 0;
async function group(label: string, run: () => void | Promise<void>) { await run(); groups++; console.log(`PASS ${label}`); }

await group('4/16/32 MiB source tiers, exact boundary and format-specific bulk limits', () => {
  for (const size of [4, 16, 32].map(mib => mib * 1024 * 1024)) {
    assert.equal(policy.threeDModelUploadPolicy('cottage.glb', size).fileSize, size);
    assert.equal(validateBulkPrimary({ name: 'cottage.glb', size } as File), null);
  }
  assert.throws(() => policy.threeDModelUploadPolicy('cottage.glb', 32 * 1024 * 1024 + 1), /32 MiB/);
  assert.match(validateBulkPrimary({ name: 'cottage.glb', size: 32 * 1024 * 1024 + 1 } as File)!, /32 MiB/);
  assert.match(validateBulkPrimary({ name: 'cottage.fbx', size: 4 * 1024 * 1024 + 1 } as File)!, /4 MiB/);
  assert.match(validateBulkCompanion({ name: 'wall.png', size: 4 * 1024 * 1024 + 1 } as File)!, /4 MiB/);
  for (const name of ['../cottage.glb', 'cottage.exe', 'cottage\u0000.glb']) assert.throws(() => policy.threeDModelUploadPolicy(name, 1));
  for (const size of [0, -1, Infinity, 1.5]) assert.throws(() => policy.threeDModelUploadPolicy('cottage.glb', size));
});

await group('signed receipt rejects other owners, tampering, expiry and different credentials', () => {
  assert.equal(receipt.pathname, authorized.pathname);
  assert.throws(() => server.verifyThreeDDirectUpload(authorized.authorization, 'other', secret));
  assert.throws(() => server.verifyThreeDDirectUpload(authorized.authorization, owner, secret, Date.now() + 46 * 60_000));
  assert.throws(() => server.verifyThreeDDirectUpload(authorized.authorization, owner, 'different'));
  const [payload, sig] = authorized.authorization.split('.');
  const changed = Buffer.from(JSON.stringify({ ...receipt, fileSize: bytes.length + 1 })).toString('base64url');
  assert.throws(() => server.verifyThreeDDirectUpload(`${changed}.${sig}`, owner, secret));
  assert.throws(() => server.verifyThreeDDirectUpload(`${payload}.a`, owner, secret));
  assert.ok(!authorized.authorization.includes(secret));
});

await group('completion verifies provider key/type/size before any byte fetch', async () => {
  let calls = 0;
  const request = async () => { calls++; return new Response(bytes); };
  for (const changed of [{ ...object, pathname: 'other' }, { ...object, size: object.size + 1 },
    { ...object, contentType: 'text/html' }, { ...object, url: 'https://evil.example/cottage.glb' },
    { ...object, url: object.url + '?x=1' }]) {
    await assert.rejects(server.completeThreeDDirectUpload(receipt, changed, request as typeof fetch));
  }
  assert.equal(calls, 0);
  const result = await server.completeThreeDDirectUpload(receipt, object, request as typeof fetch);
  assert.equal(calls, 1); assert.equal(result.fileSize, bytes.length);
  assert.equal(result.analysis.status, 'analyzed'); assert.equal(result.analysis.meshCount, 1);
});

await group('completion rejects truncated, oversized and structurally invalid actual bytes', async () => {
  for (const data of [bytes.slice(0, -1), new Uint8Array(bytes.length + 1), new Uint8Array(bytes.length)]) {
    await assert.rejects(server.completeThreeDDirectUpload(receipt, object, (async () => new Response(data)) as typeof fetch));
  }
  await assert.rejects(server.completeThreeDDirectUpload(receipt, object,
    (async () => new Response(bytes, { headers: { 'content-length': String(33 * 1024 * 1024) } })) as typeof fetch));
});

await group('real GLB byte inspection accepts measured 4/16/32 MiB containers without relaxing decoded bounds', async () => {
  for (const target of [4, 16, 32].map(mib => mib * 1024 * 1024)) {
    let binLength = target - 1024, large = bytes;
    for (let attempt = 0; attempt < 4; attempt++) {
      const bin = new Uint8Array(binLength); bin.set(fixture.geometry);
      large = new Uint8Array(encodeGlb({ ...fixture.document, buffers: [{ byteLength: binLength }] }, bin));
      if (large.length === target) break;
      binLength += target - large.length;
    }
    assert.equal(large.length, target);
    const ticket = authorize(target), expected = server.verifyThreeDDirectUpload(ticket.authorization, owner, secret);
    const started = performance.now();
    const result = await server.completeThreeDDirectUpload(expected, { ...object, size: target }, (async () => new Response(large)) as typeof fetch);
    assert.equal(result.fileSize, target); assert.equal(result.analysis.status, 'analyzed'); assert.equal(result.analysis.meshCount, 1);
    console.log(`  ${target / 1024 / 1024} MiB structural verification: ${Math.round(performance.now() - started)} ms (offline synthetic triangle)`);
  }
});

function load(file: string, deps: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  const exports: Record<string, any> = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, { exports, Buffer, File, TextEncoder, TextDecoder, Uint8Array, AbortSignal, AbortController,
    Error, URL, console, crypto, ...globals, require(name: string) { assert.ok(name in deps, `Unexpected import: ${name}`); return deps[name]; } });
  return exports;
}

await group('actual route requires auth, bounds JSON and fixes token scope to the signed destination', async () => {
  let session: { user: { id: string } } | null = null, heads = 0, tokens = 0;
  const route = load('src/app/api/threed/models/upload/direct/route.ts', {
    'next/server': { NextResponse: Response }, '@/libraries/auth': { auth: async () => session },
    '@vercel/blob': { head: async (path: string) => { heads++; assert.equal(path, receipt.pathname); return object; } },
    '@vercel/blob/client': { handleUpload: async (options: any) => {
      tokens++; const constraints = await options.onBeforeGenerateToken(options.body.payload.pathname, options.body.payload.clientPayload);
      assert.equal(constraints.maximumSizeInBytes, bytes.length); assert.equal(constraints.allowOverwrite, false);
      assert.equal(constraints.addRandomSuffix, false); assert.deepEqual(Array.from(constraints.allowedContentTypes), [receipt.contentType]);
      return { type: 'blob.generate-client-token', clientToken: 'offline-client-token' };
    } },
    '@/libraries/services/threed/models/model-direct-upload-server': { ...server,
      completeThreeDDirectUpload: (ticket: server.ThreeDDirectUploadReceipt, stored: server.DirectUploadObject) =>
        server.completeThreeDDirectUpload(ticket, stored, (async () => new Response(bytes)) as typeof fetch) },
  }, { process: { env: { BLOB_READ_WRITE_TOKEN: secret } } });
  const post = (body: unknown) => route.POST(new Request('http://fixture.test/upload', { method: 'POST', body: JSON.stringify(body) }));
  assert.equal((await post({ action: 'authorize' })).status, 401); assert.equal(tokens, 0); assert.equal(heads, 0);
  session = { user: { id: owner } };
  assert.equal((await post({ x: 'x'.repeat(9000) })).status, 400);
  assert.equal((await route.POST(new Request('http://fixture.test/upload', { method: 'POST', body: '{broken' }))).status, 400);
  const tokenBody = { type: 'blob.generate-client-token', payload: { pathname: receipt.pathname, clientPayload: authorized.authorization, multipart: true } };
  assert.equal((await post(tokenBody)).status, 200);
  assert.equal((await post({ ...tokenBody, payload: { ...tokenBody.payload, pathname: 'other' } })).status, 400);
  assert.equal((await post({ action: 'complete', authorization: authorized.authorization })).status, 200); assert.equal(heads, 1);
  session = { user: { id: 'other' } };
  assert.equal((await post({ action: 'complete', authorization: authorized.authorization })).status, 400); assert.equal(heads, 1);
});

await group('actual browser helper preflights before network, uploads directly and cleans failed verification', async () => {
  const calls: string[] = [], progress: string[] = []; let corrupt = false, cleanupFails = false;
  let abortAfterTransfer: AbortController | undefined;
  const client = load('src/libraries/services/threed/models/model-primary-upload-client.ts', {
    './model-upload-policy-core': policy,
    '@vercel/blob/client': { upload: async (path: string, file: File, options: any) => {
      calls.push('blob'); assert.equal(path, authorized.pathname); assert.equal(options.multipart, true);
      assert.equal(options.clientPayload, authorized.authorization); assert.ok(file instanceof File);
      options.onUploadProgress({ percentage: 50 }); abortAfterTransfer?.abort(); return object;
    } },
  }, { fetch: async (_url: string, options: RequestInit) => {
    const body = JSON.parse(String(options.body)); calls.push(body.action ?? options.method!);
    if (options.method === 'DELETE') return Response.json({ success: !cleanupFails }, { status: cleanupFails ? 500 : 200 });
    return Response.json({ success: true, data: body.action === 'authorize' ? authorized : {
      url: object.url, fileName: corrupt ? 'wrong.glb' : receipt.fileName, fileSize: bytes.length, modelType: 'glb',
    } });
  } });
  await assert.rejects(client.uploadThreeDPrimaryFile(new File(['x'], 'bad.exe'))); assert.equal(calls.length, 0);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(client.uploadThreeDPrimaryFile(new File([bytes], receipt.fileName), { signal: cancelled.signal })); assert.equal(calls.length, 0);
  const result = await client.uploadThreeDPrimaryFile(new File([bytes], receipt.fileName), { onProgress: (_n: number, phase: string) => progress.push(phase) });
  assert.equal(result.url, object.url); assert.deepEqual(calls, ['authorize', 'blob', 'complete']);
  assert.ok(progress.includes('uploading') && progress.includes('verifying'));
  calls.length = 0; corrupt = true;
  await assert.rejects(client.uploadThreeDPrimaryFile(new File([bytes], receipt.fileName)), /do not match/);
  assert.deepEqual(calls, ['authorize', 'blob', 'complete', 'DELETE']);
  calls.length = 0; corrupt = false;
  abortAfterTransfer = new AbortController();
  await assert.rejects(client.uploadThreeDPrimaryFile(new File([bytes], receipt.fileName), { signal: abortAfterTransfer.signal }), /cancelled/);
  assert.deepEqual(calls, ['authorize', 'blob', 'DELETE']);
  abortAfterTransfer = undefined; corrupt = true;
  calls.length = 0; cleanupFails = true;
  await assert.rejects(client.uploadThreeDPrimaryFile(new File([bytes], receipt.fileName)), (error: unknown) => {
    assert.ok(error instanceof Error); assert.equal(error.name, 'ThreeDPrimaryUploadError');
    assert.equal((error as { cleanupUnconfirmed?: boolean }).cleanupUnconfirmed, true);
    assert.match(error.message, /cleanup is unconfirmed/); return true;
  });
  assert.deepEqual(calls, ['authorize', 'blob', 'complete', 'DELETE']);
});

console.log(`PASS ${groups} direct Model upload groups; all storage, auth and HTTP interactions mocked.`);
