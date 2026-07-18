// lib/scripts/migrate-project-module-relationships.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { project, projectThreed, projectTraffic, projectMusic } from '@/lib/schema/project';
import { threed } from '@/lib/schema/threed';
import { traffic } from '@/lib/schema/traffic';
import { music } from '@/lib/schema/music';
import { eq, and } from 'drizzle-orm';
import readline from 'readline';

// ============================================
// MIGRATION SCRIPT: Create project-module relationships
// ============================================

interface ModuleWithProject {
  id: number;
  projectId: number;
  name: string;
  userId: string;
}

interface MusicModule {
  id: number;
  name: string;
  userId: string;
}

async function getModulesWithProjectId(table: any, tableName: string): Promise<ModuleWithProject[]> {
  try {
    const result = await db
      .select({
        id: table.id,
        projectId: table.projectId,
        name: table.name,
        userId: table.userId,
      })
      .from(table)
      .where(sql`${table.projectId} IS NOT NULL`);

    console.log(`✅ Found ${result.length} ${tableName} modules with projectId`);
    return result;
  } catch (error: any) {
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      console.log(`ℹ️  ${tableName} table does not have project_id column (already migrated)`);
      return [];
    }
    console.error(`❌ Error fetching ${tableName} modules:`, error);
    return [];
  }
}

async function getMusicModules(): Promise<MusicModule[]> {
  try {
    const result = await db
      .select({
        id: music.id,
        name: music.name,
        userId: music.userId,
      })
      .from(music);

    console.log(`✅ Found ${result.length} music modules total`);
    return result;
  } catch (error) {
    console.error('❌ Error fetching music modules:', error);
    return [];
  }
}

async function getProjectsForUser(userId: string): Promise<any[]> {
  try {
    const result = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId));
    return result;
  } catch (error) {
    console.error(`❌ Error fetching projects for user ${userId}:`, error);
    return [];
  }
}

async function createJunctionRecord(
  junctionTable: any,
  projectId: number,
  moduleId: number,
  moduleType: string
): Promise<boolean> {
  try {
    const moduleIdColumn = moduleType === 'threed' ? 'threedId' : 
                           moduleType === 'traffic' ? 'trafficId' : 'musicId';
    
    // Check if relationship already exists
    const existing = await db
      .select()
      .from(junctionTable)
      .where(
        and(
          eq(junctionTable.projectId, projectId),
          eq(junctionTable[moduleIdColumn as keyof typeof junctionTable], moduleId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Relationship already exists: ${moduleType} ${moduleId} → Project ${projectId}`);
      return true;
    }

    await db
      .insert(junctionTable)
      .values({
        projectId: projectId,
        [moduleIdColumn]: moduleId,
        isActive: true,
      });

    console.log(`✅ Created relationship: ${moduleType} ${moduleId} → Project ${projectId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating relationship for ${moduleType} ${moduleId}:`, error);
    return false;
  }
}

async function migrateModuleRelationships() {
  console.log('\n🔄 Starting migration of project-module relationships...\n');

  let totalCreated = 0;
  let totalErrors = 0;

  // ============================================
  // 1. Migrate ThreeD modules
  // ============================================
  console.log('📦 Processing ThreeD modules...');
  const threedModules = await getModulesWithProjectId(threed, 'threed');
  
  for (const module of threedModules) {
    const success = await createJunctionRecord(
      projectThreed,
      module.projectId,
      module.id,
      'threed'
    );
    if (success) totalCreated++;
    else totalErrors++;
  }

  // ============================================
  // 2. Migrate Traffic modules
  // ============================================
  console.log('\n📦 Processing Traffic modules...');
  const trafficModules = await getModulesWithProjectId(traffic, 'traffic');
  
  for (const module of trafficModules) {
    const success = await createJunctionRecord(
      projectTraffic,
      module.projectId,
      module.id,
      'traffic'
    );
    if (success) totalCreated++;
    else totalErrors++;
  }

  // ============================================
  // 3. Migrate Music modules
  // ============================================
  console.log('\n📦 Processing Music modules...');
  
  const musicModules = await getMusicModules();
  
  if (musicModules.length === 0) {
    console.log('ℹ️  No music modules found to migrate.');
  } else {
    // Group music modules by userId
    const modulesByUser: Record<string, MusicModule[]> = {};
    for (const module of musicModules) {
      if (!modulesByUser[module.userId]) {
        modulesByUser[module.userId] = [];
      }
      modulesByUser[module.userId].push(module);
    }

    console.log(`📌 Found ${musicModules.length} music modules across ${Object.keys(modulesByUser).length} users.\n`);

    // Process each user's modules
    for (const [userId, userModules] of Object.entries(modulesByUser)) {
      console.log(`👤 Processing user: ${userId}`);
      console.log(`   Found ${userModules.length} music modules for this user:`);
      for (const module of userModules) {
        console.log(`   - ID: ${module.id}, Name: "${module.name}"`);
      }

      // Get projects for this user
      const userProjects = await getProjectsForUser(userId);
      
      if (userProjects.length === 0) {
        console.log(`   ⚠️  No projects found for user ${userId}. Skipping music modules.\n`);
        continue;
      }

      console.log(`   📁 Found ${userProjects.length} projects for this user:`);
      for (const proj of userProjects) {
        console.log(`   - ID: ${proj.id}, Name: "${proj.name}"`);
      }

      // If there's only one project, auto-assign all modules to it
      if (userProjects.length === 1) {
        console.log(`\n   ℹ️  Auto-assigning all music modules to project: "${userProjects[0].name}" (ID: ${userProjects[0].id})`);
        for (const module of userModules) {
          const success = await createJunctionRecord(
            projectMusic,
            userProjects[0].id,
            module.id,
            'music'
          );
          if (success) totalCreated++;
          else totalErrors++;
        }
        console.log('');
        continue;
      }

      // Multiple projects - ask the user which project to use
      console.log(`\n   ❓ Multiple projects found for user ${userId}.`);
      console.log('   Please choose a project to assign the music modules to:');
      console.log('   0: Skip (do not assign)');
      for (let i = 0; i < userProjects.length; i++) {
        console.log(`   ${i + 1}: ${userProjects[i].name} (ID: ${userProjects[i].id})`);
      }

      // Use readline for user input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const choice = await new Promise<number>((resolve) => {
        rl.question('\n   Enter your choice (0-' + userProjects.length + '): ', (answer) => {
          rl.close();
          const num = parseInt(answer);
          resolve(isNaN(num) ? 0 : num);
        });
      });

      if (choice === 0) {
        console.log(`   ⏭️  Skipping music modules for user ${userId}\n`);
        continue;
      }

      if (choice > 0 && choice <= userProjects.length) {
        const selectedProject = userProjects[choice - 1];
        console.log(`\n   ✅ Assigning music modules to project: "${selectedProject.name}" (ID: ${selectedProject.id})`);
        for (const module of userModules) {
          const success = await createJunctionRecord(
            projectMusic,
            selectedProject.id,
            module.id,
            'music'
          );
          if (success) totalCreated++;
          else totalErrors++;
        }
        console.log('');
      } else {
        console.log(`   ⚠️  Invalid choice. Skipping music modules for user ${userId}\n`);
      }
    }
  }

  // ============================================
  // 4. Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Relationships created: ${totalCreated}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50) + '\n');

  // ============================================
  // 5. Verify results
  // ============================================
  console.log('🔍 Verification:');
  
  const [threedCount, trafficCount, musicCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(projectThreed),
    db.select({ count: sql<number>`count(*)` }).from(projectTraffic),
    db.select({ count: sql<number>`count(*)` }).from(projectMusic),
  ]);

  console.log(`   📊 project_threed records: ${threedCount[0]?.count || 0}`);
  console.log(`   📊 project_traffic records: ${trafficCount[0]?.count || 0}`);
  console.log(`   📊 project_music records: ${musicCount[0]?.count || 0}`);
}

// ============================================
// ROLLBACK FUNCTION (if needed)
// ============================================

async function rollbackMigration() {
  console.log('\n🔄 Rolling back migration...\n');

  const confirm = await new Promise((resolve) => {
    console.log('⚠️  This will DELETE ALL project-module relationships!');
    console.log('Type "yes" to confirm:');
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase() === 'yes');
    });
  });

  if (!confirm) {
    console.log('❌ Rollback cancelled.');
    return;
  }

  await db.delete(projectThreed);
  await db.delete(projectTraffic);
  await db.delete(projectMusic);

  console.log('✅ All project-module relationships deleted.');
}

// ============================================
// RUN THE MIGRATION
// ============================================

const args = process.argv.slice(2);

if (args.includes('--rollback')) {
  rollbackMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    });
} else if (args.includes('--auto')) {
  // Auto mode: skip user prompts and auto-assign to first project
  console.log('🔧 Running in AUTO mode (no user prompts)...');
  // You could implement auto mode here
  migrateModuleRelationships()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
} else {
  migrateModuleRelationships()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateModuleRelationships, rollbackMigration };