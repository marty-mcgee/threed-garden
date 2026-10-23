'use client';
import { useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { ModelFieldHelp } from './ModelFieldHelp';
export function ModelTopViewImage({ modelId, value, disabled, onChange, onBusyChange, exportAction }: { exportAction?: ReactNode; modelId?: number; value: string; disabled: boolean; onChange: (url: string) => void; onBusyChange: (busy: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const locationId = useId();
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  async function upload(file: File) {
    if (!modelId || busy) return;
    if (file.size > 4 * 1024 * 1024 || file.type !== 'image/png') { setError('Choose a PNG up to 4 MB.'); return; }
    setBusy(true); onBusyChange(true); setError(null);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch(`/api/threed/models/${modelId}/top-view-image`, { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.data?.url !== 'string') throw Error(result.error || 'Upload failed');
      onChange(result.data.url);
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed; retry.'); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <section aria-label="Top-view image" className="space-y-2">
    <div className="flex items-center gap-1"><h3 className="text-sm font-medium">Top View Image</h3><ModelFieldHelp label="Top-view image">Transparent PNG, up to 4 MB. Image edges must match the Model bounds; image up points toward negative Z. Upload attaches a File; Save Changes selects it for the 2D plan. Use upload or export to replace this owned attachment.</ModelFieldHelp></div>
    <div className="space-y-2">
      <details className="rounded-md border p-2">
        <summary className="cursor-pointer text-xs font-medium">Image location</summary>
        <Label htmlFor={locationId} className="mt-2 block text-xs">Image URL</Label>
        <Input id={locationId} value={value} readOnly placeholder="Upload or export a Top View image" />
      </details>
      {value && <img src={value} alt="Model top view" className="h-28 w-full rounded border bg-transparent object-contain" />}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} aria-label="Upload top-view PNG" type="file" className="hidden" accept=".png,image/png" disabled={!modelId || disabled || busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={!modelId || disabled || busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
          {value ? 'Replace Preview' : 'Upload Preview'}
        </Button>
        {exportAction}
        {value && <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" disabled={disabled || busy} onClick={() => onChange('')}><X className="mr-1 h-4 w-4" />Remove</Button>}
      </div>
    </div>
    {!modelId && <p className="text-[10px] text-muted-foreground">Create the Model first to attach its top-view image.</p>}
    {busy && <p role="status" className="text-xs">Uploading top view...</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}
