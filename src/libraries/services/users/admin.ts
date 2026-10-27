import 'server-only';
import { createHash } from 'node:crypto';
import { and, asc, count, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { userRoleAudit } from '@/libraries/schema/auth/user-role-audit';
import { userListQuerySchema, userRoleUpdateSchema, type AdminUserRecord } from './contracts';

export class UserAdminError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fields = { id: User.id, name: User.name, email: User.email, role: User.role, isActive: User.isActive,
  stamp: sql<string | null>`${User.updatedAt}::text` };
function serialize(row: Omit<AdminUserRecord, 'revision'> & { stamp: string | null }): AdminUserRecord {
  const { stamp, ...record } = row;
  return { ...record, revision: createHash('sha256').update(JSON.stringify([row.id, row.role, row.isActive, stamp])).digest('hex') };
}
export async function requireUsersAdmin(actorId: string) {
  const [actor] = await db.select({role:User.role,active:User.isActive}).from(User).where(eq(User.id,actorId));
  if (actor?.role !== 'super_admin' || actor.active !== true) throw new UserAdminError(403,'An active Super Admin account is required.');
}
export async function listAdminUsers(actorId: string, input: unknown) {
  const query = userListQuerySchema.parse(input);
  await requireUsersAdmin(actorId);
  const search = query.search.replace(/[\\%_]/g, '\\$&');
  const where = and(query.role === 'all' ? undefined : eq(User.role,query.role), search ? or(ilike(User.name,`%${search}%`),ilike(User.email,`%${search}%`)) : undefined);
  const rows = await db.select(fields).from(User).where(where).orderBy(asc(User.email),asc(User.id)).limit(25).offset((query.page-1)*25);
  const [total] = await db.select({count:count()}).from(User).where(where);
  return { data:rows.map(serialize), total:total.count, page:query.page };
}
export async function readAdminUser(actorId: string, targetId: string) {
  await requireUsersAdmin(actorId);
  const [row] = await db.select(fields).from(User).where(eq(User.id,targetId));
  if (!row) throw new UserAdminError(404,'User not found.');
  return serialize(row);
}
export async function updateAdminUserRole(actorId: string, targetId: string, input: unknown) {
  const submitted = userRoleUpdateSchema.parse(input);
  await requireUsersAdmin(actorId);
  return db.transaction(async tx => {
    // Serialize all role changes before taking account locks. This protects the
    // last-Super-Admin invariant even when two different admins demote simultaneously.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(740027, 1)`);
    const [actor] = await tx.select({role:User.role,active:User.isActive}).from(User).where(eq(User.id,actorId)).for('share');
    if (actor?.role !== 'super_admin' || actor.active !== true) throw new UserAdminError(403,'An active Super Admin account is required.');
    const [target] = await tx.select(fields).from(User).where(eq(User.id,targetId)).for('update');
    if (!target) throw new UserAdminError(404,'User not found.');
    if (serialize(target).revision !== submitted.revision) throw new UserAdminError(409,'This User changed. Reload before saving.');
    if (target.role === submitted.role) return serialize(target);
    if (target.role === 'super_admin' && target.isActive === true && submitted.role !== 'super_admin') {
      const [admins] = await tx.select({count:count()}).from(User).where(and(eq(User.role,'super_admin'),eq(User.isActive,true)));
      if (admins.count <= 1) throw new UserAdminError(409,'The last active Super Admin cannot be demoted.');
    }
    const [saved] = await tx.update(User).set({role:submitted.role,updatedAt:new Date()}).where(eq(User.id,targetId)).returning(fields);
    await tx.insert(userRoleAudit).values({actorUserId:actorId,targetUserId:targetId,previousRole:target.role,newRole:submitted.role});
    return serialize(saved);
  });
}
