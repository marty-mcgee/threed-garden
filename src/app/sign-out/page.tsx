// app/sign-out/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignOutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({
        redirect: false,
        callbackUrl: '/sign-in',
      });
      setSignedOut(true);
      showToast('Signed out successfully', 'success');
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      showToast('Failed to sign out', 'error');
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If signed out, show confirmation
  if (signedOut || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        {ToastComponent}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Signed Out</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <LogOut className="w-12 h-12 mx-auto text-green-500" />
            </div>
            <p className="text-muted-foreground mb-4">
              You have been successfully signed out.
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign In Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      {ToastComponent}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign Out</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Are you sure you want to sign out?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{session.user.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}