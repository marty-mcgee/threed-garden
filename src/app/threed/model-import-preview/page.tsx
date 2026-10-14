import { redirect } from 'next/navigation';
import { auth } from '@/libraries/auth';
import { ThreeDModelImportPreview } from '@/components/admin/threed/models/ThreeDModelImportPreview';


export default async function ModelImportPreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in');
  return <ThreeDModelImportPreview />;
}
