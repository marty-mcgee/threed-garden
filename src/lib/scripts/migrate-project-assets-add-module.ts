// lib/scripts/migrate-project-assets-add-module.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

async function migrateProjectAssets() {
  console.log('🔍 Starting migration: Adding moduleId to project_assets...');

  try {
    // Add moduleId column
    await db.execute(sql`
      ALTER TABLE project_assets 
      ADD COLUMN IF NOT EXISTS module_id INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS module_type TEXT NOT NULL DEFAULT 'music'
    `);

    console.log('✅ Added moduleId and moduleType columns');

    // Update existing records to use a default module
    // This is a temporary fix - you'll need to map existing records to proper modules
    await db.execute(sql`
      WITH first_modules AS (
        SELECT 
          pm.id as module_id,
          pm.project_id,
          'music' as module_type
        FROM project_music pm
        UNION ALL
        SELECT 
          pt.id as module_id,
          pt.project_id,
          'threed' as module_type
        FROM project_threed pt
        UNION ALL
        SELECT 
          ptr.id as module_id,
          ptr.project_id,
          'traffic' as module_type
        FROM project_traffic ptr
      )
      UPDATE project_assets pa
      SET 
        module_id = fm.module_id,
        module_type = fm.module_type
      FROM first_modules fm
      WHERE pa.project_id = fm.project_id
      AND pa.module_id = 0
    `);

    console.log('✅ Updated existing records with module references');

    // Add unique constraint
    await db.execute(sql`
      DROP INDEX IF EXISTS idx_project_assets_unique;
      CREATE UNIQUE INDEX idx_project_assets_unique 
      ON project_assets (project_id, module_id, asset_type, asset_id)
      WHERE is_active = true;
    `);

    console.log('✅ Added unique constraint');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateProjectAssets();