// Run the installed Blob SDK with an offline HTTP boundary. No storage requests escape.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'assembly-part.glb', { type: 'model/gltf-binary' });
const pathname = 'threed/users/fixture/models/assembly-part.glb';
const stored = {
  pathname,
  url: `https://fixture.public.blob.vercel-storage.com/${pathname}`,
  downloadUrl: `https://fixture.public.blob.vercel-storage.com/${pathname}?download=1`,
  contentType: file.type,
  contentDisposition: 'inline',
};
const calls = [];
const modules = new Map();
async function offlineFetch(input, init = {}) {
  const url = new URL(String(input));
  if (url.origin === 'https://app.invalid') {
    const body = JSON.parse(init.body);
    assert.equal(body.type, 'blob.generate-client-token');
    assert.equal(body.payload.pathname, pathname);
    return Response.json({ clientToken: 'vercel_blob_client_fixture_offline' });
  }
  assert.equal(url.origin, 'https://vercel.com');
  const headers = new Headers(init.headers);
  calls.push({ method: init.method, action: headers.get('x-mpu-action'), length: headers.get('x-content-length') });
  // Reproduce the reported provider rejection; browser code cannot set Content-Length itself.
  if (!headers.has('x-content-length')) return Response.json({ error: { code: 'bad_request', message: 'Missing [x]-content-length header.' } }, { status: 400 });
  const body = new Uint8Array(await new Response(init.body).arrayBuffer());
  assert.equal(headers.get('x-content-length'), String(body.byteLength));
  assert.equal(body.byteLength, file.size);
  assert.equal(headers.get('x-content-type'), file.type);
  return Response.json(stored);
}

function load(filePath) {
  filePath = path.resolve(filePath);
  if (modules.has(filePath)) return modules.get(filePath);
  const exports = {};
  modules.set(filePath, exports);
  const code = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    module: { exports },
    require(name) {
      if (name === '@vercel/blob/client') return load('node_modules/@vercel/blob/dist/client.js');
      if (name === 'undici') return { fetch: offlineFetch };
      if (name === 'is-node-process') return { isNodeProcess: () => false };
      if (name.startsWith('.')) {
        let target = path.resolve(path.dirname(filePath), name);
        if (!path.extname(target)) target += '.ts';
        return load(target);
      }
      return require(name);
    },
    Blob, File, FormData, Request, Response, Headers, URL, URLSearchParams, ReadableStream, TransformStream,
    AbortController, AbortSignal, DOMException, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer,
    Buffer, console, setTimeout, clearTimeout, window: {}, location: { href: 'https://app.invalid/project' },
    process: { env: {} },
    fetch: async (url, init) => {
      assert.equal(url, '/api/threed/models/upload/direct');
      const body = JSON.parse(init.body);
      if (body.action === 'authorize') return Response.json({ success: true, data: { pathname, authorization: 'offline-authorization' } });
      assert.equal(body.action, 'complete');
      return Response.json({ success: true, data: { url: stored.url, fileName: file.name, fileSize: file.size, modelType: 'glb' } });
    },
  }, { filename: filePath });
  return exports;
}

async function run() {
  const sdk = load('node_modules/@vercel/blob/dist/client.js');
  await assert.rejects(sdk.upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/threed/models/upload/direct',
    multipart: true,
    onUploadProgress() {},
  }), /Missing \[x\]-content-length header/);
  assert.equal(calls[0].action, 'create');
  assert.equal(calls[0].length, null);
  console.log('PASS installed SDK reproduces missing-length rejection on forced multipart creation');
  calls.length = 0;
  const client = load('src/libraries/services/threed/models/model-primary-upload-client.ts');
  const result = await client.uploadThreeDPrimaryFile(file);
  assert.equal(result.url, stored.url);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].action, null);
  assert.equal(calls[0].length, String(file.size));
  console.log('PASS actual Model uploader sends exact GLB length through installed SDK and completes verification');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
