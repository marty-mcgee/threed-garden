// app/admin/traffic/bayarea511/page.tsx
'use client';

import { TrafficBayArea511CRUD } from '@/components/admin/traffic/bayarea511/TrafficBayArea511CRUD';
import { Radio } from 'lucide-react';

export default function TrafficBayArea511Page() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Radio className="w-6 h-6 text-cyan-500" />
        <div>
          <h1 className="text-2xl font-bold">Bay Area 511</h1>
          <p className="text-sm text-muted-foreground">
            Manage 511 traffic events
          </p>
        </div>
      </div>
      <TrafficBayArea511CRUD />
    </div>
  );
}