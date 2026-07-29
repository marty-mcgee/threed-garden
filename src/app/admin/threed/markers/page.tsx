// app/admin/threed/markers/page.tsx
'use client';

/*
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';
// import { ThreeDMarkersCRUD } from '@/components/admin/threed/markers/ThreeDMarkersCRUD';
// import { AdminLayout } from '@/components/admin/layout/AdminLayout';

// export default async function ThreeDMarkersPage() {
//   const session = await auth();
//   if (!session?.user?.id) {
//     redirect('/auth/signin');
//   }

//   return (
//     <AdminLayout>
//       <div className="container mx-auto py-8 px-4">
//         <ThreeDMarkersCRUD />
//       </div>
//     </AdminLayout>
//   );
// }
*/

import { ThreeDMarkersCRUD } from '@/components/admin/threed/markers/ThreeDMarkersCRUD';
import { MapPin } from 'lucide-react';

export default function AdminThreeDMarkersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <MapPin className="w-6 h-6 text-violet-500" />
        <div>
          <h1 className="text-2xl font-bold">Markers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Map 2D + 3D Model Markers (assigned to optional Layers)
          </p>
        </div>
      </div>
      <ThreeDMarkersCRUD />
    </div>
  );
}