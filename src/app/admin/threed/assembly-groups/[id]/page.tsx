import { notFound } from 'next/navigation';
import { AssemblyCompositionWorkspace } from '@/components/threed/assemblies/AssemblyCompositionWorkspace';

export default async function EditAssemblyGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  return <AssemblyCompositionWorkspace recordId={id} />;
}
