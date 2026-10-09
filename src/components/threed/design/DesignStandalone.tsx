'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Designs is an editing mode of an existing Project, never a separate Scene. */
export function DesignStandalone() {
  const query = useSearchParams(), router = useRouter();
  const projectId = query.get('projectId');
  const [offset, setOffset] = useState(0), [total, setTotal] = useState(0);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]), [error, setError] = useState('');
  useEffect(() => {
    if (projectId && /^[1-9]\d*$/.test(projectId) && Number.isSafeInteger(Number(projectId))) {
      router.replace('/dashboard/scene?projectId=' + projectId + '&view=design'); return;
    }
    const controller = new AbortController();
    void fetch('/api/map/projects?limit=50&offset=' + offset, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load Projects.');
      setProjects(result.projects); setTotal(result.pagination.total); setError('');
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [projectId, offset, router]);
  return <section className="space-y-4 p-4"><h1 className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-cyan-400" />ThreeD Designs</h1>
    <p className="text-sm text-muted-foreground">Choose a Project to edit architectural content in its existing Scene. Project Save retains the drawing parameters and Scene objects together.</p>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    <ul className="space-y-2">{projects.map(project => <li key={project.id}><Link className="text-cyan-400 underline" href={'/dashboard/scene?projectId=' + project.id + '&view=design'}>{project.name}</Link></li>)}</ul>
    <div className="flex gap-2"><Button variant="outline" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 50))}>Previous</Button><Button variant="outline" disabled={offset + 50 >= total} onClick={() => setOffset(value => value + 50)}>Next</Button></div>
  </section>;
}
