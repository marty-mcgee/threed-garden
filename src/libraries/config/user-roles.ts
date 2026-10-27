import { z } from 'zod';

// Staged authority model. Wire into global authorization only with bootstrap.
// Content ownership remains a separate user_id check, never inferred from role.
export const appRoleSchema = z.enum(['admin', 'super_admin']);
export type AppRole = z.infer<typeof appRoleSchema>;
export const defaultAccountRole: AppRole = 'admin';
export const appRoleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
};

// Historical audit rows retain their original role, including legacy "user".
export const auditedRoleSchema = z.enum(['user', 'admin', 'super_admin']);

export function isActiveSuperAdmin(account: {
  role: string | null;
  isActive: boolean | null;
} | null | undefined): boolean {
  return account?.role === 'super_admin' && account.isActive === true;
}
