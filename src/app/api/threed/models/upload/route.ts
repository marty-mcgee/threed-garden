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
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
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