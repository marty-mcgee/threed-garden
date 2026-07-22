// app/admin/threed/models/page.tsx
'use client';

import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';
import { Package } from 'lucide-react';

export default function ThreeDModelsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Package className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">3D Models</h1>
          <p className="text-sm text-muted-foreground">
            Manage your 3D model library
          </p>
        </div>
      </div>
      <ThreeDModelsCRUD />
    </div>
  );
}