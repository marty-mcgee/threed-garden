'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LEARN_GUIDE_CATEGORY_LIMIT } from '@/libraries/services/learn/contracts';
import { learnAdminActionClass as actionClass } from './learn-admin-client';
import { learnCategoryOptions, useLearnCategories } from './use-learn-categories';

interface Props {
  selected: number[];
  saved: number[];
  onChange: (ids: number[]) => void;
}

export function LearnGuideCategories({ selected, saved, onChange }: Props) {
  const { categories, loading, error, refresh } = useLearnCategories();
  const options = useMemo(() => learnCategoryOptions(categories), [categories]);
  const missing = !loading && !error ? selected.filter(id => !categories.some(category => category.id === id)) : [];
  const selectable = options.filter(({ category }) => category.isActive || selected.includes(category.id) || saved.includes(category.id));
  const atLimit = selected.length >= LEARN_GUIDE_CATEGORY_LIMIT;

  function toggle(id: number, checked: boolean) {
    if (checked && !atLimit) onChange([...selected, id].sort((a, b) => a - b));
    if (!checked) onChange(selected.filter(value => value !== id));
  }

  return (
    <fieldset className="min-w-0 space-y-2 rounded-md border p-2 sm:col-span-2">
      <legend className="px-1 font-medium">Categories</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground">{selected.length} selected</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" className={actionClass} disabled={loading} onClick={refresh}>Refresh Categories</Button>
          <a className="underline underline-offset-2" href="/admin/learn/categories">Manage Categories</a>
        </div>
      </div>
      {loading ? <p role="status">Loading Categories…</p> : error ? <p role="alert" className="text-destructive">{error}</p> :
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {selectable.length === 0 && missing.length === 0 && <p className="text-muted-foreground">No active Categories available.</p>}
          {selectable.map(({ category, label }) => (
            <label key={category.id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-accent">
              <input type="checkbox" className="mt-0.5 accent-primary" checked={selected.includes(category.id)}
                disabled={!selected.includes(category.id) && (atLimit || !category.isActive && !saved.includes(category.id))}
                onChange={event => toggle(category.id, event.target.checked)} />
              <span className="min-w-0 break-words">{label}{!category.isActive && <span className="text-muted-foreground"> (Inactive)</span>}</span>
            </label>
          ))}
          {missing.map(id => (
            <label key={id} className="flex cursor-pointer items-start gap-2 px-1 py-1 text-muted-foreground">
              <input type="checkbox" checked onChange={() => toggle(id, false)} />
              Unavailable Category #{id} (uncheck to remove)
            </label>
          ))}
        </div>}
      {atLimit && <p role="status">A Guide can have up to {LEARN_GUIDE_CATEGORY_LIMIT} Categories.</p>}
    </fieldset>
  );
}
