// app/admin/threed/harvests/page.tsx
'use client';

import { ThreeDHarvestsCRUD } from '@/components/admin/threed/harvests/ThreeDHarvestsCRUD';

export default function AdminThreeDHarvestsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Harvests</h1>
          <p className="text-sm text-muted-foreground">
            Log and manage harvest records from your garden
          </p>
        </div>
      </div>

      <ThreeDHarvestsCRUD />
    </div>
  );
}
