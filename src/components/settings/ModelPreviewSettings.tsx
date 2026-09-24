'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
export type PreviewSize = { width: number; height: number };
export const DEFAULT_PREVIEW_SIZE: PreviewSize = { width: 400, height: 400 };
const KEY = 'threed:model-preview-size:v1';
export function validPreviewSize(size: PreviewSize) {
  return [size.width, size.height].every(value => Number.isInteger(value) && value >= 64 && value <= 2048);
}
export function useModelPreviewSize() {
  const [size, setSize] = useState(DEFAULT_PREVIEW_SIZE);
  useEffect(() => {
    const read = () => {
      try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); setSize(value && validPreviewSize(value) ? value : DEFAULT_PREVIEW_SIZE); }
      catch { setSize(DEFAULT_PREVIEW_SIZE); }
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('threed-preview-settings', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('threed-preview-settings', read); };
  }, []);
  return size;
}
export function ModelPreviewSettings() {
  const size = useModelPreviewSize();
  const [draft, setDraft] = useState(size);
  const [message, setMessage] = useState('');
  useEffect(() => setDraft(size), [size]);
  return <fieldset className="rounded-md border p-3">
    <legend className="px-1 text-sm font-medium">ThreeD Model Preview Images · This browser</legend>
    <p className="mb-3 text-xs text-muted-foreground">Default PNG dimensions for single and batch exports. Batch dimensions can be overridden before starting. 64–2048 pixels per side.</p>
    <div className="flex flex-wrap gap-3">
      {(['width', 'height'] as const).map(axis => <label key={axis} className="text-sm capitalize">{axis} (px)
        <input type="number" min={64} max={2048} step={1} className="ml-2 w-24 rounded border bg-background p-2" value={draft[axis] || ''} onChange={event => setDraft({ ...draft, [axis]: Number(event.target.value) })} />
      </label>)}
      <Button type="button" disabled={!validPreviewSize(draft)} onClick={() => {
        try { localStorage.setItem(KEY, JSON.stringify(draft)); window.dispatchEvent(new Event('threed-preview-settings')); setMessage('Preview defaults saved in this browser.'); }
        catch { setMessage('Browser storage unavailable; defaults could not be saved.'); }
      }}>Save preview defaults</Button>
    </div>
    <p role="status" className="mt-2 text-xs">{message}</p>
  </fieldset>;
}
