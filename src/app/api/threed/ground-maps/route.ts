import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { del, put } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { ensureTableSequence } from '@/lib/db/sequence';
import { project } from '@/lib/schema/project';
import { threedGroundMaps } from '@/lib/schema/threed';
import { createThreeDBlobPath } from '@/lib/services/threed/models/model-blob-paths';
import { getBulkLocalImageDimensions } from '@/lib/services/threed/models/model-image-limits-core';

export const runtime = 'nodejs';
const MAX_BYTES = 16 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function positiveId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function ownedProject(userId: string, projectId: number) {
  const [row] = await db.select({ id: project.id }).from(project).where(and(
    eq(project.id, projectId), eq(project.userId, userId),
  )).limit(1);
  return row ?? null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const projectId = positiveId(new URL(request.url).searchParams.get('projectId'));
  if (!projectId) return NextResponse.json({ success: false, error: 'Invalid Project ID' }, { status: 400 });
  if (!await ownedProject(session.user.id, projectId)) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  const [row] = await db.select().from(threedGroundMaps).where(and(
    eq(threedGroundMaps.projectId, projectId), eq(threedGroundMaps.userId, session.user.id),
  )).limit(1);
  return NextResponse.json({ success: true, data: row ?? null });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const projectId = positiveId(form.get('projectId'));
  const file = form.get('file');
  if (!projectId || !(file instanceof File) || file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Choose a Ground Map image up to 16 MB' }, { status: 400 });
  }
  if (!IMAGE_TYPES.has(file.type)) return NextResponse.json({ success: false, error: 'Ground Map must be PNG, JPG, or WebP' }, { status: 415 });
  if (!await ownedProject(session.user.id, projectId)) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  let dimensions: { width: number; height: number };
  try { dimensions = getBulkLocalImageDimensions(new Uint8Array(await file.arrayBuffer()), file.type); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid Ground Map image' }, { status: 400 }); }
  const clean = (value: FormDataEntryValue | null, limit: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : null;
  const name = clean(form.get('name'), 255) ?? file.name.replace(/\.[^.]+$/, '').slice(0, 255);
  const sourceProvider = clean(form.get('sourceProvider'), 120);
  const attribution = clean(form.get('attribution'), 1000);
  const blob = await put(createThreeDBlobPath(session.user.id, 'ground-maps', file.name, crypto.randomUUID()), file, {
    access: 'public', addRandomSuffix: false, contentType: file.type,
  });
  try {
    await ensureTableSequence('threed_ground_maps');
    const previous = await db.select({ filePath: threedGroundMaps.filePath }).from(threedGroundMaps).where(and(
      eq(threedGroundMaps.projectId, projectId), eq(threedGroundMaps.userId, session.user.id),
    )).limit(1);
    const [row] = await db.insert(threedGroundMaps).values({
      userId: session.user.id, projectId, name, fileName: file.name.slice(0, 255), filePath: blob.url,
      fileSize: file.size, mimeType: file.type, width: dimensions.width, height: dimensions.height,
      sourceProvider, attribution,
    }).onConflictDoUpdate({ target: threedGroundMaps.projectId, set: {
      name, fileName: file.name.slice(0, 255), filePath: blob.url, fileSize: file.size,
      mimeType: file.type, width: dimensions.width, height: dimensions.height,
      sourceProvider, attribution, updatedAt: new Date(),
    } }).returning();
    const oldPath = previous[0]?.filePath;
    if (oldPath && oldPath !== blob.url) await del(oldPath).catch(() => undefined);
    return NextResponse.json({ success: true, data: row }, { status: previous.length ? 200 : 201 });
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const projectId = positiveId(new URL(request.url).searchParams.get('projectId'));
  if (!projectId) return NextResponse.json({ success: false, error: 'Invalid Project ID' }, { status: 400 });
  const [row] = await db.delete(threedGroundMaps).where(and(
    eq(threedGroundMaps.projectId, projectId), eq(threedGroundMaps.userId, session.user.id),
  )).returning({ filePath: threedGroundMaps.filePath });
  if (!row) return NextResponse.json({ success: false, error: 'Ground Map not found' }, { status: 404 });
  await del(row.filePath).catch(() => undefined);
  return NextResponse.json({ success: true });
}
