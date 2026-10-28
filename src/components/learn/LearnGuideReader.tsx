'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';
import { LearnMarkdown } from './LearnMarkdown';
import { isLearnGuideSlug, readPublicLearnGuide } from './learn-public-data';
import { usePublicLearn } from './use-public-learn';

export function LearnGuideReader({ slug, embedded = false }: { slug: string; embedded?: boolean }) {
  const valid = isLearnGuideSlug(slug);
  const request = usePublicLearn(valid ? `/api/learn/public/guides/${encodeURIComponent(slug)}` : null, readPublicLearnGuide);
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    if (embedded && request.status !== 'loading' && request.status !== 'idle') container.current?.scrollIntoView({ block: 'start' });
  }, [embedded, slug, request.status]);
  const guide = request.data;
  const missing = !valid || request.status === 'missing';
  const Heading = embedded ? 'h3' : 'h1';
  return <article ref={container} id={embedded ? slug : undefined} aria-busy={request.status === 'loading'} className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl scroll-mt-24 space-y-6 rounded-2xl border p-6 sm:p-10">
    <nav aria-label="Guide navigation" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <Link href="/learn#how-to" className="inline-flex items-center gap-2 underline underline-offset-4"><ArrowLeft aria-hidden="true" className="size-4" />All Learn guides</Link>
      {embedded && guide && <Link href={`/learn/guides/${guide.slug}`} className="inline-flex items-center gap-2 underline underline-offset-4">Open guide page<ArrowUpRight aria-hidden="true" className="size-4" /></Link>}
    </nav>
    {request.status === 'loading' && <p role="status" className="text-muted-foreground">Loading guide…</p>}
    {missing && <div role="status" className="space-y-2"><Heading className="text-2xl font-semibold">Guide not found</Heading><p className="text-muted-foreground">This guide is unavailable or is no longer published. Browse the current guides to continue.</p></div>}
    {request.status === 'error' && <div role="alert" className="space-y-3"><p>This guide could not be loaded. Please try again.</p><Button variant="outline" onClick={request.retry}>Retry guide</Button></div>}
    {guide && <>
      <header className="space-y-3 border-b pb-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><ModuleIcon moduleKey="learn" />Learn ThreeD</div>
        <Heading className="text-3xl font-semibold tracking-tight sm:text-4xl">{guide.title}</Heading>
        {guide.summary && <p className="text-muted-foreground">{guide.summary}</p>}
      </header>
      <LearnMarkdown content={guide.content} />
    </>}
  </article>;
}
