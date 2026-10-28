import { z } from 'zod';

export const moduleColors = {
  brown: 'text-[#a87950]',
  muted: 'text-muted-foreground',
  slate: 'text-slate-500',
  gray: 'text-gray-500',
  zinc: 'text-zinc-500',
  neutral: 'text-neutral-500',
  stone: 'text-stone-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  amber: 'text-amber-500',
  yellow: 'text-yellow-500',
  lime: 'text-lime-500',
  green: 'text-green-500',
  emerald: 'text-emerald-500',
  teal: 'text-teal-500',
  cyan: 'text-cyan-500',
  sky: 'text-sky-500',
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  violet: 'text-violet-500',
  purple: 'text-purple-500',
  fuchsia: 'text-fuchsia-500',
  pink: 'text-pink-500',
  rose: 'text-rose-500',
} as const;


export const moduleIconNames = ["FolderOpen", "Box", "FolderTree", "Image", "Hammer", "Boxes", "Clapperboard", "Building2", "Users", "Sprout", "Cuboid", "Bean", "BookOpen", "FlaskConical", "ClipboardList", "Layers", "ListTodo", "Droplets", "Package", "Bot", "Music", "Music2", "FileText", "Link2", "MicVocal", "Car", "Settings", "Carrot", "Drone", "User", "DiscAlbum", "TrafficCone", "Radio", "Flame", "MapPin", "Camera", "Star", "Folder", "Globe", "Leaf", "Sun", "CloudSun", "AlertTriangle", "Grid3x2", "AlertCircle"] as const;

export const moduleDefinitions = {
  dashboard: {
    label: "Dashboard",
    icon: "Radio",
    color: "muted"
  },
  admin: {
    label: "Admin",
    icon: "Settings",
    color: "muted"
  },
  users: {
    label: "Users",
    icon: "Users",
    color: "blue"
  },
  learn: {
    label: "Learn",
    icon: "BookOpen",
    color: "green"
  },
  projects: {
    label: "Projects",
    icon: "FolderOpen",
    color: "green"
  },
  threed: {
    label: "ThreeD",
    icon: "Box",
    color: "green"
  },
  models: {
    label: "Models",
    icon: "Box",
    color: "blue"
  },
  modelFiles: {
    label: "Model Files",
    icon: "FolderOpen",
    color: "green"
  },
  modelCategories: {
    label: "Model Categories",
    icon: "FolderTree",
    color: "green"
  },
  modelTextures: {
    label: "Textures",
    icon: "Image",
    color: "green"
  },
  modelBuilder: {
    label: "Model Builder",
    icon: "Hammer",
    color: "green"
  },
  assemblyGroups: {
    label: "Assembly Groups",
    icon: "Boxes",
    color: "green"
  },
  animations: {
    label: "Animations",
    icon: "Clapperboard",
    color: "blue"
  },
  animationSlots: {
    label: "Animation Slots",
    icon: "Clapperboard",
    color: "blue"
  },
  animationCategories: {
    label: "Animation Categories",
    icon: "FolderTree",
    color: "blue"
  },
  designs: {
    label: "Designs",
    icon: "Building2",
    color: "green"
  },
  characters: {
    label: "Characters",
    icon: "Users",
    color: "purple"
  },
  plants: {
    label: "Plants",
    icon: "Sprout",
    color: "green"
  },
  beds: {
    label: "Beds",
    icon: "Cuboid",
    color: "amber"
  },
  plantings: {
    label: "Plantings",
    icon: "Bean",
    color: "brown"
  },
  scenarios: {
    label: "Scenarios",
    icon: "BookOpen",
    color: "green"
  },
  simulations: {
    label: "Simulations",
    icon: "FlaskConical",
    color: "green"
  },
  simulationResults: {
    label: "Simulation Results",
    icon: "ClipboardList",
    color: "green"
  },
  layers: {
    label: "Layers",
    icon: "Layers",
    color: "cyan"
  },
  tasks: {
    label: "Tasks",
    icon: "ListTodo",
    color: "muted"
  },
  waterings: {
    label: "Waterings",
    icon: "Droplets",
    color: "blue"
  },
  harvests: {
    label: "Harvests",
    icon: "Package",
    color: "orange"
  },
  farmbots: {
    label: "FarmBots",
    icon: "Bot",
    color: "slate"
  },
  multimedia: {
    label: "Multimedia",
    icon: "Music",
    color: "green"
  },
  albums: {
    label: "Albums",
    icon: "Music",
    color: "blue"
  },
  tracks: {
    label: "Tracks",
    icon: "Music2",
    color: "blue"
  },
  lyrics: {
    label: "Lyrics",
    icon: "FileText",
    color: "blue"
  },
  media: {
    label: "Media",
    icon: "Image",
    color: "blue"
  },
  links: {
    label: "Links",
    icon: "Link2",
    color: "blue"
  },
  speech: {
    label: "Speech",
    icon: "MicVocal",
    color: "blue"
  },
  traffic: {
    label: "Traffic",
    icon: "Car",
    color: "green"
  },
  chpCad: {
    label: "CHP-CAD Incidents",
    icon: "AlertTriangle",
    color: "red"
  },
  chpCases: {
    label: "CHP Cases",
    icon: "FileText",
    color: "blue"
  },
  chpCenters: {
    label: "CHP Centers",
    icon: "Building2",
    color: "blue"
  },
  caltrans: {
    label: "Caltrans Closures",
    icon: "TrafficCone",
    color: "orange"
  },
  caltransDistricts: {
    label: "Caltrans Districts",
    icon: "Grid3x2",
    color: "orange"
  },
  caltransCctv: {
    label: "Caltrans CCTV",
    icon: "Camera",
    color: "blue"
  },
  calfire: {
    label: "CalFire Incidents",
    icon: "Flame",
    color: "orange"
  },
  bayArea511: {
    label: "Bay Area 511",
    icon: "AlertCircle",
    color: "blue"
  }
} as const;

export type ModuleKey = keyof typeof moduleDefinitions;

export const moduleKeys = Object.keys(moduleDefinitions) as ModuleKey[];

// Header surface destinations. Appearance matching does not make Admin/Dashboard
// owners of every nested Module; Learn's public guide pages share its identity.

export const workspaceSurfaces = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    moduleKey: 'dashboard',
    appearanceMatch: 'exact'
  },
  {
    label: 'Admin',
    href: '/admin',
    moduleKey: 'admin',
    appearanceMatch: 'exact'
  },
  {
    label: 'Learn',
    href: '/learn',
    moduleKey: 'learn',
    appearanceMatch: 'subtree'
  },
] as const satisfies ReadonlyArray<{
  label: string;
  href: string;
  moduleKey: ModuleKey;
  appearanceMatch: 'exact' | 'subtree';
}>;

// Module management destinations, separate from public/workspace surfaces.
// Appearance keys and saved icon/color snapshots are unchanged.

export const moduleManagementRoutes: Partial<Record<ModuleKey, string>> = {
  users: '/admin/users',
  learn: '/admin/learn',
  projects: '/admin/projects',
  threed: '/admin/threed',
  models: '/admin/threed/models',
  modelFiles: '/admin/threed/model-files',
  modelCategories: '/admin/threed/model-categories',
  modelTextures: '/admin/threed/model-textures',
  modelBuilder: '/admin/threed/models/builder',
  assemblyGroups: '/admin/threed/assembly-groups',
  animations: '/admin/threed/animations',
  animationSlots: '/admin/threed/animation-slots',
  animationCategories: '/admin/threed/animation-categories',
  designs: '/admin/threed/designs',
  characters: '/admin/threed/characters',
  plants: '/admin/threed/plants',
  beds: '/admin/threed/beds',
  plantings: '/admin/threed/plantings',
  scenarios: '/admin/threed/scenarios',
  simulations: '/admin/threed/simulations',
  simulationResults: '/admin/threed/simulation-results',
  layers: '/admin/threed/layers',
  tasks: '/admin/threed/tasks',
  waterings: '/admin/threed/watering-schedules',
  harvests: '/admin/threed/harvests',
  farmbots: '/admin/threed/farmbots',
  multimedia: '/admin/multimedia',
  albums: '/admin/multimedia/albums',
  tracks: '/admin/multimedia/tracks',
  lyrics: '/admin/multimedia/lyrics',
  media: '/admin/multimedia/media',
  links: '/admin/multimedia/links',
  speech: '/admin/multimedia/speech',
  traffic: '/admin/traffic',
  chpCad: '/admin/traffic/chp-cad',
  chpCases: '/admin/traffic/chp-cases',
  chpCenters: '/admin/traffic/chp-centers',
  caltrans: '/admin/traffic/caltrans',
  caltransDistricts: '/admin/traffic/caltrans-districts',
  caltransCctv: '/admin/traffic/caltrans-cctv',
  calfire: '/admin/traffic/calfire',
  bayArea511: '/admin/traffic/bay-area-511',
};

const colorNames = Object.keys(moduleColors) as [keyof typeof moduleColors, ...Array<keyof typeof moduleColors>];

export const moduleStyleSchema = z.object({
  color: z.enum(colorNames),
  icon: z.enum(moduleIconNames)
}).strict();

export type ModuleStyle = z.infer<typeof moduleStyleSchema>;

export const moduleAppearanceSchema = z.object(Object.fromEntries(moduleKeys.map(key => [key, moduleStyleSchema])) as Record<ModuleKey, typeof moduleStyleSchema>).strict();

export const moduleAppearanceSnapshotSchema = z.object({
  styles: moduleAppearanceSchema,
  revision: z.string().uuid().nullable()
}).strict();

export type ModuleAppearanceSnapshot = z.infer<typeof moduleAppearanceSnapshotSchema>;

export function defaultModuleAppearance(): ModuleAppearanceSnapshot {
  return {
    styles: Object.fromEntries(moduleKeys.map(key => [key, {
      color: moduleDefinitions[key].color,
      icon: moduleDefinitions[key].icon
    }])) as ModuleAppearanceSnapshot['styles'],
    revision: null
  };
}

export function moduleForPath(path: string): ModuleKey | undefined {
  const managementKey = moduleKeys
    .filter(key => moduleManagementRoutes[key] !== undefined)
    .sort((a, b) => moduleManagementRoutes[b]!.length - moduleManagementRoutes[a]!.length)
    .find(key => path === moduleManagementRoutes[key] || path.startsWith(moduleManagementRoutes[key] + '/'));
  if (managementKey) return managementKey;
  return workspaceSurfaces.find(surface => path === surface.href ||
    (surface.appearanceMatch === 'subtree' && path.startsWith(surface.href + '/')))?.moduleKey;
}

// Read only exact historical shapes: 42 before Dashboard/Admin, 41 before Learn,
// and 40 before Users. Writes still require every current identity.

const historicalAppearanceSchemas = [
  moduleAppearanceSchema.omit({
    dashboard: true,
    admin: true
  }),
  moduleAppearanceSchema.omit({
    dashboard: true,
    admin: true,
    learn: true
  }),
  moduleAppearanceSchema.omit({
    dashboard: true,
    admin: true,
    users: true,
    learn: true
  }),
].map(styles => moduleAppearanceSnapshotSchema.extend({
  styles
}));

export function readStoredModuleAppearance(value: unknown): ModuleAppearanceSnapshot {
  for (const schema of historicalAppearanceSchemas) {
    const stored = schema.safeParse(value);
    if (stored.success) return moduleAppearanceSnapshotSchema.parse({
      ...stored.data,
      styles: {
        ...defaultModuleAppearance().styles,
        ...stored.data.styles
      },
    });
  }
  return moduleAppearanceSnapshotSchema.parse(value);
}
