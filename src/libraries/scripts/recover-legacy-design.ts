import path from 'node:path';
import { prepareLegacyRecovery, verifyLegacyRecoveryPackage } from '../services/threed/design/legacy-recovery-files';
import { selectLegacyRecoveryDatabaseUrl } from '../services/threed/design/legacy-recovery-connection';

const help = `ThreeD legacy recovery

prepare --source <legacy-home-design> --plan <plan.json> --out <new-folder> [--openings report|native]
  Offline: copy/validate assets, bake legacy scales, convert architecture and write review.txt/recovery.json.
  report (default): preserve catalog models; list unresolved cutouts.
  native: replace provably compatible catalog openings with editable native openings/frames.
verify --bundle <prepared-folder>
  Offline: recheck manifest, hashes, geometry and material/texture dependencies.
apply --bundle <prepared-folder> --user-id <owner-id> --project-name <name> --accept-warnings --apply
  Explicit writes: create a NEW private Project and its Models/files/placements; never overwrite an existing Project.
  Requires DATABASE_URL and BLOB_READ_WRITE_TOKEN already set in your environment.
  A Neon pooled DATABASE_URL requires matching DATABASE_URL_UNPOOLED for the session recovery lock.
  Durable apply-journal.json supports confirmed progress; uncertain uploads require review.

No command starts a server. prepare/verify do not load database or storage clients.
`;

export function parseLegacyRecoveryArguments(args: string[]) {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') return { command: 'help' as const, options: new Map<string, string>() };
  const command = args[0];
  if (!['prepare', 'verify', 'apply'].includes(command)) throw new Error('Choose prepare, verify or apply. Use --help for usage.');
  const allowed = command === 'prepare' ? ['source', 'plan', 'out', 'openings'] : command === 'verify' ? ['bundle'] : ['bundle', 'user-id', 'project-name', 'accept-warnings', 'apply'];
  const options = new Map<string, string>();
  for (let index = 1; index < args.length; index++) {
    const argument = args[index];
    if (!argument.startsWith('--') || argument.includes('=')) throw new Error('Use --option value syntax.');
    const key = argument.slice(2);
    if (!allowed.includes(key) || options.has(key)) throw new Error(`Unknown or repeated option: --${key}.`);
    if (key === 'accept-warnings' || key === 'apply') options.set(key, 'true');
    else {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}.`);
      options.set(key, value);
    }
  }
  const required = command === 'prepare' ? ['source', 'plan', 'out'] : command === 'verify' ? ['bundle'] : ['bundle', 'user-id', 'project-name', 'accept-warnings', 'apply'];
  for (const key of required) if (!options.has(key)) throw new Error(`Missing required --${key}. Use --help for usage.`);
  if (command === 'prepare' && !['native', 'report'].includes(options.get('openings') ?? 'report')) throw new Error('--openings must be report or native.');
  if (command === 'apply' && (options.get('user-id')!.length > 200 || !options.get('project-name')!.trim() || options.get('project-name')!.length > 120)) throw new Error('Invalid owner ID or Project name.');
  return { command: command as 'prepare' | 'verify' | 'apply', options };
}

export async function runLegacyRecovery(args: string[]) {
  const { command, options } = parseLegacyRecoveryArguments(args);
  if (command === 'help') { console.log(help); return; }
  if (command === 'prepare') {
    const pkg = await prepareLegacyRecovery({ source: options.get('source')!, plan: options.get('plan')!, out: options.get('out')!, openings: (options.get('openings') ?? 'report') as 'native' | 'report' });
    console.log(`Prepared ${pkg.assets.length} Model variants and ${pkg.placements.length} placements. No uploads or database writes.`);
    console.log(`Review: ${path.resolve(options.get('out')!, 'review.txt')}`);
    console.log(`Fingerprint: ${pkg.fingerprint}`);
    return;
  }
  const root = path.resolve(options.get('bundle')!);
  const pkg = await verifyLegacyRecoveryPackage(root);
  if (command === 'verify') {
    console.log(`Verified ${pkg.assets.length} asset bundles, ${pkg.placements.length} placements and editable architecture. ${pkg.warnings.length} review notices.`);
    return;
  }
  // Live dependencies are imported only after explicit write flags and complete offline validation.
  const configuredDatabaseUrl = process.env.DATABASE_URL, blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!configuredDatabaseUrl || !blobToken) throw new Error('Apply requires DATABASE_URL and BLOB_READ_WRITE_TOKEN in the environment. No writes started.');
  const databaseUrl = selectLegacyRecoveryDatabaseUrl(configuredDatabaseUrl, process.env.DATABASE_URL_UNPOOLED);
  const { applyLegacyRecoveryToDatabase } = await import('../services/threed/design/legacy-recovery-database');
  const receipt = await applyLegacyRecoveryToDatabase(pkg, { databaseUrl, blobToken, root, journalPath: path.join(root, 'apply-journal.json'), projectName: options.get('project-name')!.trim(), userId: options.get('user-id')! });
  console.log(`Recovery ${receipt.operation}: Project #${receipt.projectId}; ${receipt.models.length} Models; ${receipt.markerCount} placements.`);
  console.log(`Open /dashboard/scene?projectId=${receipt.projectId}&view=design to inspect and continue editing.`);
}

// Retain an importable, side-effect-free argument parser for offline checks.
if (process.argv[1] && /(?:^|[\\/])recover-legacy-design\.(?:ts|js)$/.test(process.argv[1])) {
  runLegacyRecovery(process.argv.slice(2)).catch(error => {
    let message = error instanceof Error ? error.message : 'Legacy recovery failed.';
    for (const secret of [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED, process.env.BLOB_READ_WRITE_TOKEN]) if (secret) message = message.replaceAll(secret, '[redacted]');
    console.error(message); process.exitCode = 1;
  });
}
