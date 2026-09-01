export type ThreeDModelCompanionKind = 'buffer' | 'material' | 'texture';

export interface ThreeDModelCompanionRequirement {
  fileName: string;
  kind: ThreeDModelCompanionKind;
  relativePath: string;
  referencedBy: string;
}

export function normalizeThreeDModelRelativePath(reference: string): string | null {
  const cleaned = reference.trim().replaceAll('\\', '/').split(/[?#]/, 1)[0];
  if (!cleaned || /^(?:data|blob|https?):/i.test(cleaned)) return null;
  if (cleaned.startsWith('/') || /^[A-Za-z]:\//.test(cleaned) || cleaned.includes('\0')) return null;
  try {
    const segments = decodeURIComponent(cleaned).split('/').filter((segment) => segment && segment !== '.');
    if (!segments.length || segments.some((segment) => segment === '..')) return null;
    return segments.join('/');
  } catch {
    return null;
  }
}

function resolveThreeDModelReference(reference: string, referencedByRelativePath: string): string | null {
  const cleaned = reference.trim().replaceAll('\\', '/').split(/[?#]/, 1)[0];
  if (!cleaned || /^(?:data|blob|https?):/i.test(cleaned) || cleaned.startsWith('/') || /^[A-Za-z]:\//.test(cleaned)) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(cleaned) } catch { return null }
  const resolved = normalizeThreeDModelRelativePath(referencedByRelativePath)?.split('/').slice(0, -1) ?? [];
  for (const segment of decoded.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!resolved.length) return null;
      resolved.pop();
    } else if (segment.includes('\0')) {
      return null;
    } else {
      resolved.push(segment);
    }
  }
  return resolved.length ? resolved.join('/') : null;
}

function requirementFromReference(
  reference: string,
  kind: ThreeDModelCompanionKind,
  referencedBy: string,
): ThreeDModelCompanionRequirement | null {
  const relativePath = normalizeThreeDModelRelativePath(reference);
  const fileName = relativePath?.split('/').at(-1);
  return relativePath && fileName ? { fileName, kind, relativePath, referencedBy } : null;
}

function uniqueRequirements(requirements: ThreeDModelCompanionRequirement[]) {
  const byIdentity = new Map<string, ThreeDModelCompanionRequirement>();
  for (const requirement of requirements) {
    const identity = `${requirement.kind}:${requirement.relativePath.toLowerCase()}`;
    if (!byIdentity.has(identity)) byIdentity.set(identity, requirement);
  }
  return [...byIdentity.values()];
}

function uriRequirements(
  values: unknown,
  kind: ThreeDModelCompanionKind,
  referencedBy: string,
): ThreeDModelCompanionRequirement[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
    const uri = (value as Record<string, unknown>).uri;
    if (typeof uri !== 'string') return [];
    const requirement = requirementFromReference(uri, kind, referencedBy);
    return requirement ? [requirement] : [];
  });
}

function inspectGltfJson(value: unknown, referencedBy: string) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${referencedBy} is not valid glTF JSON`);
  const record = value as Record<string, unknown>;
  return uniqueRequirements([
    ...uriRequirements(record.buffers, 'buffer', referencedBy),
    ...uriRequirements(record.images, 'texture', referencedBy),
  ]);
}

function inspectObj(text: string, referencedBy: string) {
  const requirements: ThreeDModelCompanionRequirement[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*mtllib\s+(.+?)\s*$/i);
    if (!match) continue;
    const requirement = requirementFromReference(match[1].replace(/^"|"$/g, ''), 'material', referencedBy);
    if (requirement) requirements.push(requirement);
  }
  return uniqueRequirements(requirements);
}

function inspectFbx(bytes: Uint8Array, referencedBy: string) {
  const text = new TextDecoder('latin1').decode(bytes);
  const requirements: ThreeDModelCompanionRequirement[] = [];
  const matches = text.matchAll(/([A-Za-z0-9_ .\/\\-]+\.(?:png|jpe?g|webp|tga|bmp))/gi);
  for (const match of matches) {
    const requirement = requirementFromReference(match[1], 'texture', referencedBy);
    if (requirement) requirements.push(requirement);
  }
  return uniqueRequirements(requirements);
}

function inspectGlb(bytes: Uint8Array, referencedBy: string) {
  if (bytes.byteLength < 20) throw new Error(`${referencedBy} is not a complete GLB file`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
    throw new Error(`${referencedBy} is not a supported GLB version 2 file`);
  }
  let offset = 12;
  while (offset + 8 <= bytes.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > bytes.byteLength) throw new Error(`${referencedBy} contains an invalid GLB chunk`);
    if (chunkType === 0x4e4f534a) {
      const json = new TextDecoder().decode(bytes.slice(chunkStart, chunkEnd)).replace(/\0+$/g, '').trim();
      return inspectGltfJson(JSON.parse(json) as unknown, referencedBy);
    }
    offset = chunkEnd;
  }
  throw new Error(`${referencedBy} does not contain a GLB JSON chunk`);
}

export function inspectThreeDModelPrimary(
  fileName: string,
  bytes: Uint8Array,
): ThreeDModelCompanionRequirement[] {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'obj') return inspectObj(new TextDecoder().decode(bytes), fileName);
  if (extension === 'gltf') return inspectGltfJson(JSON.parse(new TextDecoder().decode(bytes)) as unknown, fileName);
  if (extension === 'glb') return inspectGlb(bytes, fileName);
  if (extension === 'fbx') return inspectFbx(bytes, fileName);
  throw new Error(`Unsupported primary Model format: ${extension || 'unknown'}`);
}

export function inspectThreeDModelMaterial(
  fileName: string,
  text: string,
  materialRelativePath = fileName,
): ThreeDModelCompanionRequirement[] {
  const requirements: ThreeDModelCompanionRequirement[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:map_[A-Za-z0-9_]+|bump|disp|decal)\s+(.+?)\s*$/i);
    if (!match) continue;
    const candidate = match[1].trim().split(/\s+/).at(-1)?.replace(/^"|"$/g, '') ?? '';
    const relativePath = resolveThreeDModelReference(candidate, materialRelativePath);
    if (!relativePath) continue;
    const requirement = requirementFromReference(relativePath, 'texture', materialRelativePath);
    if (requirement) requirements.push(requirement);
  }
  return uniqueRequirements(requirements);
}

export function isThreeDModelRequirementSatisfied(
  requirement: ThreeDModelCompanionRequirement,
  selectedRelativePaths: string[],
): boolean {
  return selectedRelativePaths.some((relativePath) => relativePath.toLowerCase() === requirement.relativePath.toLowerCase());
}
