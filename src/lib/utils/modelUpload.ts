// src/lib/utils/modelUpload.ts — v0.16.4-alpha
// Reuses the same Vercel Blob `put()` pattern already used for Music media,
// applied to ThreeD model files, textures, and supportive media.
import { put } from '@vercel/blob';

function extensionOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function safeOwner(userId: string): string {
  return userId || 'anonymous';
}

/**
 * Uploads the primary 3D model file (GLB/GLTF/FBX/OBJ/USDZ).
 * Returns the public Blob URL and the file size in bytes.
 */
export async function uploadModelFile(
  file: File,
  userId: string,
  modelId: number,
): Promise<{ url: string; fileSize: number }> {
  const ext = extensionOf(file.name) || 'glb';
  const path = `models/${safeOwner(userId)}/${modelId}/model/${Date.now()}.${ext}`;
  const blob = await put(path, file, { access: 'public', addRandomSuffix: false });
  return { url: blob.url, fileSize: file.size };
}

/**
 * Uploads a model texture (baseColor/normal/roughness/metallic/emissive/occlusion).
 */
export async function uploadModelTexture(
  file: File,
  userId: string,
  modelId: number,
  textureType: string,
): Promise<{ url: string; fileSize: number }> {
  const ext = extensionOf(file.name) || 'png';
  const path = `models/${safeOwner(userId)}/${modelId}/textures/${textureType}/${Date.now()}.${ext}`;
  const blob = await put(path, file, { access: 'public', addRandomSuffix: false });
  return { url: blob.url, fileSize: file.size };
}

/**
 * Uploads supportive media (thumbnails, previews, and other auxiliary assets).
 */
export async function uploadModelMedia(
  file: File,
  userId: string,
  modelId: number,
): Promise<{ url: string; fileSize: number }> {
  const ext = extensionOf(file.name) || 'bin';
  const path = `models/${safeOwner(userId)}/${modelId}/media/${Date.now()}.${ext}`;
  const blob = await put(path, file, { access: 'public', addRandomSuffix: false });
  return { url: blob.url, fileSize: file.size };
}