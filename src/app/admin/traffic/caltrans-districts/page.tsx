// app/admin/traffic/caltrans-districts/page.tsx
'use client';

import { TrafficCaltransDistrictsCRUD } from '@/components/admin/traffic/caltrans-districts/TrafficCaltransDistrictsCRUD';
import { Grid3x2 } from 'lucide-react';

export default function TrafficCaltransDistrictsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Grid3x2 className="w-6 h-6 text-orange-400" />
        <div>
          <h1 className="text-2xl font-bold">Caltrans Districts</h1>
          <p className="text-sm text-muted-foreground">
            Manage Caltrans Districts
          </p>
        </div>
      </div>
      <TrafficCaltransDistrictsCRUD />
    </div>
  );
}