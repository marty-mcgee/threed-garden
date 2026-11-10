'use client';

import { useEffect, useRef, useState } from 'react';
import { Code, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './SettingsSection';
import { defaultMetaTags, defaultSocialImage, metaTagNames, parseMetaTags, type AppMetaTags, type MetaTagName } from '@/libraries/config/meta-tags';

const availableMetaTagNames = [
  'title',
  ...metaTagNames.filter(name => name !== 'title' && !name.startsWith('twitter:')),
] satisfies MetaTagName[];
const metaTagGuidance: Partial<Record<MetaTagName, { label: string; help: string; suggestion?: string }>> = {
  title: {
    label: 'Title prefix',
    help: 'Sets the beginning of the HTML <title>, followed by the existing page and Project suffixes. This is a title element, not a meta name="title" tag. Reload after saving.',
    suggestion: 'ThreeD App',
  },
  description: {
    label: 'Page description',
    help: 'A concise description of ThreeD App. Pages and Projects can supply more specific descriptions.',
    suggestion: 'Turn landscape, garden and property ideas into interactive spaces with ThreeD App. Combine editable 2D plans, reusable 3D Models, maps and multimedia.',
  },
  author: {
    label: 'Author',
    help: 'Enter the actual author or organization. Omit this tag when one App-wide author would misrepresent user-created content.',
  },
  keywords: {
    label: 'Keywords (optional)',
    help: 'Optional descriptive terms. Google Search does not use this tag for ranking; focus on the description instead.',
  },
  robots: {
    label: 'Search indexing instructions',
    help: 'App-wide crawler instructions. These do not grant access, enforce privacy or automatically distinguish public and private pages.',
  },
  'og:site_name': {
    label: 'Site name for sharing',
    help: 'The App or site name shown in supported link previews.',
    suggestion: 'ThreeD App',
  },
  'og:title': {
    label: 'Title for sharing',
    help: 'A default social preview title. This does not change the browser page title.',
    suggestion: 'ThreeD App | Interactive 2D Plans and 3D Project Presentations',
  },
  'og:description': {
    label: 'Description for sharing',
    help: 'Explain the App in supported social link previews.',
    suggestion: 'Explore landscape, garden and property concepts through editable 2D plans, reusable 3D Models, maps and multimedia in ThreeD App.',
  },
  'og:image': {
    label: 'Image for sharing',
    help: 'Use an absolute HTTPS URL for a publicly accessible, representative App image. Leave empty rows out until an image is available.',
    suggestion: defaultSocialImage,
  },
  'og:url': {
    label: 'Open Graph public site URL',
    help: 'Absolute HTTPS site URL. Its origin is combined with each page path; authorized Project pages retain their Project ID. This does not add a canonical link.',
    suggestion: 'https://threedgarden.com/',
  },
  'fb:app_id': {
    label: 'Facebook App ID',
    help: 'Enter one numeric Meta App ID for this site. Leave blank to omit it. Different Projects can override this ID in their metadata. Never enter an App Secret.',
  },
};

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
          ? 'Overrides saved but disabled. Built-in metadata defaults remain active.'
          : 'No overrides are configured. Built-in metadata defaults remain active.');
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
      <p className="text-xs text-muted-foreground">App-wide defaults managed by Super Admins. Title sets the browser title prefix; existing page and Project suffixes remain. Page-specific metadata takes precedence. Disabling preserves saved rows and restores built-in metadata defaults. Access permissions and Project privacy are unchanged.</p>
      <p className="text-xs text-muted-foreground">Built-in description, author, keywords, robots and Open Graph tags always apply when overrides are missing or blank. The default sharing image is an actual App screenshot: <a className="underline" href={defaultSocialImage} target="_blank" rel="noopener noreferrer">View default preview image</a>.</p>
      {draft && <p role="status" className="rounded-md border px-2 py-1 text-xs">Saved overrides: <strong>{draft.enabled && draft.tags.length > 0 ? 'Enabled' : 'Disabled'}</strong>{editor.dirty ? ' (unsaved changes)' : ' (saved setting)'}. {!draft.enabled && draft.tags.length > 0 ? 'Your overrides are stored; built-in defaults apply until enabled and saved.' : 'Reload a page after saving to inspect the resulting document.'}</p>}
      {editor.error && <p role="alert" className="text-xs text-destructive">{editor.error}</p>}
      <fieldset disabled={disabled} className="min-w-0 space-y-2">
        {draft && <>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} />Enable App-wide overrides</label>
          {draft.tags.map((tag, index) => <div key={index} className="grid min-w-0 gap-2 rounded-md border p-2 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,3fr)_auto]">
            <select aria-label={`Meta tag ${index + 1}`} className={control} value={tag.name} onChange={event => update(index, { name: event.target.value as MetaTagName, content: '' })}>
              {(tag.name.startsWith('twitter:') ? [...availableMetaTagNames, tag.name] : availableMetaTagNames).map(name => <option key={name} value={name} disabled={draft.tags.some((row, i) => i !== index && row.name === name)}>{metaTagGuidance[name]?.label ?? `${name} (saved legacy tag)`} — {name}</option>)}
            </select>
            {tag.name === 'robots' || tag.name === 'twitter:card' ? <select aria-label={`Content for ${tag.name}`} className={control} value={tag.content} onChange={event => update(index, { content: event.target.value })}>
              <option value="">Use the default</option>
              {(tag.name === 'robots' ? ['index, follow', 'noindex, follow', 'noindex, nofollow'] : ['summary', 'summary_large_image']).map(value => <option key={value}>{value}</option>)}
            </select> : <input aria-label={`Content for ${tag.name}`} maxLength={2000} className={control} value={tag.content} placeholder={tag.name.endsWith(':image') ? 'https://example.com/image.png' : 'Leave blank to use the default'} onChange={event => update(index, { content: event.target.value })} />}
            <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${tag.name}`} onClick={() => setDraft({ ...draft, tags: draft.tags.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" /></Button>
            <div className="space-y-1 text-xs text-muted-foreground sm:col-span-3">
              <p>{metaTagGuidance[tag.name]?.help ?? 'Previously saved tag. Remove this row if it is no longer needed.'}</p>
              {metaTagGuidance[tag.name]?.suggestion && <Button type="button" variant="outline" size="sm" onClick={() => {
                const suggestion = metaTagGuidance[tag.name]?.suggestion;
                if (suggestion) update(index, { content: suggestion });
              }}>Use suggested {tag.name}</Button>}
            </div>
          </div>)}
          <Button type="button" variant="outline" size="sm" disabled={availableMetaTagNames.every(name => draft.tags.some(tag => tag.name === name))} onClick={() => {
            const name = availableMetaTagNames.find(name => !draft.tags.some(tag => tag.name === name));
            if (name) setDraft({ ...draft, tags: [...draft.tags, { name, content: '' }] });
          }}><Plus className="h-3.5 w-3.5" />Add Meta Tag</Button>
          <details className="text-xs"><summary className="cursor-pointer">Configured override preview{!draft.enabled ? ' (overrides disabled)' : ''}</summary><pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border p-2">{draft.tags.filter(tag => tag.content.trim()).map(tag => tag.name === 'title' ? `<title>${tag.content.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')} - [page / Project suffix]</title>` : `<meta ${tag.name.startsWith('og:') || tag.name.startsWith('fb:') ? 'property' : 'name'}="${tag.name}" content="${tag.content.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}" />`).join('\n') || 'No overrides configured; built-in metadata defaults apply.'}</pre></details>
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
