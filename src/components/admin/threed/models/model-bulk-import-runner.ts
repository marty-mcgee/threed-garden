import {
  buildThreeDModelAdminPayload,
  createEmptyThreeDModelAdminForm,
// @ts-expect-error Node's native TypeScript validator requires the explicit extension.
} from './model-admin-form-core.ts';
import {
  normalizeThreeDModelRelativePath,
// @ts-expect-error Node's native TypeScript validator requires the explicit extension.
} from '../../../../lib/services/threed/models/model-companion-core.ts';
// @ts-expect-error Node's native TypeScript validator requires the explicit extension.
import { MAX_BULK_FILE_BYTES, validateBulkPreview } from './model-bulk-preparation-core.ts';
import {
  isThreeDModelMaterialTargetKey,
  THREED_MODEL_MATERIAL_OVERRIDE_LIMIT,
// @ts-expect-error Node's native TypeScript validator requires the explicit extension.
} from '../../../../lib/services/threed/models/model-material-override-core.ts';

export interface BulkImportInput {
  file: File;
  modelName: string;
  settings: {
    scale: string;
    categoryIds: number[];
    isLibraryItem: boolean;
    isPublic: boolean;
    usedByPlants: boolean;
    usedByCharacters: boolean;
    isActive: boolean;
    existingTextureId?: number | null;
  };
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  configureLater: boolean;
  previewFile?: File;
  attachments: Array<{ file: File; relativePath: string }>;
}

export interface BulkImportResult {
  status: 'imported' | 'failed' | 'unknown';
  modelId?: number;
  message: string;
  analysis?: unknown;
  stagedUrl?: string;
  /** A fresh create is safe only after a definitive rejection and staged cleanup. */
  canRetry: boolean;
}

const MAX_RESPONSE_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 120_000;
const PRIMARY_ROUTE = '/api/threed/models/upload';
const MODEL_ROUTE = '/api/threed/models';
const FILES_ROUTE = '/api/threed/models/files';
const TEXTURES_ROUTE = '/api/threed/model-textures';
const ASSIGNMENT_ROUTE = `${FILES_ROUTE}/requirements`;
const MAX_ASSIGNMENT_BYTES = 2_048;
const REJECTED_BEFORE_WRITE = new Set([400, 401, 403, 404, 413, 415, 422]);

type JsonObject = Record<string, unknown>;
type Reply = { ok: boolean; status: number; body: JsonObject | null };

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject : null;
}

function positiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2_000) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function data(reply: Reply): JsonObject | null {
  return reply.ok && reply.body?.success === true ? object(reply.body.data) : null;
}

async function readBoundedJson(response: Response): Promise<JsonObject | null> {
  if (Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return object(JSON.parse(new TextDecoder().decode(bytes))); } catch { return null; }
}

/** No retry: an aborted or lost mutation can still have committed on the server. */
async function send(request: typeof fetch, url: string, init?: RequestInit): Promise<Reply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await request(url, { ...init, cache: 'no-store', signal: controller.signal });
    return { ok: response.ok, status: response.status, body: await readBoundedJson(response).catch(() => null) };
  } finally { clearTimeout(timer); }
}

function json(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function checkFile(file: File, extensions: RegExp): void {
  if (!extensions.test(file.name) || file.name.length > 255 || file.size <= 0 || file.size > MAX_BULK_FILE_BYTES) {
    throw new Error('Select a supported non-empty file of at most 4 MiB.');
  }
}

async function checkPreview(file: File): Promise<void> {
  checkFile(file, /\.(?:jpe?g|png|webp)$/i);
  if (await validateBulkPreview(file)) throw new Error('Invalid preview image.');
}

function attachmentPath(path: string): string {
  const normalized = normalizeThreeDModelRelativePath(path);
  if (!normalized?.includes('/') || normalized.split('/').slice(0, -1).join('/').length > 100) {
    throw new Error('Choose a safe attachment destination with a directory of at most 100 characters.');
  }
  return normalized;
}

function assignmentTargets(analysis: unknown): string[] | null {
  const inspected = object(analysis);
  const inventory = object(inspected?.materialTargets);
  const keys = inventory?.targetKeys;
  if (inspected?.status !== 'analyzed' || !Array.isArray(keys)
    || keys.length < 1 || keys.length > THREED_MODEL_MATERIAL_OVERRIDE_LIMIT
    || inventory?.materialSlotCount !== keys.length || inventory.omittedSlotCount !== 0
    || !keys.every(isThreeDModelMaterialTargetKey) || new Set(keys).size !== keys.length) return null;
  return [...keys];
}

function assignmentBodies(modelId: number, textureId: number, targetKeys: string[]): string[] {
  const bodies: string[] = [];
  let chunk: string[] = [];
  const serialize = (keys: string[]) => JSON.stringify({ modelId, targetKeys: keys, channel: 'baseColor', textureId });
  for (const targetKey of targetKeys) {
    const candidate = [...chunk, targetKey];
    if (candidate.length > 40 || new TextEncoder().encode(serialize(candidate)).byteLength > MAX_ASSIGNMENT_BYTES) {
      bodies.push(serialize(chunk));
      chunk = [];
    }
    chunk.push(targetKey);
  }
  if (chunk.length) bodies.push(serialize(chunk));
  return bodies;
}

export async function runBulkModel(
  input: BulkImportInput,
  onProgress: (label: string) => void,
  request: typeof fetch = fetch,
): Promise<BulkImportResult> {
  // Validate before the first upload. Inputs are an immutable snapshot of a reviewed row.
  let form: ReturnType<typeof buildThreeDModelAdminPayload>;
  let attachments: Array<{ file: File; relativePath: string; fileType: 'texture' | 'other' }>;
  const { existingTextureId = null, ...modelSettings } = input.settings;
  try {
    checkFile(input.file, /\.fbx$/i);
    if (!normalizeThreeDModelRelativePath(input.file.name)) throw new Error('Invalid primary filename.');
    for (const value of [input.settings.scale, input.rotationY, input.offsetX, input.offsetY, input.offsetZ]) {
      if (!value.trim()) throw new Error('Every transform must contain a finite number.');
    }
    if (input.settings.categoryIds.length > 50 || input.settings.categoryIds.some((id) => !positiveId(id))) {
      throw new Error('Choose valid Model categories.');
    }
    if (existingTextureId !== null && !positiveId(existingTextureId)) throw new Error('Choose a valid existing Texture.');
    form = buildThreeDModelAdminPayload({
      ...createEmptyThreeDModelAdminForm(),
      ...modelSettings,
      modelName: input.modelName,
      modelType: 'fbx',
      filePath: 'https://pending.invalid/model.fbx',
      fileSize: String(input.file.size),
      rotationY: input.rotationY,
      offsetX: input.offsetX,
      offsetY: input.offsetY,
      offsetZ: input.offsetZ,
      isActive: false,
      status: 'pending',
    });
    attachments = input.attachments.map((entry) => {
      checkFile(entry.file, /\.(?:png|jpe?g|webp|tga|bmp)$/i);
      return { ...entry, relativePath: attachmentPath(entry.relativePath), fileType: 'texture' };
    });
    if (input.previewFile) {
      await checkPreview(input.previewFile);
      const previewName = input.previewFile.name.toLowerCase();
      if (attachments.some((entry) => entry.file.name.toLowerCase() === previewName
        || entry.relativePath.split('/').at(-1)?.toLowerCase() === previewName)) {
        throw new Error('The preview filename must be distinct from texture filenames.');
      }
      attachments.push({
        file: input.previewFile,
        relativePath: attachmentPath(`previews/${input.previewFile.name}`),
        fileType: 'other',
      });
    }
    if (new Set(attachments.map((entry) => entry.relativePath.toLowerCase())).size !== attachments.length) {
      throw new Error('Attachment destinations, including the preview destination, must be unique.');
    }
  } catch {
    return { status: 'failed', canRetry: true, message: 'Check the Model fields, file sizes, preview format, and attachment destinations before retrying.' };
  }

  let stagedUrl: string | undefined;
  let analysis: unknown;
  let modelId: number | undefined;
  let materialTargets: string[] | null = null;
  let textureAssigned = false;
  const result = (status: BulkImportResult['status'], message: string, canRetry = false): BulkImportResult => ({
    status,
    message: status === 'imported' && textureAssigned
      ? `${message} Existing Texture assigned to ${materialTargets!.length} material slot${materialTargets!.length === 1 ? '' : 's'}.` : message,
    canRetry, ...(modelId ? { modelId } : {}),
    ...(stagedUrl ? { stagedUrl } : {}), ...(analysis ? { analysis } : {}),
  });
  const failBeforeCreate = async (message: string): Promise<BulkImportResult> => {
    if (stagedUrl) {
      onProgress('Discarding uncommitted primary upload');
      try {
        const cleanup = await send(request, PRIMARY_ROUTE, json('DELETE', { url: stagedUrl }));
        if (!cleanup.ok || cleanup.body?.success !== true) {
          return result('unknown', 'No Model was created, but staged upload cleanup is unconfirmed. Check the import result before starting again.');
        }
        stagedUrl = undefined;
      } catch {
        return result('unknown', 'No Model was created, but staged upload cleanup is unconfirmed. Check the import result before starting again.');
      }
    }
    return result('failed', message, true);
  };

  if (existingTextureId !== null) {
    onProgress('Checking selected existing Texture');
    try {
      const catalog = await send(request, TEXTURES_ROUTE);
      const available = catalog.ok && catalog.body?.success === true && Array.isArray(catalog.body.data)
        && catalog.body.data.some((entry) => {
          const texture = object(entry);
          return texture?.id === existingTextureId && texture.isActive === true;
        });
      if (!available) {
        return result('failed', 'The selected existing Texture is unavailable or inactive. Refresh the Texture selection before retrying.', true);
      }
    } catch {
      return result('failed', 'The selected existing Texture could not be checked. Refresh the Texture selection before retrying.', true);
    }
  }

  onProgress('Uploading and analyzing FBX');
  const primaryBody = new FormData();
  primaryBody.append('file', input.file);
  let upload: Reply;
  try { upload = await send(request, PRIMARY_ROUTE, { method: 'POST', body: primaryBody }); }
  catch { return result('unknown', 'The upload response was lost. Check the import result before uploading this file again.'); }
  if (!upload.ok && REJECTED_BEFORE_WRITE.has(upload.status)) {
    return result('failed', upload.status === 413
      ? 'The upload transport rejected this file size. Use a smaller file and retry.'
      : 'The server rejected the FBX before creation. Check its format and your signed-in session, then retry.', true);
  }
  const uploaded = data(upload);
  if (httpsUrl(uploaded?.url)) stagedUrl = uploaded.url;
  if (!uploaded || !stagedUrl) {
    return result('unknown', 'The upload outcome is unconfirmed. Check the import result before uploading this file again.');
  }
  analysis = uploaded.analysis;
  if (uploaded.fileName !== input.file.name || uploaded.fileSize !== input.file.size || uploaded.modelType !== 'fbx') {
    return failBeforeCreate('The upload returned inconsistent primary file details. Its staged file was discarded; check the FBX before retrying.');
  }
  if (existingTextureId !== null) {
    materialTargets = assignmentTargets(analysis);
    if (!materialTargets) {
      return failBeforeCreate('The FBX did not provide a complete set of 1–500 supported material slots. Its staged upload was discarded. Remove the existing Texture selection to configure after import, or choose another FBX.');
    }
  }
  const primaryFile = {
    fileName: uploaded.fileName,
    filePath: stagedUrl,
    fileSize: input.file.size,
    modelType: 'fbx',
  };
  onProgress('Creating inactive Model and registering primary file');
  let created: Reply;
  try {
    created = await send(request, MODEL_ROUTE, json('POST', {
      ...form, filePath: stagedUrl, primaryFile,
    }));
  } catch {
    return result('unknown', 'The creation response was lost. Check the Models workspace before creating this Model again.');
  }
  if (!created.ok && REJECTED_BEFORE_WRITE.has(created.status)) {
    return failBeforeCreate('Model creation was rejected and the staged primary was discarded. Review the configuration before retrying.');
  }
  const createdModel = data(created);
  if (!createdModel || !positiveId(createdModel.id)) {
    return result('unknown', 'Model creation could not be confirmed. Check the Models workspace before creating this Model again.');
  }
  modelId = createdModel.id;
  // Once creation is known, this URL is committed. Never offer staged cleanup.
  stagedUrl = undefined;
  const modelUrl = `${MODEL_ROUTE}?id=${modelId}`;
  let previewUrl: string | undefined;
  for (let index = 0; index < attachments.length; index += 1) {
    const entry = attachments[index];
    onProgress(`Saving attachment ${index + 1} of ${attachments.length}`);
    const body = new FormData();
    body.append('modelId', String(modelId));
    body.append('files', entry.file);
    body.append('relativePaths', entry.relativePath);
    body.append('category', entry.fileType);
    try {
      const saved = await send(request, FILES_ROUTE, { method: 'POST', body });
      if (!saved.ok || saved.body?.success !== true) {
        return result('failed', 'Model created inactive; an attachment was not confirmed. Review Model files before continuing.');
      }
    } catch {
      return result('failed', 'Model created inactive; an attachment response was lost. Review saved Model files before uploading it again.');
    }
  }

  onProgress('Verifying saved primary and attachments');
  try {
    const saved = data(await send(request, modelUrl));
    const files = Array.isArray(saved?.files) ? saved.files.map(object).filter((entry) => entry !== null) : [];
    const primary = files.find((entry) => entry.id === saved?.mainModelFileId);
    if (!saved || saved.id !== modelId || !positiveId(saved.mainModelFileId)
      || saved.isActive !== false || saved.status !== 'pending'
      || saved.filePath !== primaryFile.filePath || saved.modelType !== 'fbx'
      || !primary || primary.fileType !== 'model' || primary.filePath !== primaryFile.filePath
      || primary.fileName !== primaryFile.fileName || primary.fileSize !== primaryFile.fileSize) {
      return result('failed', 'Model created; primary registration or inactive state could not be verified. Review Model files.');
    }
    for (const entry of attachments) {
      const matches = files.filter((file) => file.relativePath === entry.relativePath);
      const match = matches[0];
      if (matches.length !== 1 || !positiveId(match?.id) || match.fileName !== entry.file.name
        || match.fileSize !== entry.file.size || match.fileType !== entry.fileType || !httpsUrl(match.filePath)) {
        return result('failed', 'Model created inactive; saved attachments did not match the reviewed batch. Review Model files.');
      }
      if (entry.fileType === 'other') previewUrl = match.filePath;
    }
  } catch {
    return result('failed', 'Model created; saved files could not be verified. Review Model files before continuing.');
  }

  if (previewUrl) {
    onProgress('Setting saved preview image');
    try {
      const updated = data(await send(request, modelUrl, json('PATCH', { thumbnailUrl: previewUrl })));
      if (!updated || updated.id !== modelId || updated.thumbnailUrl !== previewUrl) {
        return result('failed', 'Model and preview file saved inactive; preview selection could not be confirmed. Review the Model.');
      }
    } catch {
      return result('failed', 'Model and preview file saved inactive; preview selection response was lost. Review the Model.');
    }
  }

  if (existingTextureId !== null && materialTargets) {
    const bodies = assignmentBodies(modelId, existingTextureId, materialTargets);
    for (let index = 0; index < bodies.length; index += 1) {
      onProgress(`Assigning existing Texture (${index + 1} of ${bodies.length})`);
      try {
        const assigned = data(await send(request, ASSIGNMENT_ROUTE, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: bodies[index],
        }));
        if (!assigned || assigned.id !== modelId) {
          return result('failed', 'Model created inactive; existing Texture assignment was not completed. Some slots may already be assigned. Review Model files before continuing.');
        }
      } catch {
        return result('failed', 'Model created inactive; an existing Texture assignment response was lost. Review saved material assignments before continuing.');
      }
    }
    onProgress('Verifying saved existing Texture assignments');
    try {
      const saved = data(await send(request, modelUrl));
      const assignments = Array.isArray(saved?.materialAssignments)
        ? saved.materialAssignments.map(object).filter((entry) => entry !== null) : [];
      if (!saved || saved.id !== modelId || saved.isActive !== false || saved.status !== 'pending'
        || !materialTargets.every((targetKey) => {
          const matches = assignments.filter((entry) => entry.targetKey === targetKey && entry.channel === 'baseColor');
          return matches.length === 1 && matches[0].textureId === existingTextureId;
        })) {
        return result('failed', 'Model created inactive; saved existing Texture assignments did not match the selection. Review Model files before continuing.');
      }
      textureAssigned = true;
    } catch {
      return result('failed', 'Model created inactive; saved existing Texture assignments could not be verified. Review Model files before continuing.');
    }
  }

  onProgress('Checking saved texture dependencies');
  let audit: JsonObject | null = null;
  try { audit = data(await send(request, `${FILES_ROUTE}/requirements?modelId=${modelId}`)); }
  catch { /* A failed read must never activate the Model. */ }
  const auditComplete = audit?.status === 'analyzed' && audit.complete === true
    && Array.isArray(audit.requirements)
    && audit.requirements.every((requirement) => object(requirement)?.satisfied === true);
  if (input.configureLater || !auditComplete) {
    return result('imported', input.configureLater
      ? textureAssigned
        ? 'Imported inactive/pending. Review remaining files and the Model before activation.'
        : 'Imported inactive/pending. Configure textures and review the Model before activation.'
      : 'Imported inactive/pending. Texture inspection needs review before activation.');
  }
  if (!input.settings.isActive) {
    return result('imported', 'Imported inactive/pending. Named texture dependencies checked; review the Model before activation.');
  }
  onProgress('Activating reviewed Model');
  try {
    const activated = data(await send(request, modelUrl, json('PATCH', { isActive: true, status: 'active' })));
    if (!activated || activated.id !== modelId || activated.isActive !== true || activated.status !== 'active') {
      return result('unknown', 'Model imported; activation could not be confirmed. Check its current status in the Models workspace.');
    }
  } catch {
    return result('unknown', 'Model imported; the activation response was lost. Check its current status in the Models workspace.');
  }
  return result('imported', 'Imported and activated. Review the saved Model appearance.');
}
