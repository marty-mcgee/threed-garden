// app/admin/threed/characters/page.tsx
'use client';

import { ThreeDCharactersCRUD } from '@/components/admin/threed/characters/ThreeDCharactersCRUD';
import { User } from 'lucide-react';

export default function ThreeDCharactersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <User className="w-6 h-6 text-purple-500" />
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-sm text-muted-foreground">
            Manage your 3D characters and creatures
          </p>
        </div>
      </div>
      <ThreeDCharactersCRUD />
    </div>
  );
}