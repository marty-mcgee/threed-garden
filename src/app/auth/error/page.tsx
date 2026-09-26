// app/auth/error/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// ✅ Separate component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    default: 'An unexpected error occurred',
    Configuration: 'There is a problem with the server configuration. Please check your environment variables.',
    AccessDenied: 'You do not have permission to sign in',
    Verification: 'The verification link is invalid or expired',
    OAuthSignin: 'An error occurred while signing in with OAuth',
    OAuthCallback: 'An error occurred during the OAuth callback',
    OAuthCreateAccount: 'Could not create OAuth account',
    EmailCreateAccount: 'Could not create email account',
    Callback: 'An error occurred during the callback',
    OAuthAccountNotLinked: 'This email is already associated with another account',
    EmailSignin: 'An error occurred during email sign in',
    CredentialsSignin: 'Invalid email or password',
    SessionRequired: 'You must be signed in to access this page',
  };

  const errorMessage = errorMessages[error as keyof typeof errorMessages] || errorMessages.default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-red-600">Authentication Error</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          <p className="font-medium">Error: {error || 'Unknown Error'}</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/sign-in">Back to Sign In</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ✅ Main page with Suspense boundary
export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}