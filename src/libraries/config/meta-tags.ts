import type { Metadata } from 'next';
import { InputValidationError, readArray, readBoolean, readChoice, readGuid, readStrictObject, readString } from '@/libraries/utils/input-validation';

export const metaTagNames = [
  'description',
  'author',
  'keywords',
  'robots',
  'og:title',
  'og:description',
  'og:image',
  'og:site_name',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'title',
] as const;
export type MetaTagName = typeof metaTagNames[number];
export interface AppMetaTags {
  version: 1;
  enabled: boolean;
  tags: { name: MetaTagName; content: string }[];
  revision: string | null;
}
export const defaultDescription = 'Create and explore interactive 3D gardens with models, characters, physics, maps, and multimedia.';
export const defaultSocialImage = 'https://threedgarden.com/assets/social/project-workspace.png';
export const defaultSharingTitle = 'ThreeD App | Interactive 2D Plans and 3D Project Presentations';
export function appTitlePrefix(snapshot: AppMetaTags): string {
  return snapshot.enabled ? snapshot.tags.find(tag => tag.name === 'title')?.content.trim() || 'ThreeD Garden' : 'ThreeD Garden';
}
export function defaultMetaTags(): AppMetaTags {
  return {
    version: 1,
    enabled: false,
    tags: [],
    revision: null,
  };
}
export function parseMetaTags(value: unknown): AppMetaTags {
  const input = readStrictObject(value, ['version', 'enabled', 'tags', 'revision']);
  if (input.version !== 1) throw new InputValidationError('Unsupported meta-tag version.');
  const seen = new Set<string>();
  const tags = readArray(input.tags, metaTagNames.length).map(value => {
    const row = readStrictObject(value, ['name', 'content']);
    const name = readChoice(row.name, metaTagNames);
    const content = readString(row.content, 0, 2000, true);
    if (seen.has(name) || /[\u0000-\u001f\u007f]/.test(content)) throw new InputValidationError('Use unique tags and plain text values.');
    seen.add(name);
    if (content && name.endsWith(':image')) {
      let url: URL;
      try { url = new URL(content); } catch { throw new InputValidationError('Images require an absolute HTTPS URL.'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw new InputValidationError('Images require an absolute HTTPS URL.');
    }
    if (content && name === 'robots' && !['index, follow', 'noindex, follow', 'noindex, nofollow'].includes(content)) throw new InputValidationError('Choose a supported robots value.');
    if (content && name === 'twitter:card' && !['summary', 'summary_large_image'].includes(content)) throw new InputValidationError('Choose a supported Twitter card.');
    return { name, content };
  });
  return {
    version: 1,
    enabled: readBoolean(input.enabled),
    tags,
    revision: input.revision === null ? null : readGuid(input.revision),
  };
}

/** App defaults only: route metadata remains authoritative under Next inheritance. */
export function metaTagsMetadata(snapshot: AppMetaTags): Metadata {
  const overrides = metaTagsOverrides(snapshot);
  return {
    description: defaultDescription,
    authors: [{ name: 'ThreeD App' }],
    keywords: '3D garden design, landscape visualization, 2D plans, 3D Models, interactive Projects',
    robots: 'index, follow',
    ...overrides,
    openGraph: {
      type: 'website',
      siteName: 'ThreeD App',
      title: defaultSharingTitle,
      description: overrides.description ?? defaultDescription,
      images: [{
        url: defaultSocialImage,
        alt: 'ThreeD App Project with Character controls, Multimedia and linked 3D Scene and 2D Design views',
      }],
      ...overrides.openGraph,
    },
  };
}

export function readProjectMetaTags(config: unknown): AppMetaTags {
  const source = config && typeof config === 'object' && !Array.isArray(config) ? config as Record<string, unknown> : {};
  return source.metaTags === undefined ? defaultMetaTags() : parseMetaTags(source.metaTags);
}

/** Only configured fields override inherited App metadata. */
export function metaTagsOverrides(snapshot: AppMetaTags): Metadata {
  const metadata: Metadata = {};
  if (!snapshot.enabled) return metadata;
  const populated = snapshot.tags.filter(tag => tag.content.trim().length > 0);
  const tags = Object.fromEntries(populated.map(tag => [tag.name, tag.content]));
  if (tags.description) metadata.description = tags.description;
  if (tags.author) metadata.authors = [{ name: tags.author }];
  if (tags.keywords) metadata.keywords = tags.keywords;
  if (tags.robots) metadata.robots = tags.robots;
  if (populated.some(tag => tag.name.startsWith('og:'))) metadata.openGraph = {
    ...(tags['og:title'] ? { title: tags['og:title'] } : {}),
    ...(tags['og:description'] ? { description: tags['og:description'] } : {}),
    ...(tags['og:image'] ? { images: [tags['og:image']] } : {}),
    ...(tags['og:site_name'] ? { siteName: tags['og:site_name'] } : {}),
  };
  if (populated.some(tag => tag.name.startsWith('twitter:'))) metadata.twitter = {
    ...(tags['twitter:card'] ? { card: tags['twitter:card'] === 'summary_large_image' ? 'summary_large_image' as const : 'summary' as const } : {}),
    ...(tags['twitter:title'] ? { title: tags['twitter:title'] } : {}),
    ...(tags['twitter:description'] ? { description: tags['twitter:description'] } : {}),
    ...(tags['twitter:image'] ? { images: [tags['twitter:image']] } : {}),
  };
  return metadata;
}
