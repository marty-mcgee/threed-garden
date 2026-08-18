import Link from 'next/link';
import {
  Apple,
  Bot,
  Box,
  Clapperboard,
  ClipboardList,
  Droplets,
  FolderOpen,
  Layers3,
  Package,
  Sprout,
  Trees,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: 'Plants',
    description: 'Manage the plant library and care information.',
    href: '/admin/threed/plants',
    icon: Sprout,
  },
  {
    title: 'Plantings',
    description: 'Place plants in beds and track their growth.',
    href: '/admin/threed/plantings',
    icon: Trees,
  },
  {
    title: 'Garden Beds',
    description: 'Configure garden layouts and 3D positions.',
    href: '/admin/threed/beds',
    icon: Box,
  },
  {
    title: 'Characters',
    description: 'Manage characters, models, movement, and actions.',
    href: '/admin/threed/characters',
    icon: UserRound,
  },
  {
    title: 'Garden Tasks',
    description: 'Create and manage garden work items.',
    href: '/admin/threed/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Watering Schedules',
    description: 'Manage watering plans and historical activity.',
    href: '/admin/threed/watering-schedules',
    icon: Droplets,
  },
  {
    title: 'Harvests',
    description: 'Review and manage manual and World Action harvests.',
    href: '/admin/threed/harvests',
    icon: Apple,
  },
  {
    title: 'FarmBots',
    description: 'Configure automated garden devices.',
    href: '/admin/threed/farmbots',
    icon: Bot,
  },
  {
    title: '3D Models',
    description: 'Manage the reusable 3D model library.',
    href: '/admin/threed/models',
    icon: Package,
  },
  {
    title: 'Model Files',
    description: 'Manage model files, textures, and supporting media.',
    href: '/admin/threed/model-files',
    icon: FolderOpen,
  },
  {
    title: 'Model Animations',
    description: 'Map embedded and external clips to semantic actions.',
    href: '/admin/threed/model-animations',
    icon: Clapperboard,
  },
  {
    title: 'Layers',
    description: 'Organize runtime map and scene content into layers.',
    href: '/admin/threed/layers',
    icon: Layers3,
  },
] as const;

export default function ThreeDAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ThreeD Module</h1>
        <p className="text-muted-foreground">
          Manage garden assets, characters, automation, and 3D presentation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group no-underline">
            <Card className="h-full transition-colors group-hover:border-primary group-hover:bg-accent/40">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
