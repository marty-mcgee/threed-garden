import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { settings, settingsUserOverrides, settingsAuditLogs } from '@/libraries/schema/settings';
import { defaultWorkspaceSettings, workspaceSnapshotSchema, type WorkspaceSnapshot } from '@/libraries/config/workspace-settings';

const KEY = 'workspace.preferences.v2';
export class WorkspaceSettingsConflict extends Error {}

export async function readWorkspaceSettings(userId: string): Promise<WorkspaceSnapshot> {
  const [row] = await db.select({ value: settingsUserOverrides.value })
    .from(settingsUserOverrides)
    .innerJoin(settings, eq(settings.id, settingsUserOverrides.settingId))
    .where(and(eq(settings.key, KEY), eq(settings.scope, 'user'), eq(settingsUserOverrides.userId, userId)));
  // Invalid stored values are an error, not permission to overwrite them with defaults.
  return row ? workspaceSnapshotSchema.parse(row.value) : { preferences: defaultWorkspaceSettings(), revision: null };
}

export async function saveWorkspaceSettings(userId: string, input: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
  const submitted = workspaceSnapshotSchema.parse(input);
  return db.transaction(async tx => {
    await tx.insert(settings).values({
      key: KEY, scope: 'user', type: 'json', label: 'Workspace preferences',
      value: defaultWorkspaceSettings(), defaultValue: defaultWorkspaceSettings(),
      group: 'workspace', isSensitive: false,
    }).onConflictDoNothing({ target: settings.key });
    // Serialize the short save transaction, including the first override insert.
    const [definition] = await tx.select({ id: settings.id, scope: settings.scope, sensitive: settings.isSensitive })
      .from(settings).where(eq(settings.key, KEY)).for('update');
    if (!definition || definition.scope !== 'user' || definition.sensitive) throw new Error('Invalid workspace definition');
    const owner = and(eq(settingsUserOverrides.settingId, definition.id), eq(settingsUserOverrides.userId, userId));
    const [existing] = await tx.select({ value: settingsUserOverrides.value }).from(settingsUserOverrides).where(owner);
    const previous = existing ? workspaceSnapshotSchema.parse(existing.value) : null;
    if ((previous?.revision ?? null) !== submitted.revision) throw new WorkspaceSettingsConflict();
    const saved = { preferences: submitted.preferences, revision: randomUUID() };
    await tx.insert(settingsUserOverrides).values({ userId, settingId: definition.id, value: saved })
      .onConflictDoUpdate({
        target: [settingsUserOverrides.userId, settingsUserOverrides.settingId],
        set: { value: saved, updatedAt: new Date() },
      });
    await tx.insert(settingsAuditLogs).values({
      settingId: definition.id, userId, action: 'override', oldValue: previous?.preferences ?? null, newValue: saved.preferences,
    });
    return saved;
  });
}
