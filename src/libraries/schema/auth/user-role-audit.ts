import { pgTable, serial, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Stage 1 audit compatibility; see user-role-audit-super-admin.sql for existing tables.
// Historical identities deliberately survive any later account deletion.
export const userRoleAudit = pgTable('user_role_audit', {
  id: serial('id').primaryKey(),
  actorUserId: text('actor_user_id').notNull(),
  targetUserId: text('target_user_id').notNull(),
  previousRole: text('previous_role'),
  newRole: text('new_role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  targetIdx: index('user_role_audit_target_idx').on(table.targetUserId, table.createdAt),
  roleCheck: check('user_role_audit_new_role', sql`${table.newRole} IN ('user', 'admin', 'super_admin')`),
}));
