interface SharedTextureFormat {
  fileName: string;
  mimeType?: string | null;
}

function extensionOf(fileName: string): string {
  return /\.([^.\/\\]+)$/.exec(fileName)?.[1].toLowerCase() ?? '';
}

/** Explicit FBX dependency links; never infer substitutions from similar names. */
export function canLinkThreeDTextureRequirement(requiredFileName: string, texture: SharedTextureFormat): boolean {
  const requiredExtension = extensionOf(requiredFileName);
  const textureExtension = extensionOf(texture.fileName);
  if (!requiredExtension || !textureExtension) return false;
  if (requiredExtension === textureExtension) return true;
  // A lossless PNG conversion can retain a TGA's color and alpha. Keep the TGA
  // dependency name as the alias, while the saved Texture URL/MIME stay PNG.
  return requiredExtension === 'tga' && textureExtension === 'png'
    && texture.mimeType?.toLowerCase() === 'image/png';
}
