import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SchemaRelationshipGraph } from './SchemaRelationshipGraph';
import { schemaSourceUrl, tableHref, type SchemaEdge, type SchemaTable } from './schema-explorer';

type Props = {
  table: SchemaTable;
  tables: SchemaTable[];
  edges: SchemaEdge[];
  allEdges: SchemaEdge[];
};

function RelationshipList({ edges }: { edges: SchemaEdge[] }) {
  return <div className="space-y-3">
    {edges.length === 0 && <p className="text-sm text-muted-foreground">No relationships in the selected layers.</p>}
    {edges.map(edge => <article key={edge.id} className="min-w-0 space-y-2 rounded-lg border p-3 text-sm [overflow-wrap:anywhere]">
      <p className="font-medium">{edge.label}</p>
      <p className="text-muted-foreground">{edge.kind}{edge.status !== 'declared' && <strong className="ml-2 text-amber-700 dark:text-amber-400">{edge.status === 'incompatible' ? 'Incompatible IDs' : 'Pending / on hold'}</strong>}</p>
      <p><a className="underline" href={tableHref(edge.from)}>{edge.from}</a> ({edge.fromColumns.join(', ') || 'inferred'}) → <a className="underline" href={tableHref(edge.to)}>{edge.to}</a> ({edge.toColumns.join(', ') || 'inferred'})</p>
      {edge.condition && <p><code>{edge.condition}</code></p>}
      {edge.onDelete && <p>On delete: {edge.onDelete}; on update: {edge.onUpdate}</p>}
      {edge.note && <p className="text-muted-foreground">{edge.note}</p>}
    </article>)}
  </div>;
}

export function SchemaTableDetails({ table, tables, edges, allEdges }: Props) {
  const constraints = [
    ...table.primaryKey.length ? [{ name: 'Primary key', detail: table.primaryKey.join(', ') }] : [],
    ...table.uniqueConstraints.map(value => ({ name: value.name, detail: `Unique: ${value.columns.join(', ')}` })),
    ...table.indexes.map(value => ({ name: value.name, detail: `${value.unique ? 'Unique index' : 'Index'}: ${value.columns.join(', ')}${value.where ? ` WHERE ${value.where}` : ''}` })),
    ...table.checks.map(value => ({ name: value.name, detail: value.expression })),
  ];
  return <div className="min-w-0 space-y-6">
    <p className="break-all text-sm text-muted-foreground">{table.exportName} · <a className="underline" href={schemaSourceUrl(table.sourcePath, table.line)}>View schema source</a> (current main)</p>
    {table.notes.map(note => <p key={note} className="border-l-2 pl-3 text-sm text-muted-foreground">{note}</p>)}
    <SchemaRelationshipGraph key={`${table.id}:${edges.map(edge => edge.kind).join(',')}`} table={table} tables={tables} edges={edges} />
    <section aria-label="Columns" className="min-w-0 space-y-3">
      <h3 className="font-semibold">Columns ({table.columns.length})</h3>
      <Table className="min-w-[650px] text-sm">
        <TableHeader><TableRow><TableHead>Column / property</TableHead><TableHead>Type</TableHead><TableHead>Nullability</TableHead><TableHead>Keys</TableHead><TableHead>Default</TableHead></TableRow></TableHeader>
        <TableBody>{table.columns.map(column => <TableRow key={column.name}>
          <TableCell className="whitespace-normal"><code>{column.name}</code><span className="block text-xs text-muted-foreground">{column.property}</span></TableCell>
          <TableCell>{column.type}</TableCell>
          <TableCell>{column.notNull ? 'Required' : 'Nullable'}</TableCell>
          <TableCell>{[table.primaryKey.includes(column.name) ? 'PK' : '', column.unique ? 'Unique' : '', allEdges.some(edge => edge.kind === 'foreign-key' && edge.from === table.id && edge.fromColumns.includes(column.name)) ? 'FK' : ''].filter(Boolean).join(', ') || '—'}</TableCell>
          <TableCell className="max-w-xs whitespace-pre-wrap [overflow-wrap:anywhere]"><code>{column.default ?? '—'}</code></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </section>
    <section className="grid min-w-0 gap-5 xl:grid-cols-2" aria-label="All selected relationships">
      <div className="min-w-0 space-y-3"><h3 className="font-semibold">Outgoing relationships</h3><RelationshipList edges={edges.filter(edge => edge.from === table.id)} /></div>
      <div className="min-w-0 space-y-3"><h3 className="font-semibold">Incoming relationships</h3><RelationshipList edges={edges.filter(edge => edge.to === table.id)} /></div>
    </section>
    <section className="space-y-3" aria-label="Constraints">
      <h3 className="font-semibold">Keys, indexes and checks</h3>
      {constraints.map((constraint, index) => <details key={`${constraint.name}-${index}`} className="rounded-lg border p-3 text-sm [overflow-wrap:anywhere]">
        <summary className="cursor-pointer font-mono">{constraint.name}</summary>
        <pre className="mt-2 whitespace-pre-wrap text-muted-foreground">{constraint.detail}</pre>
      </details>)}
      {constraints.length === 0 && <p className="text-sm text-muted-foreground">No additional constraints declared.</p>}
    </section>
  </div>;
}
