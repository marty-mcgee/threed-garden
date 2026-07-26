// app/admin/threed/beds/page.tsx
'use client';

import { ThreeDBedsCRUD } from '@/components/admin/threed/beds/ThreeDBedsCRUD';
import { Box } from 'lucide-react';

export default function ThreeDBedsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Box className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">Garden Beds</h1>
          <p className="text-sm text-muted-foreground">
            Manage your garden beds with 3D positioning and layout
          </p>
        </div>
      </div>
      <ThreeDBedsCRUD />
    </div>
  );
}