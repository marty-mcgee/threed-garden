// components/auth/SignOutButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export function SignOutButton({
  variant = 'outline',
  size = 'default',
  className = '',
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/sign-in',
      });
      showToast('Signed out successfully', 'success');
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Failed to sign out', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}