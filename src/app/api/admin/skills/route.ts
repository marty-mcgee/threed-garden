import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { auth } from '@/libraries/auth';
import { requireUsersAdmin, UserAdminError } from '@/libraries/services/users/admin';
import { readUserRequest, userResponse } from '@/libraries/services/users/http';

export const runtime = 'nodejs';
const run = promisify(execFile);
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const threadPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return userResponse({ error: 'Sign in required.' }, 401);
    await requireUsersAdmin(session.user.id);
    const input = await readUserRequest(request);
    if (!input || typeof input !== 'object' || Object.keys(input).length !== 2 ||
        !('skill' in input) || input.skill !== 'prepare-threed-app-version' ||
        !('version' in input) || typeof input.version !== 'string' || input.version.length > 30 ||
        !versionPattern.test(input.version) || input.version !== input.version.trim()) {
      return userResponse({ error: 'Choose the release preparation Skill and enter a version such as 0.35.10.' }, 400);
    }
    const thread = process.env.THREED_SKILLS_THREAD_ID;
    if (!thread || !threadPattern.test(thread)) return userResponse({ error: 'Configure the Codex target thread on the App host.' }, 503);
    const args = [
      'queue',
      '--thread', thread,
      '--resume',
      '--message', `Apply $prepare-threed-app-version for v${input.version} in the ThreeD Garden checkout. Coordinate with other agents as needed. Leave the release unstaged for manual deployment.`,
    ];
    const environment: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV };
    for (const key of ['PATH', 'HOME', 'USERPROFILE', 'SystemRoot', 'LOCALAPPDATA', 'APPDATA', 'TEMP', 'TMP', 'CODEX_HOME']) {
      if (process.env[key]) environment[key] = process.env[key];
    }
    const remote = process.env.THREED_SKILLS_AGENT_URL;
    if (remote) {
      let url: URL;
      try { url = new URL(remote); } catch { return userResponse({ error: 'Invalid Agent endpoint configuration.' }, 503); }
      if (url.protocol !== 'wss:' || url.username || url.password || url.search || url.hash) {
        return userResponse({ error: 'Configure a secure WebSocket Agent endpoint on the App host.' }, 503);
      }
      args.push('--remote', remote);
      if (process.env.THREED_SKILLS_AGENT_TOKEN) {
        environment.THREED_SKILLS_AGENT_TOKEN = process.env.THREED_SKILLS_AGENT_TOKEN;
        args.push('--remote-auth-token-env', 'THREED_SKILLS_AGENT_TOKEN');
      }
    }
    try {
      await run(process.platform === 'win32' ? 'codex.exe' : 'codex', args, {
        env: environment,
        timeout: 15000,
        windowsHide: true,
        maxBuffer: 65536,
      });
    } catch {
      return userResponse({ error: 'Queue delivery could not be confirmed. Check the Agent conversation before retrying.' }, 503);
    }
    return userResponse({ status: 'queued', skill: input.skill, version: input.version }, 202);
  } catch (error) {
    if (error instanceof UserAdminError) return userResponse({ error: error.status === 413 ? 'Skill request is too large.' : error.message }, error.status);
    if (error instanceof SyntaxError) return userResponse({ error: 'Invalid Skill request.' }, 400);
    return userResponse({ error: 'Skill request unavailable.' }, 503);
  }
}
