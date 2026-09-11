// app/admin/threed/model-animations/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images, Loader2 } from 'lucide-react';
import { ThreeDModelAnimations } from '@/components/admin/threed/models/ThreeDModelAnimations';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

function ModelAnimationsPageInner() {
  const searchParams = useSearchParams();
  const [headerContainer, setHeaderContainer] = useState<HTMLDivElement | null>(null);
  const modelIdParam = searchParams.get('modelId');
  const initialModelId = modelIdParam ? parseInt(modelIdParam) : null;
  const modelQuery = Number.isInteger(initialModelId) && Number(initialModelId) > 0
    ? `?modelId=${initialModelId}`
    : '';

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <AdminWorkspaceHeader
        className="shrink-0"
        icon={Clapperboard}
        title="Model Animations"
        description="Map a Model's embedded animation clips to the App's animation actions"
      >
        <div ref={setHeaderContainer} className="min-w-0 flex-1" />
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Back to Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href={`/admin/threed/model-files${modelQuery}`} icon={FolderOpen}>Model Files</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <div className="min-h-0 flex-1">
        <ThreeDModelAnimations initialModelId={initialModelId} headerContainer={headerContainer} scrollMappings />
      </div>
    </div>
  );
}

export default function ModelAnimationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModelAnimationsPageInner />
    </Suspense>
  );
}
