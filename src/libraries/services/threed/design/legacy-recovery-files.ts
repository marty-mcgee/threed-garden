import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseDesignImport } from './design-import';
import { parseProjectArchitecture } from './project-architecture';
import { prepareLegacyRecoveryGeometry, reconstructLegacyOpenings } from './legacy-recovery-geometry';
import { inspectObjGeometry, inspectObjMaterial, MAX_OBJ_BYTES, resolveObjPath } from '../models/model-obj-core';
import { getBulkLocalImagePixelCount } from '../models/model-image-limits-core';
import type { LegacyRecoveryAsset, LegacyRecoveryFile, LegacyRecoveryPackage } from './legacy-recovery-contract';

const MAX_PACKAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function legacyRecoveryFingerprint(value: Omit<LegacyRecoveryPackage, 'fingerprint'>): string {
  return sha256(canonical(value));
}
function inside(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
async function resolveProspectivePath(target: string): Promise<string> {
  let ancestor = target;
  const missing: string[] = [];
  for (;;) {
    try { return path.join(await realpath(ancestor), ...missing); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.unshift(path.basename(ancestor));
      ancestor = parent;
    }
  }
}
function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function only(value: Record<string, unknown>, keys: string[], label: string) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error(`Unsupported ${label} fields.`);
}
function text(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
}
function list(value: unknown, max: number, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${label} list.`);
  return value;
}
const digest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function vector(value: unknown, bound: number, label: string) {
  const item = record(value, label); only(item, ['x', 'y', 'z'], label);
  if (!['x', 'y', 'z'].every(axis => typeof item[axis] === 'number' && Number.isFinite(item[axis]) && Math.abs(item[axis] as number) <= bound)) throw new Error(`Invalid ${label}.`);
}

/** An artifact is input data, never authorization to select a user or overwrite a Project. */
export function validateLegacyRecoveryPackage(value: unknown): LegacyRecoveryPackage {
  const pkg = record(value, 'Recovery package');
  only(pkg, ['format', 'version', 'fingerprint', 'sourcePlanSha256', 'architecture', 'assets', 'placements', 'warnings'], 'recovery package');
  if (pkg.format !== 'threed-legacy-recovery' || pkg.version !== 1 || !digest(pkg.fingerprint) || !digest(pkg.sourcePlanSha256)) throw new Error('Unsupported recovery package.');
  if (Buffer.byteLength(JSON.stringify(pkg)) > MAX_PACKAGE_BYTES) throw new Error('Recovery package exceeds 4 MiB.');
  const { fingerprint, ...content } = pkg;
  if (fingerprint !== legacyRecoveryFingerprint(content as Omit<LegacyRecoveryPackage, 'fingerprint'>)) throw new Error('Recovery package fingerprint changed; prepare a new bundle.');
  const architecture = parseProjectArchitecture({ version: 1, document: pkg.architecture }).document;
  const levels = new Set(architecture.levels.map(level => level.id));
  const assets = list(pkg.assets, 500, 'assets'), keys = new Set<string>(), paths = new Set<string>();
  let total = 0;
  for (const value of assets) {
    const asset = record(value, 'asset'); only(asset, ['key', 'legacyName', 'modelName', 'files', 'attribution', 'scale'], 'asset');
    const key = text(asset.key, 100, 'asset key');
    if (!/^[a-zA-Z0-9_-]+$/.test(key) || keys.has(key)) throw new Error('Invalid or duplicate recovery asset key.');
    keys.add(key); text(asset.legacyName, 100, 'legacy name'); text(asset.modelName, 120, 'Model name');
    if (!Array.isArray(asset.scale) || asset.scale.length !== 3 || !asset.scale.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) >= .0001 && Math.abs(n) <= 10000) || asset.scale[1] <= 0) throw new Error('Invalid prepared asset scale.');
    const attribution = record(asset.attribution, 'attribution'); only(attribution, ['author', 'license'], 'attribution');
    text(attribution.author, 1000, 'author'); text(attribution.license, 1000, 'license');
    let primary = 0, bytes = 0;
    for (const entry of list(asset.files, 500, 'files')) {
      const file = record(entry, 'file'); only(file, ['path', 'sha256', 'bytes', 'role'], 'file');
      const filename = text(file.path, 356, 'file path');
      if (resolveObjPath(filename) !== filename || !filename.startsWith(key + '/') || paths.has(filename.toLowerCase()) || !digest(file.sha256)) throw new Error('Invalid or duplicate staged file path/hash.');
      paths.add(filename.toLowerCase());
      if (typeof file.bytes !== 'number' || !Number.isSafeInteger(file.bytes) || file.bytes < 1 || file.bytes > MAX_OBJ_BYTES) throw new Error('Invalid staged file size.');
      bytes += file.bytes;
      if (file.role === 'model' && /^.+\/[^/]+\.obj$/i.test(filename) && path.posix.dirname(filename) === key) primary++;
      else if (file.role === 'other' && /\.mtl$/i.test(filename)) { /* declared MTL companion */ }
      else if (file.role === 'texture' && /\.(png|jpe?g|webp|bmp)$/i.test(filename)) { /* declared image */ }
      else throw new Error('Unsupported staged file role or extension.');
    }
    if (primary !== 1 || bytes > MAX_OBJ_BYTES) throw new Error('Each recovery asset requires one OBJ and at most 32 MiB of files.');
    total += bytes;
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('Recovery files exceed 256 MiB.');
  const ids = new Set<string>();
  for (const value of list(pkg.placements, 1000, 'placements')) {
    const item = record(value, 'placement'); only(item, ['legacyId', 'variantKey', 'name', 'position', 'rotation', 'levelId'], 'placement');
    const id = text(item.legacyId, 100, 'legacy placement ID');
    if (ids.has(id) || !keys.has(String(item.variantKey)) || !levels.has(String(item.levelId))) throw new Error('Invalid placement identity, asset or level.');
    ids.add(id); text(item.name, 120, 'placement name'); vector(item.position, 1_000_000, 'position'); vector(item.rotation, 10_000, 'rotation');
  }
  for (const warning of list(pkg.warnings, 5000, 'warnings')) text(warning, 4000, 'warning');
  return value as LegacyRecoveryPackage;
}

async function boundedRead(filename: string, limit: number): Promise<Buffer> {
  const details = await stat(filename);
  if (!details.isFile() || details.size < 1 || details.size > limit) throw new Error(`Invalid file size: ${path.basename(filename)}.`);
  const bytes = await readFile(filename);
  if (bytes.length !== details.size || bytes.length > limit) throw new Error(`File changed while reading: ${path.basename(filename)}.`);
  return bytes;
}
async function containedRead(root: string, relative: string, limit = MAX_OBJ_BYTES): Promise<Buffer> {
  if (resolveObjPath(relative) !== relative) throw new Error('Non-canonical local asset path.');
  const actual = await realpath(path.join(root, relative));
  if (!inside(root, actual)) throw new Error(`Asset escapes its source folder: ${relative}.`);
  return boundedRead(actual, limit);
}
function imagePixels(filename: string, bytes: Uint8Array) {
  const mime = ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.bmp': 'image/bmp' } as Record<string, string>)[path.extname(filename).toLowerCase()];
  return getBulkLocalImagePixelCount(bytes, mime);
}

function inspectBundle(primary: string, files: Map<string, Buffer>) {
  const obj = inspectObjGeometry(files.get(primary)!.toString('utf8'), primary), materials = new Set<string>();
  let pixels = 0;
  for (const required of obj.requirements) {
    const bytes = files.get(required.relativePath);
    if (!bytes) throw new Error(`Missing staged material library: ${required.relativePath}.`);
    const material = inspectObjMaterial(bytes.toString('utf8'), required.relativePath);
    for (const name of material.names) {
      if (materials.has(name)) throw new Error(`Ambiguous material: ${name}.`);
      materials.add(name);
    }
    for (const texture of material.requirements) if (!files.has(texture.relativePath)) throw new Error(`Missing staged texture: ${texture.relativePath}.`);
  }
  if (obj.usedMaterials.some(name => !materials.has(name))) throw new Error('An OBJ uses undeclared material definitions.');
  for (const [filename, bytes] of files) if (/\.(png|jpe?g|webp|bmp)$/i.test(filename)) pixels += imagePixels(filename, bytes);
  if (pixels > 32 * 1024 * 1024) throw new Error('Recovery Model textures exceed 32 Mi pixels.');
}

export async function prepareLegacyRecovery(options: { source: string; plan: string; out: string; openings: 'native' | 'report' }): Promise<LegacyRecoveryPackage> {
  const source = await realpath(options.source), sourceObjects = await realpath(path.join(source, 'objects'));
  const planPath = await realpath(options.plan), sourceText = (await boundedRead(planPath, 1_048_576)).toString('utf8');
  if (!inside(source, sourceObjects)) throw new Error('Objects directory must remain inside the supplied source.');
  const parsed = parseDesignImport(sourceText, path.basename(planPath));
  if (parsed.source !== 'legacy') throw new Error('This recovery command expects a legacy Paper.js plan. Use ordinary Import JSON for native Design files.');
  const plan = JSON.parse(sourceText) as unknown;
  const catalog = record(JSON.parse((await containedRead(source, 'api/objects.json', 2 * 1024 * 1024)).toString('utf8')), 'catalog');
  const prepared = await prepareLegacyRecoveryGeometry(plan, catalog, async name => (await containedRead(sourceObjects, name + '.obj')).toString('utf8'));
  const openings = reconstructLegacyOpenings(parsed.document, plan, catalog, prepared);
  const warnings = parsed.warnings.filter(warning => !warning.includes('catalog objects are not imported'));
  warnings.push(...prepared.warnings);
  let placements = prepared.placements.map(item => ({ ...item, levelId: `legacy-level-${item.levelId}` }));
  let architecture = parsed.document;
  if (options.openings === 'native') {
    architecture = openings.document;
    const converted = new Set(openings.convertedLegacyIds);
    placements = placements.filter(item => !converted.has(item.legacyId));
    warnings.push(...openings.warnings, `${converted.size} catalog opening models are replaced by editable native openings with native frames/appearance. Other placed Models retain the legacy assets.`);
  } else {
    warnings.push('Catalog models are preserved. Legacy boolean cutouts are not applied in report mode; walls, floors and roofs can cover doors/windows/skylights. Use --openings native to replace only provably compatible catalog openings with editable native openings, or reconstruct them in Design.');
    warnings.push(...openings.warnings, `${openings.convertedLegacyIds.length} compatible native opening replacements are available with --openings native.`);
  }
  const used = new Set(placements.map(item => item.variantKey));
  const outputFiles = new Map<string, Buffer>(), assets: LegacyRecoveryAsset[] = [];
  let outputBytes = 0;
  for (const variant of prepared.variants.filter(item => used.has(item.key))) {
    const primary = variant.name + '.obj';
    const files = new Map<string, Buffer>([[primary, Buffer.from(variant.objText)]]);
    const geometry = inspectObjGeometry(variant.objText, primary);
    for (const required of geometry.requirements) {
      let bytes: Buffer;
      try { bytes = await containedRead(sourceObjects, required.relativePath); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || geometry.requirements.length !== 1) throw error;
        const fallback = variant.name + '.mtl';
        bytes = await containedRead(sourceObjects, fallback);
        const names = inspectObjMaterial(bytes.toString('utf8'), required.relativePath).names;
        if (geometry.usedMaterials.some(name => !names.includes(name))) throw new Error(`${fallback} does not define every referenced material; no substitution made.`);
        warnings.push(`${variant.name}: staged ${fallback} under the OBJ-declared name ${required.relativePath}, matching the legacy explicit material loader. Source files are unchanged.`);
      }
      files.set(required.relativePath, bytes);
      for (const texture of inspectObjMaterial(bytes.toString('utf8'), required.relativePath).requirements) {
        if (!files.has(texture.relativePath)) files.set(texture.relativePath, await containedRead(sourceObjects, texture.relativePath));
      }
    }
    inspectBundle(primary, files);
    const entries: LegacyRecoveryFile[] = [...files].map(([filename, bytes]) => {
      const relative = `${variant.key}/${filename}`;
      outputBytes += bytes.length;
      if (outputBytes > MAX_TOTAL_BYTES) throw new Error('Recovery files exceed 256 MiB.');
      outputFiles.set(relative, bytes);
      return { path: relative, bytes: bytes.length, sha256: sha256(bytes), role: filename === primary ? 'model' : /\.mtl$/i.test(filename) ? 'other' : 'texture' };
    });
    const metadata = record(catalog[variant.name], 'catalog item');
    const attribution = { author: typeof metadata.author === 'string' && metadata.author.trim() ? metadata.author : 'Not recorded in legacy catalog', license: typeof metadata.license === 'string' && metadata.license.trim() ? metadata.license : 'Not recorded in legacy catalog' };
    if (attribution.license === 'Not recorded in legacy catalog') warnings.push(`${variant.name}: license was not recorded; review source rights before applying.`);
    assets.push({ key: variant.key, legacyName: variant.name, modelName: variant.name.replace(/([a-z])([A-Z])/g, '$1 $2').slice(0, 120), files: entries, attribution, scale: variant.scale });
  }
  const content: Omit<LegacyRecoveryPackage, 'fingerprint'> = { format: 'threed-legacy-recovery', version: 1, sourcePlanSha256: sha256(sourceText), architecture, assets, placements, warnings: [...new Set(warnings)] };
  const pkg = validateLegacyRecoveryPackage({ ...content, fingerprint: legacyRecoveryFingerprint(content) });
  const output = path.resolve(options.out);
  if (inside(source, output) || inside(output, source) || inside(output, planPath)) throw new Error('Choose a new output folder outside the original source and plan.');
  const prospectiveOutput = await resolveProspectivePath(output);
  if (inside(source, prospectiveOutput) || inside(prospectiveOutput, source) || inside(prospectiveOutput, planPath)) throw new Error('Output resolves into the source; choose another folder.');
  await mkdir(path.dirname(output), { recursive: true });
  const parent = await realpath(path.dirname(output)), actualOutput = path.join(parent, path.basename(output));
  if (inside(source, actualOutput) || inside(actualOutput, source) || inside(actualOutput, planPath)) throw new Error('Output resolves into the source; choose another folder.');
  await mkdir(actualOutput); // Never overwrite an existing preparation or journal.
  for (const [relative, bytes] of outputFiles) {
    const filename = path.join(actualOutput, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, bytes, { flag: 'wx' });
  }
  await writeFile(path.join(actualOutput, 'source-plan.json'), sourceText, { flag: 'wx' });
  await writeFile(path.join(actualOutput, 'architecture.json'), JSON.stringify(architecture, null, 2) + '\n', { flag: 'wx' });
  await writeFile(path.join(actualOutput, 'review.txt'), [
    'ThreeD legacy recovery preparation (offline; no assets uploaded)',
    `Fingerprint: ${pkg.fingerprint}`,
    `${assets.length} prepared Model variants; ${placements.length} placements; ${architecture.walls.length} walls; ${architecture.floors.length} floors; ${architecture.roofs.length} roofs; ${architecture.openings.length + architecture.roofOpenings.length} native openings.`,
    'Apply creates a NEW private Project. Existing Projects and Model primaries are not replaced.',
    'Openings policy: ' + options.openings, '', 'Review before applying:', ...pkg.warnings.map(value => '- ' + value), '',
  ].join('\n'), { flag: 'wx' });
  // Write the runnable manifest last. A partially prepared directory is not an importable package.
  await writeFile(path.join(actualOutput, 'recovery.json'), JSON.stringify(pkg, null, 2) + '\n', { flag: 'wx' });
  return pkg;
}

/** Verify all bytes/dependencies before importing any database or storage client. */
export async function verifyLegacyRecoveryPackage(rootPath: string): Promise<LegacyRecoveryPackage> {
  const root = await realpath(rootPath);
  const pkg = validateLegacyRecoveryPackage(JSON.parse((await containedRead(root, 'recovery.json', MAX_PACKAGE_BYTES)).toString('utf8')));
  if (sha256(await containedRead(root, 'source-plan.json', 1_048_576)) !== pkg.sourcePlanSha256) throw new Error('The retained source plan changed.');
  for (const asset of pkg.assets) {
    const files = new Map<string, Buffer>();
    for (const file of asset.files) {
      const bytes = await containedRead(root, file.path);
      if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Prepared file changed: ${file.path}. Prepare a new bundle.`);
      files.set(file.path.slice(asset.key.length + 1), bytes);
    }
    inspectBundle(path.posix.basename(asset.files.find(file => file.role === 'model')!.path), files);
  }
  return pkg;
}
