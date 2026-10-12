import Link from 'next/link';
import { BookOpen, Box, Flower2, PencilRuler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardWelcome({ loading, failed, onCreate, creationPending = false }: { loading: boolean; failed: boolean; onCreate: () => void; creationPending?: boolean }) {
  return <Card className="gap-0 rounded-lg border-foreground/10 bg-transparent shadow-none"><CardContent className="space-y-3 p-4 sm:p-5">
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><PencilRuler aria-hidden="true" className="size-4 text-cyan-500" />Your ThreeD workspace</div>
    <h1 id="welcome-title" className="text-2xl font-semibold tracking-tight">Bring your space to life.</h1>
    <p className="max-w-xl text-sm text-muted-foreground">Draw a room, plan a garden, or arrange an interactive scene in one Project.</p>
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Button variant="success" size="lg" disabled={creationPending} onClick={onCreate}><PencilRuler aria-hidden="true" />Create Project</Button>
      <Button asChild variant="ghost" size="sm"><Link href="/learn"><BookOpen aria-hidden="true" />Learn ThreeD</Link></Button>
    </div>
    <p className="text-xs text-muted-foreground">{loading ? 'Loading your available Projects below...' : failed ? 'Project discovery is unavailable. Retry below; your existing Projects are not changed.' : 'Open an existing Project below, or start with the ThreeD Starter template. Sign in to create and save.'}</p>
  </CardContent></Card>;
}

export function DashboardStartingPaths() {
  return <section aria-labelledby="starting-paths-title" className="space-y-3 border-t pt-4">
    <h2 id="starting-paths-title" className="text-base font-semibold">Find your starting point</h2>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{ title: 'Design a space', description: 'Draw walls and a floor, then inspect your room in 3D.', href: '/learn#draw-room', Icon: PencilRuler },
        { title: 'Plan a garden', description: 'Arrange available Models in a Project and inspect their positions.', href: '/learn#add-model', Icon: Flower2 },
        { title: 'Explore an interactive scene', description: 'Learn to orbit, zoom and switch views.', href: '/learn#view-modes', Icon: Box }].map(({ title, description, href, Icon }) =>
        <Link key={href} href={href} className="group rounded-lg focus-visible:outline-2 focus-visible:outline-ring"><Card className="h-full gap-0 rounded-lg bg-transparent shadow-none group-hover:bg-accent/30"><CardContent className="flex items-start gap-3 p-3"><Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" /><div className="space-y-1"><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div></CardContent></Card></Link>)}
    </div>
    <p className="text-sm text-muted-foreground"><Link href="/#garden-demo" className="underline underline-offset-4">Try the illustrative garden demo</Link> to practice orbit and zoom without saving a Project.</p>
  </section>;
}
