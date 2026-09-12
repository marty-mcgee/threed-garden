'use client';

import { useEffect, useState, useRef } from 'react';
import { Clapperboard, Upload, ArrowUpDown, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Images, Box, Check, X, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';

type UploadResult = { name: string; status: 'Queued' | 'Uploading' | 'Imported' | 'Needs attention'; detail?: string };

type Animation = { id: number; name: string; fileName: string; clipIndex: number; duration: number; isActive: boolean; modelUsage: number; characterUsage: number; filePath: string; fileSize: number; format: string };
async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Animation request failed');
  return result;
}

// The library owns this workspace. No Model/Character selection or target API is required.
export function ThreeDAnimationsWorkspace() {
  const [rows, setRows] = useState<Animation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const uploadRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<Animation | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const uploadingRef = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(new Set());
    const timer = setTimeout(() => {
      request(`/api/threed/animations?limit=${pageSize}&offset=${page * pageSize}&search=${encodeURIComponent(search)}&sort=${sort.key}&direction=${sort.direction}`, { signal: controller.signal })
        .then(result => {
          if (controller.signal.aborted) return;
          setRows(result.data); setTotal(result.pagination.total);
          if (page > 0 && page * pageSize >= result.pagination.total) setPage(Math.max(0, Math.ceil(result.pagination.total / pageSize) - 1));
        }).catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Library unavailable'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, sort, search, refresh]);
  async function save() {
    if (!editing || busy || !editing.name.trim()) return;
    setBusy(true); setNotice('');
    try {
      await request('/api/threed/animations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, name: editing.name.trim() }) });
      setEditing(null); setRefresh(value => value + 1); setNotice('Animation updated.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Could not save'); }
    finally { setBusy(false); }
  }
  async function remove(row: Animation) {
    if (busy || !window.confirm(`Delete animation “${row.name}”? Its source file will be retained.`)) return;
    setBusy(true); setNotice('');
    try { await request(`/api/threed/animations?id=${row.id}`, { method: 'DELETE' }); setRefresh(value => value + 1); setNotice('Animation removed; source file retained.'); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Could not delete'); }
    finally { setBusy(false); }
  }
  async function upload(files: File[]) {
    if (!files.length || busy || uploadingRef.current) return;
    if (files.length > 100) { setNotice('Select up to 100 animation files per batch.'); return; }
    uploadingRef.current = true;
    setBusy(true); setNotice('Importing animation files…');
    setUploadResults(files.map(file => ({ name: file.name, status: 'Queued' })));
    let imported = 0;
    let clipCount = 0;
    const update = (index: number, status: UploadResult['status'], detail?: string) =>
      setUploadResults(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, status, detail } : row));
    try {
      for (const [index, file] of files.entries()) {
        if (!/\.(fbx|glb)$/i.test(file.name) || file.size === 0 || file.size > 4 * 1024 * 1024) {
          update(index, 'Needs attention', 'Choose a nonempty FBX or self-contained GLB up to 4 MiB.');
          continue;
        }
        update(index, 'Uploading');
        try {
          const form = new FormData(); form.set('file', file);
          const result = await request('/api/threed/animation-files', { method: 'POST', body: form });
          imported++; clipCount += result.clipCount;
          update(index, 'Imported', `${result.clipCount} animation clips`);
        } catch (err) {
          update(index, 'Needs attention', `${err instanceof Error ? err.message : 'Upload failed'}. Check the refreshed library before retrying; an interrupted request may already have saved.`);
        }
      }
    } finally {
      uploadingRef.current = false;
      setBusy(false); setPage(0); setSearch(''); setRefresh(value => value + 1);
      setNotice(`Imported ${imported} of ${files.length} files (${clipCount} clips). ${files.length - imported} need attention.`);
    }
  }
  async function removeSelected() {
    const targets = rows.filter(row => selected.has(row.id) && row.modelUsage + row.characterUsage === 0);
    if (busy || !targets.length || !window.confirm(`Delete ${targets.length} animations? Source files are retained.`)) return;
    setBusy(true); let count = 0;
    try { for (const row of targets) { await request(`/api/threed/animations?id=${row.id}`, { method: 'DELETE' }); count++; } setNotice(`Deleted ${count} animations; source files retained.`); }
    catch (err) { setNotice(`Deleted ${count} of ${targets.length}. ${err instanceof Error ? err.message : 'Deletion stopped'}`); }
    finally { setBusy(false); setSelected(new Set()); setRefresh(value => value + 1); }
  }
  function heading(key: string, label: string) {
    const Icon = sort.key === key ? sort.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button className="inline-flex items-center gap-1" disabled={busy || loading} onClick={() => { setPage(0); setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); }}>{label}<Icon aria-hidden="true" className="h-3 w-3" /></button></TableHead>;
  }
  async function toggle(row: Animation) {
    if (busy) return;
    setBusy(true); setNotice('');
    try { await request('/api/threed/animations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, isActive: !row.isActive }) }); setRefresh(value => value + 1); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Could not update animation'); }
    finally { setBusy(false); }
  }
  const deletable = rows.filter(row => row.modelUsage + row.characterUsage === 0);
  return <div className="flex h-full min-h-0 flex-col gap-2">
    <input ref={uploadRef} type="file" multiple accept=".fbx,.glb" aria-label="Upload animation files" className="hidden" disabled={busy} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void upload(files); }} />
    <AdminWorkspaceHeader icon={Clapperboard} title="Animations" description="Reusable animation assets, independent of Models and Characters">
      <span className="rounded bg-muted px-2 text-xs">{error ? '—' : total}</span>
      <Input aria-label="Search saved animations" placeholder="Search saved animations…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(0); }} className="h-7 min-w-48 flex-1 text-xs" />
      <Button size="sm" className="h-7 text-xs" disabled={busy} onClick={() => uploadRef.current?.click()}><Upload className="mr-1 h-3 w-3" />Upload Animations</Button>
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      <AdminWorkspaceLink href="/admin/threed/models" icon={Box}>Models</AdminWorkspaceLink>
      <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
    </AdminWorkspaceHeader>
    {notice && <p role="status" className="shrink-0 text-xs">{notice}</p>}
    {uploadResults.length > 0 && <section aria-label="Animation import results" className="shrink-0 rounded-lg border p-2 text-xs">
      <div className="mb-1 flex items-center justify-between"><span>Animation import results · {uploadResults.length} files</span><Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => setUploadResults([])}>Clear results</Button></div>
      <div className="max-h-40 overflow-auto" tabIndex={0} aria-label="Files in this import">
        {uploadResults.map((result, index) => <div key={index} className="flex flex-wrap gap-x-3 gap-y-1 border-t py-1">
          <span className="break-all">{result.name}</span>
          <span className={result.status === 'Imported' ? 'text-green-500' : result.status === 'Needs attention' ? 'text-orange-400' : 'text-muted-foreground'}>{result.status}</span>
          {result.detail && <span className="text-muted-foreground">{result.detail}</span>}
        </div>)}
      </div>
    </section>}
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2"><span role="status">{loading ? 'Loading saved animations…' : error ? 'Saved library unavailable' : `${total ? page * pageSize + 1 : 0}–${Math.min((page + 1) * pageSize, total)} of ${total} Animations`}</span>
      <span aria-hidden="true">|</span><span>{selected.size} selected</span><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || !selected.size} onClick={() => void removeSelected()}>Delete selected ({selected.size})</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button></div>
      <div className="flex flex-wrap items-center gap-2"><label>Per page <select aria-label="Animations per page" value={pageSize} disabled={busy || loading} className="rounded border bg-background p-1" onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}>{[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}</select></label><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || page === 0} onClick={() => setPage(0)}>First</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || page === 0} onClick={() => setPage(value => value - 1)}>Previous</Button>
        <span>Page {page + 1} of {Math.max(1, Math.ceil(total / pageSize))}</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || (page + 1) * pageSize >= total} onClick={() => setPage(value => value + 1)}>Next</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy || loading || !!error || (page + 1) * pageSize >= total} onClick={() => setPage(Math.max(0, Math.ceil(total / pageSize) - 1))}>Last</Button></div>
    </div>
    <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border [&>[data-slot=table-container]]:overflow-visible" role="region" aria-label="Animation library records" tabIndex={0}>
      <Table className="min-w-[950px]"><TableHeader className="sticky top-0 z-10 bg-background"><TableRow>
        <TableHead className="w-8"><input type="checkbox" aria-label="Select unreferenced animations on this page" disabled={busy || loading || !deletable.length} checked={deletable.length > 0 && deletable.every(row => selected.has(row.id))} ref={input => { if (input) input.indeterminate = deletable.some(row => selected.has(row.id)) && !deletable.every(row => selected.has(row.id)); }} onChange={event => setSelected(event.target.checked ? new Set(deletable.map(row => row.id)) : new Set())} /></TableHead>
        {heading('name', 'Name')}{heading('fileName', 'Source / Clip')}{heading('type', 'Type')}{heading('duration', 'Duration')}{heading('active', 'Active')}{heading('references', 'References')}{heading('size', 'Size')}<TableHead className="text-right text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{loading ? <TableRow><TableCell colSpan={9}>Loading Animations…</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={9}><div role="alert" className="flex items-center gap-2 text-sm text-destructive">{error}<Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy} onClick={() => setRefresh(value => value + 1)}>Retry</Button></div></TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={9}>No Animations found. Use Upload Animations to add FBX or self-contained GLB sources (up to 100 files, 4 MiB each).</TableCell></TableRow> : rows.map(row => <TableRow key={row.id}>
          <TableCell className="py-1 text-xs"><input type="checkbox" aria-label={`Select ${row.name}`} disabled={busy || loading || row.modelUsage + row.characterUsage > 0} checked={selected.has(row.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></TableCell>
          <TableCell className="py-1 text-sm">{editing?.id === row.id ? <div className="flex items-center gap-1"><Input aria-label="Animation name" value={editing.name} maxLength={255} disabled={busy} onChange={event => setEditing({ ...editing, name: event.target.value })} className="h-8 text-xs" /><Button size="icon" className="h-8 w-8" aria-label="Save Animation name" disabled={busy || !editing.name.trim()} onClick={() => void save()}><Check className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Cancel rename" disabled={busy} onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button></div> : row.name}</TableCell><TableCell className="py-1 text-xs">{row.fileName} · #{row.clipIndex + 1}</TableCell><TableCell className="py-1 text-xs uppercase">{row.format}</TableCell><TableCell className="py-1 text-xs">{row.duration.toFixed(2)}s</TableCell><TableCell className="py-1 text-xs">{row.isActive ? <Check aria-label="Active" className="h-4 w-4 text-green-500" /> : <X aria-label="Inactive" className="h-4 w-4 text-gray-500" />}</TableCell><TableCell className="py-1 text-xs">{row.modelUsage} Models · {row.characterUsage} Characters</TableCell><TableCell className="py-1 text-xs">{(row.fileSize / 1024).toFixed(1)} KiB</TableCell>
          <TableCell className="py-1 text-xs"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${row.name}`} title="Rename animation" disabled={busy || loading} onClick={() => { setNotice(''); setEditing({ ...row }); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy || loading} aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.name}`} onClick={() => void toggle(row)}>{row.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" className="h-8 w-8" title="Delete unreferenced animation" aria-label={`Delete ${row.name}`} disabled={busy || loading || row.modelUsage + row.characterUsage > 0} onClick={() => void remove(row)}><Trash2 className="h-4 w-4" /></Button><Button asChild size="icon" variant="ghost" className="h-8 w-8"><a href={row.filePath} target="_blank" rel="noopener noreferrer" title="Open source file" aria-label={`Open source for ${row.name}`}><ExternalLink className="h-4 w-4" /></a></Button></div></TableCell>
        </TableRow>)}</TableBody></Table>
    </div>
  </div>;
}
