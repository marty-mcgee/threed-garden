import { LearnGuideReader } from '@/components/learn/LearnGuideReader';

export const metadata = { title: 'Learn ThreeD guide', description: 'Read a published ThreeD App guide.' };

export default async function LearnGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <main className="threed-presentation min-w-0 px-6 py-8 text-base leading-relaxed sm:py-12"><LearnGuideReader slug={slug} /></main>;
}
