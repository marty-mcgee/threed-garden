'use client';

import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DesignDocument } from '@/libraries/services/threed/design/document';
import { parseDesignImport, type DesignImportPreview } from '@/libraries/services/threed/design/design-import';

/** Parsing is staged; only explicit Import may mutate the current architecture. */
export function DesignImportDialog({ open, onOpenChange, onImport }: {
  open: boolean; onOpenChange: (value: boolean) => void;
  onImport: (document: DesignDocument, mode: 'merge' | 'replace') => void;
}) {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [preview, setPreview] = useState<DesignImportPreview | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState(''), [reading, setReading] = useState(false);
  const request = useRef(0);
  useEffect(() => { ++request.current; setPreview(null); setAcknowledged(false); setError(''); setReading(false); return () => { ++request.current; }; }, [open]);
  async function choose(file?: File) {
    const token = ++request.current; setPreview(null); setAcknowledged(false); setError('');
    if (!file) { setReading(false); return; }
    setReading(true);
    try {
      if (file.size > 1_048_576) throw new Error('Choose a Design JSON file no larger than 1 MiB.');
      const parsed = parseDesignImport(await file.text(), file.name);
      if (token === request.current) setPreview(parsed);
    } catch (error) { if (token === request.current) setError(error instanceof Error ? error.message : 'Invalid Design JSON.'); }
    finally { if (token === request.current) setReading(false); }
  }
  const document = preview?.document;
  const needsReview = !!preview?.warnings.length;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="threed-workspace-panel threed-scene-panel-surface max-h-[calc(100dvh-2rem)] overflow-y-auto" onKeyDown={event => event.stopPropagation()}>
    <DialogHeader><DialogTitle>Import Design JSON</DialogTitle><DialogDescription>Import architectural content into this Project. Existing Models and other Scene content are retained.</DialogDescription></DialogHeader>
    <Input type="file" accept=".json,.threed,application/json" aria-label="Import design JSON" onChange={event => void choose(event.target.files?.[0])} />
    <label className="space-y-1 text-sm">Import behavior<select aria-label="JSON import behavior" className="h-8 w-full rounded border bg-background px-2" value={mode} onChange={event => setMode(event.target.value as 'merge' | 'replace')}><option value="merge">Merge architectural content</option><option value="replace">Replace architectural content only</option></select></label>
    <p role="status" className="text-xs text-muted-foreground">{reading ? 'Validating file...' : document ? `${document.name}: valid editable architecture. ${mode === 'replace' ? 'Import replaces the current architecture.' : 'Import adds its architecture with new IDs.'}` : 'Choose a JSON file to validate before importing.'}</p>
    {document && <p className="text-xs text-muted-foreground">{preview.source === 'legacy' && 'Legacy centimetres converted to metres; original X/Z positions retained. '}{document.levels.length} levels · {document.walls.length} walls · {document.floors.length} floors · {document.roofs.length} roofs · {document.openings.length + document.roofOpenings.length} openings</p>}
    {needsReview && <section aria-label="Legacy import review" className="space-y-2 rounded-md border border-amber-500/40 p-3 text-sm">
      <p className="font-semibold">Review content that will not be imported</p>
      <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs">{preview.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
      <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} aria-label="Import supported architecture only" /><span>Import supported architecture only. I understand the items listed above will be omitted.</span></label>
    </section>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!document || reading || (needsReview && !acknowledged)} onClick={() => {
      if (!document || reading || (needsReview && !acknowledged)) return;
      try { onImport(document, mode); onOpenChange(false); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to import.'); }
    }}>Import</Button></DialogFooter>
  </DialogContent></Dialog>;
}
