import { z } from 'zod';

export const userRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'super_admin']),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export const userListQuerySchema = z.object({
  search: z.string().trim().max(100).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  role: z.enum(['all', 'user', 'admin', 'super_admin']).default('all'),
}).strict();
export interface AdminUserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  isActive: boolean | null;
  revision: string;
}
