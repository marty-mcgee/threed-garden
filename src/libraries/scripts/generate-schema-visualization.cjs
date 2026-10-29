// Offline schema documentation. Only schema modules and Drizzle may be loaded.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');

const root = path.resolve(__dirname, '../../..');
const schemaRoot = path.join(root, 'src/libraries/schema');
const docsRoot = path.join(root, 'docs/developers');
const checkOnly = process.argv.includes('--check');
const dataPath = path.join(docsRoot, 'app-data-structure.json');
const existingSnapshot = checkOnly && fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : null;
const dateArgument = process.argv.find(argument => argument.startsWith('--date='));
const generatedAt = dateArgument?.slice(7)
  ?? (existingSnapshot?.generatedAt ?? new Date().toISOString().slice(0, 10));
assert.match(generatedAt, /^\d{4}-\d{2}-\d{2}$/);
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const sourceLink = file => `../../${relative(file)}`;
const cache = new Map();
const sources = new Map();
const declarations = new Map();
const dialect = new pg.PgDialect();

function source(file) {
  const text = fs.readFileSync(file, 'utf8');
  sources.set(relative(file), crypto.createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex'));
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}

function loadSchema(file) {
  file = path.resolve(file);
  assert(file.startsWith(`${schemaRoot}${path.sep}`), 'Only schema files may execute');
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const parsed = source(file);
  for (const statement of parsed.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const call = declaration.initializer;
      if (!call || !ts.isCallExpression(call) || !ts.isIdentifier(call.expression)) continue;
      if (!['pgTable', 'pgEnum'].includes(call.expression.text)) continue;
      declarations.set(declaration.name.getText(parsed), {
        file,
        line: parsed.getLineAndCharacterOfPosition(declaration.getStart(parsed)).line + 1,
        kind: call.expression.text,
      });
    }
  }
  const compiled = ts.transpileModule(parsed.text, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(specifier) {
      if (specifier === 'drizzle-orm') return orm;
      if (specifier === 'drizzle-orm/pg-core') return pg;
      const candidate = specifier.startsWith('@/libraries/schema/')
        ? path.join(root, 'src', specifier.slice(2))
        : specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : null;
      assert(candidate, `Blocked non-schema dependency: ${specifier}`);
      const resolved = [`${candidate}.ts`, path.join(candidate, 'index.ts')].find(value => fs.existsSync(value));
      assert(resolved, `Unresolved schema import: ${specifier}`);
      return loadSchema(resolved);
    },
  }, {
    filename: file,
    timeout: 10000,
  });
  return exports;
}

const schema = loadSchema(path.join(schemaRoot, 'index.ts'));
const domains = [
  {
    id: 'threed',
    label: 'ThreeD',
    kind: 'top',
    color: '#4ade80',
    rootTable: 'threed',
    description: 'Models, Characters, Plants, Scenes, Actions and Simulations.',
  },
  {
    id: 'multimedia',
    label: 'Multimedia',
    kind: 'top',
    color: '#60a5fa',
    rootTable: 'multimedia',
    description: 'Albums, Tracks, Media, Links, Lyrics and Speech.',
  },
  {
    id: 'traffic',
    label: 'Traffic',
    kind: 'top',
    color: '#fb923c',
    rootTable: 'traffic',
    description: 'Incidents, closures, cameras and traffic data.',
  },
  {
    id: 'learn',
    label: 'Learn',
    kind: 'top',
    color: '#c084fc',
    rootTable: null,
    description: 'Shared App guides; existing persistence is learn_guides.',
  },
  {
    id: 'project',
    label: 'Projects',
    kind: 'shared',
    color: '#2dd4bf',
    rootTable: 'project',
    description: 'Project membership, Module assignments, assets and saved placements.',
  },
  {
    id: 'auth',
    label: 'Accounts',
    kind: 'shared',
    color: '#facc15',
    rootTable: 'user',
    description: 'Users, authentication, sessions and role audit.',
  },
  {
    id: 'settings',
    label: 'Settings',
    kind: 'shared',
    color: '#94a3b8',
    rootTable: 'settings',
    description: 'App settings, overrides, deployment records and audit.',
  },
];

function sqlText(value) {
  if (value === undefined) return null;
  if (orm.is(value, orm.SQL)) {
    const query = dialect.sqlToQuery(value);
    return query.sql + (query.params.length ? ` | parameters: ${JSON.stringify(query.params)}` : '');
  }
  return JSON.stringify(value);
}

function configFor(table) {
  return pg.getTableConfig(table);
}

const tableEntries = Object.entries(schema).filter(([key, value]) => declarations.get(key)?.kind === 'pgTable' && orm.is(value, pg.PgTable));
assert.equal(new Set(tableEntries.map(([, value]) => value)).size, tableEntries.length, 'Table aliases are deduplicated');
assert.equal(tableEntries.length, [...declarations.values()].filter(value => value.kind === 'pgTable').length, 'Every table declaration is exported');
const edges = [];
const tables = tableEntries.map(([exportName, table]) => {
  const location = declarations.get(exportName);
  const config = configFor(table);
  const primaryKey = [...config.columns.filter(column => column.primary).map(column => column.name), ...config.primaryKeys.flatMap(key => key.columns.map(column => column.name))];
  const uniqueConstraints = config.uniqueConstraints.map(key => ({
    name: key.name,
    columns: key.columns.map(column => column.name),
  }));
  for (const column of config.columns.filter(column => column.isUnique)) {
    uniqueConstraints.push({
      name: column.uniqueName,
      columns: [column.name],
    });
  }
  for (const key of config.foreignKeys) {
    const reference = key.reference();
    edges.push({
      id: `fk:${config.name}:${key.getName()}`,
      from: config.name,
      fromColumns: reference.columns.map(column => column.name),
      to: orm.getTableName(reference.foreignTable),
      toColumns: reference.foreignColumns.map(column => column.name),
      kind: 'foreign-key',
      label: key.getName(),
      onDelete: key.onDelete || 'no action',
      onUpdate: key.onUpdate || 'no action',
      status: 'declared',
    });
  }
  return {
    id: config.name,
    name: config.name,
    exportName,
    domain: path.relative(schemaRoot, location.file).split(path.sep)[0],
    source: sourceLink(location.file),
    sourcePath: relative(location.file),
    line: location.line,
    columns: Object.entries(orm.getTableColumns(table)).map(([property, column]) => ({
      name: column.name,
      property,
      type: column.getSQLType(),
      notNull: column.notNull,
      primaryKey: primaryKey.includes(column.name),
      unique: Boolean(column.isUnique),
      hasDefault: column.hasDefault,
      default: column.default !== undefined ? sqlText(column.default) : column.defaultFn ? 'Application default function (not executed)' : column.hasDefault ? 'Implicit generated value' : null,
      enumValues: column.enumValues,
    })),
    indexes: config.indexes.map(index => ({
      name: index.config.name,
      columns: index.config.columns.map(column => column.name ?? sqlText(column)),
      unique: index.config.unique,
      where: sqlText(index.config.where),
    })),
    checks: config.checks.map(check => ({
      name: check.name,
      expression: sqlText(check.value),
    })),
    uniqueConstraints,
    primaryKey: [...new Set(primaryKey)],
    notes: [],
  };
}).sort((left, right) => left.name.localeCompare(right.name));

const tableByName = new Map(tables.map(table => [table.id, table]));
for (const value of new Set(Object.values(schema))) {
  if (!orm.is(value, orm.Relations)) continue;
  for (const [name, relation] of Object.entries(value.config(orm.createTableRelationsHelpers(value.table)))) {
    const from = orm.getTableName(value.table);
    edges.push({
      id: `orm:${from}:${name}`,
      from,
      fromColumns: relation.config?.fields?.map(column => column.name) ?? [],
      to: orm.getTableName(relation.referencedTable),
      toColumns: relation.config?.references?.map(column => column.name) ?? [],
      kind: 'orm',
      label: `${name} (${orm.is(relation, orm.Many) ? 'many' : 'one'})`,
      note: 'Drizzle navigation declaration; not an additional database foreign key or proof that an inferred join works.',
      status: 'declared',
    });
  }
}

function literalRegistry(file, variable) {
  const parsed = source(path.join(root, file));
  for (const statement of parsed.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(parsed) !== variable) continue;
      let value = declaration.initializer;
      while (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression;
      assert(ts.isObjectLiteralExpression(value), `${variable} must be an explicit registry`);
      return value.properties.map(property => {
        assert(ts.isPropertyAssignment(property), 'Registry must use explicit properties');
        const key = ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(parsed);
        return [key, property.initializer, parsed];
      });
    }
  }
  throw new Error(`Missing registry ${variable}`);
}

function applicationEdge(from, column, to, condition, note, pending = false) {
  edges.push({
    id: `application:${from}:${column}:${to}`,
    from,
    fromColumns: [column],
    to,
    toColumns: ['id'],
    kind: 'application',
    label: condition,
    condition,
    note,
    status: pending ? 'pending' : 'declared',
  });
}

for (const domain of ['threed', 'multimedia', 'traffic']) {
  applicationEdge('project_assets', 'module_id', domain, `module_type = '${domain}'`, 'Application validates the active Project-to-Module assignment; module_id has no polymorphic database FK.');
}
for (const [assetType, definition, parsed] of literalRegistry('src/libraries/project-assets/asset-registry.ts', 'ASSIGNABLE_ASSET_REGISTRY')) {
  assert(ts.isObjectLiteralExpression(definition));
  const property = definition.properties.find(item => item.name?.getText(parsed) === 'table');
  const moduleProperty = definition.properties.find(item => item.name?.getText(parsed) === 'moduleType');
  const policyProperty = definition.properties.find(item => item.name?.getText(parsed) === 'policy');
  assert(property && ts.isPropertyAssignment(property));
  assert(moduleProperty && ts.isPropertyAssignment(moduleProperty) && ts.isStringLiteral(moduleProperty.initializer));
  assert(policyProperty && ts.isPropertyAssignment(policyProperty) && ts.isStringLiteral(policyProperty.initializer));
  const table = schema[property.initializer.getText(parsed)];
  assert(orm.is(table, pg.PgTable));
  applicationEdge('project_assets', 'asset_id', orm.getTableName(table), `module_type = '${moduleProperty.initializer.text}' AND asset_type = '${assetType}'`, policyProperty.initializer.text === 'ownerOnly'
    ? 'No asset FK. Assignment requires an owned record and an active matching Project/Module assignment.'
    : 'No asset FK. Assignment permits an owned record or one that is both active and public, within an active matching Project/Module assignment.');
}
const markerTargets = Object.fromEntries(literalRegistry('src/app/api/project/threed-markers/route.ts', 'PROJECT_ASSET_TYPE_BY_MARKER').map(([kind, definition]) => {
  assert(ts.isStringLiteral(definition));
  return [kind, definition.text];
}));
assert.deepEqual(Object.keys(markerTargets).sort(), [...schema.projectThreeDMarkerTypeEnum.enumValues].sort(), 'Every declared marker kind has an explicit source mapping');
for (const [kind, table] of Object.entries(markerTargets)) {
  applicationEdge('project_threed_markers', 'source_asset_id', table, `marker_type = '${kind}'`, 'Project placement points to a reusable source record. marker_id identifies the individual Scene instance.');
}
for (const [kind, definition] of literalRegistry('src/libraries/services/threed/multimedia/album-entity-registry.ts', 'albumEntityTables')) {
  assert(ts.isStringLiteral(definition));
  applicationEdge('threed_multimedia_albums', 'entity_id', definition.text, `module_type = '${kind}'`, kind === 'assembly'
    ? 'UUID-aware source implementation. The entity identity SQL follow-up is prepared for manual review and is not confirmed applied.'
    : 'Sub-module discriminator in the current Album registry. Text stores canonical numeric identities; this column does not identify a Top Module instance.', kind === 'assembly');
}

const addNote = (name, note) => tableByName.get(name).notes.push(note);
addNote('threed_multimedia_albums', 'Original SQL application was Developer-confirmed. Source now uses text entity IDs for numeric and Assembly UUID identities; the follow-up identity SQL is prepared, not confirmed applied. The disputed Learn mapping has been removed from current application paths.');
addNote('learn_guides', 'Shared App content managed by Super Admins. Creator/editor references are attribution, not personal ownership. No separate learn root table or project_learn table is declared.');
addNote('project_assets', 'Project assignment: module_type + module_id identify the Module; asset_type + asset_id identify its content. These polymorphic references are application-validated.');
addNote('project_threed_markers', 'Saved Scene placements preserve marker_id separately from source_asset_id.');
addNote('user_role_audit', 'Actor and target IDs intentionally have no database foreign keys, retaining historical identities.');
addNote('threed_designs', 'Derived Design records; project.config.threeDArchitecture remains the Project Save authority.');
addNote('threed', 'Both project_id and the project_threed junction exist in the declarations; the visualization preserves both facts.');
for (const name of ['threed_mqtt_runtime', 'threed_mqtt_events']) addNote(name, 'integration_type + integration_id is an application integration identity with no polymorphic FK. Not expanded here into inferred domain links.');

const enums = Object.entries(schema).filter(([key]) => declarations.get(key)?.kind === 'pgEnum').map(([key, value]) => {
  const location = declarations.get(key);
  return {
    name: value.enumName,
    values: [...value.enumValues],
    domain: path.relative(schemaRoot, location.file).split(path.sep)[0],
    source: sourceLink(location.file),
    line: location.line,
  };
}).sort((left, right) => left.name.localeCompare(right.name));
assert.equal(enums.length, [...declarations.values()].filter(value => value.kind === 'pgEnum').length);

for (const edge of edges) {
  assert(tableByName.has(edge.from) && tableByName.has(edge.to), `Missing table for ${edge.id}`);
  for (const [table, columns] of [[edge.from, edge.fromColumns], [edge.to, edge.toColumns]]) {
    for (const column of columns) assert(tableByName.get(table).columns.some(item => item.name === column), `Missing ${table}.${column}`);
  }
  if (edge.kind === 'application') {
    const fromType = tableByName.get(edge.from).columns.find(column => column.name === edge.fromColumns[0]).type;
    const toType = tableByName.get(edge.to).columns.find(column => column.name === edge.toColumns[0]).type;
    if (/^(?:integer|smallint|bigint|serial|bigserial)$/.test(fromType) && /^(?:text|uuid|varchar)/.test(toType)) {
      edge.status = 'incompatible';
      edge.note = `Incompatible identifiers in the current mapping: ${edge.from}.${edge.fromColumns[0]} is ${fromType}, but ${edge.to}.${edge.toColumns[0]} is ${toType}. This is not a working assignment path. ${edge.note}`;
      addNote(edge.from, edge.note);
      addNote(edge.to, edge.note);
    }
  }
}
assert.equal(new Set(edges.map(edge => edge.id)).size, edges.length);
const summary = {
  tables: tables.length,
  columns: tables.reduce((count, table) => count + table.columns.length, 0),
  foreignKeys: edges.filter(edge => edge.kind === 'foreign-key').length,
  enums: enums.length,
  ormRelations: edges.filter(edge => edge.kind === 'orm').length,
  applicationLinks: edges.filter(edge => edge.kind === 'application').length,
};
const data = {
  generatedAt,
  // Provenance describes generation time. New commits/CI checkouts alone do not
  // stale the schemas; source hashes and generated content establish freshness.
  branch: existingSnapshot?.branch ?? execFileSync('git', ['branch', '--show-current'], {
    cwd: root,
    encoding: 'utf8',
  }).trim(),
  head: existingSnapshot?.head ?? execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim(),
  version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version,
  summary,
  domains,
  tables,
  edges,
  enums,
  sourceHashes: Object.fromEntries([...sources.entries()].sort(([left], [right]) => left.localeCompare(right))),
  notes: [
    'Current working-tree Drizzle declarations, including unreleased changes. This is not a live database inventory or a proposal for a new architecture.',
    'Exactly four Top Modules: ThreeD, Multimedia, Traffic and Learn. Projects, Accounts and Settings are shared foundations.',
    'Solid arrows are declared database foreign keys, from referencing table to referenced table. Optional dashed links represent reviewed application mappings; ORM declarations are a separate optional layer.',
    'All declared tables, columns, enums, indexes, checks, primary and unique keys are included. JSON/JSONB columns remain opaque; this is not an inventory of every nested runtime object.',
    'Application links are the reviewed Project Assets, saved-marker and Album registries, not an exhaustive inference from every ID-shaped column. ORM declarations do not guarantee a valid inferred join.',
    'The unaccepted Learn-to-Guide Album path is absent from current registries. Assembly UUID support is pending application of the prepared identity SQL; the diagram does not certify live migration state.',
  ],
};

const templatePath = path.join(docsRoot, 'app-data-structure.template.html');
const template = fs.readFileSync(templatePath, 'utf8');
assert.equal(template.split('__SCHEMA_JSON__').length, 2, 'Exactly one schema data placeholder');
// SQL expressions can contain replacement tokens such as $'. Insert them literally.
const html = template.replace('__SCHEMA_JSON__', () => JSON.stringify(data).replaceAll('<', '\\u003c'));
const embeddedData = html.match(/<script type="application\/json" id="schema-data">([\s\S]*?)<\/script>/);
assert.ok(embeddedData, 'Embedded schema data must remain a complete JSON script');
assert.ok(JSON.stringify(JSON.parse(embeddedData[1])) === JSON.stringify(data), 'HTML must preserve the complete schema snapshot');
const domainRows = domains.map(domain => {
  const items = tables.filter(table => table.domain === domain.id);
  return `| ${domain.label}${domain.kind === 'shared' ? ' (shared)' : ''} | ${items.length} | ${items.reduce((sum, table) => sum + table.columns.length, 0)} | ${edges.filter(edge => edge.kind === 'foreign-key' && tableByName.get(edge.from).domain === domain.id).length} |`;
});
const inventory = domains.map(domain => `### ${domain.label}\n\n| Table | Columns | Outgoing FKs |\n| --- | ---: | ---: |\n${tables.filter(table => table.domain === domain.id).map(table => `| [\`${table.name}\`](${table.source}) | ${table.columns.length} | ${edges.filter(edge => edge.kind === 'foreign-key' && edge.from === table.name).length} |`).join('\n')}`).join('\n\n');
const markdown = `# ThreeD App data structure\n\n[Open the interactive schema explorer](app-data-structure.html) · [Structured schema snapshot](app-data-structure.json) · [Established App architecture](../plans/app-module-architecture.md)\n\nSnapshot: ${generatedAt}, App ${data.version}, ${data.branch} / ${data.head.slice(0, 8)} plus working-tree changes. Generated from the actual local Drizzle declarations, without a database connection. This visualizes the existing structure; it does not introduce a new architecture.\n\n## Explore the structure\n\nOpen the HTML file directly in a browser; it needs no server, network or CDN. Select a Top Module or shared foundation, search a table or column, and choose a table to inspect its fields, constraints and incoming/outgoing relationships. Solid arrows indicate declared foreign keys. Application mappings and ORM declarations are separate optional layers. The Assembly identity migration is explicitly marked as pending.\n\n## Coverage\n\n| Domain | Tables | Columns | Foreign keys |\n| --- | ---: | ---: | ---: |\n${domainRows.join('\n')}\n| **Total** | **${summary.tables}** | **${summary.columns}** | **${summary.foreignKeys}** |\n\nAlso includes **${summary.enums} enums**, **${summary.ormRelations} ORM relation declarations** and **${summary.applicationLinks} reviewed application mappings**. Counts describe source declarations, not verified live database objects. Auth aliases are deduplicated. Composite foreign keys remain single relationships with all participating columns. JSON/JSONB columns are shown without inventing their nested structures.\n\n## Project and Module relationships\n\nThe following overview shows actual foreign keys. A Project can have multiple junction rows; each row identifies one Project and one Module instance. Content assignments are separately stored in project_assets. Learn is a peer Top Module with current content in learn_guides; no nonexistent Learn root or Project junction is drawn.\n\n\`\`\`mermaid\nflowchart LR\n  PT[project_threed] --> P[project]\n  PT --> T[threed]\n  PM[project_multimedia] --> P\n  PM --> M[multimedia]\n  PF[project_traffic] --> P\n  PF --> F[traffic]\n  PA[project_assets] --> P\n  R[project_threed_markers] --> P\n  R --> T\n  T --> P\n\`\`\`\n\nThe interactive explorer expands polymorphic asset/Module links using the actual application registries. It does not infer extra links from names or enum entries. The source threed_multimedia_albums entity ID is now text, with kind-specific numeric/UUID checks. Its identity migration is prepared for manual review and is not confirmed applied. Learn-to-Guide Album associations are absent from the current registry; the old Learn SQL remains on hold.\n\n## Complete table inventory\n\n${inventory}\n\n## Refresh and verification\n\nRun from the workspace root using the declared Node installation:\n\n\`\`\`powershell\nnode src/libraries/scripts/generate-schema-visualization.cjs\nnode src/libraries/scripts/generate-schema-visualization.cjs --check\n\`\`\`\n\nThe generator loads only schema files and Drizzle through a dependency allowlist; it does not load environment files, a database client or service modules. It checks complete table/enum export coverage, deduplicated identities and every relationship endpoint. --check verifies generated files against the current source without writing them. SQL application, browser acceptance and production evidence remain separate in the [release record](../releases/v0.30.0.md).\n`;
for (const [name, content] of [
  ['app-data-structure.json', `${JSON.stringify(data, null, 2)}\n`],
  ['app-data-structure.html', html],
  ['APP_DATA_STRUCTURE.md', markdown],
]) {
  const file = path.join(docsRoot, name);
  if (checkOnly) assert.ok(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n') === content.replaceAll('\r\n', '\n'), `${name} is stale; run npm run schema:generate`);
  else fs.writeFileSync(file, content);
}
console.log(`${checkOnly ? 'PASS' : 'GENERATED'}: ${summary.tables} tables, ${summary.columns} columns, ${summary.foreignKeys} FKs, ${summary.enums} enums, ${summary.ormRelations} ORM declarations, ${summary.applicationLinks} reviewed application mappings. No database access.`);
