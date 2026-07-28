// app/admin/traffic/caltrans/page.tsx
'use client';

import { TrafficCaltransCRUD } from '@/components/admin/traffic/caltrans/TrafficCaltransCRUD';
import { TrafficCone } from 'lucide-react';

export default function TrafficCaltransPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <TrafficCone className="w-6 h-6 text-orange-400" />
        <div>
          <h1 className="text-2xl font-bold">Caltrans Closures</h1>
          <p className="text-sm text-muted-foreground">
            Manage lane and road closures
          </p>
        </div>
      </div>
      <TrafficCaltransCRUD />
    </div>
  );
}