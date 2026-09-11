'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, Check, X, Images, FolderTree, FolderOpen, Clapperboard, ExternalLink, Loader2, Pencil, ToggleLeft, ToggleRight, Trash2, Upload } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TextureSortField } from '@/lib/services/threed/models/texture-list-query';
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
  fileReferenceCount: number;
}

function formatSize(bytes: number | null) {
  if (bytes == null) return '—';
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
  const [workingId, setWorkingId] = useState<number | 'upload' | 'delete' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<{ field: TextureSortField; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ModelTextureRow | null>(null);
  const [revision, setRevision] = useState(0);
  const mutationLock = useRef(false);
  const loadTextures = useCallback(async () => { setRevision((value) => value + 1); }, []);
  const busy = workingId !== null;
  const references = (texture: ModelTextureRow) => texture.assignmentCount + (texture.fileReferenceCount ?? 0);
  const deletable = textures.filter((texture) => references(texture) === 0);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true); setError(''); setSelected(new Set()); setEditingId(null);
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize), search, sort: sort.field, direction: sort.direction });
    void fetch(`/api/threed/model-textures?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!current) return;
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load Model Textures');
        const count = Number(result.pagination.total);
        setTotal(count);
        const last = Math.max(0, Math.ceil(count / pageSize) - 1);
        if (page > last) { setPage(last); return; }
        setTextures(result.data);
      }).catch((cause) => { if (current) { setTextures([]); setError(cause.message || 'Failed to load Model Textures'); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; controller.abort(); };
  }, [page, pageSize, search, sort.field, sort.direction, revision]);

  const uploadTexture = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || mutationLock.current) return;
    mutationLock.current = true;
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
      mutationLock.current = false;
      setWorkingId(null);
    }
  };

  const updateTexture = async (id: number, update: { textureName?: string; isActive?: boolean }) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
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
      mutationLock.current = false;
      setWorkingId(null);
    }
  };

  const deleteTextures = async (targets: ModelTextureRow[]) => {
    if (mutationLock.current || !targets.length) return;
    if (targets.some((texture) => references(texture) > 0)) {
      showToast('Remove Model assignments and file references before deleting a Texture.', 'error'); return;
    }
    if (!confirm(`Delete ${targets.length} Model Texture(s)?\n${targets.map((texture) => texture.textureName).join('\n')}\nStored files will be deleted. This cannot be undone.`)) return;
    mutationLock.current = true; setWorkingId('delete');
    const failures: string[] = [];
    let deleted = 0;
    try {
      for (const texture of targets) {
        try {
          const response = await fetch(`/api/threed/model-textures?id=${texture.id}`, { method: 'DELETE', signal: AbortSignal.timeout(30000) });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Deletion not confirmed');
          deleted++;
          if (preview?.id === texture.id) setPreview(null);
        } catch (cause) { failures.push(`${texture.textureName}: ${cause instanceof Error ? cause.message : 'Deletion not confirmed'}`); }
      }
      setReport(`${deleted} of ${targets.length} deleted. ${failures.join(' · ')}`);
      await loadTextures();
    } finally { mutationLock.current = false; setWorkingId(null); }
  };

  function heading(field: TextureSortField, label: string) {
    const active = sort.field === field;
    const Icon = active ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={active ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <button type="button" disabled={busy} className="flex items-center gap-1" onClick={() => {
        setPage(0); setSelected(new Set()); setSort({ field, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' });
      }}>{label}<Icon aria-hidden="true" className="h-3 w-3" /></button>
    </TableHead>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {ToastComponent}
      <input ref={inputRef} aria-label="Upload Model Texture file" type="file" accept="image/png,image/jpeg,image/webp,image/bmp" className="hidden" disabled={busy} onChange={uploadTexture} />
      <fieldset className="min-w-0 shrink-0" disabled={busy}>
        <AdminWorkspaceHeader icon={Images} title="Model Textures" description="Manage reusable Texture files and their Model references">
          <span className="rounded bg-muted px-2 text-xs">{total}</span>
          <Input aria-label="Search Model Textures" value={search} onChange={(event) => { setPage(0); setSelected(new Set()); setSearch(event.target.value); }} placeholder="Search name, filename or type…" className="h-7 min-w-48 flex-1 text-xs" />
          <Button size="sm" className="h-7 text-xs" onClick={() => inputRef.current?.click()}>{workingId === 'upload' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}Upload Texture</Button>
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-animations" icon={Clapperboard}>Model Animations</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-files" icon={FolderOpen}>Model Files</AdminWorkspaceLink>
        </AdminWorkspaceHeader>
      </fieldset>
      <nav aria-label="Texture pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span role="status">{loading ? 'Loading…' : total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total} Textures` : '0 Textures'}</span>
          <span aria-hidden="true">|</span><span>{selected.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy || loading || !selected.size} onClick={() => void deleteTextures(textures.filter((texture) => selected.has(texture.id)))}>Delete selected ({selected.size})</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label>Per page <select aria-label="Textures per page" className="rounded border bg-background p-1" value={pageSize} disabled={busy || loading} onChange={(event) => { setPage(0); setPageSize(Number(event.target.value)); }}>
            {[25, 50, 100, 200].map((size) => <option key={size}>{size}</option>)}
          </select></label>
          <Button variant="outline" size="sm" className="text-xs" disabled={busy || loading || page === 0} onClick={() => setPage(0)}>First</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={busy || loading || page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
          <Button variant="outline" size="sm" className="text-xs" disabled={busy || loading || (page + 1) * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={busy || loading || (page + 1) * pageSize >= total} onClick={() => setPage(Math.max(0, Math.ceil(total / pageSize) - 1))}>Last</Button>
        </div>
      </nav>
      {report && <p role="status" className="max-h-24 shrink-0 overflow-auto text-xs">{report}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error} <button className="underline" onClick={() => void loadTextures()}>Retry</button></p>}
      <div role="region" aria-label="Model Texture records" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[950px]">
          <TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
            <TableHead className="w-8"><input type="checkbox" aria-label="Select unreferenced Textures on this page" disabled={busy || loading || !deletable.length} checked={deletable.length > 0 && deletable.every((texture) => selected.has(texture.id))}
              ref={(element) => { if (element) element.indeterminate = deletable.some((texture) => selected.has(texture.id)) && !deletable.every((texture) => selected.has(texture.id)); }}
              onChange={(event) => setSelected(event.target.checked ? new Set(deletable.map((texture) => texture.id)) : new Set())} /></TableHead>
            <TableHead className="text-xs">Preview</TableHead>{heading('name', 'Name')}{heading('fileName', 'Filename')}{heading('type', 'Type')}{heading('references', 'References')}{heading('active', 'Active')}{heading('size', 'Size')}<TableHead className="text-right text-xs">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9}>Loading Model Textures…</TableCell></TableRow> : textures.length === 0 ? <TableRow><TableCell colSpan={9}>{error ? 'Textures could not be loaded.' : 'No Model Textures found.'}</TableCell></TableRow> : textures.map((texture) => <TableRow key={texture.id}>
              <TableCell className="py-1"><input type="checkbox" aria-label={`Select ${texture.textureName}`} title={references(texture) ? 'Referenced Textures cannot be deleted' : 'Select Texture'} disabled={busy || references(texture) > 0} checked={selected.has(texture.id)} onChange={(event) => { const next = new Set(selected); if (event.target.checked) next.add(texture.id); else next.delete(texture.id); setSelected(next); }} /></TableCell>
              <TableCell className="py-1"><button type="button" aria-label={`Preview ${texture.textureName}`} className="block h-8 w-12 rounded bg-muted" onClick={() => setPreview(texture)}><img src={texture.filePath} alt="" className="h-full w-full object-contain" loading="lazy" /></button></TableCell>
              <TableCell className="py-1 text-sm">{editingId === texture.id ? <div className="flex items-center gap-1"><Input aria-label="Texture name" value={editingName} maxLength={255} disabled={busy} onChange={(event) => setEditingName(event.target.value)} className="h-8 text-xs" /><Button size="icon" className="h-8 w-8" aria-label="Save Texture name" disabled={busy || !editingName.trim()} onClick={() => void updateTexture(texture.id, { textureName: editingName.trim() })}><Check className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Cancel rename" disabled={busy} onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button></div> : texture.textureName}</TableCell>
              <TableCell className="py-1 text-xs">{texture.fileName}</TableCell><TableCell className="py-1 text-xs">{texture.mimeType}</TableCell>
              <TableCell className="py-1 text-xs" title={`${texture.assignmentCount} material assignments; ${texture.fileReferenceCount ?? 0} Model file references`}>{references(texture)}</TableCell>
              <TableCell className="py-1">{texture.isActive ? <Check aria-label="Active" className="h-4 w-4 text-green-600" /> : <X aria-label="Inactive" className="h-4 w-4 text-gray-400" />}</TableCell>
              <TableCell className="py-1 text-xs">{formatSize(texture.fileSize)}</TableCell>
              <TableCell className="py-1"><div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Rename ${texture.textureName}`} disabled={busy} onClick={() => { setEditingId(texture.id); setEditingName(texture.textureName); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${texture.isActive ? 'Deactivate' : 'Activate'} ${texture.textureName}`} disabled={busy} onClick={() => void updateTexture(texture.id, { isActive: !texture.isActive })}>{texture.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Delete ${texture.textureName}`} title={references(texture) ? 'Remove Model references before deleting' : 'Delete Texture'} disabled={busy || references(texture) > 0} onClick={() => void deleteTextures([texture])}><Trash2 className="h-4 w-4" /></Button>
                {/^https?:\/\//i.test(texture.filePath) && <Button asChild variant="ghost" size="icon" className="h-8 w-8"><a href={texture.filePath} target="_blank" rel="noopener noreferrer" aria-label={`Open ${texture.textureName} file`}><ExternalLink className="h-4 w-4" /></a></Button>}
              </div></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <Dialog open={preview !== null} onOpenChange={(value) => { if (!value) setPreview(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{preview?.textureName}</DialogTitle></DialogHeader>
          {preview && <img src={preview.filePath} alt={preview.textureName} className="max-h-[70dvh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
