import 'server-only';
import type { Metadata, ResolvedMetadata } from 'next';
import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { metaTagsOverrides, readProjectMetaTags } from '@/libraries/config/meta-tags';

/** Select only the config of a published Project or the viewer's own Project. */
export async function readProjectHtmlMetadata(projectId: unknown, viewerId?: string): Promise<Metadata> {
  if (typeof projectId !== 'string' || !/^[1-9]\d*$/.test(projectId) || !Number.isSafeInteger(Number(projectId))) return {};
  const [row] = await db.select({ config: project.config }).from(project).where(and(
    eq(project.id, Number(projectId)),
    or(
      and(eq(project.isPublic, true), eq(project.isActive, true)),
      viewerId ? eq(project.userId, viewerId) : sql`false`,
    ),
  )).limit(1);
  return row ? metaTagsOverrides(readProjectMetaTags(row.config)) : {};
}

export function inheritProjectMetadata(overrides: Metadata, parent: ResolvedMetadata): Metadata {
  return {
    ...overrides,
    ...(overrides.openGraph ? { openGraph: { ...parent.openGraph, ...overrides.openGraph } as Metadata['openGraph'] } : {}),
    ...(overrides.twitter ? { twitter: { ...parent.twitter, ...overrides.twitter } as Metadata['twitter'] } : {}),
  };
}
