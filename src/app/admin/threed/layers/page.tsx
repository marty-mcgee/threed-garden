// app/admin/threed/layers/page.tsx
'use client';

import { ThreeDLayersCRUD } from '@/components/admin/threed/layers/ThreeDLayersCRUD';
import { Layers } from 'lucide-react';

export default function AdminThreeDLayersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Layers className="w-6 h-6 text-violet-500" />
        <div>
          <h1 className="text-2xl font-bold">Layers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Map 2D + 3D Layers (Groups of Markers)
          </p>
        </div>
      </div>
      <ThreeDLayersCRUD />
    </div>
  );
}