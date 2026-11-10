import 'server-only';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { settings, settingsAuditLogs } from '@/libraries/schema/settings';
import { defaultMetaTags, parseMetaTags, type AppMetaTags } from '@/libraries/config/meta-tags';

const KEY = 'app.meta-tags.v1';
export class MetaTagsForbidden extends Error {}
export class MetaTagsConflict extends Error {}
const authorized = (actor: { role: string | null; active: boolean | null; deleted: boolean | null } | undefined) => actor?.role === 'super_admin' && actor.active === true && actor.deleted === false;
export async function canManageMetaTags(userId: string) {
  const [actor] = await db.select({
    role: User.role,
    active: User.isActive,
    deleted: User.isDeleted,
  }).from(User).where(eq(User.id, userId));
  return authorized(actor);
}
function stored(row: typeof settings.$inferSelect): AppMetaTags {
  if (row.scope !== 'system' || row.type !== 'json' || row.isSensitive !== false) throw new Error('Invalid meta-tag definition.');
  return parseMetaTags(row.value);
}
export async function readMetaTags(): Promise<AppMetaTags> {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY));
  return row ? stored(row) : defaultMetaTags();
}
export async function saveMetaTags(userId: string, input: AppMetaTags): Promise<AppMetaTags> {
  const submitted = parseMetaTags(input);
  return db.transaction(async tx => {
    const [actor] = await tx.select({
      role: User.role,
      active: User.isActive,
      deleted: User.isDeleted,
    }).from(User).where(eq(User.id, userId)).for('share');
    if (!authorized(actor)) throw new MetaTagsForbidden();
    await tx.insert(settings).values({
      key: KEY,
      scope: 'system',
      type: 'json',
      label: 'HTML and SEO meta tags',
      group: 'html-seo',
      isSensitive: false,
      value: defaultMetaTags(),
      defaultValue: defaultMetaTags(),
    }).onConflictDoNothing({ target: settings.key });
    const [row] = await tx.select().from(settings).where(eq(settings.key, KEY)).for('update');
    if (!row) throw new Error('Meta-tag definition unavailable.');
    const previous = stored(row);
    if (previous.revision !== submitted.revision) throw new MetaTagsConflict();
    const saved = {
      ...submitted,
      revision: randomUUID(),
    };
    await tx.update(settings).set({
      value: saved,
      updatedAt: new Date(),
    }).where(eq(settings.id, row.id));
    await tx.insert(settingsAuditLogs).values({
      settingId: row.id,
      userId,
      action: 'update',
      oldValue: previous,
      newValue: saved,
    });
    return saved;
  });
}
