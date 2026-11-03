import { getGuideIllustration } from './guide-illustrations';

/** Presentation only: no guide writes, starter imports or publication fallback. */
export function LearnGuideIllustration({ topic, content = '' }: { topic: string; content?: string }) {
  const illustration = getGuideIllustration(topic);
  if (!illustration || content.includes(illustration.src)) return null;

  return <figure className="min-w-0 space-y-2">
    <img
      src={illustration.src}
      alt={illustration.alt}
      width={illustration.width}
      height={illustration.height}
      loading="lazy"
      decoding="async"
      className="block h-auto w-full rounded-xl border border-emerald-600/20"
    />
    <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm leading-relaxed text-muted-foreground">
      <span><span className="font-medium">Conceptual illustration.</span> {illustration.caption}</span>
      <a href={illustration.src} target="_blank" rel="noopener noreferrer" className="shrink-0 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        View full size<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </figcaption>
  </figure>;
}
