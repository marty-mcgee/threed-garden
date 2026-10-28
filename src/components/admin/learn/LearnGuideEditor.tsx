'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, RefreshCw } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import { LearnMarkdown } from '@/components/learn/LearnMarkdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LEARN_CONTENT_LIMIT, LEARN_SLUG_LIMIT, LEARN_SUMMARY_LIMIT, LEARN_TITLE_LIMIT, type LearnGuide, type LearnGuideInput } from '@/libraries/services/learn/contracts';
import { learnGuideInputSchema } from '@/libraries/services/learn/input';
import { LearnAdminError, learnAdminResponse, learnAdminActionClass as actionClass } from './learn-admin-client';

type Form = Omit<LearnGuideInput, 'sortOrder'> & { sortOrder: string };
const blank = (): Form => ({ title: '', slug: '', summary: '', content: '', sortOrder: '0', isActive: true, isPublished: false });
const toForm = (guide: LearnGuide): Form => ({ title: guide.title, slug: guide.slug, summary: guide.summary, content: guide.content, sortOrder: String(guide.sortOrder), isActive: guide.isActive, isPublished: guide.isPublished });
const slugFor = (title: string) => title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, LEARN_SLUG_LIMIT).replace(/-$/, '');
const validGuide = (guide: LearnGuide, expectedId?: number) => Number.isSafeInteger(guide?.id) && guide.id > 0
  && (!expectedId || guide.id === expectedId) && typeof guide.revision === 'string'
  && typeof guide.summary === 'string' && typeof guide.content === 'string' && typeof guide.sortOrder === 'number'
  && typeof guide.isActive === 'boolean' && typeof guide.isPublished === 'boolean'
  && learnGuideInputSchema.safeParse({ title: guide.title, slug: guide.slug, summary: guide.summary, content: guide.content, sortOrder: guide.sortOrder, isActive: guide.isActive, isPublished: guide.isPublished }).success;

export function LearnGuideEditor({ id }: { id?: number }) {
  const { data: session, status } = useSession();
  if (status === 'loading') return <p role="status" className="p-3 text-sm">Checking Learn access…</p>;
  if (status !== 'authenticated' || !session?.user?.id) return <p role="alert" className="p-3 text-sm">Sign in to manage Learn guides. <Link className="underline" href="/auth/sign-in">Sign In</Link></p>;
  return <LearnGuideForm key={`${session.user.id}:${id ?? 'new'}`} id={id} />;
}

function LearnGuideForm({ id }: { id?: number }) {
  const [form, setForm] = useState<Form>(blank), [baseline, setBaseline] = useState<Form>(blank);
  const [record, setRecord] = useState<LearnGuide | null>(null);
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false), [reload, setReload] = useState(0), [leaving, setLeaving] = useState(false);
  const mutation = useRef<AbortController | null>(null), mounted = useRef(true), leavingRef = useRef(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const currentDraft = useRef({ dirty, busy }); currentDraft.current = { dirty, busy };
  const parsed = learnGuideInputSchema.safeParse({ ...form, sortOrder: Number(form.sortOrder) });
  const invalid = !form.title.trim() ? 'Enter a guide title.' : !form.slug.trim() ? 'Enter a guide slug.'
    : !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug.trim()) ? 'Use lowercase letters, numbers and single hyphens in the slug.'
    : !form.sortOrder.trim() || !Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < -10000 || Number(form.sortOrder) > 10000 ? 'Sort Order must be an integer from -10000 to 10000.'
    : !parsed.success ? 'Check the guide fields and their length limits.' : '';
  const blocked = loading ? 'Loading guide access…' : denied ? 'An active Super Admin account is required.'
    : loadError ? 'Reload the saved guide before editing.' : leaving ? 'Opening the saved guide…' : busy ? 'Saving guide…'
    : conflict ? 'A newer version was saved. Your draft is retained; reload the saved guide before saving again.'
    : invalid || (id && !record ? 'The saved guide is unavailable.' : !dirty ? 'No unsaved changes.' : '');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutation.current?.abort(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(''); setError(''); setMessage('');
    void (async () => {
      try {
        // Creation still checks current server authority instead of trusting a session role.
        const response = await fetch(id ? `/api/learn/guides?id=${id}` : '/api/learn/guides?limit=25&offset=0', { cache: 'no-store', signal: controller.signal });
        const payload = await learnAdminResponse<{ data: LearnGuide | unknown[] }>(response, 'The Learn guide could not be loaded.');
        if (controller.signal.aborted) return;
        if (id) {
          const guide = payload.data as LearnGuide;
          if (!validGuide(guide, id)) throw new Error('The saved guide could not be verified.');
          setRecord(guide); setForm(toForm(guide)); setBaseline(toForm(guide));
        } else {
          if (!Array.isArray(payload.data)) throw new Error('Learn access could not be verified.');
          setRecord(null); setForm(blank()); setBaseline(blank());
        }
        setDenied(false); setConflict(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : 'The Learn guide could not be loaded.');
        setDenied(error instanceof LearnAdminError && (error.status === 401 || error.status === 403));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [id, reload]);
  useEffect(() => {
    // Document entry and exit keep Back/Forward on the browser's beforeunload boundary,
    // including surrounding Next navigation links and the new-guide replacement URL.
    const unload = (event: BeforeUnloadEvent) => { if (!leavingRef.current && (currentDraft.current.dirty || currentDraft.current.busy || mutation.current)) { event.preventDefault(); event.returnValue = ''; } };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const destination = new URL(href, window.location.href), current = new URL(window.location.href);
      if (destination.origin === current.origin && destination.pathname === current.pathname && destination.search === current.search && destination.hash !== current.hash) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (destination.href === current.href || leavingRef.current || mutation.current || (currentDraft.current.dirty && !window.confirm('Discard unsaved Learn guide changes?'))) return;
      leavingRef.current = true; setLeaving(true); window.location.assign(destination.href);
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, []);

  function close() {
    if (mutation.current || leavingRef.current || (dirty && !window.confirm('Discard unsaved Learn guide changes?'))) return;
    leavingRef.current = true; setLeaving(true); window.location.assign('/admin/learn');
  }
  function refresh() {
    if (mutation.current || leavingRef.current || (dirty && !window.confirm('Reload and discard unsaved Learn guide changes?'))) return;
    setReload(value => value + 1);
  }
  function discard() {
    if (mutation.current || leavingRef.current || !dirty || !window.confirm('Discard unsaved Learn guide changes?')) return;
    setForm({ ...baseline }); setError(''); setMessage('Draft changes discarded.');
  }
  async function save() {
    if (mutation.current || leavingRef.current || blocked || !parsed.success) return;
    const controller = new AbortController(); mutation.current = controller; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/learn/guides', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...parsed.data, ...(id ? { id, revision: record!.revision } : {}) }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
      const payload = await learnAdminResponse<{ data: LearnGuide }>(response, 'The guide could not be saved.');
      const guide = payload.data;
      if (!validGuide(guide, id)) throw new Error('The save could not be confirmed. Retain your draft and check the saved guide before retrying.');
      if (!mounted.current || controller.signal.aborted) return;
      const saved = toForm(payload.data);
      setRecord(payload.data); setForm(saved); setBaseline(saved); setConflict(false);
      setMessage(payload.data.isActive && payload.data.isPublished ? 'Guide saved and available on Learn.' : 'Guide saved. It is not publicly visible.');
      if (!id) { leavingRef.current = true; setLeaving(true); window.location.replace(`/admin/learn/${payload.data.id}`); }
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      setError(error instanceof Error ? error.message : 'The guide could not be saved.');
      if (error instanceof LearnAdminError) {
        if (error.status === 401 || error.status === 403) setDenied(true);
        if (error.status === 409 && id) setConflict(true);
      }
    } finally { if (mutation.current === controller) mutation.current = null; if (mounted.current) setBusy(false); }
  }

  return <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden text-xs">
    <AdminWorkspaceHeader moduleKey="learn" icon={BookOpen} title={id ? 'Edit Guide' : 'Add Guide'} description="Write shared Learn guides with Markdown." className="shrink-0">
      <ModelFieldHelp label="Learn guide">Only Active and Published guides appear publicly. Preview uses the same Markdown renderer as Learn. Saving an unpublished guide keeps it available only to Super Admins.</ModelFieldHelp>
      {record && !denied && !loadError && <span className="text-xs text-muted-foreground">#{record.id}</span>}
      <div className="ml-auto flex flex-wrap gap-1"><Button variant="outline" className={actionClass} disabled={busy || leaving} onClick={close}><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />Guides</Button><Button variant="outline" className={actionClass} disabled={busy || loading || leaving} onClick={refresh}><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Reload</Button></div>
    </AdminWorkspaceHeader>
    {loading ? <p role="status" className="p-3">Loading Learn guide…</p> : denied || loadError ? <div role="alert" className="space-y-2 p-3"><p>{denied ? 'An active Super Admin account is required to manage Learn guides.' : loadError}</p>{error && <p>{error}</p>}<Button variant="outline" className={actionClass} disabled={busy || leaving} onClick={refresh}>Retry</Button></div> : <div className="min-h-0 flex-1 overflow-y-auto xl:grid xl:grid-cols-2 xl:gap-3 xl:overflow-hidden">
      <fieldset disabled={busy || leaving} className="min-h-0 space-y-3 pb-3 xl:overflow-y-auto xl:pr-1">
        <section className="admin-editor-panel grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label htmlFor="learn-guide-title">Title *</Label><Input id="learn-guide-title" aria-label="Guide title" className="h-8 text-xs" required maxLength={LEARN_TITLE_LIMIT} value={form.title} onChange={event => { const title = event.target.value; setForm(value => ({ ...value, title, slug: !id && (!value.slug || value.slug === slugFor(value.title)) ? slugFor(title) : value.slug })); }} /></div>
          <div className="sm:col-span-2"><Label htmlFor="learn-guide-slug">Slug *</Label><Input id="learn-guide-slug" aria-label="Guide slug" className="h-8 text-xs" required maxLength={LEARN_SLUG_LIMIT} value={form.slug} aria-describedby="learn-guide-slug-help" onChange={event => setForm(value => ({ ...value, slug: event.target.value }))} /><p id="learn-guide-slug-help" className="mt-1 text-muted-foreground">Unique across Learn. Lowercase letters, numbers and single hyphens. Changing it changes the public guide URL.</p></div>
          <div className="sm:col-span-2"><Label htmlFor="learn-guide-summary">Summary</Label><Textarea id="learn-guide-summary" aria-label="Guide summary" className="text-xs" rows={3} maxLength={LEARN_SUMMARY_LIMIT} value={form.summary} onChange={event => setForm(value => ({ ...value, summary: event.target.value }))} /></div>
          <div><Label htmlFor="learn-guide-order">Sort Order</Label><Input id="learn-guide-order" aria-label="Guide Sort Order" className="h-8 text-xs" type="number" step={1} min={-10000} max={10000} value={form.sortOrder} onChange={event => setForm(value => ({ ...value, sortOrder: event.target.value }))} /></div>
          <div className="space-y-3"><div className="flex items-center gap-2"><Switch id="learn-guide-active" aria-label="Guide Active" checked={form.isActive} onCheckedChange={isActive => setForm(value => ({ ...value, isActive }))} /><Label htmlFor="learn-guide-active">Active</Label></div><div className="flex items-center gap-2"><Switch id="learn-guide-published" aria-label="Guide Published" checked={form.isPublished} onCheckedChange={isPublished => setForm(value => ({ ...value, isPublished }))} /><Label htmlFor="learn-guide-published">Published</Label></div></div>
          <p className="text-muted-foreground sm:col-span-2">{form.isActive && form.isPublished ? 'Saving makes this guide available to everyone on Learn.' : 'This guide stays out of public Learn while either Active or Published is off.'}</p>
        </section>
        <section className="admin-editor-panel space-y-2 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-1"><Label htmlFor="learn-guide-content">Markdown content</Label><span className="text-muted-foreground">{form.content.length.toLocaleString()} / {LEARN_CONTENT_LIMIT.toLocaleString()}</span></div><Textarea id="learn-guide-content" aria-label="Guide Markdown content" className="min-h-80 font-mono text-xs leading-6" rows={22} maxLength={LEARN_CONTENT_LIMIT} value={form.content} onChange={event => setForm(value => ({ ...value, content: event.target.value }))} /><p className="text-muted-foreground">Use Markdown headings, lists, links, code and tables. Raw HTML is not rendered.</p></section>
      </fieldset>
      <section aria-label="Guide preview" className="admin-editor-panel mb-3 min-h-0 rounded-lg border xl:mb-0 xl:overflow-y-auto"><div className="sticky top-0 z-10 border-b bg-background px-3 py-2"><h2 className="font-semibold">Preview</h2><p className="text-muted-foreground">Your current draft; publication changes apply when saved.</p></div><div className="min-w-0 space-y-4 p-4"><h3 className="break-words text-2xl font-semibold">{form.title || 'Guide title'}</h3>{form.summary && <p className="break-words text-sm text-muted-foreground">{form.summary}</p>}{form.content ? <LearnMarkdown content={form.content} /> : <p className="text-sm text-muted-foreground">Write Markdown to preview the guide.</p>}</div></section>
    </div>}
    <footer className="admin-editor-actions shrink-0 space-y-2 border-t pt-3">
      {error && !denied && <p role="alert" className="text-xs text-destructive">{error} Your draft is retained.</p>}
      <div className="flex flex-wrap items-center gap-2"><Button variant="success" className={actionClass} disabled={!!blocked} aria-describedby="learn-guide-save-status" onClick={() => void save()}>{busy ? 'Saving…' : id ? 'Save Changes' : 'Create Guide'}</Button><Button variant="outline" className={actionClass} disabled={busy || leaving} onClick={close}>Cancel</Button><Button variant="ghost" className={actionClass} disabled={!dirty || busy || loading || denied || leaving} onClick={discard}>Discard changes</Button><p id="learn-guide-save-status" role="status" aria-live="polite" className="text-xs text-muted-foreground">{dirty ? blocked || 'Unsaved changes. Ready to save.' : message || blocked}</p></div>
    </footer>
  </div>;
}
