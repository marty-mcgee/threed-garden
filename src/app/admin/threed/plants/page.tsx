// app/admin/threed/plants/page.tsx - Non-interfering version
'use client';

import { ThreeDPlantsCRUD } from '@/components/admin/threed/plants/ThreeDPlantsCRUD';
import { Sprout } from 'lucide-react';

export default function AdminThreeDPlantsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Sprout className="w-6 h-6 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold">Plants</h1>
          <p className="text-sm text-muted-foreground">
            Manage your garden plant database with 3D models and care instructions
          </p>
        </div>
      </div>
      <ThreeDPlantsCRUD />
    </div>
  );
}