import { createHash } from 'node:crypto';
import { resolveObjPath } from '../models/model-obj-core';
import type { LegacyRecoveryFile, LegacyRecoveryPackage, LegacyRecoveryReceipt } from './legacy-recovery-contract';

export interface LegacyRecoveryApplyOptions { userId: string; projectName: string }
export interface LegacyRecoveryUpload extends LegacyRecoveryFile { url: string }
export interface LegacyRecoveryJournal {
  version: 1; userId: string; fingerprint: string; projectName: string;
  database: 'not-started' | 'pending' | 'uncertain' | 'complete';
  files: Array<LegacyRecoveryFile & { status: 'pending' | 'confirmed' | 'uncertain'; url?: string }>;
  receipt?: LegacyRecoveryReceipt;
}
/** All live effects are injected. The offline planner never constructs these boundaries. */
export interface LegacyRecoveryApplyBoundary {
  withLock<T>(work: () => Promise<T>): Promise<T>;
  ownerExists(): Promise<boolean>;
  findCommitted(): Promise<LegacyRecoveryReceipt | null>;
  readJournal(): Promise<LegacyRecoveryJournal | null>;
  writeJournal(value: LegacyRecoveryJournal): Promise<void>;
  upload(file: LegacyRecoveryFile, pathname: string): Promise<string>;
  commit(files: LegacyRecoveryUpload[]): Promise<LegacyRecoveryReceipt>;
}
export function legacyRecoveryBlobPath(userId: string, fingerprint: string, file: LegacyRecoveryFile): string {
  const owner = createHash('sha256').update(userId).digest('hex').slice(0, 24);
  return `threed/recovery/${owner}/${fingerprint}/${file.path}`;
}
export function isLegacyRecoveryBlobUrl(url: string, userId: string, fingerprint: string, file: LegacyRecoveryFile): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname)
      && !parsed.username && !parsed.password && !parsed.port && !parsed.search && !parsed.hash
      && decodeURIComponent(parsed.pathname.slice(1)) === legacyRecoveryBlobPath(userId, fingerprint, file);
  } catch { return false; }
}
function assertReceipt(receipt: LegacyRecoveryReceipt, pkg: LegacyRecoveryPackage, options: LegacyRecoveryApplyOptions) {
  if (receipt.version !== 1 || receipt.fingerprint !== pkg.fingerprint || receipt.userId !== options.userId
    || !Number.isSafeInteger(receipt.projectId) || receipt.projectId <= 0 || !Number.isSafeInteger(receipt.threedId) || receipt.threedId <= 0
    || receipt.markerCount !== pkg.placements.length || receipt.models.length !== pkg.assets.length
    || new Set(receipt.models.map(model => model.key)).size !== pkg.assets.length
    || new Set(receipt.models.map(model => model.modelId)).size !== pkg.assets.length
    || pkg.assets.some(asset => !receipt.models.some(model => model.key === asset.key && Number.isSafeInteger(model.modelId) && model.modelId > 0))) {
    throw new Error('Recovery result was not confirmed. Retain the journal for review.');
  }
}

/** Create-only recovery. Ambiguous uploads/commits are retained for review, never automatically replayed. */
export async function applyLegacyRecovery(pkg: LegacyRecoveryPackage, options: LegacyRecoveryApplyOptions, boundary: LegacyRecoveryApplyBoundary): Promise<LegacyRecoveryReceipt> {
  if (!/^[a-f0-9]{64}$/.test(pkg.fingerprint) || !options.userId.trim() || !options.projectName.trim() || options.projectName.length > 120) throw new Error('Invalid recovery owner, fingerprint or Project name.');
  const files = new Map<string, LegacyRecoveryFile>();
  for (const asset of pkg.assets) for (const file of asset.files) {
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes <= 0
      || typeof file.path !== 'string' || /[\u0000-\u001f]/.test(file.path) || resolveObjPath(file.path) !== file.path) throw new Error('Invalid prepared recovery file.');
    const prior = files.get(file.path);
    if (prior && JSON.stringify(prior) !== JSON.stringify(file)) throw new Error('Conflicting prepared recovery files.');
    files.set(file.path, file);
  }
  return boundary.withLock(async () => {
    if (!await boundary.ownerExists()) throw new Error('Recovery owner does not exist.');
    let journal = await boundary.readJournal();
    if (journal && (journal.version !== 1 || journal.userId !== options.userId || journal.fingerprint !== pkg.fingerprint || journal.projectName !== options.projectName || !Array.isArray(journal.files))) throw new Error('Journal belongs to another recovery. Use its original owner, package and Project name.');
    journal ??= { version: 1, userId: options.userId, fingerprint: pkg.fingerprint, projectName: options.projectName, database: 'not-started', files: [] };
    // A lost success response or local journal write may be reconciled only against a fully verified DB result.
    const existing = await boundary.findCommitted();
    if (existing) {
      assertReceipt(existing, pkg, options);
      const receipt = { ...existing, operation: 'existing' as const };
      await boundary.writeJournal({ ...journal, database: 'complete', receipt }); return receipt;
    }
    if (journal.database !== 'not-started') throw new Error('Previous database outcome requires review; no verified recovery Project was found. Nothing will be replayed.');
    const known = new Map(journal.files.map(file => [file.path, file]));
    if (known.size !== journal.files.length) throw new Error('Duplicate journal files require review.');
    for (const file of journal.files) {
      const expected = files.get(file.path);
      if (!expected || expected.sha256 !== file.sha256 || expected.bytes !== file.bytes || expected.role !== file.role) throw new Error('Journal does not match the prepared files.');
      if (file.status !== 'confirmed' || !file.url) throw new Error(`Uncertain upload requires review: ${file.path}. Nothing will be replayed.`);
      if (!isLegacyRecoveryBlobUrl(file.url, options.userId, pkg.fingerprint, file)) throw new Error('Journal upload URL does not match its immutable recovery path.');
    }
    for (const file of files.values()) {
      if (known.has(file.path)) continue;
      const entry: LegacyRecoveryJournal['files'][number] = { ...file, status: 'pending' };
      journal.files.push(entry); await boundary.writeJournal(journal);
      try {
        entry.url = await boundary.upload(file, legacyRecoveryBlobPath(options.userId, pkg.fingerprint, file));
        if (!isLegacyRecoveryBlobUrl(entry.url, options.userId, pkg.fingerprint, file)) throw new Error('Storage did not confirm the requested recovery path.');
        entry.status = 'confirmed'; await boundary.writeJournal(journal);
      } catch (error) {
        entry.status = 'uncertain'; await boundary.writeJournal(journal);
        throw new Error(`Upload outcome requires review for ${file.path}; retain the journal. ${error instanceof Error ? error.message : 'Upload failed.'}`);
      }
    }
    journal.database = 'pending'; await boundary.writeJournal(journal);
    try {
      const receipt = await boundary.commit(journal.files.map(file => ({ path: file.path, bytes: file.bytes, sha256: file.sha256, role: file.role, url: file.url! })));
      assertReceipt(receipt, pkg, options);
      journal.database = 'complete'; journal.receipt = receipt; await boundary.writeJournal(journal); return receipt;
    } catch (error) {
      journal.database = 'uncertain'; await boundary.writeJournal(journal);
      throw new Error(`Database outcome requires review; uploaded files are retained. ${error instanceof Error ? error.message : 'Commit failed.'}`);
    }
  });
}
