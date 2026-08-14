// app/admin/threed/model-animations/page.tsx
'use client';

import { Clapperboard } from 'lucide-react';
import { ThreeDModelAnimations } from '@/components/admin/threed/models/ThreeDModelAnimations';

export default function ModelAnimationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Clapperboard className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Model Animations</h1>
          <p className="text-sm text-muted-foreground">
            Map a model's embedded animation clips to the app's animation actions
          </p>
        </div>
      </div>
      <ThreeDModelAnimations />
    </div>
  );
}