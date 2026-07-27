// app/api/threed/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { 
  threedTasks, 
  threedPlantings,  // ✅ Add this
  threedPlants,     // ✅ Add this
  threedBeds,       // ✅ Add this
  threedWateringSchedules, // ✅ Add this
} from '@/lib/schema/threed';
import { projectAssets } from '@/lib/schema/project';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { ensureTableSequence } from '@/lib/db/sequence';

// ============================================
// GET /api/threed/tasks
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const moduleId = searchParams.get('moduleId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const assignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Get a single task by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid task ID' },
          { status: 400 }
        );
      }

      let query = db
        .select()
        .from(threedTasks)
        .where(eq(threedTasks.id, parsedId));

      if (!userId) {
        query = query.where(eq(threedTasks.status, 'pending'));
      } else {
        query = query.where(
          or(
            eq(threedTasks.userId, userId),
            eq(threedTasks.status, 'pending')
          )
        );
      }

      const [task] = await query.limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: task,
      });
    }

    // ✅ Build query for listing tasks
    let query = db
      .select()
      .from(threedTasks)
      .$dynamic();

    if (!userId) {
      query = query.where(eq(threedTasks.status, 'pending'));
    } else {
      query = query.where(
        or(
          eq(threedTasks.userId, userId),
          eq(threedTasks.status, 'pending')
        )
      );
    }

    // ✅ Apply filters
    if (status) {
      query = query.where(eq(threedTasks.status, status));
    }
    if (priority) {
      query = query.where(eq(threedTasks.priority, priority));
    }
    if (type) {
      query = query.where(eq(threedTasks.type, type));
    }
    if (assignedTo) {
      query = query.where(eq(threedTasks.assignedTo, assignedTo));
    }

    // ✅ Filter by moduleId via project_assets
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (!isNaN(parsedModuleId)) {
        const assetLinks = await db
          .select({ assetId: projectAssets.assetId })
          .from(projectAssets)
          .where(
            and(
              eq(projectAssets.moduleId, parsedModuleId),
              eq(projectAssets.moduleType, 'threed'),
              eq(projectAssets.assetType, 'threed_tasks'),
              eq(projectAssets.userId, userId || '')
            )
          );

        const taskIds = assetLinks.map((link) => link.assetId);
        if (taskIds.length > 0) {
          query = query.where(sql`${threedTasks.id} IN (${sql.join(taskIds)})`);
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          });
        }
      }
    }

    // ✅ Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(threedTasks)
      .where(query._where);

    const tasks = await query
      .orderBy(
        sql`CASE WHEN ${threedTasks.status} = 'pending' THEN 0 WHEN ${threedTasks.status} = 'in_progress' THEN 1 WHEN ${threedTasks.status} = 'completed' THEN 2 ELSE 3 END`,
        desc(threedTasks.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Tasks API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/threed/tasks - Create a new task
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

    const userId = session.user.id;
    const body = await request.json();

    console.log('[Tasks API] POST - Received body:', body);
    console.log('[Tasks API] dueDate type:', typeof body.dueDate);
    console.log('[Tasks API] dueDate value:', body.dueDate);
    console.log('[Tasks API] dueDate === undefined:', body.dueDate === undefined);
    console.log('[Tasks API] dueDate === null:', body.dueDate === null);

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    // ✅ Generate taskId
    const taskId = body.taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await ensureTableSequence('threed_tasks');

    // ✅ Build values object - start with required fields only
    const values: any = {
      userId,
      taskId,
      title: body.title.trim(),
      description: body.description || null,
      type: body.type || null,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      assignedTo: body.assignedTo || null,
      notes: body.notes || null,
    };

    // ✅ Handle dueDate - only if provided and valid
    if (body.dueDate !== undefined) {
      values.dueDate = (body.dueDate && body.dueDate !== '') ? body.dueDate : null;
    }

    // ✅ completedAt should ALWAYS be null on creation
    values.completedAt = null;

    // ✅ Only add foreign key fields if they have valid values AND the referenced records exist
    // We'll check existence before adding them
    const foreignKeyChecks = [];

    if (body.plantingId && body.plantingId !== '' && !isNaN(parseInt(body.plantingId))) {
      const plantingId = parseInt(body.plantingId);
      // ✅ Check if the planting exists
      const [planting] = await db
        .select({ id: threedPlantings.id })
        .from(threedPlantings)
        .where(eq(threedPlantings.id, plantingId))
        .limit(1);
      if (planting) {
        values.plantingId = plantingId;
      } else {
        console.log('[Tasks API] Warning: plantingId', plantingId, 'not found, skipping');
      }
    }

    if (body.plantId && body.plantId !== '' && !isNaN(parseInt(body.plantId))) {
      const plantId = parseInt(body.plantId);
      const [plant] = await db
        .select({ id: threedPlants.id })
        .from(threedPlants)
        .where(eq(threedPlants.id, plantId))
        .limit(1);
      if (plant) {
        values.plantId = plantId;
      } else {
        console.log('[Tasks API] Warning: plantId', plantId, 'not found, skipping');
      }
    }

    if (body.bedId && body.bedId !== '' && !isNaN(parseInt(body.bedId))) {
      const bedId = parseInt(body.bedId);
      const [bed] = await db
        .select({ id: threedBeds.id })
        .from(threedBeds)
        .where(eq(threedBeds.id, bedId))
        .limit(1);
      if (bed) {
        values.bedId = bedId;
      } else {
        console.log('[Tasks API] Warning: bedId', bedId, 'not found, skipping');
      }
    }

    if (body.wateringScheduleId && body.wateringScheduleId !== '' && !isNaN(parseInt(body.wateringScheduleId))) {
      const scheduleId = parseInt(body.wateringScheduleId);
      const [schedule] = await db
        .select({ id: threedWateringSchedules.id })
        .from(threedWateringSchedules)
        .where(eq(threedWateringSchedules.id, scheduleId))
        .limit(1);
      if (schedule) {
        values.wateringScheduleId = scheduleId;
      } else {
        console.log('[Tasks API] Warning: wateringScheduleId', scheduleId, 'not found, skipping');
      }
    }

    console.log('[Tasks API] Inserting values:', values);

    const [newTask] = await db
      .insert(threedTasks)
      .values(values)
      .returning();

    // ✅ If moduleId is provided, create project_assets association
    if (body.moduleId) {
      const parsedModuleId = parseInt(body.moduleId);
      if (!isNaN(parsedModuleId)) {
        await ensureTableSequence('project_assets');
        await db.insert(projectAssets).values({
          userId,
          projectId: null,
          moduleId: parsedModuleId,
          moduleType: 'threed',
          assetType: 'threed_tasks',
          assetId: newTask.id,
          config: {},
          isActive: true,
        });
        console.log('[Tasks API] Created project_assets association for task:', newTask.id);
      }
    }

    console.log('[Tasks API] Created task:', newTask.id, newTask.title);

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('[Tasks API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/threed/tasks - Update a task
// ============================================
export async function PUT(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing task ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedTasks)
      .where(
        and(
          eq(threedTasks.id, parsedId),
          eq(threedTasks.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('[Tasks API] PUT - Updating task:', parsedId, body);
    console.log('[Tasks API] dueDate type:', typeof body.dueDate);
    console.log('[Tasks API] dueDate value:', body.dueDate);
    console.log('[Tasks API] dueDate === undefined:', body.dueDate === undefined);
    console.log('[Tasks API] dueDate === null:', body.dueDate === null);

    // ✅ Build updateData with ONLY fields that are explicitly provided
    const updateData: any = { updatedAt: new Date() };

    // ✅ Only add fields if they exist in the request body
    if (body.title !== undefined) {
      updateData.title = body.title?.trim() || existing.title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.type !== undefined) {
      updateData.type = body.type || null;
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // ✅ Handle dueDate - only if explicitly provided
    if (body.dueDate !== undefined) {
      updateData.dueDate = (body.dueDate && body.dueDate !== '') ? body.dueDate : null;
    }

    // ✅ Handle completion date
    if (body.status === 'completed' && existing.status !== 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (body.status !== 'completed') {
      updateData.completedAt = null;
    }

    // ✅ Only update foreign key fields if they're provided
    if (body.plantingId !== undefined) {
      updateData.plantingId = (body.plantingId && body.plantingId !== '' && !isNaN(parseInt(body.plantingId))) 
        ? parseInt(body.plantingId) 
        : null;
    }
    if (body.plantId !== undefined) {
      updateData.plantId = (body.plantId && body.plantId !== '' && !isNaN(parseInt(body.plantId))) 
        ? parseInt(body.plantId) 
        : null;
    }
    if (body.bedId !== undefined) {
      updateData.bedId = (body.bedId && body.bedId !== '' && !isNaN(parseInt(body.bedId))) 
        ? parseInt(body.bedId) 
        : null;
    }
    if (body.wateringScheduleId !== undefined) {
      updateData.wateringScheduleId = (body.wateringScheduleId && body.wateringScheduleId !== '' && !isNaN(parseInt(body.wateringScheduleId))) 
        ? parseInt(body.wateringScheduleId) 
        : null;
    }

    console.log('[Tasks API] Updating with values:', updateData);

    const [updated] = await db
      .update(threedTasks)
      .set(updateData)
      .where(
        and(
          eq(threedTasks.id, parsedId),
          eq(threedTasks.userId, userId)
        )
      )
      .returning();

    console.log('[Tasks API] Updated task:', updated.id, updated.title);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('[Tasks API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/threed/tasks - Delete a task
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

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing task ID' },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(threedTasks)
      .where(
        and(
          eq(threedTasks.id, parsedId),
          eq(threedTasks.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // ✅ Delete project_assets associations
    await db
      .delete(projectAssets)
      .where(
        and(
          eq(projectAssets.assetType, 'threed_tasks'),
          eq(projectAssets.assetId, parsedId),
          eq(projectAssets.userId, userId)
        )
      );

    // ✅ Delete the task
    const [deleted] = await db
      .delete(threedTasks)
      .where(
        and(
          eq(threedTasks.id, parsedId),
          eq(threedTasks.userId, userId)
        )
      )
      .returning();

    console.log('[Tasks API] Deleted task:', deleted.id, deleted.title);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('[Tasks API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}