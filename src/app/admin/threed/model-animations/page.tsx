// app/admin/threed/model-animations/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images, Loader2 } from 'lucide-react';
import { ThreeDModelAnimations } from '@/components/admin/threed/models/ThreeDModelAnimations';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

function ModelAnimationsPageInner() {
  const searchParams = useSearchParams();
  const modelIdParam = searchParams.get('modelId');
  const initialModelId = modelIdParam ? parseInt(modelIdParam) : null;
  const modelQuery = Number.isInteger(initialModelId) && Number(initialModelId) > 0
    ? `?modelId=${initialModelId}`
    : '';

  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={Clapperboard}
        title="Model Animations"
        description="Map a Model's embedded animation clips to the App's animation actions"
      >
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Back to Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href={`/admin/threed/model-files${modelQuery}`} icon={FolderOpen}>Model Files</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <ThreeDModelAnimations initialModelId={initialModelId} />
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
