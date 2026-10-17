'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function ModelTopViewImage({ modelId, value, disabled, onChange, onBusyChange }: { modelId?: number; value: string; disabled: boolean; onChange: (url: string) => void; onBusyChange: (busy: boolean) => void }) {
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
  return <section aria-label="Top-view image" className="mt-3 space-y-2 border-t pt-3">
    <h3 className="text-sm font-medium">Top-view image</h3>
    <p className="text-xs text-muted-foreground">Transparent PNG, up to 4 MB. Image edges must match the Model bounds; image up points toward negative Z. Upload attaches a File; Save Changes selects it for the 2D plan.</p>
    {!modelId ? <p className="text-xs">Create the Model first to attach its top-view image.</p> : <Input aria-label="Upload top-view PNG" type="file" accept=".png,image/png" disabled={disabled || busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />}
    {value && <><img src={value} alt="Model top view" className="h-28 w-full rounded border object-contain" /><Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={() => onChange('')}>Remove top view</Button></>}
    {busy && <p role="status" className="text-xs">Uploading top view...</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}
