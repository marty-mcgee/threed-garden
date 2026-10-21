/** Local legacy bundle audit and opt-in recovery. No database or upload imports. */
import { readdir, readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
// @ts-expect-error Node's standalone type stripping requires the explicit .ts suffix; App tsconfig uses bundler resolution.
import { inspectObjLibraries, inspectObjMaterial, MAX_OBJ_BYTES } from '../services/threed/models/model-obj-core.ts';

const BASE = 'https://homeidea3d.sbcode.net/objects/';
const MAX_IMAGE = 32 * 1024 * 1024;
type Texture = { object: string; material: string; reference: string; fileName: string; url: string;
  status: string; message?: string; bytes?: number; sha256?: string; outputFile?: string };
type Issue = { object: string; file: string; message: string };
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function safeName(value: string) {
  // The output is flat and must also be safe on Windows.
  if (!value || value === '.' || value === '..' || /[<>:"/\\|?*\x00-\x1f]/.test(value)
    || /[. ]$/.test(value) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) {
    throw new Error('Unsafe object or texture filename.');
  }
  return value;
}
export function legacyTextureUrl(object: string, fileName: string) {
  return `${BASE}${encodeURIComponent(safeName(object))}/${encodeURIComponent(safeName(fileName))}`;
}
export function isTextureImage(bytes: Uint8Array, fileName: string): boolean {
  const b = Buffer.from(bytes), extension = path.extname(fileName).toLowerCase();
  if (extension === '.png') return b.length > 24 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.toString('ascii',12,16) === 'IHDR';
  if (['.jpg', '.jpeg'].includes(extension)) return b.length > 4 && b[0] === 255 && b[1] === 216 && b[2] === 255 && b[b.length-2] === 255 && b[b.length-1] === 217;
  if (extension === '.webp') return b.length > 12 && b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP';
  if (extension === '.bmp') return b.length >= 26 && b.toString('ascii',0,2) === 'BM';
  return false;
}
async function confinedFile(root: string, relative: string): Promise<string | null> {
  const target = path.resolve(root, relative);
  const confined = (file: string) => { const rel = path.relative(root, file); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
  if (!confined(target)) throw new Error('Source dependency escapes its folder.');
  try {
    const actual = await realpath(target);
    if (!confined(actual)) throw new Error('Source dependency symlink escapes its folder.');
    return (await stat(actual)).isFile() ? actual : null;
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}
async function boundedRead(file: string, limit: number) {
  if ((await stat(file)).size > limit) throw new Error('File exceeds 32 MiB.');
  const bytes = await readFile(file);
  if (bytes.length > limit) throw new Error('File exceeds 32 MiB.');
  return bytes;
}

export async function scanLegacyTextures(source: string, onlyObject?: string) {
  const root = await realpath(source), textures: Texture[] = [], issues: Issue[] = [];
  const files = (await readdir(root)).filter(name => /\.obj$/i.test(name)).sort();
  let objects = 0;
  for (const obj of files) {
    const object = obj.slice(0, -4);
    if (onlyObject && object !== onlyObject) continue;
    objects++;
    try {
      safeName(object);
      const objPath = await confinedFile(root, obj);
      if (!objPath) throw new Error('OBJ file missing.');
      const libraries = inspectObjLibraries((await boundedRead(objPath, MAX_OBJ_BYTES)).toString('utf8'), obj);
      if (!libraries.length) issues.push({ object, file: obj, message: 'No MTL reference declared.' });
      const seen = new Set<string>();
      for (const library of libraries) {
        try {
          const mtl = await confinedFile(root, library.relativePath);
          if (!mtl) throw new Error('Referenced MTL missing; texture names cannot be established.');
          const parsed = inspectObjMaterial((await boundedRead(mtl, MAX_OBJ_BYTES)).toString('utf8'), library.relativePath);
          for (const dependency of parsed.requirements) {
            if (seen.has(dependency.relativePath.toLowerCase())) continue;
            seen.add(dependency.relativePath.toLowerCase());
            const fileName = safeName(dependency.fileName);
            const texture: Texture = { object, material: library.relativePath, reference: dependency.relativePath,
              fileName, url: legacyTextureUrl(object, fileName), status: 'missing-local' };
            textures.push(texture);
            const local = await confinedFile(root, dependency.relativePath);
            if (local) {
              const bytes = await boundedRead(local, MAX_IMAGE);
              texture.status = isTextureImage(bytes, fileName) ? 'present-local' : 'invalid-local';
              texture.bytes = bytes.length; texture.sha256 = digest(bytes);
            }
          }
        } catch (error) { issues.push({ object, file: library.relativePath, message: message(error) }); }
      }
    } catch (error) { issues.push({ object, file: obj, message: message(error) }); }
  }
  if (!objects) throw new Error('No matching local OBJ files found.');
  return { source: root, objects, textures, issues };
}

export async function fetchLegacyTexture(url: string, fileName: string, fetcher: typeof fetch = fetch) {
  const parsed = new URL(url);
  if (!url.startsWith(BASE) || parsed.origin !== new URL(BASE).origin || parsed.search || parsed.hash) throw new Error('Only the fixed legacy objects host is permitted.');
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
  if (Number(response.headers.get('content-length')) > MAX_IMAGE) { await response.body?.cancel(); throw new Error('Download exceeds 32 MiB.'); }
  if (!response.body) throw new Error('Empty response body.');
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMAGE) throw new Error('Download exceeds 32 MiB.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  if (!isTextureImage(bytes, fileName)) throw new Error('Response does not have the expected image signature (possibly an HTML error page).');
  return bytes;
}

export async function recoverLegacyTextures(textures: Texture[], output: string, fetcher: typeof fetch = fetch) {
  await mkdir(output, { recursive: true });
  const root = await realpath(output);
  // Sequential requests keep load/memory bounded; each object's URL is checked independently.
  for (const texture of textures) {
    if (texture.status !== 'missing-local' && texture.status !== 'invalid-local') continue;
    try {
      const bytes = await fetchLegacyTexture(texture.url, texture.fileName, fetcher);
      texture.bytes = bytes.length; texture.sha256 = digest(bytes);
      const target = path.join(root, safeName(texture.fileName));
      // Resolve filenames case-insensitively on every OS; two object directories may have conflicting names.
      const names = (await readdir(root)).filter(name => name.toLowerCase() === texture.fileName.toLowerCase());
      if (names.length > 1) throw new Error('Multiple existing output filenames differ only by case; manual review required.');
      if (names.length) {
        const existing = await confinedFile(root, names[0]);
        if (!existing) throw new Error('Output filename is occupied by a directory.');
        const previous = await boundedRead(existing, MAX_IMAGE);
        if (digest(previous) !== digest(bytes)) {
          const alias = safeName(`${texture.object.slice(0,60)}--${digest(bytes).slice(0,16)}--${texture.fileName.slice(-140)}`);
          const existingAlias = await confinedFile(root, alias);
          if (existingAlias) {
            if (digest(await boundedRead(existingAlias, MAX_IMAGE)) !== digest(bytes)) throw new Error('Conflicting recovery alias already exists; preserved it.');
          } else await writeFile(path.join(root, alias), bytes, { flag: 'wx' });
          texture.status = 'downloaded-renamed'; texture.outputFile = path.join(root, alias);
          texture.message = 'Original filename has different bytes; saved a distinct object/hash-prefixed filename in the same directory. Review attachment mapping.';
          continue;
        }
        texture.status = 'already-downloaded';
        texture.outputFile = path.join(root, names[0]);
      } else {
        await writeFile(target, bytes, { flag: 'wx' });
        texture.status = 'downloaded';
        texture.outputFile = target;
      }
      texture.bytes = bytes.length; texture.sha256 = digest(bytes);
    } catch (error) { texture.status = 'download-failed'; texture.message = message(error); }
  }
}

async function main() {
  const args = process.argv.slice(2), options = new Map<string, string>();
  let download = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--download') { download = true; continue; }
    if (args[i] === '--help') { console.log('node --experimental-strip-types src/libraries/scripts/download-legacy-obj-textures.ts [--download] [--object stove] [--source reference/home-design/objects] [--out reference/downloads/legacy-textures]'); return; }
    if (!['--object', '--source', '--out'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--')) throw new Error(`Unknown or incomplete option: ${args[i]}`);
    if (options.has(args[i])) throw new Error(`Repeated option: ${args[i]}`);
    options.set(args[i], args[++i]);
  }
  const source = path.resolve(options.get('--source') ?? 'reference/home-design/objects');
  const output = path.resolve(options.get('--out') ?? 'reference/downloads/legacy-textures');
  await mkdir(output, { recursive: true });
  const sourceReal = await realpath(source), outputReal = await realpath(output);
  const relative = path.relative(sourceReal, outputReal);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Output must be outside the original objects folder.');
  const report = await scanLegacyTextures(source, options.get('--object'));
  if (download) await recoverLegacyTextures(report.textures, output);
  const totals: Record<string, number> = {};
  for (const texture of report.textures) totals[texture.status] = (totals[texture.status] ?? 0) + 1;
  const reportPath = path.join(output, `texture-report-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify({ createdAt: new Date().toISOString(), mode: download ? 'download' : 'audit-only', scope: 'local legacy OBJ/MTL bundles; not current database attachments', ...report, totals }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ objects: report.objects, totals, issues: report.issues.length, report: reportPath }, null, 2));
  if (download && (report.issues.length || report.textures.some(t => ['download-failed', 'downloaded-renamed'].includes(t.status)))) process.exitCode = 2;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(message(error)); process.exitCode = 1; });
