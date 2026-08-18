// app/admin/music/media/page.tsx
'use client';

import { MusicMediaCRUD } from '@/components/admin/music/media/MusicMediaCRUD';
import { Image } from 'lucide-react';

export default function MediaManagementPage() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Image className="w-6 h-6 text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold">Media</h1>
          <p className="text-sm text-muted-foreground">
            Manage your album media files
          </p>
        </div>
      </div>

      {/* ✅ Use the MusicMediaCRUD component */}
      <MusicMediaCRUD />
    </div>
  );
}
