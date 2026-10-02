// app/admin/threed/model-files/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images, Loader2 } from 'lucide-react';
import { ThreeDModelFilesCRUD } from '@/components/admin/threed/models/ThreeDModelFilesCRUD';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';

function ModelFilesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectorContainer, setSelectorContainer] = useState<HTMLDivElement | null>(null);
  const modelIdParam = searchParams.get('modelId');
  const parsedId = modelIdParam && /^[1-9]\d*$/.test(modelIdParam) ? Number(modelIdParam) : NaN;
  const initialModelId = Number.isSafeInteger(parsedId) ? parsedId : null;
  const fileIdParam = searchParams.get('fileId');
  useEffect(() => {
    if (!initialModelId) return;
    const fileId = fileIdParam && /^[1-9]\d*$/.test(fileIdParam) && Number.isSafeInteger(Number(fileIdParam)) ? Number(fileIdParam) : null;
    router.replace(`/admin/threed/models/${initialModelId}/files${fileId ? `/${fileId}` : ''}`);
  }, [initialModelId, fileIdParam, router]);

  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={FolderOpen}
        title="Model Files"
        description="Upload and manage model files, textures, and supportive media for ThreeD Models"
      >
        <div ref={setSelectorContainer} className="min-w-0 max-w-full" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AdminWorkspaceLink href="/admin/threed/models" icon={ArrowLeft}>All Models</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href={`/admin/threed/animations`} icon={Clapperboard}>Animations Library</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      {modelIdParam && !initialModelId && <p role="alert">Invalid Model address. Choose a Model below.</p>}
      {initialModelId ? <p role="status">Opening Model #{initialModelId}…</p> : <ThreeDModelFilesCRUD initialModelId={null}
        selectorContainer={selectorContainer}
        onSelectModel={(id) => router.push(`/admin/threed/models/${id}/files`)} />}
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
