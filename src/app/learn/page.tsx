import Link from 'next/link';
import { APP_DEMO_HREF } from '@/libraries/config/app-links';
import { ArrowRight, BookOpen, CircleHelp, ExternalLink, Info, ListChecks, Rocket } from 'lucide-react';
import { LearnPreview } from '@/components/learn/LearnPreview';
import { WhyThreeDApp } from '@/components/home/WhyThreeDApp';
import { LearnGuideLibrary } from '@/components/learn/LearnGuideLibrary';
import { LearnGuideIllustration } from '@/components/learn/LearnGuideIllustration';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { Button } from '@/components/ui/button';

export const metadata = {
  description: 'Learn ThreeD App: create Projects, draw designs, prepare Models, explore Multimedia and manage your workspace.',
};

const documentationRoot = 'https://github.com/marty-mcgee/threed-garden/blob/main/docs/';
const guideTopics = [
  {
    href: '/learn/first-project',
    label: 'Start your first Project',
    detail: 'Follow the setup and Save steps',
    Icon: Rocket,
  },
  {
    href: '#how-to',
    label: 'Browse guides',
    detail: 'Choose a skill to practice',
    Icon: BookOpen,
  },
  {
    href: '#troubleshooting',
    label: 'Find a solution',
    detail: 'Get help with common problems',
    Icon: CircleHelp,
  },
  {
    href: '#about',
    label: 'Explore ThreeD App',
    detail: 'Discover the App and its source',
    Icon: Info,
  },
];
const actionClassName = 'h-auto min-h-12 w-full whitespace-normal rounded-xl px-5 py-3 text-base sm:w-auto [&_svg]:size-5';

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
            <Button asChild variant="success" size="lg" className={actionClassName}><a href="#how-to"><BookOpen aria-hidden="true" />Browse guides<ArrowRight aria-hidden="true" /></a></Button>
            <Button asChild variant="outline" size="lg" className={actionClassName}><a href="/learn/first-project"><Rocket aria-hidden="true" />Start your first Project</a></Button>
          </div>
          <Button asChild variant="link" className="mt-3 h-auto min-h-11 max-w-full whitespace-normal text-base"><Link href={APP_DEMO_HREF}>Just exploring? Explore the Garden Project<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <LearnPreview />
      </div>
    </section>
    <div className="mx-auto max-w-7xl space-y-14 px-6 py-8 sm:py-12">
    <WhyThreeDApp />
    <section aria-labelledby="learn-path-title" className="space-y-6">
      <div className="text-center"><h2 id="learn-path-title" className="text-2xl font-bold sm:text-3xl">What would you like to do?</h2><p className="mt-2 text-muted-foreground">Start your first Project, pick a skill, or find a little help.</p></div>
      <nav aria-label="Guide topics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {guideTopics.map(({ href, label, detail, Icon }) =>
          <Button key={href} asChild variant="outline" className="group h-auto min-h-32 min-w-0 justify-start gap-3 whitespace-normal rounded-2xl border-emerald-600/25 bg-emerald-500/5 p-4 text-left hover:border-emerald-500/60 hover:bg-emerald-500/10"><a href={href}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><Icon aria-hidden="true" className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-base font-semibold">{label}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{detail}</span></span><ArrowRight aria-hidden="true" className="size-4 text-muted-foreground group-hover:text-foreground" /></a></Button>)}
      </nav>
    </section>

    <section id="how-to" className="scroll-mt-24 space-y-6">
      <h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><ListChecks aria-hidden="true" className="size-4 text-cyan-500" />How-to guides</h2>
      <LearnGuideLibrary />
    </section>
    <section className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl space-y-4 rounded-2xl border p-6 sm:p-10" aria-labelledby="learn-data-structure-title">
      <h2 id="learn-data-structure-title" className="text-2xl font-semibold">Understand the App’s data structure</h2>
      <LearnGuideIllustration topic="top-modules" />
      <p className="text-muted-foreground">Explore ThreeD, Multimedia, Traffic and Learn, then follow their tables, fields and relationships through the shared Project structure.</p>
      <Button asChild variant="outline" size="lg" className={actionClassName}><Link href="/learn/data-structure">Explore Data Structure<ArrowRight aria-hidden="true" /></Link></Button>
    </section>
    <section id="troubleshooting" className="mx-auto max-w-5xl space-y-4 scroll-mt-24"><h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><CircleHelp aria-hidden="true" className="size-4 text-amber-500" />Troubleshooting</h2>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot edit or save</summary><p className="mt-2 max-w-4xl text-muted-foreground">Check that you are signed in and own the Project. A public Project belonging to someone else is for viewing. Create your own with New Project. If Save reports an error, retain the open page and retry; export architectural content as a backup when available.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">My floor disappeared</summary><p className="mt-2 max-w-4xl text-muted-foreground">A floor is a draft until you finish it. Click at least three corners, then Finish Floor, Enter or the first corner. Escape cancels unfinished drawing.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot find an object</summary><p className="mt-2 max-w-4xl text-muted-foreground">Clear the Project Assets search. Expand Architecture and choose the object, then Locate. Check its active level and the Designs visibility layer. In Design, try Fit Plan. A missing Model file may show a loading warning; retry loading before placing another copy.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">An import or opening is rejected</summary><p className="mt-2 max-w-4xl text-muted-foreground">Read the validation message. Import accepts supported Design JSON and legacy plans; review any omitted content before proceeding. Doors and windows must fit inside their host wall without overlapping other openings. Cancel leaves your existing content in place.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">A Model is Ready but does not look right</summary><p className="mt-2 max-w-4xl text-muted-foreground">Ready describes saved setup records. Inspect the Model preview and loading feedback, then review Required files and Materials in its Admin Files tab. A missing thumbnail is separate from geometry loading; a Model can also use embedded textures or material colors without separate Texture assignments.</p></details>
      <details className="threed-workspace-panel threed-presentation-surface rounded-xl border p-5 open:border-amber-600/30"><summary className="cursor-pointer font-medium">I cannot change Users or global Module appearance</summary><p className="mt-2 max-w-4xl text-muted-foreground">These changes require an active Super Admin account. Ordinary Admins manage their own content and personal settings. A hidden sidebar item can also reflect personal navigation preferences; hiding it does not change your account permissions.</p></details>
    </section>
    <section id="about" className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl space-y-5 scroll-mt-24 rounded-2xl border p-6 sm:p-10"><h2 className="flex items-center justify-center gap-2 pb-2 text-2xl font-semibold tracking-tight"><Info aria-hidden="true" className="size-4 text-violet-700 dark:text-violet-300" />About ThreeD</h2><p>ThreeD App brings spatial planning, garden layouts, interactive Scenes, Multimedia and Traffic into one application. Use Admin to manage your records and assignments, then the Dashboard to explore content and work in a Project. The spatial tools support exploration and planning; these guides do not establish construction or engineering approval.</p><p>The source is available under the MIT License. The documentation covers user guides, local development, architecture and extension points. Release records preserve historical scope and verification separately from these current instructions.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg" className={actionClassName}><a href="https://github.com/marty-mcgee/threed-garden" target="_blank" rel="noopener noreferrer">View source on GitHub<ExternalLink aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></Button>
        <Button asChild variant="outline" size="lg" className={actionClassName}><a href={`${documentationRoot}README.md`} target="_blank" rel="noopener noreferrer">Read documentation<ExternalLink aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></Button>
      </div>
    </section>
    </div>
  </main>;
}
