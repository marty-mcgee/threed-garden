import Link from 'next/link';
import { ArrowRight, BookOpen, CircleHelp, Info, ListChecks, Rocket } from 'lucide-react';
import { LearnPreview } from '@/components/learn/LearnPreview';
import { LearnGuideLibrary } from '@/components/learn/LearnGuideLibrary';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { description: 'Learn ThreeD App: create Projects, draw designs, prepare Models, explore Multimedia and manage your workspace.' };

const documentationRoot = 'https://github.com/marty-mcgee/threed-garden/blob/main/docs/';

export default function LearnPage() {
  return <main className="threed-presentation min-w-0 text-base leading-relaxed">
    <section className="threed-workspace-panel threed-presentation-surface threed-presentation-featured border-b">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-[.85fr_1.15fr] lg:py-20">
        <div className="text-center lg:text-left">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-800 dark:text-emerald-200"><ModuleIcon moduleKey="learn" className="size-4" />Make room for your ideas</span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-6xl">Learn ThreeD</h1>
          <p className="mb-5 text-lg text-foreground/85 lg:text-xl">Create and save ThreeD Projects, prepare your assets, and find your way around the App.</p>
          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground lg:mx-0">Start small: open a Project, make one change, and check that you can reopen it.</p>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild variant="success" size="lg" className="h-auto min-h-14 rounded-xl px-7 py-4 text-base shadow-lg shadow-emerald-950/15 [&_svg]:size-5"><a href="#first-project"><Rocket aria-hidden="true" />Start here<ArrowRight aria-hidden="true" /></a></Button>
            <Button asChild variant="outline" size="lg" className="h-auto min-h-14 whitespace-normal rounded-xl border-emerald-600/25 bg-emerald-500/5 px-7 py-4 text-base"><Link href="/#garden-demo">Explore the garden demo</Link></Button>
          </div>
        </div>
        <LearnPreview />
      </div>
    </section>
    <div className="mx-auto max-w-7xl space-y-14 px-6 py-8 sm:py-12">
    <section aria-labelledby="learn-path-title" className="space-y-6">
      <div className="text-center"><h2 id="learn-path-title" className="text-2xl font-bold sm:text-3xl">What would you like to do?</h2><p className="mt-2 text-muted-foreground">Start your first Project, pick a skill, or find a little help.</p></div>
      <nav aria-label="Guide topics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[{ href: '#first-project', label: 'Getting started', detail: 'Make your first Project', Icon: Rocket }, { href: '#how-to', label: 'How-to guides', detail: 'Choose something to create', Icon: BookOpen }, { href: '#troubleshooting', label: 'Troubleshooting', detail: 'Get help when you need it', Icon: CircleHelp }, { href: '#about', label: 'About ThreeD', detail: 'Discover what you can do', Icon: Info }].map(({ href, label, detail, Icon }) =>
          <Button key={href} asChild variant="outline" className="h-auto min-h-32 justify-start whitespace-normal rounded-2xl border-emerald-600/25 bg-emerald-500/5 p-5 text-left hover:border-emerald-500/60 hover:bg-emerald-500/10 [&_svg]:size-6"><a href={href}><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><Icon aria-hidden="true" /></span><span className="min-w-0"><span className="block text-base font-semibold">{label}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{detail}</span></span></a></Button>)}
      </nav>
    </section>
    <Card id="first-project" className="threed-workspace-panel threed-presentation-surface threed-presentation-featured mx-auto max-w-5xl scroll-mt-24 gap-0 rounded-2xl shadow-sm"><CardContent className="space-y-5 p-6 sm:p-10"><h2 className="flex items-center gap-2 text-2xl font-semibold"><Rocket aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" />Your first Project</h2>
      <p>Public Projects are for exploring. To make and save changes, <Link className="underline" href="/auth/sign-in">sign in</Link> or <Link className="underline" href="/auth/sign-up">create an account</Link>, then create your own Project. New accounts can manage their own content.</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li><Link className="underline" href="/dashboard/scene">Open the Project workspace</Link>. Use Select Project, then Create New Project. If a Project is already open, choose New Project from its menu. Select ThreeD Starter, enter a Project Name, then Create &amp; Open Project. Setup &gt; Project Tour helps with initial setup.</li>
        <li>Choose 3D and practice dragging to orbit and scrolling to zoom. Choose Design to reveal the drawing plan below the Scene.</li>
        <li>Choose Wall in the plan toolbar and click two points. Choose Select, click the wall and change Height in Properties. Expect the wall to update in both views.</li>
        <li>Choose Save ThreeD Project from the Project menu or use the Save icon. Wait for confirmation; read any error before leaving.</li>
        <li>Return to Dashboard and open that Project again. Choose Design, select the wall from Architecture in Project Assets and confirm the saved height. You should still be able to edit it.</li>
      </ol>
      <p className="text-sm text-muted-foreground">No account yet? <Link href="/#garden-demo" className="underline">Try the garden demo</Link> for orbit and zoom, or browse public Projects from Dashboard. The illustrative demo does not save or support drawing.</p>
      <Button asChild variant="success" size="lg" className="h-auto min-h-14 whitespace-normal rounded-xl px-7 py-4 text-base shadow-lg shadow-emerald-950/15 focus-visible:ring-emerald-500/50 [&_svg]:size-5"><Link href="/dashboard/scene"><Rocket aria-hidden="true" />Start a Project<ArrowRight aria-hidden="true" /></Link></Button>
    </CardContent></Card>
    <section id="how-to" className="scroll-mt-24 space-y-6">
      <h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><ListChecks aria-hidden="true" className="size-4 text-cyan-500" />How-to guides</h2>
      <LearnGuideLibrary />
    </section>
    <section className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl space-y-4 rounded-2xl border p-6 sm:p-10" aria-labelledby="learn-data-structure-title">
      <h2 id="learn-data-structure-title" className="text-2xl font-semibold">Understand the App’s data structure</h2>
      <p className="text-muted-foreground">Explore ThreeD, Multimedia, Traffic and Learn, then follow their tables, fields and relationships through the shared Project structure.</p>
      <Button asChild variant="outline"><Link href="/learn/data-structure">Explore Data Structure<ArrowRight aria-hidden="true" /></Link></Button>
    </section>
    <section id="troubleshooting" className="mx-auto max-w-5xl space-y-4 scroll-mt-24"><h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><CircleHelp aria-hidden="true" className="size-4 text-amber-500" />Troubleshooting</h2>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot edit or save</summary><p className="mt-2 max-w-4xl text-muted-foreground">Check that you are signed in and own the Project. A public Project belonging to someone else is for viewing. Create your own with New Project. If Save reports an error, retain the open page and retry; export architectural content as a backup when available.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">My floor disappeared</summary><p className="mt-2 max-w-4xl text-muted-foreground">A floor is a draft until you finish it. Click at least three corners, then Finish Floor, Enter or the first corner. Escape cancels unfinished drawing.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot find an object</summary><p className="mt-2 max-w-4xl text-muted-foreground">Clear the Project Assets search. Expand Architecture and choose the object, then Locate. Check its active level and the Designs visibility layer. In Design, try Fit Plan. A missing Model file may show a loading warning; retry loading before placing another copy.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">An import or opening is rejected</summary><p className="mt-2 max-w-4xl text-muted-foreground">Read the validation message. Import accepts supported Design JSON and legacy plans; review any omitted content before proceeding. Doors and windows must fit inside their host wall without overlapping other openings. Cancel leaves your existing content in place.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">A Model is Ready but does not look right</summary><p className="mt-2 max-w-4xl text-muted-foreground">Ready describes saved setup records. Inspect the Model preview and loading feedback, then review Required files and Materials in its Admin Files tab. A missing thumbnail is separate from geometry loading; a Model can also use embedded textures or material colors without separate Texture assignments.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot change Users or global Module appearance</summary><p className="mt-2 max-w-4xl text-muted-foreground">These changes require an active Super Admin account. Ordinary Admins manage their own content and personal settings. A hidden sidebar item can also reflect personal navigation preferences; hiding it does not change your account permissions.</p></details>
    </section>
    <section id="about" className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl space-y-5 scroll-mt-24 rounded-2xl border p-6 sm:p-10"><h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><Info aria-hidden="true" className="size-4 text-violet-700 dark:text-violet-300" />About ThreeD</h2><p>ThreeD App brings spatial planning, garden layouts, interactive Scenes, Multimedia and Traffic into one application. Use Admin to manage your records and assignments, then the Dashboard to explore content and work in a Project. The spatial tools support exploration and planning; these guides do not establish construction or engineering approval.</p><p>The source is available under the MIT License in the <a className="underline" href="https://github.com/marty-mcgee/threed-garden">ThreeD Garden repository</a>. Browse the <a className="underline" href={`${documentationRoot}README.md`}>documentation index</a> for user guides, local development, architecture and extension points. Release records preserve historical scope and verification separately from these current instructions.</p></section>
    </div>
  </main>;
}
