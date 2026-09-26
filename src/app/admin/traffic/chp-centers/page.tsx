// app/admin/traffic/chp-centers/page.tsx
'use client';

import { TrafficCHPCentersCRUD } from '@/components/admin/traffic/chp-centers/TrafficCHPCentersCRUD';
import { FileText } from 'lucide-react';

export default function TrafficCHPCentersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <FileText className="w-6 h-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">CHP Centers</h1>
          <p className="text-sm text-muted-foreground">
            Manage CHP Dispatch Station Centers
          </p>
        </div>
      </div>
      <TrafficCHPCentersCRUD />
    </div>
  );
}