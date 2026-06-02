// src/app/api/threed/tasks/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedTasks } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Total tasks
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks);
    
    // Pending tasks
    const pending = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'pending'`);
    
    // In progress
    const inProgress = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'in_progress'`);
    
    // Completed
    const completed = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'completed'`);
    
    // Overdue
    const overdue = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.dueDate} < NOW() AND ${threedTasks.status} NOT IN ('completed', 'cancelled')`);
    
    // By priority - using SQL CASE in orderBy
    const byPriority = await db
      .select({
        priority: threedTasks.priority,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedTasks)
      .where(sql`${threedTasks.status} != 'completed'`)
      .groupBy(threedTasks.priority)
      .orderBy(sql`
        CASE ${threedTasks.priority}
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
      `);
    
    // By type
    const byType = await db
      .select({
        type: threedTasks.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedTasks)
      .where(sql`${threedTasks.status} != 'completed'`)
      .groupBy(threedTasks.type)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        total: Number(total[0]?.count) || 0,
        pending: Number(pending[0]?.count) || 0,
        inProgress: Number(inProgress[0]?.count) || 0,
        completed: Number(completed[0]?.count) || 0,
        overdue: Number(overdue[0]?.count) || 0,
        byPriority: byPriority.map((row) => ({
          priority: row.priority,
          count: Number(row.count),
        })),
        byType: byType.map((row) => ({
          type: row.type,
          count: Number(row.count),
        })),
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}