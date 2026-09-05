import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { music } from '@/lib/schema/music';
import { project, projectMusic, projectThreed, projectTraffic } from '@/lib/schema/project';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { getProjectTemplate } from '@/lib/services/project/project-templates';

const MAX_PROJECT_NAME_LENGTH = 120;
const MAX_PROJECT_DESCRIPTION_LENGTH = 2_000;

function boundedText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) return null;
  return normalized;
}

function createSlug(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'project';
  return `${base}-${randomUUID()}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const allowedKeys = new Set(['name', 'description', 'isPublic', 'templateKey']);
    if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
      return NextResponse.json({ success: false, error: 'Unexpected request field' }, { status: 400 });
    }

    const name = boundedText(input.name, MAX_PROJECT_NAME_LENGTH);
    const description = input.description === undefined || input.description === ''
      ? ''
      : boundedText(input.description, MAX_PROJECT_DESCRIPTION_LENGTH);
    const template = getProjectTemplate(input.templateKey);
    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required and must not exceed 120 characters' }, { status: 400 });
    }
    if (description === null) {
      return NextResponse.json({ success: false, error: 'Project description must not exceed 2,000 characters' }, { status: 400 });
    }
    if (!template) {
      return NextResponse.json({ success: false, error: 'Unknown Project template' }, { status: 400 });
    }
    if (typeof input.isPublic !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Project visibility is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const isPublic = input.isPublic;
    const created = await db.transaction(async (tx) => {
      const [createdProject] = await tx.insert(project).values({
        userId,
        name,
        description: description || null,
        slug: createSlug(name),
        isActive: true,
        isPublic,
        metadata: { projectTemplateKey: template.key },
      }).returning();

      const moduleIds: Partial<Record<'threed' | 'traffic' | 'music', number>> = {};
      const moduleDescription = `Created from the ${template.name} Project template.`;

      if (template.modules.includes('threed')) {
        const [createdModule] = await tx.insert(threed).values({
          userId,
          name: `${name} ThreeD`,
          description: moduleDescription,
          slug: createSlug(`${name}-threed`),
          isActive: true,
          isPublic,
          config: {},
          metadata: { projectTemplateKey: template.key },
        }).returning({ id: threed.id });
        moduleIds.threed = createdModule.id;
        await tx.insert(projectThreed).values({ userId, projectId: createdProject.id, threedId: createdModule.id });
      }

      if (template.modules.includes('traffic')) {
        const [createdModule] = await tx.insert(traffic).values({
          userId,
          name: `${name} Traffic`,
          description: moduleDescription,
          slug: createSlug(`${name}-traffic`),
          isActive: true,
          isPublic,
          config: {},
          metadata: { projectTemplateKey: template.key },
        }).returning({ id: traffic.id });
        moduleIds.traffic = createdModule.id;
        await tx.insert(projectTraffic).values({ userId, projectId: createdProject.id, trafficId: createdModule.id });
      }

      if (template.modules.includes('music')) {
        const [createdModule] = await tx.insert(music).values({
          userId,
          name: `${name} Music`,
          description: moduleDescription,
          slug: createSlug(`${name}-music`),
          isActive: true,
          isPublic,
          config: {},
          metadata: { projectTemplateKey: template.key },
        }).returning({ id: music.id });
        moduleIds.music = createdModule.id;
        await tx.insert(projectMusic).values({ userId, projectId: createdProject.id, musicId: createdModule.id });
      }

      return { project: createdProject, templateKey: template.key, moduleIds };
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Project template creation failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Failed to create Project from template' }, { status: 500 });
  }
}
