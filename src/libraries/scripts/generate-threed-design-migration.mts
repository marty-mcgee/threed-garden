// Offline only: import schema definitions, never the database client or dotenv.
import fs from 'node:fs';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import * as imported from '../schema/index';

const schema = ('threedDesigns' in imported ? imported : (imported as unknown as { default: Record<string, unknown> }).default);
if (!schema?.threedDesigns) throw new Error('Designs schema export was not loaded.');

// Limit this review delta to the new table and its two existing FK targets.
const before = { user: schema.user, project: schema.project };
const after = { ...before, threedDesigns: schema.threedDesigns };
const statements = await generateMigration(generateDrizzleJson(before), generateDrizzleJson(after));
if (!statements.length || statements.some(statement => !statement.includes('threed_designs'))) throw new Error('Expected a Designs-only additive migration: ' + JSON.stringify(statements.map(statement => statement.slice(0, 170))));
const sql = `-- Offline Drizzle-generated Designs delta. Review before applying; never executed by this script.\nBEGIN;\n${statements.join('\n--> statement-breakpoint\n')}\nCOMMIT;\n`;
fs.writeFileSync('docs/releases/sql/v0.24.0-alpha-threed-designs.sql', sql);
console.log('Prepared docs/releases/sql/v0.24.0-alpha-threed-designs.sql (offline; not applied).');
