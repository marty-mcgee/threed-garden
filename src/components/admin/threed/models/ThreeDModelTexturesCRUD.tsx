'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Check, Image, Loader2, Pencil, Search, ToggleLeft, ToggleRight, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface ModelTextureRow {
  id: number;
  textureName: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string;
  isActive: boolean;
  assignmentCount: number;
}

function formatSize(bytes: number | null) {
  if (bytes == null) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ThreeDModelTexturesCRUD() {
  const { showToast, ToastComponent } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [textures, setTextures] = useState<ModelTextureRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | 'upload' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadTextures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/model-textures');
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Failed to load ThreeD Model Textures');
      setTextures(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load ThreeD Model Textures', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadTextures(); }, [loadTextures]);

  const visibleTextures = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return textures;
    return textures.filter((texture) => (
      texture.textureName.toLowerCase().includes(query)
      || texture.fileName.toLowerCase().includes(query)
      || texture.mimeType.toLowerCase().includes(query)
    ));
  }, [search, textures]);

  const uploadTexture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setWorkingId('upload');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/threed/model-textures', { method: 'POST', body: formData });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Failed to upload Model Texture');
      await loadTextures();
      showToast(`${file.name} added to ThreeD Model Textures`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload Model Texture', 'error');
    } finally {
      setWorkingId(null);
    }
  };

  const updateTexture = async (id: number, update: { textureName?: string; isActive?: boolean }) => {
    setWorkingId(id);
    try {
      const response = await fetch('/api/threed/model-textures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...update }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Failed to update Model Texture');
      await loadTextures();
      setEditingId(null);
      showToast('Model Texture updated', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update Model Texture', 'error');
    } finally {
      setWorkingId(null);
    }
  };

  const deleteTexture = async (texture: ModelTextureRow) => {
    if (texture.assignmentCount > 0) {
      showToast('Remove this Texture from its Model assignments before deleting it.', 'error');
      return;
    }
    if (!window.confirm(`Delete Model Texture “${texture.textureName}”?`)) return;
    setWorkingId(texture.id);
    try {
      const response = await fetch(`/api/threed/model-textures?id=${texture.id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Failed to delete Model Texture');
      await loadTextures();
      showToast('Model Texture deleted', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete Model Texture', 'error');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {ToastComponent}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="hidden" onChange={uploadTexture} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Model Textures…" className="h-9 pl-8 text-xs" />
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={workingId === 'upload'} className="h-9 bg-cyan-600 text-white hover:bg-cyan-500">
          {workingId === 'upload' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Model Texture
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : visibleTextures.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {textures.length === 0 ? 'No ThreeD Model Textures have been uploaded yet.' : 'No Model Textures match this search.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTextures.map((texture) => (
            <article key={texture.id} className="overflow-hidden rounded-lg border bg-muted/15">
              <div className="aspect-video bg-slate-950/70">
                <img src={texture.filePath} alt={texture.textureName} className="h-full w-full object-contain" loading="lazy" />
              </div>
              <div className="space-y-2 p-3">
                {editingId === texture.id ? (
                  <div className="flex gap-2">
                    <Input value={editingName} maxLength={255} onChange={(event) => setEditingName(event.target.value)} className="h-8 text-xs" />
                    <Button size="icon" className="h-8 w-8" disabled={!editingName.trim() || workingId === texture.id} onClick={() => void updateTexture(texture.id, { textureName: editingName.trim() })}><Check className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Image className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold">{texture.textureName}</h2>
                      <p className="truncate text-[10px] text-muted-foreground">{texture.fileName} · {formatSize(texture.fileSize)}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{texture.assignmentCount} uses</Badge>
                  </div>
                )}
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setEditingId(texture.id); setEditingName(texture.textureName); }}><Pencil className="mr-1 h-3 w-3" />Rename</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" disabled={workingId === texture.id} onClick={() => void updateTexture(texture.id, { isActive: !texture.isActive })}>
                    {texture.isActive ? <ToggleRight className="mr-1 h-3.5 w-3.5 text-emerald-400" /> : <ToggleLeft className="mr-1 h-3.5 w-3.5" />}{texture.isActive ? 'Active' : 'Inactive'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete Model Texture" disabled={workingId === texture.id || texture.assignmentCount > 0} onClick={() => void deleteTexture(texture)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
