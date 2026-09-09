import {
  normalizeThreeDModelRelativePath,
  type ThreeDModelCompanionRequirement,
// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
} from '../../../../lib/services/threed/models/model-companion-core.ts';

export const MAX_BULK_MODELS = 100;
// Leave multipart overhead below the deployed Function request-body limit.
export const MAX_BULK_FILE_BYTES = 4 * 1024 * 1024;
const TEXTURE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'tga', 'bmp']);
const PREVIEW_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const PREVIEW_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface BulkDefaults {
  scale: string;
  categoryIds: number[];
  isLibraryItem: boolean;
  isPublic: boolean;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  isActive: boolean;
  existingTextureId: number | null;
}

export interface BulkExistingTexture {
  id: number;
  textureName: string;
  fileName: string;
  isActive: boolean;
}

export interface BulkSource {
  id: string;
  file: File;
  sourcePath: string;
  selectionRoot: string;
}

export interface BulkDraft {
  id: string;
  source: BulkSource;
  modelName: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  overrides: Partial<BulkDefaults>;
  configureLater: boolean;
  previewFile?: File;
  requirements: ThreeDModelCompanionRequirement[];
  inspecting: boolean;
  inspectionError?: string;
  choices: Record<string, { sourceId: string; relativePath: string }>;
  extras?: Array<{ id: string; sourceId: string; relativePath: string }>;
}

export interface BulkPreparedModel {
  ready: boolean;
  issues: string[];
  unresolved: string[];
  attachments: Array<{ source: BulkSource; relativePath: string }>;
  settings: BulkDefaults;
  matches: Array<{
    requirement: ThreeDModelCompanionRequirement;
    sourceId: string;
    relativePath: string;
    automatic: boolean;
    issue?: string;
  }>;
}

function extension(name: string) { return name.split('.').at(-1)?.toLowerCase() ?? '' }
function basename(path: string) { return path.split('/').at(-1)?.toLowerCase() ?? '' }

function pathSuffixes(path: string): string[] {
  const suffixes = [path];
  for (let slash = path.indexOf('/'); slash >= 0; slash = path.indexOf('/', slash + 1)) {
    suffixes.push(path.slice(slash + 1));
  }
  return suffixes;
}

function selectedFileIssue(file: File): string | null {
  if (file.name.length > 255) return 'Filenames cannot exceed 255 characters.';
  if (safePath(file.name) !== file.name || file.name.includes('/')) return 'Choose a file with a valid filename.';
  if (file.size <= 0) return 'Selected files must not be empty.';
  return file.size > MAX_BULK_FILE_BYTES ? 'Bulk uploads currently support files up to 4 MiB.' : null;
}

export function validateBulkPrimary(file: File): string | null {
  return extension(file.name) !== 'fbx' ? 'Select an FBX Model file.' : selectedFileIssue(file);
}

export function validateBulkTexture(file: File): string | null {
  return !TEXTURE_EXTENSIONS.has(extension(file.name))
    ? 'Textures must be PNG, JPG, WebP, TGA, or BMP files.' : selectedFileIssue(file);
}

function previewMetadataIssue(file: File): string | null {
  return !PREVIEW_EXTENSIONS.has(extension(file.name)) || !PREVIEW_TYPES.has(file.type)
    ? 'Preview image must be a JPG, PNG, or WebP file.' : selectedFileIssue(file);
}

/** Validate before storing a preview on a draft; reads only its signature. */
export async function validateBulkPreview(file: File): Promise<string | null> {
  const metadataIssue = previewMetadataIssue(file);
  if (metadataIssue) return metadataIssue;
  try {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const valid = file.type === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : file.type === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
        : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
          && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    return valid ? null : 'Preview image contents do not match the selected image format.';
  } catch {
    return 'Preview image could not be read.';
  }
}

export function createBulkDefaults(): BulkDefaults {
  return { scale: '1.0', categoryIds: [], isLibraryItem: true, isPublic: false,
    usedByPlants: false, usedByCharacters: false, isActive: false, existingTextureId: null };
}

export function createBulkDraft(source: BulkSource): BulkDraft {
  return {
    id: source.id, source,
    modelName: source.file.name.replace(/\.fbx$/i, '').replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim(),
    rotationY: '0.0', offsetX: '0.0', offsetY: '0.0', offsetZ: '0.0',
    overrides: {}, configureLater: false, requirements: [], inspecting: true, choices: {}, extras: [],
  };
}

function safePath(reference: string): string | null {
  try {
    const decoded = decodeURIComponent(reference.trim().replaceAll('\\', '/'));
    if (/^(?:\/|[A-Za-z][A-Za-z0-9+.-]*:)/.test(decoded) || decoded.includes('\0')) return null;
    const normalized = normalizeThreeDModelRelativePath(reference);
    // Avoid a destination changing meaning when the runtime normalizes it again.
    return normalized && normalizeThreeDModelRelativePath(normalized) === normalized ? normalized : null;
  } catch { return null }
}

export function requirementKey(requirement: ThreeDModelCompanionRequirement): string {
  return `${requirement.kind}:${(safePath(requirement.relativePath) ?? requirement.relativePath).toLowerCase()}`;
}

export function defaultDestination(reference: string): string {
  const normalized = safePath(reference);
  return normalized ? normalized.includes('/') ? normalized : `textures/${normalized}` : reference;
}

export function resolveBulkSettings(draft: BulkDraft, defaults: BulkDefaults): BulkDefaults {
  const settings = { ...defaults, ...draft.overrides };
  return { ...settings, categoryIds: [...settings.categoryIds], isActive: !draft.configureLater && settings.isActive };
}

function automaticSource(draft: BulkDraft, requirement: ThreeDModelCompanionRequirement, pool: readonly BulkSource[]) {
  const primaryPath = safePath(draft.source.sourcePath);
  const reference = safePath(requirement.relativePath);
  if (draft.source.selectionRoot && primaryPath && reference) {
    const directory = primaryPath.split('/').slice(0, -1).join('/');
    const expected = (directory ? `${directory}/${reference}` : reference).toLowerCase();
    const exact = pool.filter((source) => source.selectionRoot === draft.source.selectionRoot
      && safePath(source.sourcePath)?.toLowerCase() === expected);
    if (exact.length === 1) return { source: exact[0] };
    if (exact.length > 1) return { issue: 'Choose texture: multiple files have this source path.' };
  }
  const candidates = pool.filter((source) => source.file.name.toLowerCase() === requirement.fileName.toLowerCase());
  return candidates.length === 1 ? { source: candidates[0] }
    : { issue: candidates.length ? 'Choose texture: multiple files have this name.' : 'Missing texture.' };
}

export function prepareBulkModel(draft: BulkDraft, defaults: BulkDefaults, pool: readonly BulkSource[], existingTextures?: readonly BulkExistingTexture[]): BulkPreparedModel {
  const settings = resolveBulkSettings(draft, defaults);
  const issues: string[] = [];
  const addIssue = (issue: string) => { if (!issues.includes(issue)) issues.push(issue) };
  const primaryIssue = validateBulkPrimary(draft.source.file);
  if (primaryIssue) addIssue(primaryIssue);
  if (draft.inspecting) addIssue('Texture reference scan is still running.');
  if (draft.inspectionError) addIssue(draft.inspectionError);
  if (settings.existingTextureId != null) {
    if (!Number.isSafeInteger(settings.existingTextureId) || settings.existingTextureId <= 0) {
      addIssue('Choose a valid existing Texture.');
    } else if (!existingTextures) {
      addIssue('Load existing Textures before importing this Model.');
    } else if (!existingTextures.some((texture) => texture.id === settings.existingTextureId && texture.isActive)) {
      addIssue('The selected existing Texture is unavailable or inactive. Choose another Texture or None.');
    }
  }
  if (!draft.modelName.trim()) addIssue('Model name is required.');
  for (const [label, value, minimum] of [
    ['Scale', settings.scale, 0.01], ['Y rotation', draft.rotationY],
    ['X offset', draft.offsetX], ['Y offset', draft.offsetY], ['Z offset', draft.offsetZ],
  ] as Array<[string, string, number?]>) {
    if (!value.trim() || !Number.isFinite(Number(value)) || (minimum !== undefined && Number(value) < minimum)) {
      addIssue(`${label} must be a finite number${minimum === undefined ? '' : ` of at least ${minimum}`}.`);
    }
  }
  if (settings.categoryIds.length > 50 || settings.categoryIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    addIssue('Choose up to 50 valid Model categories.');
  }
  if (draft.previewFile) {
    const issue = previewMetadataIssue(draft.previewFile);
    if (issue) addIssue(issue);
    if (draft.requirements.some((requirement) => requirement.fileName.toLowerCase() === draft.previewFile?.name.toLowerCase())) {
      addIssue('Preview filename conflicts with a texture reference; rename or remove the preview.');
    }
  }

  type Attachment = { source: BulkSource; relativePath: string; keys: Set<string>; extra: boolean };
  const attachments: Attachment[] = [];
  function addAttachment(source: BulkSource, path: string, key?: string): string | undefined {
    const relativePath = safePath(path);
    const issue = validateBulkTexture(source.file)
      ?? (!relativePath ? 'Enter a safe relative attachment path.' : null)
      ?? (!relativePath?.includes('/') ? 'Attachment directory is required.' : null)
      ?? ((relativePath?.split('/').slice(0, -1).join('/').length ?? 0) > 100 ? 'Attachment directory cannot exceed 100 characters.' : null)
      ?? (relativePath && basename(relativePath) !== source.file.name.toLowerCase() ? 'Attachment destination must keep the selected filename.' : null)
      ?? (source.file.name.toLowerCase() === draft.previewFile?.name.toLowerCase() ? 'Preview filename conflicts with a texture; rename or remove the preview.' : null);
    if (issue || !relativePath) {
      const message = `${source.file.name}: ${issue}`;
      addIssue(message);
      return message;
    }
    const existing = attachments.find((attachment) => attachment.relativePath.toLowerCase() === relativePath.toLowerCase());
    if (existing) {
      if (existing.source.id !== source.id || !key || existing.extra) {
        const message = `Duplicate attachment destination: ${relativePath}`;
        addIssue(message);
        return message;
      }
      existing.keys.add(key);
    } else attachments.push({ source, relativePath, keys: new Set(key ? [key] : []), extra: !key });
  }

  const requirements = [...new Map(draft.requirements.map((requirement) => [requirementKey(requirement), requirement])).values()];
  const matches: BulkPreparedModel['matches'] = requirements.map((requirement) => {
    const key = requirementKey(requirement);
    const choice = draft.choices[key];
    const suggested = choice ? undefined : automaticSource(draft, requirement, pool);
    const source = choice ? pool.find((candidate) => candidate.id === choice.sourceId) : suggested?.source;
    const relativePath = choice?.relativePath ?? defaultDestination(requirement.relativePath);
    let issue = source ? undefined : choice
      ? choice.sourceId ? 'Selected texture is no longer available.' : 'Texture left unmatched.'
      : suggested?.issue;
    if (source && source.file.name.toLowerCase() !== requirement.fileName.toLowerCase()) {
      issue = `Selected texture must be named ${requirement.fileName}.`;
      addIssue(issue);
    } else if (source) issue = addAttachment(source, relativePath, key);
    return { requirement, sourceId: source?.id ?? choice?.sourceId ?? '', relativePath, automatic: !choice, issue };
  });
  for (const extra of draft.extras ?? []) {
    const source = pool.find((candidate) => candidate.id === extra.sourceId);
    if (source) addAttachment(source, extra.relativePath);
    else addIssue('An extra texture is no longer available; remove or replace its attachment.');
  }

  const unresolved: string[] = [];
  const resolvedKeys = new Set<string>();
  const filenameGroups = new Map<string, { byPath: Map<string, Attachment>; suffixConflict: boolean }>();
  for (const attachment of attachments) {
    const filename = attachment.source.file.name.toLowerCase();
    let group = filenameGroups.get(filename);
    if (!group) {
      group = { byPath: new Map(), suffixConflict: false };
      filenameGroups.set(filename, group);
    }
    group.byPath.set(attachment.relativePath.toLowerCase(), attachment);
  }
  for (const group of filenameGroups.values()) {
    group.suffixConflict = [...group.byPath.keys()].some((path) => pathSuffixes(path).slice(1)
      .some((suffix) => group.byPath.has(suffix)));
  }
  for (const match of matches) {
    const reference = safePath(match.requirement.relativePath)?.toLowerCase() ?? '';
    const filename = match.requirement.fileName.toLowerCase();
    const group = filenameGroups.get(filename);
    const suffixConflict = group?.suffixConflict;
    const exact = pathSuffixes(reference).flatMap((path) => {
      const attachment = group?.byPath.get(path);
      return attachment ? [attachment] : [];
    });
    const resolved = exact.length === 1 ? exact[0] : exact.length ? undefined
      : group?.byPath.size === 1 ? group.byPath.values().next().value : undefined;
    if (!match.issue && (suffixConflict || !resolved || resolved.source.id !== match.sourceId)) {
      match.issue = suffixConflict ? 'Competing attachment suffixes make this texture ambiguous.'
        : 'Attachment destinations do not resolve this texture unambiguously.';
    }
    if (match.issue || !match.sourceId) unresolved.push(match.requirement.relativePath);
    else resolvedKeys.add(requirementKey(match.requirement));
  }
  return {
    ready: !issues.length && (!unresolved.length || draft.configureLater), issues, unresolved, settings, matches,
    attachments: attachments.filter((attachment) => !draft.configureLater || attachment.extra
      || [...attachment.keys].some((key) => resolvedKeys.has(key)))
      .map(({ source, relativePath }) => ({ source, relativePath })),
  };
}
