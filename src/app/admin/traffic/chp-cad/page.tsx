// app/admin/traffic/chp-cad/page.tsx
'use client';

import { TrafficCHPCADCRUD } from '@/components/admin/traffic/chp-cad/TrafficCHPCADCRUD';
import { AlertTriangle } from 'lucide-react';

export default function TrafficCHPCADPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <AlertTriangle className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">CHP-CAD Incidents</h1>
          <p className="text-sm text-muted-foreground">
            Manage live CHP incidents
          </p>
        </div>
      </div>
      <TrafficCHPCADCRUD />
    </div>
  );
}