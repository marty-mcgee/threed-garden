// app/admin/threed/watering-schedules/page.tsx
'use client';

import { ThreeDWateringSchedulesCRUD } from '@/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD';

export default function AdminThreeDWateringSchedulesPage() {
  return (
    <div className="w-full py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Garden Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage watering schedules, approaches, and historical data
          </p>
        </div>
      </div>

      <ThreeDWateringSchedulesCRUD />
    </div>
  );
}