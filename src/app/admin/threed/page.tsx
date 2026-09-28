import Link from 'next/link';
import {
  Apple,
  Bot,
  Box,
  BookOpen,
  Clapperboard,
  ClipboardList,
  Droplets,
  FolderOpen,
  Layers3,
  Images,
  Package,
  Sprout,
  Trees,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

const iconColors = {
  garden: 'bg-emerald-500/10 text-emerald-700 group-hover:bg-emerald-500/20 dark:text-emerald-300',
  beds: 'bg-amber-500/10 text-amber-700 group-hover:bg-amber-500/20 dark:text-amber-300',
  characters: 'bg-violet-500/10 text-violet-700 group-hover:bg-violet-500/20 dark:text-violet-300',
  work: 'bg-orange-500/10 text-orange-700 group-hover:bg-orange-500/20 dark:text-orange-300',
  water: 'bg-sky-500/10 text-sky-700 group-hover:bg-sky-500/20 dark:text-sky-300',
  harvest: 'bg-rose-500/10 text-rose-700 group-hover:bg-rose-500/20 dark:text-rose-300',
  automation: 'bg-cyan-500/10 text-cyan-700 group-hover:bg-cyan-500/20 dark:text-cyan-300',
  assets: 'bg-blue-500/10 text-blue-700 group-hover:bg-blue-500/20 dark:text-blue-300',
  animation: 'bg-fuchsia-500/10 text-fuchsia-700 group-hover:bg-fuchsia-500/20 dark:text-fuchsia-300',
} as const;

const sections = [
  {
    title: 'Plants',
    group: 'garden',
    iconColor: iconColors.garden,
    description: 'Manage the plant library and care information.',
    href: '/admin/threed/plants',
    icon: Sprout,
  },
  {
    title: 'Plantings',
    group: 'garden',
    iconColor: iconColors.garden,
    description: 'Place plants in beds and track their growth.',
    href: '/admin/threed/plantings',
    icon: Trees,
  },
  {
    title: 'Garden Beds',
    group: 'garden',
    iconColor: iconColors.beds,
    description: 'Configure garden layouts and 3D positions.',
    href: '/admin/threed/beds',
    icon: Box,
  },
  {
    title: 'Characters',
    group: 'assets',
    iconColor: iconColors.characters,
    description: 'Manage characters, models, movement, and actions.',
    href: '/admin/threed/characters',
    icon: UserRound,
  },
  {
    title: 'Garden Tasks',
    group: 'automation',
    iconColor: iconColors.work,
    description: 'Create and manage garden work items.',
    href: '/admin/threed/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Watering Schedules',
    group: 'automation',
    iconColor: iconColors.water,
    description: 'Manage watering plans and historical activity.',
    href: '/admin/threed/watering-schedules',
    icon: Droplets,
  },
  {
    title: 'Harvests',
    group: 'garden',
    iconColor: iconColors.harvest,
    description: 'Review and manage manual and World Action harvests.',
    href: '/admin/threed/harvests',
    icon: Apple,
  },
  {
    title: 'FarmBots',
    group: 'automation',
    iconColor: iconColors.automation,
    description: 'Configure automated garden devices.',
    href: '/admin/threed/farmbots',
    icon: Bot,
  },
  {
    title: 'Models',
    group: 'assets',
    iconColor: iconColors.assets,
    description: 'Manage the reusable 3D model library.',
    href: '/admin/threed/models',
    icon: Package,
  },
  {
    title: 'Model Files',
    group: 'assets',
    iconColor: iconColors.assets,
    description: 'Manage model files, textures, and supporting media.',
    href: '/admin/threed/model-files',
    icon: FolderOpen,
  },
  {
    title: 'Animations Library',
    group: 'assets',
    iconColor: iconColors.animation,
    description: 'Manage reusable animation assets independently of Models and Characters.',
    href: '/admin/threed/animations',
    icon: Clapperboard,
  },
  {
    title: 'Model Textures',
    group: 'assets',
    iconColor: iconColors.assets,
    description: 'Manage reusable master Texture files for Model material assignments.',
    href: '/admin/threed/model-textures',
    icon: Images,
  },
  {
    title: 'Scenarios',
    group: 'assets',
    iconColor: iconColors.assets,
    description: 'Create and manage Project-scoped ThreeD Scenario definitions.',
    href: '/admin/threed/scenarios',
    icon: BookOpen,
  },
  {
    title: 'Layers',
    group: 'assets',
    iconColor: iconColors.assets,
    description: 'Organize runtime map and scene content into layers.',
    href: '/admin/threed/layers',
    icon: Layers3,
  },
] as const;

const groups = [
  { key: 'assets', title: 'Assets', icon: Package, iconColor: 'text-blue-600 dark:text-blue-300' },
  { key: 'garden', title: 'Garden', icon: Sprout, iconColor: 'text-emerald-600 dark:text-emerald-300' },
  { key: 'automation', title: 'Automation', icon: Bot, iconColor: 'text-cyan-600 dark:text-cyan-300' },
] as const;

export default function ThreeDAdminPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ThreeD Modules</h1>
        <p className="text-muted-foreground">
          Manage garden assets, characters, automation, and 3D presentation.
        </p>
      </div>

      {groups.map(({ key, title: groupTitle, icon: GroupIcon, iconColor }) => (
        <section key={key} aria-labelledby={`${key}-heading`} className="space-y-2">
          <h2 id={`${key}-heading`} className="flex items-center gap-2 border-b pb-2 pl-2 text-lg font-semibold tracking-tight">
            <GroupIcon aria-hidden="true" className={`h-4 w-4 ${iconColor}`} />
            {groupTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.filter((section) => section.group === key).map(({ title, description, href, icon: Icon, iconColor }) => (
              <Link key={href} href={href} className="group block rounded-lg no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <Card className="h-full gap-0 transition-[border-color,background-color,box-shadow] group-hover:border-primary/60 group-hover:bg-accent/30 group-hover:shadow-sm group-focus-visible:border-primary">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={`shrink-0 rounded-lg p-2.5 transition-colors ${iconColor}`}>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
