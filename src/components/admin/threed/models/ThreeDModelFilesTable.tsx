'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Clapperboard, FolderOpen, FolderTree, Images, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MODEL_FILE_LIST_FILE_TYPES, parseModelFileListQuery, type ModelFileListQuery, type ModelFileListSortField } from '@/libraries/services/threed/models/model-file-list-query';

interface ModelFileRow {
  id: number; modelId: number; modelName: string; modelType: string;
  fileName: string; relativePath: string | null; fileType: string; textureType: string | null;
  fileSize: number | null; loadOrder: number | null; role: 'primary' | 'supporting';
}
interface ModelChoice { id: number; modelName: string; modelType: string }
const FILE_TYPE_LABELS: Record<string, string> = { model: 'Geometry', texture: 'Texture', binary: 'Binary buffer', other: 'Other', animation: 'Animation' };
const PAGE_SIZES = [25, 50, 100, 200];
const LIST_KEYS = ['search', 'fileType', 'role', 'limit', 'offset', 'sort', 'direction'];
const COMPACT_BUTTON = 'h-7 px-2 text-xs [@media(pointer:coarse)]:min-h-11';
const COMPACT_SELECT = 'min-w-0 data-[size=sm]:h-7 px-2 text-xs [@media(pointer:coarse)]:min-h-11';
const RECORD_LINK = 'rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card';

function fileTypeLabel(value: string) {
  return Object.prototype.hasOwnProperty.call(FILE_TYPE_LABELS, value) ? FILE_TYPE_LABELS[value] : value;
}

function readLocation(value: string) {
  const source = new URLSearchParams(value), params = new URLSearchParams();
  for (const [key, entry] of source) {
    if (key === 'parentModelId') params.append('modelId', entry);
    else if (LIST_KEYS.includes(key)) params.append(key, entry);
  }
  try { return { query: parseModelFileListQuery(params), error: '' }; }
  catch { return { query: parseModelFileListQuery(new URLSearchParams()), error: 'Invalid Model Files list address. Reset the list filters to continue.' }; }
}
function queryParams(query: ModelFileListQuery, location = false) {
  const params = new URLSearchParams({ limit: String(query.limit), offset: String(query.offset), sort: query.sort, direction: query.direction });
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.modelId !== null) params.set(location ? 'parentModelId' : 'modelId', String(query.modelId));
  if (query.fileType !== null) params.set('fileType', query.fileType);
  if (query.role !== null) params.set('role', query.role);
  return params;
}
function fileSize(bytes: number | null) {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ThreeDModelFilesTable() {
  const router = useRouter(), searchParams = useSearchParams();
  const location = searchParams.toString();
  const parsedLocation = useMemo(() => readLocation(location), [location]);
  const [query, setQuery] = useState<ModelFileListQuery>(parsedLocation.query);
  const [locationError, setLocationError] = useState(parsedLocation.error);
  const [rows, setRows] = useState<ModelFileRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState('');
  const [modelRevision, setModelRevision] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addModelId, setAddModelId] = useState('');
  const pendingLocation = useRef<string | null>(null);
  const queryRef = useRef(query); queryRef.current = query;
  const listController = useRef<AbortController | null>(null);
  const listRequest = useRef(0);
  const requestParams = queryParams(query).toString();
  const listContext = `${requestParams}:${revision}:${locationError}`;
  const currentListContext = useRef(listContext); currentListContext.current = listContext;

  const changeQuery = (changes: Partial<ModelFileListQuery>, push = false) => {
    const next = { ...queryRef.current, ...changes };
    const effectiveChanged = queryParams(next).toString() !== queryParams(queryRef.current).toString() || !!locationError;
    queryRef.current = next;
    setQuery(next);
    if (!effectiveChanged) return;
    listController.current?.abort(); listRequest.current++;
    setLocationError(''); setLoading(true); setError(''); setTotal(null);
    const nextLocation = queryParams(next, true).toString();
    pendingLocation.current = nextLocation;
    const href = `/admin/threed/model-files?${nextLocation}`;
    if (push) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };

  useEffect(() => {
    if (pendingLocation.current !== null && pendingLocation.current !== location) return;
    pendingLocation.current = null;
    if (queryParams(parsedLocation.query).toString() === queryParams(queryRef.current).toString() && parsedLocation.error === locationError) return;
    listController.current?.abort(); listRequest.current++;
    setQuery(parsedLocation.query); setLocationError(parsedLocation.error);
    setLoading(true); setError(''); setTotal(null);
    // Acknowledging our own URL update must not clear an already completed request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, parsedLocation]);

  useEffect(() => {
    const restoreLocation = () => {
      pendingLocation.current = null;
      listController.current?.abort(); listRequest.current++;
      const next = readLocation(window.location.search);
      queryRef.current = next.query;
      setQuery(next.query); setLocationError(next.error);
      setLoading(true); setError(''); setTotal(null);
      setRevision(value => value + 1);
    };
    window.addEventListener('popstate', restoreLocation);
    return () => window.removeEventListener('popstate', restoreLocation);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setModelsLoading(true); setModelsError('');
    void (async () => {
      try {
        const choices: ModelChoice[] = [];
        let offset = 0;
        while (true) {
          const response = await fetch(`/api/threed/models?view=selector&limit=200&offset=${offset}`, { cache: 'no-store', signal: controller.signal });
          const result = await response.json();
          if (!current || controller.signal.aborted) return;
          const count = Number(result.pagination?.total);
          if (!response.ok || !result.success || !Array.isArray(result.data) || !Number.isSafeInteger(count) || count < 0
            || !result.data.every((model: ModelChoice) => Number.isSafeInteger(model.id) && model.id > 0 && typeof model.modelName === 'string' && typeof model.modelType === 'string')) {
            throw new Error('Parent Models could not be loaded.');
          }
          choices.push(...result.data); offset += result.data.length;
          if (offset >= count) break;
          if (!result.data.length) throw new Error('The complete parent Model list could not be loaded.');
        }
        setModels(choices);
      } catch { if (current && !controller.signal.aborted) { setModels([]); setModelsError('Parent Models could not be loaded. Retry before choosing a parent.'); } }
      finally { if (current && !controller.signal.aborted) setModelsLoading(false); }
    })();
    return () => { current = false; controller.abort(); };
  }, [modelRevision]);

  useEffect(() => {
    const controller = new AbortController(); listController.current = controller;
    const request = ++listRequest.current, context = listContext;
    let current = true;
    const isCurrent = () => current && !controller.signal.aborted && request === listRequest.current && currentListContext.current === context;
    setLoading(true); setError(''); setTotal(null);
    if (locationError) { setRows([]); setLoading(false); return () => { current = false; controller.abort(); }; }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/threed/models/files/list?${requestParams}`, { cache: 'no-store', signal: controller.signal });
          const result = await response.json();
          if (!isCurrent()) return;
          const count = Number(result.pagination?.total);
          if (!response.ok || !result.success || !Array.isArray(result.data) || !Number.isSafeInteger(count) || count < 0) {
            throw new Error(response.status === 404 ? 'The selected parent Model is unavailable.' : 'Model Files could not be loaded.');
          }
          if (query.offset > 0 && query.offset >= count) {
            changeQuery({ offset: Math.max(0, Math.ceil(count / query.limit) - 1) * query.limit }); return;
          }
          setRows(result.data); setTotal(count);
        } catch (cause) {
          if (isCurrent()) { setRows([]); setTotal(null); setError(cause instanceof Error ? cause.message : 'Model Files could not be loaded.'); }
        } finally { if (isCurrent()) setLoading(false); }
      })();
    }, 200);
    return () => { current = false; clearTimeout(timer); controller.abort(); };
    // Query fields are represented by requestParams; navigation state is captured for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestParams, revision, locationError]);

  const refresh = () => { listController.current?.abort(); listRequest.current++; setLoading(true); setRevision(value => value + 1); };
  const page = Math.floor(query.offset / query.limit);
  const pageCount = total === null ? null : Math.max(1, Math.ceil(total / query.limit));
  const unavailable = loading || !!error || !!locationError || total === null;
  const range = locationError || error ? 'Model Files unavailable' : loading || total === null ? 'Loading Model Files…'
    : total ? `${query.offset + 1}–${Math.min(query.offset + rows.length, total)} of ${total} Files` : '0 Files';

  function heading(field: ModelFileListSortField, label: string) {
    const active = query.sort === field;
    const Icon = active ? query.direction === 'asc' ? ArrowUp : ArrowDown : ArrowUpDown;
    return <TableHead className="py-1 text-xs" aria-sort={active ? query.direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
      <Button type="button" variant="ghost" size="sm" className={`${COMPACT_BUTTON} -ml-2 justify-start font-medium`} onClick={() => changeQuery({ sort: field, direction: active && query.direction === 'asc' ? 'desc' : 'asc', offset: 0 }, true)}>{label}<Icon aria-hidden="true" className="size-3" /></Button>
    </TableHead>;
  }

  return <div className="flex min-h-0 flex-1 flex-col gap-2">
    <AdminWorkspaceHeader icon={FolderOpen} title="Model Files" description="Find saved File attachments across your Models" className="min-w-0 shrink-0">
      <Badge variant="secondary" className="text-xs tabular-nums">{unavailable ? '—' : total}</Badge>
      <div className="relative min-w-48 flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search Model Files" placeholder="Search Model, filename or path…" maxLength={200} className="h-7 pl-7 text-xs [@media(pointer:coarse)]:min-h-11" value={query.search} onChange={event => changeQuery({ search: event.target.value, offset: 0 })} />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2"><Label htmlFor="model-files-parent-filter" className="shrink-0 text-xs">Parent Model</Label>
        <Select value={query.modelId === null ? 'all' : String(query.modelId)} disabled={modelsLoading || !!modelsError} onValueChange={value => changeQuery({ modelId: value === 'all' ? null : Number(value), offset: 0 }, true)}>
          <SelectTrigger id="model-files-parent-filter" aria-label="Parent Model" size="sm" className={`${COMPACT_SELECT} w-48 max-w-full`}><SelectValue /></SelectTrigger>
          <SelectContent position="popper" className="max-w-[calc(100vw-2rem)] dark:bg-popover">
            <SelectItem value="all" className="text-xs">All Models</SelectItem>
            {query.modelId !== null && !models.some(model => model.id === query.modelId) && <SelectItem value={String(query.modelId)} className="text-xs">Model #{query.modelId}</SelectItem>}
            {models.map(model => <SelectItem key={model.id} value={String(model.id)} className="text-xs">{model.modelName} · {model.modelType.toUpperCase()} · #{model.id}</SelectItem>)}
          </SelectContent>
        </Select></div>
        <div className="flex items-center gap-2"><Label htmlFor="model-files-type-filter" className="shrink-0 text-xs">File type</Label>
        <Select value={query.fileType ?? 'all'} onValueChange={value => changeQuery({ fileType: value === 'all' ? null : value as ModelFileListQuery['fileType'], offset: 0 }, true)}>
          <SelectTrigger id="model-files-type-filter" aria-label="File type" size="sm" className={`${COMPACT_SELECT} w-32`}><SelectValue /></SelectTrigger>
          <SelectContent position="popper" className="dark:bg-popover"><SelectItem value="all" className="text-xs">All types</SelectItem>{MODEL_FILE_LIST_FILE_TYPES.map(type => <SelectItem key={type} value={type} className="text-xs">{FILE_TYPE_LABELS[type]}</SelectItem>)}</SelectContent>
        </Select></div>
        <div className="flex items-center gap-2"><Label htmlFor="model-files-role-filter" className="shrink-0 text-xs">Role</Label>
        <Select value={query.role ?? 'all'} onValueChange={value => changeQuery({ role: value === 'all' ? null : value as ModelFileListQuery['role'], offset: 0 }, true)}>
          <SelectTrigger id="model-files-role-filter" aria-label="Role" size="sm" className={`${COMPACT_SELECT} w-32`}><SelectValue /></SelectTrigger>
          <SelectContent position="popper" className="dark:bg-popover"><SelectItem value="all" className="text-xs">All roles</SelectItem><SelectItem value="primary" className="text-xs">Primary</SelectItem><SelectItem value="supporting" className="text-xs">Supporting</SelectItem></SelectContent>
        </Select></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className={COMPACT_BUTTON} onClick={() => { setAddModelId(''); setAddOpen(true); }}><Plus aria-hidden="true" className="size-3" />Add File</Button>
        <Button type="button" variant="outline" size="sm" className={COMPACT_BUTTON} disabled={loading || !!locationError} onClick={refresh}><RefreshCw aria-hidden="true" className="size-3" />Refresh</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm" className={COMPACT_BUTTON}><Link href="/admin/threed/models"><ArrowLeft aria-hidden="true" className="size-3.5" />All Models</Link></Button>
        <Button asChild variant="outline" size="sm" className={COMPACT_BUTTON}><Link href="/admin/threed/model-categories"><FolderTree aria-hidden="true" className="size-3.5" />Model Categories</Link></Button>
        <Button asChild variant="outline" size="sm" className={COMPACT_BUTTON}><Link href="/admin/threed/animations"><Clapperboard aria-hidden="true" className="size-3.5" />Animations Library</Link></Button>
        <Button asChild variant="outline" size="sm" className={COMPACT_BUTTON}><Link href="/admin/threed/model-textures"><Images aria-hidden="true" className="size-3.5" />Model Textures</Link></Button>
      </div>
    </AdminWorkspaceHeader>
    <nav aria-label="Model Files pagination" className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs">
      <span role="status" className="tabular-nums text-muted-foreground">{range}</span>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2"><Label htmlFor="model-files-page-size" className="shrink-0 text-xs">Rows per page</Label>
        <Select value={String(query.limit)} onValueChange={value => changeQuery({ limit: Number(value), offset: 0 }, true)}>
          <SelectTrigger id="model-files-page-size" aria-label="Rows per page" size="sm" className={`${COMPACT_SELECT} w-20`}><SelectValue /></SelectTrigger>
          <SelectContent position="popper" className="dark:bg-popover">{!PAGE_SIZES.includes(query.limit) && <SelectItem value={String(query.limit)} className="text-xs">{query.limit}</SelectItem>}{PAGE_SIZES.map(size => <SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>)}</SelectContent>
        </Select></div>
        <Button variant="outline" size="sm" className={COMPACT_BUTTON} disabled={unavailable || query.offset === 0} onClick={() => changeQuery({ offset: 0 }, true)}>First</Button>
        <Button variant="outline" size="sm" className={COMPACT_BUTTON} disabled={unavailable || query.offset === 0} onClick={() => changeQuery({ offset: Math.max(0, query.offset - query.limit) }, true)}>Previous</Button>
        <span className="tabular-nums text-muted-foreground">Page {page + 1} of {pageCount ?? '—'}</span>
        <Button variant="outline" size="sm" className={COMPACT_BUTTON} disabled={unavailable || query.offset + query.limit >= (total ?? 0)} onClick={() => changeQuery({ offset: query.offset + query.limit }, true)}>Next</Button>
        <Button variant="outline" size="sm" className={COMPACT_BUTTON} disabled={unavailable || query.offset + query.limit >= (total ?? 0)} onClick={() => changeQuery({ offset: Math.max(0, (pageCount! - 1) * query.limit) }, true)}>Last</Button>
      </div>
    </nav>
    {modelsError && <p role="alert" className="flex shrink-0 flex-wrap items-center gap-2 text-sm text-destructive">{modelsError} <Button variant="outline" size="sm" className={COMPACT_BUTTON} onClick={() => setModelRevision(value => value + 1)}>Retry parent Models</Button></p>}
    <div role="region" aria-label="Model File records" tabIndex={0} className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-border bg-card text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&>[data-slot=table-container]]:overflow-visible">
      <Table className="min-w-[1100px]">
        <TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="hover:bg-transparent">{heading('model', 'Parent Model')}{heading('name', 'Filename')}{heading('path', 'Dependency path')}{heading('type', 'Type')}{heading('role', 'Role')}{heading('size', 'Size')}{heading('loadOrder', 'Load order')}<TableHead className="py-1 text-right text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {locationError ? <TableRow><TableCell colSpan={8} className="space-y-2 py-4 text-center"><p role="alert" className="text-destructive">{locationError}</p><Button variant="outline" size="sm" className={COMPACT_BUTTON} onClick={() => changeQuery(parseModelFileListQuery(new URLSearchParams()))}>Reset list filters</Button></TableCell></TableRow>
            : loading ? <TableRow><TableCell colSpan={8} className="py-4 text-center text-muted-foreground"><span role="status">Loading Model Files…</span></TableCell></TableRow>
            : error ? <TableRow><TableCell colSpan={8} className="py-4 text-center"><span role="alert" className="text-destructive">{error}</span><Button variant="outline" size="sm" className={`${COMPACT_BUTTON} ml-2`} onClick={refresh}>Retry</Button></TableCell></TableRow>
            : !rows.length ? <TableRow><TableCell colSpan={8} className="py-4 text-center text-muted-foreground">No saved Model File attachments found.</TableCell></TableRow>
            : rows.map(file => <TableRow key={file.id} className="hover:bg-muted/50">
              <TableCell className="py-1"><Link className={`${RECORD_LINK} text-sm font-medium`} href={`/admin/threed/models/${file.modelId}?tab=files`}>{file.modelName}</Link><p className="text-xs text-muted-foreground">Model #{file.modelId} · {file.modelType}</p></TableCell>
              <TableCell className="py-1"><Link className={`${RECORD_LINK} break-all text-sm font-medium`} href={`/admin/threed/models/${file.modelId}/files/${file.id}`}>{file.fileName}</Link><p className="text-xs text-muted-foreground">File #{file.id}</p></TableCell>
              <TableCell className="max-w-sm whitespace-pre-wrap break-all py-1 text-xs text-muted-foreground">{file.relativePath || 'No dependency path saved'}</TableCell>
              <TableCell className="py-1 text-xs"><Badge variant="outline" className="text-[10px]">{fileTypeLabel(file.fileType)}</Badge>{file.textureType && <p className="text-muted-foreground">{file.textureType}</p>}</TableCell>
              <TableCell className="py-1 text-xs">{file.role === 'primary' ? 'Primary' : 'Supporting'}</TableCell>
              <TableCell className="whitespace-nowrap py-1 text-xs tabular-nums text-muted-foreground">{fileSize(file.fileSize)}</TableCell><TableCell className="py-1 text-xs tabular-nums text-muted-foreground">{file.loadOrder ?? '—'}</TableCell>
              <TableCell className="py-1"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="sm" className={COMPACT_BUTTON}><Link aria-label={`Edit File #${file.id} ${file.fileName}`} href={`/admin/threed/models/${file.modelId}/files/${file.id}`}><Pencil aria-hidden="true" className="size-3.5" />Edit</Link></Button><Button asChild variant="ghost" size="sm" className={COMPACT_BUTTON}><Link aria-label={`Model Files for ${file.modelName} #${file.modelId}`} href={`/admin/threed/models/${file.modelId}?tab=files`}><FolderOpen aria-hidden="true" className="size-3.5" />Model Files</Link></Button></div></TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>
    <Dialog open={addOpen} onOpenChange={value => { setAddOpen(value); if (!value) setAddModelId(''); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Choose parent Model</DialogTitle><DialogDescription>Choose the saved Model that will own the new File attachments.</DialogDescription></DialogHeader>
        <div className="space-y-2"><Label htmlFor="new-file-parent-model">Parent Model for new File</Label>
          <Select disabled={modelsLoading || !!modelsError} value={addModelId} onValueChange={value => setAddModelId(value === 'none' ? '' : value)}>
            <SelectTrigger id="new-file-parent-model" aria-label="Parent Model for new File" className="w-full min-w-0 [@media(pointer:coarse)]:min-h-11"><SelectValue placeholder={modelsLoading ? 'Loading Models…' : 'Select a Model…'} /></SelectTrigger>
            <SelectContent position="popper" className="max-w-[calc(100vw-2rem)] dark:bg-popover"><SelectItem value="none">Select a Model…</SelectItem>{models.map(model => <SelectItem key={model.id} value={String(model.id)}>{model.modelName} · {model.modelType.toUpperCase()} · #{model.id}</SelectItem>)}</SelectContent>
          </Select>
          {modelsError && <p role="alert" className="space-y-2 text-sm text-destructive">{modelsError} <Button variant="outline" size="sm" onClick={() => setModelRevision(value => value + 1)}>Retry parent Models</Button></p>}
          {!modelsLoading && !modelsError && !models.length && <p className="text-sm text-muted-foreground">No owned Models are available.</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => { setAddOpen(false); setAddModelId(''); }}>Cancel</Button><Button type="button" disabled={modelsLoading || !!modelsError || !models.some(model => String(model.id) === addModelId)} onClick={() => {
          const parent = models.find(model => String(model.id) === addModelId);
          if (!parent || modelsLoading || modelsError) return;
          setAddOpen(false); router.push(`/admin/threed/models/${parent.id}/files/new`);
        }}>Continue</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
