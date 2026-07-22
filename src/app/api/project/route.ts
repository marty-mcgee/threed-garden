// app/api/project/route.ts - Updated to filter by user

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { project } from '@/lib/schema/project';
import { eq, and, desc } from 'drizzle-orm';

// ============================================
// GET /api/project - List all projects for the current user
// Query Parameters:
//   - id (optional): Get a single project by ID
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // ✅ Get a single project by ID (must belong to user)
    if (id) {
      const [singleProject] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.id, parseInt(id)),
            eq(project.userId, userId)
          )
        )
        .limit(1);

      if (!singleProject) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: singleProject,
      });
    }

    // ✅ List all projects for the current user only
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt));

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/project - Create a new project
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const [newProject] = await db
      .insert(project)
      .values({
        userId,
        name,
        description: description || null,
        slug,
        isPublic: isPublic || false,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/project - Update a project
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isPublic, isActive } = body;

    const userId = session.user.id;

    // ✅ Verify project exists and belongs to user
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [updatedProject] = await db
      .update(project)
      .set({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/project - Delete a project
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Verify project exists and belongs to user
    const [existing] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .delete(project)
      .where(
        and(
          eq(project.id, parseInt(id)),
          eq(project.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}