// app/admin/music/media/page.tsx
'use client';

import { MusicMediaCRUD } from '@/components/admin/music/media/MusicMediaCRUD';
import { Image, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MediaManagementPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/music')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Music
        </Button>
      </div>

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