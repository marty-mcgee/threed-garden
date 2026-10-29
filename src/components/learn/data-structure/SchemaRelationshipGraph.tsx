import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { tableHref, type SchemaEdge, type SchemaTable } from './schema-explorer';

type Props = {
  table: SchemaTable;
  tables: SchemaTable[];
  edges: SchemaEdge[];
};

const edgeStyles: Record<string, { color: string; dash?: string }> = {
  'foreign-key': {
    color: 'var(--color-blue-500, #3b82f6)',
  },
  application: {
    color: 'var(--color-amber-600, #d97706)',
    dash: '7 5',
  },
  orm: {
    color: 'var(--color-purple-500, #a855f7)',
    dash: '2 5',
  },
};

export function SchemaRelationshipGraph({ table, tables, edges }: Props) {
  const markerId = useId().replaceAll(':', '');
  const [page, setPage] = useState(0);
  const incoming = [...new Set(edges.filter(edge => edge.to === table.id && edge.from !== table.id).map(edge => edge.from))];
  const outgoing = [...new Set(edges.filter(edge => edge.from === table.id && edge.to !== table.id).map(edge => edge.to))];
  const pageCount = Math.max(1, Math.ceil(Math.max(incoming.length, outgoing.length) / 5));
  const currentPage = Math.min(page, pageCount - 1);
  const left = incoming.slice(currentPage * 5, currentPage * 5 + 5);
  const right = outgoing.slice(currentPage * 5, currentPage * 5 + 5);
  const height = Math.max(290, Math.max(left.length, right.length) * 85 + 70);
  const centerY = height / 2;
  const selfEdges = edges.filter(edge => edge.from === table.id && edge.to === table.id);
  const node = (id: string, x: number, y: number, selected = false) => {
    const target = tables.find(item => item.id === id);
    const words = id.match(/.{1,29}/g) ?? [id];
    return <a key={id} href={tableHref(id)} aria-label={`Explore ${id}`} className="outline-none [&:focus_rect]:stroke-foreground [&:hover_rect]:stroke-foreground">
      <title>{id}</title>
      <rect x={x} y={y - 28} width={260} height={64} rx={8} className={selected ? 'fill-accent stroke-primary' : 'fill-background stroke-border'} strokeWidth={2} />
      <text x={x + 12} y={y - 7} className="fill-foreground font-mono text-[11px]">
        {words.map((word, index) => <tspan key={index} x={x + 12} dy={index ? 14 : 0}>{word}</tspan>)}
      </text>
      <text x={x + 12} y={y + 26} className="fill-muted-foreground text-[10px]">{target?.domain} · {target?.columns.length} columns</text>
    </a>;
  };

  return <section aria-label="Relationship diagram" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">{incoming.length} incoming · {outgoing.length} outgoing neighbors · {selfEdges.length} self-references</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous neighbors</Button>
        <span aria-live="polite">{currentPage + 1} / {pageCount}</span>
        <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next neighbors</Button>
      </div>
    </div>
    <div className="overflow-x-auto rounded-lg border" tabIndex={0} aria-label="Scrollable relationship diagram">
      <svg viewBox={`0 0 1000 ${height}`} className="block min-w-[760px] w-full" role="group" aria-label={`Relationships for ${table.name}`}>
        <defs>{Object.entries(edgeStyles).map(([kind, style]) => <marker key={kind} id={`${markerId}-${kind}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={style.color} /></marker>)}</defs>
        <text x={20} y={24} className="fill-muted-foreground text-[12px]">Referencing tables</text>
        <text x={370} y={24} className="fill-muted-foreground text-[12px]">Selected table</text>
        <text x={720} y={24} className="fill-muted-foreground text-[12px]">Referenced tables</text>
        {[left, right].map((side, sideIndex) => side.map((id, index) => {
          const y = 70 + index * 85;
          const connections = edges.filter(edge => sideIndex === 0 ? edge.from === id && edge.to === table.id : edge.from === table.id && edge.to === id);
          return <g key={`${sideIndex}-${id}`}>
            {connections.map((edge, edgeIndex) => {
              const offset = (edgeIndex - (connections.length - 1) / 2) * 5;
              const style = edgeStyles[edge.kind];
              const d = sideIndex === 0
                ? `M 280 ${y + offset} C 325 ${y + offset}, 325 ${centerY + offset}, 370 ${centerY + offset}`
                : `M 630 ${centerY + offset} C 675 ${centerY + offset}, 675 ${y + offset}, 720 ${y + offset}`;
              return <path key={edge.id} d={d} fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth={1.5} markerEnd={`url(#${markerId}-${edge.kind})`}><title>{edge.label}{edge.status !== 'declared' ? ` (${edge.status})` : ''}</title></path>;
            })}
            {node(id, sideIndex === 0 ? 20 : 720, y)}
          </g>;
        }))}
        {Object.entries(edgeStyles).map(([kind, style], index) => {
          const count = selfEdges.filter(edge => edge.kind === kind).length;
          if (!count) return null;
          const y = centerY - 52 - index * 20;
          return <path key={kind} d={`M 430 ${centerY - 28} C 390 ${y}, 610 ${y}, 570 ${centerY - 28}`} fill="none" stroke={style.color} strokeDasharray={style.dash} markerEnd={`url(#${markerId}-${kind})`}><title>{count} {kind} self-references; see the relationship list below.</title></path>;
        })}
        {node(table.id, 370, centerY, true)}
      </svg>
    </div>
    <p className="text-sm text-muted-foreground">Arrows point to the referenced table. Solid: SQL foreign key. Dashed: application mapping. Dotted: ORM declaration. All connections are listed below.</p>
  </section>;
}
