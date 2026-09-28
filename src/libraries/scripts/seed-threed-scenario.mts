/** Local, server-only Scenario example. Never accepts an owner identity from a browser. */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { project, projectThreed } from '../schema/project';
import { threed, threedScenarios } from '../schema/threed';
import { positiveId } from '../services/threed/scenarios/scenario-input';

config({ path: '.env.local', quiet: true });

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('The test Scenario seed is disabled in production.');
  if (!process.argv.includes('--confirm-development')) throw new Error('Pass --confirm-development after verifying .env.local targets the development database.');
  const args = process.argv.filter(value => value.startsWith('--project-id='));
  if (args.length !== 1) throw new Error('Pass exactly one --project-id=<id>.');
  const projectId = positiveId(args[0].slice('--project-id='.length), 'Project ID');
  if (!process.env.DATABASE_URL) throw new Error('Development DATABASE_URL is unavailable.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const db = drizzle(pool);
    const modules = await db.select({ ownerId: project.userId, threedId: projectThreed.threedId })
      .from(projectThreed)
      .innerJoin(project, eq(project.id, projectThreed.projectId))
      .innerJoin(threed, eq(threed.id, projectThreed.threedId))
      .where(and(
        eq(project.id, projectId), eq(project.isActive, true),
        eq(projectThreed.isActive, true), eq(threed.isActive, true),
        eq(projectThreed.userId, project.userId), eq(threed.userId, project.userId),
      ));
    if (modules.length !== 1 || !modules[0].ownerId || !modules[0].threedId) {
      throw new Error('Project must have exactly one active, owner-matched ThreeD module.');
    }
    const { ownerId, threedId } = modules[0];
    const slug = 'physics-objects-sensors-test';
    const [created] = await db.insert(threedScenarios).values({
      userId: ownerId, projectId, threedId,
      name: 'Physics Objects & Sensors — Test', slug,
      description: 'Test Scenario definition: Physics objects interact in groups; sensors count qualifying entries and identify their sources.',
      isActive: true,
    }).onConflictDoNothing({ target: [threedScenarios.projectId, threedScenarios.threedId, threedScenarios.slug] }).returning({ id: threedScenarios.id });
    const [scenario] = await db.select({ id: threedScenarios.id, name: threedScenarios.name, isActive: threedScenarios.isActive })
      .from(threedScenarios)
      .where(and(eq(threedScenarios.userId, ownerId), eq(threedScenarios.projectId, projectId), eq(threedScenarios.threedId, threedId), eq(threedScenarios.slug, slug)))
      .limit(1);
    if (!scenario) throw new Error('Seeded Scenario could not be read back.');
    console.log(`${created ? 'Created' : 'Preserved existing'} Scenario #${scenario.id} for Project ${projectId}: ${scenario.name}${scenario.isActive ? '' : ' (inactive)'}`);
  } finally { await pool.end(); }
}

main().catch(error => { console.error(`Scenario seed failed: ${error instanceof Error ? error.message : 'unknown error'}`); process.exitCode = 1; });
