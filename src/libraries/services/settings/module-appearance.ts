import 'server-only';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { settings, settingsAuditLogs } from '@/libraries/schema/settings';
import { defaultModuleAppearance, readStoredModuleAppearance, moduleAppearanceSnapshotSchema, type ModuleAppearanceSnapshot } from '@/libraries/config/module-appearance';

const KEY = 'app.module-appearance.v1';
export class ModuleAppearanceForbidden extends Error {}
export class ModuleAppearanceConflict extends Error {}

export async function canManageModuleAppearance(userId: string): Promise<boolean> {
  const [actor] = await db.select({ role: User.role, active: User.isActive }).from(User).where(eq(User.id, userId));
  return actor?.role === 'super_admin' && actor.active === true;
}

export async function readModuleAppearance(): Promise<ModuleAppearanceSnapshot> {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY));
  if (!row) return defaultModuleAppearance();
  if (row.scope !== 'system' || row.isSensitive !== false || row.type !== 'json') throw new Error('Invalid Module appearance definition');
  return readStoredModuleAppearance(row.value);
}

export async function saveModuleAppearance(userId: string, input: ModuleAppearanceSnapshot): Promise<ModuleAppearanceSnapshot> {
  const submitted = moduleAppearanceSnapshotSchema.parse(input);
  return db.transaction(async tx => {
    // Check current database authority inside the write transaction, not a stale JWT.
    const [actor] = await tx.select({ role: User.role, active: User.isActive }).from(User).where(eq(User.id, userId)).for('share');
    if (actor?.role !== 'super_admin' || actor.active !== true) throw new ModuleAppearanceForbidden();
    await tx.insert(settings).values({key:KEY,scope:'system',type:'json',label:'Module colors and icons',group:'appearance',isSensitive:false,value:defaultModuleAppearance(),defaultValue:defaultModuleAppearance()}).onConflictDoNothing({target:settings.key});
    const [row] = await tx.select().from(settings).where(eq(settings.key,KEY)).for('update');
    if (!row || row.scope !== 'system' || row.isSensitive !== false || row.type !== 'json') throw new Error('Invalid Module appearance definition');
    const previous = readStoredModuleAppearance(row.value);
    if (previous.revision !== submitted.revision) throw new ModuleAppearanceConflict();
    const saved = {...submitted,revision:randomUUID()};
    await tx.update(settings).set({value:saved,updatedAt:new Date()}).where(eq(settings.id,row.id));
    await tx.insert(settingsAuditLogs).values({settingId:row.id,userId,action:'update',oldValue:previous,newValue:saved});
    return saved;
  });
}
