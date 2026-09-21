import 'server-only';

const WINDOW_MS = 10 * 60 * 1_000;
const MAX_ATTEMPTS = 5;

interface AttemptWindow {
  count: number;
  resetsAt: number;
}

const attempts = new Map<string, AttemptWindow>();

function key(userId: string, farmbotId: number) {
  return `${userId}:${farmbotId}`;
}

export function consumeFarmBotLoginAttempt(userId: string, farmbotId: number): number | null {
  const now = Date.now();
  const attemptKey = key(userId, farmbotId);
  const current = attempts.get(attemptKey);

  if (!current || current.resetsAt <= now) {
    attempts.set(attemptKey, { count: 1, resetsAt: now + WINDOW_MS });
    return null;
  }

  if (current.count >= MAX_ATTEMPTS) {
    return Math.max(1, Math.ceil((current.resetsAt - now) / 1_000));
  }

  current.count += 1;
  return null;
}

export function clearFarmBotLoginAttempts(userId: string, farmbotId: number): void {
  attempts.delete(key(userId, farmbotId));
}
