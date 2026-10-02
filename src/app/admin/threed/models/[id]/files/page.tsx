'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, FolderOpen, FolderTree, Images } from 'lucide-react';
import { AdminWorkspaceHeader, AdminWorkspaceLink } from '@/components/admin/layout/AdminWorkspaceHeader';
import { ThreeDModelFilesCRUD } from '@/components/admin/threed/models/ThreeDModelFilesCRUD';

export default function ModelFilesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [modelName, setModelName] = useState<string | null>(null);
  const [selectorContainer, setSelectorContainer] = useState<HTMLDivElement | null>(null);
  const parsedModelId = /^[1-9]\d*$/.test(params.id) ? Number(params.id) : NaN;
  const modelId = Number.isSafeInteger(parsedModelId) ? parsedModelId : null;

  useEffect(() => {
    if (!modelId) return;
    const controller = new AbortController();
    setModelName(null);
    void fetch(`/api/threed/models?id=${modelId}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => response.json()).then(result => {
        if (!controller.signal.aborted && result.success && result.data?.id === modelId && typeof result.data.userId === 'string') setModelName(result.data.modelName);
      }).catch(() => {});
    return () => controller.abort();
  }, [modelId]);

  return (
    <div className="space-y-2">
      <AdminWorkspaceHeader
        icon={FolderOpen}
        title={modelName ? `Model Files — ${modelName}` : 'Model Files'}
        description={modelId ? `Files, dependencies, and appearance for Model #${modelId}` : 'Choose a valid Model'}
      >
        <div ref={setSelectorContainer} className="min-w-0 max-w-full" />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AdminWorkspaceLink href={modelId ? `/admin/threed/models/${modelId}` : '/admin/threed/models'} icon={ArrowLeft}>Model Record</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-categories" icon={FolderTree}>Model Categories</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/animations" icon={Clapperboard}>Animations Library</AdminWorkspaceLink>
          <AdminWorkspaceLink href="/admin/threed/model-textures" icon={Images}>Model Textures</AdminWorkspaceLink>
        </div>
      </AdminWorkspaceHeader>
      {modelId && <nav aria-label="Model workspace" className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
        <Link href={`/admin/threed/models/${modelId}`} className="text-muted-foreground hover:underline">Edit Model</Link>
        <span aria-current="page" className="font-medium">Model Files</span>
        <span className="ml-auto max-w-full truncate text-xs text-muted-foreground">{modelName ? `${modelName} · ` : ''}#{modelId}</span>
      </nav>}
      {modelId ? (
        <ThreeDModelFilesCRUD
          key={modelId}
          initialModelId={modelId}
          selectorContainer={selectorContainer}
          onSelectModel={(id) => router.push(`/admin/threed/models/${id}/files`)}
        />
      ) : (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This Model Files address is invalid.
        </p>
      )}
    </div>
  );
}
