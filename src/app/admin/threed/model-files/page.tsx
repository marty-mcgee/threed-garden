// app/admin/threed/model-files/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images, Loader2 } from 'lucide-react';
import { ThreeDModelFilesCRUD } from '@/components/admin/threed/models/ThreeDModelFilesCRUD';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

function ModelFilesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectorContainer, setSelectorContainer] = useState<HTMLDivElement | null>(null);
  const modelIdParam = searchParams.get('modelId');
  const initialModelId = modelIdParam ? parseInt(modelIdParam) : null;
  const modelQuery = Number.isInteger(initialModelId) && Number(initialModelId) > 0
    ? `?modelId=${initialModelId}`
    : '';

  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={FolderOpen}
        title="Model Files"
        description="Upload and manage model files, textures, and supportive media for ThreeD Models"
      >
        <div ref={setSelectorContainer} className="min-w-0 max-w-full" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>Back to Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href={`/admin/threed/model-animations${modelQuery}`} icon={Clapperboard}>Model Animations</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      <ThreeDModelFilesCRUD key={initialModelId ?? 'default'} initialModelId={initialModelId}
        selectorContainer={selectorContainer}
        onSelectModel={(id) => router.push(`/admin/threed/model-files?modelId=${id}`)} />
    </div>
  );
}

export default function ModelFilesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ModelFilesPageInner />
    </Suspense>
  );
}
