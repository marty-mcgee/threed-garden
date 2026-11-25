import { and, eq } from 'drizzle-orm';
import type { Transaction } from '@/libraries/db/client';
import { project } from '@/libraries/schema/project';
import { threedCharacters, threedDuplicateReceipts as receipts, threedModels, threedTerrains } from '@/libraries/schema/threed';

export class DuplicateError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const destinations = {
  project,
  model: threedModels,
  character: threedCharacters,
  terrain: threedTerrains,
};

interface CopyIdentity {
  userId: string;
  requestKey: string;
  kind: keyof typeof destinations;
  sourceId: number;
  name: string;
  requestHash?: string;
}

// Reservation, copy and completion all use the caller's transaction.
export async function reserveDuplicate(tx: Transaction, input: CopyIdentity) {
  const scope = and(eq(receipts.userId, input.userId), eq(receipts.requestKey, input.requestKey));
  const [reserved] = await tx.insert(receipts).values(input).onConflictDoNothing().returning();
  if (reserved) return { scope };
  const [prior] = await tx.select().from(receipts).where(scope);
  // A migrated Project's current name or parent may no longer match its
  // original request. Its hash covers both values and the submitted Scene.
  if (!prior || prior.kind !== input.kind || !prior.destinationId || (input.requestHash
    ? prior.requestHash !== input.requestHash
    : prior.sourceId !== input.sourceId || prior.name !== input.name)) {
    throw new DuplicateError('This request key belongs to a different copy.', 409);
  }
  const table = destinations[input.kind];
  const [existing] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, prior.destinationId), eq(table.userId, input.userId)));
  if (!existing) throw new DuplicateError('The previously created copy is no longer available.', 410);
  return { scope, existingId: existing.id };
}

export async function completeDuplicate(tx: Transaction, reservation: Awaited<ReturnType<typeof reserveDuplicate>>, destinationId: number) {
  await tx.update(receipts).set({ destinationId }).where(reservation.scope);
}
