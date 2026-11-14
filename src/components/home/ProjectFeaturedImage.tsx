'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { PROJECT_CAPTURES } from '@/libraries/config/project-showcase';

export function ProjectFeaturedImage({ projectId, featured_image }: { projectId: number; featured_image?: string | null }) {
  const capture = PROJECT_CAPTURES.find(project => project.id === projectId);
  const source = featured_image === undefined ? capture?.featured_image : featured_image;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <div className="mb-3 aspect-video overflow-hidden rounded-md border bg-muted/30">
    {source && failedSource !== source ? <Image
      src={source}
      unoptimized
      alt={source === capture?.featured_image ? capture.alt : 'Project featured image'}
      width={1920}
      height={1080}
      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      className="h-full w-full object-contain"
      onError={() => setFailedSource(source)}
    /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <ImageIcon aria-hidden="true" className="size-8" />
      <span className="text-xs">{source ? 'Project image unavailable' : 'No featured image yet'}</span>
    </div>}
  </div>;
}
