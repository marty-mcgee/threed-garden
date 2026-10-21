const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const api = await import(pathToFileURL(path.join(__dirname, 'download-legacy-obj-textures.ts')).href);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'threed-legacy-texture-'));
  try {
    const source = path.join(root, 'source'), output = path.join(root, 'textures');
    await fs.mkdir(source);
    const jpeg = Buffer.from([255,216,255,224,1,2,255,217]);
    await fs.writeFile(path.join(source, 'stove.obj'), 'mtllib stove.mtl\n');
    await fs.writeFile(path.join(source, 'stove.mtl'), 'newmtl paint\nmap_Kd -s 1 1 1 "stove 11.jpg"\nmap_bump existing.jpg\n');
    await fs.writeFile(path.join(source, 'existing.jpg'), jpeg);
    await fs.writeFile(path.join(source, 'broken.obj'), 'mtllib absent.mtl\n');
    await fs.writeFile(path.join(source, 'unsafe.obj'), 'mtllib ../escape.mtl\n');
    const audit = await api.scanLegacyTextures(source);
    assert.equal(audit.objects, 3);
    assert.equal(audit.issues.length, 2);
    const missing = audit.textures.find(t => t.status === 'missing-local');
    assert.equal(missing.url, 'https://homeidea3d.sbcode.net/objects/stove/stove%2011.jpg');
    assert.equal(audit.textures.find(t => t.fileName === 'existing.jpg').status, 'present-local');
    let calls = 0;
    const fetcher = async (url, options) => {
      calls++; assert.equal(options.redirect, 'error');
      assert(url.startsWith('https://homeidea3d.sbcode.net/objects/'));
      return new Response(jpeg);
    };
    await api.recoverLegacyTextures(audit.textures, output, fetcher);
    assert.equal(calls, 1, 'Existing local textures do not download.');
    assert.deepEqual(await fs.readdir(output), ['stove 11.jpg'], 'Output is flat.');
    assert.equal(missing.status, 'downloaded');
    const repeat = { ...missing, status: 'missing-local' };
    await api.recoverLegacyTextures([repeat], output, fetcher);
    assert.equal(repeat.status, 'already-downloaded');
    const conflict = { ...missing, object: 'other', url: api.legacyTextureUrl('other', missing.fileName), status: 'missing-local' };
    const different = Buffer.from([255,216,255,224,9,9,255,217]);
    await api.recoverLegacyTextures([conflict], output, async () => new Response(different));
    assert.equal(conflict.status, 'downloaded-renamed');
    assert.equal(path.dirname(conflict.outputFile), output);
    assert.deepEqual(await fs.readFile(conflict.outputFile), different);
    assert.deepEqual(await fs.readFile(path.join(output, missing.fileName)), jpeg);
    await assert.rejects(api.fetchLegacyTexture(missing.url, missing.fileName, async () => new Response('<html>oops</html>')), /signature/);
    await assert.rejects(api.fetchLegacyTexture(missing.url, missing.fileName, async () => new Response('', { status: 404 })), /404/);
    await assert.rejects(api.fetchLegacyTexture(missing.url, missing.fileName, async () => new Response('', { headers: { 'content-length': String(33*1024*1024) } })), /32 MiB/);
    await assert.rejects(api.fetchLegacyTexture('https://elsewhere.invalid/texture.jpg', 'texture.jpg', fetcher), /fixed legacy/);
    assert.throws(() => api.legacyTextureUrl('../escape', 'test.jpg'), /Unsafe/);
    assert.throws(() => api.legacyTextureUrl('test', 'CON.jpg'), /Unsafe/);
    assert.deepEqual(await fs.readFile(path.join(source, 'existing.jpg')), jpeg);
    console.log('PASS legacy texture recovery: canonical MTL options, missing libraries/traversal, fixed URLs, existing-file skip, flat output, collision preservation, HTTP/HTML/size failures (mocked network).');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
