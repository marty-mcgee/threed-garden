// app/admin/threed/model-files/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ThreeDModelFilesTable } from '@/components/admin/threed/models/ThreeDModelFilesTable';

function ModelFilesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelIdParam = searchParams.get('modelId');
  const parsedId = modelIdParam && /^[1-9]\d*$/.test(modelIdParam) ? Number(modelIdParam) : NaN;
  const initialModelId = Number.isSafeInteger(parsedId) ? parsedId : null;
  const fileIdParam = searchParams.get('fileId');
  useEffect(() => {
    if (!initialModelId) return;
    const fileId = fileIdParam && /^[1-9]\d*$/.test(fileIdParam) && Number.isSafeInteger(Number(fileIdParam)) ? Number(fileIdParam) : null;
    router.replace(fileId ? `/admin/threed/models/${initialModelId}/files/${fileId}` : `/admin/threed/models/${initialModelId}?tab=files`);
  }, [initialModelId, fileIdParam, router]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {modelIdParam && !initialModelId && <p role="alert">Invalid legacy Model address. Choose a parent Model from the list filters.</p>}
      {initialModelId ? <p role="status">Opening Model #{initialModelId}…</p> : <ThreeDModelFilesTable />}
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
