// src/app/api/threed/tasks/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/libraries/db/client';
import { auth } from '@/libraries/auth';
import { databaseConnectionDiagnostic } from '@/libraries/db/connection-diagnostics';
import { threedTasks } from '@/libraries/schema/threed';
import { readThreeDTasks } from '@/libraries/services/threed/tasks/read-scope';
import { and, eq, sql, type SQL } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function readStats(scope: SQL) {
  // Total tasks
  const total = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threedTasks)
    .where(scope);

  // Pending tasks
  const pending = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threedTasks)
    .where(and(scope, eq(threedTasks.status, 'pending')));

  // In progress
  const inProgress = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threedTasks)
    .where(and(scope, eq(threedTasks.status, 'in_progress')));

  // Completed
  const completed = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threedTasks)
    .where(and(scope, eq(threedTasks.status, 'completed')));

  // Overdue
  const overdue = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threedTasks)
    .where(and(scope, sql`${threedTasks.dueDate} < NOW() AND ${threedTasks.status} NOT IN ('completed', 'cancelled')`));

  // By priority - using SQL CASE in orderBy
  const byPriority = await db
    .select({
      priority: threedTasks.priority,
      count: sql<number>`COUNT(*)`,
    })
    .from(threedTasks)
    .where(and(scope, sql`${threedTasks.status} != 'completed'`))
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
    .where(and(scope, sql`${threedTasks.status} != 'completed'`))
    .groupBy(threedTasks.type)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  return {
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
  };
}

export async function GET() {
  try {
    const session = await auth();
    const data = await readThreeDTasks(session?.user?.id, 'stats', readStats);
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { headers: { 'Cache-Control': 'private, no-store' } });
    
  } catch (error) {
    console.error('Tasks Stats Error:', databaseConnectionDiagnostic(error));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
