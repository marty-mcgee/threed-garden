import type { ThreeDModelRuntimeAttachment } from './model-attachment-runtime-core';

interface SavedTextureCandidate {
  fileName: string;
  filePath: string;
  isActive: boolean;
}

/** Read-only FBX filename aliases. They never create attachments or override materials. */
export function withSavedFbxTextures(
  modelType: string,
  files: readonly ThreeDModelRuntimeAttachment[],
  textures: readonly SavedTextureCandidate[],
): ThreeDModelRuntimeAttachment[] {
  if (modelType.toLowerCase() !== 'fbx') return [...files];
  const occupiedNames = new Set(files.filter((file) => file.fileType === 'texture' && /^https:\/\//i.test(file.filePath))
    .flatMap((file) => [file.fileName, file.relativePath.split('/').at(-1) ?? ''].map((name) => name.toLowerCase())));
  const byName = new Map<string, SavedTextureCandidate[]>();
  for (const texture of textures) {
    if (!texture.isActive || !/^https:\/\//i.test(texture.filePath)
      || !/^[^/\\]+\.(png|jpe?g|webp|bmp)$/i.test(texture.fileName)) continue;
    const key = texture.fileName.toLowerCase();
    const matches = byName.get(key) ?? [];
    matches.push(texture);
    byName.set(key, matches);
  }
  const aliases: ThreeDModelRuntimeAttachment[] = [];
  for (const [name, matches] of byName) {
    if (occupiedNames.has(name) || matches.length !== 1) continue;
    const texture = matches[0];
    aliases.push({ fileName: texture.fileName, relativePath: texture.fileName, filePath: texture.filePath, fileType: 'texture' });
  }
  return [...files, ...aliases];
}
