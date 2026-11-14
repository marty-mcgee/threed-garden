import Image from 'next/image';
import { PROJECT_SHOWCASE } from '@/libraries/config/project-showcase';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';



export function HomeShowcase() {
  return <section aria-labelledby="home-showcase-title" className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Inside the App</p>
    <h2 id="home-showcase-title" className="text-3xl font-bold tracking-tight sm:text-4xl">Real Projects. Room for your ideas.</h2>
    <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">These are actual public Project screens, captured as a Guest on November 14, 2026. Open a Project to explore its current state. Guest access lets you look around; saving changes requires the appropriate account.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      {PROJECT_SHOWCASE.map(project => <article key={project.id} className="flex min-w-0 flex-col">
        <figure>
          <a href={project.featured_image} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500" aria-label={`View full-size capture of ${project.title} (opens a new tab)`}>
            <Image src={project.featured_image} alt={project.alt} width={1920} height={1080} sizes="(min-width: 1024px) 33vw, 100vw" className="h-auto w-full" />
          </a>
          <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">Actual App capture · November 14, 2026 · Select image for full size.</figcaption>
        </figure>
        <p className="mb-2 mt-5 text-sm font-medium text-emerald-800 dark:text-emerald-200">{project.theme}</p>
        <h3 className="text-xl font-semibold">{project.title}</h3>
        <p className="mb-5 mt-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        <Button asChild variant="outline" className="mt-auto min-h-12 self-start rounded-xl"><Link href={`/dashboard/scene?projectId=${project.id}&view=design`} aria-label={`Open Project: ${project.title}`}>Open Project<ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
      </article>)}
    </div>
    <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Browse available Projects</Link>
  </section>;
}

export function HomeOnboarding() {
  return <section aria-labelledby="home-start-title" className="mx-auto max-w-7xl border-t px-6 py-12">
    <h2 id="home-start-title" className="text-3xl font-semibold tracking-tight">A simple place to start.</h2>
    <ol className="mt-8 grid gap-8 md:grid-cols-3">
      <li><span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">01 / Explore</span><h3 className="mt-3 text-xl font-semibold">Choose a Project</h3><p className="mt-3 leading-relaxed text-muted-foreground">Open one of the examples above. Give the Scene time to load its Models and textures.</p></li>
      <li><span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">02 / Look around</span><h3 className="mt-3 text-xl font-semibold">Try a different view</h3><p className="mt-3 leading-relaxed text-muted-foreground">Use the Project view controls to explore Design, 3D, 2D or Combined. The guide explains the controls.</p><Link href="/learn" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Explore the Learn guides</Link></li>
      <li><span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">03 / Create</span><h3 className="mt-3 text-xl font-semibold">Make it your own</h3><p className="mt-3 leading-relaxed text-muted-foreground">When you are ready, sign in and create your own Project from Dashboard. Use Project Save to keep your changes.</p><Link href="/dashboard" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Go to Dashboard</Link></li>
    </ol>
  </section>;
}

const questions = [
  {
    question: 'What can I explore without an account?',
    answer: 'Try the garden preview, open available public Projects, browse public Multimedia and read Learn guides. Private content and editing remain protected.',
  },
  {
    question: 'Can I save changes to a public Project?',
    answer: 'Viewing a public Project does not grant permission to edit it. Sign in to create your own Project, then use Project Save to retain your work.',
  },
  {
    question: 'What browser or device do I need?',
    answer: 'Interactive 3D needs a browser and device with WebGL support. Large Scenes can take longer to load on slower devices. The Home garden has a static fallback, and Learn guides remain useful without interacting with a Scene.',
  },
  {
    question: 'Is ThreeD App open source?',
    answer: 'Yes. Application code is available under the MIT License in the ThreeD Garden repository. Models, textures, music and other third-party assets may have separate terms.',
  },
];

export function HomeQuestions() {
  return <section aria-labelledby="home-questions-title" className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
    <h2 id="home-questions-title" className="mb-6 text-3xl font-semibold tracking-tight">Before you get started.</h2>
    {questions.map(item => <details key={item.question} className="border-b py-2">
      <summary className="cursor-pointer rounded py-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">{item.question}</summary>
      <p className="pb-5 leading-relaxed text-muted-foreground">{item.answer}</p>
    </details>)}
  </section>;
}
