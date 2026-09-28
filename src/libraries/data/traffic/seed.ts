import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, inArray } from 'drizzle-orm';

const DEFAULT_FILE = 'src/libraries/data/traffic/seed-data.json';

type ImportModule = {
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  projectIds: number[];
};

type Options = { commit: boolean; filePath: string; userId: string };

function option(args: string[], name: string): string | undefined {
  const inline = args.find(arg => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function options(args: string[]): Options {
  const userId = option(args, '--user-id')?.trim();
  if (!userId) throw new Error('Missing required --user-id <id> argument.');
  return {
    commit: args.includes('--commit'),
    filePath: path.resolve(process.cwd(), option(args, '--file') || DEFAULT_FILE),
    userId,
  };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (!object(value)) throw new Error(`${field} must be an object.`);
  return value;
}

function plan(input: unknown): ImportModule[] {
  if (!object(input) || input.version !== 1 || !Array.isArray(input.modules)) {
    throw new Error('Import JSON must have version 1 and a modules array.');
  }
  const slugs = new Set<string>();
  return input.modules.map((item, index) => {
    const label = `modules[${index}]`;
    if (!object(item)) throw new Error(`${label} must be an object.`);
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120) {
      throw new Error(`${label}.name must be 1–120 characters.`);
    }
    if (typeof item.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || item.slug.length > 120) {
      throw new Error(`${label}.slug must be a lowercase, hyphenated slug of at most 120 characters.`);
    }
    if (slugs.has(item.slug)) throw new Error(`${label}.slug is duplicated in the JSON.`);
    slugs.add(item.slug);
    if (item.description !== undefined && item.description !== null &&
        (typeof item.description !== 'string' || item.description.length > 2000)) {
      throw new Error(`${label}.description must be a string of at most 2,000 characters or null.`);
    }
    if (item.isActive !== undefined && typeof item.isActive !== 'boolean') {
      throw new Error(`${label}.isActive must be a boolean.`);
    }
    if (item.isPublic !== undefined && typeof item.isPublic !== 'boolean') {
      throw new Error(`${label}.isPublic must be a boolean.`);
    }
    if (item.projectIds !== undefined && !Array.isArray(item.projectIds)) {
      throw new Error(`${label}.projectIds must be an array.`);
    }
    const projectIds = item.projectIds === undefined ? [] : item.projectIds;
    if (projectIds.some(id => !Number.isSafeInteger(id) || id <= 0) ||
        new Set(projectIds).size !== projectIds.length) {
      throw new Error(`${label}.projectIds must contain unique positive integer IDs.`);
    }
    return {
      name: item.name.trim(),
      slug: item.slug,
      description: item.description === undefined ? null : item.description as string | null,
      isActive: item.isActive === undefined ? true : item.isActive as boolean,
      isPublic: item.isPublic === undefined ? false : item.isPublic as boolean,
      config: jsonObject(item.config, `${label}.config`),
      metadata: jsonObject(item.metadata, `${label}.metadata`),
      projectIds,
    };
  });
}

async function commitImport(modules: ImportModule[], userId: string) {
  const { config } = await import('dotenv');
  config({ path: '.env.local', quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is unavailable.');
  const [{ db }, { traffic, project, projectTraffic, user }] = await Promise.all([
    import('@/libraries/db/client'),
    import('@/libraries/schema'),
  ]);
  return db.transaction(async tx => {
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
    if (!owner) throw new Error('Target user does not exist.');
    const projectIds = [...new Set(modules.flatMap(module => module.projectIds))];
    if (projectIds.length) {
      const ownedProjects = await tx.select({ id: project.id }).from(project)
        .where(and(inArray(project.id, projectIds), eq(project.userId, userId)));
      if (ownedProjects.length !== projectIds.length) {
        throw new Error('Every requested Project must exist and belong to the target user.');
      }
    }
    let modulesCreated = 0;
    let modulesPreserved = 0;
    let assignmentsCreated = 0;
    let assignmentsPreserved = 0;
    for (const module of modules) {
      const [created] = await tx.insert(traffic).values({
        userId, name: module.name, slug: module.slug, description: module.description,
        isActive: module.isActive, isPublic: module.isPublic,
        config: module.config, metadata: module.metadata,
      }).onConflictDoNothing({ target: traffic.slug }).returning({ id: traffic.id });
      const [saved] = await tx.select({ id: traffic.id, userId: traffic.userId })
        .from(traffic).where(eq(traffic.slug, module.slug)).limit(1);
      if (!saved || saved.userId !== userId) {
        throw new Error(`Traffic slug ${module.slug} is unavailable to the target user.`);
      }
      if (created) modulesCreated += 1;
      else modulesPreserved += 1;
      for (const projectId of module.projectIds) {
        const [linked] = await tx.insert(projectTraffic).values({
          userId, projectId, trafficId: saved.id,
        }).onConflictDoNothing({ target: [projectTraffic.projectId, projectTraffic.trafficId] })
          .returning({ id: projectTraffic.id });
        if (linked) {
          assignmentsCreated += 1;
        } else {
          const [existing] = await tx.select({ userId: projectTraffic.userId })
            .from(projectTraffic)
            .where(and(eq(projectTraffic.projectId, projectId), eq(projectTraffic.trafficId, saved.id)))
            .limit(1);
          if (!existing || existing.userId !== userId) {
            throw new Error(`Project ${projectId} has an owner-mismatched Traffic assignment.`);
          }
          assignmentsPreserved += 1;
        }
      }
    }
    return { modulesCreated, modulesPreserved, assignmentsCreated, assignmentsPreserved };
  });
}

async function main() {
  const args = options(process.argv.slice(2));
  const modules = plan(JSON.parse(await readFile(args.filePath, 'utf8')) as unknown);
  console.log(`Traffic import file: ${args.filePath}`);
  console.log(`Target user: ${args.userId}`);
  console.log(`Validated modules: ${modules.length}`);
  console.log(`Requested Project assignments: ${modules.reduce((count, module) => count + module.projectIds.length, 0)}`);
  if (!args.commit) {
    console.log('Dry run complete. No database connection was opened and no records were written.');
    return;
  }
  const result = await commitImport(modules, args.userId);
  console.log(`Modules created: ${result.modulesCreated}; preserved: ${result.modulesPreserved}`);
  console.log(`Project assignments created: ${result.assignmentsCreated}; preserved: ${result.assignmentsPreserved}`);
  console.log('Traffic import committed successfully.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Traffic import failed.');
  process.exitCode = 1;
});
