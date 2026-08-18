// app/admin/threed/tasks/page.tsx
'use client';

import { ThreeDTasksCRUD } from '@/components/admin/threed/tasks/ThreeDTasksCRUD';

export default function AdminThreeDTasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Garden Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage garden tasks and to-do items for your 3D garden
          </p>
        </div>
      </div>

      <ThreeDTasksCRUD />
    </div>
  );
}
