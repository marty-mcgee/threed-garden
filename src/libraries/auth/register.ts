import 'server-only';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from '@/libraries/db/client';
import { User, UserAccounts } from '@/libraries/schema/auth';
import { defaultAccountRole } from '@/libraries/config/user-roles';
import { signupSchema } from './signup-contract';
import type { z } from 'zod';

export class RegistrationConflict extends Error {}
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Shared by public signup and Super Admin creation. Caller owns the transaction.
export async function insertCredentialsAccount(tx: Transaction, data: z.infer<typeof signupSchema>, password: string) {
    // Serialize registrations for the same normalized email, including case variants.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${data.email}, 740028))`);
    const existing = await tx.select({ id: User.id }).from(User)
      .where(sql`lower(${User.email}) = ${data.email}`).limit(1);
    if (existing.length) throw new RegistrationConflict();
    const [account] = await tx.insert(User).values({
      name: data.name, email: data.email, role: defaultAccountRole, isActive: true, isDeleted: false,
    }).returning({ id: User.id });
    await tx.insert(UserAccounts).values({
      userId: account.id, type: 'credentials', provider: 'credentials',
      providerAccountId: account.id, password,
    });
    return account.id;
}

export async function registerAccount(input: unknown) {
  const data = signupSchema.parse(input);
  const password = await bcrypt.hash(data.password, 12);
  return db.transaction(tx => insertCredentialsAccount(tx, data, password));
}
