// app/api/threed/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { 
  threedTasks, 
  threedPlantings,  // ✅ Add this
  threedPlants,     // ✅ Add this
  threedBeds,       // ✅ Add this
  threedWateringSchedules, // ✅ Add this
} from '@/libraries/schema/threed';
import { projectAssets } from '@/libraries/schema/project';
import { eq, and, or, asc, desc, ilike, sql, type SQL } from 'drizzle-orm';
import { ensureTableSequence } from '@/libraries/db/sequence';
import { databaseConnectionDiagnostic } from '@/libraries/db/connection-diagnostics';
import {
  isMissingTaskSortOrderColumn,
  isMissingTaskVisibilityColumn,
  readThreeDTasks,
  taskSortOrderUnavailable,
  taskVisibilityUnavailable,
} from '@/libraries/services/threed/tasks/read-scope';
import { isTaskSortOrder, reorderTasks, TASK_SORT_ORDER_LIMIT, taskSortOrderError } from '@/libraries/services/threed/tasks/sort-order';

export const dynamic = 'force-dynamic';
const taskReadHeaders = { 'Cache-Control': 'private, no-store' };
function migrationRequired(error: unknown) {
  if (isMissingTaskVisibilityColumn(error)) {
    return NextResponse.json({ success: false, error: taskVisibilityUnavailable }, { status: 503 });
  }
  if (isMissingTaskSortOrderColumn(error)) {
    return NextResponse.json({ success: false, error: taskSortOrderUnavailable }, { status: 503 });
  }
}

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
    const limit = Math.min(100, Math.max(1, Math.floor(Number(searchParams.get('limit')) || 50)));
    const rawOffset = Number(searchParams.get('offset'));
    const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
    // ✅ Get a single task by ID
    if (id) {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid task ID' },
          { status: 400 }
        );
      }

      const [task] = await readThreeDTasks(userId, 'catalog', async (scope, selection) => db
        .select(selection)
        .from(threedTasks)
        .where(and(eq(threedTasks.id, parsedId), scope))
        .limit(1));

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: task,
      }, { headers: taskReadHeaders });
    }

    type TaskStatus = NonNullable<(typeof threedTasks.$inferSelect)['status']>;
    type TaskPriority = NonNullable<(typeof threedTasks.$inferSelect)['priority']>;
    const conditions: SQL[] = [];

    const search = searchParams.get('search')?.trim();
    if (search) conditions.push(or(ilike(threedTasks.title, `%${search}%`), ilike(threedTasks.description, `%${search}%`))!);

    // ✅ Apply filters
    if (status) {
      conditions.push(eq(threedTasks.status, status as TaskStatus));
    }
    if (priority) {
      conditions.push(eq(threedTasks.priority, priority as TaskPriority));
    }
    if (type) {
      conditions.push(eq(threedTasks.type, type));
    }
    if (assignedTo) {
      conditions.push(eq(threedTasks.assignedTo, assignedTo));
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
          conditions.push(sql`${threedTasks.id} IN (${sql.join(taskIds)})`);
        } else {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: { limit, offset, total: 0 },
          }, { headers: taskReadHeaders });
        }
      }
    }

    const sortColumns = {
      title: threedTasks.title, type: threedTasks.type,
      assignedTo: threedTasks.assignedTo, isActive: threedTasks.isActive,
      priority: threedTasks.priority, status: threedTasks.status, dueDate: threedTasks.dueDate,
    };
    const sortKey = searchParams.get('sort');
    const sortColumn = sortKey && Object.prototype.hasOwnProperty.call(sortColumns, sortKey)
      ? sortColumns[sortKey as keyof typeof sortColumns] : null;
    const direction = searchParams.get('direction') === 'desc' ? sql`desc` : sql`asc`;

    const [countResult, tasks] = await readThreeDTasks(userId, 'catalog', async (scope, selection) => {
      const where = and(scope, ...conditions);
      const order = sortKey === 'sortOrder'
        ? (selection.sortOrder === threedTasks.sortOrder
          ? [sql`${threedTasks.sortOrder} ${direction}`, asc(threedTasks.title)]
          : [asc(threedTasks.title)])
        : sortColumn ? [sql`${sortColumn} ${direction} nulls last`] : [
          sql`CASE WHEN ${threedTasks.status} = 'pending' THEN 0 WHEN ${threedTasks.status} = 'in_progress' THEN 1 WHEN ${threedTasks.status} = 'completed' THEN 2 ELSE 3 END`,
          desc(threedTasks.createdAt),
        ];
      return Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(threedTasks).where(where),
        db.select(selection).from(threedTasks).where(where)
          .orderBy(...order, desc(threedTasks.id))
          .limit(limit)
          .offset(offset),
      ]);
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        limit,
        offset,
        total: countResult[0]?.count || 0,
      },
    }, { headers: taskReadHeaders });
  } catch (error) {
    console.error('[Tasks API] GET error:', databaseConnectionDiagnostic(error));
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

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }
    if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid Public Task value' }, { status: 400 });
    }
    if (body.sortOrder !== undefined && !isTaskSortOrder(body.sortOrder)) {
      return NextResponse.json({ success: false, error: taskSortOrderError }, { status: 400 });
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
      isPublic: body.isPublic ?? false,
      sortOrder: body.sortOrder ?? 0,
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

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Task created successfully',
    });
  } catch (error) {
    const unavailable = migrationRequired(error);
    if (unavailable) return unavailable;
    console.error('[Tasks API] POST error:', databaseConnectionDiagnostic(error));
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
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
    if (body.isPublic !== undefined && typeof body.isPublic !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid Public Task value' }, { status: 400 });
    }
    if (body.sortOrder !== undefined && !isTaskSortOrder(body.sortOrder)) {
      return NextResponse.json({ success: false, error: taskSortOrderError }, { status: 400 });
    }

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
    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic;
    }
    if (body.sortOrder !== undefined) {
      updateData.sortOrder = body.sortOrder;
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
    } else if (body.status !== undefined && body.status !== 'completed') {
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

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Task updated successfully',
    });
  } catch (error) {
    const unavailable = migrationRequired(error);
    if (unavailable) return unavailable;
    console.error('[Tasks API] PUT error:', databaseConnectionDiagnostic(error));
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = (await auth())?.user?.id;
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const move = await request.json().catch(() => null);
    const { sourceId, targetId, after } = move ?? {};
    if (!Number.isSafeInteger(sourceId) || sourceId < 1 || !Number.isSafeInteger(targetId) || targetId < 1 ||
        sourceId === targetId || typeof after !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid Task move' }, { status: 400 });
    }

    const outcome = await db.transaction(async tx => {
      const owned = eq(threedTasks.userId, userId);
      // Lock in ID order, then read the locked rows in their current display order.
      const locked = tx.$with('locked_tasks').as(
        tx.select({
          id: threedTasks.id,
          title: threedTasks.title,
          sortOrder: threedTasks.sortOrder,
        }).from(threedTasks).where(owned).orderBy(asc(threedTasks.id)).for('update'),
      );
      const tasks = await tx.with(locked).select({
        id: locked.id,
        sortOrder: locked.sortOrder,
      }).from(locked).orderBy(asc(locked.sortOrder), asc(locked.title), desc(locked.id));

      const reordered = reorderTasks(tasks, sourceId, targetId, after);
      if (!reordered) return 'not-found';
      if (reordered === tasks) return 'unchanged';
      if (reordered.length > TASK_SORT_ORDER_LIMIT + 1) return 'too-many';

      const changes = reordered.flatMap((task, index) => task.sortOrder === index ? [] : [{
        id: task.id,
        sort_order: index,
      }]);
      await tx.execute(sql`
        UPDATE ${threedTasks}
        SET sort_order = ranks.sort_order, updated_at = now()
        FROM jsonb_to_recordset(${JSON.stringify(changes)}::jsonb) AS ranks(id integer, sort_order integer)
        WHERE ${threedTasks.id} = ranks.id AND ${owned}
      `);
      return 'moved';
    });

    if (outcome === 'not-found') {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }
    if (outcome === 'too-many') {
      return NextResponse.json({ success: false, error: 'Too many Tasks to assign unique Sort Order values' }, { status: 409 });
    }
    return NextResponse.json({ success: true, changed: outcome === 'moved' });
  } catch (error) {
    const unavailable = migrationRequired(error);
    if (unavailable) return unavailable;
    console.error('[Tasks API] PATCH error:', databaseConnectionDiagnostic(error));
    return NextResponse.json({ success: false, error: 'Failed to reorder Tasks' }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    const unavailable = migrationRequired(error);
    if (unavailable) return unavailable;
    console.error('[Tasks API] DELETE error:', databaseConnectionDiagnostic(error));
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
