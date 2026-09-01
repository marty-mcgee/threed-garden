import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threedModels } from '@/lib/schema/threed';
import {
  inspectThreeDGltfStructure,
  parseThreeDGlbJsonChunk,
} from '@/lib/services/threed/models/gltf-runtime-inspection-core';
import { readThreeDModelRuntimeAdapterKey } from '@/lib/services/threed/models/model-runtime-adapter-core';
import { inspectThreeDFbxStructure } from '@/lib/services/threed/models/fbx-runtime-inspection-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_GLTF_JSON_BYTES = 16 * 1024 * 1024;
const MAX_FBX_BYTES = 256 * 1024 * 1024;
const INSPECTION_TIMEOUT_MS = 60_000;

function parsePositiveId(value: string | null): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseComponentPage(searchParams: URLSearchParams) {
  const rawOffset = searchParams.get('componentOffset') ?? '0';
  const rawLimit = searchParams.get('componentLimit') ?? '100';
  const offset = Number(rawOffset);
  const limit = Number(rawLimit);
  const search = searchParams.get('componentSearch');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) return null;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) return null;
  if (search != null && (search.length > 120 || /[\u0000-\u001f\u007f]/.test(search))) return null;
  return { offset, limit, search };
}

async function readBoundedResponse(response: Response, maximumBytes: number): Promise<Uint8Array> {
  if (!response.ok) throw new Error(`Model source returned HTTP ${response.status}`);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error('Model structure exceeds inspection limit');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Model source has no response body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximumBytes) {
      await reader.cancel();
      throw new Error('Model structure exceeds inspection limit');
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function readResponsePrefix(response: Response, requiredBytes: number): Promise<Uint8Array> {
  if (!response.ok) throw new Error(`Model source returned HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Model source has no response body');
  const result = new Uint8Array(requiredBytes);
  let offset = 0;
  while (offset < requiredBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = requiredBytes - offset;
    const portion = value.subarray(0, remaining);
    result.set(portion, offset);
    offset += portion.byteLength;
  }
  await reader.cancel();
  if (offset < requiredBytes) throw new Error('Model source ended before its declared structure');
  return result;
}

async function loadGltfDocument(filePath: string, modelType: 'glb' | 'gltf'): Promise<unknown> {
  const url = new URL(filePath);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) {
    throw new Error('Model source URL is not inspectable');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSPECTION_TIMEOUT_MS);
  try {
    if (modelType === 'gltf') {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      const bytes = await readBoundedResponse(response, MAX_GLTF_JSON_BYTES);
      return JSON.parse(new TextDecoder().decode(bytes));
    }

    const headerResponse = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Range: 'bytes=0-19' },
    });
    const header = await readResponsePrefix(headerResponse, 20);
    const jsonLength = new DataView(header.buffer, header.byteOffset, header.byteLength).getUint32(12, true);
    if (jsonLength <= 0 || jsonLength > MAX_GLTF_JSON_BYTES - 20) {
      throw new Error('GLB JSON chunk exceeds inspection limit');
    }
    const jsonResponse = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Range: `bytes=0-${19 + jsonLength}` },
    });
    return parseThreeDGlbJsonChunk(await readResponsePrefix(jsonResponse, 20 + jsonLength));
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const searchParams = new URL(request.url).searchParams;
  const id = parsePositiveId(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'Invalid Model ID' }, { status: 400 });
  }
  const componentPage = parseComponentPage(searchParams);
  if (!componentPage) {
    return NextResponse.json({ success: false, error: 'Invalid component page query' }, { status: 400 });
  }

  const [model] = await db.select().from(threedModels).where(and(
    eq(threedModels.id, id),
    or(
      eq(threedModels.userId, session.user.id),
      and(
        eq(threedModels.isPublic, true),
        eq(threedModels.isLibraryItem, true),
        eq(threedModels.isActive, true),
        eq(threedModels.status, 'active'),
      ),
    ),
  )).limit(1);
  if (!model) {
    return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
  }
  if (model.modelType !== 'glb' && model.modelType !== 'gltf' && model.modelType !== 'fbx') {
    return NextResponse.json({
      success: false,
      error: `Runtime inspection does not yet support ${model.modelType.toUpperCase()} Models`,
      supportedModelTypes: ['glb', 'gltf', 'fbx'],
    }, { status: 422 });
  }

  try {
    let inspection;
    if (model.modelType === 'fbx') {
      if (model.fileSize != null && model.fileSize > MAX_FBX_BYTES) {
        throw new Error('FBX file exceeds inspection limit');
      }
      const url = new URL(model.filePath);
      if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) {
        throw new Error('Model source URL is not inspectable');
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), INSPECTION_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const bytes = await readBoundedResponse(response, MAX_FBX_BYTES);
        const ownedBytes = new Uint8Array(bytes.byteLength);
        ownedBytes.set(bytes);
        inspection = inspectThreeDFbxStructure(ownedBytes.buffer, componentPage);
      } finally {
        clearTimeout(timeout);
      }
    } else {
      const document = await loadGltfDocument(model.filePath, model.modelType);
      inspection = inspectThreeDGltfStructure(document, componentPage);
    }
    return NextResponse.json({
      success: true,
      data: {
        model: {
          id: model.id,
          modelName: model.modelName,
          modelType: model.modelType,
          runtimeAdapterKey: readThreeDModelRuntimeAdapterKey(model.metadata),
        },
        inspection,
      },
    });
  } catch (error) {
    console.error('Failed to inspect ThreeD Model runtime structure', {
      modelId: model.id,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to inspect Model structure',
    }, { status: 422 });
  }
}
