'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FolderTree, Plus, RefreshCw } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  LEARN_CATEGORY_DESCRIPTION_LIMIT,
  LEARN_CATEGORY_NAME_LIMIT,
  LEARN_SLUG_LIMIT,
  type LearnCategory,
  type LearnCategoryInput,
} from '@/libraries/services/learn/contracts';
import { parseLearnCategoryInput } from '@/libraries/services/learn/input';
import { tryParseInput } from '@/libraries/utils/input-validation';
import { LearnAdminError, learnAdminResponse, learnAdminActionClass as actionClass, learnAdminSelectClass as selectClass } from './learn-admin-client';
import { learnCategoriesEndpoint, learnCategoryOptions, readLearnCategory, useLearnCategories } from './use-learn-categories';

type Form = Omit<LearnCategoryInput, 'sortOrder' | 'description'> & { sortOrder: string; description: string };

function categoryForm(category: LearnCategory | null): Form {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    parentId: category?.parentId ?? null,
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
  };
}

const slugFor = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, LEARN_SLUG_LIMIT).replace(/-$/, '');

export function LearnCategoriesWorkspace() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <p role="status" className="p-3 text-xs">Checking Learn access…</p>;
  if (status !== 'authenticated' || !session?.user?.id) {
    return <p role="alert" className="p-3 text-xs">Sign in to manage Learn Categories. <Link className="underline" href="/auth/sign-in">Sign In</Link></p>;
  }
  return <CategoryWorkspace key={session.user.id} />;
}

function CategoryWorkspace() {
  const { categories, setCategories, loading, error: loadError, refresh } = useLearnCategories();
  const [record, setRecord] = useState<LearnCategory | null>(null);
  const [form, setForm] = useState(() => categoryForm(null));
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [stale, setStale] = useState(false);
  const [denied, setDenied] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(categoryForm(record));
  const navigation = useRef({ dirty, busy });
  navigation.current = { dirty, busy };
  const options = useMemo(() => learnCategoryOptions(categories), [categories]);
  const parents = record ? options.filter(option => !option.path.some(category => category.id === record.id)) : options;
  const hasChildren = record !== null && categories.some(category => category.parentId === record.id);
  const term = search.trim().toLowerCase();
  const visible = options.filter(({ category, label }) => label.toLowerCase().includes(term) || category.slug.includes(term));
  const parsed = tryParseInput(parseLearnCategoryInput, { ...form, sortOrder: Number(form.sortOrder) });
  const invalid = !form.name.trim() ? 'Enter a Category name.' : !form.slug.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug.trim())
    ? 'Enter a slug using lowercase letters, numbers and single hyphens.'
    : !form.sortOrder.trim() || !Number.isInteger(Number(form.sortOrder)) || Math.abs(Number(form.sortOrder)) > 10000
      ? 'Enter a whole-number Sort Order from -10000 to 10000.' : !parsed.success ? 'Check the Category field limits.' : '';
  const ready = !loading && !loadError && !denied;

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    function unload(event: BeforeUnloadEvent) {
      if (navigation.current.dirty || navigation.current.busy || pending.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    function navigate(event: MouseEvent) {
      if (!navigation.current.dirty && !navigation.current.busy && !pending.current) return;
      const link = (event.target as Element | null)?.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')
        || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pending.current || navigation.current.busy || !window.confirm('Discard unsaved Learn Category changes?')) return;
      navigation.current = { dirty: false, busy: false };
      window.location.assign(link.href);
    }
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigate, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', navigate, true);
    };
  }, []);

  function open(category: LearnCategory | null) {
    setRecord(category);
    setForm(categoryForm(category));
    setError('');
    setNotice('');
    setStale(false);
  }

  function select(category: LearnCategory | null) {
    if (busy || pending.current || (dirty && !window.confirm('Discard unsaved Learn Category changes?'))) return;
    open(category);
  }

  function reload() {
    if (busy || pending.current || (dirty && !window.confirm('Reload Categories and discard unsaved changes?'))) return;
    open(null);
    setDenied(false);
    refresh();
  }

  async function write(remove: boolean) {
    if (!ready || busy || pending.current || stale) return;
    if (remove) {
      if (!record || hasChildren || (dirty && !window.confirm('Discard unsaved Category changes and continue to deletion?'))) return;
      if (!window.confirm(`Delete “${record.name}”? Its assignments will be removed from Guides.`)) return;
    } else if (!dirty || invalid || !parsed.success) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
      if (remove && record) {
        const params = new URLSearchParams({ id: String(record.id), revision: record.revision });
        const response = await fetch(`${learnCategoriesEndpoint}?${params}`, { method: 'DELETE', signal });
        const { data } = await learnAdminResponse<{ data: { id: number } }>(response, 'The Category could not be deleted.');
        if (data?.id !== record.id) throw new Error('Category deletion could not be verified.');
        if (controller.signal.aborted) return;
        setCategories(current => current.filter(category => category.id !== record.id));
        open(null);
        setNotice('Category deleted.');
      } else if (parsed.success) {
        const response = await fetch(learnCategoriesEndpoint, {
          method: record ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parsed.data, ...(record ? { id: record.id, revision: record.revision } : {}) }),
          signal,
        });
        const { data } = await learnAdminResponse<{ data: unknown }>(response, 'The Category could not be saved.');
        const saved = readLearnCategory(data);
        if (record && saved.id !== record.id) throw new Error('The saved Category could not be verified.');
        if (controller.signal.aborted) return;
        setCategories(current => [...current.filter(category => category.id !== saved.id), saved]);
        open(saved);
        setNotice('Category saved.');
      }
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : 'The Category change could not be completed.');
      if (failure instanceof LearnAdminError) {
        if (failure.status === 401 || failure.status === 403) setDenied(true);
        if (failure.status === 404 || failure.status === 409 && remove) setStale(true);
      }
    } finally {
      if (pending.current === controller) pending.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden text-xs">
      <AdminWorkspaceHeader moduleKey="learn" icon={FolderTree} title="Categories" description="Manage the Categories used by Learn Guides." className="shrink-0">
        <div className="ml-auto flex flex-wrap gap-1">
          <Button variant="outline" className={actionClass} disabled={loading || busy} onClick={reload}><RefreshCw aria-hidden="true" className="size-3.5" />Reload</Button>
          <Button variant="success" className={actionClass} disabled={!ready || busy} onClick={() => select(null)}><Plus aria-hidden="true" className="size-3.5" />Add Category</Button>
        </div>
      </AdminWorkspaceHeader>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {notice && <p role="status" className="text-muted-foreground">{notice}</p>}
      {loading ? <p role="status" className="p-3">Loading Categories…</p> : loadError ? <p role="alert" className="p-3">{loadError}</p> : ready && (
        <div className="grid min-h-0 min-w-0 flex-1 items-start gap-3 overflow-y-auto pb-3 lg:grid-cols-[minmax(15rem,1fr)_minmax(20rem,1.5fr)]">
          <section aria-label="Learn Categories" className="admin-editor-panel min-w-0 space-y-2 rounded-lg border p-3">
            <Input aria-label="Search Categories" placeholder="Search Categories" className="h-8 text-xs" value={search} onChange={event => setSearch(event.target.value)} />
            {visible.length ? (
              <ul className="space-y-1">
                {visible.map(({ category, label }) => (
                  <li key={category.id}>
                    <Button variant={category.id === record?.id ? 'secondary' : 'ghost'} aria-pressed={category.id === record?.id}
                      className="h-auto min-h-8 w-full justify-start whitespace-normal px-2 py-1 text-left text-xs" disabled={busy}
                      onClick={() => category.id !== record?.id && select(category)}>
                      <span className="min-w-0 break-words">{label}</span>
                      {!category.isActive && <span className="ml-auto shrink-0 text-muted-foreground">Inactive</span>}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">{term ? 'No Categories match your search.' : 'No Categories yet.'}</p>}
          </section>
          <form className="admin-editor-panel min-w-0 space-y-3 rounded-lg border p-3" onSubmit={event => { event.preventDefault(); void write(false); }}>
            <h2 className="text-sm font-semibold">{record ? 'Edit Category' : 'Add Category'}</h2>
            <fieldset className="grid min-w-0 gap-3 sm:grid-cols-2" disabled={busy}>
              <div>
                <Label htmlFor="learn-category-name">Name *</Label>
                <Input id="learn-category-name" className="h-8 text-xs" required maxLength={LEARN_CATEGORY_NAME_LIMIT} value={form.name}
                  onChange={event => {
                    const name = event.target.value;
                    setForm(value => ({ ...value, name, slug: !record && (!value.slug || value.slug === slugFor(value.name)) ? slugFor(name) : value.slug }));
                  }} />
              </div>
              <div>
                <Label htmlFor="learn-category-slug">Slug *</Label>
                <Input id="learn-category-slug" className="h-8 text-xs" required maxLength={LEARN_SLUG_LIMIT} value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="learn-category-parent">Parent Category</Label>
                <select id="learn-category-parent" className={`${selectClass} block w-full`} value={form.parentId ?? ''} onChange={event => setForm({ ...form, parentId: event.target.value ? Number(event.target.value) : null })}>
                  <option value="">None (top level)</option>
                  {parents.map(({ category, label }) => <option key={category.id} value={category.id}>{label}{category.isActive ? '' : ' (Inactive)'}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="learn-category-order">Sort Order</Label>
                <Input id="learn-category-order" className="h-8 text-xs" type="number" min={-10000} max={10000} step={1} required value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: event.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="learn-category-description">Description</Label>
                <Textarea id="learn-category-description" className="text-xs" rows={3} maxLength={LEARN_CATEGORY_DESCRIPTION_LIMIT} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="learn-category-active" checked={form.isActive} onCheckedChange={isActive => setForm({ ...form, isActive })} />
                <Label htmlFor="learn-category-active">Active</Label>
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Button type="submit" variant="success" className={actionClass} disabled={busy || stale || !dirty || !!invalid} aria-describedby="learn-category-status">{record ? 'Save Changes' : 'Create Category'}</Button>
              <Button type="button" variant="outline" className={actionClass} disabled={busy || !dirty} onClick={() => { if (window.confirm('Discard unsaved Learn Category changes?')) { setForm(categoryForm(record)); setError(''); } }}>Discard changes</Button>
              {record && <Button type="button" variant="destructive" className={actionClass} disabled={busy || stale || hasChildren} aria-describedby="learn-category-delete-status" onClick={() => void write(true)}>Delete Category</Button>}
            </div>
            <p id="learn-category-status" role="status" className="text-muted-foreground">{busy ? 'Saving changes…' : stale ? 'Reload Categories to continue.' : dirty ? invalid || 'Unsaved changes.' : ''}</p>
            {record && <p id="learn-category-delete-status" className="text-muted-foreground">{hasChildren ? 'Move or delete child Categories before deleting this Category.' : 'Deleting this Category removes its assignments from Guides.'}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
