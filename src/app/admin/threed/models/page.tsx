// app/admin/threed/models/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';

function ThreeDModelsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const parsedId = idParam && /^[1-9]\d*$/.test(idParam) ? Number(idParam) : null;
  const linkedModelId = parsedId && Number.isSafeInteger(parsedId) ? parsedId : null;

  return <ThreeDModelsCRUD scrollRecords linkedModelId={linkedModelId}
    onCloseLinkedModel={() => router.replace('/admin/threed/models', { scroll: false })} />;
}

export default function ThreeDModelsPage() {
  return <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
    <ThreeDModelsPageInner />
  </Suspense>;
}
