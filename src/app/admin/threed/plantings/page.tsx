// app/admin/threed/plantings/page.tsx
'use client';

import { ThreeDPlantingsCRUD } from '@/components/admin/threed/plantings/ThreeDPlantingsCRUD';

export default function AdminThreeDPlantingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plantings</h1>
          <p className="text-sm text-muted-foreground">
            Manage plants in beds with growth tracking and harvest planning
          </p>
        </div>
      </div>

      <ThreeDPlantingsCRUD />
    </div>
  );
}
