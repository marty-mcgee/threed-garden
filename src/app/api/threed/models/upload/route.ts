// src/app/api/threed/models/upload/route.ts — v0.16.4-alpha
// Standalone model-file upload for the create flow: uploads the primary GLB/GLTF/FBX/OBJ
// file to Vercel Blob and returns its public URL + inferred metadata (no DB write yet).
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';

const EXT_TO_TYPE: Record<string, string> = {
  glb: 'glb',
  gltf: 'gltf',
  fbx: 'fbx',
  obj: 'obj',
  usdz: 'usdz',
};

const THUMBNAIL_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const THUMBNAIL_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

async function hasExpectedThumbnailSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((value, index) => bytes[index] === value);
  }
  if (file.type === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

function extensionOf(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose') === 'thumbnail' ? 'thumbnail' : 'model';
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (purpose === 'thumbnail') {
      const suppliedExtension = extensionOf(file.name);
      const extension = THUMBNAIL_MIME_TO_EXTENSION[file.type];
      if (!extension || !THUMBNAIL_EXTENSIONS.has(suppliedExtension)) {
        return NextResponse.json(
          { success: false, error: 'Preview image must be a JPG, PNG, or WebP file' },
          { status: 400 },
        );
      }
      if (file.size <= 0 || file.size > MAX_THUMBNAIL_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Preview image must be between 1 byte and 5 MB' },
          { status: 400 },
        );
      }
      if (!(await hasExpectedThumbnailSignature(file))) {
        return NextResponse.json(
          { success: false, error: 'Preview image contents do not match the selected image format' },
          { status: 400 },
        );
      }

      const path = `models/${session.user.id}/previews/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const blob = await put(path, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
      });

      return NextResponse.json({
        success: true,
        data: {
          purpose,
          url: blob.url,
          fileSize: file.size,
          extension,
          fileName: file.name,
        },
      });
    }

    const ext = extensionOf(file.name) || 'glb';
    const modelType = EXT_TO_TYPE[ext] || 'custom';
    const path = `models/${session.user.id}/upload/${Date.now()}.${ext}`;

    const blob = await put(path, file, { access: 'public', addRandomSuffix: false });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        fileSize: file.size,
        extension: ext,
        modelType,
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error('Error uploading model file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload model file', details: String(error) },
      { status: 500 }
    );
  }
}
