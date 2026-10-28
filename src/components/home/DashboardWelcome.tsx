import Link from 'next/link';
import { Box, Flower2, PencilRuler } from 'lucide-react';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardWelcome({ loading, failed, onCreate, creationPending = false }: { loading: boolean; failed: boolean; onCreate: () => void; creationPending?: boolean }) {
  return <Card className="threed-workspace-panel threed-presentation-surface threed-presentation-featured gap-0 rounded-lg shadow-sm"><CardContent className="space-y-3 p-4 sm:p-5">
    <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300"><PencilRuler aria-hidden="true" className="size-4" />Your ThreeD workspace</div>
    <h1 id="welcome-title" className="text-2xl font-semibold tracking-tight">Bring your space to life.</h1>
    <p className="max-w-xl text-sm text-muted-foreground">Draw a room, plan a garden, or arrange an interactive scene in one Project.</p>
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Button variant="success" size="lg" className="shadow-sm shadow-emerald-950/15 focus-visible:ring-emerald-500/50" disabled={creationPending} onClick={onCreate}><PencilRuler aria-hidden="true" />Create Project</Button>
      <Button asChild variant="ghost" size="sm" className="text-emerald-800 hover:bg-emerald-500/10 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"><Link href="/learn"><ModuleIcon moduleKey="learn" />Learn ThreeD</Link></Button>
    </div>
    <p className="text-xs text-muted-foreground">{loading ? 'Loading your available Projects below...' : failed ? 'Project discovery is unavailable. Retry below; your existing Projects are not changed.' : 'Open an existing Project below, or start with the ThreeD Starter template. Sign in to create and save.'}</p>
  </CardContent></Card>;
}

export function DashboardStartingPaths() {
  return <section aria-labelledby="starting-paths-title" className="space-y-3 border-t pt-4">
    <h2 id="starting-paths-title" className="text-base font-semibold">Find your starting point</h2>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{ title: 'Design a space', description: 'Draw walls and a floor, then inspect your room in 3D.', href: '/learn#draw-room', Icon: PencilRuler, accent: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
        { title: 'Plan a garden', description: 'Arrange available Models in a Project and inspect their positions.', href: '/learn#add-model', Icon: Flower2, accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
        { title: 'Explore an interactive scene', description: 'Learn to orbit, zoom and switch views.', href: '/learn#view-modes', Icon: Box, accent: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' }].map(({ title, description, href, Icon, accent }) =>
        <Link key={href} href={href} className="group rounded-lg focus-visible:outline-2 focus-visible:outline-ring"><Card className="threed-workspace-panel threed-presentation-surface h-full gap-0 rounded-lg shadow-none"><CardContent className="flex items-start gap-3 p-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${accent}`}><Icon aria-hidden="true" className="size-5" /></span><div className="min-w-0 space-y-1"><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div></CardContent></Card></Link>)}
    </div>
    <p className="text-sm text-muted-foreground"><Link href="/#garden-demo" className="underline underline-offset-4">Try the illustrative garden demo</Link> to practice orbit and zoom without saving a Project.</p>
  </section>;
}
