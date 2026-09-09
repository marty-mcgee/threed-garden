import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ThreeDModelImportPreview } from '@/components/admin/threed/models/ThreeDModelImportPreview';

export const metadata = { title: 'ThreeD Model Import Preview' };

export default async function ModelImportPreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in');
  return <ThreeDModelImportPreview />;
}
