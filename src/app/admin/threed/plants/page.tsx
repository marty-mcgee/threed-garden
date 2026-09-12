// Standalone viewport sizing; Project-embedded Plants retain natural height.
'use client';

import { ThreeDPlantsCRUD } from '@/components/admin/threed/plants/ThreeDPlantsCRUD';

export default function AdminThreeDPlantsPage() {
  return <ThreeDPlantsCRUD scrollRecords />;
}
