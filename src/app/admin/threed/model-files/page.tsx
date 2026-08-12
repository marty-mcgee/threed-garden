// app/admin/threed/model-files/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { ThreeDModelFilesCRUD } from '@/components/admin/threed/models/ThreeDModelFilesCRUD';

function ModelFilesPageInner() {
  const searchParams = useSearchParams();
  const modelIdParam = searchParams.get('modelId');
  const initialModelId = modelIdParam ? parseInt(modelIdParam) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <FolderOpen className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Model Files</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage model files, textures, and supportive media for ThreeD models
          </p>
        </div>
      </div>
      <ThreeDModelFilesCRUD initialModelId={initialModelId} />
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