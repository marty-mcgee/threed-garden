// app/admin/traffic/chp-cases/page.tsx
'use client';

import { TrafficCHPCasesCRUD } from '@/components/admin/traffic/chp-cases/TrafficCHPCasesCRUD';
import { FileText } from 'lucide-react';

export default function TrafficCHPCasesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <FileText className="w-6 h-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">CHP Cases</h1>
          <p className="text-sm text-muted-foreground">
            Manage historical CHP cases
          </p>
        </div>
      </div>
      <TrafficCHPCasesCRUD />
    </div>
  );
}