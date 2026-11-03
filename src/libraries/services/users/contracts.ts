import { parseSignupInput } from '@/libraries/auth/signup-contract';
import { parseAppRole, parseAuditedRole, type AppRole } from '@/libraries/config/user-roles';
import { InputValidationError, readChoice, readEmail, readInteger, readRevision, readStrictObject, readString } from '@/libraries/utils/input-validation';

export const parseUserCreate = parseSignupInput;

export function parseUserProfileUpdate(value: unknown) {
  const input = readStrictObject(value, [
    'name',
    'email',
    'role',
    'revision',
  ]);
  return {
    name: readString(input.name, 1, 100, true),
    email: readEmail(readString(input.email).trim()).toLowerCase(),
    role: parseAuditedRole(input.role),
    revision: readRevision(input.revision),
  };
}

export function parseUserDelete(value: unknown) {
  const input = readStrictObject(value, [
    'revision',
    'confirmEmail',
  ]);
  return {
    revision: readRevision(input.revision),
    confirmEmail: readEmail(input.confirmEmail),
  };
}

export function parseUserRoleUpdate(value: unknown): {
  role: AppRole;
  revision: string;
} {
  const input = readStrictObject(value, [
    'role',
    'revision',
  ]);
  return {
    role: parseAppRole(input.role),
    revision: readRevision(input.revision),
  };
}

export function parseUserListQuery(value: unknown) {
  const input = readStrictObject(value, [
    'search',
    'page',
    'role',
    'status',
  ]);
  let page: number;
  try {
    page = input.page === undefined ? 1 : Number(input.page);
  } catch {
    throw new InputValidationError();
  }
  return {
    search: input.search === undefined ? '' : readString(input.search, 0, 100, true),
    page: readInteger(page, 1, 10000),
    role: input.role === undefined ? 'all' as const : readChoice(input.role, [
      'all',
      'user',
      'admin',
      'super_admin',
    ]),
    status: input.status === undefined ? 'current' as const : readChoice(input.status, [
      'current',
      'deleted',
      'all',
    ]),
  };
}
export interface AdminUserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  isActive: boolean | null;
  isDeleted: boolean;
  revision: string;
}
