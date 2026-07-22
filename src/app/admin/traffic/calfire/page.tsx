// app/admin/traffic/calfire/page.tsx
'use client';

import { TrafficCalfireCRUD } from '@/components/admin/traffic/calfire/TrafficCalfireCRUD';
import { Flame } from 'lucide-react';

export default function TrafficCalfirePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Flame className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold">CalFire Incidents</h1>
          <p className="text-sm text-muted-foreground">
            Manage wildfire incidents
          </p>
        </div>
      </div>
      <TrafficCalfireCRUD />
    </div>
  );
}