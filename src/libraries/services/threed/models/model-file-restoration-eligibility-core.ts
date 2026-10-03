import { createHash } from 'node:crypto';
import { BlobNotFoundError } from '@vercel/blob';
// @ts-expect-error Native validation uses explicit TypeScript extensions.
import { readableBlobFileName } from './model-blob-paths.ts';
// @ts-expect-error Native validation uses explicit TypeScript extensions.
import { normalizeThreeDModelRelativePath } from './model-companion-core.ts';
// @ts-expect-error Native validation uses explicit TypeScript extensions.
import { inspectThreeDGltfBundle } from './model-gltf-bundle-core.ts';
// @ts-expect-error Native validation uses explicit TypeScript extensions.
import { inspectObjGeometry, inspectObjMaterial } from './model-obj-core.ts';

export type EligibilityRecord = Record<string, unknown>;
export interface EligibilitySnapshot {
  model: EligibilityRecord;
  file: EligibilityRecord;
  files: EligibilityRecord[];
  references: {
    files: EligibilityRecord[]; textures: EligibilityRecord[]; models: EligibilityRecord[];
    markers: EligibilityRecord[]; projectAssets: EligibilityRecord[]; projects: EligibilityRecord[];
  };
}
export interface EligibilityFinding { code: string; message: string }
export type EligibilityCheckState = 'clear' | 'blocked' | 'unknown' | 'not_checked';
export type EligibilityAvailability = 'missing' | 'present' | 'unknown';
export type EligibilityConsistency = 'unchanged' | 'stale' | 'unknown' | 'not_checked';
export interface EligibilityResult {
  modelId: number; fileId: number; observedAt: string; revision: string | null;
  state: 'observed_candidate' | 'blocked' | 'unknown' | 'stale';
  availability: EligibilityAvailability;
  checks: {
    target: EligibilityCheckState; references: EligibilityCheckState; storage: EligibilityCheckState;
    dependencies: EligibilityCheckState; consistency: EligibilityConsistency;
  };
  blockers: EligibilityFinding[]; uncertainty: EligibilityFinding[];
  restoreAllowed: false; candidateValidation: 'not_performed';
}
export interface EligibilityContext { userId: string; modelId: number; fileId: number; storeId: string }
export interface SnapshotAssessment {
  target: EligibilityCheckState; references: EligibilityCheckState;
  blockers: EligibilityFinding[]; uncertainty: EligibilityFinding[];
  ownedUrl: string | null; dependencySources: EligibilityRecord[]; attachments: EligibilityRecord[];
}
export interface DependencyAssessment {
  status: EligibilityCheckState; blockers: EligibilityFinding[]; uncertainty: EligibilityFinding[];
  materials: EligibilityRecord[];
}
export const ELIGIBILITY_LIMITS = {
  tableRecords: 5_000, jsonBytes: 16 * 1024 * 1024, jsonDepth: 32, jsonNodes: 50_000,
  declarationBytes: 32 * 1024 * 1024, materialBytes: 5 * 1024 * 1024,
  externalMs: 15_000, callMs: 5_000,
} as const;

export class EligibilityInspectionError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'EligibilityInspectionError'; }
}
const reason = (code: string, message: string): EligibilityFinding => ({ code, message });
const unique = (findings: EligibilityFinding[]) => [...new Map(findings.map(value => [value.code, value])).values()];
const text = (value: unknown) => typeof value === 'string' ? value : '';
const positiveId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Plain JSON only; limits apply to keys as well as values, including unknown versions. */
function walkJson(value: unknown, visit: (value: string, key: string) => void, shared = { nodes: 0 }, depth = 0, key = '', ancestors = new Set<object>()) {
  if (++shared.nodes > ELIGIBILITY_LIMITS.jsonNodes || depth > ELIGIBILITY_LIMITS.jsonDepth) {
    throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The complete reference inspection exceeds its bounds.');
  }
  if (typeof value === 'string') { visit(value, key); return; }
  if (value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object' || value instanceof Date || ancestors.has(value)) {
    throw new EligibilityInspectionError('REFERENCE_REPRESENTATION_UNKNOWN', 'A reference representation cannot be inspected completely.');
  }
  ancestors.add(value);
  if (Array.isArray(value)) value.forEach(item => walkJson(item, visit, shared, depth + 1, key, ancestors));
  else for (const [childKey, child] of Object.entries(value)) {
    visit(childKey, childKey);
    walkJson(child, visit, shared, depth + 1, childKey, ancestors);
  }
  ancestors.delete(value);
}
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new EligibilityInspectionError('REFERENCE_REPRESENTATION_UNKNOWN', 'A reference representation cannot be inspected completely.');
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as EligibilityRecord)[key])}`).join(',')}}`;
}
function ordered(records: EligibilityRecord[]) { return [...records].sort((a, b) => Number(a.id) - Number(b.id)); }
export function validateSnapshotBounds(snapshot: EligibilitySnapshot): void {
  let bytes = 0;
  const shared = { nodes: 0 };
  for (const records of Object.values(snapshot.references)) {
    if (!Array.isArray(records) || records.length > ELIGIBILITY_LIMITS.tableRecords) {
      throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The complete reference inspection exceeds its bounds.');
    }
    for (const record of records) {
      walkJson(record, () => {}, shared);
      bytes += new TextEncoder().encode(canonical(record)).byteLength;
      if (bytes > ELIGIBILITY_LIMITS.jsonBytes) throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The complete reference inspection exceeds its bounds.');
    }
  }
  walkJson(snapshot.model, () => {}); walkJson(snapshot.file, () => {});
  if (!Array.isArray(snapshot.files) || snapshot.files.length > ELIGIBILITY_LIMITS.tableRecords) {
    throw new EligibilityInspectionError('REFERENCE_BOUNDS_EXCEEDED', 'The selected Model inventory exceeds its bounds.');
  }
}
export function fingerprintOwnedSource(snapshot: EligibilitySnapshot): string {
  for (const record of [snapshot.model, snapshot.file, ...snapshot.files]) walkJson(record, () => {});
  return createHash('sha256').update(canonical({ model: snapshot.model, file: snapshot.file, files: ordered(snapshot.files) })).digest('hex');
}
export function fingerprintGlobalReferences(snapshot: EligibilitySnapshot): string {
  const shared = { nodes: 0 };
  for (const rows of Object.values(snapshot.references)) for (const record of rows) walkJson(record, () => {}, shared);
  return createHash('sha256').update(canonical(Object.fromEntries(Object.entries(snapshot.references).map(([key, rows]) => [key, ordered(rows)])))).digest('hex');
}

/** Reference identity ignores query/hash aliases, but never ignores decoded path identity. */
export function canonicalBlobIdentity(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const normalized = value.trim().replaceAll('\\', '/');
    const url = new URL(normalized.startsWith('//') ? `https:${normalized}` : normalized);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.blob.vercel-storage.com')) return null;
    const path = decodeURIComponent(url.pathname);
    if (path.includes('%') || /[\\\u0000-\u001f\u007f]/.test(path)) return null;
    return `${url.hostname.toLowerCase()}${path}`;
  } catch { return null; }
}
function referenceMatch(value: string, identity: string): boolean {
  const variants = [value];
  if (/%[0-9a-f]{2}/i.test(value)) { try { variants.push(decodeURIComponent(value)); } catch { /* Unsupported encoding stays observable below. */ } }
  return variants.some(variant => canonicalBlobIdentity(variant) === identity ||
    [...variant.replaceAll('\\', '/').matchAll(/(?:https?:)?\/\/[^\s"'<>]+/gi)]
      .some(match => canonicalBlobIdentity(match[0].replace(/[),;]+$/, '')) === identity));
}
function strictPublicUrl(value: unknown, host: string): URL | null {
  try {
    if (typeof value !== 'string' || value !== value.trim() || value.length > 500 || /[\\?#\u0000-\u0020\u007f]/.test(value)) return null;
    // URL parsing removes empty query/hash/userinfo and default ports; reject their raw spelling too.
    const authority = /^https:\/\/([^/]+)\//i.exec(value)?.[1];
    if (!authority || authority.includes('@') || authority.includes(':') || authority.toLowerCase() !== host) return null;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port || url.search || url.hash) return null;
    const path = decodeURIComponent(url.pathname);
    if (/%|[\\\u0000-\u001f\u007f]/.test(path) || path.split('/').slice(1).some(part => !part || part === '.' || part === '..')) return null;
    return url;
  } catch { return null; }
}
export function isOwnedRestorationAttachmentUrl(value: unknown, primaryUrl: unknown, context: EligibilityContext): boolean {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(context.userId) || !/^[a-zA-Z0-9]{1,100}$/.test(context.storeId)) return false;
  const host = `${context.storeId.toLowerCase()}.public.blob.vercel-storage.com`;
  const url = strictPublicUrl(value, host);
  if (!url) return false;
  const path = decodeURIComponent(url.pathname).slice(1);
  const prefix = `threed/users/${context.userId}/models/`;
  const fallback = `${prefix}model-${context.modelId}/attachments/`;
  const primary = strictPublicUrl(primaryUrl, host);
  const primaryPath = primary ? decodeURIComponent(primary.pathname).slice(1) : '';
  const folder = primaryPath.startsWith(prefix) ? primaryPath.slice(prefix.length).split('/')[0] : '';
  const assetRoot = /^[a-zA-Z0-9_-]{1,32}--[0-9a-f-]{36}$/i.test(folder) && UUID.test(folder.slice(-36))
    && primaryPath.startsWith(`${prefix}${folder}/primary/`) ? `${prefix}${folder}/attachments/` : '';
  const root = path.startsWith(fallback) ? fallback : assetRoot && path.startsWith(assetRoot) ? assetRoot : '';
  if (!root) return false;
  const parts = path.slice(root.length).split('/');
  return parts.length >= 2 && UUID.test(parts.at(-2)!)
    && /^[a-zA-Z0-9_-]+(?:\.[a-z0-9]{1,10})?$/.test(parts.at(-1)!)
    && parts.slice(0, -2).every(part => /^[a-zA-Z0-9_-]+$/.test(part));
}
/** Fixed-host, owner-scoped declaration reads; callers must separately bind the saved File to its Model. */
export function isOwnedRestorationSourceUrl(value: unknown, context: EligibilityContext): boolean {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(context.userId) || !/^[a-zA-Z0-9]{1,100}$/.test(context.storeId)) return false;
  const url = strictPublicUrl(value, `${context.storeId.toLowerCase()}.public.blob.vercel-storage.com`);
  if (!url) return false;
  const path = decodeURIComponent(url.pathname).slice(1), prefix = `threed/users/${context.userId}/models/`;
  if (!path.startsWith(prefix)) return false;
  const parts = path.slice(prefix.length).split('/'), folder = parts.shift()!;
  const asset = /^[a-zA-Z0-9_-]{1,32}--[0-9a-f-]{36}$/i.test(folder) && UUID.test(folder.slice(-36));
  if (!asset && folder !== `model-${context.modelId}`) return false;
  if (asset && parts[0] === 'primary' && parts.length === 2) return /^[a-zA-Z0-9_-]+\.(?:glb|gltf|obj)$/i.test(parts[1]);
  return parts[0] === 'attachments' && parts.length >= 3 && UUID.test(parts.at(-2)!)
    && /^[a-zA-Z0-9_-]+(?:\.[a-z0-9]{1,10})?$/.test(parts.at(-1)!)
    && parts.slice(1, -2).every(part => /^[a-zA-Z0-9_-]+$/.test(part));
}
function logicalPath(file: EligibilityRecord): string | null {
  return normalizeThreeDModelRelativePath(text(file.relativePath) || text(file.fileName));
}
function resolveAttachment(path: string, attachments: EligibilityRecord[]): EligibilityRecord | null {
  const normalized = normalizeThreeDModelRelativePath(path)?.toLowerCase();
  if (!normalized) return null;
  const usable = attachments.filter(file => file.fileType !== 'model' && file.fileType !== 'animation' && /^https:\/\//i.test(text(file.filePath)));
  const exact = usable.filter(file => {
    const candidate = logicalPath(file)?.toLowerCase();
    return candidate && (normalized === candidate || normalized.endsWith(`/${candidate}`));
  });
  if (exact.length > 1) throw new EligibilityInspectionError('PATH_AMBIGUOUS', 'A dependency path has ambiguous saved attachments.');
  if (exact.length === 1) return exact[0];
  const filename = normalized.split('/').at(-1);
  const matches = usable.filter(file => text(file.fileName).toLowerCase() === filename || logicalPath(file)?.split('/').at(-1)?.toLowerCase() === filename);
  if (matches.length > 1) throw new EligibilityInspectionError('PATH_AMBIGUOUS', 'A dependency filename has ambiguous saved attachments.');
  return matches[0] ?? null;
}

export function inspectSnapshot(snapshot: EligibilitySnapshot, context: EligibilityContext): SnapshotAssessment {
  validateSnapshotBounds(snapshot);
  const { model, file, files, references } = snapshot;
  const blockers: EligibilityFinding[] = [], uncertainty: EligibilityFinding[] = [];
  const assessment: SnapshotAssessment = { target: 'clear', references: 'not_checked', blockers, uncertainty, ownedUrl: null, dependencySources: [], attachments: files };
  const blockTarget = (code: string, message: string) => { blockers.push(reason(code, message)); assessment.target = 'blocked'; };
  if (!positiveId(context.modelId) || !positiveId(context.fileId) || model.id !== context.modelId || model.userId !== context.userId || file.id !== context.fileId || file.userId !== context.userId || file.modelId !== context.modelId) {
    throw new EligibilityInspectionError('OWNED_CONTEXT_UNAVAILABLE', 'The selected owned Model and File are unavailable.');
  }
  if (file.fileType !== 'texture' || file.isBinaryBuffer === true || !/^[^/\\\u0000-\u001f\u007f]+\.(?:png|jpe?g|webp)$/i.test(text(file.fileName))) {
    blockTarget('TARGET_UNSUPPORTED', 'Only a saved supporting PNG, JPEG or WebP Texture File is considered.');
  }
  if (references.models.some(parent => parent.mainModelFileId === file.id)) blockTarget('PRIMARY_ATTACHMENT', 'A primary assignment excludes this File from supporting-image diagnostics.');
  const primary = files.find(entry => entry.id === model.mainModelFileId && entry.fileType === 'model' && entry.userId === context.userId && entry.modelId === context.modelId);
  if (!isOwnedRestorationAttachmentUrl(file.filePath, primary?.filePath, context)) blockTarget('STORAGE_IDENTITY_UNPROVED', 'The saved object is not a proved current Model-owned immutable attachment.');
  else {
    const physicalName = decodeURIComponent(new URL(text(file.filePath)).pathname).split('/').at(-1);
    if (physicalName !== readableBlobFileName(text(file.relativePath) || text(file.fileName))) blockTarget('TARGET_IDENTITY_UNCERTAIN', 'The saved object filename cannot be bound to the dependency identity.');
  }
  const path = logicalPath(file);
  if (!path || text(file.relativePath) && path.split('/').at(-1) !== file.fileName) blockTarget('TARGET_IDENTITY_UNCERTAIN', 'The saved filename and dependency path cannot be bound consistently.');
  if (assessment.target === 'blocked') return assessment;
  assessment.ownedUrl = text(file.filePath);
  const identity = canonicalBlobIdentity(file.filePath)!;
  if (files.some(entry => entry.modelId !== context.modelId || entry.userId !== context.userId)) {
    uncertainty.push(reason('LEGACY_ATTACHMENT_OWNERSHIP_UNKNOWN', 'A retained attachment lacks a proved owner and Model binding.'));
  }
  const filename = text(file.fileName).toLowerCase();
  const collisions = files.filter(entry => entry.id !== file.id && (logicalPath(entry)?.toLowerCase() === path!.toLowerCase()
    || text(entry.fileName).toLowerCase() === filename || logicalPath(entry)?.split('/').at(-1)?.toLowerCase() === filename));
  if (collisions.length) blockers.push(reason('PATH_AMBIGUOUS', 'The selected dependency path or filename has ambiguous saved attachments.'));
  const shared = { nodes: 0 };
  for (const [table, records] of Object.entries(references)) for (const record of records) {
    const checked = table === 'files' && record.id === file.id ? Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'filePath')) : record;
    walkJson(checked, value => {
      if (referenceMatch(value, identity)) blockers.push(reason(table === 'files' || table === 'textures' ? 'SHARED_REFERENCE' : 'DIRECT_REFERENCE',
        'A saved shared or direct reference excludes this object from restoration candidacy.'));
      else if (/blob\.vercel-storage\.com/i.test(value) && !canonicalBlobIdentity(value)
        && ![...value.matchAll(/(?:https?:)?\/\/[^\s"'<>]+/gi)].some(match => canonicalBlobIdentity(match[0]))) {
        uncertainty.push(reason('REFERENCE_REPRESENTATION_UNKNOWN', 'A managed storage reference cannot be inspected completely.'));
      }
    }, shared);
  }
  walkJson(model.metadata ?? null, (value, key) => {
    if (!['textureRelativePath', 'relativePath', 'sourceFile'].includes(key) || /^(?:https?|data|blob):/i.test(value)) return;
    if (normalizeThreeDModelRelativePath(value)?.split('/').at(-1)?.toLowerCase() !== filename) return;
    try { if (resolveAttachment(value, files)?.id !== file.id) blockers.push(reason('PATH_AMBIGUOUS', 'A material reference cannot resolve to the selected File unambiguously.')); }
    catch { blockers.push(reason('PATH_AMBIGUOUS', 'A material reference cannot resolve to the selected File unambiguously.')); }
  });
  assessment.dependencySources = files.filter(entry => entry.fileType === 'model' || /\.mtl$/i.test(text(entry.fileName)));
  if (model.modelType !== 'procedural' && !primary) uncertainty.push(reason('DEPENDENCY_SOURCE_UNAVAILABLE', 'The saved primary geometry is unavailable for complete dependency proof.'));
  walkJson(model.lodLevels ?? null, value => {
    if (!/\.(?:glb|gltf|fbx|obj|usdz)(?:[?#].*)?$/i.test(value) && !/^https?:/i.test(value)) return;
    if (!assessment.dependencySources.some(source => canonicalBlobIdentity(source.filePath) === canonicalBlobIdentity(value)
      && canonicalBlobIdentity(value) !== null || logicalPath(source)?.toLowerCase() === value.toLowerCase())) {
      uncertainty.push(reason('DEPENDENCY_SOURCE_UNAVAILABLE', 'A retained geometry declaration cannot be inspected through an authoritative File.'));
    }
  });
  assessment.blockers = unique(blockers); assessment.uncertainty = unique(uncertainty);
  assessment.references = uncertainty.length ? 'unknown' : blockers.length ? 'blocked' : 'clear';
  return assessment;
}

function gltfDocument(fileName: string, bytes: Uint8Array): unknown {
  if (/\.gltf$/i.test(fileName)) return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (bytes.length < 20) throw new Error('Invalid GLB');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = view.getUint32(12, true);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(16, true) !== 0x4e4f534a || length > bytes.length - 20) throw new Error('Invalid GLB');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(20, 20 + length)));
}
// Matches the repository's supported GLTF bundle subset; optional opaque extensions cannot prove absence.
const DIAGNOSTIC_GLTF_EXTENSIONS = new Set([
  'KHR_draco_mesh_compression', 'KHR_mesh_quantization', 'KHR_texture_transform',
  'KHR_materials_unlit', 'KHR_materials_clearcoat', 'KHR_materials_ior', 'KHR_materials_sheen',
  'KHR_materials_specular', 'KHR_materials_transmission', 'KHR_materials_iridescence',
  'KHR_materials_anisotropy', 'KHR_materials_volume', 'KHR_materials_emissive_strength',
  'KHR_materials_dispersion', 'KHR_lights_punctual', 'EXT_texture_webp', 'EXT_materials_bump',
]);
function validateDiagnosticExtensions(document: unknown): void {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('Invalid GLTF document');
  const root = document as EligibilityRecord;
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (root[key] !== undefined && (!Array.isArray(root[key]) || !(root[key] as unknown[]).every(value => typeof value === 'string' && DIAGNOSTIC_GLTF_EXTENSIONS.has(value)))) {
      throw new Error('Unsupported GLTF extension');
    }
  }
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    for (const [key, item] of Object.entries(value)) {
      if (key === 'extensions' && (!item || typeof item !== 'object' || Array.isArray(item)
        || Object.keys(item).some(extension => !DIAGNOSTIC_GLTF_EXTENSIONS.has(extension)))) throw new Error('Unsupported GLTF extension');
      visit(item);
    }
  };
  visit(document);
}
export function inspectDependencySource(source: EligibilityRecord, bytes: Uint8Array, attachments: EligibilityRecord[], targetUrl: string): DependencyAssessment {
  const blockers: EligibilityFinding[] = [], uncertainty: EligibilityFinding[] = [], materials: EligibilityRecord[] = [];
  const name = text(source.fileName), identity = canonicalBlobIdentity(targetUrl);
  if (!/\.(?:glb|gltf|obj|mtl)$/i.test(name)) return { status: 'unknown', blockers, materials, uncertainty: [reason('DEPENDENCY_UNSUPPORTED', 'This geometry format does not provide complete supported direct-reference proof.')] };
  if (/\.mtl$/i.test(name) && source.fileType !== 'other') return { status: 'unknown', blockers, materials, uncertainty: [reason('DEPENDENCY_UNSUPPORTED', 'A retained material library has an unsupported saved classification.')] };
  if (!bytes.length || bytes.length > (/\.mtl$/i.test(name) ? ELIGIBILITY_LIMITS.materialBytes : ELIGIBILITY_LIMITS.declarationBytes)) {
    return { status: 'unknown', blockers, materials, uncertainty: [reason('DEPENDENCY_BOUNDS_EXCEEDED', 'A dependency declaration exceeds its inspection bounds.')] };
  }
  try {
    let requirements: Array<{ kind: string; relativePath: string }>;
    if (/\.(?:glb|gltf)$/i.test(name)) {
      const document = gltfDocument(name, bytes);
      walkJson(document, value => {
        if (identity && referenceMatch(value, identity)) blockers.push(reason('DIRECT_REFERENCE', 'A saved geometry declaration uses the old object URL directly.'));
        else if (/^(?:https?|blob):|^\/\//i.test(value)) uncertainty.push(reason('DEPENDENCY_UNSUPPORTED', 'A direct external declaration is outside supported local dependency proof.'));
      });
      validateDiagnosticExtensions(document);
      requirements = inspectThreeDGltfBundle(name, bytes).requirements;
    } else {
      const contents = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (identity && referenceMatch(contents, identity)) blockers.push(reason('DIRECT_REFERENCE', 'A saved geometry or material declaration uses the old object URL directly.'));
      if (/\.obj$/i.test(name)) requirements = inspectObjGeometry(contents, name).requirements;
      else {
        const allowed = new Set(['newmtl', 'ka', 'kd', 'ks', 'ke', 'tf', 'ns', 'ni', 'd', 'tr', 'illum', 'map_kd', 'map_ks', 'map_ke', 'map_d', 'map_bump', 'bump', 'norm', 'disp']);
        for (const line of contents.replace(/^\uFEFF/, '').replace(/\\\r?\n/g, ' ').split(/\r?\n/)) {
          const command = line.trim().split(/\s/, 1)[0].toLowerCase();
          if (command && !command.startsWith('#') && !allowed.has(command)) throw new Error('Unsupported MTL declaration');
        }
        requirements = inspectObjMaterial(contents, text(source.relativePath) || name).requirements;
      }
    }
    for (const requirement of requirements) {
      const matched = resolveAttachment(requirement.relativePath, attachments);
      if (!matched) { uncertainty.push(reason('DEPENDENCY_UNRESOLVED', 'A saved resource declaration has no unambiguous attachment mapping.')); continue; }
      if (requirement.kind === 'material') {
        if (matched.fileType !== 'other' || !/\.mtl$/i.test(text(matched.fileName))) uncertainty.push(reason('DEPENDENCY_UNSUPPORTED', 'A material library does not have the supported saved classification.'));
        else materials.push(matched);
      } else if (requirement.kind === 'buffer' && (matched.fileType !== 'binary' || matched.isBinaryBuffer !== true)
        || requirement.kind === 'texture' && matched.fileType !== 'texture') {
        uncertainty.push(reason('DEPENDENCY_UNSUPPORTED', 'A dependency does not have the supported saved classification.'));
      }
    }
  } catch (error) {
    uncertainty.push(reason(error instanceof EligibilityInspectionError ? error.code : 'DEPENDENCY_UNSUPPORTED', 'A resource declaration could not be inspected completely within the supported subset.'));
  }
  return { status: uncertainty.length ? 'unknown' : blockers.length ? 'blocked' : 'clear', blockers: unique(blockers), uncertainty: unique(uncertainty), materials };
}

export interface InspectionDeadline { expiresAt: number; now: () => number }
export function createInspectionDeadline(now: () => number = () => performance.now()): InspectionDeadline {
  return { now, expiresAt: now() + ELIGIBILITY_LIMITS.externalMs };
}
export async function withInspectionDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, deadline: InspectionDeadline, perCallMs: number = ELIGIBILITY_LIMITS.callMs): Promise<T> {
  const startedAt = deadline.now(), callExpiresAt = Math.min(deadline.expiresAt, startedAt + perCallMs);
  const remaining = callExpiresAt - startedAt;
  if (remaining <= 0) throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([Promise.resolve().then(() => operation(controller.signal)), new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.')); }, remaining);
    })]);
    if (deadline.now() >= callExpiresAt) throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
    return result;
  } catch (error) {
    if (deadline.now() >= callExpiresAt) throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
    throw error;
  } finally { clearTimeout(timer); controller.abort(); }
}
export interface StorageObservation {
  availability: EligibilityAvailability; observedAt: string;
  blockers: EligibilityFinding[]; uncertainty: EligibilityFinding[];
}
export async function observeStorage(head: (url: string, options: { abortSignal: AbortSignal }) => Promise<unknown>, url: string, deadline: InspectionDeadline): Promise<StorageObservation> {
  const cutoff = Math.min(deadline.expiresAt, deadline.now() + ELIGIBILITY_LIMITS.callMs);
  try {
    const result = await withInspectionDeadline(signal => head(url, { abortSignal: signal }), deadline);
    const row = result && typeof result === 'object' ? result as EligibilityRecord : null;
    if (!row || canonicalBlobIdentity(row.url) !== canonicalBlobIdentity(url)
      || typeof row.pathname !== 'string' || row.pathname !== decodeURIComponent(new URL(url).pathname).slice(1)
      || typeof row.size !== 'number' || !Number.isSafeInteger(row.size) || row.size < 0
      || typeof row.contentType !== 'string' || !(row.uploadedAt instanceof Date) || !Number.isFinite(row.uploadedAt.getTime())) {
      throw new EligibilityInspectionError('STORAGE_RESPONSE_UNKNOWN', 'Storage returned an unexpected inspection response.');
    }
    if (deadline.now() >= cutoff) throw new EligibilityInspectionError('INSPECTION_TIMEOUT', 'The inspection deadline was exceeded.');
    return { availability: 'present', observedAt: new Date().toISOString(), blockers: [reason('STORAGE_PRESENT', 'The authenticated storage check found the saved object present.')], uncertainty: [] };
  } catch (error) {
    if (deadline.now() < cutoff && error instanceof BlobNotFoundError) return { availability: 'missing', observedAt: new Date().toISOString(), blockers: [], uncertainty: [] };
    const code = deadline.now() >= cutoff ? 'INSPECTION_TIMEOUT' : error instanceof EligibilityInspectionError ? error.code : 'STORAGE_UNAVAILABLE';
    return { availability: 'unknown', observedAt: new Date().toISOString(), blockers: [], uncertainty: [reason(code, 'Storage availability could not be confirmed.')] };
  }
}
export function resolveEligibilityState(checks: EligibilityResult['checks'], blockers: EligibilityFinding[], uncertainty: EligibilityFinding[]): EligibilityResult['state'] {
  if (checks.consistency === 'stale') return 'stale';
  if (checks.target === 'blocked' && checks.references === 'not_checked' && checks.storage === 'not_checked' && checks.dependencies === 'not_checked') return 'blocked';
  if (checks.consistency !== 'unchanged' || uncertainty.length || [checks.target, checks.references, checks.storage, checks.dependencies].some(state => state === 'unknown' || state === 'not_checked')) return 'unknown';
  return blockers.length || [checks.target, checks.references, checks.storage, checks.dependencies].some(state => state === 'blocked') ? 'blocked' : 'observed_candidate';
}
