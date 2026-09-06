// app/admin/threed/models/page.tsx
'use client';

import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';
import { Package } from 'lucide-react';

export default function ThreeDModelsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Package className="w-6 h-6 text-blue-500" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Models</h1>
          <p className="text-sm text-muted-foreground">
            Add and manage one reusable ThreeD Model at a time
          </p>
        </div>
      </div>
      <ThreeDModelsCRUD />
    </div>
  );
}
