'use client';

import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseDesign, type DesignDocument } from '@/libraries/services/threed/design/document';

/** Parsing is staged; only explicit Import may mutate the current architecture. */
export function DesignImportDialog({ open, onOpenChange, onImport }: {
  open: boolean; onOpenChange: (value: boolean) => void;
  onImport: (document: DesignDocument, mode: 'merge' | 'replace') => void;
}) {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [document, setDocument] = useState<DesignDocument | null>(null);
  const [error, setError] = useState(''), [reading, setReading] = useState(false);
  const request = useRef(0);
  useEffect(() => { ++request.current; setDocument(null); setError(''); setReading(false); return () => { ++request.current; }; }, [open]);
  async function choose(file?: File) {
    const token = ++request.current; setDocument(null); setError('');
    if (!file) { setReading(false); return; }
    setReading(true);
    try {
      if (file.size > 1_048_576) throw new Error('Choose a Design JSON file no larger than 1 MiB.');
      const parsed = parseDesign(await file.text());
      if (token === request.current) setDocument(parsed);
    } catch (error) { if (token === request.current) setError(error instanceof Error ? error.message : 'Invalid Design JSON.'); }
    finally { if (token === request.current) setReading(false); }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="threed-workspace-panel threed-scene-panel-surface" onKeyDown={event => event.stopPropagation()}>
    <DialogHeader><DialogTitle>Import Design JSON</DialogTitle><DialogDescription>Import architectural content into this Project. Existing Models and other Scene content are retained.</DialogDescription></DialogHeader>
    <Input type="file" accept=".json,application/json" aria-label="Import design JSON" onChange={event => void choose(event.target.files?.[0])} />
    <label className="space-y-1 text-sm">Import behavior<select aria-label="JSON import behavior" className="h-8 w-full rounded border bg-background px-2" value={mode} onChange={event => setMode(event.target.value as 'merge' | 'replace')}><option value="merge">Merge architectural content</option><option value="replace">Replace architectural content only</option></select></label>
    <p role="status" className="text-xs text-muted-foreground">{reading ? 'Validating file...' : document ? `${document.name}: valid editable architecture. ${mode === 'replace' ? 'Import replaces the current architecture.' : 'Import adds its architecture with new IDs.'}` : 'Choose a JSON file to validate before importing.'}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!document || reading} onClick={() => {
      if (!document) return;
      try { onImport(document, mode); onOpenChange(false); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to import.'); }
    }}>Import</Button></DialogFooter>
  </DialogContent></Dialog>;
}
