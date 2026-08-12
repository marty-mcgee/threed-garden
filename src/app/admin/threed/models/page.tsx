// app/admin/threed/models/page.tsx
'use client';

import Link from 'next/link';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';
import { Package, FolderOpen } from 'lucide-react';

export default function ThreeDModelsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <Package className="w-6 h-6 text-blue-500" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">3D Models</h1>
          <p className="text-sm text-muted-foreground">
            Manage your 3D model library for plants, characters, and garden objects
          </p>
        </div>
        <Link
          href="/admin/threed/model-files"
          className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors no-underline"
        >
          <FolderOpen className="w-4 h-4" />
          Model Files
        </Link>
      </div>
      <ThreeDModelsCRUD />
    </div>
  );
}