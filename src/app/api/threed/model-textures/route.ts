import { parseTextureListQuery } from '@/lib/services/threed/models/texture-list-query';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { del, put } from '@vercel/blob';
import { createThreeDBlobPath } from '@/lib/services/threed/models/model-blob-paths';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { ensureTableSequence } from '@/lib/db/sequence';
import { threedModelFiles, threedModelMaterialAssignments, threedModelTextures } from '@/lib/schema/threed';

export const runtime = 'nodejs';

const MAX_TEXTURE_BYTES = 32 * 1024 * 1024;
const SUPPORTED_TEXTURE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp']);

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query;
  try { query = parseTextureListQuery(new URL(request.url).searchParams); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid query' }, { status: 400 }); }
  if (query) {
    const { limit, offset, search, sort, direction } = query;
    const conditions = [eq(threedModelTextures.userId, session.user.id)];
    if (search) conditions.push(sql`(${threedModelTextures.textureName} ilike ${`%${search}%`}
      or ${threedModelTextures.fileName} ilike ${`%${search}%`}
      or ${threedModelTextures.mimeType} ilike ${`%${search}%`})`);
    const where = and(...conditions);
    const assignmentCount = sql<number>`(select count(*)::integer from ${threedModelMaterialAssignments} a
      where a.texture_id = ${threedModelTextures.id} and a.user_id = ${threedModelTextures.userId})`;
    const fileReferenceCount = sql<number>`(select count(*)::integer from ${threedModelFiles} f
      where f.file_path = ${threedModelTextures.filePath} and f.user_id = ${threedModelTextures.userId})`;
    const fields = { name: sql`lower(${threedModelTextures.textureName})`, fileName: sql`lower(${threedModelTextures.fileName})`,
      type: threedModelTextures.mimeType, references: sql`${assignmentCount} + ${fileReferenceCount}`,
      active: sql`case when ${threedModelTextures.isActive} then 0 else 1 end`, size: threedModelTextures.fileSize };
    const order = direction === 'asc' ? asc(fields[sort]) : desc(fields[sort]);
    const [count] = await db.select({ total: sql<number>`count(*)` }).from(threedModelTextures).where(where);
    const rows = await db.select({ ...getTableColumns(threedModelTextures), assignmentCount, fileReferenceCount })
      .from(threedModelTextures).where(where).orderBy(sql`${order} nulls last`, asc(threedModelTextures.id)).limit(limit).offset(offset);
    return NextResponse.json({ success: true, data: rows, pagination: { limit, offset, total: Number(count?.total ?? 0) } });
  }

  const [textures, assignments] = await Promise.all([
    db.select().from(threedModelTextures).where(eq(threedModelTextures.userId, session.user.id)).orderBy(asc(threedModelTextures.textureName)),
    db.select({ textureId: threedModelMaterialAssignments.textureId })
      .from(threedModelMaterialAssignments)
      .where(eq(threedModelMaterialAssignments.userId, session.user.id)),
  ]);
  const usage = assignments.reduce<Map<number, number>>((counts, assignment) => {
    counts.set(assignment.textureId, (counts.get(assignment.textureId) ?? 0) + 1);
    return counts;
  }, new Map());

  return NextResponse.json({
    success: true,
    data: textures.map((texture) => ({ ...texture, assignmentCount: usage.get(texture.id) ?? 0 })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const requestedName = formData.get('textureName');
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_TEXTURE_BYTES) {
    return NextResponse.json({ success: false, error: 'Choose a Texture file up to 32 MB' }, { status: 400 });
  }
  if (!SUPPORTED_TEXTURE_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, error: 'Texture must be PNG, JPG, WebP, or BMP' }, { status: 415 });
  }
  const textureName = typeof requestedName === 'string' && requestedName.trim()
    ? requestedName.trim().slice(0, 255)
    : file.name.replace(/\.[^.]+$/, '').slice(0, 255);
  const pathname = createThreeDBlobPath(session.user.id, 'textures', file.name, crypto.randomUUID());
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type,
  });

  try {
    await ensureTableSequence('threed_model_textures');
    const [texture] = await db.insert(threedModelTextures).values({
      userId: session.user.id,
      textureName,
      fileName: file.name,
      filePath: blob.url,
      fileSize: file.size,
      mimeType: file.type,
    }).returning();
    return NextResponse.json({ success: true, data: { ...texture, assignmentCount: 0 } }, { status: 201 });
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ success: false, error: 'Invalid Model Texture update' }, { status: 400 });
  }
  const body = input as Record<string, unknown>;
  const id = Number(body.id);
  const textureName = typeof body.textureName === 'string' ? body.textureName.trim() : null;
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : null;
  if (
    !Number.isSafeInteger(id) || id <= 0
    || Object.keys(body).some((key) => !['id', 'textureName', 'isActive'].includes(key))
    || (textureName === null && isActive === null)
    || (textureName !== null && (textureName.length < 1 || textureName.length > 255))
  ) {
    return NextResponse.json({ success: false, error: 'Invalid Model Texture update' }, { status: 400 });
  }
  const [updated] = await db.update(threedModelTextures).set({
    ...(textureName !== null ? { textureName } : {}),
    ...(isActive !== null ? { isActive } : {}),
    updatedAt: new Date(),
  }).where(and(
    eq(threedModelTextures.id, id),
    eq(threedModelTextures.userId, session.user.id),
  )).returning();
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Model Texture not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid Model Texture ID' }, { status: 400 });
  }
  const userId = session.user.id;
  const result = await db.transaction(async (tx) => {
    // Coordinate with shared-file linking so a Texture cannot disappear mid-link.
    const [texture] = await tx.select().from(threedModelTextures).where(and(
      eq(threedModelTextures.id, id), eq(threedModelTextures.userId, userId),
    )).limit(1).for('update');
    if (!texture) return { status: 404, error: 'Model Texture not found' };
    const [assignments, references] = await Promise.all([
      tx.select({ id: threedModelMaterialAssignments.id }).from(threedModelMaterialAssignments).where(eq(threedModelMaterialAssignments.textureId, id)).limit(1),
      tx.select({ id: threedModelFiles.id }).from(threedModelFiles).where(eq(threedModelFiles.filePath, texture.filePath)).limit(1),
    ]);
    if (assignments.length || references.length) return { status: 409, error: 'Model Texture is still referenced by one or more Models' };
    await tx.delete(threedModelTextures).where(and(eq(threedModelTextures.id, id), eq(threedModelTextures.userId, userId)));
    return { status: 200, filePath: texture.filePath };
  });
  if (result.error || !result.filePath) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  await del(result.filePath).catch(() => undefined);
  return NextResponse.json({ success: true });
}
