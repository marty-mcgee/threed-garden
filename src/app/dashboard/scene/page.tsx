import type { Metadata, ResolvingMetadata } from 'next';
import { auth } from '@/libraries/auth';
import { inheritProjectMetadata, readProjectHtmlMetadata } from '@/libraries/services/project/meta-tags';
import SceneWorkspace from './SceneWorkspace';

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await searchParams;
  if (typeof params.projectId !== 'string') return {};
  try {
    const session = await auth();
    const overrides = await readProjectHtmlMetadata(params.projectId, session?.user?.id);
    return inheritProjectMetadata(overrides, await parent);
  } catch {
    console.warn('Project meta tags unavailable; retaining App metadata.');
    return {};
  }
}

export default function ProjectScenePage() {
  return <SceneWorkspace />;
}
