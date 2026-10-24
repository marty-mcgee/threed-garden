import { NextRequest, NextResponse } from 'next/server';
import { and, asc, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';

// Summaries only: never send arbitrary Project configuration to an Admin list.
const length = (key: string) => sql<number>`case when jsonb_typeof(${project.config}->'threeDArchitecture'->'document'->${key}) = 'array' then jsonb_array_length(${project.config}->'threeDArchitecture'->'document'->${key}) else 0 end`;
const walls = length('walls'), floors = length('floors'), roofs = length('roofs');
const openings = sql<number>`(${length('openings')} + ${length('roofOpenings')})`;
const objects = sql<number>`(${walls} + ${floors} + ${roofs} + ${openings})`;
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return reply({ error: 'Unauthorized' }, 401);
  const params = request.nextUrl.searchParams;
  const search = params.get('search') ?? '';
  const active = params.get('active') ?? 'all', visibility = params.get('visibility') ?? 'all', content = params.get('content') ?? 'all';
  const sort = params.get('sort') ?? 'updatedAt', direction = params.get('direction') ?? 'desc';
  const offsetText = params.get('offset') ?? '0', offset = Number(offsetText);
  if (search.length > 200 || !['all', 'active', 'inactive'].includes(active) || !['all', 'public', 'private'].includes(visibility)
    || !['all', 'saved', 'empty'].includes(content) || !['name', 'updatedAt'].includes(sort) || !['asc', 'desc'].includes(direction)
    || !/^\d+$/.test(offsetText) || !Number.isSafeInteger(offset) || offset > 2147483647) return reply({ error: 'Invalid Designs filters.' }, 400);
  try {
    const scope = and(eq(project.userId, session.user.id),
      search ? ilike(project.name, `%${search.replace(/[\\%_]/g, '\\$&')}%`) : undefined,
      active === 'all' ? undefined : sql`${project.isActive} is ${active === 'active' ? sql`true` : sql`not true`}`,
      visibility === 'all' ? undefined : sql`${project.isPublic} is ${visibility === 'public' ? sql`true` : sql`not true`}`,
      content === 'all' ? undefined : content === 'saved' ? sql`${objects} > 0` : sql`${objects} = 0`);
    const [totalRow] = await db.select({ total: count() }).from(project).where(scope);
    const total = totalRow?.total ?? 0;
    const effectiveOffset = Math.min(offset, Math.max(0, Math.floor((total - 1) / 50) * 50));
    const order = direction === 'asc' ? asc : desc;
    const projects = await db.select({ id: project.id, name: project.name, isActive: project.isActive, isPublic: project.isPublic,
      updatedAt: project.updatedAt, walls, floors, roofs, openings }).from(project).where(scope)
      .orderBy(order(sort === 'name' ? project.name : project.updatedAt), asc(project.id)).limit(50).offset(effectiveOffset);
    return reply({ projects, total, offset: effectiveOffset });
  } catch {
    return reply({ error: 'Designs could not be loaded. Please try again.' }, 500);
  }
}
