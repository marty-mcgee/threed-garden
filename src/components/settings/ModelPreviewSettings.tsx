'use client';
import { useEffect, useState } from 'react';
import { Image, Save } from 'lucide-react';
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
    <legend className="px-1 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Image aria-hidden="true" className="h-3.5 w-3.5 text-violet-500" />Model Preview Images <span className="font-normal text-muted-foreground">· This browser</span></span></legend>
    <p className="mb-2 text-xs text-muted-foreground">Default PNG dimensions for single and batch exports. Batch dimensions can be overridden before starting. 64–2048 pixels per side.</p>
    <div className="flex flex-wrap items-end gap-2">
      {(['width', 'height'] as const).map(axis => <label key={axis} className="space-y-1 text-xs capitalize">{axis} (px)
        <input type="number" min={64} max={2048} step={1} className="block h-8 w-24 rounded-md border bg-background px-2 text-xs [@media(pointer:coarse)]:min-h-11" value={draft[axis] || ''} onChange={event => setDraft({ ...draft, [axis]: Number(event.target.value) })} />
      </label>)}
      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs [@media(pointer:coarse)]:min-h-11" disabled={!validPreviewSize(draft)} onClick={() => {
        try { localStorage.setItem(KEY, JSON.stringify(draft)); window.dispatchEvent(new Event('threed-preview-settings')); setMessage('Preview defaults saved in this browser.'); }
        catch { setMessage('Browser storage unavailable; defaults could not be saved.'); }
      }}><Save aria-hidden="true" className="h-3.5 w-3.5 text-violet-500" />Save preview defaults</Button>
    </div>
    <p role="status" className="mt-2 text-xs">{message}</p>
  </fieldset>;
}
