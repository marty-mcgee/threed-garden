'use client';

import { useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DuplicateSavedObject({ kind, sourceId, compact = false, disabled = false, onCopied }: { kind: 'project' | 'model' | 'character' | 'terrain' | 'texture'; sourceId: number; compact?: boolean; disabled?: boolean; onCopied?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number>();
  const attempt = useRef<string | undefined>(undefined);
  const submitting = useRef(false);
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  async function duplicate() {
    if (submitting.current || !name.trim()) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      attempt.current ??= JSON.stringify({ ...(kind === 'project' ? { sourceProjectId: sourceId } : { kind, sourceId }), name: name.trim(), requestKey: crypto.randomUUID() });
      const response = await fetch(kind === 'project' ? '/api/project/duplicate' : '/api/threed/duplicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: attempt.current });
      const data = await response.json();
      const id = kind === 'project' ? data.data?.projectId : data.id;
      if (!response.ok || !Number.isSafeInteger(id) || id <= 0 || id === sourceId) {
        if (response.status >= 400 && response.status < 500 && response.status !== 408) attempt.current = undefined;
        throw new Error(data.error || 'Could not confirm the copy.');
      }
      setResult(id);
      attempt.current = undefined;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm the copy.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return <>
    <Button type="button" variant={compact ? 'ghost' : 'outline'} size={compact ? 'icon' : 'sm'} disabled={disabled}
      className={compact ? 'h-8 w-8' : 'h-7 px-2 text-xs'} title={`Duplicate saved ${label} #${sourceId}`} aria-label={`Duplicate saved ${label} #${sourceId}`}
      onClick={() => { if (result) { setResult(undefined); setName(''); } setOpen(true); }}><Copy aria-hidden="true" className="size-4" />{!compact && `Duplicate saved ${label}`}</Button>
    <Dialog open={open} onOpenChange={next => { if (!submitting.current) { setOpen(next); if (!next && result) onCopied?.(); } }}>
      <DialogContent>
        <DialogTitle>Duplicate {label} #{sourceId}</DialogTitle>
        <DialogDescription>{kind === 'project' ? 'Create a private copy of the saved Project. To include unsaved Scene edits, use Save As: New Version in the Scene.' : kind === 'texture' ? 'Copy this Texture and its stored image. Existing Models keep their current assignments.' : kind === 'terrain' ? 'Copy the latest saved surface into revision 1 of a new Terrain.' : 'Create an independent record from the last saved settings.'}</DialogDescription>
        {result && kind === 'texture' ? <Button onClick={() => { setOpen(false); onCopied?.(); }}>Done (Texture #{result})</Button> : result ? <Button asChild><a href={kind === 'project' ? '/admin/projects/' + result : '/admin/threed/' + kind + 's/' + result} target="_blank" rel="noopener noreferrer">Open {label} #{result} in a new tab</a></Button> :
          <form className="space-y-3" onSubmit={event => { event.preventDefault(); void duplicate(); }}>
            <Label htmlFor="copy-name">New {label} name</Label>
            <Input id="copy-name" required maxLength={120} value={name} disabled={busy || !!attempt.current} onChange={event => setName(event.target.value)} />
            {error && <p role="alert">{error}</p>}
            <Button disabled={busy || !name.trim()}>{busy ? 'Creating copy' : attempt.current ? 'Retry same copy' : 'Create copy'}</Button>
          </form>}
      </DialogContent>
    </Dialog>
  </>;
}
