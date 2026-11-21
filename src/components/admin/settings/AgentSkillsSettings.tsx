'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { version as appVersion } from '../../../../package.json';

const skill = 'prepare-threed-app-version';
const releaseVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function AgentSkillsSettings() {
  const [version, setVersion] = useState(appVersion);
  const [sending, setSending] = useState(false);
  const [queuedVersion, setQueuedVersion] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const target = version.trim().replace(/^v/, '');

  async function requestSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || queuedVersion === target || !releaseVersion.test(target)) return;
    pending.current = true;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill,
          version: target,
        }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (response.status !== 202 || result?.status !== 'queued' || result.skill !== skill || result.version !== target) {
        setError(typeof result?.error === 'string' ? result.error : 'Queue confirmation is unavailable. Check the Agent conversation before retrying.');
        return;
      }
      setQueuedVersion(target);
    } catch {
      setError('Queue confirmation is unavailable. Check the Agent conversation before retrying.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return <SettingsSection section="skills" className="admin-editor-panel rounded-md border border-border/60">
    <summary className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11">
      <span className="inline-flex items-center gap-1.5"><Send aria-hidden="true" className="h-3.5 w-3.5" />Skills</span>
    </summary>
    <form className="space-y-2 px-3 pb-3 text-xs" onSubmit={requestSkill}>
      <p>Ask the configured Agent to prepare a ThreeD App version for manual release.</p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="agent-skill-version">Release version</label>
        <Input id="agent-skill-version" className="h-8 w-32" value={version} required maxLength={32}
          placeholder={appVersion} disabled={sending} onChange={event => {
            setVersion(event.target.value);
            setError('');
          }} />
        <Button type="submit" size="sm" disabled={sending || !releaseVersion.test(target) || queuedVersion === target}>
          {sending ? 'Sending…' : 'Queue release preparation'}
        </Button>
      </div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <p role="status">{queuedVersion && `Release preparation for v${queuedVersion} was queued. Follow progress in the Agent conversation.`}</p>
    </form>
  </SettingsSection>;
}
