'use client';

import { useEffect, useState } from 'react';
import { parseLearnCategoryUpdate } from '@/libraries/services/learn/input';
import type { LearnCategory } from '@/libraries/services/learn/contracts';
import { learnAdminResponse } from './learn-admin-client';

export const learnCategoriesEndpoint = '/api/learn/categories';

export function readLearnCategory(value: unknown): LearnCategory {
  try {
    return parseLearnCategoryUpdate(value);
  } catch {
    throw new Error('The saved Category could not be verified.');
  }
}

export function useLearnCategories() {
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const response = await fetch(learnCategoriesEndpoint, {
          cache: 'no-store',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        });
        const { data } = await learnAdminResponse<{ data: unknown }>(response, 'Categories could not be loaded.');
        if (!Array.isArray(data)) throw new Error('Categories could not be verified.');
        const records = data.map(readLearnCategory);
        if (!controller.signal.aborted) setCategories(records);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Categories could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [request]);

  return {
    categories,
    setCategories,
    loading,
    error,
    refresh() {
      setLoading(true);
      setRequest(value => value + 1);
    },
  };
}

export function learnCategoryOptions(categories: LearnCategory[]) {
  const byId = new Map(categories.map(category => [category.id, category]));
  const options = categories.map(category => {
    const path = [category];
    const visited = new Set([category.id]);
    let parent = category.parentId === null ? undefined : byId.get(category.parentId);
    while (parent && !visited.has(parent.id)) {
      path.push(parent);
      visited.add(parent.id);
      parent = parent.parentId === null ? undefined : byId.get(parent.parentId);
    }
    path.reverse();
    return { category, path, label: path.map(item => item.name).join(' › ') };
  });
  return options.sort((a, b) => {
    for (let index = 0; index < Math.min(a.path.length, b.path.length); index++) {
      const left = a.path[index], right = b.path[index];
      if (left.id !== right.id) return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name) || left.id - right.id;
    }
    return a.path.length - b.path.length;
  });
}
