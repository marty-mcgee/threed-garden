'use client';

import { Button } from '@/components/ui/button';
import { defaultMetaTags, metaTagNames, type AppMetaTags, type MetaTagName } from '@/libraries/config/meta-tags';

export function ProjectMetaTagsFields({ value, onChange, disabled }: {
  value: AppMetaTags;
  onChange: (value: AppMetaTags) => void;
  disabled: boolean;
}) {
  const update = (index: number, patch: Partial<AppMetaTags['tags'][number]>) => onChange({
    ...value,
    tags: value.tags.map((tag, i) => i === index ? { ...tag, ...patch } : tag),
  });
  const control = 'min-h-9 w-full min-w-0 rounded-md border bg-background px-2 py-1 text-sm [@media(pointer:coarse)]:min-h-11';
  return <details className="rounded-xl border p-4">
    <summary className="cursor-pointer text-sm font-semibold">HTML &amp; SEO: Project Meta Tags</summary>
    <fieldset disabled={disabled} className="mt-3 min-w-0 space-y-3">
      <p className="text-xs text-muted-foreground">Override App-wide defaults for this Project's Scene page. Unlisted tags inherit App Settings. Save Changes below retains these settings. Disable or clear to inherit all App defaults. Save a new Project before configuring its tags.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.enabled} onChange={event => onChange({ ...value, enabled: event.target.checked })} />Enable Project meta tags</label>
      {value.tags.map((tag, index) => <div key={index} className="grid min-w-0 gap-2 rounded border p-2">
        <select aria-label={`Project meta tag ${index + 1}`} className={control} value={tag.name} onChange={event => update(index, { name: event.target.value as MetaTagName, content: '' })}>
          {metaTagNames.map(name => <option key={name} disabled={value.tags.some((row, i) => i !== index && row.name === name)}>{name}</option>)}
        </select>
        {tag.name === 'robots' || tag.name === 'twitter:card' ? <select aria-label={`Project content for ${tag.name}`} className={control} value={tag.content} onChange={event => update(index, { content: event.target.value })}>
          <option value="">Select a value</option>
          {(tag.name === 'robots' ? ['index, follow', 'noindex, follow', 'noindex, nofollow'] : ['summary', 'summary_large_image']).map(content => <option key={content}>{content}</option>)}
        </select> : <input aria-label={`Project content for ${tag.name}`} maxLength={2000} className={control} value={tag.content} placeholder={tag.name.endsWith(':image') ? 'https://example.com/image.png' : 'Project meta tag content'} onChange={event => update(index, { content: event.target.value })} />}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, tags: value.tags.filter((_, i) => i !== index) })}>Remove {tag.name}</Button>
      </div>)}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={value.tags.length >= metaTagNames.length} onClick={() => {
          const name = metaTagNames.find(name => !value.tags.some(tag => tag.name === name));
          if (name) onChange({ ...value, tags: [...value.tags, { name, content: '' }] });
        }}>Add Project Meta Tag</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...defaultMetaTags(), revision: value.revision })}>Clear Project Meta Tags</Button>
      </div>
      <p className="text-xs text-muted-foreground">Project privacy and ownership are unchanged. Private or inactive Projects do not expose these tags to other viewers. Reload the Project Scene URL after saving to inspect its HTML source.</p>
    </fieldset>
  </details>;
}
