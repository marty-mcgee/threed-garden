// app/admin/music/links/page.tsx
'use client';

import { MusicLinksCRUD } from '@/components/admin/music/links/MusicLinksCRUD';
import { Link2 } from 'lucide-react';

export default function LinksManagementPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link2 className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-sm text-muted-foreground">
            Manage your external links
          </p>
        </div>
      </div>

      {/* ✅ Use the MusicLinksCRUD component - it handles all data fetching */}
      <MusicLinksCRUD />
    </div>
  );
}