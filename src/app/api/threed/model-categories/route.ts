import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  threedModelCategories,
  threedModelCategoryAssignments,
} from '@/lib/schema/threed';
import { ensureTableSequence } from '@/lib/db/sequence';

const CATEGORY_NAME_MAX = 120;

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length > 0 && name.length <= CATEGORY_NAME_MAX ? name : null;
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 && slug.length <= CATEGORY_NAME_MAX ? slug : null;
}

function normalizeOptionalDescription(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 1000) return undefined;
  return value.trim() || null;
}

async function getOwnedCategory(userId: string, id: number) {
  const [category] = await db
    .select()
    .from(threedModelCategories)
    .where(and(
      eq(threedModelCategories.id, id),
      eq(threedModelCategories.userId, userId),
    ))
    .limit(1);
  return category ?? null;
}

async function validateParent(userId: string, parentId: unknown, categoryId?: number) {
  if (parentId === undefined) return { valid: true as const, value: undefined };
  if (parentId === null || parentId === '') return { valid: true as const, value: null };
  const parsed = Number(parentId);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed === categoryId) {
    return { valid: false as const, error: 'Invalid parent category' };
  }
  const parent = await getOwnedCategory(userId, parsed);
  if (!parent) return { valid: false as const, error: 'Parent category not found' };

  let current: typeof parent | null = parent;
  const visited = new Set<number>();
  while (current) {
    if (current.id === categoryId || visited.has(current.id)) {
      return { valid: false as const, error: 'Category hierarchy cannot contain a cycle' };
    }
    visited.add(current.id);
    current = current.parentId ? await getOwnedCategory(userId, current.parentId) : null;
  }
  return { valid: true as const, value: parsed };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = parsePositiveInteger(new URL(request.url).searchParams.get('id'));
  if (new URL(request.url).searchParams.has('id') && !id) {
    return NextResponse.json({ success: false, error: 'Invalid id parameter' }, { status: 400 });
  }

  const conditions = [eq(threedModelCategories.userId, session.user.id)];
  if (id) conditions.push(eq(threedModelCategories.id, id));
  const categories = await db
    .select()
    .from(threedModelCategories)
    .where(and(...conditions))
    .orderBy(asc(threedModelCategories.sortOrder), asc(threedModelCategories.name));

  if (id && categories.length === 0) {
    return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: id ? categories[0] : categories });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const name = normalizeName(body.name);
  const slug = normalizeSlug(body.slug ?? body.name);
  const description = normalizeOptionalDescription(body.description);
  if (!name || !slug || description === undefined) {
    return NextResponse.json({ success: false, error: 'Invalid category name, slug, or description' }, { status: 400 });
  }
  const parent = await validateParent(session.user.id, body.parentId);
  if (!parent.valid) {
    return NextResponse.json({ success: false, error: parent.error }, { status: 400 });
  }
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder) || Math.abs(sortOrder) > 1_000_000) {
    return NextResponse.json({ success: false, error: 'Invalid sort order' }, { status: 400 });
  }

  try {
    await ensureTableSequence('threed_model_categories');
    const [category] = await db.insert(threedModelCategories).values({
      userId: session.user.id,
      parentId: parent.value ?? null,
      name,
      slug,
      description,
      sortOrder,
      isActive: body.isActive ?? true,
    }).returning();
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
      return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 409 });
    }
    console.error('Failed to create ThreeD Model category', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}

async function updateCategory(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = parsePositiveInteger(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ success: false, error: 'Invalid id parameter' }, { status: 400 });
  if (!await getOwnedCategory(session.user.id, id)) {
    return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
  }
  const body = await request.json();
  const updates: Partial<typeof threedModelCategories.$inferInsert> = { updatedAt: new Date() };
  if ('name' in body) {
    const name = normalizeName(body.name);
    if (!name) return NextResponse.json({ success: false, error: 'Invalid category name' }, { status: 400 });
    updates.name = name;
  }
  if ('slug' in body) {
    const slug = normalizeSlug(body.slug);
    if (!slug) return NextResponse.json({ success: false, error: 'Invalid category slug' }, { status: 400 });
    updates.slug = slug;
  }
  if ('description' in body) {
    const description = normalizeOptionalDescription(body.description);
    if (description === undefined) return NextResponse.json({ success: false, error: 'Invalid category description' }, { status: 400 });
    updates.description = description;
  }
  if ('parentId' in body) {
    const parent = await validateParent(session.user.id, body.parentId, id);
    if (!parent.valid) return NextResponse.json({ success: false, error: parent.error }, { status: 400 });
    updates.parentId = parent.value ?? null;
  }
  if ('sortOrder' in body) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder) || Math.abs(sortOrder) > 1_000_000) {
      return NextResponse.json({ success: false, error: 'Invalid sort order' }, { status: 400 });
    }
    updates.sortOrder = sortOrder;
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') return NextResponse.json({ success: false, error: 'Invalid active state' }, { status: 400 });
    updates.isActive = body.isActive;
  }

  try {
    const [category] = await db.update(threedModelCategories).set(updates).where(and(
      eq(threedModelCategories.id, id),
      eq(threedModelCategories.userId, session.user.id),
    )).returning();
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === '23505') {
      return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 409 });
    }
    console.error('Failed to update ThreeD Model category', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

export const PUT = updateCategory;
export const PATCH = updateCategory;

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = parsePositiveInteger(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ success: false, error: 'Invalid id parameter' }, { status: 400 });
  if (!await getOwnedCategory(session.user.id, id)) {
    return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
  }
  const [child] = await db.select({ id: threedModelCategories.id }).from(threedModelCategories).where(and(
    eq(threedModelCategories.userId, session.user.id),
    eq(threedModelCategories.parentId, id),
  )).limit(1);
  if (child) {
    return NextResponse.json({ success: false, error: 'Move or delete child categories first' }, { status: 409 });
  }
  await db.delete(threedModelCategoryAssignments).where(and(
    eq(threedModelCategoryAssignments.userId, session.user.id),
    eq(threedModelCategoryAssignments.categoryId, id),
  ));
  await db.delete(threedModelCategories).where(and(
    eq(threedModelCategories.id, id),
    eq(threedModelCategories.userId, session.user.id),
  ));
  return NextResponse.json({ success: true });
}
