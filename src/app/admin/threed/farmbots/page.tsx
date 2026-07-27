// app/admin/threed/farmbots/page.tsx
'use client';

import { ThreeDFarmbotsCRUD } from '@/components/admin/threed/farmbots/ThreeDFarmbotsCRUD';

export default function AdminThreeDFarmbotsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FarmBots</h1>
          <p className="text-sm text-muted-foreground">
            Manage your FarmBot devices for automated garden operations
          </p>
        </div>
      </div>

      <ThreeDFarmbotsCRUD />
    </div>
  );
}