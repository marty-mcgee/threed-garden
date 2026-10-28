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


export const moduleIconNames = ["FolderOpen","Box","FolderTree","Image","Hammer","Boxes","Clapperboard","Building2","Users","Sprout","Cuboid","Bean","BookOpen","FlaskConical","ClipboardList","Layers","ListTodo","Droplets","Package","Bot","Music","Music2","FileText","Link2","MicVocal","Car","Settings","Carrot","Drone","User","DiscAlbum","TrafficCone","Radio","Flame","MapPin","Camera","Star","Folder","Globe","Leaf","Sun","CloudSun","AlertTriangle","Grid3x2","AlertCircle"] as const;
export const moduleDefinitions = {
"chpCad":{"label":"CHP-CAD Incidents","icon":"AlertTriangle","color":"red","route":"/admin/traffic/chp-cad"},
"chpCases":{"label":"CHP Cases","icon":"FileText","color":"blue","route":"/admin/traffic/chp-cases"},
"chpCenters":{"label":"CHP Centers","icon":"Building2","color":"blue","route":"/admin/traffic/chp-centers"},
"caltrans":{"label":"Caltrans Closures","icon":"TrafficCone","color":"orange","route":"/admin/traffic/caltrans"},
"caltransDistricts":{"label":"Caltrans Districts","icon":"Grid3x2","color":"orange","route":"/admin/traffic/caltrans-districts"},
"caltransCctv":{"label":"Caltrans CCTV","icon":"Camera","color":"blue","route":"/admin/traffic/caltrans-cctv"},
"calfire":{"label":"CalFire Incidents","icon":"Flame","color":"orange","route":"/admin/traffic/calfire"},
"bayArea511":{"label":"Bay Area 511","icon":"AlertCircle","color":"blue","route":"/admin/traffic/bay-area-511"},
  "projects": {
    "label": "Projects",
    "icon": "FolderOpen",
    "color": "green",
    "route": "/admin/projects"
  },
  "threed": {
    "label": "ThreeD",
    "icon": "Box",
    "color": "green",
    "route": "/admin/threed"
  },
  "models": {
    "label": "Models",
    "icon": "Box",
    "color": "blue",
    "route": "/admin/threed/models"
  },
  "modelFiles": {
    "label": "Model Files",
    "icon": "FolderOpen",
    "color": "green",
    "route": "/admin/threed/model-files"
  },
  "modelCategories": {
    "label": "Model Categories",
    "icon": "FolderTree",
    "color": "green",
    "route": "/admin/threed/model-categories"
  },
  "modelTextures": {
    "label": "Textures",
    "icon": "Image",
    "color": "green",
    "route": "/admin/threed/model-textures"
  },
  "modelBuilder": {
    "label": "Model Builder",
    "icon": "Hammer",
    "color": "green",
    "route": "/admin/threed/models/builder"
  },
  "assemblyGroups": {
    "label": "Assembly Groups",
    "icon": "Boxes",
    "color": "green",
    "route": "/admin/threed/assembly-groups"
  },
  "animations": {
    "label": "Animations",
    "icon": "Clapperboard",
    "color": "blue",
    "route": "/admin/threed/animations"
  },
  "animationSlots": {
    "label": "Animation Slots",
    "icon": "Clapperboard",
    "color": "blue",
    "route": "/admin/threed/animation-slots"
  },
  "animationCategories": {
    "label": "Animation Categories",
    "icon": "FolderTree",
    "color": "blue",
    "route": "/admin/threed/animation-categories"
  },
  "designs": {
    "label": "Designs",
    "icon": "Building2",
    "color": "green",
    "route": "/admin/threed/designs"
  },
  "characters": {
    "label": "Characters",
    "icon": "Users",
    "color": "purple",
    "route": "/admin/threed/characters"
  },
  "plants": {
    "label": "Plants",
    "icon": "Sprout",
    "color": "green",
    "route": "/admin/threed/plants"
  },
  "beds": {
    "label": "Beds",
    "icon": "Cuboid",
    "color": "amber",
    "route": "/admin/threed/beds"
  },
  "plantings": {
    "label": "Plantings",
    "icon": "Bean",
    "color": "brown",
    "route": "/admin/threed/plantings"
  },
  "scenarios": {
    "label": "Scenarios",
    "icon": "BookOpen",
    "color": "green",
    "route": "/admin/threed/scenarios"
  },
  "simulations": {
    "label": "Simulations",
    "icon": "FlaskConical",
    "color": "green",
    "route": "/admin/threed/simulations"
  },
  "simulationResults": {
    "label": "Simulation Results",
    "icon": "ClipboardList",
    "color": "green",
    "route": "/admin/threed/simulation-results"
  },
  "layers": {
    "label": "Layers",
    "icon": "Layers",
    "color": "cyan",
    "route": "/admin/threed/layers"
  },
  "tasks": {
    "label": "Tasks",
    "icon": "ListTodo",
    "color": "muted",
    "route": "/admin/threed/tasks"
  },
  "waterings": {
    "label": "Waterings",
    "icon": "Droplets",
    "color": "blue",
    "route": "/admin/threed/watering-schedules"
  },
  "harvests": {
    "label": "Harvests",
    "icon": "Package",
    "color": "orange",
    "route": "/admin/threed/harvests"
  },
  "farmbots": {
    "label": "FarmBots",
    "icon": "Bot",
    "color": "slate",
    "route": "/admin/threed/farmbots"
  },
  "multimedia": {
    "label": "Multimedia",
    "icon": "Music",
    "color": "green",
    "route": "/admin/multimedia"
  },
  "albums": {
    "label": "Albums",
    "icon": "Music",
    "color": "blue",
    "route": "/admin/multimedia/albums"
  },
  "tracks": {
    "label": "Tracks",
    "icon": "Music2",
    "color": "blue",
    "route": "/admin/multimedia/tracks"
  },
  "lyrics": {
    "label": "Lyrics",
    "icon": "FileText",
    "color": "blue",
    "route": "/admin/multimedia/lyrics"
  },
  "media": {
    "label": "Media",
    "icon": "Image",
    "color": "blue",
    "route": "/admin/multimedia/media"
  },
  "links": {
    "label": "Links",
    "icon": "Link2",
    "color": "blue",
    "route": "/admin/multimedia/links"
  },
  "speech": {
    "label": "Speech",
    "icon": "MicVocal",
    "color": "blue",
    "route": "/admin/multimedia/speech"
  },
  "traffic": {
    "label": "Traffic",
    "icon": "Car",
    "color": "green",
    "route": "/admin/traffic"
  },
  users: {label:"Users",icon:"Users",color:"blue",route:"/admin/users"},
  learn: {label:"Learn",icon:"BookOpen",color:"green",route:"/admin/learn"}
} as const;
export type ModuleKey = keyof typeof moduleDefinitions;
export const moduleKeys = Object.keys(moduleDefinitions) as ModuleKey[];
const colorNames = Object.keys(moduleColors) as [keyof typeof moduleColors, ...Array<keyof typeof moduleColors>];
export const moduleStyleSchema = z.object({color:z.enum(colorNames),icon:z.enum(moduleIconNames)}).strict();
export type ModuleStyle = z.infer<typeof moduleStyleSchema>;
export const moduleAppearanceSchema = z.object(Object.fromEntries(moduleKeys.map(key => [key,moduleStyleSchema])) as Record<ModuleKey,typeof moduleStyleSchema>).strict();
export const moduleAppearanceSnapshotSchema = z.object({styles:moduleAppearanceSchema,revision:z.string().uuid().nullable()}).strict();
export type ModuleAppearanceSnapshot = z.infer<typeof moduleAppearanceSnapshotSchema>;
export function defaultModuleAppearance(): ModuleAppearanceSnapshot {
 return {styles:Object.fromEntries(moduleKeys.map(key=>[key,{color:moduleDefinitions[key].color,icon:moduleDefinitions[key].icon}])) as ModuleAppearanceSnapshot['styles'],revision:null};
}
export function moduleForPath(path: string): ModuleKey | undefined {
 if (path === '/learn' || path.startsWith('/learn/')) return 'learn';
 return [...moduleKeys].sort((a,b)=>moduleDefinitions[b].route.length-moduleDefinitions[a].route.length).find(key=>path===moduleDefinitions[key].route || path.startsWith(moduleDefinitions[key].route+'/'));
}

// Read compatibility only: 41-Module snapshots predate Learn; 40 predate Users too.
// Each historical shape is complete and strict. Writes require all current Modules.
export function readStoredModuleAppearance(value:unknown):ModuleAppearanceSnapshot {
 const previous=moduleAppearanceSnapshotSchema.extend({styles:moduleAppearanceSchema.omit({learn:true})}).safeParse(value);
 if(previous.success) return moduleAppearanceSnapshotSchema.parse({...previous.data,styles:{...previous.data.styles,learn:defaultModuleAppearance().styles.learn}});
 const legacy=moduleAppearanceSnapshotSchema.extend({styles:moduleAppearanceSchema.omit({users:true,learn:true})}).safeParse(value);
 if(legacy.success) {
  const defaults=defaultModuleAppearance().styles;
  return moduleAppearanceSnapshotSchema.parse({...legacy.data,styles:{...legacy.data.styles,users:defaults.users,learn:defaults.learn}});
 }
 return moduleAppearanceSnapshotSchema.parse(value);
}
