import { CircleQuestionMark, Star } from 'lucide-react';

export function WhyThreeDApp() {
  return (
    <section aria-labelledby="why-threed-app-title" className="threed-workspace-panel threed-presentation-surface mx-auto max-w-5xl space-y-4 rounded-2xl border p-6 sm:p-10">
      <h2 id="why-threed-app-title" className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-600/20 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300">
          <Star
            style={{
              width: '24px',
              height: '24px',
            }}
            strokeWidth={1.75}
          />
        </span>
        Why ThreeD App?
      </h2>
      <p className="text-base leading-relaxed text-foreground/85">
        ThreeD App helps landscape designers, garden planners, product suppliers, and educators turn ideas into interactive spaces people can understand and explore. It brings editable plans, reusable 3D Models, maps, and multimedia into one workspace, making it easier to explain a proposal or demonstrate a concept. Guided instructions help newcomers get started, while more advanced design and asset preparation benefit from training and support.
      </p>
    </section>
  );
}
