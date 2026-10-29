import Link from 'next/link';
import { SchemaExplorer } from '@/components/learn/data-structure/SchemaExplorer';
import snapshot from '../../../../docs/developers/app-data-structure.json';

export const metadata = {
  title: 'Data Structure | Learn ThreeD',
  description: 'Explore the ThreeD App schemas, Top Modules, tables and relationships.',
};

export default function LearnDataStructurePage() {
  return <main className="threed-presentation mx-auto min-w-0 max-w-[1680px] space-y-6 px-4 py-8 sm:px-6">
    <Link href="/learn" className="text-sm underline underline-offset-4">Back to Learn ThreeD</Link>
    <header className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Schema-First · Top-Down · Existing App structure</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore the App’s data structure</h1>
      <p className="max-w-3xl text-muted-foreground">Follow the four Top Modules, their records and the shared foundations that connect them. This explorer shows schema definitions, not database records.</p>
    </header>
    <SchemaExplorer schema={snapshot} />
  </main>;
}
