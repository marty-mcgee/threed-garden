// app/admin/traffic/caltrans-cctv/page.tsx
'use client';

import { TrafficCaltransCctvCRUD } from '@/components/admin/traffic/caltrans-cctv/TrafficCaltransCctvCRUD';
import { Camera } from 'lucide-react';

export default function TrafficCaltransCCTVPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Camera className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold">Caltrans CCTV</h1>
          <p className="text-sm text-muted-foreground">
            Manage Caltrans CCTV
          </p>
        </div>
      </div>
      <TrafficCaltransCctvCRUD />
    </div>
  );
}