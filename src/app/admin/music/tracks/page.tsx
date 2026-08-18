// app/admin/music/tracks/page.tsx
'use client';

import { MusicTracksCRUD } from '@/components/admin/music/tracks/MusicTracksCRUD';
import { Music2 } from 'lucide-react';

export default function TracksManagementPage() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Music2 className="w-6 h-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">Tracks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your music tracks
          </p>
        </div>
      </div>

      {/* ✅ Use the MusicTracksCRUD component */}
      <MusicTracksCRUD />
    </div>
  );
}
