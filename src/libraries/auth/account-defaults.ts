import type { Adapter } from 'next-auth/adapters';
import { defaultAccountRole } from '@/libraries/config/user-roles';

// App-owned creation policy. Never accept a privileged role from provider input.
export function withAccountDefaults(adapter: Adapter): Adapter {
  const createUser = adapter.createUser;
  if (!createUser) throw new Error('Account adapter must support User creation.');
  return {
    ...adapter,
    async deleteUser() {
      // Provider adapters must never physically remove App identities.
      throw new Error('Use the Super Admin Users soft-delete action.');
    },
    createUser(data) {
      const account = { ...data, role: defaultAccountRole, isActive: true, isDeleted: false };
      return createUser(account);
    },
  };
}
