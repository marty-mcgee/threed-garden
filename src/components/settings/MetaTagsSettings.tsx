'use client';

import { useEffect, useRef, useState } from 'react';
import { Code, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './SettingsSection';
import { defaultMetaTags, metaTagNames, parseMetaTags, type AppMetaTags, type MetaTagName } from '@/libraries/config/meta-tags';

export function useMetaTagsEditor() {
  const [snapshot, setSnapshot] = useState<AppMetaTags | null>(null);
  const [draft, setDraft] = useState<AppMetaTags | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const request = useRef(0);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(snapshot);
  const reload = async () => {
    const id = ++request.current;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/meta-tags', { cache: 'no-store' });
      if (id !== request.current) return;
      if (response.status === 403 || response.status === 401) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      const data = await response.json();
      if (id !== request.current) return;
      if (!response.ok) throw new Error(data.error || 'Meta tags could not be loaded.');
      const saved = parseMetaTags(data);
      setSnapshot(saved);
      setDraft(saved);
      setMessage(null);
    } catch (failure) {
      if (id === request.current) setError(failure instanceof Error ? failure.message : 'Meta tags unavailable.');
    } finally { if (id === request.current) setBusy(false); }
  };
  useEffect(() => {
    void reload();
    return () => { request.current++; };
  }, []);
  const save = async () => {
    if (!draft || !allowed || busy || !dirty) return;
    setBusy(true);
    setMessage(null);
    try {
      const input = parseMetaTags(draft);
      const response = await fetch('/api/settings/meta-tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Meta tags could not be saved.');
      const saved = parseMetaTags(data);
      setSnapshot(saved);
      setDraft(saved);
      setError(null);
      setMessage(saved.enabled && saved.tags.length > 0
        ? 'Meta tags saved and enabled. Reload a page to view its updated HTML metadata.'
        : saved.tags.length > 0
          ? 'Meta tags saved, but HTML output is disabled. Check Enable App-wide meta tags and save to emit them.'
          : 'No optional meta tags are configured. The App uses its existing metadata.');
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : 'Save failed. Your draft is retained.');
      throw failure;
    } finally { setBusy(false); }
  };
  return {
    snapshot,
    draft,
    setDraft,
    busy,
    error,
    message,
    allowed,
    dirty,
    disabled: busy || !allowed || !snapshot || !!error,
    save,
    reload,
    discard: () => { setDraft(snapshot); setMessage(null); },
  };
}

export function MetaTagsSettings({ editor }: { editor: ReturnType<typeof useMetaTagsEditor> }) {
  const { draft, setDraft, disabled } = editor;
  const snapshot = editor.snapshot;
  if (!editor.allowed && !editor.error) return null;
  const control = 'min-h-8 w-full min-w-0 rounded-md border bg-background px-2 py-1 text-xs [@media(pointer:coarse)]:min-h-11';
  const update = (index: number, patch: Partial<AppMetaTags['tags'][number]>) => {
    if (draft) setDraft({
      ...draft,
      tags: draft.tags.map((tag, i) => i === index ? { ...tag, ...patch } : tag),
    });
  };
  return <SettingsSection section="html-seo" className="admin-editor-panel rounded-md border border-border/60">
    <summary className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Code className="h-3.5 w-3.5" />HTML &amp; SEO: Meta Tags {editor.dirty && <span className="text-amber-500">Unsaved</span>}</span></summary>
    <div className="space-y-2 px-3 pb-3">
      <p className="text-xs text-muted-foreground">App-wide defaults managed by Super Admins. Page-specific metadata takes precedence. Disabling preserves saved rows but stops applying them. No change to page titles, access permissions or Project privacy.</p>
      {draft && <p role="status" className="rounded-md border px-2 py-1 text-xs">HTML output: <strong>{draft.enabled && draft.tags.length > 0 ? 'Enabled' : 'Disabled'}</strong>{editor.dirty ? ' (unsaved changes)' : ' (saved setting)'}. {!draft.enabled && draft.tags.length > 0 ? 'Your tags are stored but will not be emitted until enabled and saved.' : 'Reload a page after saving to inspect the resulting document.'}</p>}
      {editor.error && <p role="alert" className="text-xs text-destructive">{editor.error}</p>}
      <fieldset disabled={disabled} className="min-w-0 space-y-2">
        {draft && <>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} />Enable App-wide meta tags</label>
          {draft.tags.map((tag, index) => <div key={index} className="grid min-w-0 gap-2 rounded-md border p-2 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,3fr)_auto]">
            <select aria-label={`Meta tag ${index + 1}`} className={control} value={tag.name} onChange={event => update(index, { name: event.target.value as MetaTagName, content: '' })}>
              {metaTagNames.map(name => <option key={name} disabled={draft.tags.some((row, i) => i !== index && row.name === name)}>{name}</option>)}
            </select>
            {tag.name === 'robots' || tag.name === 'twitter:card' ? <select aria-label={`Content for ${tag.name}`} className={control} value={tag.content} onChange={event => update(index, { content: event.target.value })}>
              <option value="">Select a value</option>
              {(tag.name === 'robots' ? ['index, follow', 'noindex, follow', 'noindex, nofollow'] : ['summary', 'summary_large_image']).map(value => <option key={value}>{value}</option>)}
            </select> : <input aria-label={`Content for ${tag.name}`} maxLength={2000} className={control} value={tag.content} placeholder={tag.name.endsWith(':image') ? 'https://example.com/image.png' : 'Meta tag content'} onChange={event => update(index, { content: event.target.value })} />}
            <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${tag.name}`} onClick={() => setDraft({ ...draft, tags: draft.tags.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>)}
          <Button type="button" variant="outline" size="sm" disabled={draft.tags.length >= metaTagNames.length} onClick={() => {
            const name = metaTagNames.find(name => !draft.tags.some(tag => tag.name === name));
            if (name) setDraft({ ...draft, tags: [...draft.tags, { name, content: '' }] });
          }}><Plus className="h-3.5 w-3.5" />Add Meta Tag</Button>
          <details className="text-xs"><summary className="cursor-pointer">Configured HTML preview{!draft.enabled ? ' (output disabled)' : ''}</summary><pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border p-2">{draft.tags.map(tag => `<meta ${tag.name.startsWith('og:') ? 'property' : 'name'}="${tag.name}" content="${tag.content.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}" />`).join('\n') || 'No optional tags configured.'}</pre></details>
          <p className="text-xs text-muted-foreground">Robots directives are App-wide crawler instructions, not privacy controls. Social images require absolute HTTPS URLs. Saved values render as escaped metadata, never executable HTML.</p>
        </>}
      </fieldset>
      <div className="admin-editor-actions flex flex-wrap gap-2 border-t pt-2">
        <Button size="sm" disabled={disabled || !editor.dirty} onClick={() => void editor.save().catch(() => {})}>Save Meta Tags</Button>
        <Button size="sm" variant="outline" disabled={editor.busy || !editor.dirty} onClick={editor.discard}>Discard</Button>
        <Button size="sm" variant="outline" disabled={disabled || !snapshot} onClick={() => {
          if (!snapshot || disabled) return;
          setDraft({
            ...defaultMetaTags(),
            revision: snapshot.revision,
          });
        }}>Clear Meta Tags</Button>
        <Button size="sm" variant="outline" disabled={editor.busy} onClick={() => { if (!editor.dirty || window.confirm('Discard unsaved meta tags and reload?')) void editor.reload(); }}>Reload</Button>
      </div>
      {editor.message && <p role="status" className="text-xs">{editor.message}</p>}
    </div>
  </SettingsSection>;
}
