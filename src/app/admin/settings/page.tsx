// app/admin/settings/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsManager } from '@/components/admin/settings/SettingsManager';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  return <SettingsManager />;
}
