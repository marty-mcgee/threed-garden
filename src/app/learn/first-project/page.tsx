import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Rocket } from 'lucide-react';
import { APP_DEMO_HREF } from '@/libraries/config/app-links';
import { LearnGuideIllustration } from '@/components/learn/LearnGuideIllustration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Your first Project',
  description: 'Create a ThreeD Project from a template, make a change, save and reopen it.',
};
const actionClassName = 'h-auto min-h-12 w-full whitespace-normal rounded-xl px-5 py-3 text-base sm:w-auto [&_svg]:size-5';

export default function FirstProjectPage() {
  return <main className="threed-presentation mx-auto max-w-7xl space-y-6 px-6 py-10 text-base leading-relaxed">
    <Link href="/learn" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to Learn ThreeD</Link>
    <Card className="threed-workspace-panel threed-presentation-surface threed-presentation-featured mx-auto max-w-5xl scroll-mt-24 gap-0 rounded-2xl shadow-sm"><CardContent className="space-y-5 p-6 sm:p-10"><h1 className="flex items-center gap-2 text-2xl font-semibold"><Rocket aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" />Your first Project</h1>
      <LearnGuideIllustration topic="first-project" />
      <p>Public Projects are for exploring. To make and save changes, <Link className="underline" href="/auth/sign-in">sign in</Link> or <Link className="underline" href="/auth/sign-up">create an account</Link>, then create your own Project. New accounts can manage their own content.</p>
      <figure className="space-y-3">
        <a href="/learn/screenshots/create-project-template.png" target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" aria-label="View the full-size Create a Project from a Template screenshot (opens in a new tab)">
          <Image src="/learn/screenshots/create-project-template.png" alt="Actual App Create a Project from a Template dialog showing Blank Project, selected ThreeD Starter and Complete App, with Project Name, Description, Public Project, Cancel and Create & Open Project controls." width={2560} height={1392} sizes="(min-width: 1024px) 944px, 100vw" className="h-auto w-full" />
        </a>
        <figcaption className="text-sm text-muted-foreground">Create a Project from a Template — actual App screenshot supplied November 14, 2026. ThreeD Starter is selected; enter a Project Name to enable Create &amp; Open Project. Select the image to inspect the controls at full size.</figcaption>
      </figure>
      <ol className="list-decimal space-y-2 pl-5">
        <li><Link className="underline" href="/dashboard/scene">Open the Project workspace</Link>. Use Select Project, then Create New Project. If a Project is already open, choose New Project from its menu. Select ThreeD Starter, enter a Project Name, then Create &amp; Open Project. Tools &gt; Project Tour helps with initial setup.</li>
        <li>Choose 3D and practice dragging to orbit and scrolling to zoom. Choose Design to reveal the drawing plan below the Scene.</li>
        <li>Choose Wall in the plan toolbar and click two points. Choose Select, click the wall and change Height in Properties. Expect the wall to update in both views.</li>
        <li>Choose Save ThreeD Project from the Project menu or use the Save icon. Wait for confirmation; read any error before leaving.</li>
        <li>Return to Dashboard and open that Project again. Choose Design, select the wall from Architecture in Project Assets and confirm the saved height. You should still be able to edit it.</li>
      </ol>
      <p className="text-sm text-muted-foreground">No account yet? <Link href={APP_DEMO_HREF} className="underline">Explore the Garden Project</Link> for orbit and zoom, or browse public Projects from Dashboard. Public access does not grant permission to save changes.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="success" size="lg" className={actionClassName}><Link href="/dashboard/scene"><Rocket aria-hidden="true" />Open Project workspace<ArrowRight aria-hidden="true" /></Link></Button>
        <Button asChild variant="outline" size="lg" className={actionClassName}><a href="/learn"><BookOpen aria-hidden="true" />Choose a guide</a></Button>
      </div>
    </CardContent></Card>
  </main>;
}
