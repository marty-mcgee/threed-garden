'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Box, Eye, EyeOff, LoaderCircle, LogIn, Music2, Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (!result?.ok || result.error) {
        setError('Unable to sign in. Check your email and password, then try again.');
        submitting.current = false;
        setLoading(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Sign-in is unavailable right now. Please try again.');
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="min-h-svh bg-gradient-to-br from-emerald-500/10 via-background to-blue-500/10 text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
        <nav aria-label="Sign-in navigation" className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white"><Sprout aria-hidden="true" className="h-5 w-5" /></span>
            ThreeD Garden
          </Link>
          <Button asChild variant="ghost" className="min-h-11 gap-2 text-muted-foreground"><Link href="/"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Home</Link></Button>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-10 md:grid-cols-2 md:gap-14 md:py-16">
          <section aria-labelledby="welcome-heading" className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"><Box aria-hidden="true" className="h-3.5 w-3.5" />ThreeD App</span>
            <h1 id="welcome-heading" className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Welcome back.<br /><span className="text-emerald-700 dark:text-emerald-400">Make room for your ideas.</span></h1>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">Your Projects, gardens, and Multimedia. All in one place.</p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Sprout aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Grow</span>
              <span className="inline-flex items-center gap-2"><Box aria-hidden="true" className="h-4 w-4 text-blue-500" />Design</span>
              <span className="inline-flex items-center gap-2"><Music2 aria-hidden="true" className="h-4 w-4 text-violet-500" />Create</span>
            </div>
            <Button asChild variant="outline" className="min-h-11 gap-2 border-emerald-500/20 bg-emerald-500/5"><Link href="/learn"><BookOpen aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Explore Learn ThreeD<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
          </section>

          <Card className="w-full min-w-0 rounded-2xl border-border/60 bg-card/95 py-7 shadow-xl shadow-black/5 sm:py-8">
            <CardHeader className="space-y-2">
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><LogIn aria-hidden="true" className="h-5 w-5" /></span>
              <h2 className="text-2xl font-semibold tracking-tight">Sign in to ThreeD</h2>
              <p className="text-sm text-muted-foreground">Continue to your workspace.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
                {error && <p id="sign-in-error" role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-3 text-sm text-destructive">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" className="h-12 rounded-lg bg-background" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={loading} aria-describedby={error ? 'sign-in-error' : undefined} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" className="h-12 rounded-lg bg-background pr-12" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required disabled={loading} aria-describedby={error ? 'sign-in-error' : undefined} />
                    <Button type="button" variant="ghost" className="absolute right-1 top-1 h-10 w-10 p-0 text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-controls="password" aria-pressed={showPassword} disabled={loading} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</Button>
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full gap-2 rounded-lg bg-emerald-700 text-base font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700" disabled={loading}>
                  {loading ? <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />Signing in...</> : <>Sign In<ArrowRight aria-hidden="true" className="h-4 w-4" /></>}
                </Button>
                <p role="status" className="sr-only">{loading ? 'Signing in. Please wait.' : ''}</p>
              </form>
              <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm">
                <p className="mb-3 text-muted-foreground">New to ThreeD?</p>
                <Button asChild variant="outline" className="min-h-11 w-full rounded-lg"><Link href="/auth/sign-up">Create an account</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <footer className="text-center text-xs text-muted-foreground">ThreeD Garden · Powered by ThreeD App</footer>
      </div>
    </main>
  );
}
