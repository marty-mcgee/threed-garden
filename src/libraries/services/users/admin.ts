import 'server-only';
import { createHash } from 'node:crypto';
import { and, asc, count, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { User } from '@/libraries/schema/auth';
import { userRoleAudit } from '@/libraries/schema/auth/user-role-audit';
import { userListQuerySchema, userRoleUpdateSchema, type AdminUserRecord } from './contracts';
import { userCreateSchema, userProfileUpdateSchema, userDeleteSchema } from './contracts';
import { findUserContent } from './content';
import bcrypt from 'bcryptjs';
import { insertCredentialsAccount } from '@/libraries/auth/register';

export class UserAdminError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fields = { id: User.id, name: User.name, email: User.email, role: User.role, isActive: User.isActive, isDeleted: User.isDeleted,
  stamp: sql<string | null>`${User.updatedAt}::text` };
function serialize(row: Omit<AdminUserRecord, 'revision'> & { stamp: string | null }): AdminUserRecord {
  const { stamp, ...record } = row;
  return { ...record, revision: createHash('sha256').update(JSON.stringify([row.id, row.name, row.email, row.role, row.isActive, row.isDeleted, stamp])).digest('hex') };
}
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function lockUsersAdmin(tx: Transaction, actorId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(740027, 1)`);
  const [actor] = await tx.select({ role: User.role, active: User.isActive, deleted: User.isDeleted }).from(User).where(eq(User.id, actorId)).for('share');
  if (actor?.role !== 'super_admin' || actor.active !== true || actor.deleted !== false) throw new UserAdminError(403, 'An active Super Admin account is required.');
}
export async function createAdminUser(actorId: string, input: unknown) {
  const data = userCreateSchema.parse(input);
  await requireUsersAdmin(actorId);
  const password = await bcrypt.hash(data.password, 12);
  return db.transaction(async tx => {
    await lockUsersAdmin(tx, actorId);
    const id = await insertCredentialsAccount(tx, data, password);
    const [row] = await tx.select(fields).from(User).where(eq(User.id, id));
    return serialize(row);
  });
}
export async function updateAdminUser(actorId: string, targetId: string, input: unknown) {
  const data = userProfileUpdateSchema.parse(input);
  await requireUsersAdmin(actorId);
  return db.transaction(async tx => {
    await lockUsersAdmin(tx, actorId);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${data.email}, 740028))`);
    const [target] = await tx.select(fields).from(User).where(eq(User.id, targetId)).for('update');
    if (!target || target.isDeleted) throw new UserAdminError(404, 'User not found.');
    if (serialize(target).revision !== data.revision) throw new UserAdminError(409, 'This User changed. Reload before saving.');
    if (data.role === 'user' && target.role !== 'user') throw new UserAdminError(400, 'Legacy User cannot be assigned.');
    const duplicate = await tx.select({ id: User.id }).from(User).where(sql`lower(${User.email}) = ${data.email} AND ${User.id} <> ${targetId}`).limit(1);
    if (duplicate.length) throw new UserAdminError(409, 'This email is already in use.');
    if (target.role === 'super_admin' && target.isActive === true && data.role !== 'super_admin') {
      const [admins] = await tx.select({ count: count() }).from(User).where(and(eq(User.role, 'super_admin'), eq(User.isActive, true), eq(User.isDeleted, false)));
      if (admins.count <= 1) throw new UserAdminError(409, 'The last active Super Admin cannot be demoted.');
    }
    const [saved] = await tx.update(User).set({ name: data.name, email: data.email, role: data.role,
      ...(data.email !== target.email ? { emailVerified: null } : {}), updatedAt: new Date() }).where(eq(User.id, targetId)).returning(fields);
    if (target.role !== data.role) await tx.insert(userRoleAudit).values({ actorUserId: actorId, targetUserId: targetId, previousRole: target.role, newRole: data.role });
    return serialize(saved);
  });
}
export async function requireUsersAdmin(actorId: string) {
  const [actor] = await db.select({role:User.role,active:User.isActive,deleted:User.isDeleted}).from(User).where(eq(User.id,actorId));
  if (actor?.role !== 'super_admin' || actor.active !== true || actor.deleted !== false) throw new UserAdminError(403,'An active Super Admin account is required.');
}
export async function listAdminUsers(actorId: string, input: unknown) {
  const query = userListQuerySchema.parse(input);
  await requireUsersAdmin(actorId);
  const search = query.search.replace(/[\\%_]/g, '\\$&');
  const where = and(query.status === 'all' ? undefined : eq(User.isDeleted, query.status === 'deleted'), query.role === 'all' ? undefined : eq(User.role,query.role), search ? or(ilike(User.name,`%${search}%`),ilike(User.email,`%${search}%`)) : undefined);
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
export async function softDeleteAdminUser(actorId: string, targetId: string, input: unknown) {
  const submitted = userDeleteSchema.parse(input);
  await requireUsersAdmin(actorId);
  return db.transaction(async tx => {
    await lockUsersAdmin(tx, actorId);
    const [target] = await tx.select(fields).from(User).where(eq(User.id, targetId)).for('update');
    if (!target) throw new UserAdminError(404, 'User not found.');
    if (serialize(target).revision !== submitted.revision) throw new UserAdminError(409, 'This User changed. Reload before deleting.');
    if (submitted.confirmEmail !== target.email) throw new UserAdminError(400, 'Enter the exact User email to confirm deletion.');
    if (actorId === targetId) throw new UserAdminError(409, 'You cannot delete your own account.');
    if (target.isDeleted) throw new UserAdminError(409, 'This User is already deleted.');
    if (target.role === 'super_admin' && target.isActive === true) {
      const [admins] = await tx.select({ count: count() }).from(User).where(and(eq(User.role, 'super_admin'), eq(User.isActive, true), eq(User.isDeleted, false)));
      if (admins.count <= 1) throw new UserAdminError(409, 'The last active Super Admin cannot be deleted.');
    }
    const content = await findUserContent(tx, targetId);
    if (content) throw new UserAdminError(409, `This User owns content (${content}). Resolve that content before deleting the User.`);
    // Never DELETE: preserve identity, credentials, relationships and audit history.
    const [saved] = await tx.update(User).set({ isDeleted: true, updatedAt: new Date() }).where(eq(User.id, targetId)).returning(fields);
    return serialize(saved);
  });
}
export async function updateAdminUserRole(actorId: string, targetId: string, input: unknown) {
  const submitted = userRoleUpdateSchema.parse(input);
  await requireUsersAdmin(actorId);
  return db.transaction(async tx => {
    // Serialize all role changes before taking account locks. This protects the
    // last-Super-Admin invariant even when two different admins demote simultaneously.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(740027, 1)`);
    const [actor] = await tx.select({role:User.role,active:User.isActive,deleted:User.isDeleted}).from(User).where(eq(User.id,actorId)).for('share');
    if (actor?.role !== 'super_admin' || actor.active !== true || actor.deleted !== false) throw new UserAdminError(403,'An active Super Admin account is required.');
    const [target] = await tx.select(fields).from(User).where(eq(User.id,targetId)).for('update');
    if (!target || target.isDeleted) throw new UserAdminError(404,'User not found.');
    if (serialize(target).revision !== submitted.revision) throw new UserAdminError(409,'This User changed. Reload before saving.');
    if (target.role === submitted.role) return serialize(target);
    if (target.role === 'super_admin' && target.isActive === true && submitted.role !== 'super_admin') {
      const [admins] = await tx.select({count:count()}).from(User).where(and(eq(User.role,'super_admin'),eq(User.isActive,true),eq(User.isDeleted,false)));
      if (admins.count <= 1) throw new UserAdminError(409,'The last active Super Admin cannot be demoted.');
    }
    const [saved] = await tx.update(User).set({role:submitted.role,updatedAt:new Date()}).where(eq(User.id,targetId)).returning(fields);
    await tx.insert(userRoleAudit).values({actorUserId:actorId,targetUserId:targetId,previousRole:target.role,newRole:submitted.role});
    return serialize(saved);
  });
}
