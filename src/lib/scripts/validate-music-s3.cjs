const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, context) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, ...context }); return exports; }
const policy = load('src/lib/services/music/upload-policy.ts', {});
assert.equal(policy.uploadPolicy('video.mp4', 100 * 1024 * 1024, 'media').contentType, 'video/mp4');
for (const args of [['x.svg', 1, 'image'], ['x.mp4', 1, 'audio'], ['x.png', 21 * 1024 * 1024, 'media'], ['x.wav', 513 * 1024 * 1024, 'audio']]) assert.throws(() => policy.uploadPolicy(...args));
let clientConfig, signedIn = true, calls = [], head = { ContentLength: 100, ContentType: 'audio/mpeg' };
class Command { constructor(input) { this.input = input; } }
class Response { constructor(body, options) { this.body = body; this.options = options; } static json(body, options) { return new Response(body, options); } }
const mocks = {
 'next/server': { NextResponse: Response }, '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'owner' } } : null },
 '@/lib/services/music/upload-policy': policy,
 '@aws-sdk/client-s3': { S3Client: class { constructor(config) { clientConfig = config; } async send(command) { calls.push(command.input); return head; } }, PutObjectCommand: Command, HeadObjectCommand: Command, GetObjectCommand: Command },
 '@aws-sdk/s3-request-presigner': { getSignedUrl: async (_, command) => { calls.push(command.input); return 'https://s3.example/signed'; } },
};
const api = load('src/app/api/music/files/route.ts', { process: { env: { AWS_REGION: 'fixture', S3_BUCKET_NAME: 'fixture' } }, crypto: { randomUUID: () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, require: name => { assert.ok(name in mocks,name); return mocks[name]; } });
const post = body => api.POST({ json: async () => body });
(async () => {
 const draft = { action: 'start', name: 'audio.mp3', size: 100, kind: 'audio' };
 signedIn = false; assert.equal((await post(draft)).options.status, 401); assert.equal(calls.length,0); signedIn = true;
 const started = await post(draft); assert.equal(clientConfig.requestChecksumCalculation, 'WHEN_REQUIRED'); assert.equal(started.body.contentType,'audio/mpeg'); assert.equal(calls[0].ContentLength,100); assert.equal(calls[0].ACL,undefined);
 const key = started.body.key; assert.ok(key.startsWith('threed/users/owner/multimedia/')); assert.ok(key.endsWith('/audio.mp3'));
 assert.ok(policy.ownsMediaKey('owner', 'multimedia/users/owner/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.wav'));
 assert.ok(!policy.ownsMediaKey('owner', key + '/extra'));
 assert.throws(() => policy.uploadPolicy('../audio.wav', 100, 'audio'));
 const named = await post({ ...draft, name: 'My song #1.WAV' });
 assert.ok(named.body.key.endsWith('/My song #1.WAV'));
 assert.equal((await post({ ...draft, action:'complete', key: key.replace('owner','other') })).options.status,400);
 const complete = await post({ ...draft, action:'complete', key }); assert.ok(complete.body.fileUrl.startsWith('/api/music/files?key='));
 head.ContentLength = 99; assert.equal((await post({ ...draft, action:'complete', key })).options.status,409);
 assert.equal((await api.GET({ nextUrl: new URL('http://app/api/music/files?key=other') })).options.status,404);
 const read = await api.GET({ nextUrl: new URL('http://app'+complete.body.fileUrl) }); assert.equal(read.options.status,307); assert.equal(read.options.headers['Cache-Control'],'private, no-store');
 const sdk = require('@aws-sdk/client-s3');
 const signer = require('@aws-sdk/s3-request-presigner');
 const client = new sdk.S3Client({ ...clientConfig, credentials: { accessKeyId: 'fixture', secretAccessKey: 'fixture' } });
 const signed = new URL(await signer.getSignedUrl(client, new sdk.PutObjectCommand({ Bucket: 'fixture', Key: 'audio.wav', ContentLength: 100, ContentType: 'audio/wav' }), { expiresIn: 900 }));
 assert.equal(signed.searchParams.has('x-amz-checksum-crc32'), false);
 assert.ok(signed.searchParams.get('X-Amz-SignedHeaders').includes('content-length'));
 console.log('PASS: S3 policy, auth, owner keys, signed size, completion verification and private redirects (offline).');
})().catch(error => { console.error(error); process.exitCode=1; });
