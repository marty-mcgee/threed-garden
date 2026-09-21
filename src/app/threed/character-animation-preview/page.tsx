import { redirect } from 'next/navigation';
import { auth } from '@/libraries/auth';
import { CharacterAnimationPreview } from '@/components/admin/threed/animations/CharacterAnimationPreview';

export const metadata = { title: 'Character Animation Preview' };
export default async function CharacterAnimationPreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in');
  return <CharacterAnimationPreview />;
}
