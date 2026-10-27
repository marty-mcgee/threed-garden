// Developer-operated only. No App route imports this module.
// Default is a read-only inspection; --apply explicitly enables the transaction.
class BootstrapError extends Error {}

function parseArguments(args) {
  if (args.length === 1 && args[0] === '--help') return { help: true };
  const allowed = args.length === 2 || (args.length === 3 && args[2] === '--apply');
  if (!allowed || args[0] !== '--user-id' || !args[1]?.trim() || args[1].startsWith('--') || args[1].length > 256) {
    throw new BootstrapError('Usage: node src/libraries/scripts/bootstrap-super-admin.cjs --user-id <existing-id> [--apply]');
  }
  return { userId: args[1], apply: args[2] === '--apply' };
}

async function bootstrap(client, userId, apply = false) {
  await client.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
  try {
    if (apply) {
      await client.query("SET LOCAL lock_timeout = '5s'");
      // Same lock as the App role editor: concurrent bootstrap/role writes serialize.
      await client.query('SELECT pg_advisory_xact_lock(740027, 1)');
    }
    const existing = await client.query("SELECT id FROM public.\"user\" WHERE role = 'super_admin' LIMIT 1");
    if (existing.rows.length) throw new BootstrapError('A Super Admin already exists. Bootstrap is closed, including for inactive Super Admins.');
    const target = await client.query(
      'SELECT id, role, is_active FROM public."user" WHERE id = $1' + (apply ? ' FOR UPDATE' : ''), [userId],
    );
    const account = target.rows[0];
    if (!account) throw new BootstrapError('No User matches that ID. No account was created.');
    if (account.is_active !== true) throw new BootstrapError('The selected User must already be active.');
    if (!['user', 'admin'].includes(account.role)) throw new BootstrapError('The selected User has an unrecognized role. Review it before bootstrap.');
    if (apply) {
      await client.query('UPDATE public."user" SET role = $1, updated_at = now() WHERE id = $2', ['super_admin', userId]);
      // The installing developer attests to this existing account. Actor and target
      // identify the bootstrapped account; no browser identity is claimed.
      await client.query('INSERT INTO public.user_role_audit (actor_user_id, target_user_id, previous_role, new_role) VALUES ($1, $1, $2, $3)', [userId, account.role, 'super_admin']);
    }
    await client.query('COMMIT');
    return { applied: apply, userId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  let client;
  try {
    const args = parseArguments(process.argv.slice(2));
    if (args.help) {
      console.log('Usage: node src/libraries/scripts/bootstrap-super-admin.cjs --user-id <existing-id> [--apply]\nWithout --apply: read-only eligibility inspection. Reads DATABASE_URL from environment or local Next.js environment files.');
      return;
    }
    require('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
    if (!process.env.DATABASE_URL) throw new BootstrapError('DATABASE_URL is required in the developer environment.');
    const { Client } = require('pg');
    client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
    await client.connect();
    const result = await bootstrap(client, args.userId, args.apply);
    console.log(result.applied ? 'First Super Admin assigned and audited.' : 'User is eligible. No changes made. Apply the audit compatibility SQL before rerunning with --apply.');
  } catch (error) {
    console.error(error instanceof BootstrapError ? error.message : 'Bootstrap failed. No completed promotion is confirmed. Verify database access and the audit compatibility SQL; inspect the account before retrying.');
    process.exitCode = 1;
  } finally {
    if (client) await client.end();
  }
}

module.exports = { bootstrap, parseArguments, BootstrapError };
if (require.main === module) void main();
