import { readChoice } from '@/libraries/utils/input-validation';

// Staged authority model. Wire into global authorization only with bootstrap.
// Content ownership remains a separate user_id check, never inferred from role.
export type AppRole = 'admin' | 'super_admin';
export const parseAppRole = (value: unknown): AppRole => readChoice(value, [
  'admin',
  'super_admin',
]);
export const defaultAccountRole: AppRole = 'admin';
export const appRoleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
};

// Historical audit rows retain their original role, including legacy "user".
export const parseAuditedRole = (value: unknown): 'user' | AppRole => readChoice(value, [
  'user',
  'admin',
  'super_admin',
]);

export function isActiveSuperAdmin(account: {
  role: string | null;
  isActive: boolean | null;
  isDeleted: boolean;
} | null | undefined): boolean {
  return account?.role === 'super_admin' && account.isActive === true && account.isDeleted === false;
}
