import type snapshot from '../../../../docs/developers/app-data-structure.json';

export type SchemaSnapshot = typeof snapshot;
export type SchemaTable = SchemaSnapshot['tables'][number];
export type SchemaEdge = SchemaSnapshot['edges'][number];

export const relationshipKinds = [
  'foreign-key',
  'application',
  'orm',
] as const;

export type RelationshipKind = typeof relationshipKinds[number];

export const relationshipLabels: Record<RelationshipKind, string> = {
  'foreign-key': 'SQL foreign keys',
  application: 'Application mappings',
  orm: 'ORM declarations',
};

export function tableHref(id: string) {
  return `#table=${encodeURIComponent(id)}`;
}

export function tableFromHash(hash: string, tables: SchemaTable[]) {
  const id = new URLSearchParams(hash.replace(/^#/, '')).get('table');
  return tables.find(table => table.id === id) ?? null;
}

export function filterTables(tables: SchemaTable[], domain: string, search: string) {
  const query = search.trim().toLowerCase();
  return tables.filter(table => (domain === 'all' || table.domain === domain)
    && [table.name, table.exportName, ...table.columns.flatMap(column => [column.name, column.property])]
      .some(value => value.toLowerCase().includes(query)));
}

export function visibleRelationships(edges: SchemaEdge[], id: string, kinds: string[]) {
  return edges.filter(edge => (edge.from === id || edge.to === id) && kinds.includes(edge.kind));
}

export function schemaSourceUrl(sourcePath: string, line: number) {
  // Link to repository source, not a filesystem path relative to the Learn route.
  return `https://github.com/marty-mcgee/threed-garden/blob/main/${sourcePath}#L${line}`;
}
