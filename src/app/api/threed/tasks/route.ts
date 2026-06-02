// src/app/api/threed/tasks/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedTasks, threedPlantings, threedPlants, threedBeds } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/tasks - List tasks with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const type = searchParams.get('type');
  const plantingId = searchParams.get('plantingId');
  
  try {
    let conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(threedTasks.status, status as any));
    }
    
    if (priority && priority !== 'all') {
      conditions.push(eq(threedTasks.priority, priority as any));
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(threedTasks.type, type));
    }
    
    if (plantingId) {
      conditions.push(eq(threedTasks.plantingId, parseInt(plantingId)));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const tasks = await db
      .select({
        task: threedTasks,
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedTasks)
      .leftJoin(threedPlantings, eq(threedTasks.plantingId, threedPlantings.id))
      .leftJoin(threedPlants, eq(threedTasks.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedTasks.bedId, threedBeds.id))
      .where(whereClause)
      .orderBy(sql`${threedTasks.dueDate} ASC NULLS LAST`)
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/tasks - Create new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate taskId if not provided
    if (!body.taskId) {
      const type = body.type || 'task';
      const date = new Date().toISOString().split('T')[0];
      body.taskId = `${type}-${date}-${Date.now()}`;
    }
    
    const newTask = await db.insert(threedTasks).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Fetch the complete task with related data
    const completeTask = await db
      .select({
        task: threedTasks,
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedTasks)
      .leftJoin(threedPlantings, eq(threedTasks.plantingId, threedPlantings.id))
      .leftJoin(threedPlants, eq(threedTasks.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedTasks.bedId, threedBeds.id))
      .where(eq(threedTasks.id, newTask[0].id))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      data: completeTask[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/tasks/:id - Update task
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedTasks)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedTasks.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/tasks/:id - Delete task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedTasks)
      .where(eq(threedTasks.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/threed/tasks/:id/complete - Mark task as completed
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }
    
    const updated = await db
      .update(threedTasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(threedTasks.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks Complete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}