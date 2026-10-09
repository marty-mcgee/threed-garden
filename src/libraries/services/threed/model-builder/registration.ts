/** Explicit new-Model registration. Retain progress so retries never replay confirmed writes. */
export type BuilderTextureChannel = 'baseColor' | 'normalMap' | 'roughness' | 'metallic' | 'occlusion' | 'emissive';
export interface BuilderImage {
  id: string;
  digest: string;
  file: File;
  bindings: Array<{ channel: BuilderTextureChannel; targetKeys: string[] }>;
}
export interface BuilderRegistrationInput {
  file: File;
  outputSha256: string;
  metadata: Record<string, unknown>;
  thumbnailUrl?: string;
  images: BuilderImage[];
}
export interface BuilderRegistrationProgress {
  outputSha256: string;
  primary?: { url: string; fileName: string; fileSize: number; modelType: string };
  modelId?: number;
  primaryModelFileId?: number;
  textureIds: Record<string, number>;
  assigned: string[];
  complete: boolean;
  uncertain?: string;
}
export interface BuilderRegistrationAdapters {
  upload: (file: File, signal?: AbortSignal) => Promise<NonNullable<BuilderRegistrationProgress['primary']>>;
  createModel: (body: Record<string, unknown>) => Promise<{ id: number; mainModelFileId: number }>;
  createTexture: (file: File, name: string) => Promise<number>;
  assign: (body: { modelId: number; textureId: number; channel: BuilderTextureChannel; targetKeys: string[] }) => Promise<void>;
}

export function newBuilderRegistration(outputSha256: string): BuilderRegistrationProgress {
  return { outputSha256, textureIds: {}, assigned: [], complete: false };
}

/** Network loss during a creation POST must be reviewed before another creation attempt. */
export class BuilderUnconfirmedWriteError extends Error {}

const activeRegistrations = new WeakSet<BuilderRegistrationProgress>();
export async function registerBuilderModel(
  input: BuilderRegistrationInput,
  name: string,
  progress: BuilderRegistrationProgress,
  adapters: BuilderRegistrationAdapters,
  options: { signal?: AbortSignal; onProgress?: (message: string) => void } = {},
): Promise<BuilderRegistrationProgress> {
  if (activeRegistrations.has(progress)) throw new Error('This Model is already being saved.');
  activeRegistrations.add(progress);
  try { return await performRegistration(input, name, progress, adapters, options); }
  finally { activeRegistrations.delete(progress); }
}

async function performRegistration(
  input: BuilderRegistrationInput,
  name: string,
  progress: BuilderRegistrationProgress,
  adapters: BuilderRegistrationAdapters,
  options: { signal?: AbortSignal; onProgress?: (message: string) => void } = {},
): Promise<BuilderRegistrationProgress> {
  const check = () => {
    options.signal?.throwIfAborted();
    if (progress.uncertain) throw new Error(progress.uncertain);
  };
  check();
  if (progress.outputSha256 !== input.outputSha256) throw new Error('Generate a new registration draft for the changed Model.');
  const modelName = name.trim();
  if (!modelName || modelName.length > 200) throw new Error('Enter a Model name between 1 and 200 characters.');
  if (progress.complete) return progress;
  if (!progress.primary) {
    options.onProgress?.('Uploading and verifying the generated GLB…');
    progress.primary = await adapters.upload(input.file, options.signal);
  }
  if (progress.primary.modelType !== 'glb' || progress.primary.fileSize !== input.file.size) throw new Error('Verified upload does not match the generated GLB.');
  check();
  if (!progress.modelId) {
    options.onProgress?.('Creating a new private, inactive Model…');
    const primary = progress.primary;
    try {
      const created = await adapters.createModel({
        modelName, modelType: 'glb', filePath: primary.url, fileSize: primary.fileSize,
        primaryFile: { fileName: primary.fileName, filePath: primary.url, fileSize: primary.fileSize, modelType: 'glb' },
        scale: '1', rotationY: '0', offsetX: '0', offsetY: '0', offsetZ: '0',
        isActive: false, status: 'pending', isPublic: false, isDefault: false, isLibraryItem: true,
        usedByCharacters: false, usedByPlants: false, metadata: input.metadata,
        ...(input.thumbnailUrl ? { thumbnailUrl: input.thumbnailUrl } : {}),
      });
      if (!created || typeof created !== 'object' || Array.isArray(created)
        || !Number.isSafeInteger(created.id) || created.id <= 0
        || !Number.isSafeInteger(created.mainModelFileId) || created.mainModelFileId <= 0) {
        throw new BuilderUnconfirmedWriteError('Model creation returned no confirmed primary File.');
      }
      progress.modelId = created.id;
      progress.primaryModelFileId = created.mainModelFileId;
    } catch (error) {
      if (error instanceof BuilderUnconfirmedWriteError) progress.uncertain = 'Model creation was not confirmed. Review Models before starting another save.';
      throw error;
    }
  }
  const modelId = progress.modelId;
  for (const [index, image] of input.images.entries()) {
    check();
    options.onProgress?.(`Saving Model Textures ${index + 1}/${input.images.length}…`);
    if (!progress.textureIds[image.digest]) {
      try {
        const textureId = await adapters.createTexture(image.file, `${modelName} · ${image.id}`.slice(0, 255));
        if (!Number.isSafeInteger(textureId) || textureId <= 0) throw new BuilderUnconfirmedWriteError('Texture creation returned no confirmed record.');
        progress.textureIds[image.digest] = textureId;
      } catch (error) {
        if (error instanceof BuilderUnconfirmedWriteError) progress.uncertain = 'Texture creation was not confirmed. Review this Model and Model Textures before repeating the upload.';
        throw error;
      }
    }
    for (const binding of image.bindings) {
      // Bounded batches also fit the existing material-assignment request budget.
      for (let offset = 0; offset < binding.targetKeys.length; offset += 30) {
        check();
        const targetKeys = binding.targetKeys.slice(offset, offset + 30);
        const key = `${image.digest}:${binding.channel}:${targetKeys.join(',')}`;
        if (progress.assigned.includes(key)) continue;
        await adapters.assign({ modelId, textureId: progress.textureIds[image.digest], channel: binding.channel, targetKeys });
        progress.assigned.push(key);
      }
    }
  }
  check();
  progress.complete = true;
  options.onProgress?.('New Model and PBR Texture assignments saved. Review the Model before activating or placing it.');
  return progress;
}
